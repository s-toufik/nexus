---
type: guide
project: "[[Web framework benchmark]]"
tags: [guide, web-framework]
updated: 2026-11-08
---

# Web framework benchmark - Extend it

> Add an endpoint, a framework, a load profile, or more realistic work; run the checks.

**Where:** on your Mac, in `web_framework` · **All guides:** [[Web framework benchmark guides]]

| To add | Do |
|---|---|
| An endpoint | A use case and its port in `shop/application/`, wired in `ShopDI._use_cases` and `ShopUseCases`; a route in each `bootstrap/application/<framework>/router/`; its request in `shop_benchmark/workload/catalog.py`; a line in the contract test's `ENDPOINTS` |
| A framework | A pycraftcore toolkit for it (`pycraftcore.web_<name>`), then `bootstrap/application/<name>/` like the others, a `create_<name>_application` in `shop_application.py`, a `run_<name>` target, its folder in the architecture test and the contract tests' `EVERY_FRAMEWORK` |
| A load profile | An entry in `load.profiles` of the control panel; the reports and the comparison pick it up |
| More realistic work | Change the latencies, catalogue size or image size in `config/debug/`, or a fake API in `shop/adapter/outbound/api/` |

## Tests and checks

```bash
make check        # ruff + ty + pytest
make test
```

The contract tests start each framework's real app and check that all three answer every endpoint with the same bytes, the same media types and the same errors.

## Why it works
- [[Web framework benchmark design]] · [[pycraftcore - Add a web framework]] · [[Architecture tests]]
