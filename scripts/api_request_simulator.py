#!/usr/bin/env python3
"""
API 请求模拟脚本

作用：
1. 读取本地 JSON 测试数据
2. 依次对 prompt/template/chat 调用创建、更新、发布、删除相关接口
3. 输出每一步的状态，便于快速验证后端 API
"""
from __future__ import annotations

import argparse
import json
from pathlib import Path
from typing import Any, Dict, List, Optional, Tuple

try:
    import requests
    from requests import Response
except ModuleNotFoundError as exc:  # pragma: no cover - import guard
    raise SystemExit(
        "请先安装 requests 库再运行此脚本：pip install requests"
    ) from exc


OPERATIONS = ("create", "update", "publish", "delete")
RESOURCE_TYPES = ("prompts", "templates", "chats")


class ApiRequestSimulator:
    """负责读取测试数据并依次调用 API。"""

    def __init__(
        self,
        base_url: str,
        timeout: int = 10,
        operations: Optional[List[str]] = None,
    ) -> None:
        self.base_url = base_url.rstrip("/")
        self.timeout = timeout
        self.operations = operations or list(OPERATIONS)
        self.session = requests.Session()
        self.results: List[Dict[str, Any]] = []
        self.failed = False

    def run(self, payload: Dict[str, Any], type_filter: Optional[List[str]] = None) -> None:
        """遍历 JSON 数据并执行配置的操作。"""
        for collection in RESOURCE_TYPES:
            if type_filter and collection not in type_filter:
                continue

            items = payload.get(collection, [])
            for item in items:
                item_id = item["id"]
                print(f"\n==> 开始处理 {collection[:-1]} {item_id}")
                state: Dict[str, Any] = {}

                for operation in self.operations:
                    handler = getattr(self, f"_handle_{operation}", None)
                    if not handler:
                        continue
                    handler(collection, item, state)

        self._print_summary()

    # ------------------------------------------------------------------ #
    # 操作处理函数
    # ------------------------------------------------------------------ #
    def _handle_create(self, resource_type: str, item: Dict[str, Any], state: Dict[str, Any]) -> None:
        payload = item.get("create")
        if not payload:
            self._record(resource_type, item["id"], "create", "skipped", "缺少 create 配置")
            return

        content = self._compose_content(resource_type, payload, for_raw=False)
        url = self._simple_url(resource_type, item["id"], "save")
        body: Dict[str, Any] = {
            "content": content,
            "message": payload.get("message", "create via api script"),
            "idempotency_key": payload.get("idempotency_key", None),
        }

        resp = self._request("POST", url, json=body)
        if resp is None:
            self._record(resource_type, item["id"], "create", "failed", "HTTP 请求失败")
            return

        if resp.status_code >= 200 and resp.status_code < 300:
            data = self._safe_json(resp)
            state["draft_sha"] = data.get("sha")
            state["ui_branch"] = data.get("ui_branch")
            detail = f"sha={state.get('draft_sha')} branch={state.get('ui_branch')}"
            self._record(resource_type, item["id"], "create", "success", detail, resp.status_code)
        else:
            self.failed = True
            self._record(
                resource_type,
                item["id"],
                "create",
                "failed",
                f"状态码 {resp.status_code} / {resp.text}",
                resp.status_code,
            )

    def _handle_update(self, resource_type: str, item: Dict[str, Any], state: Dict[str, Any]) -> None:
        payload = item.get("update")
        if not payload:
            self._record(resource_type, item["id"], "update", "skipped", "缺少 update 配置")
            return

        raw_content, etag = self._fetch_raw(resource_type, item["id"], payload.get("ref", "main"))
        if raw_content is None:
            self._record(resource_type, item["id"], "update", "failed", "读取原始内容失败")
            self.failed = True
            return

        new_content = self._compose_content(resource_type, payload, for_raw=True)
        headers = {}
        if etag:
            headers["If-Match"] = etag

        params = {}
        if payload.get("message"):
            params["message"] = payload["message"]

        url = self._detail_url(resource_type, item["id"], "raw")
        resp = self._request("PUT", url, data=new_content.encode("utf-8"), headers=headers, params=params)
        if resp is None:
            self._record(resource_type, item["id"], "update", "failed", "HTTP 请求失败")
            self.failed = True
            return

        if resp.status_code >= 200 and resp.status_code < 300:
            self._record(resource_type, item["id"], "update", "success", "内容已写入 main", resp.status_code)
        else:
            self.failed = True
            self._record(
                resource_type,
                item["id"],
                "update",
                "failed",
                f"状态码 {resp.status_code} / {resp.text}",
                resp.status_code,
            )

    def _handle_publish(self, resource_type: str, item: Dict[str, Any], state: Dict[str, Any]) -> None:
        payload = item.get("publish")
        if not payload:
            self._record(resource_type, item["id"], "publish", "skipped", "缺少 publish 配置")
            return

        base_sha = state.get("draft_sha") or payload.get("base_sha")
        if not base_sha:
            self._record(resource_type, item["id"], "publish", "failed", "缺少 base_sha")
            self.failed = True
            return

        url = self._simple_url(resource_type, item["id"], "publish")
        body = {
            "base_sha": base_sha,
            "channel": payload.get("channel", "prod"),
            "version": payload.get("version", "auto"),
            "notes": payload.get("notes", ""),
            "idempotency_key": payload.get("idempotency_key"),
        }

        resp = self._request("POST", url, json=body)
        if resp is None:
            self._record(resource_type, item["id"], "publish", "failed", "HTTP 请求失败")
            self.failed = True
            return

        if resp.status_code >= 200 and resp.status_code < 300:
            data = self._safe_json(resp)
            detail = f"version={data.get('version')} channel={data.get('channel')}"
            self._record(resource_type, item["id"], "publish", "success", detail, resp.status_code)
        else:
            self.failed = True
            self._record(
                resource_type,
                item["id"],
                "publish",
                "failed",
                f"状态码 {resp.status_code} / {resp.text}",
                resp.status_code,
            )

    def _handle_delete(self, resource_type: str, item: Dict[str, Any], state: Dict[str, Any]) -> None:
        payload = item.get("delete", {})
        raw_content, etag = self._fetch_raw(resource_type, item["id"], "main")
        if raw_content is None:
            self._record(resource_type, item["id"], "delete", "failed", "无法读取资源内容")
            self.failed = True
            return

        url = self._detail_url(resource_type, item["id"], "raw")
        headers = {}
        if etag:
            headers["If-Match"] = etag

        params = {}
        if payload.get("message"):
            params["message"] = payload["message"]

        resp = self._request("DELETE", url, headers=headers, params=params)
        if resp is None:
            self._record(resource_type, item["id"], "delete", "failed", "HTTP 请求失败")
            self.failed = True
            return

        if resp.status_code == 405:
            # 当前后端尚未实现 DELETE，标记为跳过
            self._record(
                resource_type,
                item["id"],
                "delete",
                "skipped",
                "后端未实现 DELETE 接口 (405)",
                resp.status_code,
            )
            return

        if resp.status_code >= 200 and resp.status_code < 300:
            self._record(resource_type, item["id"], "delete", "success", "资源删除请求完成", resp.status_code)
        else:
            self.failed = True
            self._record(
                resource_type,
                item["id"],
                "delete",
                "failed",
                f"状态码 {resp.status_code} / {resp.text}",
                resp.status_code,
            )

    # ------------------------------------------------------------------ #
    # HTTP & 工具函数
    # ------------------------------------------------------------------ #
    def _request(self, method: str, url: str, **kwargs: Any) -> Optional[Response]:
        """统一封装 HTTP 请求，带基础错误处理。"""
        try:
            return self.session.request(method, url, timeout=self.timeout, **kwargs)
        except requests.RequestException as exc:
            print(f"[错误] 请求 {method} {url} 失败: {exc}")
            return None

    def _fetch_raw(self, resource_type: str, item_id: str, ref: str) -> Tuple[Optional[str], Optional[str]]:
        """获取原始内容与 ETag。"""
        url = self._detail_url(resource_type, item_id, "raw")
        resp = self._request("GET", url, params={"ref": ref})
        if resp is None or resp.status_code >= 400:
            if resp is not None:
                print(f"[错误] 拉取 {resource_type} {item_id} 失败: {resp.status_code} {resp.text}")
            return None, None
        return resp.text, resp.headers.get("ETag")

    def _compose_content(
        self,
        resource_type: str,
        payload: Dict[str, Any],
        *,
        for_raw: bool,
    ) -> Any:
        """根据资源类型组装 content 字段。"""
        if resource_type == "chats":
            content = payload.get("content", {})
            if for_raw:
                return json.dumps(content, ensure_ascii=False, indent=2)
            return content

        if "content" in payload and isinstance(payload["content"], str):
            return payload["content"]

        metadata = payload.get("metadata")
        body_lines = payload.get("body", [])
        if not metadata:
            raise ValueError("缺少 metadata，无法生成 Markdown 内容")

        frontmatter = json.dumps(metadata, ensure_ascii=False, indent=2)
        body_text = "\n".join(body_lines)
        body_text = body_text.rstrip() + "\n" if body_text else ""
        markdown = f"---\n{frontmatter}\n---\n\n{body_text}"
        if for_raw:
            return markdown
        return markdown

    def _simple_url(self, resource_type: str, item_id: str, action: str) -> str:
        return f"{self.base_url}/v1/simple/{resource_type}/{item_id}/{action}"

    def _detail_url(self, resource_type: str, item_id: str, action: str) -> str:
        return f"{self.base_url}/v1/detail/{resource_type}/{item_id}/{action}"

    def _safe_json(self, resp: Response) -> Dict[str, Any]:
        try:
            return resp.json()
        except ValueError:
            return {}

    def _record(
        self,
        resource_type: str,
        item_id: str,
        operation: str,
        status: str,
        message: str,
        status_code: Optional[int] = None,
    ) -> None:
        entry = {
            "resource_type": resource_type,
            "resource_id": item_id,
            "operation": operation,
            "status": status,
            "status_code": status_code,
            "message": message,
        }
        self.results.append(entry)
        prefix = {
            "success": "[成功]",
            "failed": "[失败]",
            "skipped": "[跳过]",
        }.get(status, "[信息]")
        code_part = f" (HTTP {status_code})" if status_code else ""
        print(f"{prefix} {resource_type[:-1]} {item_id} {operation}{code_part}: {message}")

    def _print_summary(self) -> None:
        print("\n================ 测试摘要 ================")
        for entry in self.results:
            code_part = f"HTTP {entry['status_code']}" if entry.get("status_code") else "-"
            print(
                f"- {entry['resource_type'][:-1]} {entry['resource_id']} "
                f"{entry['operation']}: {entry['status']} ({code_part}) -> {entry['message']}"
            )
        print("=========================================")
        if self.failed:
            print("部分操作失败，请根据日志排查原因。")
        else:
            print("所有操作执行完毕。")


