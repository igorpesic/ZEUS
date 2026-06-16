import { useState, useMemo } from "react";
import {
  Search, ShoppingBag, ChevronDown, ChevronLeft, ChevronRight, Star, Check, Lock,
  Heart, MapPin, User, LayoutGrid, Truck, Store, Gift, Info, ShieldCheck,
  Wind, Droplet, ChefHat, HeartPulse, Sparkle, Home, Glasses, FlaskConical,
  Gem, Crown, Tag,
} from "lucide-react";

// ──────────────────────────────────────────────────────────────
// ZEUS — Marketplace · FE prototip (mock podaci)
// Bazirano na Zepter 2023 dizajnu (BizzClub), modernizovan UX/UI.
// Katalog (PLP) + Detalj proizvoda (PDP).
//
// CENE PO RANGU (ZEUS nadogradnja BizzClub logike):
//   • default = GOST → "MP Cena" + teaser "BizzClub · do −40%"
//   • rank switcher gore menja aktivni rang → cene se preračunavaju uživo
//   • PDP ima punu tabelu cena za svaki rang
// Popusti po rangu su config-driven (mock, lako izmenljivo).
//
// INTERNATIONAL AFFILIATE: lokacija/valuta (Srbija ▾) lokalizuje cenu.
// Affiliate link prepoznaje lokaciju kupca → cena/valuta tog tržišta.
// FX su MOCK (ilustrativni). Bazna cena = RSD.
// ──────────────────────────────────────────────────────────────

// Zepter brand paleta (modernizovano)
const BRAND = "#0E4DA4";   // Zepter plava
const NAVY = "#13315C";    // CTA dugmad
const AMBER = "#F5B72E";   // žuti akcenat (search, hex badge)
const SKY = "#EAF2FC";     // svetli plavi tint
const SKY2 = "#D3E6FA";
const BIZZ = "#1769C0";    // BizzClub plava
const INK = "#15202B";

// Rangovi (config) — Gost + BizzClub lestvica. Popust do −40%.
const RANKS = [
  { key: "guest", name: "Gost", short: "Gost", discount: 0.0, mlm: false },
  { key: "member", name: "BizzClub Member", short: "Member", discount: 0.05, mlm: false },
  { key: "cc", name: "Club Consultant", short: "CC", discount: 0.2, mlm: true },
  { key: "tm", name: "Team Manager", short: "TM", discount: 0.28, mlm: true },
  { key: "sm", name: "Sales Manager", short: "SM", discount: 0.34, mlm: true },
  { key: "dm", name: "District Manager", short: "DM", discount: 0.4, mlm: true },
];
const MAX_DISCOUNT = Math.max(...RANKS.map((r) => r.discount)); // 0.40

// Tržišta (international affiliate) — FX mock, baza = RSD
const MARKETS = {
  RS: { flag: "🇷🇸", name: "Srbija", cur: "RSD", code: "RSD", fx: 1, pos: "post" },
  EU: { flag: "🇪🇺", name: "Eurozona", cur: "€", code: "EUR", fx: 1 / 117, pos: "pre" },
  US: { flag: "🇺🇸", name: "USA", cur: "$", code: "USD", fx: 1.08 / 117, pos: "pre" },
  BR: { flag: "🇧🇷", name: "Brazil", cur: "R$", code: "BRL", fx: 5.4 / 117, pos: "pre" },
};

const NAV = ["Početna", "Promocije", "Zepter Svet", "Outlet", "Marketplace", "BizzClub"];

const CATS = [
  { key: "all", label: "Svi proizvodi", icon: LayoutGrid },
  { key: "bioptron", label: "Bioptron terapija", icon: HeartPulse },
  { key: "naocare", label: "Pametne naočare", icon: Glasses },
  { key: "kuhinja", label: "Kuvanje", icon: ChefHat },
  { key: "vazduh", label: "Zdrav vazduh", icon: Wind },
  { key: "voda", label: "Prečišćena voda", icon: Droplet },
  { key: "dom", label: "Zdrav dom", icon: Home },
  { key: "lepota", label: "Prirodna lepota", icon: Sparkle },
  { key: "luksuz", label: "Luksuz i stil", icon: Gem },
];

