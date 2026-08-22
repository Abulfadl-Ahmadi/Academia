# Architecture & Refactoring Plan - Academia

## 1. Executive Summary
The Academia repository is a functional monorepo consisting of a Django 5.2.4 backend and a React/Vite 19 frontend. The project supports robust capabilities (authentication, tests, courses, e-commerce) but currently exhibits signs of significant organic growth that negatively impacts maintainability. The codebase suffers from several overlapping concerns: 
1. **Repository Hygiene**: Backups, data dumps, one-off scripts, and vendor docs exist at the repository root.
2. **God Files**: Several backend and frontend files are massive (e.g., `tests/views.py` > 2000 LOC) and mix multiple architectural responsibilities (HTTP logic, business logic, formatting).
3. **Dead Code**: Multiple unused Python scripts and commands have been identified.
4. **Dependencies**: `requirements.txt` contains multiple packages that are no longer imported anywhere.
5. **Documentation**: While the root README is adequate, there are no onboarding guides or architecture decision records.

This plan details a phased modernization effort focused primarily on code restructuring, dead code elimination, and boundary reinforcement, without necessitating a complete framework rewrite.

## 2. Current Architecture Map
*   **Backend**: Django 5.2.4 REST API.
    *   **Apps**: `accounts`, `courses`, `contents`, `tests`, `shop`, `finance`, `tickets`, `knowledge`, `blog`, `chat`, `utils`.
    *   **Database**: Configured to support `sqlite3` locally and `mysql` in production (via `DB_ENGINE` env).
    *   **Real-time**: Django Channels 4.3 / Daphne.
    *   **Integrations**: sms.ir (OTP), Zibal & Zarinpal (Payments - Zibal is heavily implemented in `finance/services`), ParsPack S3 (Storage), Gemini AI.
*   **Frontend**: React 19.1.0 SPA.
    *   **Build/Styling**: Vite + Tailwind CSS v4 + shadcn/ui.
    *   **Data Fetching**: TanStack Query v5 + Axios.
    *   **Structure**: Mixed components, pages, and features in `vite-project/src/`.

## 3. Repository Inventory
*   **Backend Code**: Root-level directories (`accounts/`, `api/`, `courses/`, `tests/`, etc.).
*   **Frontend Code**: `vite-project/`.
*   **Scripts & Utilities**: `scripts/` (data migrations), `scratch/` (scratchpad files), `utils/`.
*   **Documentation**: `docs/`, `deploy.md`, `revisions.md`, vendor docs (`sms_ir_docs/`, `spotplayer_docs/`, `zibal_docs/`).
*   **Artifacts / Noise**: `fix_data/`, `live-2.0.json`, `questions_backup.json`, `vod-2.0.json`, `stream_info.json`, `check_collection.py`, `scratch_test_arvan.py`.

## 4. Problem Catalog
*   **Repository Hygiene**: Database dumps (`.json`), vendor API documentation, and scratch files are cluttering the root source structure, making it harder to discern the actual application shape.
*   **Large Files / God Modules**: 
    *   `tests/views.py` merges HTTP request handling, student session management, and complex grading/Excel generation logic.
    *   `vite-project/src/pages/teacher/CreateTestPage.tsx` merges complex UI state, API interactions, and heavy presentational layers.
*   **Dead Code**: Multiple management commands (e.g., `create_pending_streams.py`) and scripts (e.g., `check_collection.py`) are unused.
*   **Dependencies**: Packages like `Twisted`, `boto3` (likely superseded by `django-storages` abstraction), and `cryptography` are installed but unused directly.
*   **Documentation**: Missing architecture overviews, developer onboarding guides, and app boundary descriptions.
*   **Testing**: Backend test coverage is severely lacking (only 4 test methods found in `tests/`).

## 5. Large/Complex File Report
1.  **`tests/views.py`** (~2044 LOC) 
    *   **Problem**: Mixes business logic (grading), data formatting (Excel creation), and HTTP routing.
    *   **Refactor**: Extract grading into a `services/grading.py` and Excel generation into `services/export.py`.
2.  **`tests/serializers.py`** (~1375 LOC)
    *   **Problem**: Overloaded with all serializers for the entire testing domain. 
    *   **Refactor**: Split into module-specific files (e.g., `serializers/questions.py`, `serializers/sessions.py`).
3.  **`vite-project/src/pages/teacher/CreateTestPage.tsx`** (~1343 LOC)
    *   **Problem**: Massive component with too many responsibilities (UI layout, form state, API calls).
    *   **Refactor**: Extract sub-components (e.g., `TestConfigurationForm`, `QuestionSelector`) and custom hooks (`useTestCreation`).
4.  **`tests/models.py`** (~1021 LOC)
    *   **Problem**: Monolithic domain model definition.
    *   **Refactor**: Potentially split into `models/questions.py`, `models/sessions.py` if Django >= 3.2 app config patterns allow clean separation.
5.  **`accounts/views.py`** (~893 LOC)
    *   **Problem**: Mixes OTP handling, user registration, JWT generation, and profile management.
    *   **Refactor**: Extract auth services.

## 6. Dead Code Candidate Report
*   **SAFE TO DELETE**:
    *   `scratch/check_course.py`
    *   `scratch/test_provision.py`
    *   `scratch/test_spotplayer.py`
    *   `scratch_test_arvan.py`
    *   `check_collection.py`
*   **PROBABLY UNUSED (Needs verification)**:
    *   `courses/management/commands/create_pending_streams.py`
    *   `api/management/commands/check_storage.py`
    *   `api/management/commands/check_admin.py`
    *   Scripts in `scripts/data_migration/` (one-off migrations usually not needed in `main`).
