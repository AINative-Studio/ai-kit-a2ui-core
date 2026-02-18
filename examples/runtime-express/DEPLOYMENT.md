# Deployment Guide - Runtime + Express Example

This guide explains how to deploy the A2UI Runtime + Express application to Railway.

## Prerequisites

- Railway account ([sign up here](https://railway.app))
- Railway CLI installed: `npm install -g @railway/cli`
- OpenAI API key

## Quick Deploy to Railway

### Option 1: Deploy from GitHub

1. **Push to GitHub**:
   ```bash
   git add .
   git commit -m "Add runtime-express example"
   git push origin main
   ```

2. **Create Railway Project**:
   - Go to [Railway Dashboard](https://railway.app/dashboard)
   - Click "New Project"
   - Select "Deploy from GitHub repo"
   - Select your repository
   - Railway will auto-detect and deploy

3. **Set Environment Variables**:
   In Railway dashboard, go to Variables tab and add:

   ```
   OPENAI_API_KEY=sk-your-actual-key-here
   JWT_SECRET=your-secure-random-secret-minimum-32-characters
   NODE_ENV=production
   PORT=3001
   RATE_LIMIT_WINDOW_MS=60000
   RATE_LIMIT_MAX_REQUESTS=60
   ```

### Option 2: Deploy via Railway CLI

1. **Login to Railway**:
   ```bash
   railway login
   ```

2. **Initialize Project**:
   ```bash
   cd examples/runtime-express
   railway init
   ```

3. **Set Environment Variables**:
   ```bash
   railway variables set OPENAI_API_KEY=sk-your-actual-key-here
   railway variables set JWT_SECRET=your-secure-random-secret-minimum-32-characters
   railway variables set NODE_ENV=production
   railway variables set PORT=3001
   railway variables set RATE_LIMIT_WINDOW_MS=60000
   railway variables set RATE_LIMIT_MAX_REQUESTS=60
   ```

4. **Deploy**:
   ```bash
   railway up
   ```

5. **Get URL**:
   ```bash
   railway domain
   ```

## Environment Variables Reference

### Required

| Variable | Description | Example |
|----------|-------------|---------|
| `OPENAI_API_KEY` | OpenAI API key | `sk-...` |
| `JWT_SECRET` | Secret for JWT signing (min 32 chars) | `your-secret-key-change-in-production` |

### Optional

| Variable | Description | Default |
|----------|-------------|---------|
| `NODE_ENV` | Environment | `production` |
| `PORT` | Server port | `3001` |
| `RATE_LIMIT_WINDOW_MS` | Rate limit window (ms) | `60000` (1 min) |
| `RATE_LIMIT_MAX_REQUESTS` | Max requests per window | `60` |
| `ANTHROPIC_API_KEY` | Anthropic API key (optional) | - |

## Testing the Deployment

Once deployed, test your endpoints:

### 1. Health Check
```bash
curl https://your-app.railway.app/health
```

Expected response:
```json
{
  "status": "healthy",
  "uptime": 12345,
  "version": "0.1.0",
  "adapter": "openai",
  "actionsRegistered": 4,
  "middlewareCount": 4,
  "timestamp": "2024-02-17T..."
}
```

### 2. Generate JWT Token

Create a test token locally:

```javascript
const jwt = require('jsonwebtoken');
const token = jwt.sign(
  {
    sub: 'user-123',
    email: 'test@example.com',
    role: 'user'
  },
  process.env.JWT_SECRET,
  { expiresIn: '7d' }
);
console.log(token);
```

### 3. Test Chat Endpoint

```bash
curl -X POST https://your-app.railway.app/api/agent/chat \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"message":"Create a dashboard for user analytics"}'
```

### 4. Test Action Endpoint

```bash
curl -X POST https://your-app.railway.app/api/agent/action \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "action": "searchDatabase",
    "parameters": {
      "query": "machine learning tutorials",
      "limit": 5
    }
  }'
```

## Monitoring

### View Logs
```bash
railway logs
```

### View Metrics
```bash
railway status
```

## Troubleshooting

### Build Fails

**Issue**: `Module not found` errors

**Solution**: Ensure pnpm workspace is configured:
```bash
railway variables set NIXPACKS_BUILD_CMD="pnpm install && pnpm build"
```

### Runtime Errors

**Issue**: `OPENAI_API_KEY is not defined`

**Solution**: Verify environment variables are set:
```bash
railway variables
```

### Authentication Errors

**Issue**: `Invalid token` errors

**Solution**: Ensure JWT_SECRET matches between token generation and server:
```bash
railway variables set JWT_SECRET=your-exact-secret
```

### Rate Limiting

**Issue**: Getting 429 errors

**Solution**: Increase rate limits:
```bash
railway variables set RATE_LIMIT_MAX_REQUESTS=120
```

## Security Checklist

Before deploying to production:

- [ ] Generate strong JWT_SECRET (min 32 characters, random)
- [ ] Never commit `.env` files
- [ ] Use Railway's secret variables for API keys
- [ ] Enable HTTPS (automatic on Railway)
- [ ] Configure CORS for your frontend domain
- [ ] Set appropriate rate limits
- [ ] Enable Helmet security headers (already configured)
- [ ] Monitor logs for suspicious activity

## Cost Estimates

### Railway
- **Free Tier**: $5 credit/month
- **Pro Plan**: $20/month + usage
- **Typical Usage**: ~$5-15/month for moderate traffic

### OpenAI
- **GPT-4o**: $2.50 / 1M input tokens, $10 / 1M output tokens
- **GPT-4o-mini**: $0.15 / 1M input tokens, $0.60 / 1M output tokens
- **Typical Usage**: Varies based on traffic

## Scaling

Railway auto-scales based on traffic:

1. **Vertical Scaling**: Increase memory/CPU in Railway dashboard
2. **Horizontal Scaling**: Add multiple instances (Pro plan)
3. **Database**: Add PostgreSQL service for production data
4. **Caching**: Add Redis service for rate limiting

## Production Recommendations

1. **Database**: Replace mock implementations with real database:
   - Add PostgreSQL service on Railway
   - Implement pgvector for vector search
   - Use Prisma or Drizzle ORM

2. **Email**: Configure real email service:
   - Add Resend API key
   - Or configure SMTP credentials
   - Update `email-service.ts`

3. **PDF Generation**: Add Puppeteer:
   - Install Chrome buildpack on Railway
   - Configure Puppeteer for serverless
   - Update `pdf-generator.ts`

4. **Monitoring**: Add observability:
   - Railway metrics (built-in)
   - Sentry for error tracking
   - DataDog or New Relic for APM

## Support

- Railway Docs: https://docs.railway.app
- OpenAI Docs: https://platform.openai.com/docs
- A2UI Protocol: https://github.com/AINative-Studio/ai-kit-a2ui-core

## License

MIT © AINative Studio