// Mock katalog — nazivi/cene iz 2023 dizajna (RSD). mp = MP/gost cena.
const PRODUCTS = [
  { id: 1, name: "Bioptron 2", line: "Bioptron hipersvetlosna terapija", cat: "bioptron", sku: "PAG-880-SET", mp: 1357236, promo: 0.1, rating: 4.9, reviews: 214, hue: 205, tag: "Medical", blurb: "BIOPTRON® 2 uređaj za terapiju svetlošću dizajniran za upotrebu od strane zdravstvenih stručnjaka. Kontrolna ploča omogućava tretmane do 95 minuta u jednominutnim koracima.", specs: [["Primena", "Profesionalni medicinski uređaj"], ["Bruto težina", "15.56 kg"], ["Neto težina", "13.27 kg"], ["Boja", "Bela"], ["Nominalna snaga halogena", "90 W"], ["Stepen polarizacije", ">95% (590–1550 nm)"], ["Talasna dužina", "480–3400 nm"], ["Napon", "100–240 V~, 50/60 Hz"]] },
  { id: 2, name: "Bioptron Pro 1 kolor", line: "Bioptron kolor terapija", cat: "bioptron", sku: "PAG-990", mp: 305738, promo: 0.1, rating: 4.8, reviews: 167, hue: 38, tag: "Kolor", blurb: "Bioptron Pro 1 sa setom kolor filtera za hromoterapiju. Stoni model sa stalkom, idealan za kućnu i profesionalnu upotrebu.", specs: [["Primena", "Svetlosna + kolor terapija"], ["Filteri", "7 boja"], ["Boja", "Bela"], ["Garancija", "5 godina"]] },
  { id: 3, name: "Bioptron Medall sa stalkom", line: "Bioptron kolor terapija", cat: "bioptron", sku: "PAG-960-SET", mp: 164138, rating: 4.7, reviews: 98, hue: 42, tag: null, blurb: "Kompaktni Bioptron Medall sa podnim stalkom za udoban tretman celog tela.", specs: [["Primena", "Svetlosna terapija"], ["Stalak", "Podni, podesiv"], ["Boja", "Bela"]] },
  { id: 4, name: "Bioptron Medall", line: "Bioptron hipersvetlosna terapija", cat: "bioptron", sku: "PAG-960", mp: 152338, rating: 4.8, reviews: 156, hue: 40, tag: "Bestseller", blurb: "Prenosivi Bioptron Medall — hiper-svetlosna terapija u dlanu. Za svakodnevnu negu kože i oporavak.", specs: [["Primena", "Prenosiva terapija"], ["Težina", "0.45 kg"], ["Boja", "Bela/crna"]] },
  { id: 5, name: "AqueenaPRO", line: "Prečišćena voda", cat: "voda", sku: "WT-100", mp: 170156, promo: 0.1, rating: 4.7, reviews: 138, hue: 195, tag: null, blurb: "Reverzna osmoza sa mineralizacijom. Do 7 litara čiste vode na sat, kompaktni dizajn za kuhinjski pult.", specs: [["Tehnologija", "Reverzna osmoza"], ["Kapacitet", "7 L/h"], ["Filteri", "5 stepeni"]] },
  { id: 6, name: "EdelWasser Gold", line: "Prečišćena voda", cat: "voda", sku: "PWC-870-GOLD", mp: 83898, rating: 4.6, reviews: 91, hue: 45, tag: "Gold", blurb: "Luksuzni prečišćivač vode u zlatnoj završnici. Vrhunska filtracija i elegantan dizajn.", specs: [["Tehnologija", "Multi-filtracija"], ["Završnica", "Gold"], ["Slavina", "3 izvoda"]] },
  { id: 7, name: "HyperLight Eyewear Clips", line: "Pametne naočare", cat: "naocare", sku: "EC-536", mp: 63012, rating: 4.6, reviews: 142, hue: 30, tag: null, blurb: "Hyperlight Eyewear naočare pružaju aktivnu hiper-svetlosnu terapiju koja održava i revitalizuje korisnika na kvantnom nivou.", specs: [["Tip", "Clip-on terapija"], ["Sočiva", "Hiper-svetlosna"], ["Težina", "28 g"]] },
  { id: 8, name: "MyionZ PRO", line: "Zdrav vazduh", cat: "vazduh", sku: "ION-03", mp: 21830, rating: 4.5, reviews: 73, hue: 200, tag: "App", blurb: "Lični jonizator vazduha sa app kontrolom. Nosiv, tih, anti-alergeno čist vazduh u tvojoj zoni.", specs: [["Tip", "Nosivi jonizator"], ["Kontrola", "Mobilna aplikacija"], ["Baterija", "12 h"]] },
  { id: 9, name: "Therapy Air iON", line: "Zdrav vazduh", cat: "vazduh", sku: "TAI-01", mp: 150930, promo: 0.1, rating: 4.9, reviews: 204, hue: 205, tag: "Bestseller", blurb: "6-stepena filtracija sa jonizacijom i mirisnom komorom. Tih rad za prostore do 100 m².", specs: [["Filtracija", "6 stepeni"], ["Pokrivenost", "do 100 m²"], ["Nivo buke", "od 24 dB"]] },
  { id: 10, name: "ArtMix PRO", line: "Kuvanje na zdrav način", cat: "kuhinja", sku: "B-002", mp: 84134, rating: 4.7, reviews: 128, hue: 18, tag: null, blurb: "Profesionalni blender velike snage za smutije, supe i hladne deserte. Vakuum opcija za očuvanje nutrijenata.", specs: [["Snaga", "1500 W"], ["Zapremina", "2 L"], ["Vakuum", "Da"]] },
  { id: 11, name: "Zepresso Mondrian", line: "Kuvanje na zdrav način", cat: "kuhinja", sku: "ZEP-300M", mp: 30562, rating: 4.6, reviews: 64, hue: 8, tag: "Dizajn", blurb: "Aparat za espresso u kultnom Mondrian dizajnu. Kompaktan, brz, savršena krema.", specs: [["Pritisak", "19 bar"], ["Rezervoar", "1 L"], ["Dizajn", "Mondrian edicija"]] },
  { id: 12, name: "TuttoSteamy Gold", line: "Kuvanje na zdrav način", cat: "kuhinja", sku: "PWC-301", mp: 94400, promo: 0.1, rating: 4.8, reviews: 176, hue: 44, tag: "Gold", blurb: "Set posuđa za kuvanje na pari bez vode i masti. Hirurški čelik 18/10 sa zlatnim detaljima.", specs: [["Materijal", "Čelik 18/10"], ["Elemenata", "9"], ["Indukcija", "Da"]] },
  { id: 13, name: "VacSy Čuvar hrane", line: "Zdrav dom", cat: "dom", sku: "VS-220", mp: 28900, rating: 4.5, reviews: 88, hue: 120, tag: null, blurb: "Vakuum sistem za čuvanje sveže hrane do 5x duže. Set posuda raznih veličina.", specs: [["Tip", "Vakuum posude"], ["Set", "8 elemenata"], ["Materijal", "BPA-free"]] },
  { id: 14, name: "Luxury Overdose Parfem", line: "Prirodna lepota", cat: "lepota", sku: "LO-050", mp: 18600, rating: 4.7, reviews: 119, hue: 330, tag: "Novo", blurb: "Intenzivan orijentalni parfem iz Zepter kolekcije. Duboke note ambre i vanile.", specs: [["Zapremina", "50 ml"], ["Tip", "Eau de Parfum"], ["Note", "Ambra, vanila"]] },
  { id: 15, name: "Home Art Servis", line: "Luksuz i stil", cat: "luksuz", sku: "HA-06", mp: 65520, rating: 4.8, reviews: 54, hue: 220, tag: null, blurb: "Porcelanski stoni servis ručno dekorisan plavim dezenom. Set za 6 osoba.", specs: [["Materijal", "Porcelan"], ["Set", "Za 6 osoba"], ["Dekor", "Ručni"]] },
  { id: 16, name: "Masterpiece Z-Pot 5L", line: "Kuvanje na zdrav način", cat: "kuhinja", sku: "MP-5L", mp: 104200, promo: 0.1, rating: 4.9, reviews: 402, hue: 25, tag: "Bestseller", blurb: "Kuvanje bez vode i masti. Hirurški čelik 18/10, termo-akumulacioni sloj za ravnomernu toplotu.", specs: [["Zapremina", "5 L"], ["Materijal", "Čelik 18/10"], ["Termo sloj", "Da"]] },
];

