# 🚀 Deployment Guide

This guide covers deploying the IncelFitness application to various platforms.

## 📋 Prerequisites

- Node.js 18+
- MongoDB database (Atlas recommended for production)
- Domain name (for production)
- SSL certificate (automatic with most platforms)

## 🌐 Environment Variables

### Required Environment Variables
```env
# Database Connection
DATABASE_URL="mongodb+srv://username:password@cluster.mongodb.net/fitness-app"

# NextAuth Configuration
NEXTAUTH_URL="https://your-domain.com"
NEXTAUTH_SECRET="your-super-secret-key-min-32-chars"

# Optional: Additional Security
NODE_ENV="production"
```

### Generating NEXTAUTH_SECRET
```bash
# Generate a secure secret
openssl rand -base64 32
```

## 🔧 Platform-Specific Deployments

### Vercel (Recommended)

1. **Connect Repository**
   - Go to [Vercel Dashboard](https://vercel.com/dashboard)
   - Click "New Project"
   - Import your GitHub repository

2. **Configure Environment Variables**
   - In project settings, add all required environment variables
   - Set `NEXTAUTH_URL` to your Vercel domain

3. **Deploy**
   - Vercel automatically deploys on git push
   - Build command: `npm run build`
   - Output directory: `.next`

### Railway

1. **Create New Project**
   ```bash
   # Install Railway CLI
   npm install -g @railway/cli
   
   # Login and deploy
   railway login
   railway init
   railway up
   ```

2. **Add Database**
   - Add MongoDB plugin in Railway dashboard
   - Copy connection string to `DATABASE_URL`

3. **Configure Domain**
   - Set custom domain in Railway settings
   - Update `NEXTAUTH_URL` accordingly

### Docker Deployment

1. **Create Dockerfile**
   ```dockerfile
   FROM node:18-alpine
   
   WORKDIR /app
   
   COPY package*.json ./
   RUN npm ci --only=production
   
   COPY . .
   RUN npm run build
   
   EXPOSE 3000
   
   CMD ["npm", "start"]
   ```

2. **Build and Run**
   ```bash
   # Build image
   docker build -t fitness-app .
   
   # Run container
   docker run -p 3000:3000 --env-file .env fitness-app
   ```

### DigitalOcean App Platform

1. **Create App**
   - Connect GitHub repository
   - Choose Node.js environment

2. **Configure Build**
   - Build command: `npm run build`
   - Run command: `npm start`

3. **Add Database**
   - Create MongoDB cluster
   - Add connection string to environment variables

## 🗄️ Database Setup

### MongoDB Atlas (Recommended)

1. **Create Cluster**
   - Go to [MongoDB Atlas](https://cloud.mongodb.com)
   - Create new cluster (M0 free tier available)

2. **Configure Access**
   - Add IP addresses to whitelist (0.0.0.0/0 for all IPs)
   - Create database user with read/write permissions

3. **Get Connection String**
   ```
   mongodb+srv://<username>:<password>@<cluster>.mongodb.net/<database>
   ```

### Database Migration
```bash
# Push schema to production database
npx prisma db push

# Seed initial data (optional)
npx prisma db seed
```

## 🔒 Security Considerations

### Production Security Checklist

- [ ] Use strong `NEXTAUTH_SECRET` (32+ characters)
- [ ] Enable MongoDB authentication
- [ ] Restrict database IP access
- [ ] Use HTTPS for all connections
- [ ] Set secure cookie settings
- [ ] Enable CORS protection
- [ ] Implement rate limiting
- [ ] Regular security updates

### Environment Security
```env
# Secure cookie settings (automatic in production)
NEXTAUTH_URL="https://your-domain.com"

# Database with authentication
DATABASE_URL="mongodb+srv://user:pass@cluster.mongodb.net/db?retryWrites=true&w=majority"
```

## 📊 Performance Optimization

### Build Optimization
```json
{
  "scripts": {
    "build": "next build",
    "start": "next start -p $PORT"
  }
}
```

### Database Optimization
- Enable MongoDB indexes for frequently queried fields
- Use connection pooling
- Implement query optimization
- Monitor database performance

### CDN and Caching
- Use Vercel's Edge Network (automatic)
- Enable static asset caching
- Implement API response caching
- Use image optimization

## 🔍 Monitoring and Logging

### Error Tracking
```bash
# Add error tracking service
npm install @sentry/nextjs
```

### Performance Monitoring
- Monitor database query performance
- Track API response times
- Monitor user engagement metrics
- Set up uptime monitoring

### Logging
```javascript
// Production logging configuration
console.log('Application started on port:', process.env.PORT || 3000)
```

## 🚨 Troubleshooting

### Common Issues

1. **Database Connection Errors**
   ```bash
   # Check connection string format
   # Verify IP whitelist settings
   # Confirm user permissions
   ```

2. **NextAuth Errors**
   ```bash
   # Verify NEXTAUTH_URL matches deployment URL
   # Check NEXTAUTH_SECRET is set
   # Confirm callback URLs are correct
   ```

3. **Build Failures**
   ```bash
   # Check Node.js version compatibility
   # Verify all dependencies are installed
   # Review build logs for specific errors
   ```

### Debug Commands
```bash
# Check environment variables
printenv | grep NEXTAUTH

# Test database connection
npx prisma db pull

# Validate build
npm run build
```

## 📈 Scaling Considerations

### Horizontal Scaling
- Use load balancers for multiple instances
- Implement session storage (Redis)
- Database read replicas
- CDN for static assets

### Vertical Scaling
- Monitor resource usage
- Optimize database queries
- Implement caching strategies
- Use performance profiling

## 🔄 CI/CD Pipeline

### GitHub Actions Example
```yaml
name: Deploy to Production

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-node@v2
        with:
          node-version: '18'
      - run: npm ci
      - run: npm run build
      - run: npm run test
      - name: Deploy to Vercel
        uses: amondnet/vercel-action@v20
```

## 📞 Support

For deployment issues:
- Check platform-specific documentation
- Review application logs
- Contact platform support
- Create GitHub issue for application-specific problems

---

**Happy Deploying! 🚀**
