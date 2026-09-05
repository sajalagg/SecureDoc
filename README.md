# SecureDoc

Backend-only college project for selectively encrypting sensitive fragments in a
document while preserving normal text.

## Milestone 3: run locally

Create an isolated environment and install the declared packages:

```bash
python3 -m venv .venv
source .venv/bin/activate       # macOS/Linux
# .venv\Scripts\Activate.ps1    # Windows PowerShell
python -m pip install -r requirements-dev.txt
python -m pytest -v
```

For the master-key workflow, generate a local value using the command in
`.env.example`, copy it to an ignored `.env` file, and expose it to your shell or
future application configuration as `SECUREDOC_MASTER_KEY_BASE64`. Do not commit
that value.

See [ARCHITECTURE.md](ARCHITECTURE.md) for the design, security decisions, public
functions, and current limitations.
