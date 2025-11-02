# Vercel Deployment Guide - epi-logos.org

## Quick Start

### 1. Install Vercel CLI (if not already)
```bash
npm i -g vercel
```

### 2. Login to Vercel
```bash
vercel login
```

### 3. Deploy from Project Root
```bash
# From: /Users/admin/Documents/The Epi-Logos System V0
vercel
```

Follow prompts:
- Link to existing project? → **No** (first time)
- Project name? → **epi-logos**
- Directory with code? → **./frontend**
- Override settings? → **No** (Next.js detected automatically)

### 4. Deploy to Production
```bash
vercel --prod
```

---

## Custom Domain Setup (epi-logos.org)

### Option A: Via Vercel Dashboard (Easiest)

1. **Go to your project** → https://vercel.com/your-username/epi-logos
2. **Settings** → **Domains**
3. **Add Domain**: `epi-logos.org`
4. Vercel will show you DNS records to add

### Option B: Via CLI
```bash
vercel domains add epi-logos.org
```

---

## DNS Configuration

Vercel will provide these records - add them to your domain registrar:

### For Root Domain (epi-logos.org)
```
Type: A
Name: @
Value: 76.76.21.21
```

### For WWW Subdomain (www.epi-logos.org)
```
Type: CNAME
Name: www
Value: cname.vercel-dns.com
```

**DNS Propagation**: 15-30 minutes (sometimes up to 48 hours)

---

## Environment Variables (if needed)

If your app needs env vars in production:

```bash
# Via CLI
vercel env add NEXT_PUBLIC_API_URL

# Or via Dashboard: Settings → Environment Variables
```

---

## Build Configuration

Vercel auto-detects Next.js. If you need custom config, create `vercel.json`:

```json
{
  "buildCommand": "npm run build",
  "outputDirectory": ".next",
  "framework": "nextjs",
  "installCommand": "npm install"
}
```

---

## Continuous Deployment

### Automatic Deploys
Once linked, every push to your main branch auto-deploys to production.

### Preview Deploys
Every pull request gets a unique preview URL automatically.

### Deploy Specific Branch
```bash
# Deploy current branch
vercel

# Deploy and alias to production
vercel --prod
```

---

## Monitoring

- **Dashboard**: https://vercel.com/dashboard
- **Analytics**: Built-in (Settings → Analytics)
- **Logs**: Dashboard → Deployments → Select deployment → Runtime Logs

---

## Quick Commands Reference

```bash
# Development
npm run dev

# Deploy preview
vercel

# Deploy production
vercel --prod

# Check deployment status
vercel ls

# View domains
vercel domains ls

# Pull environment variables
vercel env pull

# Remove deployment
vercel remove [deployment-url]
```

---

## Troubleshooting

### Build Fails
```bash
# Test build locally first
cd frontend
npm run build
```

### Domain Not Working
- Check DNS propagation: https://dnschecker.org
- Verify SSL certificate issued (Settings → Domains)
- Try `www.epi-logos.org` if root not working yet

### Environment Variables Not Working
- Prefix with `NEXT_PUBLIC_` for client-side access
- Redeploy after adding env vars

---

## Next Steps After Deployment

1. ✅ Deploy to Vercel
2. ✅ Configure domain
3. 📸 Add screenshot images to `/frontend/public/screenshots/`
4. ✏️ Refine content in `/frontend/src/ui-system/content/about-content.ts`
5. 🚀 Share the URL!

---

## Current Setup

- **Landing Page**: `/about` route
- **Logo**: Geometric spiral at `/ui-system/Generated Image August 28, 2025 - 11_22PM.png`
- **Content**: Edit `about-content.ts` for text updates
- **Screenshots**: Placeholders in `about-focus-cards.ts` (replace paths when ready)

---

## Support

- Vercel Docs: https://vercel.com/docs
- Next.js Deployment: https://nextjs.org/docs/deployment
- Domain Issues: https://vercel.com/docs/concepts/projects/domains
