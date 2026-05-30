# PAPERCLIP-PROD-DRYRUN-001

Synthetic product delivery dry run for Paperclip company-wide autonomous readiness.

This repository proves that Paperclip can operate a real hosted delivery loop:

1. build and test a small product artifact;
2. deploy to a hosted staging target;
3. publish verifiable CI and deployment evidence;
4. execute and document rollback.

## Commands

```bash
npm ci
npm test
npm run build
npm run verify:dist
```

## Staging

The staging target is GitHub Pages, deployed by `.github/workflows/staging-pages.yml`.

The deployment uses the repository-scoped `GITHUB_TOKEN` with:

- `contents: read`
- `pages: write`
- `id-token: write`

No long-lived deploy credential is committed to the repository.

