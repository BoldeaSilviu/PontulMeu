# ⚽ Pontul Meu — Analize Fotbal AI

Aplicație PWA de analize fotbal generate de AI (Claude) cu monetizare freemium.

## 🎯 Funcționalități

### Plan Gratuit
- **1 analiză pe zi**
- 14 ligi + Liga 1 România
- Pronostic 1X2 + scor prezis
- Formă recentă, accidentați, jucători cheie
- Calendar + selector dată

### Plan Premium ($9.99/lună sau $79/an)
- **Analize nelimitate**
- Confruntări Directe (H2H)
- Peste/Sub goluri, BTTS
- Cele Mai Bune Pariuri (Value Bets)
- Cornere, cartonașe, repriza 1
- Concluzia narativă
- Statistici xG
- Și mult mai mult...

---

## 🚀 Ghid Deploy pas cu pas

### Pasul 1: API-Football (19€/lună)

1. Mergi la https://dashboard.api-football.com/register
2. Creează cont (tier **Basic** la 19€/lună e suficient)
3. Activează planul de plată — include **Liga 1 România** + 1000+ ligi
4. Copiază cheia API din dashboard (x-rapidapi-key)
5. Salvează pentru mai târziu — va fi `API_FOOTBALL_KEY`

### Pasul 2: Anthropic (Claude AI)

1. Mergi la https://console.anthropic.com
2. Adaugă credit (minim 5$)
3. Creează cheie API
4. Salvează ca `ANTHROPIC_API_KEY`

### Pasul 3: Vercel Postgres

1. Intră în proiectul tău pe https://vercel.com/dashboard
2. Click pe proiectul `pontul-meu`
3. Tab **Storage** → **Create Database**
4. Alege **Postgres (Neon)** — e gratuit până la 60 ore/lună
5. Numește-l `pontul-meu-db` → Create
6. Automat se conectează — variabilele `POSTGRES_*` se completează

### Pasul 4: JWT Secret

Generează un string aleator de minim 32 caractere:
```bash
openssl rand -base64 32
```

Sau folosește un generator online: https://generate-secret.vercel.app/32

Salvează ca `JWT_SECRET`.

### Pasul 5: Stripe (procesare plăți)

#### 5.1 Cont Stripe
1. Mergi la https://dashboard.stripe.com/register
2. Creează cont cu datele firmei **PDF 33 LLC**
3. Activează contul (poate dura 1-2 zile)
4. **Start Mode: TEST** (să nu cheltui bani până e totul verificat)

#### 5.2 Obține Keys
1. Dashboard → **Developers** → **API keys**
2. Copiază:
   - **Publishable key** (`pk_test_...`) → `STRIPE_PUBLISHABLE_KEY`
   - **Secret key** (`sk_test_...`) → `STRIPE_SECRET_KEY`

#### 5.3 Creează Produsele
1. Dashboard → **Products** → **Add Product**

**Produs 1 — Lunar:**
- Name: `Pontul Meu Premium — Lunar`
- Pricing: **Recurring** · **$9.99 USD** · **Monthly**
- Create product
- Copiază **Price ID** (`price_xxx`) → `STRIPE_PRICE_ID_MONTHLY`

**Produs 2 — Anual:**
- Name: `Pontul Meu Premium — Anual`
- Pricing: **Recurring** · **$79 USD** · **Yearly**
- Create product
- Copiază **Price ID** → `STRIPE_PRICE_ID_YEARLY`

