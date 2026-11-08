---
type: guide
project: "[[pycraftcore]]"
tags: [guide, pycraftcore]
updated: 2026-11-08
---

# pycraftcore - Run untrusted Python

> Run code in a separate process with module, memory, time and file limits, optionally calling your own functions.

**Where:** in your service's repository · **All guides:** [[pycraftcore guides]]

```python
from pycraftcore.runtime.adapter import PythonSafeCodeFactory
from pycraftcore.runtime.schema import CodeResult, SafeCodeSettings

factory = PythonSafeCodeFactory(settings=SafeCodeSettings(code_timeout=30, max_memory_mb=256))
output = await factory(code="import math\nresult = math.sqrt(2)").execute()
print(CodeResult.from_stdout(output.stdout).value)  # 1.4142135623730951
```

- The code runs in its own process; only the modules in `PYTHON_ALLOWLIST` can be imported (pandas, numpy, matplotlib, datetime…).
- `working_directory` in `SafeCodeSettings` confines file access to one folder.
- With a `HostBridgeServer`, the code can call functions of your service as if they were local — for example, a tool service can let sandboxed code call its other tools.
- When the code fails, `output.stderr` holds its traceback, limited to the code's own lines: each frame with its line number and source line, then the error. Internal frames (the sandbox runner, the libraries it calls) are left out. Whatever the code printed before failing stays in `output.stdout`.

  ```text
  Traceback (most recent call last):
    File "<sandbox>", line 3, in <module>
      value = rows[5]
              ~~~~^^^
  IndexError: list index out of range
  ```

---

## Why it works
- [[pycraftcore runtime sandbox]] · [[AI agents and sandboxing]]