*   **UNCERTAIN**:
    *   `finance/services/zibal.py` (Active models and serializers reference Zibal, but README mentions Zarinpal. Cannot statically delete).

## 7. Repository Hygiene Report
*   **Action: Delete**: `scratch/`, `scratch_test_arvan.py`, `check_collection.py`.
*   **Action: Move to `data/` or `fixtures/`**: `fix_data/`, `questions_backup.json`, `live-2.0.json`, `vod-2.0.json`, `stream_info.json`.
*   **Action: Move to `docs/vendor/`**: `sms_ir_docs/`, `spotplayer_docs/`, `zibal_docs/`.
*   **Action: .gitignore**: Ensure all `.json` data dumps are ignored.

## 8. Dependency Report
*   **Python (`requirements.txt`)**: Contains numerous unreferenced libraries. For instance, `Twisted`, `aiohappyeyeballs`, `arvan-client` (if `scratch_test_arvan.py` is dead), `boto3` (likely only `s3transfer` needed indirectly), `grpcio`, `tinydb`, etc. require audit and removal.
*   **Node (`package.json` vs `vite-project/package.json`)**: Root `package.json` contains duplicate/misplaced `@react-pdf-viewer` dependencies that belong inside `vite-project/`.

## 9. Documentation Gap Analysis
*   **Current State**: `README.md` is well-written for high-level features.
*   **Missing**: 
    1. `docs/architecture.md` detailing how the Django apps communicate.
    2. `docs/onboarding.md` detailing exact local setup (DB, Node, Env vars).
    3. `docs/deploy.md` (exists but needs review against current architecture).

## 10. Proposed Target Architecture
We recommend keeping the current Django app structure (apps at the root level) to minimize import churn, but heavily cleaning the root directory.

```
/
├── accounts/              # Django apps remain at root
├── api/                   # Django settings/wsgi
├── courses/
├── ...
├── docs/                  # Consolidated docs (architecture, onboarding, vendor)
├── data/                  # Moved JSON dumps and fixtures
├── scripts/               # Only active operational scripts
├── vite-project/          # Consider renaming to 'frontend' in Phase 3
├── requirements.txt
└── .env.example
```

## 11. Prioritized Refactoring Roadmap

*   **Phase 0 — Baseline and Safety (P0)**
    *   Implement characterization tests for `tests/views.py` (grading) and `accounts/views.py` (auth) before modifying them.
*   **Phase 1 — Repository Hygiene (P1)**
    *   Move vendor docs, JSON dumps, and fix root `package.json`.
*   **Phase 2 — Dead Code Removal (P2)**
    *   Delete scratch files and unverified scripts.
*   **Phase 3 — Structural Cleanup (P2)**
    *   Rename `vite-project` to `frontend` (optional but recommended).
*   **Phase 4 — Large Module Decomposition (P1)**
    *   Extract services from `tests/views.py` and `accounts/views.py`.
    *   Extract hooks/components from `CreateTestPage.tsx`.
*   **Phase 5 — Dependency Cleanup (P3)**
    *   Audit and trim `requirements.txt`.
*   **Phase 6 — Documentation and Developer Experience (P2)**
    *   Write `architecture.md` and `onboarding.md`.

## 12. Detailed Implementation Checklist
| ID | Title | Problem | Proposed Change | Risk | Scope |
|---|---|---|---|---|---|
| HYG-01 | Clean root artifacts | Root directory is cluttered | Move `docs`, `data`, `.json` files | Low | Small |
| DDC-01 | Remove scratch code | Dead scratch scripts | Delete `scratch/`, `scratch_test_arvan.py`, `check_collection.py` | Low | Small |
| SAF-01 | Characterization Tests | Low test coverage on core flows | Add integration tests for grading and auth | Medium | Medium |
| REF-01 | Extract Grading Service | `tests/views.py` is a god module | Move grading to `tests/services/grading.py` | High | Large |
| REF-02 | Refactor `CreateTestPage` | Giant React component | Break down into smaller form components | Medium | Medium |
| DEP-01 | Trim Python Dependencies | Unused packages in requirements | Remove unused packages based on pipreqs | Low | Small |
| DOC-01 | Create Architecture Docs | Missing system overview | Write `docs/architecture.md` | Low | Small |

## 13. Risk Matrix
*   **High Risk**: Extracting logic from `tests/views.py` and `accounts/views.py` could break core authentication or grading features. Requires strict tests (`SAF-01`) before touching.
*   **Medium Risk**: Breaking down frontend components like `CreateTestPage.tsx` could cause UI state regressions.
*   **Low Risk**: Moving static files, deleting scratch scripts, and documenting.

## 14. Verification Strategy
*   **Phase 1 & 2**: Run `python manage.py runserver` and `npm run build` to ensure no imports were broken.
*   **Phase 4**: Ensure newly added test suite (`python manage.py test`) fully passes.
*   **Phase 5**: Run system tests to ensure stripped dependencies don't cause runtime `ModuleNotFoundError`.

## 15. Final Recommendation
*   **First Steps**: Immediately execute Phase 1 (Hygiene) and Phase 2 (Dead Code). These provide maximum clarity with near-zero risk.
*   **Do NOT Change**: Do not rewrite the app to a strict `/backend` nested structure immediately. The import path churn is too high for the initial value gained.
*   **Highest Value**: Decomposing `tests/views.py` will yield the highest maintainability return but must be preceded by Phase 0 (Safety).

AUDIT COMPLETE — WAITING FOR IMPLEMENTATION APPROVAL
