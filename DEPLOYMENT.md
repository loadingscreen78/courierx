# CourierX - Next.js Deployment Guide

## Pre-Deployment Checklist

### Environment Variables
Ensure all environment variables are set in your deployment platform:

```bash
NEXT_PUBLIC_SUPABASE_PROJECT_ID=nndcxvvulrxnfjoorjzz
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=your_key_here
NEXT_PUBLIC_SUPABASE_URL=https://nndcxvvulrxnfjoorjzz.supabase.co
```

### Build Configuration
- Node.js version: 18.x or higher
- Build command: `npm run build`
- Start command: `npm run start`
- Port: 8080 (configurable)

## Deployment Platforms

### Vercel (Recommended)
Vercel is the easiest platform for Next.js deployment:

1. **Connect Repository**
   ```bash
   # Install Vercel CLI
   npm i -g vercel
   
   # Deploy
   vercel
   ```

2. **Environment Variables**
   - Add all `NEXT_PUBLIC_*` variables in Vercel dashboard
   - Settings → Environment Variables

3. **Build Settings**
   - Framework Preset: Next.js
   - Build Command: `npm run build`
   - Output Directory: `.next`
   - Install Command: `npm install`

4. **Domain Configuration**
   - Add custom domain in Vercel dashboard
   - Update DNS records as instructed

### Netlify

1. **Build Settings**
   ```toml
   [build]
     command = "npm run build"
     publish = ".next"
   
   [[plugins]]
     package = "@netlify/plugin-nextjs"
   ```

2. **Environment Variables**
   - Add in Netlify dashboard under Site settings → Environment variables

### AWS Amplify

1. **Build Settings**
   ```yaml
   version: 1
   frontend:
     phases:
       preBuild:
         commands:
           - npm ci
       build:
         commands:
           - npm run build
     artifacts:
       baseDirectory: .next
       files:
         - '**/*'
     cache:
       paths:
         - node_modules/**/*
   ```

### Docker Deployment

1. **Create Dockerfile**
   ```dockerfile
   FROM node:18-alpine AS base
   
   # Install dependencies only when needed
   FROM base AS deps
   RUN apk add --no-cache libc6-compat
   WORKDIR /app
   
   COPY package*.json ./
   RUN npm ci
   
   # Rebuild the source code only when needed
   FROM base AS builder
   WORKDIR /app
   COPY --from=deps /app/node_modules ./node_modules
   COPY . .
   
   ENV NEXT_TELEMETRY_DISABLED 1
   
   RUN npm run build
   
   # Production image
   FROM base AS runner
   WORKDIR /app
   
   ENV NODE_ENV production
   ENV NEXT_TELEMETRY_DISABLED 1
   
   RUN addgroup --system --gid 1001 nodejs
   RUN adduser --system --uid 1001 nextjs
   
   COPY --from=builder /app/public ./public
   COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
   COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
   
   USER nextjs
   
   EXPOSE 8080
   
   ENV PORT 8080
   
   CMD ["node", "server.js"]
   ```

2. **Build and Run**
   ```bash
   docker build -t courierx .
   docker run -p 8080:8080 courierx
   ```

### Self-Hosted (VPS/Dedicated Server)

1. **Install Dependencies**
   ```bash
   # Install Node.js 18+
   curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
   sudo apt-get install -y nodejs
   
   # Install PM2
   npm install -g pm2
   ```

2. **Deploy Application**
   ```bash
   # Clone repository
   git clone your-repo-url
   cd courierx
   
   # Install dependencies
   npm ci
   
   # Build
   npm run build
   
   # Start with PM2
   pm2 start npm --name "courierx" -- start
   pm2 save
   pm2 startup
   ```

3. **Nginx Configuration**
   ```nginx
   server {
       listen 80;
       server_name courierx.in www.courierx.in;
       
       location / {
           proxy_pass http://localhost:8080;
           proxy_http_version 1.1;
           proxy_set_header Upgrade $http_upgrade;
           proxy_set_header Connection 'upgrade';
           proxy_set_header Host $host;
           proxy_cache_bypass $http_upgrade;
       }
   }
   ```

