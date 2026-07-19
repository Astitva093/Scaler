# Vercel deployment

This repository is organized so the production-ready Next.js app can be pushed to GitHub and deployed from Vercel with minimal extra setup.

## What Vercel uses

- App Router pages live in `app/`
- Shared UI components live in `components/`
- Shared data and serializers live in `lib/`
- Database helpers live in `db/`
- The Vercel build uses `npm run vercel-build`
- The Vercel proxy layer reads `BACKEND_API_BASE_URL`

## Deployment steps

1. Push the repository to GitHub.
1. Import the repository into Vercel.
1. Keep the default framework detection as Next.js.
1. Let Vercel use the included `vercel.json`.
1. Set `BACKEND_API_BASE_URL` in the Vercel project settings to your Render API URL, for example `https://your-service.onrender.com`.

## Notes

- The browser stays on Vercel and calls `/api/...` routes.
- Vercel forwards those requests to the Render backend using `BACKEND_API_BASE_URL`.
- The Cloudflare/Sites build helpers are still in the repo for the alternate runtime path, but they are not needed for Vercel deployment.
