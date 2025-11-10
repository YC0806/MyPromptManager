"""API regression script that simulates user traffic based on doc/API_REFERENCE.md."""

from __future__ import annotations

import argparse
import json
import re
import sys
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Dict, List, Union

import requests


PLACEHOLDER_PATTERN = re.compile(r"{{\s*([\w\.]+)\s*}}")
TYPE_MAPPING = {
    "list": list,
    "dict": dict,
    "str": str,
    "int": int,
    "float": (int, float),
    "bool": bool,
    "none": type(None),
}


class TestFailure(Exception):
    """Raised when an assertion fails."""


def load_test_suite(path: Path) -> Dict[str, Any]:
    with path.open("r", encoding="utf-8") as fh:
        return json.load(fh)


def now_strings() -> Dict[str, str]:
    current = datetime.now(timezone.utc)
    return {
        "run_id": current.strftime("%Y%m%d%H%M%S"),
        "iso_timestamp": current.replace(microsecond=0).isoformat().replace("+00:00", "Z"),
    }


def interpolate(value: Any, context: Dict[str, Any]) -> Any:
    if isinstance(value, str):
        def replacer(match: re.Match[str]) -> str:
            key = match.group(1)
            if key not in context:
                raise TestFailure(f"Undefined placeholder '{key}' in string '{value}'")
            return str(context[key])

        return PLACEHOLDER_PATTERN.sub(replacer, value)

    if isinstance(value, list):
        return [interpolate(item, context) for item in value]

    if isinstance(value, dict):
        return {k: interpolate(v, context) for k, v in value.items()}

    return value


def build_url(base_url: str, path: str) -> str:
    return f"{base_url.rstrip('/')}/{path.lstrip('/')}"


def resolve_path(payload: Any, path: str) -> Any:
    if payload is None:
        raise TestFailure(f"Cannot resolve '{path}' on empty payload")

    cursor = payload
    if not path:
        return cursor

    for part in path.split("."):
        if isinstance(cursor, list):
            try:
                index = int(part)
            except ValueError as exc:
                raise TestFailure(f"Path '{path}' has non-integer index '{part}'") from exc
            try:
                cursor = cursor[index]
            except IndexError as exc:
                raise TestFailure(f"Index {index} is out of range for '{path}'") from exc
        elif isinstance(cursor, dict):
            if part not in cursor:
                raise TestFailure(f"Key '{part}' missing while resolving '{path}'")
            cursor = cursor[part]
        else:
            raise TestFailure(f"Cannot traverse '{part}' in path '{path}' on non-container value")

    return cursor


def run_assertion(assertion: Dict[str, Any], response_json: Any) -> None:
    a_type = assertion["type"]
    path = assertion.get("path", "")

    if a_type == "field_exists":
        resolve_path(response_json, path)
        return

    if a_type == "field_equals":
        actual = resolve_path(response_json, path)
        if actual != assertion["value"]:
            raise TestFailure(f"Expected '{path}' == {assertion['value']!r}, got {actual!r}")
        return

    if a_type == "field_in":
        actual = resolve_path(response_json, path)
        if actual not in assertion["values"]:
            raise TestFailure(f"Expected '{path}' in {assertion['values']!r}, got {actual!r}")
        return

    if a_type == "field_is_type":
        actual = resolve_path(response_json, path)
        expected_type = assertion["value"]
        expected_cls = TYPE_MAPPING.get(expected_type)
        if expected_cls is None:
            raise TestFailure(f"Unknown type alias '{expected_type}'")
        if not isinstance(actual, expected_cls):
            raise TestFailure(f"Expected '{path}' to be {expected_type}, got {type(actual).__name__}")
        return

    target = resolve_path(response_json, path) if path else response_json

    if a_type == "length_gte":
        if len(target) < assertion["value"]:
            raise TestFailure(f"Expected len('{path}') >= {assertion['value']}, got {len(target)}")
        return

    if a_type == "length_equals":
        if len(target) != assertion["value"]:
            raise TestFailure(f"Expected len('{path}') == {assertion['value']}, got {len(target)}")
        return

    raise TestFailure(f"Unknown assertion type '{a_type}'")


