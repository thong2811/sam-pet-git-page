---
name: pwa-release
description: >-
  Use this skill when the user wants to release a new frontend version, update the PWA Service Worker cache, or bump APP_VERSION in public/env.js.
---

# PWA Release & Cache Management (SamPet)

This skill guides the release process for the Progressive Web App (PWA) to ensure staff mobile devices receive instant updates without stale browser caching.

## Overview
- PWA config: `public/manifest.json`
- Service Worker: `public/sw.js`
- Version tracking: `public/env.js` (`APP_VERSION`)
- CI/CD trigger: Pushing to `main` branch triggers `.github/workflows/deploy.yml`

## Release Workflow

### 1. Bump `APP_VERSION`
Open `public/env.js` and bump the semantic version:
```javascript
root.ENV = {
  ...
  APP_VERSION: "1.0.1" // increment patch or minor
};
```

### 2. Verify Service Worker Cache Name
Check `public/sw.js` to ensure the cache key matches or is incremented if static assets require a hard flush:
```javascript
const CACHE_NAME = 'sampet-v' + ...;
```

### 3. Test Local Build
Run production build to ensure clean compilation:
```powershell
npm run build
```
Verify `dist/` is generated with 0 errors.

### 4. Git Push & Deploy
Follow project safety rules: **Ask user before commit/push**.
Once approved, commit and push to `main` to trigger the automated GitHub Actions build and GitHub Pages deployment.