#### 5.4 Configurează Webhook
1. Dashboard → **Developers** → **Webhooks** → **Add endpoint**
2. URL: `https://pontul-meu.vercel.app/api/stripe/webhook`
3. Events (select):
   - `checkout.session.completed`
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_failed`
4. Create
5. Copiază **Signing secret** (`whsec_...`) → `STRIPE_WEBHOOK_SECRET`

### Pasul 6: Upload pe GitHub

1. În GitHub Desktop (sau prin web), deschide repo-ul `BoldeaSilviu/PontulMeu`
2. Șterge toate fișierele vechi (dacă există)
3. Dezarhivează `pontul-meu-v3.zip`
4. Copiază TOATE fișierele în repo (inclusiv `app/`, `lib/`, `public/`)
5. Commit: "Freemium MVP: auth + Stripe + Liga 1 RO"
6. Push

### Pasul 7: Configurează Variabilele pe Vercel

1. Vercel → proiect `pontul-meu` → **Settings** → **Environment Variables**
2. Adaugă toate variabilele din `.env.local.example`:

```
API_FOOTBALL_KEY=xxx
ANTHROPIC_API_KEY=sk-ant-xxx
JWT_SECRET=random_32_chars
STRIPE_SECRET_KEY=sk_test_xxx
STRIPE_PUBLISHABLE_KEY=pk_test_xxx
STRIPE_WEBHOOK_SECRET=whsec_xxx
STRIPE_PRICE_ID_MONTHLY=price_xxx
STRIPE_PRICE_ID_YEARLY=price_xxx
NEXT_PUBLIC_APP_URL=https://pontul-meu.vercel.app
```

(Variabilele `POSTGRES_*` se populează automat când ai creat baza de date la Pasul 3)

### Pasul 8: Redeploy

1. Vercel → proiect → **Deployments**
2. Click pe cel mai recent deploy → **⋯** (3 puncte) → **Redeploy**
3. Așteaptă ~2 minute

### Pasul 9: Test

1. Intră pe https://pontul-meu.vercel.app
2. **Register** → creează cont
3. Vezi că ai 7 zile Premium gratuit în Dashboard
4. Încearcă o analiză
5. Testează upgrade flow cu card-ul de test Stripe: `4242 4242 4242 4242` (data orice viitoare, CVC 123)

### Pasul 10: Trece în Producție (când ești gata)

1. Stripe Dashboard → toggle **Test mode OFF** (sus dreapta)
2. Refă pașii 5.2-5.4 în modul live (vei primi `sk_live_...` și `pk_live_...`)
3. Actualizează variabilele pe Vercel cu cheile live
4. Redeploy

---

## 📁 Structură Cod

```
app/
  api/
    analyze/         — Analiza AI (cu quota)
    auth/            — Register/Login/Logout/Me
    stripe/          — Checkout, Webhook, Portal
    matches/         — API-Football proxy
  components/
    AuthProvider.js  — Context autentificare
    Header.js        — Header cu user badge
  login/             — Pagina login
  register/          — Pagina register
  upgrade/           — Pagina pricing Premium
  dashboard/         — Dashboard utilizator
  termeni/           — Termeni și Condiții (legal)
  confidentialitate/ — Privacy GDPR
  match/[id]/        — Analiza detaliată cu Premium Gates
  page.js            — Home (selectare ligi + calendar)
  layout.js          — Root layout cu AuthProvider

lib/
  db.js              — Schema + queries Postgres
  auth.js            — JWT + bcrypt + cookies
  api-football.js    — Integrare API-Football
```

## 🔒 Securitate

- Parole hash-uite cu **bcrypt** (10 rounds)
- JWT tokens cu expirare 30 zile
- Cookie `httpOnly` + `secure` + `sameSite=lax`
- GDPR compliant (pagina Confidențialitate)
- Stripe webhook signature verification
- Nu stocăm date de carduri (direct la Stripe)

## 💰 Cost Lunar Estimat

| Serviciu | Cost |
|----------|------|
| Vercel (hosting + DB) | Gratuit |
| API-Football Basic | **19€** |
| Anthropic Claude | ~5-20$ (în funcție de volum) |
| Stripe (2.9% + 0.3€ per tranzacție) | Variabil |
| **TOTAL fix** | **~25-40€/lună** |

Pentru a fi profitabil: **minim 2-3 abonați plătitori**.

## 📞 Suport

- Email: contact@pontul-meu.vercel.app
- Operat de: **PDF 33 LLC**
 
