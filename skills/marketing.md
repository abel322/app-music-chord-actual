# 📈 Especialista en Marketing y Growth

## Responsabilidades

- Definir estrategia de adquisición de usuarios
- Crear plan de monetización
- Optimizar conversión
- Branding y naming
- Growth hacking
- Analytics y métricas

## Estrategias de Adquisición

### Canales Orgánicos (Gratis)
1. **SEO (Search Engine Optimization)**
   - Keywords research
   - Content marketing
   - Backlinks
   - Technical SEO

2. **Content Marketing**
   - Blog posts
   - Tutoriales
   - Videos (YouTube)
   - Podcasts

3. **Social Media**
   - Twitter/X (tech community)
   - LinkedIn (B2B)
   - Reddit (niche communities)
   - Product Hunt launch

4. **Community Building**
   - Discord server
   - Slack community
   - Forum/subreddit
   - Newsletter

### Canales Pagados
1. **Google Ads** (Search, Display)
2. **Facebook/Instagram Ads**
3. **LinkedIn Ads** (B2B)
4. **Twitter Ads**
5. **Influencer marketing**

## Modelos de Monetización

### Freemium
- Versión gratuita con límites
- Premium con features avanzadas
- Ejemplo: Notion, Figma, Vercel

### Subscription (SaaS)
- Pago mensual/anual
- Tiers: Basic, Pro, Enterprise
- Ejemplo: Netflix, Spotify, GitHub

### One-time Payment
- Pago único
- Lifetime access
- Ejemplo: Apps móviles, templates

### Usage-based
- Pago por uso
- Escalable con el cliente
- Ejemplo: AWS, Stripe, Twilio

### Marketplace
- Comisión por transacción
- Ejemplo: Airbnb, Uber, Fiverr

## Pricing Strategy

### Ejemplo SaaS
```
Free Tier
- 3 projects
- 100 API calls/day
- Community support
- $0/month

Pro Tier
- Unlimited projects
- 10,000 API calls/day
- Email support
- Advanced analytics
- $29/month

Enterprise
- Custom limits
- Priority support
- SLA guarantee
- Custom integrations
- Contact sales
```

## Landing Page Structure

### Hero Section
- Headline claro (qué problema resuelves)
- Subheadline (cómo lo resuelves)
- CTA principal
- Visual/screenshot

### Social Proof
- Logos de clientes
- Testimonios
- Número de usuarios
- Ratings/reviews

### Features
- 3-5 features principales
- Beneficios, no características
- Iconos + texto breve

### Pricing
- Tabla de precios clara
- Comparación de planes
- FAQ sobre pricing

### CTA Final
- Repetir CTA principal
- Urgencia/escasez (opcional)

## SEO Checklist

- [ ] Title tags optimizados (<60 chars)
- [ ] Meta descriptions (<160 chars)
- [ ] H1, H2, H3 structure
- [ ] Alt text en imágenes
- [ ] URLs amigables
- [ ] Sitemap.xml
- [ ] robots.txt
- [ ] Open Graph tags (social sharing)
- [ ] Schema markup
- [ ] Mobile-friendly
- [ ] Page speed optimizado

## Analytics Setup

### Google Analytics 4
```typescript
// pages/_app.tsx
import { useEffect } from 'react'
import { useRouter } from 'next/router'
import * as gtag from '../lib/gtag'

export default function App({ Component, pageProps }) {
  const router = useRouter()
  
  useEffect(() => {
    const handleRouteChange = (url: string) => {
      gtag.pageview(url)
    }
    router.events.on('routeChangeComplete', handleRouteChange)
    return () => {
      router.events.off('routeChangeComplete', handleRouteChange)
    }
  }, [router.events])

  return <Component {...pageProps} />
}
```

### Event Tracking
```typescript
// Track button clicks
gtag.event({
  action: 'click',
  category: 'CTA',
  label: 'Sign Up Button',
  value: 1
})

// Track conversions
gtag.event({
  action: 'conversion',
  category: 'Purchase',
  label: 'Pro Plan',
  value: 29
})
```

## Growth Metrics (Pirate Metrics - AARRR)

### Acquisition
- Visitors
- Traffic sources
- Cost per acquisition (CPA)

### Activation
- Sign-ups
- Onboarding completion
- Time to first value

### Retention
- Daily/Monthly Active Users (DAU/MAU)
- Churn rate
- Cohort analysis

### Revenue
- Monthly Recurring Revenue (MRR)
- Average Revenue Per User (ARPU)
- Lifetime Value (LTV)

### Referral
- Viral coefficient
- Referral rate
- Net Promoter Score (NPS)

## Launch Checklist

### Pre-Launch
- [ ] Landing page lista
- [ ] Product Hunt profile creado
- [ ] Twitter/X account activo
- [ ] Email list (beta users)
- [ ] Press kit preparado
- [ ] Demo video grabado

### Launch Day
- [ ] Product Hunt launch (00:01 PST)
- [ ] Twitter announcement thread
- [ ] LinkedIn post
- [ ] Reddit posts (relevant subreddits)
- [ ] HackerNews post
- [ ] Email a beta users
- [ ] Responder todos los comentarios

### Post-Launch
- [ ] Agradecer a supporters
- [ ] Recopilar feedback
- [ ] Iterar rápido
- [ ] Publicar case studies
- [ ] Continuar content marketing

## Branding

### Naming Tips
- Corto y memorable
- Fácil de pronunciar
- .com disponible
- No trademark conflicts
- Evitar números y guiones

### Brand Voice
- Profesional pero accesible
- Claro y directo
- Consistente en todos los canales

### Visual Identity
- Logo simple y escalable
- Paleta de colores (2-3 colores principales)
- Tipografía consistente
- Iconografía coherente

## Email Marketing

### Welcome Email
```
Subject: Welcome to [Product]! 🎉

Hi [Name],

Thanks for signing up! Here's how to get started:

1. [First step]
2. [Second step]
3. [Third step]

Need help? Reply to this email.

[Your Name]
[Product] Team
```

### Onboarding Sequence
- Day 0: Welcome + quick start
- Day 2: Feature highlight #1
- Day 5: Feature highlight #2
- Day 7: Success stories
- Day 14: Upgrade to Pro

## A/B Testing

### What to Test
- Headlines
- CTA buttons (text, color, position)
- Pricing
- Images
- Form fields
- Email subject lines

### Tools
- Google Optimize
- Vercel Edge Config
- PostHog
- Optimizely

## Métricas de Éxito

- ✅ 1,000 visitors/month (mes 1)
- ✅ 100 sign-ups (mes 1)
- ✅ 10 paying customers (mes 2)
- ✅ $1,000 MRR (mes 3)
- ✅ Product Hunt top 5
- ✅ 50% activation rate
- ✅ <5% monthly churn
