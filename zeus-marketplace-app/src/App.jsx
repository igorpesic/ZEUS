import { useMemo, useState, useRef, useEffect } from "react";
import { Tag, Truck, Globe, Gift, Sun, Moon } from "lucide-react";

// ──────────────────────────────────────────────────────────────────────────
// ZEUS — Marketplace
// Faithful React port of the Claude Design handoff: "ZEUS Marketplace.dc.html".
// Luxury members-club + global marketplace for Zepter International.
//
// Live engine: rank switcher (Gost → District Manager, −40%) + currency
// (RSD/EUR/USD/BRL) in the prototype bar drive every price across 8 screens.
// Styles are kept 1:1 with the design via the css() string→object helper;
// :hover behaviours (the design's style-hover) live in index.css as z-* classes.
// ──────────────────────────────────────────────────────────────────────────

// Convert a CSS declaration string into a React style object so the design's
// inline style="" strings can be reused verbatim.
function css(str) {
  const o = {};
  for (const decl of str.split(";")) {
    const i = decl.indexOf(":");
    if (i < 0) continue;
    const k = decl.slice(0, i).trim();
    const v = decl.slice(i + 1).trim();
    if (!k) continue;
    o[k.replace(/-([a-z])/g, (_, c) => c.toUpperCase())] = v;
  }
  return o;
}
const A = (p) => (p ? (p.startsWith("/") ? p : "/" + p) : "");

// ── Data ───────────────────────────────────────────────────────────────────
const RANKS = [
  { id: "guest", name: "Gost", disc: 0 },
  { id: "member", name: "BizzClub Member", disc: 5 },
  { id: "consultant", name: "Club Consultant", disc: 20 },
  { id: "team", name: "Team Manager", disc: 28 },
  { id: "sales", name: "Sales Manager", disc: 34 },
  { id: "district", name: "District Manager", disc: 40 },
];
const CURR = [
  { id: "rs", loc: "Srbija", label: "Srbija · RSD", cur: "RSD", rate: 1, suffix: true },
  { id: "eu", loc: "Eurozona", label: "Eurozona · EUR", cur: "EUR", sym: "€", rate: 0.00854, suffix: false },
  { id: "us", loc: "USA", label: "USA · USD", cur: "USD", sym: "$", rate: 0.00925, suffix: false },
  { id: "br", loc: "Brazil", label: "Brazil · BRL", cur: "BRL", sym: "R$", rate: 0.0506, suffix: false },
];
const PRODUCTS = [
  { id: "bulova", name: "Bulova 98A227 Marine Star", cat: "Ručni satovi", brand: "Bulova", sku: "98A227", mp: 72890, img: "assets/products/bulova.png", rating: 4.8, reviews: 42, badge: "", promo: 0 },
  { id: "myionz", name: "Nosivi sterilizator vazduha MyionZ PRO", cat: "Prečišćivači vazduha", brand: "Zepter", sku: "MZ-PRO", mp: 21830, img: "assets/products/myionz.png", rating: 4.6, reviews: 128, badge: "Besplatna dostava", promo: 0 },
  { id: "bioptron", name: "Bioptron PRO 1 svetlosna terapija", cat: "Svetlosna terapija", brand: "Zepter Medical", sku: "EC534", mp: 305738, img: "assets/products/bioptron.png", rating: 4.9, reviews: 67, badge: "", promo: 0 },
  { id: "bosch", name: "Bosch WAT2846SIN Series 6, 8 kg", cat: "Veš mašine", brand: "Bosch", sku: "WAT2846SIN", mp: 119990, img: "assets/products/bosch-masina.png", rating: 4.7, reviews: 215, badge: "Preostalo 2 komada", promo: 10 },
  { id: "aqeena", name: "Aqeena PRO prečišćivač vode", cat: "Prečišćena voda", brand: "Zepter", sku: "WT-100", mp: 170156, img: "assets/products/aqeena.png", ph: "prečišćivač vode", rating: 4.8, reviews: 54, badge: "", promo: 0 },
  { id: "edel", name: "EdelWasser Gold sistem za vodu", cat: "Prečišćena voda", brand: "Zepter", sku: "PWC-670-GOLD", mp: 83898, img: "assets/products/edelwasser.png", ph: "EdelWasser Gold", rating: 4.5, reviews: 31, badge: "", promo: 10 },
  { id: "hyper", name: "HyperLight Eyewear Clips pametne naočare", cat: "Pametne naočare", brand: "Zepter", sku: "EC534-CL", mp: 63012, img: "assets/products/hyperlight-clips.png", ph: "pametne naočare", rating: 4.7, reviews: 19, badge: "", promo: 0 },
  { id: "bioptron2", name: "Bioptron PRO 2 svetlosna terapija", cat: "Svetlosna terapija", brand: "Zepter Medical", sku: "EC535", mp: 1357236, img: "", ph: "Bioptron PRO 2", rating: 5.0, reviews: 12, badge: "", promo: 0 },
  { id: "macbook", name: "MacBook Air M1 256GB Space Gray", cat: "Računari i mobilni", brand: "iSTYLE", sku: "PAG-990", mp: 161190, img: "assets/mp/products/macbook-air.png", rating: 4.8, reviews: 0, badge: "", promo: 0 },
  { id: "mercedesS", name: "Mercedes-Benz S-Class 320 CDi AMG", cat: "Automobili", brand: "Mercedes-Benz", sku: "PAG-990", mp: 0, img: "assets/mp/products/mercedes-s.png", rating: 5.0, reviews: 0, badge: "", promo: 0, inquire: true, topTag: "Hybrid", priceNote: "Učlanite se i kupite po privilegovanoj ceni" },
];
const SCREENMETA = [
  { id: "home", label: "Početna" }, { id: "plp", label: "Katalog" }, { id: "pdp", label: "Proizvod" },
  { id: "cart", label: "Korpa" }, { id: "checkout", label: "Plaćanje" }, { id: "outlet", label: "Outlet" },
  { id: "bizz", label: "BizzClub" }, { id: "ds", label: "Dizajn sistem" },
];
const CATEGORIES = ["Računari i laptopovi", "Posuđe", "Ručni satovi", "Nameštaj", "Mašine za pranje sudova", "Prečišćivači vazduha", "Televizori"];
const byId = (id) => PRODUCTS.find((p) => p.id === id);

// ── Outlet (aukcije) ─────────────────────────────────────────────────────────
// Stanje proizvoda (Outlet tip) — chip + ⓘ tooltip.
const CONDITIONS = {
  otpakovano: { label: "Otpakovano", info: "Otvorena kutija — proizvod proveren i potpuno ispravan." },
  rasprodaja: { label: "Rasprodaja", info: "Poslednji primerci iz redovne ponude." },
  repariran: { label: "Repariran", info: "Fabrički servisiran i testiran — radi kao nov." },
};
// Aukcije. Cene su baza RSD (idu kroz fmt()); timeLeft je "HH:MM:SS" i otkucava
// realno vreme (reset na ulazak u Outlet). Namerno pokrivena sva UI stanja:
//  bosch → <5min (danger+puls) + nadmašena ponuda + rezerva nedostignuta;
//  hyper → <1h (gold); aqeena → istekla (Aukcija završena); ostale > 1h.
const AUCTIONS = [
  { id: "bulova", name: "Bulova 98A227 Marine Star", cat: "Ručni satovi", img: "assets/products/bulova.png", cond: "otpakovano", bid: 48900, bidsCount: 14, buy: 72890, stock: 2, timeLeft: "02:14:38", reserveMet: true, featured: true },
  { id: "hyper", name: "HyperLight Eyewear Clips pametne naočare", cat: "Pametne naočare", img: "assets/products/hyperlight-clips.png", cond: "rasprodaja", bid: 41200, bidsCount: 9, buy: 63012, stock: 5, timeLeft: "00:41:10", reserveMet: true, featured: true },
  { id: "bosch", name: "Bosch WAT2846SIN Series 6, 8 kg", cat: "Veš mašine", img: "assets/products/bosch-masina.png", cond: "repariran", bid: 79900, bidsCount: 21, buy: 119990, stock: 1, timeLeft: "00:03:42", reserveMet: false, featured: true, mine: { placed: 76500, outbid: true } },
  { id: "myionz", name: "Nosivi sterilizator vazduha MyionZ PRO", cat: "Prečišćivači vazduha", img: "assets/products/myionz.png", cond: "otpakovano", bid: 13900, bidsCount: 6, buy: 21830, stock: 3, timeLeft: "05:41:02", reserveMet: true },
  { id: "aqeena", name: "Aqeena PRO prečišćivač vode", cat: "Prečišćena voda", img: "assets/products/aqeena.png", cond: "repariran", bid: 118000, bidsCount: 11, buy: 170156, stock: 2, timeLeft: "00:00:00", reserveMet: true, ended: true },
  { id: "edel", name: "EdelWasser Gold sistem za vodu", cat: "Prečišćena voda", img: "assets/products/edelwasser.png", cond: "rasprodaja", bid: 60100, bidsCount: 4, buy: 83898, stock: 8, timeLeft: "01:12:30", reserveMet: true },
];
const byAuction = (id) => AUCTIONS.find((a) => a.id === id);
// Bento kategorije (postojeće slike): 1 velika + 3 male.
const OUTLET_CATS = [
  { name: "Prečišćena voda", img: "assets/znew/promo-voda.png", big: true },
  { name: "Bioptron terapija", img: "assets/znew/bioptron-eye.png" },
  { name: "Zdravo kuvanje", img: "assets/znew/plates.jpg" },
  { name: "Pametne naočare", img: "assets/home/hyperlight.png" },
];

