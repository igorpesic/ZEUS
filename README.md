# ZEUS

Platforma za **Zepter International**: luksuzni members club + globalni marketplace + MLM earning network. Tri produkt-pillara u jednoj platformi.

**Faza:** planiranje i definicija scope-a.
**Tim:** Igor (UX/UI + Product Lead) · Čeda (Software Architect + QA).

## Struktura repoa

```
ZEUS/
├── docs/                  # Specovi, dijagrami, research, Council review-ovi
│   ├── ZEUS-Master-Brief.md
│   ├── ZEUS-Ground-Zero-Plan.md
│   ├── ZEUS-Zepter-Research.md
│   ├── ZEUS-Commission-Engine-Spec.md
│   ├── ZEUS-Calculation-Engine-Spec.md
│   ├── ZEUS-Council-Review-01-Whole-Project.md
│   ├── ZEUS-Council-Review-02-Calculation-Engine.md
│   ├── ZEUS-Pitanja-za-Cedu-VERIFY.md
│   ├── ZEUS-Figma-Redesign-Prompt.md
│   ├── ZEUS-Gap-Analiza.docx
│   └── *.svg              # Arhitekturni dijagrami (stakeholder + engineering)
├── prototypes/            # Standalone UI prototipovi
│   ├── ZEUS-Marketplace.jsx
│   ├── ZEUS-GodMode-Panel.jsx
│   ├── ZEUS-CrossBorder-Network.jsx
│   └── dashboard.html
├── zeus-marketplace-app/  # Deployable aplikacija (Vite + React + Tailwind, Vercel)
├── memory/                # Projektna memorija (kontekst, glosar, ljudi)
└── CLAUDE.md              # Instrukcije / radna memorija
```

## Aplikacija

```bash
cd zeus-marketplace-app
npm install
npm run dev
```

Build: `npm run build` → `dist/`. Deploy preko Vercela (`zeus_market_place`).
