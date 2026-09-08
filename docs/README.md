# SecureDoc — Documentation & Presentation Hub

Welcome to the comprehensive documentation suite for **SecureDoc**. This folder contains everything you need to thoroughly understand the codebase, the engineering philosophy, the API contracts, and how to present this project to an evaluator or teacher.

---

## Guide Index

| Guide | Description | Target Audience |
| :--- | :--- | :--- |
| **[01. Project Overview & Philosophy](01_PROJECT_OVERVIEW_AND_PHILOSOPHY.md)** | Core motivation, problem statement, design principles, and cryptographic foundations. | Presentation intro, system design defense |
| **[02. Architecture & Codebase Tour](02_ARCHITECTURE_AND_CODEBASE_TOUR.md)** | Deep dive into every layer, module, class, and function across backend and frontend. | Code walkthrough, technical defense |
| **[03. API Reference & Contracts](03_API_REFERENCE_AND_CONTRACTS.md)** | Complete specification of all REST endpoints, schemas, RBAC rules, and internal function calls. | API testing, backend viva questions |
| **[04. Teacher Presentation & Viva Cheatsheet](04_PRESENTATION_CHEATSHEET_FOR_TEACHER.md)** | Elevator pitch, live demo script, expected viva questions, and high-scoring answers. | In-person presentation & grading |

---

## Quick Technology Summary

- **Backend**: Python 3.9+, FastAPI, Uvicorn, Pydantic, Pytest.
- **Cryptography**: `cryptography` library implementing standard **AES-256-GCM** with 96-bit nonces, 128-bit authentication tags, and Envelope Encryption (DEK wrapped by Master KEK).
- **Authentication**: JWT bearer tokens signed with HMAC-SHA256, salted Scrypt password hashing (`scrypt$16384$8$1`).
- **Storage**: SQLite3 with strict schema, foreign key enforcement, thread locking, and tamper detection.
- **Multi-Format Ingestion**: `python-docx` for `.docx`, `pypdf` for `.pdf`, UTF-8 stream for `.txt`.
- **Frontend**: React 19, Vite 8, Tailwind CSS v4, React Router v7, Lucide Icons.
