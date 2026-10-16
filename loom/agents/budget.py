"""Budget guard and call ledger (D-115). A call whose worst case could cross a cap is never sent; real usage is
booked after it returns. Caps: the whole run, each provider, and each task."""
from __future__ import annotations

import json
import threading
import time
from pathlib import Path

from .llm import registry as R
from .llm.types import BudgetExceeded, Usage


class Budget:
    def __init__(self, run_usd: float = 5.0, provider_usd: dict | None = None, ledger: Path | None = None):
        self.run_usd = float(run_usd)
        self.provider_usd = dict(provider_usd or {})
        self.spent = 0.0
        self.by_provider: dict[str, float] = {}
        self.calls = 0
        self.ledger = Path(ledger) if ledger else None
        self._lock = threading.Lock()
        self.dead: set = set()        # providers whose account is out of credit this run (BillingError)

    def check(self, m: dict, prompt_tokens: int, max_tokens: int, task_left: float | None = None, cached_tokens: int = 0):
        worst = R.worst_case(m, prompt_tokens, max_tokens, cached_tokens)
        with self._lock:
            left = self.run_usd - self.spent
            if worst > left:
                raise BudgetExceeded(f"run budget: worst case ${worst:.4f} > ${left:.4f} left of ${self.run_usd:.2f}")
            cap = self.provider_usd.get(m["provider"])
            if cap is not None and worst > cap - self.by_provider.get(m["provider"], 0.0):
                raise BudgetExceeded(f"{m['provider']} cap: worst case ${worst:.4f} > ${cap - self.by_provider.get(m['provider'], 0.0):.4f} left of ${cap:.2f}")
            if task_left is not None and worst > task_left:
                raise BudgetExceeded(f"task budget: worst case ${worst:.4f} > ${task_left:.4f} left")
        return worst

    def book(self, m: dict, u: Usage, record: dict | None = None) -> float:
        c = R.cost(m, u)
        with self._lock:
            self.spent += c
            self.by_provider[m["provider"]] = self.by_provider.get(m["provider"], 0.0) + c
            self.calls += 1
        rec = dict(record or {}, provider=m["provider"], model=m["id"], alias=m.get("alias"), input=u.input, cached=u.cached,
                   cache_write=u.cache_write, cache_write_1h=u.cache_write_1h, output=u.output, thinking=u.thinking, usd=round(c, 6), at=time.strftime("%Y-%m-%dT%H:%M:%S"))
        for p in filter(None, [self.ledger, (record or {}).get("_project_ledger")]):
            p = Path(p)
            p.parent.mkdir(parents=True, exist_ok=True)
            with self._lock, open(p, "a", encoding="utf-8") as fh:
                fh.write(json.dumps({k: v for k, v in rec.items() if not k.startswith("_")}, ensure_ascii=False) + "\n")
        return c

    def summary(self) -> dict:
        return {"spent_usd": round(self.spent, 4), "run_cap_usd": self.run_usd, "by_provider": {k: round(v, 4) for k, v in self.by_provider.items()},
                "calls": self.calls}
