# Deployment Instructions

This example is ready to deploy to Vercel.

## Prerequisites

- GitHub account
- Vercel account (linked to GitHub)
- Git repository

## Deployment Steps

### Option 1: Deploy via Vercel CLI

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy from project directory
cd examples/react-components
vercel

# Follow prompts to:
# 1. Link to your Vercel account
# 2. Link to a project (or create new)
# 3. Deploy to production
```

### Option 2: Deploy via Vercel Dashboard

1. Push code to GitHub
2. Go to https://vercel.com/new
3. Import your repository
4. Configure project:
   - **Framework Preset**: Vite
   - **Root Directory**: `examples/react-components`
   - **Build Command**: `pnpm build`
   - **Output Directory**: `dist`
   - **Install Command**: `pnpm install`
5. Click "Deploy"

## Environment Variables

No environment variables required for this example.

## Build Configuration

The build configuration is defined in `vercel.json`:

```json
{
  "buildCommand": "pnpm build",
  "outputDirectory": "dist",
  "devCommand": "pnpm dev",
  "installCommand": "pnpm install",
  "framework": "vite"
}
```

## Post-Deployment

After deployment, you'll receive a URL like:
```
https://a2ui-react-components.vercel.app
```

Update the live demo URL in README.md.

## Troubleshooting

### Build Fails

- Ensure all tests pass: `pnpm test`
- Check TypeScript: `pnpm type-check`
- Verify build locally: `pnpm build`

### 404 on Routes

Vercel automatically handles SPA routing for Vite projects.
If issues persist, add a `vercel.json` rewrite rule:

```json
{
  "rewrites": [
    { "source": "/(.*)", "destination": "/index.html" }
  ]
}
```
