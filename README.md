# SecureDoc

Backend-only college project for selectively encrypting sensitive fragments in a
document while preserving normal text.

## Milestone 1: run locally

Create an isolated environment and install the declared packages:

```bash
python3 -m venv .venv
source .venv/bin/activate       # macOS/Linux
# .venv\Scripts\Activate.ps1    # Windows PowerShell
python -m pip install -r requirements-dev.txt
python -m pytest -v
```

See [ARCHITECTURE.md](ARCHITECTURE.md) for the design, security decisions, public
functions, and current limitations.
