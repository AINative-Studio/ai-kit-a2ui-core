# Storybook Deployment Guide

## Prerequisites

- Storybook must build successfully
- All tests passing with 85%+ coverage
- Accessibility checks passing

## Build Storybook

```bash
cd packages/a2ui-react
npm run build-storybook
```

This creates a static site in `storybook-static/`

## Deployment Options

### Option 1: Railway (Recommended for AINative)

```bash
# Install Railway CLI
npm install -g @railway/cli

# Login
railway login

# Deploy from project root
cd storybook-static
railway up

# Set custom domain
railway domain add storybook.ainative.studio
```

### Option 2: Vercel

```bash
# Install Vercel CLI
npm install -g vercel

# Deploy
cd storybook-static
vercel --prod

# Add custom domain in Vercel dashboard
```

### Option 3: Netlify

```bash
# Install Netlify CLI
npm install -g netlify-cli

# Deploy
cd storybook-static
netlify deploy --prod

# Configure domain in Netlify dashboard
```

### Option 4: GitHub Pages

1. Add to `.github/workflows/deploy-storybook.yml`:

```yaml
name: Deploy Storybook

on:
  push:
    branches: [main]
    paths:
      - 'packages/a2ui-react/**'

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          
      - name: Install dependencies
        working-directory: packages/a2ui-react
        run: npm install
        
      - name: Build Storybook
        working-directory: packages/a2ui-react
        run: npm run build-storybook
        
      - name: Deploy to GitHub Pages
        uses: peaceiris/actions-gh-pages@v3
        with:
          github_token: ${{ secrets.GITHUB_TOKEN }}
          publish_dir: ./packages/a2ui-react/storybook-static
          cname: storybook.ainative.studio
```

2. Configure custom domain in repository settings

### Option 5: AWS S3 + CloudFront

```bash
# Build Storybook
npm run build-storybook

# Upload to S3
aws s3 sync storybook-static/ s3://storybook.ainative.studio/ --delete

# Invalidate CloudFront cache
aws cloudfront create-invalidation --distribution-id YOUR_DIST_ID --paths "/*"
```

## Post-Deployment Checklist

- [ ] Storybook accessible at https://storybook.ainative.studio/a2ui-react
- [ ] All stories load correctly
- [ ] Dark mode toggle works
- [ ] Accessibility addon functional
- [ ] Interactive controls (Args) working
- [ ] No console errors
- [ ] Mobile responsive
- [ ] SSL certificate valid

## Continuous Deployment

Set up automatic deploys on push to main:

1. Choose deployment platform (Railway, Vercel, Netlify)
2. Connect GitHub repository
3. Configure build command: `npm run build-storybook`
4. Set publish directory: `storybook-static`
5. Enable automatic deployments

## Custom Domain Configuration

### DNS Records
Add these DNS records for `storybook.ainative.studio`:

```
Type: CNAME
Name: storybook
Value: [platform-specific-url]
TTL: 3600
```

### SSL Certificate
Most platforms (Vercel, Netlify, Railway) provide automatic SSL via Let's Encrypt.

## Troubleshooting

### Build Fails
```bash
# Clear cache and rebuild
rm -rf node_modules package-lock.json
npm install
npm run build-storybook
```

### Stories Not Loading
- Check browser console for errors
- Verify all component imports are correct
- Ensure no TypeScript errors: `npm run type-check`

### Accessibility Issues
- Run accessibility audit in Storybook
- Fix violations before deploying
- Use `npm run test:a11y` if configured

## Monitoring

After deployment, monitor:
- Build success/failure notifications
- Usage analytics (if configured)
- Error tracking (Sentry, etc.)
- Performance metrics

## Rollback

If deployment has issues:

```bash
# Vercel
vercel rollback

# Netlify
netlify rollback

# Railway
railway rollback [deployment-id]

# Manual (S3)
aws s3 sync s3://storybook.ainative.studio-backup/ s3://storybook.ainative.studio/
```

## Update README

After successful deployment, update main README.md:

```markdown
## Storybook

View live component documentation: https://storybook.ainative.studio/a2ui-react
```