// ── App ──────────────────────────────────────────────────────────────────────
export default function App() {
  const [state, setState] = useState({
    screen: "home",
    rankIdx: 0,
    curIdx: 0,
    wishlist: { bulova: true, bioptron: true },
    cart: [{ id: "bulova", qty: 1 }, { id: "myionz", qty: 2 }],
    pdpId: "bioptron",
    qty: 1,
    acc: "dim",
    outletFilter: "sve",
    outletView: "list",
    auctionId: "bulova",
    outletHero: 0,
    outletTab: "opis",
    outletBid: "",
    outletLoading: false,
    outletNav: "deals",
    searchQ: "",
    searchFrom: "home",
    megaOpen: false,
    megaTab: "shop",
  });
  const patch = (p) => setState((s) => ({ ...s, ...(typeof p === "function" ? p(s) : p) }));
  const searchInputRef = useRef(null);

  const setScreen = (screen) => { patch({ screen }); window.scrollTo(0, 0); };
  const setRank = (rankIdx) => patch({ rankIdx });
  const toggleWish = (id) => patch((s) => ({ wishlist: { ...s.wishlist, [id]: !s.wishlist[id] } }));
  const addToCart = (id, n = 1) => patch((s) => {
    const ex = s.cart.find((c) => c.id === id);
    const cart = ex ? s.cart.map((c) => (c.id === id ? { ...c, qty: c.qty + n } : c)) : [...s.cart, { id, qty: n }];
    return { cart };
  });
  const changeQty = (id, d) => patch((s) => ({ cart: s.cart.map((c) => (c.id === id ? { ...c, qty: Math.max(1, c.qty + d) } : c)) }));
  const removeItem = (id) => patch((s) => ({ cart: s.cart.filter((c) => c.id !== id) }));
  const openPDP = (id) => { patch({ screen: "pdp", pdpId: id, qty: 1 }); window.scrollTo(0, 0); };

  const fmt = useMemo(() => {
    const c = CURR[state.curIdx];
    return (rsd) => {
      const v = rsd * c.rate;
      const parts = v.toFixed(2).split(".");
      const intg = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ".");
      const num = intg + "," + parts[1];
      return c.suffix ? num + " " + c.cur : c.sym + " " + num;
    };
  }, [state.curIdx]);
  const rankPrice = (mp) => mp * (1 - RANKS[state.rankIdx].disc / 100);

  const dispProduct = (p) => {
    const r = RANKS[state.rankIdx];
    const w = state.wishlist;
    return {
      ...p,
      hasImg: !!p.img, noImg: !p.img, img: A(p.img),
      mpStr: fmt(p.mp), rankStr: fmt(rankPrice(p.mp)),
      showRank: r.disc > 0, showGuest: r.disc === 0,
      discLabel: "−" + r.disc + "%",
      promoOn: p.promo > 0,
      heartFill: w[p.id] ? "var(--z-brand)" : "none",
      heartStroke: w[p.id] ? "var(--z-brand)" : "var(--z-ink)",
      open: () => openPDP(p.id),
      add: () => addToCart(p.id, 1),
      wish: () => toggleWish(p.id),
    };
  };

  // ── derived values (mirrors the design's renderVals) ──
  const ri = state.rankIdx, ci = state.curIdx;
  const rank = RANKS[ri], cur = CURR[ci], scr = state.screen;

  useEffect(() => {
    if (scr === "search") { const t = setTimeout(() => searchInputRef.current?.focus(), 60); return () => clearTimeout(t); }
  }, [scr]);

  useEffect(() => {
    if (!state.megaOpen) return;
    const onKey = (e) => { if (e.key === "Escape") setState((s) => ({ ...s, megaOpen: false })); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [state.megaOpen]);

  // Close the mega menu whenever we navigate to another screen.
  useEffect(() => { setState((s) => (s.megaOpen ? { ...s, megaOpen: false } : s)); }, [scr]);

  // ── Live auction countdowns ────────────────────────────────────────────
  // Prototype: entering Outlet resets each timer to its designed value, then
  // ticks it down once per second. The interval only runs while on Outlet.
  const [, setClock] = useState(0);
  const outletBase = useRef(0);
  useEffect(() => {
    if (scr !== "outlet") return;
    outletBase.current = Date.now();
    setClock((n) => n + 1);
    const t = setInterval(() => setClock((n) => n + 1), 1000);
    return () => clearInterval(t);
  }, [scr]);
  const pad2 = (n) => String(n).padStart(2, "0");
  const remain = (str) => {
    const [h, m, s] = str.split(":").map(Number);
    const total = (h * 3600 + m * 60 + s) * 1000 - (Date.now() - (outletBase.current || Date.now()));
    const sec = Math.max(0, Math.floor(total / 1000));
    return { sec, h: pad2(Math.floor(sec / 3600)), m: pad2(Math.floor((sec % 3600) / 60)), s: pad2(sec % 60), str: pad2(Math.floor(sec / 3600)) + ":" + pad2(Math.floor((sec % 3600) / 60)) + ":" + pad2(sec % 60) };
  };
  // Countdown boja po stanju: >1h ink-2 · <1h zlato · <5min danger (puls).
  const cdColor = (sec) => (sec <= 0 ? "var(--z-ink-3)" : sec < 300 ? "var(--z-danger)" : sec < 3600 ? "var(--z-gold)" : "var(--z-ink-2)");
  const cdPulse = (sec) => sec > 0 && sec < 300;

  const screens = SCREENMETA.map((s) => ({
    label: s.label,
    bg: s.id === scr ? "var(--z-gold)" : "rgba(255,255,255,0.08)",
    fg: s.id === scr ? "var(--z-gold-ink)" : "rgba(255,255,255,0.75)",
    go: () => setScreen(s.id),
  }));
  const ranks = RANKS.map((r, i) => ({
    name: r.name,
    discTag: r.disc > 0 ? "−" + r.disc + "%" : "",
    pbg: i === ri ? "var(--z-gold)" : "rgba(255,255,255,0.06)",
    pfg: i === ri ? "var(--z-gold-ink)" : "rgba(255,255,255,0.8)",
    pborder: i === ri ? "var(--z-gold)" : "rgba(255,255,255,0.15)",
    pick: () => setRank(i),
  }));

  const cartRows = state.cart.map((c) => {
    const p = byId(c.id);
    return {
      id: p.id, name: p.name, cat: p.cat, sku: p.sku, qty: c.qty,
      hasImg: !!p.img, noImg: !p.img, img: A(p.img),
      lineStr: fmt(rankPrice(p.mp) * c.qty),
      lineMpStr: fmt(p.mp * c.qty),
      showRank: rank.disc > 0,
      inc: () => changeQty(p.id, 1), dec: () => changeQty(p.id, -1), remove: () => removeItem(p.id),
    };
  });
  const mpTotal = state.cart.reduce((a, c) => a + byId(c.id).mp * c.qty, 0);
  const rankTotal = state.cart.reduce((a, c) => a + rankPrice(byId(c.id).mp) * c.qty, 0);
  const savings = mpTotal - rankTotal;

  const pdpP = byId(state.pdpId);
  const pdp = dispProduct(pdpP);
  const rankTable = RANKS.map((r, i) => ({
    name: r.name,
    discLabel: r.disc === 0 ? "MP Cena" : "−" + r.disc + "%",
    priceStr: fmt(pdpP.mp * (1 - r.disc / 100)),
    maxTag: r.disc === 40, youTag: i === ri,
    rowBg: i === ri ? "var(--z-brand-050)" : "var(--z-surface)",
    nameColor: i === ri ? "var(--z-brand)" : "var(--z-ink)",
    priceColor: i === ri ? "var(--z-brand-ink)" : "var(--z-ink)",
  }));
  const pdpThumbs = [0, 1, 2, 3].map((i) => ({ border: i === 0 ? "var(--z-brand)" : "var(--z-line)" }));
  const accData = [
    { key: "dim", title: "Dimenzije uređaja", rows: [{ k: "Visina", v: "42 cm" }, { k: "Širina", v: "28 cm" }, { k: "Dubina", v: "21 cm" }, { k: "Težina", v: "3,4 kg" }] },
    { key: "tech", title: "Tehnički podaci", rows: [{ k: "Snaga", v: "90 W" }, { k: "Napajanje", v: "220–240 V" }, { k: "Talasna dužina", v: "480–3400 nm" }, { k: "Garancija", v: "24 meseca" }] },
    { key: "about", title: "O proizvodu", rows: [{ k: "Proizvođač", v: pdpP.brand }, { k: "Kategorija", v: pdpP.cat }, { k: "SKU", v: pdpP.sku }] },
  ];
  const accordions = accData.map((a) => ({
    title: a.title,
    open: state.acc === a.key,
    sign: state.acc === a.key ? "−" : "+",
    toggle: () => patch((s) => ({ acc: s.acc === a.key ? "" : a.key })),
    rows: a.rows.map((r, i) => ({ ...r, bg: i % 2 ? "var(--z-surface-2)" : "var(--z-surface)" })),
  }));
  const isZ = (b) => /zepter/i.test(b || "");
  const simSameCat = PRODUCTS.filter((p) => p.cat === pdpP.cat && p.id !== pdpP.id);
  const simRelated = PRODUCTS.filter((p) => p.id !== pdpP.id && p.cat !== pdpP.cat && (p.brand === pdpP.brand || (isZ(p.brand) && isZ(pdpP.brand))));
  const simRest = PRODUCTS.filter((p) => p.id !== pdpP.id && p.cat !== pdpP.cat && !(p.brand === pdpP.brand || (isZ(p.brand) && isZ(pdpP.brand))));
  const similar = [...simSameCat, ...simRelated, ...simRest].slice(0, 4)
    .map((p) => {
      const d = dispProduct(p);
      return { ...d, mainStr: rank.disc > 0 ? d.rankStr : d.mpStr, priceColor: rank.disc > 0 ? "var(--z-brand-ink)" : "var(--z-ink)" };
    });

  const CIRCLES = [
    { name: "Bioptron\nhipersvetlosna terapija", img: "assets/categories/Bioptron.png" },
    { name: "Pametne\nnaočare", img: "assets/categories/Pametne_naocare.png", size: 96 },
    { name: "Kuvanje\nna zdrav način", img: "assets/categories/Kuvanje.png" },
    { name: "Zdrav\nvazduh", img: "assets/categories/Zdrav_vazduh.png" },
    { name: "Prečišćena\nvoda", img: "assets/categories/Preciscena_voda.png" },
    { name: "Zdrav\ndom", img: "assets/categories/Zdrav_dom.png" },
    { name: "Prirodna\nlepota", img: "assets/categories/Prirodna_lepota.png" },
    { name: "Luksuz\ni stil", img: "assets/categories/Luksuz_stil.png" },
  ];
  const catCircles = CIRCLES.map((c) => ({ name: c.name, img: A(c.img), hasImg: !!c.img, noImg: !c.img, size: c.size || 74, go: () => setScreen("plp") }));

  // ── MEGA MENU data ──────────────────────────────────────────────────────
  // Zepter Shop reuses the home-category pictograms (assets/categories/*).
  const SHOP_CATS = [
    { name: "Bioptron\nhipersvetlosna terapija", img: "assets/categories/Bioptron.png", items: ["Bioptron", "Kolor svetlosna terapija", "Filteri za Bioptron", "Postolja i držači", "Dodatno"] },
    { name: "Pametne\nnaočare", img: "assets/categories/Pametne_naocare.png", size: 84, items: ["Naočare za odrasle", "Naočare za decu", "Pametna sočiva"] },
    { name: "Kuvanje na\nzdrav način", img: "assets/categories/Kuvanje.png", items: ["Posuđe", "Noževi", "Vakumiranje i čuvanje hrane", "Mali kuhinjski aparati"] },
    { name: "Zdrav\nvazduh", img: "assets/categories/Zdrav_vazduh.png", items: ["Prečišćivači vazduha", "Nosivi sterilizatori vazduha", "Filteri za Therapy Air iON"] },
    { name: "Prečišćena\nvoda", img: "assets/categories/Preciscena_voda.png", items: ["Prečišćivači vode", "Filteri", "Slavina sa tri izvoda"] },
    { name: "Zdrav\ndom", img: "assets/categories/Zdrav_dom.png", items: ["Quanomed", "Čist dom"] },
    { name: "Prirodna\nlepota", img: "assets/categories/Prirodna_lepota.png", items: ["Parfemi", "Zepter kozmetika", "Ready for baby", "Masažer"] },
    { name: "Luksuz\ni stil", img: "assets/categories/Luksuz_stil.png", items: ["Luksuzno stono posuđe", "Torbe i novčanici", "Pokloni"] },
    { name: "Suplementi", img: "assets/categories/Suplementi.png", size: 58, items: ["Proizvodi"] },
  ];
  // Marketplace categories — product-cutout pictograms (assets/categories/*).
  const MP_CATS = [
    { name: "Automobili", img: "assets/categories/Automobili.png", size: 66, items: ["Mercedes-Benz", "Volks Wagen", "Audi", "Porsche"] },
    { name: "Nekretnine", img: "assets/categories/Nekretnine.png", size: 58, items: ["Stanovi", "Kuće", "Hoteli", "Poslovni prostor"] },
    { name: "Medikal", img: "assets/categories/Medikal.png", size: 62, items: ["MedicBooking", "Zepter Dental"] },
    { name: "Krstarenja", img: "assets/categories/Krstarenja.png", size: 66, items: ["JoyMe"] },
    { name: "Nameštaj", img: "assets/categories/Namestaj.png", size: 56, items: ["Komode", "Ormani", "Kreveti", "Stolovi"] },
    { name: "Mali kućni aparati", img: "assets/categories/Mali_kucni_aparati.png", size: 64, items: ["Mikseri", "Sokovnici", "Friteze"] },
    { name: "Bela tehnika", img: "assets/categories/Bela_tehnika.png", size: 58, items: ["Frižideri", "Šporeti", "Mašine za sudove"] },
    { name: "Računari i mobilni", img: "assets/categories/Racunari.png", size: 60, items: ["Desktop računari", "Laptopovi", "Mobilni"] },
    { name: "TV & Audio", img: "assets/categories/TV_Audio.png", size: 62, items: ["TV", "Sound system", "Muzičke linije", "Projektori"] },
  ];
  const megaTabs = [
    { id: "shop", label: "Zepter Shop", glyph: "shop", cats: SHOP_CATS },
    { id: "mp", label: "Marketplace", glyph: "mp", cats: MP_CATS },
  ];
  const activeMega = megaTabs.find((t) => t.id === state.megaTab) || megaTabs[0];
  const toggleMega = () => patch((s) => ({ megaOpen: !s.megaOpen }));
  const closeMega = () => patch({ megaOpen: false });
  const pickMega = () => { patch({ megaOpen: false }); setScreen("plp"); };
  const ICON_PATHS = {
    car: <><path d="M3 13l2-5a2 2 0 012-1.4h10A2 2 0 0119 8l2 5" /><path d="M3 13h18v4a1 1 0 01-1 1h-1a1 1 0 01-1-1v-1H6v1a1 1 0 01-1 1H4a1 1 0 01-1-1z" /><circle cx="7" cy="16" r="1" /><circle cx="17" cy="16" r="1" /></>,
    home: <><path d="M3 11l9-7 9 7" /><path d="M5 10v9a1 1 0 001 1h12a1 1 0 001-1v-9" /><path d="M9 20v-6h6v6" /></>,
    med: <><path d="M20.8 8.6a4.6 4.6 0 00-7.8-2.6L12 7l-1-1a4.6 4.6 0 00-6.5 6.5l6.5 6.6 6.5-6.6a4.6 4.6 0 001.3-3.9z" /></>,
    ship: <><path d="M3 16l1.6-5.2A1.5 1.5 0 016 9.7h12a1.5 1.5 0 011.4 1.1L21 16" /><path d="M12 4v6" /><path d="M9 7h6" /><path d="M2.5 16c1.5 1.3 2.5 1.3 4 0 1.5 1.3 2.5 1.3 4 0 1.5 1.3 2.5 1.3 4 0 1.5 1.3 2.5 1.3 4 0" /></>,
    sofa: <><path d="M4 11V8a2 2 0 012-2h12a2 2 0 012 2v3" /><path d="M3 12a2 2 0 012 2v2h14v-2a2 2 0 014 0" /><path d="M5 16v2M19 16v2" /><path d="M5 14h14" /></>,
    blender: <><path d="M7 3h9l-1.2 8H8.2z" /><path d="M9 11l-.5 5h7l-.5-5" /><path d="M8 20h8" /><path d="M10 16v4M14 16v4" /></>,
    fridge: <><rect x="6" y="3" width="12" height="18" rx="2" /><path d="M6 10h12" /><path d="M9 6.5v1.5M9 12.5v3" /></>,
    laptop: <><rect x="4" y="5" width="16" height="11" rx="1.5" /><path d="M2 20h20" /></>,
    tv: <><rect x="3" y="6" width="18" height="11" rx="1.5" /><path d="M8 21h8M12 17v4" /></>,
    supp: <><rect x="8" y="3" width="8" height="6" rx="1.5" /><path d="M9 9h6v9a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /><path d="M9 13h6" /></>,
    shop: <><path d="M4 4h2l1.2 11.4a1 1 0 001 .9h7.6a1 1 0 001-.8L19 8H6" /><circle cx="9" cy="20" r="1" /><circle cx="16" cy="20" r="1" /></>,
    mp: <><rect x="3" y="3" width="7" height="7" rx="1.5" /><rect x="14" y="3" width="7" height="7" rx="1.5" /><rect x="3" y="14" width="7" height="7" rx="1.5" /><rect x="14" y="14" width="7" height="7" rx="1.5" /></>,
  };
  const megaIcon = (key, s = 34, stroke = "var(--z-brand)") =>
    ICON_PATHS[key]
      ? <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" style={{ color: stroke }} strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">{ICON_PATHS[key]}</svg>
      : null;
  const catChips = ["Sve"].concat(CATEGORIES).map((c, i) => ({
    name: c,
    bg: i === 0 ? "var(--z-brand-050)" : "var(--z-surface)",
    fg: i === 0 ? "var(--z-brand)" : "var(--z-ink)",
    border: i === 0 ? "var(--z-brand)" : "var(--z-line)",
  }));
  const rankCards = RANKS.map((r) => ({
    name: r.name, discBig: "−" + r.disc + "%",
    maxTag: r.disc === 40,
    border: r.disc === 40 ? "var(--z-gold)" : "var(--z-line)",
  }));
  const benefits = [
    { Icon: Tag, title: "Do −40% popusta", desc: "Trajne privilegovane cene na sve proizvode i brendove." },
    { Icon: Truck, title: "Besplatna dostava", desc: "Brza i pouzdana isporuka na vašu adresu." },
    { Icon: Globe, title: "Globalni affiliate", desc: "Vaš link prepoznaje tržište kupca i njegovu valutu." },
    { Icon: Gift, title: "Pokloni i akcije", desc: "Ekskluzivne promocije i poklon opcije za članove." },
  ];
  // ── Outlet derived ─────────────────────────────────────────────────────────
  const openAuction = (id) => { patch({ outletView: "auction", auctionId: id, outletTab: "opis", outletBid: "" }); window.scrollTo(0, 0); };
  const backToOutlet = () => { patch({ outletView: "list" }); window.scrollTo(0, 0); };
  const pickOutletFilter = (id) => { patch({ outletFilter: id, outletLoading: true }); setTimeout(() => patch({ outletLoading: false }), 420); };
  const auctionView = (a) => {
    const cd = remain(a.timeLeft);
    const ended = !!a.ended || cd.sec <= 0;
    return {
      ...a, img: A(a.img), hasImg: !!a.img,
      condLabel: CONDITIONS[a.cond].label, condInfo: CONDITIONS[a.cond].info,
      bidStr: fmt(a.bid), buyStr: fmt(a.buy), mineStr: a.mine ? fmt(a.mine.placed) : "",
      cd, ended, cdCol: ended ? "var(--z-ink-3)" : cdColor(cd.sec), pulse: !ended && cdPulse(cd.sec),
      open: () => openAuction(a.id), wish: () => toggleWish(a.id),
      heartFill: state.wishlist[a.id] ? "var(--z-brand)" : "none",
      heartStroke: state.wishlist[a.id] ? "var(--z-brand)" : "var(--z-ink-3)",
    };
  };
  const auctionsView = AUCTIONS.map(auctionView);
  const heroAuctions = auctionsView.filter((a) => a.featured);
  const heroA = heroAuctions[state.outletHero % heroAuctions.length];
  const cycleHero = (d) => patch((s) => ({ outletHero: (s.outletHero + d + heroAuctions.length) % heroAuctions.length }));
  const outletFilterMeta = [{ id: "sve", label: "Sve" }, { id: "stanje", label: "Na stanju" }, { id: "vreme", label: "Ograničeno vreme" }];
  const matchOutletFilter = (a) =>
    state.outletFilter === "stanje" ? (!a.ended && a.stock > 0)
      : state.outletFilter === "vreme" ? (!a.ended && a.cd.sec > 0 && a.cd.sec < 3600)
        : true;
  const outletList = auctionsView.filter(matchOutletFilter);
  const pdpA = auctionView(byAuction(state.auctionId) || AUCTIONS[0]);
  const swatches = [
    { name: "Brand tirkiz", hex: "var(--z-brand)" }, { name: "Deep (CTA)", hex: "var(--z-deep)" },
    { name: "Zlato", hex: "var(--z-gold)" }, { name: "Brand ink", hex: "var(--z-brand-ink)" },
    { name: "Brand 050", hex: "var(--z-brand-050)" }, { name: "Surface 2", hex: "var(--z-surface-2)" },
    { name: "Ink", hex: "var(--z-ink)" }, { name: "Pozadina", hex: "var(--z-bg)" },
  ];

  const featured = ["bioptron", "hyper", "myionz"].map((id) => dispProduct(byId(id)));
  const promoProducts = ["aqeena", "edel"].map((id) => dispProduct(byId(id)));
  const allProducts = PRODUCTS.map((p) => dispProduct(p));
  const searchQ = state.searchQ.trim().toLowerCase();
  const searchResults = searchQ ? allProducts.filter((p) => (p.name + " " + p.cat + " " + (p.brand || "")).toLowerCase().includes(searchQ)) : [];
  const wishCount = Object.values(state.wishlist).filter(Boolean).length;
  const cartCount = state.cart.reduce((a, c) => a + c.qty, 0);

  const goHome = () => setScreen("home");
  const goPlp = () => setScreen("plp");
  const goCart = () => setScreen("cart");
  const goCheckout = () => setScreen("checkout");
  const goBizz = () => setScreen("bizz");
  const goOutlet = () => setScreen("outlet");
  const goSearch = () => setScreen("plp");
  const openSearch = () => { patch((s) => ({ screen: "search", searchFrom: s.screen })); window.scrollTo(0, 0); };
  const closeSearch = () => setScreen(state.searchFrom || "home");
  const goWish = () => setScreen("plp");
  const goMarketplace = () => setScreen("mp");
  const toggleTheme = () => {
    const el = document.documentElement;
    const next = el.getAttribute("data-theme") === "dark" ? "light" : "dark";
    el.setAttribute("data-theme", next);
    try { localStorage.setItem("zeus-theme", next); } catch (e) {}
  };

  // ── MARKETPLACE landing data ──────────────────────────────────────────────
  // Popularne kategorije reuses the marketplace pictograms from the mega menu.
  // Per-category pictogram scale (% of circle). Some artworks carry more padding,
  // so they get an extra boost to read as evenly sized as the rest.
  const CAT_SCALE = { "Automobili": 150, "Nekretnine": 150, "Krstarenja": 150, "Mali kućni aparati": 150 };
  const mpCircles = MP_CATS.slice(0, 8).map((c) => ({ name: c.name, img: A(c.img), scale: CAT_SCALE[c.name] || 120, go: goPlp }));
  // Izdvajamo iz ponude — drawn from the live catalogue (prices/rank/currency stay live).
  const mpFeatured = ["bulova", "bosch", "macbook", "mercedesS"].map((id) => dispProduct(byId(id)));
  // Popularni brendovi — official logo files (assets/mp/brands/*).
  const MP_BRANDS = [
    { name: "Bosch", img: "assets/mp/brands/bosch.png" },
    { name: "Mercedes-Benz", img: "assets/mp/brands/mercedes.png", h: 60 },
    { name: "Samsung", img: "assets/mp/brands/samsung.png" },
    { name: "Miele", img: "assets/mp/brands/miele.png", h: 34 },
    { name: "Whirlpool", img: "assets/mp/brands/whirlpool.png" },
    { name: "Siemens", img: "assets/mp/brands/siemens.png", w: 125 },
    { name: "Porsche", img: "assets/mp/brands/porsche.png" },
    { name: "Candy", img: "assets/mp/brands/candy.png" },
    { name: "Audi", img: "assets/mp/brands/audi.png" },
    { name: "gorenje", img: "assets/mp/brands/gorenje.png" },
  ];
  // Blog — generated lifestyle imagery; first post carries an author byline.
  const MP_BLOG = [
    { title: "Kakvu vodu pijemo?", img: "assets/mp/blog-water.jpg", excerpt: "Konzumiranje kvalitetne vode je od vitalnog značaja za očuvanje zdravlja tela i uma, koji su sve načini da prečistite vodu od štetnih materija…", author: "Prof. dr Vladimir Ilić", role: "Doktor nauka iz oblasti humane lokomocije" },
    { title: "10 najboljih uređaja za pripremanje prirodnih sokova", img: "assets/mp/blog-juicer.jpg", excerpt: "Sveže ceđeni sokovi su najbolji izvor vitamina i minerala. Izdvojili smo deset uređaja koji će vam pomoći da ih spremite kod kuće…" },
    { title: "Sam svoj majstor — održavanje prečišćivača vazduha i klima", img: "assets/mp/blog-air.jpg", excerpt: "Redovno održavanje produžava vek uređaja i čuva kvalitet vazduha u vašem domu. Donosimo praktične savete za svaku sezonu…" },
    { title: "Zdrav način života za bolje sutra", img: "assets/mp/blog-life.jpg", excerpt: "Stara poslovica nas uči da tek kada bude posečeno poslednje drvo i ulovljena poslednja riba, shvatićemo da ne možemo da „jedemo\" novac…" },
  ];
  // Hero vertical slider — finished design cards (logo baked in), top→bottom order.
  const mpCars = [
    { img: "assets/mp/slider-vw.png", label: "Volkswagen Arteon" },
    { img: "assets/mp/slider-audi.png", label: "Audi A8" },
    { img: "assets/mp/slider-porsche.png", label: "Porsche" },
  ];

  const heart = (fill, stroke, w = 22) => (
    <svg width={w} height={w} viewBox="0 0 24 24" style={{ fill, stroke }} strokeWidth="1.8">
      <path d="M20.8 4.6a5.5 5.5 0 00-7.8 0L12 5.6l-1-1a5.5 5.5 0 10-7.8 7.8l1 1L12 21l7.8-7.6 1-1a5.5 5.5 0 000-7.8z" />
    </svg>
  );

  // Promo discount badge — outlined gold hexagon (Sale.svg) with the % inside.
  const PromoHex = ({ label, h = 39 }) => {
    const w = (h * 30) / 35;
    return (
      <span style={{ position: "relative", display: "inline-flex", width: w + "px", height: h + "px", alignItems: "center", justifyContent: "center", flex: "none" }}>
        <svg width={w} height={h} viewBox="0 0 30 35" fill="none" style={{ position: "absolute", inset: 0, color: "var(--z-gold)" }}>
          <path d="M29.2129 25.4438L28.9629 25.5874L15.1064 33.5874L14.8564 33.7319L14.6064 33.5874L0.75 25.5874L0.5 25.4438V8.86572L0.75 8.72217L14.6064 0.722168L14.8564 0.577637L15.1064 0.722168L28.9629 8.72217L29.2129 8.86572V25.4438Z" stroke="currentColor" />
        </svg>
        <span style={{ position: "relative", fontFamily: "Inter", fontWeight: 700, fontSize: Math.round(h * 0.26) + "px", color: "var(--z-gold)", letterSpacing: "-0.02em" }}>{label}</span>
      </span>
    );
  };

  // ── Reusable product card (Home featured/promo share this) ──
  const ProductCard = ({ p }) => (
    <div className="z-card-sm" style={css("background:var(--z-surface);border:1px solid var(--z-line);border-radius:12px;overflow:hidden;display:flex;flex-direction:column;")}>
      <div style={css("position:relative;padding:16px;")}>
        <button onClick={p.wish} style={css("position:absolute;top:14px;left:14px;z-index:3;border:none;background:none;cursor:pointer;padding:0;")}>
          {heart(p.heartFill, p.heartStroke)}
        </button>
        {p.topTag && (
          <span style={css("position:absolute;top:14px;right:14px;z-index:3;background:var(--z-ink-2);color:#fff;font:600 11px Inter;padding:4px 11px;border-radius:7px;")}>{p.topTag}</span>
        )}
        {p.promoOn && !p.topTag && (
          <span style={css("position:absolute;top:12px;right:14px;z-index:3;")}><PromoHex label={"−" + p.promo + "%"} h={39} /></span>
        )}
        <button onClick={p.open} style={css("border:none;background:none;cursor:pointer;width:100%;padding:0;")}>
          <div style={css("height:175px;display:flex;align-items:center;justify-content:center;")}>
            {p.hasImg
              ? <img src={p.img} alt={p.name} style={css("max-height:175px;max-width:100%;object-fit:contain;")} />
              : <div style={css("width:100%;height:175px;border-radius:10px;background:repeating-linear-gradient(135deg,var(--z-surface-2),var(--z-surface-2) 9px,var(--z-surface-2) 9px,var(--z-surface-2) 18px);display:flex;align-items:center;justify-content:center;")}><span style={css("font:600 11px ui-monospace,monospace;color:var(--z-ink-3);")}>{p.ph}</span></div>}
          </div>
        </button>
      </div>
      <div style={css("padding:12px 16px 16px;display:flex;flex-direction:column;flex:1;border-top:1px solid var(--z-line);")}>
        <div style={css("font:500 11px Inter;color:var(--z-ink-3);margin-bottom:3px;")}>{p.cat}</div>
        <div style={css("font:500 10px Inter;color:var(--z-ink-3);margin-bottom:6px;")}>SKU: {p.sku}</div>
        <button onClick={p.open} className="z-link" style={css("border:none;background:none;text-align:left;padding:0;cursor:pointer;font:600 15px Inter;color:var(--z-ink);line-height:1.3;margin-bottom:14px;min-height:40px;")}>{p.name}</button>
        <div style={css("margin-top:auto;")}>
          {p.inquire ? (<>
            <div style={css("display:flex;align-items:center;gap:6px;margin-bottom:4px;")}><span style={css("font:700 12px Inter;color:var(--z-brand-ink);")}>BizzClub ⓘ</span></div>
            <div style={css("font:500 11px Inter;color:var(--z-ink-3);margin-bottom:14px;")}>{p.priceNote}</div>
            <button onClick={p.open} className="z-sec" style={css("width:100%;background:var(--z-surface);color:var(--z-brand-strong);border:1.5px solid rgba(0,0,0,0.15);border-radius:8px;padding:11px;font:600 13.5px Inter;cursor:pointer;display:flex;align-items:center;justify-content:center;gap:8px;")}>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={css("color:var(--z-brand-strong)")}><rect x="4" y="4" width="16" height="16" rx="2" /><path d="M8 9h8M8 13h8M8 17h5" /></svg>
              Saznajte više
            </button>
          </>) : (<>
            {p.showRank && (<>
              <div style={css("display:flex;align-items:baseline;justify-content:space-between;margin-bottom:4px;")}><span style={css("font:500 13px Inter;color:var(--z-ink-2);")}>Vaša cena</span><span style={css("font:800 17px Inter;color:var(--z-brand-ink);")}>{p.rankStr}</span></div>
              <div style={css("display:flex;align-items:center;justify-content:space-between;margin-bottom:14px;")}><span style={css("background:var(--z-brand-050);color:var(--z-brand);font:700 11px Inter;padding:2px 7px;border-radius:6px;")}>{p.discLabel}</span><span style={css("font:500 12px Inter;color:var(--z-ink-3);text-decoration:line-through;")}>MP {p.mpStr}</span></div>
            </>)}
            {p.showGuest && (<>
              <div style={css("margin-bottom:8px;")}><div style={css("font:500 11px Inter;color:var(--z-ink-2);margin-bottom:1px;")}>MP Cena</div><div style={css("font:700 16px Inter;color:var(--z-ink);")}>{p.mpStr}</div></div>
              <div style={css("display:flex;align-items:center;justify-content:space-between;gap:6px;margin-bottom:14px;")}><span style={css("font:700 12px Inter;color:var(--z-brand-ink);")}>BizzClub ⓘ</span><span style={css("font:500 11px Inter;color:var(--z-ink-3);text-align:right;")}>Učlanite se i kupite do -40%</span></div>
            </>)}
            <button onClick={p.add} className="z-cta" style={css("width:100%;background:var(--z-deep);color:#fff;border:none;border-radius:8px;padding:11px;font:600 13.5px Inter;cursor:pointer;")}>Dodajte u korpu</button>
          </>)}
        </div>
      </div>
    </div>
  );

  // ── Reusable auction card (Outlet) ──
  const AuctionCard = ({ a }) => (
    <div className="z-card" style={css("background:var(--z-surface);border:1px solid var(--z-line);border-radius:16px;overflow:hidden;display:flex;flex-direction:column;")}>
      <div style={css("position:relative;padding:18px;background:var(--z-surface-2);")}>
        <span style={css("position:absolute;top:14px;left:14px;z-index:2;background:var(--z-surface);border:1px solid var(--z-line);color:var(--z-ink-2);font:600 10.5px Inter;padding:4px 9px;border-radius:7px;")}>još {a.stock} na stanju</span>
        <button onClick={a.wish} aria-label="Lista želja" style={css("position:absolute;top:12px;right:12px;z-index:2;border:none;background:none;cursor:pointer;padding:2px;")}>{heart(a.heartFill, a.heartStroke, 20)}</button>
        <button onClick={a.open} style={css("border:none;background:none;cursor:pointer;width:100%;padding:0;")}>
          <div style={css("height:170px;display:flex;align-items:center;justify-content:center;")}>
            {a.hasImg && <img src={a.img} alt={a.name} style={css("max-height:170px;max-width:100%;object-fit:contain;")} />}
          </div>
        </button>
      </div>
      <div style={css("padding:16px 18px 18px;display:flex;flex-direction:column;flex:1;")}>
        <div style={css("display:flex;align-items:center;gap:8px;margin-bottom:8px;")}>
          <span title={a.condInfo} style={css("background:var(--z-brand-050);color:var(--z-brand);font:700 10.5px Inter;padding:3px 9px;border-radius:6px;cursor:help;")}>{a.condLabel} ⓘ</span>
          <span style={css("font:500 11px Inter;color:var(--z-ink-3);")}>{a.cat}</span>
        </div>
        <button onClick={a.open} className="z-link" style={css("border:none;background:none;text-align:left;padding:0;cursor:pointer;font:700 15px Inter;color:var(--z-ink);line-height:1.3;margin-bottom:12px;min-height:40px;")}>{a.name}</button>
        {a.mine && a.mine.outbid && !a.ended && <div style={css("display:inline-block;background:var(--z-brand-050);color:var(--z-danger);font:600 11px Inter;padding:5px 9px;border-radius:7px;margin-bottom:8px;")}>Vaša ponuda je nadmašena</div>}
        {!a.reserveMet && !a.ended && <div style={css("font:500 11px Inter;color:var(--z-ink-3);margin-bottom:8px;")}>Rezervna cena nije dostignuta</div>}
        {/* Cena + CTA blok — pinovan na dno da CTA bude u ravni na svim karticama */}
        <div style={css("margin-top:auto;")}>
          <div style={css("display:flex;justify-content:space-between;align-items:flex-end;margin-bottom:12px;")}>
            <div>
              <div style={css("font:500 11px Inter;color:var(--z-ink-2);margin-bottom:1px;")}>Najviša ponuda</div>
              <div style={css("font:800 20px Inter;color:var(--z-brand-ink);font-variant-numeric:tabular-nums;")}>{a.bidStr}</div>
            </div>
            <div style={css("text-align:right;")}>
              <div style={css("font:500 11px Inter;color:var(--z-ink-2);margin-bottom:1px;")}>Aukcija se završava</div>
              <div className={a.pulse ? "z-cd-pulse" : ""} style={{ ...css("font:700 14px Inter;font-variant-numeric:tabular-nums;"), color: a.cdCol }}>{a.ended ? "Završeno" : a.cd.str}</div>
            </div>
          </div>
          {a.ended
            ? <button disabled style={css("width:100%;background:var(--z-surface-2);color:var(--z-ink-3);border:1px solid var(--z-line);border-radius:10px;padding:12px;font:700 13.5px Inter;cursor:not-allowed;margin-bottom:8px;")}>Aukcija završena</button>
            : <button onClick={a.open} className="z-cta" style={css("width:100%;background:var(--z-deep);color:#fff;border:none;border-radius:10px;padding:12px;font:700 13.5px Inter;cursor:pointer;margin-bottom:8px;")}>Licitiraj</button>}
          <button onClick={a.open} className="z-op" style={css("width:100%;border:none;background:none;cursor:pointer;font:700 12.5px Inter;color:var(--z-gold);text-align:center;")}>Kupi odmah · {a.buyStr}</button>
        </div>
      </div>
    </div>
  );

  // ── Render ───────────────────────────────────────────────────────────────
  return (
    <div style={css("font-family:Inter,system-ui,sans-serif;background:var(--z-bg);color:var(--z-ink);min-height:100vh;-webkit-font-smoothing:antialiased;letter-spacing:-0.01em;")}>

      {/* SITE HEADER */}
      <header style={{ ...css("background:var(--z-surface);border-bottom:1px solid var(--z-line);position:sticky;top:0;z-index:60;"), display: scr === "search" ? "none" : "block" }}>
        <div className="z-hd" style={css("max-width:1232px;margin:0 auto;padding:18px 24px;display:flex;align-items:center;gap:24px;")}>
          <button onClick={goHome} style={css("border:none;background:none;cursor:pointer;padding:0;display:flex;align-items:center;flex:none;")}>
            <img src="/zeus-logo.svg" alt="ZEUS by Zepter" className="z-hd-logo z-logo-light" style={css("height:60px;width:auto;display:block;")} />
            <img src="/zeus-logo-white.svg" alt="ZEUS by Zepter" className="z-hd-logo z-logo-dark" style={css("height:60px;width:auto;display:block;")} />
          </button>
          <button className="z-op z-hd-loc" style={css("border:none;background:none;cursor:pointer;display:flex;align-items:center;gap:7px;flex:none;padding:0;")}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={css("color:var(--z-brand)")}><path d="M12 21s-7-5.5-7-11a7 7 0 0114 0c0 5.5-7 11-7 11z" /><circle cx="12" cy="10" r="2.5" /></svg>
            <span style={css("font:600 14px Inter;color:var(--z-ink);")}>{cur.loc}</span>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={css("color:var(--z-ink-2)")}><path d="M6 9l6 6 6-6" /></svg>
          </button>
          <div className="z-hd-search" style={css("flex:1;display:flex;align-items:center;max-width:520px;border:1.5px solid var(--z-line);border-radius:14px;overflow:hidden;background:var(--z-surface-2);")}>
            <input placeholder="Pretražite sve na Zepteru online i u prodavnici" style={css("flex:1;border:none;background:none;outline:none;padding:13px 16px;font:500 14px Inter;color:var(--z-ink);")} />
            <button onClick={goSearch} className="z-amber" style={css("border:none;cursor:pointer;background:var(--z-gold);color:var(--z-gold-ink);font:700 14px Inter;padding:13px 22px;display:flex;align-items:center;gap:8px;")}>
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" style={css("color:var(--z-gold-ink)")} strokeWidth="2.2" strokeLinecap="round"><circle cx="11" cy="11" r="7" /><path d="M21 21l-4.3-4.3" /></svg>
              Pretraga
            </button>
          </div>
          <div className="z-hd-acct" style={css("display:flex;align-items:center;gap:20px;flex:none;margin-left:auto;")}>
            <button onClick={toggleTheme} aria-label="Promeni temu" className="z-op" style={css("border:none;background:none;cursor:pointer;color:var(--z-ink);padding:0;display:flex;align-items:center;")}>
              <Sun className="z-sun" size={21} strokeWidth={1.8} />
              <Moon className="z-moon" size={21} strokeWidth={1.8} />
            </button>
            <button onClick={openSearch} aria-label="Pretraga" className="z-op z-hd-searchbtn" style={css("display:none;border:none;background:none;cursor:pointer;align-items:center;padding:0;")}>
              <svg width="23" height="23" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" style={css("color:var(--z-ink)")}><circle cx="11" cy="11" r="7" /><path d="M21 21l-4.3-4.3" /></svg>
            </button>
            <button onClick={goWish} className="z-op" style={css("position:relative;border:none;background:none;cursor:pointer;display:flex;align-items:center;gap:9px;padding:0;")}>
              {heart("none", "var(--z-ink)")}
              <span className="z-hd-txt" style={css("text-align:left;font:400 12px Inter;color:var(--z-ink-2);line-height:1.25;")}>Vaša<br /><b style={css("font-weight:600;color:var(--z-ink);")}>lista želja</b></span>
              <span style={css("position:absolute;top:-6px;left:14px;background:var(--z-brand);color:#fff;font:700 9px Inter;min-width:16px;height:16px;border-radius:8px;display:flex;align-items:center;justify-content:center;padding:0 4px;")}>{wishCount}</span>
            </button>
            <button className="z-op z-hd-account" style={css("border:none;background:none;cursor:pointer;display:flex;align-items:center;gap:9px;padding:0;")}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" style={css("color:var(--z-ink)")}><circle cx="12" cy="8" r="4" /><path d="M4 21c0-4.4 3.6-8 8-8s8 3.6 8 8" /></svg>
              <span style={css("text-align:left;font:400 12px Inter;color:var(--z-ink-2);line-height:1.25;")}>Prijavite se na<br /><b style={css("font-weight:600;color:var(--z-ink);")}>moj nalog</b></span>
            </button>
            <button onClick={goCart} className="z-op" style={css("position:relative;border:none;background:none;cursor:pointer;display:flex;align-items:center;gap:9px;padding:0;")}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" style={css("color:var(--z-ink)")}><path d="M3 4h2l2.4 12.4a1 1 0 001 .8h9.2a1 1 0 001-.8L21 8H6" /><circle cx="9" cy="20" r="1.3" /><circle cx="18" cy="20" r="1.3" /></svg>
              <span className="z-hd-txt" style={css("font:600 13px Inter;color:var(--z-ink);")}>{fmt(rankTotal)}</span>
              <span style={css("position:absolute;top:-6px;left:16px;background:var(--z-gold);color:var(--z-gold-ink);font:700 9px Inter;min-width:16px;height:16px;border-radius:8px;display:flex;align-items:center;justify-content:center;padding:0 4px;")}>{cartCount}</span>
            </button>
          </div>
        </div>

        {/* CATEGORY NAV */}
        <div style={css("background:var(--z-surface);border-top:1px solid var(--z-line);box-shadow:0 1px 4px rgba(0,0,0,0.04);")}>
          <div className="z-hd-nav" style={css("max-width:1232px;margin:0 auto;padding:8px 24px;display:flex;align-items:center;gap:18px;")}>
            <button onClick={toggleMega} aria-expanded={state.megaOpen} className="z-allcat" style={css("display:flex;align-items:center;gap:10px;border:none;background:var(--z-deep);color:#fff;font:600 13.5px Inter;padding:10px 18px;border-radius:6px;cursor:pointer;flex:none;")}>
              <span className="z-allcat-txt">Sve kategorije</span>
              {state.megaOpen
                ? <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" style={css("color:#fff")}><path d="M6 6l12 12M18 6L6 18" /></svg>
                : <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={css("color:#fff")}><rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" /><rect x="3" y="14" width="7" height="7" rx="1" /><rect x="14" y="14" width="7" height="7" rx="1" /></svg>}
            </button>
            <div className="z-hd-links" style={css("flex:1;display:flex;align-items:center;justify-content:flex-end;gap:6px;flex-wrap:wrap;")}>
              <button onClick={goHome} className="z-link" style={css("border:none;background:none;color:var(--z-ink);font:600 14px Inter;padding:8px 14px;cursor:pointer;")}>Početna</button>
              <button onClick={goPlp} className="z-link" style={css("border:none;background:none;color:var(--z-ink);font:500 14px Inter;padding:8px 14px;cursor:pointer;")}>Promocije</button>
              <button onClick={goPlp} className="z-link" style={css("border:none;background:none;color:var(--z-ink);font:500 14px Inter;padding:8px 14px;cursor:pointer;")}>Zepter Svet</button>
              <button onClick={goOutlet} className="z-link" style={css("border:none;background:none;color:var(--z-ink);font:500 14px Inter;padding:8px 14px;cursor:pointer;")}>Outlet</button>
              <button onClick={goMarketplace} className="z-link" style={css("border:none;background:none;color:var(--z-ink);font:600 14px Inter;padding:8px 14px;cursor:pointer;")}>Marketplace</button>
              <button onClick={goBizz} className="z-link" style={css("border:none;background:none;color:var(--z-brand-ink);font:600 14px Inter;padding:8px 14px;cursor:pointer;")}>BizzClub</button>
            </div>
          </div>
        </div>

        {/* ============ MEGA MENU ============ */}
        {state.megaOpen && (
          <div className="z-mega" style={css("position:absolute;left:0;right:0;top:100%;background:var(--z-surface);border-top:1px solid var(--z-line);z-index:61;height:calc(100vh - 100%);overflow:auto;")}>
            <div style={css("max-width:1232px;margin:0 auto;padding:26px 24px 34px;")}>
              <h2 style={css("font:700 20px Inter;margin:0 0 20px;color:var(--z-ink);")}>Kategorije proizvoda</h2>
              <div className="z-mega-body" style={css("display:flex;gap:28px;align-items:flex-start;")}>
                {/* SIDE TABS */}
                <div className="z-mega-tabs" style={css("flex:none;width:190px;display:flex;flex-direction:column;gap:8px;")}>
                  {megaTabs.map((t) => {
                    const on = t.id === state.megaTab;
                    return (
                      <button key={t.id} onClick={() => patch({ megaTab: t.id })} className="z-mega-tab"
                        style={css(`display:flex;align-items:center;gap:11px;border:1px solid ${on ? "var(--z-brand)" : "var(--z-line)"};background:${on ? "var(--z-brand-050)" : "var(--z-surface)"};color:${on ? "var(--z-brand)" : "var(--z-ink-2)"};font:${on ? 600 : 500} 14px Inter;padding:12px 14px;border-radius:8px;cursor:pointer;text-align:left;`)}>
                        {megaIcon(t.glyph, 20, on ? "var(--z-brand)" : "var(--z-ink-2)")}
                        <span style={css("flex:1;")}>{t.label}</span>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 6l6 6-6 6" /></svg>
                      </button>
                    );
                  })}
                </div>
                {/* CATEGORY GRID */}
                <div className="z-mega-grid" style={css("flex:1;display:grid;grid-template-columns:repeat(3,1fr);gap:14px;")}>
                  {activeMega.cats.map((c, i) => (
                    <button key={i} onClick={pickMega} className="z-mega-card" style={css("position:relative;text-align:left;border:1px solid var(--z-line);border-radius:10px;background:var(--z-surface);padding:18px 18px 20px;cursor:pointer;min-height:150px;overflow:hidden;")}>
                      <div style={css("padding-right:82px;")}>
                        <div style={{ ...css("font:700 15px Inter;color:var(--z-ink);line-height:1.3;margin-bottom:12px;"), whiteSpace: "pre-line" }}>{c.name.replace(/\n/g, " ")}</div>
                        <div style={css("display:flex;flex-direction:column;gap:7px;")}>
                          {c.items.map((it, j) => (
                            <span key={j} className="z-mega-sub" style={css("font:400 13px Inter;color:var(--z-ink-2);line-height:1.25;")}>{it}</span>
                          ))}
                        </div>
                      </div>
                      <div style={css("position:absolute;top:16px;right:16px;width:72px;height:72px;border-radius:50%;background:var(--z-brand-050);display:flex;align-items:center;justify-content:center;overflow:hidden;flex:none;")}>
                        {c.img
                          ? <img src={A(c.img)} alt="" style={{ ...css("object-fit:contain;"), width: (c.size || 56) + "px", height: (c.size || 56) + "px" }} />
                          : megaIcon(c.icon, 34)}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </header>

      {state.megaOpen && <div onClick={closeMega} className="z-mega-backdrop" style={css("position:fixed;inset:0;background:rgba(11,31,58,0.32);z-index:50;")} />}

      {/* ============ HOME ============ */}
      {scr === "home" && (<>
        <main className="z-shell" style={css("max-width:1232px;margin:0 auto;padding:24px 24px 0;")}>
          {/* HERO MOSAIC */}
          <div className="z-hero" style={css("display:grid;grid-template-columns:288px 1fr 288px;gap:16px;height:780px;margin-bottom:40px;")}>
            {/* LEFT */}
            <div style={css("display:flex;flex-direction:column;gap:16px;")}>
              <div style={css("height:200px;border-radius:8px;position:relative;overflow:hidden;flex:none;")}>
                <img src={A("assets/znew/vacsy.jpg")} alt="VacSy" style={css("position:absolute;inset:0;width:100%;height:100%;object-fit:cover;")} />
                <div style={{ ...css("position:absolute;top:16px;right:16px;text-align:right;font:700 13px Inter;color:var(--z-ink);line-height:1.25;"), whiteSpace: "pre-line" }}>{"VacSy\nČuvar tvoje\nhrane!"}</div>
                <button onClick={goPlp} style={css("position:absolute;bottom:16px;right:16px;background:var(--z-surface);border:none;border-radius:4px;padding:6px 16px;font:600 13px Inter;color:var(--z-brand-strong);cursor:pointer;box-shadow:0 2px 5px rgba(0,0,0,0.2);")}>Kupite odmah</button>
              </div>
              <div className="z-hero-tall" style={css("flex:1;border-radius:8px;position:relative;overflow:hidden;display:flex;align-items:flex-end;")}>
                <img src={A("assets/home/hyperlight.png")} alt="Hyperlight Eyewear" style={css("position:absolute;inset:0;width:100%;height:100%;object-fit:cover;object-position:center top;")} />
                <div style={css("position:absolute;inset:0;background:linear-gradient(0deg,rgba(0,0,0,0.78) 8%,rgba(0,0,0,0) 55%);")} />
                <div style={css("position:relative;z-index:2;padding:20px;color:#fff;")}>
                  <h2 style={css("font:700 28px Inter;line-height:1.08;margin:0 0 10px;")}>Hyperlight<br />Eyewear®</h2>
                  <p style={css("font:400 14px Inter;line-height:1.4;margin:0 0 12px;max-width:220px;")}>Više od naočara: bolji vid, jasnija misao, nova životna energija.</p>
                  <button onClick={goPlp} style={css("background:none;border:none;color:#fff;font:600 14px Inter;cursor:pointer;padding:0;text-decoration:underline;text-underline-offset:3px;")}>Saznajte više →</button>
                </div>
              </div>
              <div style={css("height:200px;border-radius:8px;position:relative;overflow:hidden;flex:none;")}>
                <img src={A("assets/znew/perfume.jpg")} alt="Parfem" style={css("position:absolute;inset:0;width:100%;height:100%;object-fit:cover;")} />
                <button onClick={goPlp} style={css("position:absolute;bottom:16px;left:16px;background:var(--z-surface);border:none;border-radius:4px;padding:6px 16px;font:600 13px Inter;color:var(--z-brand-strong);cursor:pointer;box-shadow:0 2px 5px rgba(0,0,0,0.2);")}>Kupite odmah</button>
              </div>
            </div>
            {/* CENTER */}
            <div style={css("display:flex;flex-direction:column;gap:16px;")}>
              <div className="z-hero-video" style={css("height:325px;border-radius:8px;position:relative;overflow:hidden;background:var(--z-deep);display:flex;align-items:center;flex:none;")}>
                <video src={A("assets/znew/bioptron.mp4")} autoPlay loop muted playsInline style={css("position:absolute;inset:0;width:100%;height:100%;object-fit:cover;")} />
                <div style={css("position:absolute;inset:0;background:linear-gradient(90deg,rgba(8,10,12,0.88) 28%,rgba(8,10,12,0.35) 60%,rgba(8,10,12,0) 80%);")} />
                <div style={css("position:relative;z-index:2;padding:32px;color:#fff;max-width:58%;")}>
                  <h3 style={css("font:700 32px Inter;margin:0 0 10px;line-height:1.05;")}>Bioptron light therapy</h3>
                  <p style={css("font:400 18px Inter;opacity:.9;line-height:1.35;margin:0 0 16px;")}>Siguran i efikasan medicinski tretman za vaše zdravlje, lepotu i dobrobit.</p>
                  <button onClick={goPlp} style={css("background:none;border:none;color:#fff;font:600 14px Inter;cursor:pointer;padding:0;text-decoration:underline;text-underline-offset:3px;")}>Saznajte više →</button>
                </div>
              </div>
              <div className="z-hero-duo" style={css("display:grid;grid-template-columns:1fr 1fr;gap:16px;flex:1;")}>
                <div style={css("border-radius:8px;position:relative;overflow:hidden;")}>
                  <img src={A("assets/znew/myionz-air.png")} alt="Therapy Air" style={css("position:absolute;inset:0;width:100%;height:100%;object-fit:cover;object-position:right;")} />
                  <button onClick={goPlp} style={css("position:absolute;bottom:16px;left:16px;background:var(--z-surface);border:none;border-radius:4px;padding:6px 16px;font:600 13px Inter;color:var(--z-brand-strong);cursor:pointer;box-shadow:0 2px 5px rgba(0,0,0,0.2);")}>Kupite odmah</button>
                </div>
                <div style={css("border-radius:8px;position:relative;overflow:hidden;")}>
                  <img src={A("assets/znew/pink-lepota.jpg")} alt="Prirodna lepota" style={css("position:absolute;inset:0;width:100%;height:100%;object-fit:cover;")} />
                  <button onClick={goPlp} style={css("position:absolute;bottom:16px;right:16px;background:var(--z-surface);border:none;border-radius:4px;padding:6px 16px;font:600 13px Inter;color:var(--z-brand-strong);cursor:pointer;box-shadow:0 2px 5px rgba(0,0,0,0.2);")}>Kupite odmah</button>
                </div>
              </div>
              <div className="z-hero-bizz" style={css("height:130px;border-radius:8px;background:var(--z-brand-050);position:relative;overflow:hidden;padding:16px 20px;flex:none;display:flex;")}>
                <svg viewBox="0 0 624 130" preserveAspectRatio="xMaxYMid slice" style={css("position:absolute;inset:0;width:100%;height:100%;color:var(--z-brand-ink);")} xmlns="http://www.w3.org/2000/svg">
                  <path opacity="0.6" d="M288 99.7794L624.476 18.8347L624.476 180.724L288 99.7794Z" fill="currentColor" fillOpacity="0.5"/>
                  <path opacity="0.6" d="M367.358 10.899L624.476 -50.9999L624.476 72.7979L367.358 10.899Z" fill="currentColor" fillOpacity="0.25"/>
                  <path opacity="0.6" d="M449.889 61.6879L624.476 18.8349L624.476 104.541L449.889 61.6879Z" fill="currentColor" fillOpacity="0.75"/>
                </svg>
                <div className="z-hero-bizz-txt" style={css("position:relative;z-index:2;max-width:70%;display:flex;flex-direction:column;justify-content:space-between;")}>
                  <p style={css("font:300 20px Poppins,Inter;color:var(--z-brand-strong);margin:0;line-height:1.15;")}>Postanite <b style={css("font-weight:700;")}>ZEUS BizzClub</b> partner i ostvarite trajno višestruke pogodnosti!</p>
                  <div className="z-bizz-cta-row" style={css("display:flex;align-items:center;gap:18px;")}>
                    <button onClick={goBizz} style={css("background:var(--z-surface);border:none;border-radius:4px;padding:7px 18px;font:600 14px Inter;color:var(--z-brand-strong);cursor:pointer;box-shadow:0 2px 5px rgba(0,0,0,0.18);")}>Želim da se učlanim</button>
                    <button onClick={goBizz} style={css("background:none;border:none;color:var(--z-brand-strong);font:600 14px Inter;cursor:pointer;text-decoration:underline;text-underline-offset:3px;")}>Saznajte više →</button>
                  </div>
                </div>
                <img src="/zeus-logo.svg" alt="ZEUS by Zepter" className="z-hero-bizz-logo z-logo-light" style={css("position:absolute;right:28px;top:50%;transform:translateY(-50%);height:66px;width:auto;z-index:2;")} />
                <img src="/zeus-logo-white.svg" alt="ZEUS by Zepter" className="z-hero-bizz-logo z-logo-dark" style={css("position:absolute;right:28px;top:50%;transform:translateY(-50%);height:66px;width:auto;z-index:2;")} />
              </div>
            </div>
            {/* RIGHT */}
            <div style={css("display:flex;flex-direction:column;gap:16px;")}>
              <div style={css("height:160px;border-radius:8px;position:relative;overflow:hidden;flex:none;")}>
                <img src={A("assets/znew/plates.jpg")} alt="Gurmanski recepti" style={css("position:absolute;inset:0;width:100%;height:100%;object-fit:cover;")} />
                <button onClick={goPlp} style={css("position:absolute;bottom:14px;right:14px;background:var(--z-surface);border:none;border-radius:4px;padding:6px 16px;font:600 13px Inter;color:var(--z-brand-strong);cursor:pointer;box-shadow:0 2px 5px rgba(0,0,0,0.2);")}>Kupite odmah</button>
              </div>
              <div style={css("height:200px;border-radius:8px;position:relative;overflow:hidden;flex:none;background:var(--z-bg);")}>
                <img src={A("assets/znew/posude.jpg")} alt="Posuđe" style={css("position:absolute;inset:0;width:100%;height:100%;object-fit:cover;")} />
                <div style={{ ...css("position:absolute;top:16px;left:16px;font:700 13px Inter;color:var(--z-ink);line-height:1.25;"), whiteSpace: "pre-line" }}>{"Jedinstveno\ni superiorno posuđe"}</div>
                <button onClick={goPlp} style={css("position:absolute;bottom:14px;right:14px;background:var(--z-surface);border:none;border-radius:4px;padding:6px 16px;font:600 13px Inter;color:var(--z-brand-strong);cursor:pointer;box-shadow:0 2px 5px rgba(0,0,0,0.2);")}>Kupite odmah</button>
              </div>
              <div className="z-hero-tall" style={css("flex:1;border-radius:8px;position:relative;overflow:hidden;")}>
                <img src={A("assets/znew/woman-bag.png")} alt="Luksuz i stil" style={css("position:absolute;inset:0;width:100%;height:100%;object-fit:cover;object-position:center 15%;")} />
                <button onClick={goPlp} style={css("position:absolute;bottom:16px;right:16px;background:var(--z-surface);border:none;border-radius:4px;padding:6px 16px;font:600 13px Inter;color:var(--z-brand-strong);cursor:pointer;box-shadow:0 2px 5px rgba(0,0,0,0.2);")}>Kupite odmah</button>
              </div>
            </div>
          </div>

          {/* IZDVAJAMO */}
          <div style={css("display:flex;align-items:center;justify-content:space-between;gap:14px;margin-bottom:18px;")}>
            <h2 style={css("font:700 20px Inter;margin:0;color:var(--z-ink);")}>Izdvajamo iz ponude</h2>
            <button onClick={goPlp} style={css("flex:none;background:none;border:none;color:var(--z-brand-strong);font:500 14px Inter;cursor:pointer;text-decoration:underline;text-underline-offset:3px;")}>Pogledajte sve →</button>
          </div>
          <div className="z-grid-4 z-carousel" style={css("display:grid;grid-template-columns:repeat(4,1fr);gap:16px;margin-bottom:48px;")}>
            {featured.map((p) => <ProductCard key={p.id} p={p} />)}
            {/* gold ad tile */}
            <div style={css("border-radius:12px;overflow:hidden;position:relative;background:var(--z-deep);display:flex;align-items:flex-end;")}>
              <img src={A("assets/znew/u1.jpg")} alt="Prirodna lepota" style={css("position:absolute;inset:0;width:100%;height:100%;object-fit:cover;object-position:center top;")} />
              <div style={css("position:absolute;inset:0;background:linear-gradient(0deg,rgba(0,0,0,0.7) 12%,rgba(0,0,0,0) 55%);")} />
              <img src={A("assets/znew/u3.png")} alt="Luxury Overdose" style={css("position:absolute;right:14px;bottom:78px;height:150px;object-fit:contain;filter:drop-shadow(0 8px 16px rgba(0,0,0,0.5));")} />
              <div style={css("position:relative;z-index:2;padding:20px;color:#fff;")}>
                <h3 style={css("font:700 22px Inter;margin:0 0 4px;")}>Prirodna lepota</h3>
                <p style={css("font:400 13px Inter;opacity:.9;margin:0 0 10px;max-width:170px;")}>Prirodna lepota za prirodan sjaj kože</p>
                <button onClick={goPlp} style={css("background:none;border:none;color:#fff;font:600 13px Inter;cursor:pointer;padding:0;text-decoration:underline;text-underline-offset:3px;")}>Saznajte više →</button>
              </div>
            </div>
          </div>

          {/* CONTENT BAND */}
          <div className="z-content-band" style={css("display:grid;grid-template-columns:1.62fr 1fr 1fr;gap:16px;margin-bottom:52px;height:420px;")}>
            <div className="z-cb-tall" style={css("border-radius:8px;position:relative;overflow:hidden;display:flex;align-items:flex-end;")}>
              <img src={A("assets/znew/bioptron-eye.png")} alt="Bioptron svetlosna terapija" style={css("position:absolute;inset:0;width:100%;height:100%;object-fit:cover;")} />
              <div style={css("position:absolute;inset:0;background:linear-gradient(90deg,rgba(255,255,255,0.92) 24%,rgba(255,255,255,0) 60%);")} />
              <div style={css("position:relative;z-index:2;padding:24px;")}>
                <h3 style={{ ...css("font:700 32px Inter;margin:0 0 8px;color:var(--z-ink);line-height:1.1;"), whiteSpace: "pre-line" }}>{"Bioptron\nsvetlosna terapija"}</h3>
                <p style={css("font:400 15px Inter;color:var(--z-ink-2);margin:0 0 14px;max-width:230px;")}>Sinergija svetlosti i boja bude vaša čula</p>
                <button onClick={goPlp} style={css("background:none;border:none;color:var(--z-brand-strong);font:600 14px Inter;cursor:pointer;padding:0;text-decoration:underline;text-underline-offset:3px;")}>Saznajte više →</button>
              </div>
            </div>
            <div style={css("display:flex;flex-direction:column;gap:16px;")}>
              <div className="z-cb-half" style={css("flex:1;border-radius:8px;position:relative;overflow:hidden;background:var(--z-surface);padding:22px;display:flex;flex-direction:column;")}>
                <img src={A("assets/znew/preciscena-voda.png")} alt="Prečišćena voda" style={css("position:absolute;inset:0;width:100%;height:100%;object-fit:cover;object-position:right center;")} />
                <div style={css("position:relative;z-index:2;")}>
                  <h3 style={css("font:700 20px Inter;margin:0 0 8px;color:var(--z-brand-strong);")}>Prečišćena voda</h3>
                  <p style={css("font:400 14px Inter;color:var(--z-ink-2);margin:0 0 12px;max-width:170px;line-height:1.4;")}>Najbolji izvor čiste vode za zdravo telo i zdrav život</p>
                  <button onClick={goPlp} style={css("background:none;border:none;color:var(--z-brand-strong);font:600 13px Inter;cursor:pointer;padding:0;text-decoration:underline;text-underline-offset:3px;")}>Saznajte više →</button>
                </div>
              </div>
              <div className="z-cb-half" style={css("flex:1;border-radius:8px;position:relative;overflow:hidden;display:flex;align-items:flex-start;justify-content:flex-end;")}>
                <img src={A("assets/znew/lepota-flowers.jpg")} alt="Prirodna lepota" style={css("position:absolute;inset:0;width:100%;height:100%;object-fit:cover;")} />
                <div style={css("position:relative;z-index:2;padding:16px;text-align:right;")}>
                  <h3 style={css("font:700 18px Inter;margin:0 0 6px;color:#fff;")}>Prirodna lepota</h3>
                  <button onClick={goPlp} style={css("background:none;border:none;color:#fff;font:600 13px Inter;cursor:pointer;padding:0;text-decoration:underline;text-underline-offset:3px;")}>← Saznajte više</button>
                </div>
              </div>
            </div>
            <div className="z-cb-tall z-cb-cook" style={css("border-radius:8px;position:relative;overflow:hidden;display:flex;align-items:flex-start;")}>
              <img src={A("assets/znew/u2.jpg")} alt="Priprema hrane" className="z-cb-cook-img" style={css("position:absolute;inset:0;width:100%;height:100%;object-fit:cover;")} />
              <div style={css("position:relative;z-index:2;padding:18px;")}>
                <h3 style={css("font:700 19px Inter;margin:0 0 6px;color:var(--z-ink);max-width:160px;line-height:1.2;")}>Priprema hrane na zdrav način</h3>
                <button onClick={goPlp} style={css("background:none;border:none;color:var(--z-brand-strong);font:600 13px Inter;cursor:pointer;padding:0;text-decoration:underline;text-underline-offset:3px;")}>Saznajte više →</button>
              </div>
            </div>
          </div>

          {/* KATEGORIJE */}
          <div style={css("border-top:1px solid var(--z-brand-050);padding-top:24px;")}>
            <div style={css("display:flex;align-items:center;justify-content:space-between;margin-bottom:22px;")}>
              <h2 style={css("font:700 20px Inter;margin:0;color:var(--z-ink);")}>Kategorije proizvoda</h2>
              <button onClick={goPlp} style={css("background:none;border:none;color:var(--z-brand-strong);font:500 14px Inter;cursor:pointer;text-decoration:underline;text-underline-offset:3px;")}>Pogledajte sve →</button>
            </div>
            <div className="z-cats" style={css("display:grid;grid-template-columns:repeat(8,1fr);gap:12px;margin-bottom:40px;")}>
              {catCircles.map((c, i) => (
                <button key={i} onClick={c.go} style={css("border:none;background:none;cursor:pointer;display:flex;flex-direction:column;align-items:center;gap:12px;padding:4px;")}>
                  <div className="z-scale z-cat-circle" style={css("width:104px;height:104px;border-radius:50%;background:var(--z-brand-050);display:flex;align-items:center;justify-content:center;overflow:hidden;")}>
                    {c.hasImg
                      ? <img src={c.img} alt={c.name} style={{ ...css("object-fit:contain;"), width: c.size + "px", height: c.size + "px" }} />
                      : <div style={css("width:56px;height:56px;border-radius:50%;background:repeating-linear-gradient(135deg,var(--z-brand-050),var(--z-brand-050) 7px,var(--z-brand-050) 7px,var(--z-brand-050) 14px);")} />}
                  </div>
                  <span style={{ ...css("font:500 12.5px Inter;color:var(--z-ink);text-align:center;line-height:1.3;"), whiteSpace: "pre-line" }}>{c.name}</span>
                </button>
              ))}
            </div>
          </div>

          {/* BIZZCLUB STRIP */}
          <div style={css("background:var(--z-brand-050);border-radius:8px;padding:14px 28px;display:flex;align-items:center;justify-content:center;gap:28px;margin-bottom:48px;flex-wrap:wrap;")}>
            <span className="z-bizz-strip-txt" style={css("font:300 20px Poppins,Inter;color:var(--z-brand-strong);")}>Učlanite se u <b style={css("font-weight:600;")}>ZEUS BizzClub</b> i već danas možete da ostvarite privilegovanu cenu</span>
            <button onClick={goBizz} className="z-white" style={css("background:none;border:1.5px solid var(--z-brand-strong);border-radius:4px;padding:8px 18px;font:600 14px Inter;color:var(--z-brand-strong);cursor:pointer;flex:none;")}>Želim da se učlanim</button>
          </div>

          {/* PROMOCIJE */}
          <div style={css("display:flex;align-items:center;justify-content:space-between;margin-bottom:18px;")}>
            <h2 style={css("font:700 20px Inter;margin:0;color:var(--z-ink);")}>Promocije</h2>
            <button onClick={goPlp} style={css("background:none;border:none;color:var(--z-brand-strong);font:500 14px Inter;cursor:pointer;text-decoration:underline;text-underline-offset:3px;")}>Pogledajte sve →</button>
          </div>
          <div className="z-promo-grid z-carousel" style={css("display:grid;grid-template-columns:2fr 1fr 1fr;gap:16px;")}>
            <div style={css("border-radius:8px;overflow:hidden;position:relative;")}>
              <img src={A("assets/znew/promo-voda.png")} alt="Čista i zdrava voda" style={css("display:block;width:100%;height:100%;object-fit:cover;")} />
            </div>
            {promoProducts.map((p) => <ProductCard key={p.id} p={p} />)}
          </div>
        </main>

        {/* NEWSLETTER */}
        <div style={css("background:var(--z-brand-050);padding:36px 24px;margin-top:48px;")}>
          <div style={css("max-width:760px;margin:0 auto;text-align:center;")}>
            <h3 style={css("font:500 24px Inter;color:var(--z-brand-strong);margin:0 0 6px;")}>Prijavite se na našu mailing listu!</h3>
            <p style={css("font:400 14px Inter;color:var(--z-ink-2);margin:0 0 18px;")}>Svake nedelje dobijaćete konkretne predloge i uputstva kako da unapredite svoj život.</p>
            <button className="z-sky" style={css("background:var(--z-surface);border:1.5px solid var(--z-brand-strong);border-radius:4px;padding:10px 26px;font:600 14px Inter;color:var(--z-brand-strong);cursor:pointer;")}>Prijavite se</button>
          </div>
        </div>
      </>)}

      {/* ============ MARKETPLACE ============ */}
      {scr === "mp" && (<>
        <main className="z-shell" style={css("max-width:1232px;margin:0 auto;padding:24px 24px 0;")}>
          {/* HERO — luxury car + thumbnail rail */}
          <div className="z-mp-hero" style={css("position:relative;height:470px;border-radius:10px;overflow:hidden;margin-bottom:30px;background:var(--z-deep);")}>
            <video className="z-mp-hero-video" src={A("assets/mp/hero-car.mp4")} autoPlay loop muted playsInline style={css("position:absolute;inset:0;width:100%;height:100%;object-fit:cover;")} />
            <div className="z-mp-hero-veil" style={css("position:absolute;inset:0;background:linear-gradient(90deg,rgba(8,10,12,0.86) 20%,rgba(8,10,12,0.32) 52%,rgba(8,10,12,0) 74%);")} />
            <div className="z-mp-hero-copy" style={css("position:absolute;left:0;top:0;bottom:0;z-index:2;display:flex;flex-direction:column;justify-content:center;padding:48px;max-width:58%;color:#fff;")}>
              <h1 className="z-h1" style={{ ...css("font:700 44px Inter;line-height:1.05;margin:0 0 16px;"), whiteSpace: "pre-line" }}>{"Nova Mercedes-Benz\nS-Klasa"}</h1>
              <p style={css("font:400 18px Inter;opacity:.9;margin:0 0 22px;")}>Brine o onome što je važno.</p>
              <button onClick={goPlp} style={css("background:none;border:none;color:#fff;font:600 15px Inter;cursor:pointer;padding:0;text-decoration:underline;text-underline-offset:4px;align-self:flex-start;")}>Saznajte više →</button>
            </div>
            {/* vertical auto-slider overlaid on the video */}
            <div className="z-mp-slider" style={css("position:absolute;right:16px;top:16px;bottom:16px;width:300px;z-index:2;overflow:hidden;border-radius:10px;")}>
              <div className="z-mp-slider-track">
                {[...mpCars, ...mpCars].map((c, i) => (
                  <button key={i} onClick={goPlp} className="z-mp-slide" style={css("display:block;width:100%;border:none;background:none;padding:0;margin:0 0 16px;cursor:pointer;border-radius:10px;")}>
                    <img src={A(c.img)} alt={c.label} style={css("display:block;width:100%;height:auto;border-radius:10px;box-shadow:0 6px 18px rgba(0,0,0,0.38);")} />
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* breadcrumb */}
          <div style={css("font:500 12.5px Inter;color:var(--z-ink-2);margin-bottom:34px;")}>Početna&nbsp;&nbsp;/&nbsp;&nbsp;<span style={css("color:var(--z-ink);font-weight:600;")}>Marketplace</span></div>

          {/* POPULARNE KATEGORIJE */}
          <div style={css("display:flex;align-items:center;justify-content:space-between;margin-bottom:22px;")}>
            <h2 style={css("font:700 20px Inter;margin:0;color:var(--z-ink);")}>Popularne kategorije</h2>
            <button onClick={goPlp} style={css("background:none;border:none;color:var(--z-brand-strong);font:500 14px Inter;cursor:pointer;text-decoration:underline;text-underline-offset:3px;")}>Pogledajte sve →</button>
          </div>
          <div className="z-cats" style={css("display:grid;grid-template-columns:repeat(8,1fr);gap:12px;margin-bottom:40px;")}>
            {mpCircles.map((c, i) => (
              <button key={i} onClick={c.go} style={css("border:none;background:none;cursor:pointer;display:flex;flex-direction:column;align-items:center;gap:14px;padding:4px;")}>
                <div className="z-scale z-cat-circle" style={css("width:104px;height:104px;border-radius:50%;background:var(--z-brand-050);display:flex;align-items:center;justify-content:center;")}>
                  <img src={c.img} alt={c.name} className="z-mp-cat-img" style={css("width:" + c.scale + "%;height:" + c.scale + "%;object-fit:contain;flex:none;")} />
                </div>
                <span style={{ ...css("font:500 12.5px Inter;color:var(--z-ink);text-align:center;line-height:1.3;"), whiteSpace: "pre-line" }}>{c.name}</span>
              </button>
            ))}
          </div>

          {/* BIZZCLUB STRIP */}
          <div style={css("background:var(--z-brand-050);border-radius:8px;padding:14px 28px;display:flex;align-items:center;justify-content:center;gap:28px;margin-bottom:48px;flex-wrap:wrap;")}>
            <span className="z-bizz-strip-txt" style={css("font:300 20px Poppins,Inter;color:var(--z-brand-strong);")}>Učlanite se u <b style={css("font-weight:600;")}>ZEUS BizzClub</b> i već danas možete da ostvarite privilegovanu cenu</span>
            <button onClick={goBizz} className="z-white" style={css("background:none;border:1.5px solid var(--z-brand-strong);border-radius:4px;padding:8px 18px;font:600 14px Inter;color:var(--z-brand-strong);cursor:pointer;flex:none;")}>Želim da se učlanim</button>
          </div>

          {/* IZDVAJAMO IZ PONUDE */}
          <div style={css("display:flex;align-items:center;justify-content:space-between;gap:14px;margin-bottom:18px;")}>
            <h2 style={css("font:700 20px Inter;margin:0;color:var(--z-ink);")}>Izdvajamo iz ponude</h2>
            <button onClick={goPlp} style={css("flex:none;background:none;border:none;color:var(--z-brand-strong);font:500 14px Inter;cursor:pointer;text-decoration:underline;text-underline-offset:3px;")}>Pogledajte sve →</button>
          </div>
          <div className="z-grid-4 z-carousel" style={css("display:grid;grid-template-columns:repeat(4,1fr);gap:16px;margin-bottom:52px;")}>
            {mpFeatured.map((p) => <ProductCard key={p.id} p={p} />)}
          </div>

          {/* POPULARNI BRENDOVI */}
          <h2 style={css("font:700 20px Inter;margin:0 0 18px;color:var(--z-ink);")}>Popularni brendovi</h2>
          <div className="z-mp-brands" style={css("display:grid;grid-template-columns:repeat(5,1fr);gap:16px;margin-bottom:52px;")}>
            {MP_BRANDS.map((b, i) => (
              <button key={i} onClick={goPlp} className="z-scale" style={css("border:1px solid var(--z-line);background:var(--z-surface);border-radius:12px;height:84px;display:flex;align-items:center;justify-content:center;cursor:pointer;padding:0 20px;")}>
                <img src={A(b.img)} alt={b.name} style={{ ...css("object-fit:contain;"), maxHeight: (b.h || 40) + "px", maxWidth: b.w ? b.w + "px" : "100%" }} />
              </button>
            ))}
          </div>

          {/* BLOG */}
          <div style={css("display:flex;align-items:center;justify-content:space-between;margin-bottom:18px;")}>
            <h2 style={css("font:700 20px Inter;margin:0;color:var(--z-ink);")}>Blog</h2>
            <button onClick={goPlp} style={css("background:none;border:none;color:var(--z-brand-strong);font:500 14px Inter;cursor:pointer;text-decoration:underline;text-underline-offset:3px;")}>Pogledajte sve →</button>
          </div>
          <div className="z-grid-4 z-carousel" style={css("display:grid;grid-template-columns:repeat(4,1fr);gap:16px;margin-bottom:8px;")}>
            {MP_BLOG.map((b, i) => (
              <button key={i} onClick={goPlp} className="z-card-sm" style={css("text-align:left;border:1px solid var(--z-line);background:var(--z-surface);border-radius:12px;overflow:hidden;cursor:pointer;display:flex;flex-direction:column;padding:0;")}>
                <div style={css("height:160px;position:relative;overflow:hidden;flex:none;")}>
                  <img src={A(b.img)} alt={b.title} style={css("position:absolute;inset:0;width:100%;height:100%;object-fit:cover;")} />
                </div>
                <div style={css("padding:16px;display:flex;flex-direction:column;flex:1;")}>
                  <h3 className="z-link" style={css("font:600 15.5px Inter;color:var(--z-ink);line-height:1.3;margin:0 0 8px;min-height:42px;")}>{b.title}</h3>
                  <p style={css("font:400 13px Inter;color:var(--z-ink-2);line-height:1.5;margin:0 0 12px;")}>{b.excerpt} <span style={css("color:var(--z-brand-strong);font-weight:600;")}>nastavak</span></p>
                  {b.author && (
                    <div style={css("display:flex;align-items:center;gap:10px;margin-top:auto;padding-top:6px;")}>
                      <img src={A("assets/home/doktor.jpg")} alt={b.author} style={css("width:34px;height:34px;border-radius:50%;object-fit:cover;flex:none;")} />
                      <div><div style={css("font:600 12px Inter;color:var(--z-ink);")}>{b.author}</div><div style={css("font:400 11px Inter;color:var(--z-ink-3);")}>{b.role}</div></div>
                    </div>
                  )}
                </div>
              </button>
            ))}
          </div>
        </main>

        {/* NEWSLETTER */}
        <div style={css("background:var(--z-brand-050);padding:36px 24px;margin-top:48px;")}>
          <div style={css("max-width:760px;margin:0 auto;text-align:center;")}>
            <h3 style={css("font:500 24px Inter;color:var(--z-brand-strong);margin:0 0 6px;")}>Prijavite se na našu mailing listu!</h3>
            <p style={css("font:400 14px Inter;color:var(--z-ink-2);margin:0 0 18px;")}>Svake nedelje dobijaćete konkretne predloge i uputstva kako da unapredite svoj život.</p>
            <button className="z-sky" style={css("background:var(--z-surface);border:1.5px solid var(--z-brand-strong);border-radius:4px;padding:10px 26px;font:600 14px Inter;color:var(--z-brand-strong);cursor:pointer;")}>Prijavite se</button>
          </div>
        </div>
      </>)}

      {/* ============ PRETRAGA (full-screen, mobile) ============ */}
      {scr === "search" && (
        <main className="z-search" style={css("max-width:760px;margin:0 auto;padding:0 0 80px;min-height:70vh;")}>
          {/* search bar */}
          <div style={css("position:sticky;top:0;z-index:10;background:var(--z-surface);display:flex;align-items:center;gap:10px;padding:14px 12px;border-bottom:1px solid var(--z-line);")}>
            <button onClick={closeSearch} aria-label="Nazad" className="z-op" style={css("border:none;background:none;cursor:pointer;display:flex;align-items:center;padding:4px;flex:none;")}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={css("color:var(--z-ink)")}><path d="M19 12H5" /><path d="M12 19l-7-7 7-7" /></svg>
            </button>
            <div style={css("flex:1;display:flex;align-items:center;gap:8px;border:1.5px solid var(--z-gold);border-radius:12px;padding:9px 12px;background:var(--z-surface);")}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" style={css("color:var(--z-ink-2)")}><circle cx="11" cy="11" r="7" /><path d="M21 21l-4.3-4.3" /></svg>
              <input ref={searchInputRef} value={state.searchQ} onChange={(e) => patch({ searchQ: e.target.value })}
                placeholder="Pretražite proizvode" enterKeyHint="search"
                style={css("flex:1;border:none;background:none;outline:none;padding:0;font:500 16px Inter;color:var(--z-ink);min-width:0;")} />
              {state.searchQ && (
                <button onClick={() => { patch({ searchQ: "" }); searchInputRef.current?.focus(); }} aria-label="Obriši" style={css("border:none;background:none;cursor:pointer;display:flex;align-items:center;padding:0;flex:none;")}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" style={css("color:var(--z-ink-2)")}><path d="M18 6L6 18" /><path d="M6 6l12 12" /></svg>
                </button>
              )}
            </div>
          </div>

          {/* empty state — recent + popular */}
          {!searchQ && (
            <div style={css("padding:18px 14px;")}>
              <div style={css("font:600 11px Inter;color:var(--z-ink-2);letter-spacing:0.4px;margin-bottom:11px;")}>NEDAVNE PRETRAGE</div>
              <div style={css("display:flex;flex-wrap:wrap;gap:8px;margin-bottom:24px;")}>
                {["bioptron", "naočare", "prečišćivač vazduha"].map((t) => (
                  <button key={t} onClick={() => patch({ searchQ: t })} style={css("display:flex;align-items:center;gap:6px;border:none;cursor:pointer;font:500 13px Inter;color:var(--z-ink);background:var(--z-surface-2);padding:8px 13px;border-radius:18px;")}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" style={css("color:var(--z-ink-2)")}><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></svg>{t}
                  </button>
                ))}
              </div>
              <div style={css("font:600 11px Inter;color:var(--z-ink-2);letter-spacing:0.4px;margin-bottom:4px;")}>POPULARNO</div>
              <div>
                {["Svetlosna terapija", "Prečišćivači vazduha", "Posuđe", "Pametne naočare"].map((t, i, a) => (
                  <button key={t} onClick={() => patch({ searchQ: t })} className="z-op" style={{ ...css("width:100%;display:flex;align-items:center;gap:11px;border:none;background:none;cursor:pointer;text-align:left;padding:13px 2px;font:500 14px Inter;color:var(--z-ink);"), borderBottom: i < a.length - 1 ? "1px solid var(--z-line)" : "none" }}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={css("color:var(--z-brand)")}><path d="M3 17l6-6 4 4 8-8" /><path d="M21 7h-5" /><path d="M21 7v5" /></svg>{t}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* results */}
          {searchQ && (
            <div style={css("padding:14px;")}>
              <div style={css("font:500 13px Inter;color:var(--z-ink-2);margin-bottom:14px;")}>{searchResults.length} {searchResults.length === 1 ? "rezultat" : "rezultata"} za „{state.searchQ.trim()}"</div>
              {searchResults.length === 0 && (
                <div style={css("text-align:center;padding:48px 16px;color:var(--z-ink-2);")}>
                  <svg width="42" height="42" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" style={css("color:var(--z-ink-3);margin-bottom:14px;")}><circle cx="11" cy="11" r="7" /><path d="M21 21l-4.3-4.3" /></svg>
                  <div style={css("font:600 15px Inter;color:var(--z-ink);margin-bottom:5px;")}>Nema rezultata</div>
                  <div style={css("font:500 13px Inter;color:var(--z-ink-2);")}>Pokušajte sa drugim pojmom.</div>
                </div>
              )}
              {searchResults.map((p) => (
                <button key={p.id} onClick={p.open} className="z-op" style={css("width:100%;display:flex;align-items:center;gap:14px;border:none;background:none;cursor:pointer;text-align:left;padding:12px 2px;border-bottom:1px solid var(--z-line);")}>
                  <div style={css("width:56px;height:56px;flex:none;border-radius:10px;background:var(--z-surface-2);display:flex;align-items:center;justify-content:center;overflow:hidden;")}>
                    {p.hasImg && <img src={p.img} alt={p.name} style={css("max-width:48px;max-height:48px;object-fit:contain;")} />}
                  </div>
                  <div style={css("flex:1;min-width:0;")}>
                    <div style={css("font:600 11px Inter;color:var(--z-brand);margin-bottom:3px;")}>{p.cat}</div>
                    <div style={css("font:600 14px Inter;color:var(--z-ink);line-height:1.3;margin-bottom:4px;")}>{p.name}</div>
                    <div style={css("font:700 14px Inter;color:var(--z-brand-ink);")}>{p.showRank ? p.rankStr : p.mpStr}</div>
                  </div>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" style={css("color:var(--z-ink-3);flex:none;")}><path d="M9 6l6 6-6 6" /></svg>
                </button>
              ))}
            </div>
          )}
        </main>
      )}

      {/* ============ KATALOG / PLP ============ */}
      {scr === "plp" && (
        <main className="z-shell" style={css("max-width:1280px;margin:0 auto;padding:22px 24px 80px;")}>
          <div style={css("font:500 12.5px Inter;color:var(--z-ink-2);margin-bottom:18px;")}>Početna&nbsp;&nbsp;/&nbsp;&nbsp;Marketplace&nbsp;&nbsp;/&nbsp;&nbsp;<span style={css("color:var(--z-ink);font-weight:600;")}>Svi proizvodi</span></div>
          <div style={css("display:flex;gap:10px;overflow-x:auto;padding-bottom:8px;margin-bottom:22px;")}>
            {catChips.map((c, i) => (
              <button key={i} style={{ ...css("display:flex;align-items:center;gap:10px;flex:none;border-radius:14px;padding:8px 14px 8px 8px;cursor:pointer;font:600 12.5px Inter;"), border: "1px solid " + c.border, background: c.bg, color: c.fg }}>
                <span style={css("width:34px;height:34px;border-radius:50%;background:var(--z-brand-050);display:block;")} />{c.name}
              </button>
            ))}
          </div>
          <div style={css("display:flex;align-items:center;justify-content:space-between;margin-bottom:20px;flex-wrap:wrap;gap:12px;")}>
            <h1 className="z-h1" style={css("font:800 28px Inter;margin:0;color:var(--z-ink);")}>Svi proizvodi <span style={css("font:500 16px Inter;color:var(--z-ink-3);")}>({PRODUCTS.length})</span></h1>
            <div style={css("display:flex;align-items:center;gap:10px;")}>
              <span style={css("font:500 13px Inter;color:var(--z-ink-2);")}>Sortiraj:</span>
              <select style={css("border:1px solid var(--z-line);background:var(--z-surface);border-radius:10px;padding:9px 12px;font:600 13px Inter;color:var(--z-ink);cursor:pointer;")}><option>Popularnost</option><option>Cena: rastuće</option><option>Cena: opadajuće</option><option>Novo</option></select>
            </div>
          </div>
          <div className="z-grid-4 z-carousel" style={css("display:grid;grid-template-columns:repeat(4,1fr);gap:18px;")}>
            {allProducts.map((p) => (
              <div key={p.id} className="z-card" style={css("background:var(--z-surface);border:1px solid var(--z-line);border-radius:18px;overflow:hidden;display:flex;flex-direction:column;")}>
                <div style={css("position:relative;padding:18px;")}>
                  <div style={css("position:absolute;top:14px;left:14px;display:flex;flex-direction:column;gap:6px;z-index:3;")}>
                    {p.badge && <span style={css("background:var(--z-surface);border:1px solid var(--z-line);color:var(--z-brand-strong);font:600 10.5px Inter;padding:4px 9px;border-radius:8px;box-shadow:0 2px 8px rgba(0,0,0,0.05);")}>{p.badge}</span>}
                    {p.promoOn && <PromoHex label={"−" + p.promo + "%"} h={52} />}
                  </div>
                  <button onClick={p.wish} style={css("position:absolute;top:14px;right:14px;z-index:3;border:none;background:rgba(255,255,255,0.9);border-radius:50%;width:34px;height:34px;display:flex;align-items:center;justify-content:center;cursor:pointer;box-shadow:0 2px 8px rgba(0,0,0,0.08);")}>
                    <svg width="17" height="17" viewBox="0 0 24 24" style={{ fill: p.heartFill, stroke: p.heartStroke }} strokeWidth="2"><path d="M20.8 4.6a5.5 5.5 0 00-7.8 0L12 5.6l-1-1a5.5 5.5 0 10-7.8 7.8l1 1L12 21l7.8-7.6 1-1a5.5 5.5 0 000-7.8z" /></svg>
                  </button>
                  <button onClick={p.open} style={css("border:none;background:none;cursor:pointer;width:100%;padding:0;")}>
                    <div style={css("height:170px;display:flex;align-items:center;justify-content:center;")}>
                      {p.hasImg
                        ? <img src={p.img} alt={p.name} style={css("max-height:170px;max-width:100%;object-fit:contain;")} />
                        : <div style={css("width:100%;height:170px;border-radius:12px;background:repeating-linear-gradient(135deg,var(--z-surface-2),var(--z-surface-2) 9px,var(--z-surface-2) 9px,var(--z-surface-2) 18px);display:flex;align-items:center;justify-content:center;")}><span style={css("font:600 11px ui-monospace,monospace;color:var(--z-ink-3);")}>{p.ph}</span></div>}
                    </div>
                  </button>
                </div>
                <div style={css("padding:0 18px 18px;display:flex;flex-direction:column;flex:1;")}>
                  <div style={css("font:600 11px Inter;color:var(--z-brand);margin-bottom:5px;")}>{p.cat}</div>
                  <button onClick={p.open} className="z-link" style={css("border:none;background:none;text-align:left;padding:0;cursor:pointer;font:600 14px Inter;color:var(--z-ink);line-height:1.3;margin-bottom:5px;min-height:36px;")}>{p.name}</button>
                  <div style={css("font:500 11px Inter;color:var(--z-ink-3);margin-bottom:12px;")}>SKU: {p.sku}</div>
                  <div style={css("margin-top:auto;")}>
                    {p.showRank && (<>
                      <div style={css("display:flex;align-items:baseline;gap:8px;margin-bottom:2px;")}><span style={css("font:800 19px Inter;color:var(--z-brand-ink);")}>{p.rankStr}</span><span style={css("background:var(--z-brand-050);color:var(--z-brand);font:700 11px Inter;padding:2px 7px;border-radius:6px;")}>{p.discLabel}</span></div>
                      <div style={css("font:500 12px Inter;color:var(--z-ink-3);text-decoration:line-through;margin-bottom:12px;")}>MP {p.mpStr}</div>
                    </>)}
                    {p.showGuest && (<>
                      <div style={css("font:500 11px Inter;color:var(--z-ink-2);margin-bottom:1px;")}>MP Cena</div>
                      <div style={css("font:800 19px Inter;color:var(--z-ink);margin-bottom:7px;")}>{p.mpStr}</div>
                      <div style={css("display:flex;align-items:center;gap:6px;background:var(--z-brand-050);border-radius:8px;padding:7px 9px;margin-bottom:12px;")}><span style={css("font:700 11px Inter;color:var(--z-brand-ink);")}>BizzClub</span><span style={css("font:500 11px Inter;color:var(--z-brand-strong);")}>do −40%</span></div>
                    </>)}
                    <button onClick={p.add} className="z-cta" style={css("width:100%;background:var(--z-deep);color:#fff;border:none;border-radius:11px;padding:12px;font:600 13.5px Inter;cursor:pointer;")}>Dodajte u korpu</button>
                  </div>
                </div>
              </div>
            ))}
          </div>
          <div style={css("display:flex;justify-content:center;margin-top:36px;")}>
            <button className="z-sec" style={css("border:1.5px solid var(--z-brand);background:var(--z-surface);color:var(--z-brand);border-radius:12px;padding:13px 30px;font:600 14px Inter;cursor:pointer;")}>Prikaži još proizvoda</button>
          </div>
        </main>
      )}

      {/* ============ PDP ============ */}
      {scr === "pdp" && (
        <main className="z-shell" style={css("max-width:1280px;margin:0 auto;padding:22px 24px 80px;")}>
          <div style={css("font:500 12.5px Inter;color:var(--z-ink-2);margin-bottom:22px;")}>Početna&nbsp;&nbsp;/&nbsp;&nbsp;{pdp.cat}&nbsp;&nbsp;/&nbsp;&nbsp;<span style={css("color:var(--z-ink);font-weight:600;")}>{pdp.name}</span></div>
          <div className="z-pdp-main" style={css("display:grid;grid-template-columns:1.15fr 1fr;gap:40px;margin-bottom:44px;")}>
            {/* gallery */}
            <div style={css("display:flex;gap:16px;")}>
              <div style={css("display:flex;flex-direction:column;gap:12px;flex:none;")}>
                {pdpThumbs.map((t, i) => (
                  <button key={i} style={{ ...css("width:64px;height:64px;border-radius:12px;background:var(--z-surface);cursor:pointer;padding:6px;overflow:hidden;"), border: "2px solid " + t.border }}>
                    {pdp.hasImg && <img src={pdp.img} style={css("width:100%;height:100%;object-fit:contain;")} />}
                  </button>
                ))}
              </div>
              <div className="z-pdp-stage" style={css("flex:1;background:var(--z-surface-2);border:1px solid var(--z-line);border-radius:20px;display:flex;align-items:center;justify-content:center;padding:36px;min-height:440px;position:relative;")}>
                {pdp.promoOn && <span style={css("position:absolute;top:20px;left:20px;")}><PromoHex label={"−" + pdp.promo + "%"} h={66} /></span>}
                {pdp.hasImg
                  ? <img src={pdp.img} alt={pdp.name} style={css("max-height:380px;max-width:100%;object-fit:contain;")} />
                  : <div style={css("width:100%;height:380px;border-radius:14px;background:repeating-linear-gradient(135deg,var(--z-surface-2),var(--z-surface-2) 11px,var(--z-surface-2) 11px,var(--z-surface-2) 22px);display:flex;align-items:center;justify-content:center;")}><span style={css("font:600 13px ui-monospace,monospace;color:var(--z-ink-3);")}>{pdp.ph}</span></div>}
              </div>
            </div>
            {/* buy card */}
            <div>
              <div style={css("display:inline-block;background:var(--z-brand-050);color:var(--z-brand);font:600 12px Inter;padding:5px 11px;border-radius:8px;margin-bottom:14px;")}>{pdp.cat}</div>
              <h1 className="z-h1" style={css("font:800 30px Inter;margin:0 0 10px;line-height:1.15;color:var(--z-ink);")}>{pdp.name}</h1>
              <div style={css("display:flex;align-items:center;gap:14px;margin-bottom:22px;")}>
                <div style={css("display:flex;align-items:center;gap:4px;")}><span style={css("color:var(--z-gold);font-size:16px;letter-spacing:1px;")}>★★★★★</span><span style={css("font:600 13px Inter;color:var(--z-ink);")}>{pdp.rating}</span></div>
                <span style={css("font:500 13px Inter;color:var(--z-ink-3);")}>{pdp.reviews} recenzija</span>
                <span style={css("font:500 13px Inter;color:var(--z-ink-3);")}>SKU: {pdp.sku}</span>
              </div>

              <div style={css("background:var(--z-surface-2);border:1px solid var(--z-line);border-radius:18px;padding:22px;margin-bottom:20px;")}>
                {pdp.showRank && (<>
                  <div style={css("font:600 12px Inter;color:var(--z-ink-2);margin-bottom:4px;")}>Vaša cena · {rank.name}</div>
                  <div style={css("display:flex;align-items:baseline;gap:12px;margin-bottom:6px;")}><span style={css("font:800 34px Inter;color:var(--z-brand-ink);")}>{pdp.rankStr}</span><span style={css("background:var(--z-brand);color:#fff;font:700 13px Inter;padding:4px 10px;border-radius:8px;")}>{pdp.discLabel}</span></div>
                  <div style={css("font:500 14px Inter;color:var(--z-ink-3);text-decoration:line-through;")}>MP Cena {pdp.mpStr}</div>
                </>)}
                {pdp.showGuest && (<>
                  <div style={css("font:600 12px Inter;color:var(--z-ink-2);margin-bottom:4px;")}>MP Cena</div>
                  <div style={css("font:800 34px Inter;color:var(--z-ink);margin-bottom:12px;")}>{pdp.mpStr}</div>
                  <div style={css("display:flex;align-items:center;gap:10px;background:var(--z-brand-050);border-radius:12px;padding:12px 14px;")}>
                    <span style={css("font:800 12px Inter;color:var(--z-brand-ink);letter-spacing:0.03em;")}>BIZZCLUB</span>
                    <span style={css("font:500 13px Inter;color:var(--z-brand-strong);")}>Učlanite se i kupite po ceni do <b>−40%</b></span>
                  </div>
                </>)}
              </div>

              {/* rank table */}
              <div style={css("border:1px solid var(--z-line);border-radius:14px;overflow:hidden;margin-bottom:22px;")}>
                <div style={css("background:var(--z-deep);color:#fff;padding:12px 16px;font:700 13px Inter;")}>Cena po rangu članstva</div>
                {rankTable.map((row, i) => (
                  <div key={i} style={{ ...css("display:flex;align-items:center;justify-content:space-between;padding:11px 16px;border-top:1px solid var(--z-line);"), background: row.rowBg }}>
                    <div style={css("display:flex;align-items:center;gap:9px;")}><span style={{ ...css("font:600 13px Inter;"), color: row.nameColor }}>{row.name}</span>{row.maxTag && <span style={css("background:var(--z-gold);color:var(--z-gold-ink);font:700 10px Inter;padding:2px 7px;border-radius:6px;")}>Max</span>}{row.youTag && <span style={css("background:var(--z-brand);color:#fff;font:700 10px Inter;padding:2px 7px;border-radius:6px;")}>Vi</span>}</div>
                    <div style={css("display:flex;align-items:center;gap:10px;")}><span style={css("font:500 12px Inter;color:var(--z-ink-3);")}>{row.discLabel}</span><span style={{ ...css("font:700 14px Inter;"), color: row.priceColor }}>{row.priceStr}</span></div>
                  </div>
                ))}
              </div>

              <div style={css("display:flex;align-items:center;gap:14px;margin-bottom:16px;")}>
                <div style={css("display:flex;align-items:center;border:1.5px solid var(--z-line);border-radius:12px;overflow:hidden;")}>
                  <button onClick={() => patch((s) => ({ qty: Math.max(1, s.qty - 1) }))} className="z-step" style={css("border:none;background:var(--z-surface);width:46px;height:46px;font:600 20px Inter;color:var(--z-brand-strong);cursor:pointer;")}>−</button>
                  <span style={css("width:46px;text-align:center;font:700 16px Inter;")}>{state.qty}</span>
                  <button onClick={() => patch((s) => ({ qty: s.qty + 1 }))} className="z-step" style={css("border:none;background:var(--z-surface);width:46px;height:46px;font:600 20px Inter;color:var(--z-brand-strong);cursor:pointer;")}>+</button>
                </div>
                <button onClick={() => addToCart(state.pdpId, state.qty)} className="z-cta" style={css("flex:1;background:var(--z-deep);color:#fff;border:none;border-radius:12px;height:50px;font:700 15px Inter;cursor:pointer;")}>Dodajte u korpu</button>
              </div>
              <div style={css("display:flex;gap:12px;margin-bottom:20px;")}>
                <button onClick={goCart} className="z-amber" style={css("flex:1;background:var(--z-gold);color:var(--z-gold-ink);border:none;border-radius:12px;height:46px;font:700 14px Inter;cursor:pointer;")}>Kupite odmah</button>
                <button className="z-sec" style={css("flex:none;border:1.5px solid var(--z-line);background:var(--z-surface);border-radius:12px;height:46px;padding:0 18px;font:600 14px Inter;color:var(--z-brand-strong);cursor:pointer;display:flex;align-items:center;gap:8px;")}>🎁 Pošaljite kao poklon</button>
              </div>
              <div style={css("display:flex;align-items:center;gap:10px;font:500 13px Inter;color:var(--z-ink-2);")}><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={css("color:var(--z-brand)")}><path d="M1 3h13v13H1z" /><path d="M14 8h4l3 3v5h-7" /><circle cx="5.5" cy="18.5" r="2" /><circle cx="17.5" cy="18.5" r="2" /></svg>Besplatna isporuka · dostava 2–4 radna dana</div>
            </div>
          </div>

          {/* accordions */}
          <div style={css("max-width:840px;margin-bottom:48px;")}>
            {accordions.map((a, i) => (
              <div key={i} style={css("border-bottom:1px solid var(--z-line);")}>
                <button onClick={a.toggle} style={css("width:100%;display:flex;align-items:center;justify-content:space-between;background:none;border:none;padding:20px 0;cursor:pointer;font:700 17px Inter;color:var(--z-ink);text-align:left;")}>
                  {a.title}<span style={css("font-size:22px;color:var(--z-brand);font-weight:400;")}>{a.sign}</span>
                </button>
                {a.open && (
                  <div style={css("padding:0 0 22px;")}>
                    {a.rows.map((r, j) => (
                      <div key={j} style={{ ...css("display:flex;justify-content:space-between;padding:10px 14px;border-radius:8px;font:500 13.5px Inter;"), background: r.bg }}><span style={css("color:var(--z-ink-2);")}>{r.k}</span><span style={css("color:var(--z-ink);font-weight:600;")}>{r.v}</span></div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* similar */}
          <h2 style={css("font:800 24px Inter;margin:0 0 20px;color:var(--z-ink);")}>Slični proizvodi</h2>
          <div className="z-grid-4 z-carousel" style={css("display:grid;grid-template-columns:repeat(4,1fr);gap:18px;")}>
            {similar.map((p) => (
              <div key={p.id} className="z-card-flat" style={css("background:var(--z-surface);border:1px solid var(--z-line);border-radius:18px;overflow:hidden;display:flex;flex-direction:column;")}>
                <button onClick={p.open} style={css("border:none;background:none;cursor:pointer;padding:18px;")}>
                  <div style={css("height:140px;display:flex;align-items:center;justify-content:center;")}>
                    {p.hasImg
                      ? <img src={p.img} style={css("max-height:140px;max-width:100%;object-fit:contain;")} />
                      : <div style={css("width:100%;height:140px;border-radius:12px;background:repeating-linear-gradient(135deg,var(--z-surface-2),var(--z-surface-2) 9px,var(--z-surface-2) 9px,var(--z-surface-2) 18px);display:flex;align-items:center;justify-content:center;")}><span style={css("font:600 10px ui-monospace,monospace;color:var(--z-ink-3);")}>{p.ph}</span></div>}
                  </div>
                </button>
                <div style={css("padding:0 16px 16px;")}>
                  <div style={css("font:600 11px Inter;color:var(--z-brand);margin-bottom:4px;")}>{p.cat}</div>
                  <div style={css("font:600 13.5px Inter;color:var(--z-ink);line-height:1.3;margin-bottom:8px;min-height:34px;")}>{p.name}</div>
                  <div style={{ ...css("font:800 16px Inter;"), color: p.priceColor }}>{p.mainStr}</div>
                </div>
              </div>
            ))}
          </div>
        </main>
      )}

      {/* ============ KORPA ============ */}
      {scr === "cart" && (
        <main className="z-shell" style={css("max-width:1100px;margin:0 auto;padding:30px 24px 80px;")}>
          <h1 className="z-h1" style={css("font:800 30px Inter;margin:0 0 26px;")}>Vaša korpa <span style={css("font:500 17px Inter;color:var(--z-ink-3);")}>({cartCount} proizvoda)</span></h1>
          {state.cart.length === 0 ? (
            <div style={css("text-align:center;padding:80px 20px;background:var(--z-surface);border:1px solid var(--z-line);border-radius:20px;")}>
              <div style={css("width:80px;height:80px;border-radius:50%;background:var(--z-brand-050);display:flex;align-items:center;justify-content:center;margin:0 auto 20px;")}><svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={css("color:var(--z-brand)")}><path d="M3 4h2l2.4 12.4a1 1 0 001 .8h9.2a1 1 0 001-.8L21 8H6" /></svg></div>
              <h3 style={css("font:700 20px Inter;margin:0 0 8px;")}>Korpa je prazna</h3>
              <p style={css("font:400 14px Inter;color:var(--z-ink-2);margin:0 0 22px;")}>Dodajte proizvode iz kataloga da nastavite.</p>
              <button onClick={goPlp} style={css("background:var(--z-deep);color:#fff;border:none;border-radius:12px;padding:13px 26px;font:600 14px Inter;cursor:pointer;")}>Idi na katalog</button>
            </div>
          ) : (
            <div className="z-two-col" style={css("display:grid;grid-template-columns:1.6fr 1fr;gap:28px;align-items:start;")}>
              <div style={css("display:flex;flex-direction:column;gap:14px;")}>
                {cartRows.map((c) => (
                  <div key={c.id} className="z-cart-row" style={css("background:var(--z-surface);border:1px solid var(--z-line);border-radius:16px;padding:16px;display:flex;gap:16px;align-items:center;")}>
                    <div style={css("width:88px;height:88px;border-radius:12px;background:var(--z-surface-2);display:flex;align-items:center;justify-content:center;flex:none;padding:8px;")}>
                      {c.hasImg
                        ? <img src={c.img} style={css("max-width:100%;max-height:100%;object-fit:contain;")} />
                        : <div style={css("width:100%;height:100%;border-radius:8px;background:repeating-linear-gradient(135deg,var(--z-surface-2),var(--z-surface-2) 7px,var(--z-surface-2) 7px,var(--z-surface-2) 14px);")} />}
                    </div>
                    <div className="z-cart-info" style={css("flex:1;")}>
                      <div style={css("font:600 11px Inter;color:var(--z-brand);margin-bottom:3px;")}>{c.cat}</div>
                      <div style={css("font:600 14.5px Inter;color:var(--z-ink);margin-bottom:4px;line-height:1.3;")}>{c.name}</div>
                      <div style={css("font:500 11.5px Inter;color:var(--z-ink-3);")}>SKU: {c.sku}</div>
                    </div>
                    <div style={css("display:flex;align-items:center;border:1.5px solid var(--z-line);border-radius:10px;overflow:hidden;flex:none;")}>
                      <button onClick={c.dec} className="z-step" style={css("border:none;background:var(--z-surface);width:34px;height:34px;font:600 17px Inter;color:var(--z-brand-strong);cursor:pointer;")}>−</button>
                      <span style={css("width:34px;text-align:center;font:700 14px Inter;")}>{c.qty}</span>
                      <button onClick={c.inc} className="z-step" style={css("border:none;background:var(--z-surface);width:34px;height:34px;font:600 17px Inter;color:var(--z-brand-strong);cursor:pointer;")}>+</button>
                    </div>
                    <div className="z-cart-price" style={css("text-align:right;flex:none;min-width:130px;")}>
                      <div style={css("font:800 16px Inter;color:var(--z-brand-ink);")}>{c.lineStr}</div>
                      {c.showRank && <div style={css("font:500 11.5px Inter;color:var(--z-ink-3);text-decoration:line-through;")}>{c.lineMpStr}</div>}
                    </div>
                    <button onClick={c.remove} className="z-op" style={css("border:none;background:none;cursor:pointer;flex:none;padding:6px;")}><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={css("color:var(--z-danger)")}><path d="M3 6h18M8 6V4h8v2M6 6l1 14h10l1-14" /></svg></button>
                  </div>
                ))}
              </div>
              <div className="z-sticky" style={css("background:var(--z-surface);border:1px solid var(--z-line);border-radius:18px;padding:24px;position:sticky;top:120px;")}>
                <h3 style={css("font:700 18px Inter;margin:0 0 18px;")}>Pregled porudžbine</h3>
                {rank.disc > 0
                  ? <div style={css("display:flex;justify-content:space-between;font:500 14px Inter;color:var(--z-ink-2);margin-bottom:12px;")}><span>MP vrednost</span><span style={css("text-decoration:line-through;")}>{fmt(mpTotal)}</span></div>
                  : <div style={css("display:flex;justify-content:space-between;font:500 14px Inter;color:var(--z-ink-2);margin-bottom:12px;")}><span>Vrednost ({state.cart.length} {state.cart.length===1?"artikal":state.cart.length<5?"artikla":"artikala"})</span><span>{fmt(mpTotal)}</span></div>}
                {rank.disc > 0 && <div style={css("display:flex;justify-content:space-between;font:600 14px Inter;color:var(--z-success);margin-bottom:12px;")}><span>{rank.name} popust</span><span>− {fmt(savings)}</span></div>}
                <div style={css("display:flex;justify-content:space-between;font:500 14px Inter;color:var(--z-ink-2);margin-bottom:16px;")}><span>Isporuka</span><span style={css("color:var(--z-success);font-weight:600;")}>Besplatno</span></div>
                <div style={css("border-top:1px solid var(--z-line);padding-top:16px;display:flex;justify-content:space-between;align-items:baseline;margin-bottom:8px;")}><span style={css("font:700 16px Inter;")}>Ukupno</span><span style={css("font:800 24px Inter;color:var(--z-brand-strong);")}>{fmt(rankTotal)}</span></div>
                {rank.disc > 0 && <div style={css("background:var(--z-brand-050);border-radius:10px;padding:10px 12px;font:600 12.5px Inter;color:var(--z-brand);text-align:center;margin-bottom:18px;")}>Uštedeli ste {fmt(savings)} kao {rank.name} 🎉</div>}
                {rank.disc === 0 && <div style={css("background:var(--z-brand-050);border-radius:10px;padding:10px 12px;font:600 12.5px Inter;color:var(--z-brand);text-align:center;margin-bottom:18px;")}>Učlanite se u BizzClub i uštedite do 40% na ovu korpu</div>}
                <button onClick={goCheckout} className="z-cta" style={css("width:100%;background:var(--z-deep);color:#fff;border:none;border-radius:12px;height:52px;font:700 15px Inter;cursor:pointer;margin-bottom:10px;")}>Nastavi na plaćanje →</button>
                <button onClick={goPlp} style={css("width:100%;background:none;border:none;color:var(--z-brand);font:600 13px Inter;cursor:pointer;")}>Nastavi kupovinu</button>
              </div>
            </div>
          )}
        </main>
      )}

      {/* ============ CHECKOUT ============ */}
      {scr === "checkout" && (
        <main className="z-shell" style={css("max-width:1100px;margin:0 auto;padding:30px 24px 80px;")}>
          <h1 className="z-h1" style={css("font:800 30px Inter;margin:0 0 6px;")}>Plaćanje</h1>
          <div style={css("display:flex;align-items:center;gap:10px;font:500 13px Inter;color:var(--z-ink-2);margin-bottom:28px;")}><span style={css("color:var(--z-brand);font-weight:600;")}>1 Korpa</span> › <span style={css("color:var(--z-brand);font-weight:600;")}>2 Podaci</span> › <span style={css("color:var(--z-ink-3);")}>3 Potvrda</span></div>
          <div className="z-two-col" style={css("display:grid;grid-template-columns:1.5fr 1fr;gap:28px;align-items:start;")}>
            <div style={css("display:flex;flex-direction:column;gap:20px;")}>
              <div style={css("background:var(--z-surface);border:1px solid var(--z-line);border-radius:18px;padding:24px;")}>
                <h3 style={css("font:700 17px Inter;margin:0 0 18px;")}>Adresa za dostavu</h3>
                <div style={css("display:grid;grid-template-columns:1fr 1fr;gap:14px;")}>
                  <label style={css("font:600 12px Inter;color:var(--z-ink-2);")}>Ime<input defaultValue="Igor" style={css("display:block;width:100%;margin-top:6px;border:1.5px solid var(--z-line);border-radius:10px;padding:11px 12px;font:500 14px Inter;outline:none;")} /></label>
                  <label style={css("font:600 12px Inter;color:var(--z-ink-2);")}>Prezime<input defaultValue="Petrović" style={css("display:block;width:100%;margin-top:6px;border:1.5px solid var(--z-line);border-radius:10px;padding:11px 12px;font:500 14px Inter;outline:none;")} /></label>
                  <label style={css("font:600 12px Inter;color:var(--z-ink-2);grid-column:span 2;")}>Adresa<input defaultValue="Knez Mihailova 12" style={css("display:block;width:100%;margin-top:6px;border:1.5px solid var(--z-line);border-radius:10px;padding:11px 12px;font:500 14px Inter;outline:none;")} /></label>
                  <label style={css("font:600 12px Inter;color:var(--z-ink-2);")}>Grad<input defaultValue="Beograd" style={css("display:block;width:100%;margin-top:6px;border:1.5px solid var(--z-line);border-radius:10px;padding:11px 12px;font:500 14px Inter;outline:none;")} /></label>
                  <label style={css("font:600 12px Inter;color:var(--z-ink-2);")}>Poštanski broj<input defaultValue="11000" style={css("display:block;width:100%;margin-top:6px;border:1.5px solid var(--z-line);border-radius:10px;padding:11px 12px;font:500 14px Inter;outline:none;")} /></label>
                </div>
              </div>
              <div style={css("background:var(--z-surface);border:1px solid var(--z-line);border-radius:18px;padding:24px;")}>
                <h3 style={css("font:700 17px Inter;margin:0 0 18px;")}>Način plaćanja</h3>
                <div style={css("display:flex;flex-direction:column;gap:12px;")}>
                  <label style={css("display:flex;align-items:center;gap:12px;border:1.5px solid var(--z-brand);background:var(--z-brand-050);border-radius:12px;padding:14px 16px;cursor:pointer;")}><span style={css("width:18px;height:18px;border-radius:50%;border:5px solid var(--z-brand);flex:none;")} /><span style={css("font:600 14px Inter;color:var(--z-ink);")}>Platnom karticom</span><span style={css("margin-left:auto;font:600 12px Inter;color:var(--z-ink-3);")}>Visa · Mastercard</span></label>
                  <label style={css("display:flex;align-items:center;gap:12px;border:1.5px solid var(--z-line);border-radius:12px;padding:14px 16px;cursor:pointer;")}><span style={css("width:18px;height:18px;border-radius:50%;border:1.5px solid var(--z-ink-3);flex:none;")} /><span style={css("font:600 14px Inter;color:var(--z-ink);")}>Pouzećem (plaćanje pri preuzimanju)</span></label>
                  <label style={css("display:flex;align-items:center;gap:12px;border:1.5px solid var(--z-line);border-radius:12px;padding:14px 16px;cursor:pointer;")}><span style={css("width:18px;height:18px;border-radius:50%;border:1.5px solid var(--z-ink-3);flex:none;")} /><span style={css("font:600 14px Inter;color:var(--z-ink);")}>Nalog za prenos (uplatnica)</span></label>
                </div>
              </div>
            </div>
            <div className="z-sticky" style={css("background:var(--z-surface);border:1px solid var(--z-line);border-radius:18px;padding:24px;position:sticky;top:120px;")}>
              <h3 style={css("font:700 18px Inter;margin:0 0 18px;")}>Vaša porudžbina</h3>
              <div style={css("display:flex;flex-direction:column;gap:12px;margin-bottom:16px;")}>
                {cartRows.map((c) => (
                  <div key={c.id} style={css("display:flex;justify-content:space-between;gap:10px;font:500 13px Inter;")}><span style={css("color:var(--z-ink);")}>{c.qty}× {c.name}</span><span style={{ ...css("color:var(--z-ink);font-weight:600;"), whiteSpace: "nowrap" }}>{c.lineStr}</span></div>
                ))}
              </div>
              <div style={css("border-top:1px solid var(--z-line);padding-top:14px;")}>
                {rank.disc > 0
                  ? <div style={css("display:flex;justify-content:space-between;font:500 13px Inter;color:var(--z-ink-2);margin-bottom:10px;")}><span>MP vrednost</span><span style={css("text-decoration:line-through;")}>{fmt(mpTotal)}</span></div>
                  : <div style={css("display:flex;justify-content:space-between;font:500 13px Inter;color:var(--z-ink-2);margin-bottom:10px;")}><span>Vrednost</span><span>{fmt(mpTotal)}</span></div>}
                {rank.disc > 0 && <div style={css("display:flex;justify-content:space-between;font:600 13px Inter;color:var(--z-success);margin-bottom:10px;")}><span>{rank.name} popust</span><span>− {fmt(savings)}</span></div>}
                <div style={css("display:flex;justify-content:space-between;font:500 13px Inter;color:var(--z-ink-2);margin-bottom:14px;")}><span>Isporuka</span><span style={css("color:var(--z-success);font-weight:600;")}>Besplatno</span></div>
                <div style={css("display:flex;justify-content:space-between;align-items:baseline;border-top:1px solid var(--z-line);padding-top:14px;margin-bottom:18px;")}><span style={css("font:700 16px Inter;")}>Ukupno</span><span style={css("font:800 22px Inter;color:var(--z-brand-strong);")}>{fmt(rankTotal)}</span></div>
              </div>
              <button className="z-amber" style={css("width:100%;background:var(--z-gold);color:var(--z-gold-ink);border:none;border-radius:12px;height:52px;font:700 15px Inter;cursor:pointer;")}>Potvrdi porudžbinu</button>
              <div style={css("text-align:center;font:500 11.5px Inter;color:var(--z-ink-3);margin-top:12px;")}>🔒 Sigurno plaćanje · SSL zaštita</div>
            </div>
          </div>
        </main>
      )}

      {/* ============ OUTLET ============ */}
      {scr === "outlet" && (<>
        {/* SEKUNDARNA OUTLET NAV */}
        <div className="z-outlet-subnav" style={css("background:var(--z-brand-050);border-bottom:1px solid var(--z-line);")}>
          <div className="z-shell" style={css("max-width:1280px;margin:0 auto;padding:9px 24px;display:flex;align-items:center;gap:6px;")}>
            <span style={css("font:800 11px Inter;letter-spacing:0.1em;color:var(--z-brand);margin-right:8px;")}>OUTLET</span>
            {[{ id: "deals", label: "Dnevne ponude" }, { id: "all", label: "Sve aukcije" }, { id: "what", label: "Šta je Outlet?" }].map((t) => (
              <button key={t.id} onClick={() => patch({ outletNav: t.id, outletView: "list" })} className="z-op" style={{ ...css("border:none;cursor:pointer;font:600 12.5px Inter;padding:6px 11px;border-radius:8px;"), color: state.outletNav === t.id ? "var(--z-brand)" : "var(--z-ink-2)", background: state.outletNav === t.id ? "var(--z-surface)" : "transparent" }}>{t.label}</button>
            ))}
          </div>
        </div>

        {state.outletView === "list" ? (<>
          {/* 1.1 HERO — istaknuta aukcija */}
          <div className="z-outlet-hero" style={css("position:relative;background:linear-gradient(90deg,var(--z-deep) 0%,var(--z-deep) 38%,#ffffff 70%,#ffffff 100%);color:#fff;overflow:hidden;")}>
            <div className="z-oh-inner" style={css("max-width:1232px;margin:0 auto;padding:56px 64px 104px;display:grid;grid-template-columns:1.05fr 0.95fr;gap:32px;align-items:center;min-height:440px;")}>
              <div>
                <div style={css("display:inline-flex;align-items:center;gap:8px;background:rgba(255,255,255,0.12);color:#fff;font:700 11px Inter;letter-spacing:0.06em;padding:6px 12px;border-radius:8px;margin-bottom:16px;")}>⚡ IZDVOJENA AUKCIJA</div>
                <h1 className="z-h1" style={{ ...css("font:800 40px Inter;line-height:1.08;margin:0 0 10px;") }}>{heroA.name}</h1>
                <p style={css("font:400 15px Inter;opacity:.82;margin:0 0 18px;max-width:440px;")}>Stanje: {heroA.condLabel}. Licitirajte ili kupite odmah po Outlet ceni — provereno i sa garancijom.</p>
                <div style={css("display:flex;flex-wrap:wrap;align-items:center;gap:14px;margin-bottom:24px;font:600 13px Inter;")}>
                  <span style={css("opacity:.85;")}>Redovna cena&nbsp;<b>{heroA.buyStr}</b></span>
                  <span style={css("opacity:.35;")}>·</span>
                  <span style={css("opacity:.85;")}>Na stanju&nbsp;<b>{heroA.stock}</b></span>
                  <span style={css("opacity:.35;")}>·</span>
                  <span className={heroA.pulse ? "z-cd-pulse" : ""} style={{ ...css("display:inline-flex;align-items:center;gap:6px;font-variant-numeric:tabular-nums;"), color: heroA.ended ? "#fff" : heroA.cdCol }}>⏱ {heroA.ended ? "Aukcija završena" : heroA.cd.str}</span>
                </div>
                <div style={css("display:flex;align-items:center;gap:18px;")}>
                  <button onClick={heroA.open} className="z-cta" style={css("background:var(--z-deep);color:#fff;border:1px solid rgba(255,255,255,0.24);border-radius:12px;padding:14px 30px;font:700 15px Inter;cursor:pointer;")}>Licitiraj</button>
                  <button onClick={heroA.open} className="z-op" style={css("background:none;border:none;color:#fff;font:700 14px Inter;cursor:pointer;text-decoration:underline;text-underline-offset:3px;padding:0;")}>Više informacija →</button>
                </div>
              </div>
              <div style={css("position:relative;display:flex;align-items:center;justify-content:center;min-height:260px;")}>
                {heroA.hasImg && <img key={heroA.id} src={heroA.img} alt={heroA.name} className="z-oh-img" style={css("max-height:340px;max-width:100%;object-fit:contain;filter:drop-shadow(0 24px 48px rgba(0,0,0,0.45));")} />}
              </div>
            </div>
            <button onClick={() => cycleHero(-1)} aria-label="Prethodna aukcija" className="z-op" style={css("position:absolute;left:16px;top:50%;transform:translateY(-50%);z-index:3;width:40px;height:40px;border-radius:50%;border:1px solid var(--z-line);background:var(--z-surface);color:var(--z-ink);box-shadow:0 2px 10px rgba(0,0,0,0.14);font-size:20px;cursor:pointer;display:flex;align-items:center;justify-content:center;")}>‹</button>
            <button onClick={() => cycleHero(1)} aria-label="Sledeća aukcija" className="z-op" style={css("position:absolute;right:16px;top:50%;transform:translateY(-50%);z-index:3;width:40px;height:40px;border-radius:50%;border:1px solid var(--z-line);background:var(--z-surface);color:var(--z-ink);box-shadow:0 2px 10px rgba(0,0,0,0.14);font-size:20px;cursor:pointer;display:flex;align-items:center;justify-content:center;")}>›</button>
            <div style={css("position:absolute;bottom:66px;left:0;right:0;display:flex;justify-content:center;gap:7px;z-index:3;")}>
              {heroAuctions.map((_, i) => (<span key={i} style={{ ...css("width:7px;height:7px;border-radius:50%;"), background: i === (state.outletHero % heroAuctions.length) ? "var(--z-brand)" : "var(--z-ink-3)" }} />))}
            </div>
          </div>

          <main className="z-shell z-search" style={css("max-width:1232px;margin:0 auto;padding:0 24px 80px;")}>
            {/* 1.2 TRAKA ZA PRETRAGU (preklapa hero) */}
            <div className="z-outlet-search" style={css("position:relative;z-index:4;margin-top:-32px;margin-bottom:44px;background:var(--z-surface);border:1px solid var(--z-line);border-radius:16px;box-shadow:0 20px 44px -26px rgba(12,58,62,0.55);padding:12px;display:flex;align-items:center;gap:10px;")}>
              <button className="z-sec z-outlet-scat" style={css("flex:none;display:flex;align-items:center;gap:8px;background:var(--z-surface-2);border:1px solid var(--z-line);border-radius:10px;padding:12px 15px;font:600 13px Inter;color:var(--z-ink);cursor:pointer;")}>Sve kategorije ▾</button>
              <input placeholder="Pretraži Outlet aukcije…" style={css("flex:1;border:none;background:none;outline:none;padding:12px 8px;font:500 14px Inter;color:var(--z-ink);min-width:0;")} />
              <button className="z-cta" style={css("flex:none;background:var(--z-deep);color:#fff;border:none;border-radius:10px;padding:13px 24px;font:700 14px Inter;cursor:pointer;")}>Pretraga</button>
            </div>

            {/* 1.3 IZDVOJENE AUKCIJE */}
            <div style={css("display:flex;align-items:center;justify-content:space-between;margin-bottom:18px;")}>
              <h2 style={css("font:800 22px Inter;margin:0;color:var(--z-ink);")}>Izdvojene aukcije</h2>
              <button onClick={() => patch({ outletFilter: "sve" })} className="z-op" style={css("background:none;border:none;color:var(--z-brand);font:600 14px Inter;cursor:pointer;")}>Pogledaj sve →</button>
            </div>
            <div className="z-grid-3 z-carousel" style={css("display:grid;grid-template-columns:repeat(3,1fr);gap:20px;margin-bottom:52px;")}>
              {heroAuctions.map((a) => <AuctionCard key={a.id} a={a} />)}
            </div>

            {/* 1.4 KATEGORIJE (bento) — veliki levo, Bioptron širok gore, dve pločice dole */}
            <h2 style={css("font:800 22px Inter;margin:0 0 18px;color:var(--z-ink);")}>Kategorije</h2>
            <div className="z-outlet-bento" style={css("display:grid;grid-template-columns:1.5fr 1fr 1fr;grid-template-rows:224px 224px;gap:16px;")}>
              {OUTLET_CATS.map((c, i) => {
                const pos = [{ gridColumn: "1/2", gridRow: "1/3" }, { gridColumn: "2/4", gridRow: "1/2" }, { gridColumn: "2/3", gridRow: "2/3" }, { gridColumn: "3/4", gridRow: "2/3" }][i];
                return (
                  <button key={i} onClick={goPlp} className="z-card-flat z-outlet-tile" style={{ ...css("position:relative;border:none;border-radius:14px;overflow:hidden;cursor:pointer;padding:0;background:var(--z-surface-2);"), ...pos }}>
                    <img src={A(c.img)} alt={c.name} style={css("position:absolute;inset:0;width:100%;height:100%;object-fit:cover;")} />
                    <div style={css("position:absolute;inset:0;background:linear-gradient(0deg,rgba(10,18,29,0.72) 6%,rgba(10,18,29,0) 58%);")} />
                    <span style={{ ...css("position:absolute;left:16px;bottom:14px;color:#fff;font:700 15px Inter;text-align:left;"), fontSize: c.big ? "22px" : "15px" }}>{c.name}</span>
                  </button>
                );
              })}
            </div>
            <div style={css("display:flex;justify-content:center;margin:26px 0 56px;")}>
              <button onClick={goPlp} className="z-sec" style={css("display:flex;align-items:center;gap:10px;border:1.5px solid var(--z-line);background:var(--z-surface);color:var(--z-ink);border-radius:12px;padding:12px 22px;font:600 14px Inter;cursor:pointer;")}>
                <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={css("color:var(--z-brand)")}><rect x="3" y="3" width="7" height="7" rx="1.5" /><rect x="14" y="3" width="7" height="7" rx="1.5" /><rect x="3" y="14" width="7" height="7" rx="1.5" /><rect x="14" y="14" width="7" height="7" rx="1.5" /></svg>
                Pogledaj sve kategorije
                <span style={css("color:var(--z-brand);")}>→</span>
              </button>
            </div>

            {/* 1.5 TIP AUKCIJE + lista */}
            <h2 style={css("font:800 22px Inter;margin:0 0 16px;color:var(--z-ink);")}>Sve aukcije</h2>
            <div style={css("display:flex;gap:10px;margin-bottom:24px;flex-wrap:wrap;")}>
              {outletFilterMeta.map((f) => {
                const on = state.outletFilter === f.id;
                return (
                  <button key={f.id} onClick={() => pickOutletFilter(f.id)} className="z-sec" style={{ ...css("border-radius:10px;padding:9px 16px;font:600 13px Inter;cursor:pointer;"), border: on ? "1px solid var(--z-brand)" : "1px solid var(--z-line)", background: on ? "var(--z-brand)" : "var(--z-surface)", color: on ? "#fff" : "var(--z-ink)" }}>{f.label}</button>
                );
              })}
            </div>

            {state.outletLoading ? (
              <div className="z-grid-3 z-carousel" style={css("display:grid;grid-template-columns:repeat(3,1fr);gap:20px;")}>
                {[0, 1, 2].map((i) => (
                  <div key={i} style={css("background:var(--z-surface);border:1px solid var(--z-line);border-radius:16px;overflow:hidden;")}>
                    <div className="z-skel" style={css("height:206px;")} />
                    <div style={css("padding:16px 18px 18px;")}>
                      <div className="z-skel" style={css("height:12px;width:40%;border-radius:6px;margin-bottom:10px;")} />
                      <div className="z-skel" style={css("height:16px;width:85%;border-radius:6px;margin-bottom:16px;")} />
                      <div className="z-skel" style={css("height:36px;width:100%;border-radius:10px;")} />
                    </div>
                  </div>
                ))}
              </div>
            ) : outletList.length === 0 ? (
              <div style={css("text-align:center;padding:64px 20px;background:var(--z-surface);border:1px solid var(--z-line);border-radius:18px;")}>
                <div style={css("width:64px;height:64px;border-radius:50%;background:var(--z-brand-050);display:flex;align-items:center;justify-content:center;margin:0 auto 16px;")}>
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" style={css("color:var(--z-brand);")}><circle cx="11" cy="11" r="7" /><path d="M21 21l-4.3-4.3" /></svg>
                </div>
                <h3 style={css("font:700 18px Inter;margin:0 0 6px;color:var(--z-ink);")}>Nema aukcija za ovaj filter</h3>
                <p style={css("font:500 13px Inter;color:var(--z-ink-2);margin:0;")}>Probajte drugi filter ili se vratite kasnije — nove aukcije stižu svakog dana.</p>
              </div>
            ) : (<>
              {/* wide varijanta — prva stavka */}
              <button onClick={outletList[0].open} className="z-card z-outlet-wide" style={css("width:100%;text-align:left;display:flex;gap:22px;align-items:stretch;background:var(--z-surface);border:1px solid var(--z-line);border-radius:16px;overflow:hidden;cursor:pointer;padding:0;margin-bottom:20px;")}>
                <div className="z-outlet-wide-img" style={css("flex:none;width:240px;background:var(--z-surface-2);display:flex;align-items:center;justify-content:center;padding:18px;")}>
                  {outletList[0].hasImg && <img src={outletList[0].img} alt={outletList[0].name} style={css("max-height:180px;max-width:100%;object-fit:contain;")} />}
                </div>
                <div style={css("flex:1;padding:20px 22px 20px 0;display:flex;flex-direction:column;justify-content:center;")}>
                  <div style={css("display:flex;align-items:center;gap:8px;margin-bottom:8px;")}>
                    <span title={outletList[0].condInfo} style={css("background:var(--z-brand-050);color:var(--z-brand);font:700 10.5px Inter;padding:3px 9px;border-radius:6px;")}>{outletList[0].condLabel} ⓘ</span>
                    <span style={css("font:500 11px Inter;color:var(--z-ink-3);")}>{outletList[0].cat}</span>
                    <span style={css("font:600 11px Inter;color:var(--z-ink-3);margin-left:auto;")}>još {outletList[0].stock} na stanju</span>
                  </div>
                  <div style={css("font:800 20px Inter;color:var(--z-ink);line-height:1.25;margin-bottom:6px;")}>{outletList[0].name}</div>
                  <p style={css("font:400 13px Inter;color:var(--z-ink-2);margin:0 0 14px;max-width:520px;")}>Provereno i spremno za isporuku. <span style={css("color:var(--z-brand);font-weight:600;")}>Pročitaj više</span></p>
                  <div style={css("display:flex;align-items:flex-end;gap:26px;flex-wrap:wrap;")}>
                    <div><div style={css("font:500 11px Inter;color:var(--z-ink-2);")}>Najviša ponuda</div><div style={css("font:800 22px Inter;color:var(--z-brand-ink);font-variant-numeric:tabular-nums;")}>{outletList[0].bidStr}</div></div>
                    <div><div style={css("font:500 11px Inter;color:var(--z-ink-2);")}>Redovna cena</div><div style={css("font:600 14px Inter;color:var(--z-ink-3);text-decoration:line-through;")}>{outletList[0].buyStr}</div></div>
                    <div><div style={css("font:500 11px Inter;color:var(--z-ink-2);")}>Završava se</div><div className={outletList[0].pulse ? "z-cd-pulse" : ""} style={{ ...css("font:700 14px Inter;font-variant-numeric:tabular-nums;"), color: outletList[0].cdCol }}>{outletList[0].ended ? "Završeno" : outletList[0].cd.str}</div></div>
                    <span onClick={(e) => { e.stopPropagation(); outletList[0].open(); }} className="z-cta" style={css("margin-left:auto;background:var(--z-deep);color:#fff;border:none;border-radius:10px;padding:12px 24px;font:700 13.5px Inter;cursor:pointer;")}>Licitiraj</span>
                  </div>
                </div>
              </button>
              {/* compact varijanta — ostale stavke */}
              <div className="z-grid-3 z-carousel" style={css("display:grid;grid-template-columns:repeat(3,1fr);gap:20px;")}>
                {outletList.slice(1).map((a) => <AuctionCard key={a.id} a={a} />)}
              </div>
              <div style={css("display:flex;justify-content:center;margin-top:36px;")}>
                <button className="z-sec" style={css("border:1.5px solid var(--z-brand);background:var(--z-surface);color:var(--z-brand);border-radius:12px;padding:13px 30px;font:600 14px Inter;cursor:pointer;")}>Učitaj još</button>
              </div>
            </>)}

            {/* 1.6 BIZZCLUB band */}
            <div className="z-outlet-bizz" style={css("margin-top:56px;display:grid;grid-template-columns:0.9fr 1.1fr;gap:0;border:1px solid var(--z-line);border-radius:18px;overflow:hidden;background:var(--z-surface);")}>
              <div className="z-outlet-bizz-img" style={css("position:relative;min-height:220px;")}>
                <img src={A("assets/znew/pink-lepota.jpg")} alt="BizzClub" style={css("position:absolute;inset:0;width:100%;height:100%;object-fit:cover;")} />
              </div>
              <div style={css("padding:34px 36px;display:flex;flex-direction:column;justify-content:center;")}>
                <span style={css("display:inline-block;background:var(--z-brand-050);color:var(--z-brand);font:800 11px Inter;letter-spacing:0.06em;padding:5px 11px;border-radius:8px;margin-bottom:14px;width:fit-content;")}>BIZZCLUB</span>
                <h3 style={css("font:800 26px Inter;color:var(--z-ink);margin:0 0 10px;line-height:1.15;")}>Članovi plaćaju još manje</h3>
                <p style={css("font:400 14px Inter;color:var(--z-ink-2);margin:0 0 20px;max-width:420px;line-height:1.5;")}>Uz BizzClub članstvo ostvarujete dodatni popust na „Kupi odmah" cene i prioritet na Outlet aukcijama.</p>
                <div style={css("display:flex;align-items:center;gap:16px;")}>
                  <button onClick={goBizz} className="z-cta" style={css("background:var(--z-deep);color:#fff;border:none;border-radius:12px;padding:13px 26px;font:700 14px Inter;cursor:pointer;")}>Učlanite se</button>
                  <button onClick={goBizz} className="z-op" style={css("background:none;border:none;color:var(--z-brand);font:700 13px Inter;cursor:pointer;")}>Saznajte više →</button>
                </div>
              </div>
            </div>
          </main>
        </>) : (
          /* ============ OUTLET PDP (aukcija) ============ */
          <main className="z-shell z-search" style={css("max-width:1232px;margin:0 auto;padding:22px 24px 80px;")}>
            <div style={css("display:flex;align-items:center;gap:14px;margin-bottom:18px;")}>
              <button onClick={backToOutlet} className="z-op" style={css("display:flex;align-items:center;gap:6px;border:none;background:none;cursor:pointer;font:600 13px Inter;color:var(--z-brand);padding:0;")}>← Nazad na Outlet</button>
              <span style={css("font:500 12.5px Inter;color:var(--z-ink-2);")}>Početna&nbsp;/&nbsp;Outlet&nbsp;/&nbsp;{pdpA.cat}&nbsp;/&nbsp;<span style={css("color:var(--z-ink);font-weight:600;")}>{pdpA.name}</span></span>
            </div>
            <div className="z-pdp-main" style={css("display:grid;grid-template-columns:1.1fr 1fr;gap:40px;margin-bottom:40px;")}>
              {/* galerija */}
              <div style={css("display:flex;gap:16px;")}>
                <div style={css("display:flex;flex-direction:column;gap:12px;flex:none;")}>
                  {[0, 1, 2, 3].map((i) => (
                    <button key={i} style={{ ...css("width:64px;height:64px;border-radius:12px;background:var(--z-surface);cursor:pointer;padding:6px;overflow:hidden;"), border: i === 0 ? "2px solid var(--z-brand)" : "2px solid var(--z-line)" }}>
                      {pdpA.hasImg && <img src={pdpA.img} alt="" style={css("width:100%;height:100%;object-fit:contain;")} />}
                    </button>
                  ))}
                </div>
                <div className="z-pdp-stage" style={css("position:relative;flex:1;background:var(--z-surface-2);border:1px solid var(--z-line);border-radius:20px;display:flex;align-items:center;justify-content:center;padding:36px;min-height:420px;")}>
                  <span style={css("position:absolute;top:18px;left:18px;background:var(--z-brand-050);color:var(--z-brand);font:700 11px Inter;padding:5px 11px;border-radius:8px;")}>{pdpA.condLabel}</span>
                  {pdpA.hasImg && <img src={pdpA.img} alt={pdpA.name} style={css("max-height:360px;max-width:100%;object-fit:contain;")} />}
                  <button aria-label="Prethodna" className="z-op" style={css("position:absolute;left:16px;top:50%;transform:translateY(-50%);width:36px;height:36px;border-radius:50%;border:1px solid var(--z-line);background:var(--z-surface);color:var(--z-ink);font-size:18px;cursor:pointer;")}>‹</button>
                  <button aria-label="Sledeća" className="z-op" style={css("position:absolute;right:16px;top:50%;transform:translateY(-50%);width:36px;height:36px;border-radius:50%;border:1px solid var(--z-line);background:var(--z-surface);color:var(--z-ink);font-size:18px;cursor:pointer;")}>›</button>
                </div>
              </div>
              {/* blok ponude */}
              <div>
                <div style={css("display:inline-block;background:var(--z-brand-050);color:var(--z-brand);font:600 12px Inter;padding:5px 11px;border-radius:8px;margin-bottom:14px;")}>{pdpA.cat}</div>
                <h1 className="z-h1" style={css("font:800 30px Inter;margin:0 0 10px;line-height:1.15;color:var(--z-ink);")}>{pdpA.name}</h1>
                <button onClick={pdpA.wish} className="z-op" style={css("display:flex;align-items:center;gap:9px;border:none;background:none;cursor:pointer;padding:0;margin-bottom:22px;font:500 13px Inter;color:var(--z-ink-2);")}>
                  {heart(pdpA.heartFill, pdpA.heartStroke, 18)}Dodaj u listu želja · {pdpA.bidsCount + 13} osoba želi ovaj proizvod
                </button>

                <div style={css("background:var(--z-surface-2);border:1px solid var(--z-line);border-radius:18px;padding:22px;margin-bottom:18px;")}>
                  <div style={css("display:flex;align-items:baseline;justify-content:space-between;margin-bottom:14px;")}>
                    <div>
                      <div style={css("font:500 12px Inter;color:var(--z-ink-2);margin-bottom:2px;")}>Najviša ponuda · {pdpA.bidsCount} ponuda</div>
                      <div style={css("font:800 32px Inter;color:var(--z-brand-ink);font-variant-numeric:tabular-nums;")}>{pdpA.bidStr}</div>
                    </div>
                    {!pdpA.reserveMet && !pdpA.ended && <span style={css("font:600 11px Inter;color:var(--z-ink-3);text-align:right;max-width:120px;")}>Rezervna cena nije dostignuta</span>}
                  </div>
                  {pdpA.mine && pdpA.mine.outbid && !pdpA.ended && (
                    <div style={css("background:var(--z-surface);border:1px solid var(--z-line);border-radius:10px;padding:9px 12px;font:600 12px Inter;color:var(--z-danger);margin-bottom:14px;")}>Vaša ponuda ({pdpA.mineStr}) je nadmašena</div>
                  )}
                  {pdpA.ended ? (
                    <button disabled style={css("width:100%;background:var(--z-surface);color:var(--z-ink-3);border:1px solid var(--z-line);border-radius:12px;height:50px;font:700 15px Inter;cursor:not-allowed;")}>Aukcija završena</button>
                  ) : (<>
                    <div style={css("font:600 12px Inter;color:var(--z-ink-2);margin-bottom:6px;")}>Vaša ponuda</div>
                    <div style={css("display:flex;gap:10px;margin-bottom:12px;")}>
                      <input value={state.outletBid} onChange={(e) => patch({ outletBid: e.target.value.replace(/[^0-9]/g, "") })} inputMode="numeric" placeholder="Iznos veći od najviše ponude"
                        style={css("flex:1;border:1.5px solid var(--z-line);background:var(--z-surface);border-radius:12px;padding:13px 14px;font:600 14px Inter;color:var(--z-ink);outline:none;min-width:0;")} />
                      <button className="z-cta" style={css("flex:none;background:var(--z-deep);color:#fff;border:none;border-radius:12px;padding:0 22px;font:700 14px Inter;cursor:pointer;")}>Pošalji ponudu</button>
                    </div>
                    <button className="z-buynow" style={css("width:100%;background:var(--z-surface);border:1.5px solid var(--z-gold);color:var(--z-gold);border-radius:12px;height:48px;font:700 14px Inter;cursor:pointer;")}>Ili Kupi odmah · {pdpA.buyStr}</button>
                  </>)}
                </div>

                {/* info traka */}
                <div style={css("display:grid;grid-template-columns:repeat(3,1fr);gap:12px;margin-bottom:18px;")}>
                  <div style={css("background:var(--z-surface);border:1px solid var(--z-line);border-radius:12px;padding:12px 14px;")}><div style={css("font:500 11px Inter;color:var(--z-ink-2);margin-bottom:3px;")}>Na stanju</div><div style={css("font:700 14px Inter;color:var(--z-ink);")}>{pdpA.stock}</div></div>
                  <div title={pdpA.condInfo} style={css("background:var(--z-surface);border:1px solid var(--z-line);border-radius:12px;padding:12px 14px;cursor:help;")}><div style={css("font:500 11px Inter;color:var(--z-ink-2);margin-bottom:3px;")}>Outlet tip</div><div style={css("font:700 14px Inter;color:var(--z-ink);")}>{pdpA.condLabel} ⓘ</div></div>
                  <div style={css("background:var(--z-surface);border:1px solid var(--z-line);border-radius:12px;padding:12px 14px;")}><div style={css("font:500 11px Inter;color:var(--z-ink-2);margin-bottom:3px;")}>Aukcija se završava</div><div className={pdpA.pulse ? "z-cd-pulse" : ""} style={{ ...css("font:700 14px Inter;font-variant-numeric:tabular-nums;"), color: pdpA.cdCol }}>{pdpA.ended ? "Završeno" : pdpA.cd.str}</div></div>
                </div>

                {/* BizzClub band */}
                <div style={css("display:flex;align-items:center;gap:14px;background:var(--z-brand-050);border-radius:14px;padding:14px 16px;")}>
                  <div style={css("flex:1;")}><div style={css("font:800 13px Inter;color:var(--z-brand);margin-bottom:2px;")}>Postani BizzClub član</div><div style={css("font:500 12px Inter;color:var(--z-ink-2);")}>Dodatne pogodnosti i popust na Outlet ponude.</div></div>
                  <button onClick={goBizz} className="z-op" style={css("flex:none;background:none;border:none;color:var(--z-brand);font:700 13px Inter;cursor:pointer;")}>Učlani se →</button>
                </div>
              </div>
            </div>

            {/* tabovi */}
            <div style={css("max-width:840px;")}>
              <div style={css("display:flex;gap:8px;border-bottom:1px solid var(--z-line);margin-bottom:20px;")}>
                {[{ id: "opis", label: "Opis proizvoda" }, { id: "spec", label: "Specifikacija" }, { id: "dostava", label: "Dostava" }].map((t) => {
                  const on = state.outletTab === t.id;
                  return (
                    <button key={t.id} onClick={() => patch({ outletTab: t.id })} className="z-step" style={{ ...css("border:none;cursor:pointer;font:700 13.5px Inter;padding:11px 18px;border-radius:10px 10px 0 0;"), background: on ? "var(--z-brand-strong)" : "transparent", color: on ? "#fff" : "var(--z-ink-2)" }}>{t.label}</button>
                  );
                })}
              </div>
              {state.outletTab === "opis" && (
                <p style={css("font:400 14.5px Inter;color:var(--z-ink-2);line-height:1.65;margin:0;max-width:680px;")}>{pdpA.name} iz ZEUS Outlet ponude — {pdpA.condLabel.toLowerCase()}, provereno i testirano. Idealna prilika da do vrhunskog proizvoda dođete po znatno nižoj ceni kroz aukciju ili opciju „Kupi odmah". Uz svaki Outlet proizvod ide garancija i podrška kao za nove artikle.</p>
              )}
              {state.outletTab === "spec" && (
                <div style={css("max-width:520px;")}>
                  {[["Kategorija", pdpA.cat], ["Stanje", pdpA.condLabel], ["Na stanju", String(pdpA.stock) + " kom"], ["Broj ponuda", String(pdpA.bidsCount)], ["Garancija", "12 meseci"]].map((r, i) => (
                    <div key={i} style={{ ...css("display:flex;justify-content:space-between;padding:10px 14px;border-radius:8px;font:500 13.5px Inter;"), background: i % 2 ? "var(--z-surface-2)" : "var(--z-surface)" }}><span style={css("color:var(--z-ink-2);")}>{r[0]}</span><span style={css("color:var(--z-ink);font-weight:600;")}>{r[1]}</span></div>
                  ))}
                </div>
              )}
              {state.outletTab === "dostava" && (
                <p style={css("font:400 14.5px Inter;color:var(--z-ink-2);line-height:1.65;margin:0;max-width:680px;")}>Besplatna isporuka na teritoriji Srbije, dostava 2–4 radna dana. Za Outlet artikle važi ista politika povraćaja kao za nove proizvode (14 dana). Plaćanje karticom, pouzećem ili preko naloga za prenos.</p>
              )}
            </div>
          </main>
        )}
      </>)}

      {/* ============ BIZZCLUB ============ */}
      {scr === "bizz" && (
        <main style={css("padding:0 0 80px;")}>
          <div className="z-bizz-hero" style={css("background:linear-gradient(135deg,var(--z-deep),var(--z-deep));color:#fff;padding:64px 24px;text-align:center;")}>
            <div style={css("max-width:760px;margin:0 auto;")}>
              <div style={css("display:inline-block;background:rgba(245,183,46,0.18);color:var(--z-gold);font:700 12px Inter;padding:7px 14px;border-radius:8px;margin-bottom:20px;letter-spacing:0.06em;")}>ZEUS MEMBERS CLUB</div>
              <h1 className="z-bizz-h1" style={css("font:800 44px Inter;margin:0 0 16px;line-height:1.1;")}>Kupujte pametnije.<br />Uštedite do −40%.</h1>
              <p style={css("font:400 17px Inter;opacity:.85;margin:0 0 30px;")}>Učlanjenje je besplatno. Što viši rang u BizzClub strukturi, to veći popust na sve proizvode i brendove na marketplace-u.</p>
              <button onClick={goPlp} className="z-amber" style={css("background:var(--z-gold);color:var(--z-gold-ink);border:none;border-radius:12px;padding:15px 32px;font:700 15px Inter;cursor:pointer;")}>Učlanite se besplatno</button>
            </div>
          </div>
          <div className="z-shell" style={css("max-width:1100px;margin:0 auto;padding:56px 24px;")}>
            <h2 style={css("font:800 28px Inter;text-align:center;margin:0 0 8px;")}>Rangovi i popusti</h2>
            <p style={css("font:400 15px Inter;color:var(--z-ink-2);text-align:center;margin:0 0 36px;")}>Vaš popust raste sa napredovanjem kroz strukturu članstva.</p>
            <div className="z-grid-3" style={css("display:grid;grid-template-columns:repeat(3,1fr);gap:18px;margin-bottom:56px;")}>
              {rankCards.map((r, i) => (
                <div key={i} style={{ ...css("background:var(--z-surface);border-radius:18px;padding:26px;position:relative;"), border: "1.5px solid " + r.border }}>
                  {r.maxTag && <span style={css("position:absolute;top:18px;right:18px;background:var(--z-gold);color:var(--z-gold-ink);font:700 10px Inter;padding:3px 9px;border-radius:6px;")}>Max popust</span>}
                  <div style={css("font:700 12px Inter;color:var(--z-brand);letter-spacing:0.05em;text-transform:uppercase;margin-bottom:12px;")}>Rang</div>
                  <div style={css("font:800 19px Inter;color:var(--z-ink);margin-bottom:14px;")}>{r.name}</div>
                  <div style={css("font:800 44px Inter;color:var(--z-brand-ink);line-height:1;")}>{r.discBig}</div>
                  <div style={css("font:500 13px Inter;color:var(--z-ink-2);margin-top:6px;")}>popusta na sve</div>
                </div>
              ))}
            </div>
            <h2 style={css("font:800 28px Inter;text-align:center;margin:0 0 36px;")}>Pogodnosti članstva</h2>
            <div className="z-grid-4" style={css("display:grid;grid-template-columns:repeat(4,1fr);gap:18px;")}>
              {benefits.map((b, i) => (
                <div key={i} style={css("background:var(--z-surface);border:1px solid var(--z-line);border-radius:16px;padding:24px;text-align:center;")}>
                  <div style={css("width:54px;height:54px;border-radius:14px;background:var(--z-brand-050);color:var(--z-brand);display:flex;align-items:center;justify-content:center;margin:0 auto 16px;")}><b.Icon size={24} strokeWidth={1.7} /></div>
                  <div style={css("font:700 15px Inter;color:var(--z-ink);margin-bottom:8px;")}>{b.title}</div>
                  <div style={css("font:400 13px Inter;color:var(--z-ink-2);line-height:1.45;")}>{b.desc}</div>
                </div>
              ))}
            </div>
          </div>
        </main>
      )}

      {/* ============ DESIGN SYSTEM ============ */}
      {scr === "ds" && (
        <main className="z-shell" style={css("max-width:1100px;margin:0 auto;padding:36px 24px 80px;")}>
          <h1 className="z-h1" style={css("font:800 34px Inter;margin:0 0 6px;")}>ZEUS — dizajn sistem</h1>
          <p style={css("font:400 15px Inter;color:var(--z-ink-2);margin:0 0 40px;")}>Tokeni i jezgro komponenti. Minimalistički, prozračno, brend tirkiz kao prepoznatljiv akcenat.</p>

          <h2 style={css("font:700 20px Inter;margin:0 0 16px;")}>Boje</h2>
          <div className="z-grid-4" style={css("display:grid;grid-template-columns:repeat(4,1fr);gap:14px;margin-bottom:44px;")}>
            {swatches.map((s, i) => (
              <div key={i} style={css("border:1px solid var(--z-line);border-radius:14px;overflow:hidden;")}>
                <div style={{ ...css("height:84px;"), background: s.hex }} />
                <div style={css("padding:12px 14px;")}><div style={css("font:600 13px Inter;color:var(--z-ink);")}>{s.name}</div><div style={css("font:500 11.5px ui-monospace,monospace;color:var(--z-ink-3);")}>{s.hex}</div></div>
              </div>
            ))}
          </div>

          <h2 style={css("font:700 20px Inter;margin:0 0 16px;")}>Tipografija — Inter</h2>
          <div style={css("background:var(--z-surface);border:1px solid var(--z-line);border-radius:16px;padding:28px;margin-bottom:44px;display:flex;flex-direction:column;gap:14px;")}>
            <div style={css("display:flex;align-items:baseline;gap:16px;")}><span style={css("font:500 11px ui-monospace,monospace;color:var(--z-ink-3);width:80px;")}>40 / 800</span><span style={css("font:800 40px Inter;color:var(--z-ink);")}>Zaglavlje</span></div>
            <div style={css("display:flex;align-items:baseline;gap:16px;")}><span style={css("font:500 11px ui-monospace,monospace;color:var(--z-ink-3);width:80px;")}>28 / 800</span><span style={css("font:800 28px Inter;color:var(--z-ink);")}>Naslov sekcije</span></div>
            <div style={css("display:flex;align-items:baseline;gap:16px;")}><span style={css("font:500 11px ui-monospace,monospace;color:var(--z-ink-3);width:80px;")}>20 / 700</span><span style={css("font:700 20px Inter;color:var(--z-ink);")}>Podnaslov</span></div>
            <div style={css("display:flex;align-items:baseline;gap:16px;")}><span style={css("font:500 11px ui-monospace,monospace;color:var(--z-ink-3);width:80px;")}>16 / 600</span><span style={css("font:600 16px Inter;color:var(--z-ink);")}>Naziv proizvoda</span></div>
            <div style={css("display:flex;align-items:baseline;gap:16px;")}><span style={css("font:500 11px ui-monospace,monospace;color:var(--z-ink-3);width:80px;")}>14 / 400</span><span style={css("font:400 14px Inter;color:var(--z-ink-2);")}>Tekst paragrafa, opisi i pomoćne informacije.</span></div>
          </div>

          <h2 style={css("font:700 20px Inter;margin:0 0 16px;")}>Dugmad</h2>
          <div style={css("background:var(--z-surface);border:1px solid var(--z-line);border-radius:16px;padding:28px;margin-bottom:44px;display:flex;gap:14px;flex-wrap:wrap;align-items:center;")}>
            <button className="z-cta" style={css("background:var(--z-deep);color:#fff;border:none;border-radius:12px;padding:13px 22px;font:600 14px Inter;cursor:pointer;")}>Primarno (CTA)</button>
            <button className="z-amber" style={css("background:var(--z-gold);color:var(--z-gold-ink);border:none;border-radius:12px;padding:13px 22px;font:700 14px Inter;cursor:pointer;")}>Amber akcija</button>
            <button className="z-sec" style={css("background:var(--z-surface);color:var(--z-brand);border:1.5px solid var(--z-brand);border-radius:12px;padding:13px 22px;font:600 14px Inter;cursor:pointer;")}>Sekundarno</button>
            <button style={css("background:none;color:var(--z-brand);border:none;font:600 14px Inter;cursor:pointer;")}>Ghost link →</button>
            <button disabled style={css("background:var(--z-surface-2);color:var(--z-ink-3);border:none;border-radius:12px;padding:13px 22px;font:600 14px Inter;cursor:not-allowed;")}>Onemogućeno</button>
          </div>

          <h2 style={css("font:700 20px Inter;margin:0 0 16px;")}>Komponente</h2>
          <div className="z-grid-2" style={css("display:grid;grid-template-columns:1fr 1fr;gap:18px;")}>
            <div style={css("background:var(--z-surface);border:1px solid var(--z-line);border-radius:16px;padding:24px;")}>
              <div style={css("font:600 12px Inter;color:var(--z-ink-3);margin-bottom:14px;")}>PRICE BLOCK · GOST</div>
              <div style={css("font:500 11px Inter;color:var(--z-ink-2);")}>MP Cena</div>
              <div style={css("font:800 22px Inter;color:var(--z-ink);margin-bottom:8px;")}>72.890,00 RSD</div>
              <div style={css("display:flex;align-items:center;gap:6px;background:var(--z-brand-050);border-radius:8px;padding:8px 10px;")}><span style={css("font:700 11px Inter;color:var(--z-brand-ink);")}>BizzClub</span><span style={css("font:500 11px Inter;color:var(--z-brand-strong);")}>do −40%</span></div>
            </div>
            <div style={css("background:var(--z-surface);border:1px solid var(--z-line);border-radius:16px;padding:24px;")}>
              <div style={css("font:600 12px Inter;color:var(--z-ink-3);margin-bottom:14px;")}>PRICE BLOCK · RANG</div>
              <div style={css("display:flex;align-items:baseline;gap:8px;")}><span style={css("font:800 22px Inter;color:var(--z-brand-ink);")}>43.734,00 RSD</span><span style={css("background:var(--z-brand-050);color:var(--z-brand);font:700 11px Inter;padding:2px 7px;border-radius:6px;")}>−40%</span></div>
              <div style={css("font:500 12px Inter;color:var(--z-ink-3);text-decoration:line-through;")}>MP 72.890,00 RSD</div>
            </div>
            <div style={css("background:var(--z-surface);border:1px solid var(--z-line);border-radius:16px;padding:24px;display:flex;align-items:center;gap:18px;")}>
              <div style={css("font:600 12px Inter;color:var(--z-ink-3);")}>PROMO HEX</div>
              <PromoHex label="−10%" h={62} />
              <div style={css("font:600 12px Inter;color:var(--z-ink-3);")}>CHIP</div>
              <span style={css("border:1px solid var(--z-brand);background:var(--z-brand-050);color:var(--z-brand);font:600 12px Inter;padding:7px 13px;border-radius:999px;")}>Filter</span>
            </div>
            <div style={css("background:var(--z-surface);border:1px solid var(--z-line);border-radius:16px;padding:24px;display:flex;align-items:center;gap:18px;flex-wrap:wrap;")}>
              <div style={css("font:600 12px Inter;color:var(--z-ink-3);")}>RATING</div>
              <div style={css("color:var(--z-gold);font-size:18px;")}>★★★★★ <span style={css("color:var(--z-ink);font:600 13px Inter;")}>4.8</span></div>
              <div style={css("font:600 12px Inter;color:var(--z-ink-3);")}>STEPPER</div>
              <div style={css("display:flex;align-items:center;border:1.5px solid var(--z-line);border-radius:10px;")}><span style={css("width:34px;height:34px;display:flex;align-items:center;justify-content:center;font:600 16px Inter;color:var(--z-brand-strong);")}>−</span><span style={css("width:34px;text-align:center;font:700 14px Inter;")}>1</span><span style={css("width:34px;height:34px;display:flex;align-items:center;justify-content:center;font:600 16px Inter;color:var(--z-brand-strong);")}>+</span></div>
            </div>
          </div>
        </main>
      )}

      {/* FOOTER */}
      <footer className="z-shell" style={{ ...css("background:var(--z-deep);color:#fff;padding:48px 24px 28px;"), display: scr === "search" ? "none" : "block" }}>
        <div style={css("max-width:1280px;margin:0 auto;position:relative;")}>
          <button onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })} aria-label="Nazad na vrh" style={css("position:absolute;top:-76px;right:0;border:none;background:none;padding:0;cursor:pointer;")}>
            <img src="/arrow-up.svg" alt="Nazad na vrh" style={css("width:56px;height:56px;display:block;")} />
          </button>
          <div className="z-footer-grid" style={css("display:grid;grid-template-columns:1.5fr 1fr 1fr 1fr;gap:32px;margin-bottom:36px;")}>
            <div>
              <div style={css("margin-bottom:16px;")}><img src="/zeus-logo-white.svg" alt="ZEUS by Zepter" style={css("height:52px;width:auto;display:block;")} /></div>
              <p style={css("font:400 13px Inter;opacity:.6;line-height:1.6;margin:0;max-width:260px;")}>Luksuzni members-club i globalni marketplace. Privilegovane cene za sve članove BizzClub strukture.</p>
            </div>
            <div><div style={css("font:700 13px Inter;margin-bottom:14px;")}>Kupovina</div><div style={css("display:flex;flex-direction:column;gap:9px;font:400 13px Inter;opacity:.6;")}><span>Marketplace</span><span>Outlet aukcije</span><span>BizzClub</span><span>Brendovi</span></div></div>
            <div><div style={css("font:700 13px Inter;margin-bottom:14px;")}>Podrška</div><div style={css("display:flex;flex-direction:column;gap:9px;font:400 13px Inter;opacity:.6;")}><span>Dostava i isporuka</span><span>Reklamacije</span><span>Česta pitanja</span><span>Kontakt</span></div></div>
            <div><div style={css("font:700 13px Inter;margin-bottom:14px;")}>Nalog</div><div style={css("display:flex;flex-direction:column;gap:9px;font:400 13px Inter;opacity:.6;")}><span>Moje porudžbine</span><span>Lista želja</span><span>Affiliate link</span><span>Rang i status</span></div></div>
          </div>
          <div style={css("border-top:1px solid rgba(255,255,255,0.1);padding-top:20px;display:flex;justify-content:space-between;font:400 12px Inter;opacity:.5;flex-wrap:wrap;gap:8px;")}><span>© 2026 ZEUS · Zepter International</span><span>Cene u RSD · affiliate prepoznaje tržište kupca</span></div>
        </div>
      </footer>
    </div>
  );
}