4. **SSL with Let's Encrypt**
   ```bash
   sudo apt install certbot python3-certbot-nginx
   sudo certbot --nginx -d courierx.in -d www.courierx.in
   ```

## Performance Optimization

### CDN Configuration
- Enable CDN for static assets
- Configure cache headers
- Use image CDN for optimized images

### Database Optimization
- Ensure Supabase is in the same region as your deployment
- Enable connection pooling
- Use database indexes for frequently queried fields

### Monitoring
- Set up error tracking (Sentry, LogRocket)
- Monitor Web Vitals
- Set up uptime monitoring

## Post-Deployment

### Verification Checklist
- [ ] All pages load correctly
- [ ] Authentication works
- [ ] Image optimization is working
- [ ] SEO metadata is present
- [ ] Sitemap is accessible at `/sitemap.xml`
- [ ] Robots.txt is accessible at `/robots.txt`
- [ ] All API calls to Supabase work
- [ ] Admin routes are protected
- [ ] CXBC routes are protected
- [ ] Mobile responsiveness works
- [ ] Dark/Light theme toggle works

### Performance Testing
```bash
# Lighthouse CI
npm install -g @lhci/cli
lhci autorun --collect.url=https://your-domain.com

# Load testing
npm install -g artillery
artillery quick --count 10 --num 100 https://your-domain.com
```

### Security Audit
```bash
# Check for vulnerabilities
npm audit

# Fix vulnerabilities
npm audit fix
```

## Rollback Plan

If issues occur after deployment:

1. **Vercel**: Use deployment history to rollback
2. **Docker**: Keep previous image tags
3. **PM2**: 
   ```bash
   pm2 stop courierx
   git checkout previous-commit
   npm ci
   npm run build
   pm2 restart courierx
   ```

## Maintenance

### Regular Updates
```bash
# Update dependencies
npm update

# Check for outdated packages
npm outdated

# Update Next.js
npm install next@latest react@latest react-dom@latest
```

### Backup Strategy
- Database: Automated Supabase backups
- Code: Git repository
- Environment variables: Secure vault storage

## Support & Troubleshooting

### Common Issues

1. **Build Fails**
   - Check Node.js version (18+)
   - Clear `.next` folder and rebuild
   - Check for TypeScript errors

2. **Environment Variables Not Working**
   - Ensure `NEXT_PUBLIC_` prefix for client-side variables
   - Restart server after adding variables
   - Check deployment platform settings

3. **Images Not Loading**
   - Verify image domains in `next.config.js`
   - Check Supabase storage permissions
   - Ensure images are publicly accessible

4. **Slow Performance**
   - Enable CDN
   - Check database query performance
   - Review bundle size with `npm run analyze`

### Getting Help
- Next.js Documentation: https://nextjs.org/docs
- Supabase Documentation: https://supabase.com/docs
- GitHub Issues: Create issue in repository
- Community: Next.js Discord, Stack Overflow

## Monitoring & Analytics

### Recommended Tools
- **Error Tracking**: Sentry
- **Analytics**: Google Analytics, Plausible
- **Performance**: Vercel Analytics, Web Vitals
- **Uptime**: UptimeRobot, Pingdom
- **Logs**: Logtail, Papertrail

### Setup Web Vitals
Add to `app/layout.tsx`:
```typescript
import { Analytics } from '@vercel/analytics/react';

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        {children}
        <Analytics />
      </body>
    </html>
  );
}
```

## Cost Optimization

### Vercel
- Free tier: Suitable for development
- Pro tier: $20/month for production
- Enterprise: Custom pricing

### Hosting Alternatives
- Netlify: Similar to Vercel
- Railway: $5/month starter
- DigitalOcean: $6/month droplet
- AWS: Pay-as-you-go

### Database (Supabase)
- Free tier: 500MB database, 1GB file storage
- Pro tier: $25/month
- Consider upgrading based on usage

## Conclusion

Your CourierX application is now ready for production deployment with Next.js 14. Follow this guide for a smooth deployment process and optimal performance.

For questions or issues, refer to the documentation or contact the development team.
