# ZEUS — Marketplace (FE prototip)

Vite + React + Tailwind. Single-page prototip: Katalog (PLP) + Detalj (PDP),
rank price switcher, international affiliate (tržište/valuta).

## Lokalni pregled
```bash
npm install
npm run dev      # http://localhost:5173
```

## Auto-deploy (GitHub → Vercel)
Repo `igorpesic/ZEUS` je povezan sa Vercel projektom **zeus_market_place**
(Root Directory: `zeus-marketplace-app`). Svaki `git push` na `main` automatski
okida produkcioni deploy; push na druge grane / PR daje preview deploy.

## Deploy na Vercel (tvoj nalog) — jednom
```bash
npm install -g vercel      # ili: npx vercel
vercel login               # otvori browser, uloguj se kao igorpesic
vercel                     # prati pitanja → Enter na sve (auto-detektuje Vite)
vercel --prod              # (opciono) produkcioni URL
```

## Zaključavanje (samo Igor + Čeda)
Vercel dashboard → projekat **zeus-marketplace** → **Settings → Deployment Protection**
1. **Vercel Authentication** → uključi (Standard Protection). Sad samo ti (ulogovan) vidiš sajt.
2. Za Čedu: **Settings → Deployment Protection → Shareable Links** → *Create Link* →
   pošalji link Čedi. Otvara sajt bez naloga (Hobby = 1 link, traje dok ga ne obrišeš).

> Password Protection (jedna šifra) traži Pro + add-on (~$150/mes) — ne treba nam.
