import { useState, useMemo } from "react";
import {
  Search, ShoppingBag, ChevronDown, ChevronLeft, ChevronRight, Star, Check, Lock,
  Heart, MapPin, User, LayoutGrid, Truck, Store, Gift, Info, ShieldCheck,
  Wind, Droplet, ChefHat, HeartPulse, Sparkle, Home, Glasses, FlaskConical,
  Gem, Crown, Tag, Mail, ArrowUp
} from "lucide-react";

// ──────────────────────────────────────────────────────────────
// ZEUS — Marketplace · FE prototip (mock podaci)
// Bazirano na Zepter 2023 dizajnu (BizzClub), modernizovan UX/UI.
//
// UX Standardi:
// - Responsive: desktop + tablet + mobile
// - Pristupačnost (WCAG AA): kontrast >= 4.5:1 (navy na amber)
// - Copy: srpski (latinica)
// - Cene: formatirani RSD `1.357.236,00 RSD`
// ──────────────────────────────────────────────────────────────

// Zepter brand paleta
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
  { id: 2, name: "Bioptron Pro 1", line: "Bioptron hipersvetlosna terapija", cat: "bioptron", sku: "PAG-990", mp: 305738, promo: 0.1, rating: 4.8, reviews: 167, hue: 38, tag: "Bestseller", blurb: "Bioptron Pro 1 sa setom kolor filtera za hromoterapiju. Stoni model sa stalkom, idealan za kućnu i profesionalnu upotrebu.", specs: [["Primena", "Svetlosna + kolor terapija"], ["Filteri", "7 boja"], ["Boja", "Bela"], ["Garancija", "5 godina"]] },
  { id: 3, name: "Bioptron Medall sa stalkom", line: "Bioptron kolor terapija", cat: "bioptron", sku: "PAG-960-SET", mp: 164138, rating: 4.7, reviews: 98, hue: 42, tag: null, blurb: "Kompaktni Bioptron Medall sa podnim stalkom za udoban tretman celog tela.", specs: [["Primena", "Svetlosna terapija"], ["Stalak", "Podni, podesiv"], ["Boja", "Bela"]] },
  { id: 4, name: "Bioptron Medall", line: "Bioptron hipersvetlosna terapija", cat: "bioptron", sku: "PAG-960", mp: 152338, rating: 4.8, reviews: 156, hue: 40, tag: "Bestseller", blurb: "Prenosivi Bioptron Medall — hiper-svetlosna terapija u dlanu. Za svakodnevnu negu kože i oporavak.", specs: [["Primena", "Prenosiva terapija"], ["Težina", "0.45 kg"], ["Boja", "Bela/crna"]] },
  { id: 5, name: "Aqueena PRO", line: "Prečišćena voda", cat: "voda", sku: "WT-100", mp: 170156, promo: 0.1, rating: 4.7, reviews: 138, hue: 195, tag: null, blurb: "Reverzna osmoza sa mineralizacijom. Do 7 litara čiste vode na sat, kompaktni dizajn za kuhinjski pult.", specs: [["Tehnologija", "Reverzna osmoza"], ["Kapacitet", "7 L/h"], ["Filteri", "5 stepeni"]] },
  { id: 6, name: "EdelWasser Gold", line: "Prečišćena voda", cat: "voda", sku: "PWC-870-GOLD", mp: 83898, rating: 4.6, reviews: 91, hue: 45, tag: "Gold", blurb: "Luksuzni prečišćivač vode u zlatnoj završnici. Vrhunska filtracija i elegantan dizajn.", specs: [["Tehnologija", "Multi-filtracija"], ["Završnica", "Gold"], ["Slavina", "3 izvoda"]] },
  { id: 7, name: "HyperLight Eyewear Clips", line: "Pametne naočare", cat: "naocare", sku: "EC-536", mp: 63012, rating: 4.6, reviews: 142, hue: 30, tag: null, blurb: "Hyperlight Eyewear naočare pružaju aktivnu hiper-svetlosnu terapiju koja održava i revitalizuje korisnika na kvantnom nevou.", specs: [["Tip", "Clip-on terapija"], ["Sočiva", "Hiper-svetlosna"], ["Težina", "28 g"]] },
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

// Slika mapping iz Figma dizajna
const PRODUCT_IMAGES = {
  2: "/product_bioptron_pro1.png",
  5: "/product_aqueena_pro.png",
  6: "/product_edelwasser_gold.png",
  7: "/product_eyewear_clips.png",
  8: "/product_myionz_pro.png",
};

// ── Helpers ───────────────────────────────────────────────────
const rankByKey = (k) => RANKS.find((r) => r.key === k) || RANKS[0];
const pct = (d) => Math.round(d * 100);

