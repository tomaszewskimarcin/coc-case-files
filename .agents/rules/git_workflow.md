# Branching and Git Release Workflow Rule

## 1. Version Numbering Convention
- **Production (`master`)**: Releases bump the **2nd digit** (minor version), e.g. `1.3.0`, `1.4.0`, `2.0.0`.
- **Development (`DEV-fields-config`)**: Iteration builds bump only the **3rd digit** (patch version) appended with `-DEV`, e.g. `1.3.1-DEV`, `1.3.2-DEV`, `1.3.3-DEV`.

## 2. Development & Testing Phase
- All code changes, fixes, and feature developments must be executed ONLY on the development branch (`DEV-fields-config`).
- The DEV branch must maintain standalone testing properties:
  - `module.json`: `id: "coc-case-files-dev"`, title `Call of Cthulhu Case Files (DEV)`, 3-digit version suffix (e.g. `1.3.1-DEV`), and manifest/download pointing to `DEV-fields-config`.
  - `scripts/main.js`: `MODULE_ID = "coc-case-files-dev"`, registering both `coc-case-files-dev.personnel-file` and `coc-case-files.personnel-file` for DEV backward-compatibility.

## 3. Release & Merge Phase (Executed ONLY when the user explicitly grants permission to merge)
- Create a temporary intermediate branch (e.g., `release-vX.Y.Z`).
- Merge `DEV-fields-config` into the intermediate branch.
- Revert `module.json` and code references back to official production values:
  - `module.json`: `id: "coc-case-files"`, title `Call of Cthulhu Case Files`, 2nd-digit release version (e.g., `1.3.0`), and manifest/download pointing to `master`.
  - `scripts/main.js`: `MODULE_ID = "coc-case-files"`, registering ONLY canonical `coc-case-files.personnel-file`.
- Merge the intermediate branch into `master`.
- Delete the temporary intermediate branch.

## 4. Post-Merge Sync Back to DEV
- Sync `master` changes back to `DEV-fields-config`.
- Re-apply DEV module ID (`coc-case-files-dev`), `(DEV)` title, 3-digit `-DEV` version (e.g., `1.3.1-DEV`), DEV manifest URLs, and dual type registration so DEV remains immediately testable side-by-side in Foundry.
- NEVER delete the development branch (`DEV-fields-config`).