// ── Helpers ───────────────────────────────────────────────────
const rankByKey = (k) => RANKS.find((r) => r.key === k) || RANKS[0];
const pct = (d) => Math.round(d * 100);

function fmt(rsd, market) {
  const m = MARKETS[market];
  const v = rsd * m.fx;
  const rounded = m.code === "RSD" ? Math.round(v) : Math.round(v);
  const s = rounded.toLocaleString("de-DE");
  return m.pos === "pre" ? `${m.cur}${s}` : `${s} ${m.cur}`;
}

// ── App ───────────────────────────────────────────────────────
export default function ZeusMarketplace() {
  const [rank, setRank] = useState("guest");
  const [market, setMarket] = useState("RS");
  const [cat, setCat] = useState("all");
  const [query, setQuery] = useState("");
  const [view, setView] = useState({ page: "plp", id: null });
  const [cart, setCart] = useState(0);
  const [wish, setWish] = useState(() => new Set());
  const [toast, setToast] = useState("");

  const active = rankByKey(rank);

  const list = useMemo(() =>
    PRODUCTS.filter((p) => cat === "all" || p.cat === cat)
      .filter((p) => (p.name + p.line).toLowerCase().includes(query.toLowerCase())),
    [cat, query]);

  const addToCart = (p) => {
    setCart((c) => (typeof c === "number" ? { n: 1, total: priceFor(p, active) } : { n: c.n + 1, total: c.total + priceFor(p, active) }));
    setToast(`Dodato u korpu: ${p.name}`);
    setTimeout(() => setToast(""), 1900);
  };
  const toggleWish = (id) => setWish((s) => { const n = new Set(s); n.has(id) ? n.delete(id) : n.add(id); return n; });

  const cartN = typeof cart === "number" ? 0 : cart.n;
  const cartSum = typeof cart === "number" ? 0 : cart.total;
  const product = view.id ? PRODUCTS.find((p) => p.id === view.id) : null;

  return (
    <div style={{ background: "#FBFCFE", color: INK }} className="min-h-screen font-sans antialiased">
      <Header
        rank={rank} setRank={setRank} active={active}
        market={market} setMarket={setMarket}
        query={query} setQuery={setQuery}
        cartN={cartN} cartSum={cartSum} wishN={wish.size}
        onHome={() => setView({ page: "plp", id: null })}
      />

      {view.page === "plp" ? (
        <PLP
          list={list} cat={cat} setCat={setCat} active={active} market={market}
          wish={wish} toggleWish={toggleWish}
          open={(id) => { setView({ page: "pdp", id }); window.scrollTo(0, 0); }}
          add={addToCart}
        />
      ) : (
        <PDP
          product={product} active={active} rank={rank} setRank={setRank} market={market}
          wish={wish} toggleWish={toggleWish}
          back={() => setView({ page: "plp", id: null })}
          open={(id) => { setView({ page: "pdp", id }); window.scrollTo(0, 0); }}
          add={addToCart}
        />
      )}

      <Footer />

      {toast && (
        <div className="fixed bottom-6 left-1/2 z-50 flex -translate-x-1/2 items-center gap-2 rounded-full px-5 py-3 text-sm text-white shadow-xl" style={{ background: NAVY }}>
          <Check size={16} style={{ color: AMBER }} /> {toast}
        </div>
      )}
    </div>
  );
}

