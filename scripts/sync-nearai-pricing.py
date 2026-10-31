#!/usr/bin/env python3
"""Refresh NEAR AI model rates in local YAML from the public model catalog."""

import json
import math
from datetime import datetime, timezone
from decimal import Decimal
from pathlib import Path
from urllib.request import urlopen

URL = "https://cloud-api.near.ai/v1/models"
START = "        # BEGIN NEAR AI PRICING\n"
END = "        # END NEAR AI PRICING"


def per_million(value):
    rate = float(Decimal(str(value)) * 1_000_000)
    if not math.isfinite(rate) or rate < 0:
        raise ValueError("Catalog contains an invalid price")
    return rate


def main():
    path = Path(__file__).resolve().parents[1] / "librechat.local.yaml"
    config = path.read_text()
    if config.count(START) != 1 or config.count(END) != 1:
        raise ValueError("Expected exactly one marked NEAR AI pricing section")
    with urlopen(URL, timeout=30) as response:
        models = json.load(response)["data"]
    if not models:
        raise ValueError("Catalog contains no models")
    rows = []
    seen = set()
    for model in sorted(models, key=lambda item: item["id"]):
        name = model["id"]
        context = model["context_length"]
        if not isinstance(name, str) or name in seen:
            raise ValueError("Catalog contains an invalid or duplicate model id")
        if not isinstance(context, int) or isinstance(context, bool) or context <= 0:
            raise ValueError("Catalog contains an invalid context window")
        seen.add(name)
        pricing = model["pricing"]
        rates = {
            "prompt": per_million(pricing["prompt"]),
            "completion": per_million(pricing["completion"]),
            "context": context,
        }
        if pricing.get("input_cache_read") is not None:
            rates["cacheRead"] = per_million(pricing["input_cache_read"])
        rows.append(f"        {json.dumps(name)}: {json.dumps(rates)}")
    date = datetime.now(timezone.utc).date().isoformat()
    replacement = f"        # USD per million tokens; fetched {date} from {URL}\n"
    replacement += "\n".join(rows) + "\n"
    before, remainder = config.split(START)
    _, after = remainder.split(END)
    path.write_text(before + START + replacement + END + after)
    print(f"Updated published pricing and context windows for {len(rows)} NEAR AI models.")


if __name__ == "__main__":
    main()
