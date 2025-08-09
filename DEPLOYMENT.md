# QuizWise Deployment Guide

This guide covers deploying QuizWise to various platforms and environments.

## 🔧 Prerequisites

1. **Node.js 16+** and npm
2. **Firebase CLI** installed globally
3. **Git** for version control
4. **Domain** (for production deployment)

## 🚀 Deployment Options

### Option 1: Firebase Hosting (Recommended)

Firebase Hosting provides fast, secure hosting with automatic SSL and global CDN.

#### Setup

1. **Install Firebase CLI**
   ```bash
   npm install -g firebase-tools
   ```

2. **Login to Firebase**
   ```bash
   firebase login
   ```

3. **Initialize Firebase in your project**
   ```bash
   firebase init
   ```
   - Select Hosting, Firestore, and Authentication
   - Choose your Firebase project
   - Set public directory to current directory (.)
   - Configure as single-page app: Yes
   - Overwrite index.html: No

4. **Deploy**
   ```bash
   firebase deploy
   ```

#### Custom Domain

1. In Firebase Console, go to Hosting
2. Click "Add custom domain"
3. Follow the DNS configuration steps
4. Wait for SSL certificate provisioning

### Option 2: Netlify

Perfect for static site deployment with form handling and edge functions.

#### Setup

1. **Connect Repository**
   - Sign up at [Netlify](https://netlify.com)
   - Connect your GitHub repository
   - Set build command: `npm run build`
   - Set publish directory: `dist`

2. **Environment Variables**
   - Add Firebase configuration variables
   - Set API keys for AI services

3. **Deploy**
   - Automatic deployment on git push
   - Branch previews available

### Option 3: Vercel

Excellent for frontend applications with serverless functions.

#### Setup

1. **Install Vercel CLI**
   ```bash
   npm install -g vercel
   ```

2. **Deploy**
   ```bash
   vercel
   ```

3. **Configure**
   - Add environment variables in Vercel dashboard
   - Configure custom domain

### Option 4: Traditional Web Hosting

For shared hosting or VPS deployment.

#### Requirements
- Web server (Apache/Nginx)
- PHP 7.4+ or Node.js support
- SSL certificate
- Domain name

#### Steps

1. **Build the project**
   ```bash
   npm run build
   ```

2. **Upload files**
   - Upload all files to web root
   - Ensure `.htaccess` rules for SPA routing

3. **Configure web server**
   - Set up URL rewriting
   - Configure SSL certificate
   - Set security headers

## 🔐 Environment Configuration

### Firebase Configuration

Create environment-specific configs:

**Development (`firebase-config.dev.js`):**
```javascript
const firebaseConfig = {
    apiKey: "dev-api-key",
    authDomain: "quizwise-dev.firebaseapp.com",
    projectId: "quizwise-dev",
    // ... other config
};
```

**Production (`firebase-config.prod.js`):**
```javascript
const firebaseConfig = {
    apiKey: "prod-api-key",
    authDomain: "quizwise.firebaseapp.com",
    projectId: "quizwise-prod",
    // ... other config
};
```

### Environment Variables

Set the following environment variables:

```bash
# Firebase
FIREBASE_API_KEY=your_firebase_api_key
FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
FIREBASE_PROJECT_ID=your_project_id

# AI Services
OPENAI_API_KEY=your_openai_api_key
ANTHROPIC_API_KEY=your_anthropic_api_key

# Analytics
GOOGLE_ANALYTICS_ID=G-XXXXXXXXXX

# Domain
DOMAIN_URL=https://your-domain.com
```

## 🔒 Security Configuration

### Firestore Security Rules

Deploy security rules:

```bash
firebase deploy --only firestore:rules
```

### Authentication Settings

1. **Configure OAuth providers**
   - Google Sign-In
   - GitHub (optional)
   - Microsoft (optional)

2. **Set authorized domains**
   - localhost (development)
   - your-domain.com (production)

3. **Email verification**
   - Enable email verification
   - Customize email templates

### Content Security Policy

Add CSP headers for security:

```html
<meta http-equiv="Content-Security-Policy" content="
    default-src 'self';
    script-src 'self' 'unsafe-inline' https://www.gstatic.com https://cdn.jsdelivr.net;
    style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://cdn.jsdelivr.net;
    font-src 'self' https://fonts.gstatic.com;
    img-src 'self' data: https:;
    connect-src 'self' https://*.googleapis.com https://*.firebaseapp.com;
">
```

## 📊 Performance Optimization

### Pre-deployment Checklist

- [ ] Minify CSS and JavaScript
- [ ] Optimize images
- [ ] Enable gzip compression
- [ ] Set cache headers
- [ ] Run Lighthouse audit
- [ ] Test mobile responsiveness

### Build Optimization

```bash
# Production build
npm run build

# Analyze bundle size
npm run analyze

# Run security audit
npm run security

# Performance testing
npm run lighthouse
```

### CDN Configuration

Configure CDN for static assets:

1. **Firebase Hosting**: Automatic global CDN
2. **Cloudflare**: Additional caching and security
3. **AWS CloudFront**: For AWS deployments

## 🧪 Testing & Validation

### Pre-deployment Testing

```bash
# Run linting
npm run lint

# Run tests
npm test

# Validate HTML
npm run validate

# Check bundle sizes
npm run analyze
```

### Post-deployment Testing

1. **Functionality Testing**
   - User registration/login
   - Quiz taking flow
   - AI quiz generation
   - Leaderboard updates
   - Offline functionality

2. **Performance Testing**
   - Page load times
   - Time to interactive
   - First contentful paint
   - Mobile performance

3. **Security Testing**
   - HTTPS enforcement
   - XSS protection
   - CSRF protection
   - API endpoint security

## 📱 PWA Configuration

### Service Worker

Ensure service worker is properly configured:

```javascript
// Check if service worker is registered
if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('/service-worker.js');
}
```

### App Install Banner

Configure install prompt:

```javascript
// Install prompt handling
let deferredPrompt;
window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPrompt = e;
    showInstallButton();
});
```

## 🚨 Monitoring & Analytics

### Error Tracking

Implement error tracking:

```javascript
// Basic error tracking
window.addEventListener('error', (event) => {
    console.error('Global error:', event.error);
    // Send to error tracking service
});
```

### Analytics Setup

1. **Google Analytics 4**
   - Track user interactions
   - Monitor quiz completion rates
   - Analyze user flow

2. **Firebase Analytics**
   - User engagement metrics
   - Custom events tracking
   - Audience insights

3. **Performance Monitoring**
   - Core Web Vitals
   - API response times
   - Error rates

## 🔄 CI/CD Pipeline

### GitHub Actions

Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy to Firebase Hosting

on:
  push:
    branches: [ main ]

jobs:
  build_and_deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      
      - name: Setup Node.js
        uses: actions/setup-node@v2
        with:
          node-version: '16'
          
      - name: Install dependencies
        run: npm ci
        
      - name: Run tests
        run: npm test
        
      - name: Build
        run: npm run build
        
      - name: Deploy to Firebase
        uses: FirebaseExtended/action-hosting-deploy@v0
        with:
          repoToken: '${{ secrets.GITHUB_TOKEN }}'
          firebaseServiceAccount: '${{ secrets.FIREBASE_SERVICE_ACCOUNT }}'
          projectId: your-project-id
```

## 🆘 Troubleshooting

### Common Issues

1. **Firebase Auth Issues**
   - Check authorized domains
   - Verify API keys
   - Check browser console for errors

2. **Firestore Permission Denied**
   - Review security rules
   - Check user authentication
   - Verify document structure

3. **Service Worker Issues**
   - Clear browser cache
   - Check service worker registration
   - Verify HTTPS requirement

4. **Performance Issues**
   - Optimize images
   - Minimize JavaScript bundles
   - Enable compression
   - Use CDN for static assets

### Debug Mode

Enable debug logging:

```javascript
// Firebase debug mode
firebase.firestore().enableNetwork();
firebase.auth().settings.appVerificationDisabledForTesting = true;
```

## 📞 Support

For deployment issues:

- **Documentation**: [Firebase Docs](https://firebase.google.com/docs)
- **Community**: [Stack Overflow](https://stackoverflow.com/questions/tagged/firebase)
- **GitHub Issues**: [Project Issues](https://github.com/your-username/quizwise/issues)

---

**Ready to deploy your QuizWise application! 🚀**