function fmt(rsd, market) {
  const m = MARKETS[market];
  const v = rsd * m.fx;
  if (market === "RS") {
    const parts = v.toFixed(2).split(".");
    const integerPart = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ".");
    const decimalPart = parts[1];
    return `${integerPart},${decimalPart} RSD`;
  } else {
    const formatted = v.toLocaleString("de-DE", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    return m.pos === "pre" ? `${m.cur}${formatted}` : `${formatted} ${m.cur}`;
  }
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

  const changeCategory = (newCat) => {
    setCat(newCat);
    setQuery("");
    setView({ page: "plp", id: null });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const addToCart = (p) => {
    setCart((c) => {
      const addedPrice = priceFor(p, active);
      return typeof c === "number" 
        ? { n: 1, total: addedPrice } 
        : { n: c.n + 1, total: c.total + addedPrice };
    });
    setToast(`Dodato u korpu: ${p.name}`);
    setTimeout(() => setToast(""), 1900);
  };

  const toggleWish = (id) => setWish((s) => {
    const n = new Set(s);
    n.has(id) ? n.delete(id) : n.add(id);
    return n;
  });

  const cartN = typeof cart === "number" ? 0 : cart.n;
  const cartSum = typeof cart === "number" ? 0 : cart.total;
  const product = view.id ? PRODUCTS.find((p) => p.id === view.id) : null;

  return (
    <div style={{ background: "#FBFCFE", color: INK }} className="min-h-screen font-sans antialiased flex flex-col justify-between">
      <div>
        <Header
          rank={rank} setRank={setRank} active={active}
          market={market} setMarket={setMarket}
          query={query} setQuery={setQuery}
          cartN={cartN} cartSum={cartSum} wishN={wish.size}
          onHome={() => changeCategory("all")}
        />

        {view.page === "plp" ? (
          <PLP
            list={list} cat={cat} setCat={changeCategory} active={active} market={market}
            wish={wish} toggleWish={toggleWish}
            open={(id) => { setView({ page: "pdp", id }); window.scrollTo(0, 0); }}
            add={addToCart} query={query}
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
      </div>

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
    <header className="sticky top-0 z-40 w-full shadow-md">
      {/* Row 1 — Blue bar with utilities and Search */}
      <div className="bg-[#0E4DA4] text-white">
        <div className="mx-auto flex max-w-7xl flex-col gap-3 px-4 py-3 md:flex-row md:items-center md:justify-between md:gap-5">
          
          {/* Logo & Market Picker */}
          <div className="flex items-center justify-between gap-4 md:justify-start">
            <button onClick={onHome} className="flex items-center gap-2 focus-visible:ring-2 focus-visible:ring-white rounded outline-none p-1" aria-label="ZEUS Marketplace Početna">
              <span className="grid h-8 w-8 place-items-center rounded bg-[#13315C]">
                <Crown size={16} className="text-[#F5B72E]" />
              </span>
              <span className="text-xl font-black tracking-wider text-white">ZEUS</span>
            </button>
            <MarketPicker market={market} setMarket={setMarket} />
          </div>

          {/* Search bar */}
          <div className="relative flex-1 max-w-2xl">
            <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              value={query} onChange={(e) => setQuery(e.target.value)}
              placeholder="Pretražite sve na Zepteru online i u prodavnici"
              className="w-full rounded-full border-none bg-white py-2.5 pl-11 pr-32 text-sm text-slate-800 outline-none placeholder-slate-400 focus:ring-2 focus:ring-[#F5B72E]"
            />
            <button 
              className="absolute right-1.5 top-1/2 flex -translate-y-1/2 items-center gap-1 rounded-full bg-[#F5B72E] text-[#13315C] font-bold py-1.5 px-4 text-xs tracking-wider hover:bg-[#E5A71E] active:scale-95 transition min-h-[36px] focus-visible:ring-2 focus-visible:ring-[#0E4DA4]"
              aria-label="Pretraži"
            >
              PRETRAGA
            </button>
          </div>

          {/* Wishlist, Account, and Cart */}
          <div className="flex items-center justify-end gap-3 sm:gap-4">
            <button className="flex items-center gap-2 rounded-lg p-1.5 hover:bg-white/10 transition text-xs sm:text-sm focus-visible:ring-2 focus-visible:ring-white outline-none min-h-[44px]" aria-label="Vaša lista želja">
              <span className="relative">
                <Heart size={18} />
                {wishN > 0 && <span className="absolute -right-2 -top-2 grid h-4 min-w-4 place-items-center rounded-full bg-[#F5B72E] text-[#13315C] px-1 text-[9px] font-bold">{wishN}</span>}
              </span>
              <span className="hidden lg:inline leading-none text-left"><span className="block text-[10px] text-white/60">Vaša</span>lista želja</span>
            </button>

            <button className="flex items-center gap-2 rounded-lg p-1.5 hover:bg-white/10 transition text-xs sm:text-sm focus-visible:ring-2 focus-visible:ring-white outline-none min-h-[44px]" aria-label="Moj nalog">
              <User size={18} />
              <span className="hidden lg:inline leading-none text-left"><span className="block text-[10px] text-white/60">Prijavite se na</span>moj nalog</span>
            </button>

            <button className="flex items-center gap-2 rounded-full border border-white/20 bg-[#13315C] py-1.5 px-4 text-xs sm:text-sm font-semibold hover:bg-[#0f284a] focus-visible:ring-2 focus-visible:ring-[#F5B72E] outline-none min-h-[44px]" aria-label="Korpa">
              <span className="relative">
                <ShoppingBag size={18} className="text-[#F5B72E]" />
                {cartN > 0 && <span className="absolute -right-2 -top-2 grid h-4 min-w-4 place-items-center rounded-full bg-[#F5B72E] text-[#13315C] px-1 text-[9px] font-bold">{cartN}</span>}
              </span>
              <span>{fmt(cartSum, market)}</span>
            </button>
          </div>

        </div>
      </div>

      {/* Row 2 — Nav bar (Sve kategorije & links) */}
      <div className="bg-white border-b border-slate-100 text-slate-800">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-2">
          <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide py-1">
            <button className="flex items-center gap-2 rounded-lg bg-[#13315C] text-white px-4 py-2 text-xs sm:text-sm font-bold hover:bg-[#0f284a] focus-visible:ring-2 focus-visible:ring-[#0E4DA4] outline-none min-h-[40px] shrink-0" aria-label="Sve kategorije">
              <LayoutGrid size={15} /> Sve kategorije
            </button>
            <nav className="flex items-center gap-1">
              {NAV.map((n, i) => (
                <button 
                  key={n} 
                  onClick={n === "Početna" ? onHome : undefined}
                  className="shrink-0 rounded-lg px-3 py-2 text-xs sm:text-sm font-medium hover:bg-slate-50 transition focus-visible:ring-2 focus-visible:ring-[#0E4DA4] outline-none min-h-[40px]"
                  style={i === 4 ? { color: "#0E4DA4", fontWeight: 700 } : { color: "#475569" }}
                >
                  {n}
                </button>
              ))}
            </nav>
          </div>
        </div>
      </div>

      {/* Row 3 — Rank price switcher (ZEUS MLM feature) */}
      <div className="bg-[#EAF2FC] border-b border-slate-200">
        <div className="mx-auto flex max-w-7xl items-center gap-3 overflow-x-auto scrollbar-hide px-4 py-2">
          <span className="flex shrink-0 items-center gap-1 text-[11px] font-bold uppercase tracking-wider text-slate-500">
            <Tag size={12} className="text-[#0E4DA4]" /> Prikaz cena za:
          </span>
          <div className="flex gap-2">
            {RANKS.map((r) => {
              const on = r.key === rank;
              return (
                <button 
                  key={r.key} 
                  onClick={() => setRank(r.key)}
                  className="flex shrink-0 items-center gap-1 rounded-full border px-3 py-1 text-xs font-semibold transition focus-visible:ring-2 focus-visible:ring-[#0E4DA4] outline-none min-h-[32px]"
                  style={on ? { background: "#0E4DA4", color: "#fff", borderColor: "#0E4DA4" } : { background: "#fff", color: "#1E293B", borderColor: "#CBD5E1" }}
                >
                  {r.mlm && <Crown size={12} style={{ color: on ? "#F5B72E" : "#94A3B8" }} />}
                  {r.short}
                  {r.discount > 0 && <span className="font-bold ml-1 text-amber-500">−{pct(r.discount)}%</span>}
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
      <button 
        onClick={() => setOpen((o) => !o)} 
        className="flex items-center gap-1.5 rounded-full border border-white/20 bg-[#13315C] py-2 px-3 text-xs sm:text-sm font-semibold hover:bg-[#0f284a] focus-visible:ring-2 focus-visible:ring-[#F5B72E] outline-none min-h-[36px]"
        aria-expanded={open}
        aria-label="Izaberite tržište i valutu"
      >
        <MapPin size={14} className="text-[#F5B72E]" />
        <span>{m.name}</span>
        <ChevronDown size={12} className="text-white/60" />
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute left-0 z-20 mt-2 w-60 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-2xl text-slate-800 animate-in fade-in slide-in-from-top-1 duration-150">
            <div className="px-3 py-2 text-[10px] font-bold uppercase tracking-wider text-slate-400 bg-slate-50 border-b border-slate-100">Tržište / valuta</div>
            {Object.entries(MARKETS).map(([k, v]) => (
              <button 
                key={k} 
                onClick={() => { setMarket(k); setOpen(false); }} 
                className="flex w-full items-center justify-between px-4 py-2.5 text-sm hover:bg-slate-50 transition min-h-[44px] outline-none focus:bg-slate-50 text-left"
              >
                <span className="flex items-center gap-2"><span>{v.flag}</span> {v.name}</span>
                <span className="flex items-center gap-2 text-slate-400">{v.code}{k === market && <Check size={14} className="text-[#0E4DA4]" />}</span>
              </button>
            ))}
            <div className="flex items-start gap-2 border-t border-slate-100 bg-slate-50/50 px-3 py-3 text-[10px] leading-normal text-slate-400">
              <ShieldCheck size={14} className="mt-0.5 shrink-0 text-[#0E4DA4]" />
              <span>Affiliate link automatski prepoznaje lokaciju kupca i prikazuje cenu te zemlje.</span>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

// ── Shared: price block & tile ────────────────────────────────
function ProductTile({ p, className = "", iconSize = 60 }) {
  const imgUrl = PRODUCT_IMAGES[p.id];
  if (imgUrl) {
    return (
      <div className={`relative overflow-hidden bg-white flex items-center justify-center ${className}`}>
        <img src={imgUrl} alt={p.name} className="w-full h-full object-contain p-2" />
      </div>
    );
  }

  // Fallback za ostale proizvode koji nemaju Figma slike
  const Icon = CATS.find((c) => c.key === p.cat)?.icon || Sparkle;
  return (
    <div className={`relative grid place-items-center overflow-hidden bg-white ${className}`}>
      <div className="absolute h-[70%] w-[70%] rounded-full opacity-40" style={{ background: `radial-gradient(circle at 38% 32%, ${SKY}, ${SKY2})` }} />
      <div className="relative z-10 w-4/5 h-4/5 flex items-center justify-center">
        <ProductIllustration id={p.id} className="w-full h-full object-contain" />
        {!ProductIllustration({ id: p.id }) && <Icon size={iconSize} strokeWidth={1.1} style={{ color: BRAND, opacity: 0.78 }} />}
      </div>
    </div>
  );
}

function HexBadge({ label }) {
  return (
    <span className="grid h-10 w-9 place-items-center text-[10px] font-bold leading-none"
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
        <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">MP Cena</div>
        <div className="flex items-baseline gap-2">
          <div className={big ? "text-[28px] font-extrabold leading-tight text-slate-900" : "text-lg font-bold text-slate-900"}>{fmt(guestPrice, market)}</div>
          {p.promo && <span className="text-sm text-slate-400 line-through">{fmt(p.mp, market)}</span>}
        </div>
        <div className="mt-1.5 flex items-center gap-1.5">
          <span className="text-xs font-bold text-[#1769C0]">BizzClub</span>
          <span className="text-[11px] text-slate-500">Učlanite se i kupite <strong className="text-[#1769C0] font-bold">do −{pct(MAX_DISCOUNT)}%</strong></span>
        </div>
      </div>
    );
  }
  return (
    <div>
      <div className="text-[11px] font-bold uppercase tracking-wider text-[#1769C0]">{active.name} cena</div>
      <div className="flex items-baseline gap-2">
        <div className={big ? "text-[28px] font-extrabold leading-tight text-[#0E4DA4]" : "text-lg font-bold text-[#0E4DA4]"}>{fmt(rankPrice, market)}</div>
        <span className="text-sm text-slate-400 line-through">{fmt(p.mp, market)}</span>
        <span className="rounded bg-[#0E4DA4] px-1.5 py-0.5 text-[10px] font-bold text-white">−{pct(active.discount)}%</span>
      </div>
      <div className="mt-1 text-[11px] text-slate-400">Cena za tvoj rang u mreži</div>
    </div>
  );
}

// ── PLP ───────────────────────────────────────────────────────
function PLP({ list, cat, setCat, active, market, wish, toggleWish, open, add, query }) {
  const isHomepage = cat === "all" && query === "";
  
  if (isHomepage) {
    return (
      <HomeView
        setCat={setCat}
        active={active}
        market={market}
        wish={wish}
        toggleWish={toggleWish}
        open={open}
        add={add}
      />
    );
  }

  return (
    <FilteredPLP
      list={list}
      cat={cat}
      setCat={setCat}
      active={active}
      market={market}
      wish={wish}
      toggleWish={toggleWish}
      open={open}
      add={add}
    />
  );
}

function ProductCard({ p, active, market, wished, toggleWish, open, add }) {
  return (
    <div className="group flex flex-col overflow-hidden rounded-2xl border border-slate-100 bg-white transition-all duration-300 hover:border-slate-200 hover:shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
      <div className="relative bg-slate-50 flex items-center justify-center">
        <button onClick={open} className="block w-full outline-none focus-visible:ring-2 focus-visible:ring-[#0E4DA4] rounded-t-2xl">
          <ProductTile p={p} className="aspect-[4/3] w-full" />
        </button>
        <button 
          onClick={toggleWish} 
          className="absolute left-3 top-3 grid h-8 w-8 place-items-center rounded-full bg-white/90 backdrop-blur shadow-sm hover:scale-105 transition-transform min-h-[32px] outline-none focus-visible:ring-2 focus-visible:ring-[#0E4DA4]"
          aria-label="Dodaj u listu želja"
        >
          <Heart size={16} style={wished ? { color: "#E0245E", fill: "#E0245E" } : { color: "rgba(0,0,0,0.4)" }} />
        </button>
        {p.promo && <div className="absolute right-3 top-2.5"><HexBadge label={`−${pct(p.promo)}%`} /></div>}
        {p.tag && <span className="absolute bottom-3 left-3 rounded bg-white/95 px-2.5 py-1 text-[10px] font-bold text-[#0E4DA4] shadow-sm uppercase tracking-wider">{p.tag}</span>}
      </div>
      <div className="flex flex-1 flex-col p-4">
        <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">{p.line}</div>
        <button onClick={open} className="mt-1 text-left outline-none focus-visible:underline">
          <h3 className="font-extrabold text-slate-800 text-sm group-hover:text-[#0E4DA4] transition-colors leading-tight">{p.name}</h3>
        </button>
        <div className="mt-1.5 flex items-center gap-1 text-[11px] text-slate-500">
          <Star size={12} className="text-[#F5B72E] fill-[#F5B72E]" /> 
          <span>{p.rating}</span>
          <span className="text-slate-300">·</span>
          <span>{p.reviews} recenzija</span>
          <span className="ml-auto text-[10px] text-slate-400">{p.sku}</span>
        </div>
        <div className="mt-3 border-t border-slate-100 pt-3 flex-1 flex flex-col justify-end">
          <PriceBlock p={p} active={active} market={market} />
        </div>
        <button 
          onClick={add} 
          className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-[#13315C] py-2.5 text-xs font-bold text-white transition hover:bg-[#0f284a] active:scale-98 min-h-[40px] focus-visible:ring-2 focus-visible:ring-[#0E4DA4] outline-none"
        >
          <ShoppingBag size={14} /> Dodajte u korpu
        </button>
      </div>
    </div>
  );
}

// ── HomeView (The homepage of ZEUS Marketplace) ──────────────────
function HomeView({ setCat, active, market, wish, toggleWish, open, add }) {
  return (
    <div className="mx-auto max-w-7xl px-4 pb-20 space-y-16">
      
      {/* 1. Hero Banners Grid */}
      <section aria-label="Promo paneli" className="mt-8">
        <HeroGrid setCat={setCat} />
      </section>

      {/* 2. Featured Section (Izdvajamo iz ponude) */}
      <section aria-label="Izdvajamo iz ponude">
        <FeaturedSection active={active} market={market} wish={wish} toggleWish={toggleWish} open={open} add={add} setCat={setCat} />
      </section>

      {/* 3. Secondary Banners Grid */}
      <section aria-label="Kategorije i rešenja">
        <SecondaryGrid setCat={setCat} />
      </section>

      {/* 4. Product Categories (Kategorije proizvoda) */}
      <section aria-label="Kategorije proizvoda">
        <div className="flex items-center justify-between border-b border-slate-200 pb-3 mb-6">
          <h2 className="text-xl font-black text-slate-800 tracking-tight">Kategorije proizvoda</h2>
          <button onClick={() => setCat("all")} className="text-xs font-bold text-[#0E4DA4] hover:underline flex items-center gap-0.5">
            Pogledajte sve ➔
          </button>
        </div>
        <div className="flex gap-6 overflow-x-auto pb-4 scrollbar-hide">
          {CATS.filter(c => c.key !== "all").map((c) => {
            const Icon = c.icon;
            return (
              <button 
                key={c.key} 
                onClick={() => setCat(c.key)} 
                className="flex w-24 shrink-0 flex-col items-center gap-3 group focus-visible:ring-2 focus-visible:ring-[#0E4DA4] rounded-lg p-2 outline-none"
              >
                <span className="grid h-16 w-16 place-items-center rounded-full bg-[#EAF2FC] group-hover:bg-[#0E4DA4] group-hover:text-white transition-all duration-300 shadow-sm">
                  <Icon size={24} className="text-[#0E4DA4] group-hover:text-white transition-colors duration-300" />
                </span>
                <span className="text-center text-xs font-bold text-slate-700 group-hover:text-[#0E4DA4] leading-tight transition-colors duration-300">
                  {c.label}
                </span>
              </button>
            );
          })}
        </div>
      </section>

      {/* 5. BizzClub Join Ribbon */}
      <section aria-label="BizzClub učlanjenje" className="rounded-2xl bg-[#EAF2FC] border border-blue-100 p-6 sm:p-8 flex flex-col md:flex-row items-center justify-between gap-6 shadow-sm">
        <div className="flex items-start gap-4">
          <span className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-[#0E4DA4]">
            <Crown size={20} className="text-[#F5B72E]" />
          </span>
          <div>
            <h3 className="font-extrabold text-slate-800 text-lg">Učlanite se u Zepter BizzClub</h3>
            <p className="text-sm text-slate-600 mt-0.5">i već danas možete da ostvarite privilegovanu cenu.</p>
          </div>
        </div>
        <button 
          onClick={() => alert("Učlanjenje")} 
          className="bg-[#F5B72E] text-[#13315C] font-extrabold text-sm py-3 px-8 rounded-xl hover:bg-[#E5A71E] active:scale-98 transition shadow focus-visible:ring-2 focus-visible:ring-[#0E4DA4] outline-none min-h-[44px]"
        >
          Želim da se učlanim
        </button>
      </section>

      {/* 6. Promotions (Promocija) */}
      <section aria-label="Promocije">
        <PromotionsSection active={active} market={market} wish={wish} toggleWish={toggleWish} open={open} add={add} setCat={setCat} />
      </section>

      {/* 7. Newsletter Signup */}
      <section aria-label="Prijavite se na našu listu">
        <Newsletter />
      </section>

    </div>
  );
}

function HeroGrid({ setCat }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 p-1">
      {/* Col 1: Left Stack */}
      <div className="flex flex-col gap-4">
        {/* VacSy */}
        <button onClick={() => setCat("dom")} className="block w-full rounded-2xl overflow-hidden hover:shadow-lg hover:scale-[1.01] transition duration-300 focus-visible:ring-2 focus-visible:ring-[#0E4DA4] outline-none">
          <img src="/hero_vacsy.png" alt="VacSy Čuvar hrane" className="w-full h-auto object-cover" />
        </button>
        {/* Hyperlight Eyewear */}
        <button onClick={() => setCat("naocare")} className="block w-full rounded-2xl overflow-hidden hover:shadow-lg hover:scale-[1.01] transition duration-300 focus-visible:ring-2 focus-visible:ring-[#0E4DA4] outline-none">
          <img src="/hero_eyewear.png" alt="Hyperlight Eyewear" className="w-full h-auto object-cover" />
        </button>
        {/* Luxury Overdose Parfem */}
        <button onClick={() => setCat("lepota")} className="block w-full rounded-2xl overflow-hidden hover:shadow-lg hover:scale-[1.01] transition duration-300 focus-visible:ring-2 focus-visible:ring-[#0E4DA4] outline-none">
          <img src="/hero_perfume.png" alt="Luxury Overdose Parfem" className="w-full h-auto object-cover" />
        </button>
      </div>

      {/* Col 2-3: Middle Stack */}
      <div className="md:col-span-2 flex flex-col gap-4">
        {/* Bioptron light therapy */}
        <button onClick={() => setCat("bioptron")} className="block w-full rounded-2xl overflow-hidden hover:shadow-lg hover:scale-[1.01] transition duration-300 focus-visible:ring-2 focus-visible:ring-[#0E4DA4] outline-none">
          <img src="/hero_bioptron.png" alt="Bioptron light therapy" className="w-full h-auto object-cover" />
        </button>
        {/* Two side-by-side banners */}
        <div className="grid grid-cols-2 gap-4">
          <button onClick={() => setCat("vazduh")} className="block w-full rounded-2xl overflow-hidden hover:shadow-lg hover:scale-[1.01] transition duration-300 focus-visible:ring-2 focus-visible:ring-[#0E4DA4] outline-none">
            <img src="/hero_air.png" alt="Jednostavno rešenje za čist vazduh" className="w-full h-auto object-cover" />
          </button>
          <button onClick={() => setCat("lepota")} className="block w-full rounded-2xl overflow-hidden hover:shadow-lg hover:scale-[1.01] transition duration-300 focus-visible:ring-2 focus-visible:ring-[#0E4DA4] outline-none">
            <img src="/hero_cream.png" alt="Zepter kozmetika" className="w-full h-auto object-cover" />
          </button>
        </div>
        {/* BizzClub Partner Promo */}
        <button onClick={() => alert("Učlanjenje")} className="block w-full rounded-2xl overflow-hidden hover:shadow-lg hover:scale-[1.01] transition duration-300 focus-visible:ring-2 focus-visible:ring-[#0E4DA4] outline-none">
          <img src="/hero_bizzclub.png" alt="Postanite Zepter BizzClub partner" className="w-full h-auto object-cover" />
        </button>
      </div>

      {/* Col 4: Right Stack */}
      <div className="flex flex-col gap-4">
        {/* Cooking pots */}
        <button onClick={() => setCat("kuhinja")} className="block w-full rounded-2xl overflow-hidden hover:shadow-lg hover:scale-[1.01] transition duration-300 focus-visible:ring-2 focus-visible:ring-[#0E4DA4] outline-none">
          <img src="/hero_pots.png" alt="Zdrava priprema jela" className="w-full h-auto object-cover" />
        </button>
        {/* Handbag */}
        <button onClick={() => setCat("luksuz")} className="block w-full rounded-2xl overflow-hidden hover:shadow-lg hover:scale-[1.01] transition duration-300 focus-visible:ring-2 focus-visible:ring-[#0E4DA4] outline-none">
          <img src="/hero_bag.png" alt="Masterpiece Torbe" className="w-full h-auto object-cover" />
        </button>
      </div>
    </div>
  );
}

function FeaturedSection({ active, market, wish, toggleWish, open, add, setCat }) {
  const featuredIds = [2, 7, 8];
  const items = PRODUCTS.filter(p => featuredIds.includes(p.id));

  return (
    <div>
      <div className="flex items-center justify-between border-b border-slate-200 pb-3 mb-6">
        <h2 className="text-xl font-black text-slate-800 tracking-tight">Izdvajamo iz ponude</h2>
        <button onClick={() => setCat("all")} className="text-xs font-bold text-[#0E4DA4] hover:underline flex items-center gap-0.5">
          Pogledajte sve ➔
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="md:col-span-3 grid grid-cols-1 sm:grid-cols-3 gap-5">
          {items.map(p => (
            <ProductCard 
              key={p.id} 
              p={p} 
              active={active} 
              market={market} 
              wished={wish.has(p.id)} 
              toggleWish={() => toggleWish(p.id)} 
              open={() => open(p.id)} 
              add={() => add(p)} 
            />
          ))}
        </div>

        <div className="h-full">
          <button onClick={() => setCat("lepota")} className="block w-full h-full rounded-2xl overflow-hidden hover:shadow-xl hover:scale-[1.01] transition duration-300 focus-visible:ring-2 focus-visible:ring-[#0E4DA4] outline-none">
            <img src="/banner_prirodna_lepota.png" alt="Kolekcija Prirodna lepota" className="w-full h-full object-cover" />
          </button>
        </div>
      </div>
    </div>
  );
}

function SecondaryGrid({ setCat }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
      {/* Left Wide Card (spans 2 columns) */}
      <button onClick={() => setCat("bioptron")} className="md:col-span-2 block w-full rounded-2xl overflow-hidden hover:shadow-lg hover:scale-[1.01] transition duration-300 focus-visible:ring-2 focus-visible:ring-[#0E4DA4] outline-none">
        <img src="/banner_bioptron_terapija.png" alt="Bioptron svetlosna terapija" className="w-full h-auto object-cover" />
      </button>

      {/* Middle Stacked Column */}
      <div className="flex flex-col gap-4">
        <button onClick={() => setCat("voda")} className="block w-full rounded-2xl overflow-hidden hover:shadow-lg hover:scale-[1.01] transition duration-300 focus-visible:ring-2 focus-visible:ring-[#0E4DA4] outline-none">
          <img src="/banner_preciscena_voda.png" alt="Prečišćena voda" className="w-full h-auto object-cover" />
        </button>
        <button onClick={() => setCat("lepota")} className="block w-full rounded-2xl overflow-hidden hover:shadow-lg hover:scale-[1.01] transition duration-300 focus-visible:ring-2 focus-visible:ring-[#0E4DA4] outline-none">
          <img src="/banner_prirodna_lepota_mid.png" alt="Prirodna lepota" className="w-full h-auto object-cover" />
        </button>
      </div>

      {/* Right Tall Column */}
      <button onClick={() => setCat("kuhinja")} className="block w-full rounded-2xl overflow-hidden hover:shadow-lg hover:scale-[1.01] transition duration-300 focus-visible:ring-2 focus-visible:ring-[#0E4DA4] outline-none">
        <img src="/banner_priprema_hrane_tall.png" alt="Priprema hrane na zdrav način" className="w-full h-auto object-cover" />
      </button>
    </div>
  );
}

function PromotionsSection({ active, market, wish, toggleWish, open, add, setCat }) {
  const promoIds = [5, 6];
  const items = PRODUCTS.filter(p => promoIds.includes(p.id));

  return (
    <div>
      <div className="flex items-center justify-between border-b border-slate-200 pb-3 mb-6">
        <h2 className="text-xl font-black text-slate-800 tracking-tight">Promocija</h2>
        <button onClick={() => setCat("all")} className="text-xs font-bold text-[#0E4DA4] hover:underline flex items-center gap-0.5">
          Pogledajte sve ➔
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {/* Left Wide Banner (spans 2 columns) */}
        <button onClick={() => setCat("voda")} className="md:col-span-2 block w-full rounded-2xl overflow-hidden hover:shadow-lg hover:scale-[1.01] transition duration-300 focus-visible:ring-2 focus-visible:ring-[#0E4DA4] outline-none">
          <img src="/promo_water_banner.png" alt="ČISTA I ZDRAVA VODA U VAŠEM DOMU" className="w-full h-auto object-cover" />
        </button>

        {/* Two promo products */}
        <div className="md:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-5">
          {items.map(p => (
            <ProductCard 
              key={p.id} 
              p={p} 
              active={active} 
              market={market} 
              wished={wish.has(p.id)} 
              toggleWish={() => toggleWish(p.id)} 
              open={() => open(p.id)} 
              add={() => add(p)} 
            />
          ))}
        </div>
      </div>
    </div>
  );
}

function Newsletter() {
  const [email, setEmail] = useState("");
  const handleSubmit = (e) => {
    e.preventDefault();
    if (email) {
      alert(`Prijavljeni ste sa emailom: ${email}`);
      setEmail("");
    }
  };

  return (
    <div className="bg-[#EAF2FC] rounded-2xl border border-blue-100 p-8 text-center max-w-3xl mx-auto shadow-sm">
      <Mail size={32} className="text-[#0E4DA4] mx-auto mb-3" />
      <h3 className="font-extrabold text-slate-800 text-lg">Prijavite se na našu mailing listu!</h3>
      <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
        Svake nedelje dobijate ekskluzivne predloge i savete kako da unapredite svoj život i zdravlje.
      </p>
      <form onSubmit={handleSubmit} className="mt-5 flex flex-col sm:flex-row gap-2 justify-center max-w-md mx-auto">
        <input 
          type="email" 
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Unesite vašu email adresu"
          required
          className="flex-1 rounded-xl border border-slate-200 bg-white py-2.5 px-4 text-xs text-slate-800 outline-none placeholder-slate-400 focus:ring-2 focus:ring-[#0E4DA4] min-h-[44px]"
        />
        <button 
          type="submit" 
          className="bg-[#13315C] text-white font-bold text-xs py-2.5 px-6 rounded-xl hover:bg-[#0f284a] active:scale-98 transition min-h-[44px]"
        >
          Prijavi se
        </button>
      </form>
    </div>
  );
}

function FilteredPLP({ list, cat, setCat, active, market, wish, toggleWish, open, add }) {
  const activeCat = CATS.find((c) => c.key === cat);
  return (
    <main className="mx-auto max-w-7xl px-4 pb-20">
      <div className="mb-4 mt-6 flex items-center gap-1.5 text-xs text-slate-400">
        <button onClick={() => setCat("all")} className="hover:underline">Početna</button>
        <ChevronRight size={12} />
        <span className="text-slate-600 font-semibold">{activeCat?.label || "Pretraga"}</span>
      </div>

      <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-slate-200 pb-3 gap-2">
        <h2 className="text-xl font-black text-slate-800">
          Rezultati pretrage <span className="text-sm font-normal text-slate-400">({list.length} proizvoda)</span>
        </h2>
        <p className="flex items-center gap-1.5 text-xs text-slate-600">
          <span>Prikaz cena:</span>
          <span className="font-bold text-[#0E4DA4]">
            {active.name}{active.discount > 0 && ` · −${pct(active.discount)}%`}
          </span>
        </p>
      </div>

      {list.length > 0 ? (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {list.map((p) => (
            <ProductCard 
              key={p.id} 
              p={p} 
              active={active} 
              market={market} 
              wished={wish.has(p.id)} 
              toggleWish={() => toggleWish(p.id)} 
              open={() => open(p.id)} 
              add={() => add(p)} 
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-16 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
          <p className="text-slate-400 text-sm">Nema pronađenih proizvoda za zadati kriterijum.</p>
          <button onClick={() => setCat("all")} className="mt-4 text-xs font-bold text-[#0E4DA4] hover:underline bg-white border border-slate-200 px-4 py-2 rounded-lg">
            Nazad na početnu
          </button>
        </div>
      )}
    </main>
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
    <main className="mx-auto max-w-7xl px-4 pb-20 mt-6">
      <div className="mb-6 flex items-center gap-1.5 text-xs text-slate-400">
        <button onClick={back} className="hover:text-black">Početna</button>
        <ChevronRight size={12} />
        <span>{p.line}</span>
        <ChevronRight size={12} />
        <span className="text-slate-600 font-semibold">{p.name}</span>
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
        {/* Gallery */}
        <div className="flex gap-4">
          <div className="flex flex-col gap-3">
            {[0, 1, 2, 3].map((i) => (
              <button key={i} className="grid h-16 w-16 place-items-center overflow-hidden rounded-lg border border-slate-200 bg-white hover:border-[#0E4DA4] transition" style={i === 0 ? { borderColor: BRAND } : {}}>
                <ProductTile p={p} className="h-full w-full" iconSize={26} />
              </button>
            ))}
          </div>
          <div className="flex-1">
            <ProductTile p={p} className="aspect-square w-full rounded-2xl border border-slate-100 shadow-sm" iconSize={150} />
          </div>
        </div>

        {/* Buy card */}
        <div>
          <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
            <div className="flex items-start justify-between">
              <span className="rounded bg-[#EAF2FC] px-2.5 py-1 text-xs font-bold text-[#0E4DA4] uppercase tracking-wider">{p.line}</span>
              <button 
                onClick={() => toggleWish(p.id)} 
                className="grid h-9 w-9 place-items-center rounded-full border border-slate-200 hover:bg-slate-50 transition"
                aria-label="Dodaj u listu želja"
              >
                <Heart size={17} style={wish.has(p.id) ? { color: "#E0245E", fill: "#E0245E" } : { color: "rgba(0,0,0,0.4)" }} />
              </button>
            </div>
            <h1 className="mt-3 text-2xl font-black text-slate-800 leading-tight">{p.name}</h1>
            <div className="mt-1.5 flex items-center gap-2 text-xs text-slate-500">
              <span className="flex items-center gap-1"><Star size={13} className="text-[#F5B72E] fill-[#F5B72E]" /> {p.rating} · {p.reviews} recenzija</span>
              <span className="text-slate-300">·</span><span>SKU: {p.sku}</span>
            </div>

            <div className="my-5 flex items-start justify-between border-y border-slate-100 py-5">
              <PriceBlock p={p} active={active} market={market} size="pdp" />
              {p.promo && <HexBadge label={`−${pct(p.promo)}%`} />}
            </div>

            {active.discount > 0 && (
              <div className="mb-4 flex items-center gap-2 rounded-lg bg-[#EAF2FC] px-3.5 py-2.5 text-xs font-semibold text-[#0E4DA4]">
                <Crown size={15} className="text-[#F5B72E]" /> Štediš <strong>{fmt(saved, market)}</strong> kao {active.name}.
              </div>
            )}

            <button 
              onClick={() => add(p)} 
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#13315C] py-3.5 text-sm font-bold text-white transition hover:bg-[#0f284a] active:scale-98 min-h-[48px] focus-visible:ring-2 focus-visible:ring-[#0E4DA4]"
            >
              <ShoppingBag size={17} /> Dodajte u korpu · {fmt(active.key === "guest" ? guestPrice : rankPrice, market)}
            </button>

            <div className="mt-4 space-y-2.5 text-xs text-slate-500">
              <div className="flex items-center gap-2.5"><Truck size={16} className="text-[#0E4DA4]" /> Besplatna isporuka na teritoriji Srbije</div>
              <div className="flex items-center gap-2.5"><Store size={16} className="text-[#0E4DA4]" /> Lično preuzimanje u Zepter radnjama</div>
            </div>
            <button className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl border border-slate-200 py-3 text-xs font-semibold hover:bg-slate-50 min-h-[44px]">
              <Gift size={16} className="text-[#0E4DA4]" /> Pošaljite kao poklon
            </button>
          </div>

          <RankPriceTable p={p} rank={rank} setRank={setRank} market={market} />

          <div className="mt-4 flex items-start gap-2.5 rounded-xl border border-slate-100 bg-white px-4 py-3.5 text-xs text-slate-500">
            <MapPin size={16} className="mt-0.5 shrink-0 text-[#0E4DA4]" />
            <span>Cena u <strong>{MARKETS[market].name}</strong> ({MARKETS[market].code}). Preko affiliate linka kupac iz druge zemlje vidi cenu i valutu svog tržišta — provizija se pripisuje tvom partner nalogu.</span>
          </div>
        </div>
      </div>

      {/* O proizvodu + accordions */}
      <div className="mt-12 grid grid-cols-1 gap-8 lg:grid-cols-2 border-t border-slate-100 pt-8">
        <div>
          <h2 className="text-lg font-black text-slate-800 mb-3">O proizvodu</h2>
          <p className="text-sm leading-relaxed text-slate-600">{p.blurb}</p>
        </div>
        <div className="space-y-3">
          {[["dim", "Dimenzije uređaja"], ["teh", "Tehnički podaci"]].map(([key, label]) => (
            <div key={key} className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
              <button onClick={() => setAcc(acc === key ? "" : key)} className="flex w-full items-center justify-between px-5 py-3.5 text-xs font-bold text-slate-700 min-h-[44px]">
                {label}<ChevronDown size={16} className={`text-slate-400 transition ${acc === key ? "rotate-180" : ""}`} />
              </button>
              {acc === key && (
                <div className="border-t border-slate-100">
                  {(key === "teh" ? p.specs : [["Visina", "ca. 48 cm"], ["Širina", "ca. 36 cm"], ["Dubina", "ca. 20 cm"]]).map(([k, v], i) => (
                    <div key={k} className="flex justify-between px-5 py-2.5 text-xs" style={i % 2 ? { background: "#F8FAFC" } : {}}>
                      <span className="text-slate-400">{k}</span><span className="font-semibold text-slate-700">{v}</span>
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
        <div className="mt-14 border-t border-slate-100 pt-8">
          <h2 className="mb-6 text-lg font-black text-slate-800">Slični proizvodi</h2>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
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
    <div className="mt-4 overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm">
      <button onClick={() => setOpen((o) => !o)} className="flex w-full items-center justify-between px-5 py-3.5 min-h-[44px]">
        <span className="flex items-center gap-2 text-xs font-bold text-slate-700"><Crown size={15} className="text-[#F5B72E]" /> Cena po rangu u mreži</span>
        <ChevronDown size={16} className={`text-slate-400 transition ${open ? "rotate-180" : ""}`} />
      </button>
      {open && (
        <div className="border-t border-slate-100">
          {RANKS.map((r) => {
            const price = p.mp * (1 - r.discount); const on = r.key === rank;
            return (
              <button key={r.key} onClick={() => setRank(r.key)} className="flex w-full items-center justify-between px-5 py-3 text-xs transition hover:bg-slate-50 min-h-[40px] text-left" style={on ? { background: SKY } : {}}>
                <span className="flex items-center gap-2">
                  {r.mlm ? <Crown size={13} className="text-[#0E4DA4]" /> : <span className="inline-block w-[13px]" />}
                  <span className={on ? "font-bold text-[#0E4DA4]" : "text-slate-600"}>{r.name}</span>
                  {r.discount > 0 && <span className="text-[11px] font-bold text-amber-500">−{pct(r.discount)}%</span>}
                  {r.discount === MAX_DISCOUNT && <span className="rounded-full bg-slate-200/50 px-2 py-0.5 text-[8px] font-bold uppercase tracking-wider text-slate-500">Max</span>}
                </span>
                <span className="flex items-center gap-2">
                  <span className="font-bold text-slate-800" style={on ? { color: BRAND } : {}}>{fmt(price, market)}</span>
                  {on ? <Check size={15} className="text-[#0E4DA4]" /> : <Lock size={12} className="text-slate-300" />}
                </span>
              </button>
            );
          })}
          <div className="px-5 py-3 text-[10px] leading-normal text-slate-400 bg-slate-50/50 border-t border-slate-100">Popusti po rangu su konfigurabilni (mock). Viši rang = veći popust, do −{pct(MAX_DISCOUNT)}%.</div>
        </div>
      )}
    </div>
  );
}

// ── Footer ────────────────────────────────────────────────────
function Footer() {
  const cols = [
    ["Kategorije proizvoda", ["Bioptron terapija", "Pametne naočare", "Kuvanje na zdrav način", "Zdrav vazduh", "Prečišćena voda", "Zdrav dom", "Prirodna lepota", "Luksuz i stil"]],
    ["Uslovi i odredbe", ["Dozvola za prodaju", "Dokumenti", "Internet trgovina", "Dostava i plaćanje", "BizzClub uslovi", "Politika privatnosti"]],
    ["Kontaktirajte nas", ["customersupport@zepter.rs", "Call Center: 0800 234567", "Telefon: 011/311-3233", "Radnje i galerije širom Srbije"]],
  ];

  return (
    <footer className="bg-[#13315C] text-slate-300 border-t border-slate-800">
      <div className="mx-auto max-w-7xl px-4 py-12">
        <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-5">
          {cols.map(([h, items]) => (
            <div key={h} className="lg:col-span-1">
              <h4 className="mb-4 text-sm font-bold text-white uppercase tracking-wider">{h}</h4>
              <ul className="space-y-2.5 text-xs text-slate-300">
                {items.map((it) => (
                  <li key={it} className="hover:text-white transition-colors cursor-pointer">
                    {it}
                  </li>
                ))}
              </ul>
            </div>
          ))}

          {/* Download App & Payments column */}
          <div className="lg:col-span-2 space-y-6">
            <div>
              <h4 className="mb-4 text-sm font-bold text-white uppercase tracking-wider">Preuzmite mobilnu aplikaciju</h4>
              <div className="flex flex-wrap gap-3">
                {/* App Store Badge */}
                <div className="flex items-center gap-2 bg-black text-white px-3 py-1.5 rounded-lg border border-slate-800 w-36 hover:bg-slate-900 transition cursor-pointer select-none">
                  <svg className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M18.71 19.5C17.88 20.74 17 21.95 15.66 21.97C14.32 22 13.89 21.18 12.37 21.18C10.84 21.18 10.37 21.95 9.1 22C7.79 22.05 6.8 20.68 5.96 19.47C4.25 17 2.94 12.45 4.7 9.39C5.57 7.87 7.13 6.91 8.82 6.88C10.1 6.86 11.32 7.75 12.11 7.75C12.89 7.75 14.37 6.68 15.92 6.84C16.57 6.87 18.39 7.1 19.56 8.82C19.47 8.88 17.39 10.1 17.41 12.63C17.44 15.65 20.06 16.66 20.1 16.67C20.08 16.74 19.67 18.11 18.71 19.5M15.97 4.17C16.63 3.37 17.07 2.28 16.95 1C15.85 1.04 14.51 1.73 13.73 2.64C13.07 3.41 12.49 4.52 12.64 5.78C13.87 5.87 15.12 5.17 15.97 4.17Z"/>
                  </svg>
                  <div className="text-[10px] leading-tight text-left">
                    <span className="block text-[8px] text-slate-400">Download on the</span>
                    App Store
                  </div>
                </div>
                {/* Google Play Badge */}
                <div className="flex items-center gap-2 bg-black text-white px-3 py-1.5 rounded-lg border border-slate-800 w-36 hover:bg-slate-900 transition cursor-pointer select-none">
                  <svg className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M5.25 3.125C5.06641 3.125 4.90234 3.20312 4.78906 3.32812L12.5625 11.1094L16.2969 7.375L5.25 3.125ZM4.125 4.17188V19.8281C4.125 19.9805 4.18359 20.1211 4.28125 20.2344L11.7031 12.8125L4.125 4.17188ZM17.1562 8.20312L13.4375 11.9219L17.2031 15.6875L20.4062 13.8438C21.1094 13.4375 21.1094 12.5625 20.4062 12.1562L17.1562 8.20312ZM12.5625 12.9219L4.8125 20.6719C4.91406 20.7812 5.06641 20.875 5.25 20.875L16.3125 16.625L12.5625 12.9219Z"/>
                  </svg>
                  <div className="text-[10px] leading-tight text-left">
                    <span className="block text-[8px] text-slate-400">GET IT ON</span>
                    Google Play
                  </div>
                </div>
              </div>
            </div>

            <div>
              <h4 className="mb-4 text-sm font-bold text-white uppercase tracking-wider">Načini plaćanja</h4>
              <div className="flex flex-wrap gap-2.5 items-center">
                <div className="bg-white text-[#0A2F64] px-2.5 py-1 rounded font-bold text-[10px] shadow-sm border border-slate-200">
                  Banca Intesa
                </div>
                <div className="bg-white text-[#1A1F71] px-3 py-1 rounded font-extrabold text-[10px] shadow-sm border border-slate-200 italic">
                  VISA
                </div>
                <div className="bg-white px-2.5 py-1 rounded shadow-sm border border-slate-200 flex items-center gap-1">
                  <div className="w-3 h-3 rounded-full bg-[#EB001B] opacity-90" />
                  <div className="w-3 h-3 rounded-full bg-[#F79E1B] opacity-90 -ml-2" />
                  <span className="text-[8px] font-bold text-slate-800">mastercard</span>
                </div>
                <div className="bg-white px-2.5 py-1 rounded shadow-sm border border-slate-200 flex items-center gap-1">
                  <div className="w-3 h-3 rounded-full bg-[#00A6FF] opacity-90" />
                  <div className="w-3 h-3 rounded-full bg-[#EB001B] opacity-90 -ml-2" />
                  <span className="text-[8px] font-bold text-slate-800">maestro</span>
                </div>
                <div className="bg-white text-[#E11A24] px-2 py-1 rounded font-black text-[9px] shadow-sm border border-slate-200">
                  DinaCard
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-12 border-t border-slate-800 pt-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <div>
            <span className="font-bold text-white">ZEUS</span> · Zepter International · E-Commerce platforma
          </div>
          <div>
            © Copyright {new Date().getFullYear()} by Zepter International
          </div>
        </div>
      </div>
    </footer>
  );
}
