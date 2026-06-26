from __future__ import annotations

import json
import sys
from datetime import datetime, timezone
from pathlib import Path


ROOT = Path(__file__).resolve().parents[2]
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

from backend.app.providers.stockscope_provider import STOCKSCOPE_SNAPSHOT_PATH, StockScopeProvider


def main() -> None:
    provider = StockScopeProvider()
    snapshot = provider._fetch_listing_details_coverage()
    snapshot["generated_at"] = datetime.now(timezone.utc).isoformat()
    STOCKSCOPE_SNAPSHOT_PATH.parent.mkdir(parents=True, exist_ok=True)
    STOCKSCOPE_SNAPSHOT_PATH.write_text(
        json.dumps(snapshot, ensure_ascii=True, indent=2),
        encoding="utf-8",
    )
    print(f"Wrote {snapshot['total']} rows to {STOCKSCOPE_SNAPSHOT_PATH}")


if __name__ == "__main__":
    main()
