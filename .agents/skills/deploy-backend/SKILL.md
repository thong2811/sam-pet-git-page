---
name: deploy-backend
description: >-
  Use this skill when the user asks to deploy, update, or sync the Google Apps Script backend (backend/Code.gs) with Google Sheets using Clasp.
---

# Deploy Google Apps Script Backend (SamPet)

This skill provides step-by-step instructions for safely building and deploying the Google Apps Script backend for the SamPet management system.

## Overview
- Backend code: `backend/Code.gs`
- Clasp config: `.clasp.json`
- Deployment script: `scripts/deploy.js`
- Environment config: `public/env.js`

## Prerequisites
1. Node.js environment with `@google/clasp` installed or accessible.
2. User must be logged into clasp (`npx clasp login`) if authentication has expired.

## Workflow

### 1. Verify Changes in `backend/Code.gs`
Before deploying, check if any API actions were added or modified:
- Match actions in `src/services/api.js` (`action: "appendPhieuXuat"`, `"saveRepackage"`, etc.).
- Ensure single-quoted IDs (`'ID...`) are preserved when writing rows to avoid stripping leading zeros.

### 2. Run Deployment Script
Run the automated deployment script:
```powershell
node scripts/deploy.js
```
or via npm:
```powershell
npm run deploy
```

### 3. How `scripts/deploy.js` Works
1. Runs `clasp push` to push `backend/` files to Google Apps Script.
2. Deploys a new version via `clasp deploy`.
3. Extracts the new Web App URL (`https://script.google.com/macros/s/.../exec`).
4. Automatically updates `SHEETS_URL` in `public/env.js` to ensure the frontend connects to the new version.

### 4. Verification
- Verify `public/env.js` has the updated `SHEETS_URL`.
- Test an API endpoint (e.g. `getLockDate` or fetching products) to confirm deployment is operational.