def load_payload(path: Path) -> Dict[str, Any]:
    if not path.exists():
        raise FileNotFoundError(f"找不到数据文件: {path}")

    with path.open("r", encoding="utf-8") as fp:
        return json.load(fp)


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="模拟用户对 Prompt API 的完整操作流程")
    parser.add_argument(
        "--base-url",
        default="http://127.0.0.1:8000",
        help="后端服务地址（默认: http://127.0.0.1:8000）",
    )
    default_data_path = Path(__file__).with_name("api_test_data.json")
    parser.add_argument(
        "--data-file",
        default=str(default_data_path),
        help=f"测试数据 JSON 文件路径（默认: {default_data_path}）",
    )
    parser.add_argument(
        "--operations",
        nargs="+",
        choices=OPERATIONS,
        default=list(OPERATIONS),
        help="指定需要执行的操作（默认全选）",
    )
    parser.add_argument(
        "--types",
        nargs="+",
        choices=RESOURCE_TYPES,
        help="仅针对指定类型运行（prompts/templates/chats）",
    )
    parser.add_argument(
        "--timeout",
        type=int,
        default=10,
        help="HTTP 请求超时时间，单位秒（默认 10）",
    )
    return parser.parse_args()


def main() -> None:
    args = parse_args()
    payload = load_payload(Path(args.data_file))

    simulator = ApiRequestSimulator(
        base_url=args.base_url,
        timeout=args.timeout,
        operations=args.operations,
    )
    simulator.run(payload, type_filter=args.types)

    if simulator.failed:
        raise SystemExit(1)


if __name__ == "__main__":
    main()
