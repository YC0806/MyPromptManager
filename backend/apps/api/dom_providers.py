"""Static DOM provider configuration store exposed via the API."""
from __future__ import annotations

import hashlib
import json
import re
from pathlib import Path
from typing import Dict, Iterable, List, Optional

from django.conf import settings
from jsonschema import Draft7Validator

SCHEMA_PATH = Path(settings.SCHEMA_DIR) / "dom_provider_config.schema.json"
CONFIG_PATH = Path(__file__).with_name("dom_provider_configs.json")


class DomProviderStore:
    """Loads DOM provider configs and serves filtered snapshots."""

    def __init__(self) -> None:
        self._schema = self._load_schema()
        self._validator = Draft7Validator(self._schema)
        self._configs = self._load_configs()
        self.version = self._compute_version(self._configs)

    def _load_schema(self) -> Dict:
        with SCHEMA_PATH.open("r", encoding="utf-8") as fh:
            return json.load(fh)

    def _load_configs(self) -> List[Dict]:
        with CONFIG_PATH.open("r", encoding="utf-8") as fh:
            configs = json.load(fh)

        for config in configs:
            self._validator.validate(config)
        return configs

    def _compute_version(self, configs: Iterable[Dict]) -> str:
        serialized = json.dumps(list(configs), sort_keys=True, ensure_ascii=False)
        return hashlib.sha256(serialized.encode("utf-8")).hexdigest()[:12]

    def all_configs(self) -> List[Dict]:
        return list(self._configs)

    def filter_configs(self, host: Optional[str] = None, path: Optional[str] = None) -> List[Dict]:
        return [cfg for cfg in self._configs if self._matches_host(cfg, host) and self._matches_path(cfg, path)]

    def get_config(self, provider_id: str) -> Optional[Dict]:
        for cfg in self._configs:
            if cfg.get("id", "").lower() == provider_id.lower():
                return cfg
        return None

    @staticmethod
    def _matches_host(config: Dict, host: Optional[str]) -> bool:
        if not host:
            return True

        patterns = config.get("urlPatterns") or []
        return any(_pattern_matches(pattern, host) for pattern in patterns)

    @staticmethod
    def _matches_path(config: Dict, path: Optional[str]) -> bool:
        if not path:
            return True

        pattern = config.get("conversationIdPattern")
        if not pattern:
            return True

        return _pattern_matches(pattern, path)


def _pattern_matches(pattern: str, candidate: str) -> bool:
    """Try regex first, then fallback to case-insensitive substring."""
    if not pattern:
        return False

    regex = _compile_pattern(pattern)
    if regex:
        return regex.search(candidate) is not None

    return pattern.lower() in candidate.lower()


def _compile_pattern(pattern: str) -> Optional[re.Pattern[str]]:
    try:
        if pattern.startswith("/") and pattern.endswith("/") and len(pattern) > 2:
            return re.compile(pattern[1:-1], re.IGNORECASE)
        return re.compile(pattern, re.IGNORECASE)
    except re.error:
        return None


dom_provider_store = DomProviderStore()