const priceFor = (p, active) => p.mp * (1 - active.discount);

// ── Header ────────────────────────────────────────────────────
function Header({ rank, setRank, active, market, setMarket, query, setQuery, cartN, cartSum, wishN, onHome }) {
  return (
    <header className="sticky top-0 z-40">
      {/* Row 1 — utility */}
      <div className="border-b border-black/5 bg-white/90 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center gap-3 px-5 py-3">
          <button onClick={onHome} className="flex shrink-0 items-center gap-2">
            <span className="grid h-9 w-9 place-items-center rounded-lg text-white" style={{ background: BRAND }}>
              <Crown size={18} style={{ color: AMBER }} />
            </span>
            <span className="text-[19px] font-bold tracking-tight" style={{ color: BRAND }}>ZEUS</span>
          </button>

          <MarketPicker market={market} setMarket={setMarket} />

          <div className="relative hidden flex-1 md:block">
            <Search size={17} className="absolute left-4 top-1/2 -translate-y-1/2 text-black/30" />
            <input
              value={query} onChange={(e) => setQuery(e.target.value)}
              placeholder="Pretražite sve na Zepteru online i u prodavnici"
              className="w-full rounded-full border border-black/10 bg-[#F4F7FB] py-2.5 pl-11 pr-28 text-sm outline-none transition focus:border-[#0E4DA4]/40 focus:bg-white"
            />
            <button className="absolute right-1.5 top-1/2 flex -translate-y-1/2 items-center gap-1.5 rounded-full px-4 py-1.5 text-sm font-semibold" style={{ background: AMBER, color: NAVY }}>
              <Search size={14} /> Pretraga
            </button>
          </div>

          <button className="hidden items-center gap-2 rounded-lg px-2.5 py-1.5 text-sm text-black/70 hover:bg-black/[0.03] lg:flex">
            <span className="relative">
              <Heart size={19} />
              {wishN > 0 && <span className="absolute -right-1.5 -top-1.5 grid h-4 min-w-4 place-items-center rounded-full px-1 text-[10px] font-bold text-white" style={{ background: BRAND }}>{wishN}</span>}
            </span>
            <span className="leading-tight"><span className="block text-[11px] text-black/40">Vaša</span>lista želja</span>
          </button>

          <button className="hidden items-center gap-2 rounded-lg px-2.5 py-1.5 text-sm text-black/70 hover:bg-black/[0.03] lg:flex">
            <User size={19} />
            <span className="leading-tight"><span className="block text-[11px] text-black/40">Prijavite se na</span>moj nalog</span>
          </button>

          <button className="flex items-center gap-2 rounded-full border border-black/10 py-1.5 pl-2.5 pr-3.5">
            <span className="relative">
              <ShoppingBag size={19} style={{ color: BRAND }} />
              {cartN > 0 && <span className="absolute -right-1.5 -top-1.5 grid h-4 min-w-4 place-items-center rounded-full px-1 text-[10px] font-bold text-white" style={{ background: AMBER, color: NAVY }}>{cartN}</span>}
            </span>
            <span className="text-sm font-semibold">{fmt(cartSum, market)}</span>
          </button>
        </div>
      </div>

      {/* Row 2 — primary nav */}
      <div className="border-b border-black/5" style={{ background: SKY }}>
        <div className="mx-auto flex max-w-7xl items-center gap-1 px-5">
          <button className="my-2 mr-2 flex items-center gap-2 rounded-lg px-3.5 py-2 text-sm font-semibold text-white" style={{ background: NAVY }}>
            <LayoutGrid size={16} /> Sve kategorije
          </button>
          <nav className="flex items-center gap-1 overflow-x-auto">
            {NAV.map((n, i) => (
              <button key={n} className="shrink-0 rounded-lg px-3 py-2 text-sm font-medium transition hover:bg-white"
                style={i === 4 ? { color: BRAND, fontWeight: 600 } : { color: "rgba(0,0,0,0.7)" }}>
                {n}
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Row 3 — ZEUS rank price switcher */}
      <div className="border-b border-black/5 bg-white/90 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center gap-3 overflow-x-auto px-5 py-2">
          <span className="flex shrink-0 items-center gap-1.5 text-xs font-medium text-black/45">
            <Tag size={13} style={{ color: BRAND }} /> Prikaz cena za:
          </span>
          <div className="flex gap-1.5">
            {RANKS.map((r) => {
              const on = r.key === rank;
              return (
                <button key={r.key} onClick={() => setRank(r.key)}
                  className="flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition"
                  style={on ? { background: BRAND, color: "#fff", borderColor: BRAND } : { background: "#fff", color: INK, borderColor: "rgba(0,0,0,0.1)" }}>
                  {r.mlm && <Crown size={12} style={{ color: on ? AMBER : "rgba(0,0,0,0.3)" }} />}
                  {r.short}
                  {r.discount > 0 && <span className="font-bold" style={{ color: on ? AMBER : BIZZ }}>−{pct(r.discount)}%</span>}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </header>
  );
}

function MarketPicker({ market, setMarket }) {
  const [open, setOpen] = useState(false);
  const m = MARKETS[market];
  return (
    <div className="relative shrink-0">
      <button onClick={() => setOpen((o) => !o)} className="flex items-center gap-1.5 rounded-full border border-black/10 py-2 pl-2.5 pr-2.5 text-sm">
        <MapPin size={15} style={{ color: BRAND }} />
        <span className="hidden font-medium sm:inline">{m.name}</span>
        <span className="sm:hidden">{m.flag}</span>
        <ChevronDown size={14} className="text-black/40" />
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute left-0 z-20 mt-2 w-60 overflow-hidden rounded-xl border border-black/10 bg-white shadow-xl">
            <div className="px-3 py-2 text-[11px] font-semibold uppercase tracking-wide text-black/40">Tržište / valuta</div>
            {Object.entries(MARKETS).map(([k, v]) => (
              <button key={k} onClick={() => { setMarket(k); setOpen(false); }} className="flex w-full items-center justify-between px-3 py-2.5 text-sm hover:bg-black/[0.03]">
                <span className="flex items-center gap-2.5"><span>{v.flag}</span> {v.name}</span>
                <span className="flex items-center gap-2 text-black/40">{v.code}{k === market && <Check size={14} style={{ color: BRAND }} />}</span>
              </button>
            ))}
            <div className="flex items-start gap-2 border-t border-black/5 px-3 py-2.5 text-[11px] leading-snug text-black/45">
              <ShieldCheck size={13} className="mt-px shrink-0" style={{ color: BRAND }} />
              Affiliate link automatski prepoznaje lokaciju kupca i prikazuje cenu te zemlje.
            </div>
          </div>
        </>
      )}
    </div>
  );
}

// ── Shared: price block & tile ────────────────────────────────
function ProductTile({ p, className = "", iconSize = 60 }) {
  const Icon = CATS.find((c) => c.key === p.cat)?.icon || Sparkle;
  return (
    <div className={`relative grid place-items-center overflow-hidden bg-white ${className}`}>
      <div className="absolute h-[62%] w-[62%] rounded-full" style={{ background: `radial-gradient(circle at 38% 32%, ${SKY}, ${SKY2})` }} />
      <Icon size={iconSize} strokeWidth={1.1} style={{ color: BRAND, opacity: 0.78 }} className="relative" />
    </div>
  );
}

function HexBadge({ label }) {
  return (
    <span className="grid h-10 w-9 place-items-center text-[11px] font-bold leading-none text-white"
      style={{ background: AMBER, color: NAVY, clipPath: "polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)" }}>
      {label}
    </span>
  );
}

function PriceBlock({ p, active, market, size = "card" }) {
  const isGuest = active.key === "guest";
  const big = size === "pdp";
  const guestPrice = p.promo ? p.mp * (1 - p.promo) : p.mp;
  const rankPrice = p.mp * (1 - active.discount);

  if (isGuest) {
    return (
      <div>
        <div className="text-[11px] font-medium uppercase tracking-wide text-black/40">MP Cena</div>
        <div className="flex items-baseline gap-2">
          <div className={big ? "text-[28px] font-bold leading-tight" : "text-lg font-bold"}>{fmt(guestPrice, market)}</div>
          {p.promo && <span className="text-sm text-black/35 line-through">{fmt(p.mp, market)}</span>}
        </div>
        <div className="mt-1.5 flex items-center gap-1.5">
          <span className="text-sm font-bold" style={{ color: BIZZ }}>BizzClub</span>
          <span className="text-xs text-black/55">Učlanite se i kupite <strong style={{ color: BIZZ }}>do −{pct(MAX_DISCOUNT)}%</strong></span>
        </div>
      </div>
    );
  }
  return (
    <div>
      <div className="text-[11px] font-medium uppercase tracking-wide" style={{ color: BIZZ }}>{active.name} cena</div>
      <div className="flex items-baseline gap-2">
        <div className={big ? "text-[28px] font-bold leading-tight" : "text-lg font-bold"} style={{ color: BRAND }}>{fmt(rankPrice, market)}</div>
        <span className="text-sm text-black/35 line-through">{fmt(p.mp, market)}</span>
        <span className="rounded-md px-1.5 py-0.5 text-[11px] font-bold text-white" style={{ background: BRAND }}>−{pct(active.discount)}%</span>
      </div>
      <div className="mt-1 text-xs text-black/45">Cena za tvoj rang u mreži</div>
    </div>
  );
}

// ── PLP ───────────────────────────────────────────────────────
function PLP({ list, cat, setCat, active, market, wish, toggleWish, open, add }) {
  const activeCat = CATS.find((c) => c.key === cat);
  return (
    <main className="mx-auto max-w-7xl px-5 pb-20">
      {/* Hero */}
      <section className="my-6 overflow-hidden rounded-2xl" style={{ background: `linear-gradient(110deg, ${NAVY} 0%, ${BRAND} 70%, #1769C0 100%)` }}>
        <div className="flex flex-col gap-3 px-8 py-9 text-white sm:px-12 sm:py-12">
          <span className="flex w-fit items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold" style={{ background: "rgba(255,255,255,0.14)" }}>
            <Crown size={13} style={{ color: AMBER }} /> Luksuzni members club · globalni marketplace
          </span>
          <h1 className="max-w-2xl text-3xl font-bold leading-tight sm:text-4xl">
            Vrhunski Zepter proizvodi.<br />Članske cene do <span style={{ color: AMBER }}>−{pct(MAX_DISCOUNT)}%</span>.
          </h1>
          <p className="max-w-md text-sm text-white/70">Gost vidi MP cenu. Sa svakim rangom u BizzClub mreži popust raste — pregledaj cene za svoj rang gore.</p>
        </div>
      </section>

      {/* Breadcrumb */}
      <div className="mb-4 flex items-center gap-1.5 text-sm text-black/40">
        <span>Početna</span><ChevronRight size={14} /><span className="text-black/70">{activeCat?.label}</span>
      </div>

      {/* Category circles */}
      <div className="mb-7 flex gap-5 overflow-x-auto pb-2">
        {CATS.map((c) => {
          const on = c.key === cat; const Icon = c.icon;
          return (
            <button key={c.key} onClick={() => setCat(c.key)} className="flex w-20 shrink-0 flex-col items-center gap-2">
              <span className="grid h-16 w-16 place-items-center rounded-full border-2 transition"
                style={{ background: on ? BRAND : SKY, borderColor: on ? BRAND : "transparent" }}>
                <Icon size={26} strokeWidth={1.4} style={{ color: on ? "#fff" : BRAND }} />
              </span>
              <span className="text-center text-[11px] font-medium leading-tight" style={{ color: on ? BRAND : "rgba(0,0,0,0.6)" }}>{c.label}</span>
            </button>
          );
        })}
      </div>

      {/* Toolbar */}
      <div className="mb-5 flex items-center justify-between border-b border-black/5 pb-3">
        <h2 className="text-lg font-bold">Proizvodi <span className="text-sm font-normal text-black/40">({list.length})</span></h2>
        <p className="flex items-center gap-1.5 text-sm">
          <span className="text-black/45">Cene:</span>
          <span className="font-semibold" style={{ color: active.key === "guest" ? INK : BRAND }}>{active.name}{active.discount > 0 && ` · −${pct(active.discount)}%`}</span>
        </p>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {list.map((p) => (
          <ProductCard key={p.id} p={p} active={active} market={market} wished={wish.has(p.id)} toggleWish={() => toggleWish(p.id)} open={() => open(p.id)} add={() => add(p)} />
        ))}
      </div>
    </main>
  );
}

function ProductCard({ p, active, market, wished, toggleWish, open, add }) {
  return (
    <div className="group flex flex-col overflow-hidden rounded-2xl border border-black/[0.07] bg-white transition hover:border-black/10 hover:shadow-[0_10px_34px_rgba(14,77,164,0.08)]">
      <div className="relative">
        <button onClick={open} className="block w-full"><ProductTile p={p} className="aspect-[4/3] w-full" /></button>
        <button onClick={toggleWish} className="absolute left-3 top-3 grid h-8 w-8 place-items-center rounded-full bg-white/90 backdrop-blur transition hover:scale-105">
          <Heart size={16} style={wished ? { color: "#E0245E", fill: "#E0245E" } : { color: "rgba(0,0,0,0.4)" }} />
        </button>
        {p.promo && <div className="absolute right-3 top-2.5"><HexBadge label={`−${pct(p.promo)}%`} /></div>}
        {p.tag && <span className="absolute bottom-3 left-3 rounded-full bg-white/95 px-2.5 py-1 text-[11px] font-semibold backdrop-blur" style={{ color: BRAND }}>{p.tag}</span>}
      </div>
      <div className="flex flex-1 flex-col p-4">
        <div className="text-[11px] font-medium uppercase tracking-wide text-black/35">{p.line}</div>
        <button onClick={open} className="mt-1 text-left">
          <h3 className="font-semibold leading-tight hover:underline">{p.name}</h3>
        </button>
        <div className="mt-1.5 flex items-center gap-1 text-xs text-black/45">
          <Star size={12} style={{ color: AMBER, fill: AMBER }} /> {p.rating}<span className="text-black/25">· {p.reviews}</span>
          <span className="ml-auto text-[11px] text-black/30">{p.sku}</span>
        </div>
        <div className="mt-3 border-t border-black/5 pt-3"><PriceBlock p={p} active={active} market={market} /></div>
        <button onClick={add} className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-semibold text-white transition hover:opacity-90" style={{ background: NAVY }}>
          <ShoppingBag size={15} /> Dodajte u korpu
        </button>
      </div>
    </div>
  );
}

// ── PDP ───────────────────────────────────────────────────────
function PDP({ product: p, active, rank, setRank, market, wish, toggleWish, back, open, add }) {
  const [acc, setAcc] = useState("teh");
  if (!p) return null;
  const guestPrice = p.promo ? p.mp * (1 - p.promo) : p.mp;
  const rankPrice = p.mp * (1 - active.discount);
  const saved = p.mp - rankPrice;
  const similar = PRODUCTS.filter((x) => x.cat === p.cat && x.id !== p.id).slice(0, 3);

  return (
    <main className="mx-auto max-w-7xl px-5 pb-20">
      <div className="my-4 flex items-center gap-1.5 text-sm text-black/40">
        <button onClick={back} className="hover:text-black">Početna</button><ChevronRight size={14} />
        <span>{p.line}</span><ChevronRight size={14} /><span className="text-black/70">{p.name}</span>
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
        {/* Gallery */}
        <div className="flex gap-3">
          <div className="flex flex-col gap-3">
            {[0, 1, 2, 3].map((i) => (
              <button key={i} className="grid h-16 w-16 place-items-center overflow-hidden rounded-lg border border-black/10 bg-white" style={i === 0 ? { borderColor: BRAND } : {}}>
                <ProductTile p={p} className="h-full w-full" iconSize={26} />
              </button>
            ))}
          </div>
          <div className="flex-1"><ProductTile p={p} className="aspect-square w-full rounded-2xl border border-black/[0.07]" iconSize={150} /></div>
        </div>

        {/* Buy card */}
        <div>
          <div className="rounded-2xl border border-black/[0.07] bg-white p-6">
            <div className="flex items-start justify-between">
              <span className="rounded-md px-2.5 py-1 text-xs font-medium" style={{ background: SKY, color: BRAND }}>{p.line}</span>
              <button onClick={() => toggleWish(p.id)} className="grid h-9 w-9 place-items-center rounded-full border border-black/10">
                <Heart size={17} style={wish.has(p.id) ? { color: "#E0245E", fill: "#E0245E" } : { color: "rgba(0,0,0,0.4)" }} />
              </button>
            </div>
            <h1 className="mt-3 text-2xl font-bold">{p.name}</h1>
            <div className="mt-1.5 flex items-center gap-2 text-sm text-black/45">
              <span className="flex items-center gap-1"><Star size={13} style={{ color: AMBER, fill: AMBER }} /> {p.rating} · {p.reviews} recenzija</span>
              <span className="text-black/25">·</span><span>SKU: {p.sku}</span>
            </div>

            <div className="my-5 flex items-start justify-between border-y border-black/5 py-5">
              <PriceBlock p={p} active={active} market={market} size="pdp" />
              {p.promo && <HexBadge label={`−${pct(p.promo)}%`} />}
            </div>

            {active.discount > 0 && (
              <div className="mb-4 flex items-center gap-2 rounded-lg px-3 py-2.5 text-sm" style={{ background: SKY, color: BRAND }}>
                <Crown size={15} style={{ color: AMBER }} /> Štediš <strong>{fmt(saved, market)}</strong> kao {active.name}.
              </div>
            )}

            <button onClick={() => add(p)} className="flex w-full items-center justify-center gap-2 rounded-xl py-3.5 text-sm font-semibold text-white transition hover:opacity-90" style={{ background: NAVY }}>
              <ShoppingBag size={17} /> Dodajte u korpu · {fmt(active.key === "guest" ? guestPrice : rankPrice, market)}
            </button>

            <div className="mt-4 space-y-2.5 text-sm text-black/60">
              <div className="flex items-center gap-2.5"><Truck size={16} style={{ color: BRAND }} /> Besplatna isporuka na teritoriji Srbije</div>
              <div className="flex items-center gap-2.5"><Store size={16} style={{ color: BRAND }} /> Lično preuzimanje u Zepter radnjama</div>
            </div>
            <button className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl border border-black/10 py-3 text-sm font-medium hover:bg-black/[0.02]">
              <Gift size={16} style={{ color: BRAND }} /> Pošaljite kao poklon
            </button>
          </div>

          {/* Rank price table */}
          <RankPriceTable p={p} rank={rank} setRank={setRank} market={market} />

          {/* International affiliate */}
          <div className="mt-4 flex items-start gap-2.5 rounded-xl border border-black/[0.07] bg-white px-4 py-3 text-sm text-black/55">
            <MapPin size={16} className="mt-0.5 shrink-0" style={{ color: BRAND }} />
            <span>Cena u <strong>{MARKETS[market].name}</strong> ({MARKETS[market].code}). Preko affiliate linka kupac iz druge zemlje vidi cenu i valutu svog tržišta — provizija se pripisuje tvom partner nalogu.</span>
          </div>
        </div>
      </div>

      {/* O proizvodu + accordions */}
      <div className="mt-12 grid grid-cols-1 gap-8 lg:grid-cols-2">
        <div>
          <h2 className="mb-3 text-lg font-bold">O proizvodu</h2>
          <p className="text-[15px] leading-relaxed text-black/65">{p.blurb}</p>
        </div>
        <div className="space-y-3">
          {[["dim", "Dimenzije uređaja"], ["teh", "Tehnički podaci"]].map(([key, label]) => (
            <div key={key} className="overflow-hidden rounded-xl border border-black/[0.07] bg-white">
              <button onClick={() => setAcc(acc === key ? "" : key)} className="flex w-full items-center justify-between px-5 py-3.5 text-sm font-semibold">
                {label}<ChevronDown size={16} className={`text-black/40 transition ${acc === key ? "rotate-180" : ""}`} />
              </button>
              {acc === key && (
                <div className="border-t border-black/5">
                  {(key === "teh" ? p.specs : [["Visina", "ca. 48 cm"], ["Širina", "ca. 36 cm"], ["Dubina", "ca. 20 cm"]]).map(([k, v], i) => (
                    <div key={k} className="flex justify-between px-5 py-2.5 text-sm" style={i % 2 ? { background: "#F7FAFD" } : {}}>
                      <span className="text-black/50">{k}</span><span className="font-medium">{v}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Similar */}
      {similar.length > 0 && (
        <div className="mt-14">
          <h2 className="mb-5 text-lg font-bold">Slični proizvodi</h2>
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {similar.map((s) => (
              <ProductCard key={s.id} p={s} active={active} market={market} wished={wish.has(s.id)} toggleWish={() => toggleWish(s.id)} open={() => open(s.id)} add={() => add(s)} />
            ))}
          </div>
        </div>
      )}
    </main>
  );
}

function RankPriceTable({ p, rank, setRank, market }) {
  const [open, setOpen] = useState(true);
  return (
    <div className="mt-4 overflow-hidden rounded-2xl border border-black/[0.07] bg-white">
      <button onClick={() => setOpen((o) => !o)} className="flex w-full items-center justify-between px-5 py-3.5">
        <span className="flex items-center gap-2 text-sm font-semibold"><Crown size={15} style={{ color: AMBER }} /> Cena po rangu u mreži</span>
        <ChevronDown size={16} className={`text-black/40 transition ${open ? "rotate-180" : ""}`} />
      </button>
      {open && (
        <div className="border-t border-black/5">
          {RANKS.map((r) => {
            const price = p.mp * (1 - r.discount); const on = r.key === rank;
            return (
              <button key={r.key} onClick={() => setRank(r.key)} className="flex w-full items-center justify-between px-5 py-3 text-sm transition hover:bg-black/[0.02]" style={on ? { background: SKY } : {}}>
                <span className="flex items-center gap-2">
                  {r.mlm ? <Crown size={13} style={{ color: BRAND }} /> : <span className="inline-block w-[13px]" />}
                  <span className={on ? "font-semibold" : ""}>{r.name}</span>
                  {r.discount > 0 && <span className="text-xs font-bold" style={{ color: BIZZ }}>−{pct(r.discount)}%</span>}
                  {r.discount === MAX_DISCOUNT && <span className="rounded-full bg-black/5 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-black/50">Max</span>}
                </span>
                <span className="flex items-center gap-2">
                  <span className="font-bold" style={on ? { color: BRAND } : { color: "rgba(0,0,0,0.75)" }}>{fmt(price, market)}</span>
                  {on ? <Check size={15} style={{ color: BRAND }} /> : <Lock size={13} className="text-black/20" />}
                </span>
              </button>
            );
          })}
          <div className="px-5 py-2.5 text-[11px] leading-snug text-black/40">Popusti po rangu su konfigurabilni (mock). Viši rang = veći popust, do −{pct(MAX_DISCOUNT)}%.</div>
        </div>
      )}
    </div>
  );
}

// ── Footer ────────────────────────────────────────────────────
function Footer() {
  const cols = [
    ["Kategorije proizvoda", ["Bioptron terapija", "Pametne naočare", "Kuvanje na zdrav način", "Zdrav vazduh", "Prečišćena voda", "Zdrav dom"]],
    ["Uslovi i odredbe", ["Dozvola za prodaju", "Dokumenti", "Internet trgovina", "Dostava i plaćanje", "BizzClub uslovi", "Politika privatnosti"]],
    ["Kontaktirajte nas", ["cusromersupport@zepter.rs", "Call Center: 0800 234567", "Telefon: 011/311-3233", "Radnje i galerije širom Srbije"]],
  ];
  return (
    <footer style={{ background: NAVY }} className="text-white/85">
      <div className="mx-auto grid max-w-7xl grid-cols-1 gap-8 px-5 py-12 sm:grid-cols-2 lg:grid-cols-4">
        {cols.map(([h, items]) => (
          <div key={h}>
            <h4 className="mb-3 text-sm font-semibold text-white">{h}</h4>
            <ul className="space-y-2 text-sm text-white/65">{items.map((it) => <li key={it} className="hover:text-white">{it}</li>)}</ul>
          </div>
        ))}
        <div>
          <h4 className="mb-3 text-sm font-semibold text-white">ZEUS</h4>
          <p className="text-sm text-white/65">Luksuzni members club · globalni marketplace · BizzClub mreža za Zepter International.</p>
          <p className="mt-4 text-[11px] text-white/40">FE prototip · mock podaci · cene/FX ilustrativne</p>
        </div>
      </div>
      <div className="border-t border-white/10 py-4 text-center text-[11px] text-white/40">© 2026 ZEUS · Zepter International</div>
    </footer>
  );
}