def save_values(save_map: Dict[str, str], response_json: Any, context: Dict[str, Any]) -> None:
    for alias, path in save_map.items():
        context[alias] = resolve_path(response_json, path)


def execute_test(
    session: requests.Session,
    base_url: str,
    test_spec: Dict[str, Any],
    context: Dict[str, Any],
    timeout: float,
) -> None:
    method = test_spec["method"].upper()
    path = interpolate(test_spec["path"], context)
    url = build_url(base_url, path)
    params = interpolate(test_spec.get("params") or {}, context)
    body = interpolate(test_spec.get("body"), context) if "body" in test_spec else None
    headers = interpolate(test_spec.get("headers") or {}, context)

    print(f"    Request: {method} {url}")
    if params:
        print(f"    Query: {json.dumps(params, ensure_ascii=False)}")
    if body is not None:
        print(f"    Payload: {json.dumps(body, ensure_ascii=False)}")
    else:
        print("    Payload: <none>")

    response = session.request(
        method=method,
        url=url,
        params=params,
        json=body,
        headers=headers or None,
        timeout=timeout,
    )

    expected_status = test_spec["expected_status"]
    statuses = expected_status if isinstance(expected_status, list) else [expected_status]
    if response.status_code not in statuses:
        raise TestFailure(
            f"Expected status {statuses}, got {response.status_code} with body: {response.text}"
        )

    response_json: Union[Dict[str, Any], List[Any], None] = None
    if response.content:
        try:
            response_json = response.json()
        except ValueError:
            response_json = None

    assertions = test_spec.get("assertions") or []
    if assertions and response_json is None:
        raise TestFailure("Response body is not JSON but assertions were provided")

    for assertion in assertions:
        prepared = interpolate(assertion, context)
        run_assertion(prepared, response_json)

    if "save" in test_spec:
        if response_json is None:
            raise TestFailure("Cannot save values from non-JSON response")
        save_values(test_spec["save"], response_json, context)


def run_suite(data_path: Path, base_url: str | None, timeout: float) -> int:
    suite = load_test_suite(data_path)
    resolved_base = base_url or suite["base_url"]

    context: Dict[str, Any] = {**now_strings(), **suite.get("variables", {})}

    session = requests.Session()
    session.headers.update(suite.get("default_headers") or {})

    results = []
    tests = suite["tests"]
    for index, test_spec in enumerate(tests, 1):
        name = test_spec["name"]
        print(f"[{index}/{len(tests)}] {name}")
        try:
            execute_test(session, resolved_base, test_spec, context, timeout)
        except TestFailure as exc:
            print("    Result: FAILED")
            results.append((name, False, str(exc)))
        except requests.RequestException as exc:
            print("    Result: FAILED")
            results.append((name, False, f"Network error: {exc}"))
        else:
            print("    Result: ok")
            results.append((name, True, ""))

    failed = [result for result in results if not result[1]]
    print("\nSummary")
    for name, success, message in results:
        status = "PASS" if success else "FAIL"
        detail = f": {message}" if message else ""
        print(f"- {status:<4} {name}{detail}")

    return 0 if not failed else 1


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Simulate user API requests defined in tests/api/api_test_cases.json",
    )
    parser.add_argument(
        "-d",
        "--data",
        default="tests/api/api_test_cases.json",
        help="Path to the JSON file that defines test cases",
    )
    parser.add_argument(
        "--base-url",
        default=None,
        help="Override the base URL defined in the JSON file",
    )
    parser.add_argument(
        "--timeout",
        type=float,
        default=10.0,
        help="Timeout in seconds for each HTTP request",
    )
    return parser.parse_args()


def main() -> None:
    args = parse_args()
    exit_code = run_suite(Path(args.data), args.base_url, args.timeout)
    sys.exit(exit_code)


if __name__ == "__main__":
    main()
