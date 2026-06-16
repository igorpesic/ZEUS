import { useMemo, useState } from "react";

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
];
const SCREENMETA = [
  { id: "home", label: "Početna" }, { id: "plp", label: "Katalog" }, { id: "pdp", label: "Proizvod" },
  { id: "cart", label: "Korpa" }, { id: "checkout", label: "Plaćanje" }, { id: "outlet", label: "Outlet" },
  { id: "bizz", label: "BizzClub" }, { id: "ds", label: "Dizajn sistem" },
];
const CATEGORIES = ["Računari i laptopovi", "Posuđe", "Ručni satovi", "Nameštaj", "Mašine za pranje sudova", "Prečišćivači vazduha", "Televizori"];
const byId = (id) => PRODUCTS.find((p) => p.id === id);

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
    outletFilter: "all",
  });
  const patch = (p) => setState((s) => ({ ...s, ...(typeof p === "function" ? p(s) : p) }));

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
      heartFill: w[p.id] ? "#0E4DA4" : "none",
      heartStroke: w[p.id] ? "#0E4DA4" : "#15202B",
      open: () => openPDP(p.id),
      add: () => addToCart(p.id, 1),
      wish: () => toggleWish(p.id),
    };
  };

  // ── derived values (mirrors the design's renderVals) ──
  const ri = state.rankIdx, ci = state.curIdx;
  const rank = RANKS[ri], cur = CURR[ci], scr = state.screen;

  const screens = SCREENMETA.map((s) => ({
    label: s.label,
    bg: s.id === scr ? "#F5B72E" : "rgba(255,255,255,0.08)",
    fg: s.id === scr ? "#13315C" : "rgba(255,255,255,0.75)",
    go: () => setScreen(s.id),
  }));
  const ranks = RANKS.map((r, i) => ({
    name: r.name,
    discTag: r.disc > 0 ? "−" + r.disc + "%" : "",
    pbg: i === ri ? "#F5B72E" : "rgba(255,255,255,0.06)",
    pfg: i === ri ? "#13315C" : "rgba(255,255,255,0.8)",
    pborder: i === ri ? "#F5B72E" : "rgba(255,255,255,0.15)",
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
    rowBg: i === ri ? "#F4F8FE" : "#fff",
    nameColor: i === ri ? "#0E4DA4" : "#15202B",
    priceColor: i === ri ? "#1769C0" : "#15202B",
  }));
  const pdpThumbs = [0, 1, 2, 3].map((i) => ({ border: i === 0 ? "#0E4DA4" : "rgba(0,0,0,0.1)" }));
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
    rows: a.rows.map((r, i) => ({ ...r, bg: i % 2 ? "#F7F9FC" : "#fff" })),
  }));
  const similar = PRODUCTS.filter((p) => p.cat === pdpP.cat && p.id !== pdpP.id)
    .concat(PRODUCTS.filter((p) => p.cat !== pdpP.cat)).slice(0, 4)
    .map((p) => {
      const d = dispProduct(p);
      return { ...d, mainStr: rank.disc > 0 ? d.rankStr : d.mpStr, priceColor: rank.disc > 0 ? "#1769C0" : "#15202B" };
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
  const catChips = ["Sve"].concat(CATEGORIES).map((c, i) => ({
    name: c,
    bg: i === 0 ? "#EAF2FC" : "#fff",
    fg: i === 0 ? "#0E4DA4" : "#15202B",
    border: i === 0 ? "#0E4DA4" : "rgba(0,0,0,0.08)",
  }));
  const rankCards = RANKS.map((r) => ({
    name: r.name, discBig: "−" + r.disc + "%",
    maxTag: r.disc === 40,
    border: r.disc === 40 ? "#F5B72E" : "rgba(0,0,0,0.08)",
  }));
  const benefits = [
    { icon: "🏷️", title: "Do −40% popusta", desc: "Trajne privilegovane cene na sve proizvode i brendove." },
    { icon: "🚚", title: "Besplatna dostava", desc: "Brza i pouzdana isporuka na vašu adresu." },
    { icon: "🌍", title: "Globalni affiliate", desc: "Vaš link prepoznaje tržište kupca i njegovu valutu." },
    { icon: "🎁", title: "Pokloni i akcije", desc: "Ekskluzivne promocije i poklon opcije za članove." },
  ];
  const filtersMeta = [{ id: "all", label: "Sve" }, { id: "stock", label: "Na stanju" }, { id: "limited", label: "Ograničena ponuda" }];
  const outletFilters = filtersMeta.map((f) => ({
    label: f.label,
    bg: state.outletFilter === f.id ? "#13315C" : "#fff",
    fg: state.outletFilter === f.id ? "#fff" : "#15202B",
    border: state.outletFilter === f.id ? "#13315C" : "rgba(0,0,0,0.1)",
    pick: () => patch({ outletFilter: f.id }),
  }));
  const auctionData = [
    { id: "bulova", name: "Bulova 98A227 Marine Star", cat: "Ručni satovi", img: "assets/products/bulova.png", bid: 48900, buy: 72890, condition: "Kao nov", timeLeft: "02:14:38", savePct: "−33%" },
    { id: "bosch", name: "Bosch WAT2846SIN Series 6", cat: "Veš mašine", img: "assets/products/bosch-masina.png", bid: 79900, buy: 119990, condition: "Polovan A", timeLeft: "05:41:02", savePct: "−33%" },
    { id: "myionz", name: "Nosivi sterilizator MyionZ PRO", cat: "Prečišćivači vazduha", img: "assets/products/myionz.png", bid: 13900, buy: 21830, condition: "Otpakovano", timeLeft: "00:48:11", savePct: "−36%" },
  ];
  const auctions = auctionData.map((a) => ({
    name: a.name, cat: a.cat, timeLeft: a.timeLeft, condition: a.condition,
    hasImg: !!a.img, noImg: !a.img, img: A(a.img), ph: a.cat, savePct: a.savePct,
    bidStr: fmt(a.bid), buyStr: fmt(rankPrice(a.buy)), condBg: "#E7F4EC", condFg: "#1F8A5B",
  }));
  const swatches = [
    { name: "Brand plava", hex: "#0E4DA4" }, { name: "Navy (CTA)", hex: "#13315C" },
    { name: "Amber", hex: "#F5B72E" }, { name: "BizzClub plava", hex: "#1769C0" },
    { name: "Sky", hex: "#EAF2FC" }, { name: "Sky 2", hex: "#D3E6FA" },
    { name: "Ink", hex: "#15202B" }, { name: "Pozadina", hex: "#FBFCFE" },
  ];

  const featured = ["bioptron", "hyper", "myionz"].map((id) => dispProduct(byId(id)));
  const promoProducts = ["aqeena", "edel"].map((id) => dispProduct(byId(id)));
  const allProducts = PRODUCTS.map((p) => dispProduct(p));
  const wishCount = Object.values(state.wishlist).filter(Boolean).length;
  const cartCount = state.cart.reduce((a, c) => a + c.qty, 0);

  const goHome = () => setScreen("home");
  const goPlp = () => setScreen("plp");
  const goCart = () => setScreen("cart");
  const goCheckout = () => setScreen("checkout");
  const goBizz = () => setScreen("bizz");
  const goOutlet = () => setScreen("outlet");
  const goSearch = () => setScreen("plp");
  const goWish = () => setScreen("plp");

  const heart = (fill, stroke, w = 22) => (
    <svg width={w} height={w} viewBox="0 0 24 24" fill={fill} stroke={stroke} strokeWidth="1.8">
      <path d="M20.8 4.6a5.5 5.5 0 00-7.8 0L12 5.6l-1-1a5.5 5.5 0 10-7.8 7.8l1 1L12 21l7.8-7.6 1-1a5.5 5.5 0 000-7.8z" />
    </svg>
  );

  // Promo discount badge — outlined gold hexagon (Sale.svg) with the % inside.
  const PromoHex = ({ label, h = 39 }) => {
    const w = (h * 30) / 35;
    return (
      <span style={{ position: "relative", display: "inline-flex", width: w + "px", height: h + "px", alignItems: "center", justifyContent: "center", flex: "none" }}>
        <svg width={w} height={h} viewBox="0 0 30 35" fill="none" style={{ position: "absolute", inset: 0 }}>
          <path d="M29.2129 25.4438L28.9629 25.5874L15.1064 33.5874L14.8564 33.7319L14.6064 33.5874L0.75 25.5874L0.5 25.4438V8.86572L0.75 8.72217L14.6064 0.722168L14.8564 0.577637L15.1064 0.722168L28.9629 8.72217L29.2129 8.86572V25.4438Z" stroke="#A98742" />
        </svg>
        <span style={{ position: "relative", fontFamily: "Inter", fontWeight: 700, fontSize: Math.round(h * 0.26) + "px", color: "#A98742", letterSpacing: "-0.02em" }}>{label}</span>
      </span>
    );
  };

  // ── Reusable product card (Home featured/promo share this) ──
  const ProductCard = ({ p }) => (
    <div className="z-card-sm" style={css("background:#fff;border:1px solid rgba(0,0,0,0.06);border-radius:12px;overflow:hidden;display:flex;flex-direction:column;")}>
      <div style={css("position:relative;padding:16px;")}>
        <button onClick={p.wish} style={css("position:absolute;top:14px;left:14px;z-index:3;border:none;background:none;cursor:pointer;padding:0;")}>
          {heart(p.heartFill, p.heartStroke)}
        </button>
        {p.promoOn && (
          <span style={css("position:absolute;top:12px;right:14px;z-index:3;")}><PromoHex label={"−" + p.promo + "%"} h={39} /></span>
        )}
        <button onClick={p.open} style={css("border:none;background:none;cursor:pointer;width:100%;padding:0;")}>
          <div style={css("height:175px;display:flex;align-items:center;justify-content:center;")}>
            {p.hasImg
              ? <img src={p.img} alt={p.name} style={css("max-height:175px;max-width:100%;object-fit:contain;")} />
              : <div style={css("width:100%;height:175px;border-radius:10px;background:repeating-linear-gradient(135deg,#EEF2F7,#EEF2F7 9px,#F6F8FB 9px,#F6F8FB 18px);display:flex;align-items:center;justify-content:center;")}><span style={css("font:600 11px ui-monospace,monospace;color:#9aa6b4;")}>{p.ph}</span></div>}
          </div>
        </button>
      </div>
      <div style={css("padding:12px 16px 16px;display:flex;flex-direction:column;flex:1;border-top:1px solid rgba(0,0,0,0.05);")}>
        <div style={css("font:500 11px Inter;color:#82868C;margin-bottom:3px;")}>{p.cat}</div>
        <div style={css("font:500 10px Inter;color:#A6AAB0;margin-bottom:6px;")}>SKU: {p.sku}</div>
        <button onClick={p.open} className="z-link" style={css("border:none;background:none;text-align:left;padding:0;cursor:pointer;font:600 15px Inter;color:#15202B;line-height:1.3;margin-bottom:14px;min-height:40px;")}>{p.name}</button>
        <div style={css("margin-top:auto;")}>
          {p.showRank && (<>
            <div style={css("display:flex;align-items:baseline;justify-content:space-between;margin-bottom:4px;")}><span style={css("font:500 13px Inter;color:#5B6573;")}>Vaša cena</span><span style={css("font:800 17px Inter;color:#1769C0;")}>{p.rankStr}</span></div>
            <div style={css("display:flex;align-items:center;justify-content:space-between;margin-bottom:14px;")}><span style={css("background:#EAF2FC;color:#0E4DA4;font:700 11px Inter;padding:2px 7px;border-radius:6px;")}>{p.discLabel}</span><span style={css("font:500 12px Inter;color:#A6AAB0;text-decoration:line-through;")}>MP {p.mpStr}</span></div>
          </>)}
          {p.showGuest && (<>
            <div style={css("display:flex;align-items:baseline;justify-content:space-between;margin-bottom:8px;")}><span style={css("font:500 13px Inter;color:#5B6573;")}>MP Cena</span><span style={css("font:700 16px Inter;color:#15202B;")}>{p.mpStr}</span></div>
            <div style={css("display:flex;align-items:center;justify-content:space-between;gap:6px;margin-bottom:14px;")}><span style={css("font:700 12px Inter;color:#1769C0;")}>BizzClub ⓘ</span><span style={css("font:500 11px Inter;color:#82868C;text-align:right;")}>Učlanite se i kupite do -40%</span></div>
          </>)}
          <button onClick={p.add} className="z-cta" style={css("width:100%;background:#13315C;color:#fff;border:none;border-radius:8px;padding:11px;font:600 13.5px Inter;cursor:pointer;")}>Dodajte u korpu</button>
        </div>
      </div>
    </div>
  );

  // ── Render ───────────────────────────────────────────────────────────────
  return (
    <div style={css("font-family:Inter,system-ui,sans-serif;background:#FBFCFE;color:#15202B;min-height:100vh;-webkit-font-smoothing:antialiased;letter-spacing:-0.01em;")}>

      {/* SITE HEADER */}
      <header style={css("background:#fff;border-bottom:1px solid rgba(0,0,0,0.06);position:relative;z-index:60;")}>
        <div className="z-hd" style={css("max-width:1232px;margin:0 auto;padding:18px 24px;display:flex;align-items:center;gap:24px;")}>
          <button onClick={goHome} style={css("border:none;background:none;cursor:pointer;padding:0;display:flex;align-items:center;flex:none;")}>
            <img src="/zeus-logo.svg" alt="ZEUS by Zepter" style={css("height:48px;width:auto;display:block;")} />
          </button>
          <button className="z-op z-hd-loc" style={css("border:none;background:none;cursor:pointer;display:flex;align-items:center;gap:7px;flex:none;padding:0;")}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#0E4DA4" strokeWidth="2"><path d="M12 21s-7-5.5-7-11a7 7 0 0114 0c0 5.5-7 11-7 11z" /><circle cx="12" cy="10" r="2.5" /></svg>
            <span style={css("font:600 14px Inter;color:#15202B;")}>{cur.loc}</span>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#5B6573" strokeWidth="2"><path d="M6 9l6 6 6-6" /></svg>
          </button>
          <div className="z-hd-search" style={css("flex:1;display:flex;align-items:center;max-width:520px;border:1.5px solid rgba(0,0,0,0.08);border-radius:14px;overflow:hidden;background:#FBFCFE;")}>
            <input placeholder="Pretražite sve na Zepteru online i u prodavnici" style={css("flex:1;border:none;background:none;outline:none;padding:13px 16px;font:500 14px Inter;color:#15202B;")} />
            <button onClick={goSearch} className="z-amber" style={css("border:none;cursor:pointer;background:#F5B72E;color:#13315C;font:700 14px Inter;padding:13px 22px;display:flex;align-items:center;gap:8px;")}>
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#13315C" strokeWidth="2.2" strokeLinecap="round"><circle cx="11" cy="11" r="7" /><path d="M21 21l-4.3-4.3" /></svg>
              Pretraga
            </button>
          </div>
          <div className="z-hd-acct" style={css("display:flex;align-items:center;gap:20px;flex:none;")}>
            <button onClick={goWish} className="z-op" style={css("position:relative;border:none;background:none;cursor:pointer;display:flex;align-items:center;gap:9px;padding:0;")}>
              {heart("none", "#15202B")}
              <span className="z-hd-txt" style={css("text-align:left;font:400 12px Inter;color:#5B6573;line-height:1.25;")}>Vaša<br /><b style={css("font-weight:600;color:#15202B;")}>lista želja</b></span>
              <span style={css("position:absolute;top:-6px;left:14px;background:#0E4DA4;color:#fff;font:700 9px Inter;min-width:16px;height:16px;border-radius:8px;display:flex;align-items:center;justify-content:center;padding:0 4px;")}>{wishCount}</span>
            </button>
            <button className="z-op z-hd-account" style={css("border:none;background:none;cursor:pointer;display:flex;align-items:center;gap:9px;padding:0;")}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#15202B" strokeWidth="1.8"><circle cx="12" cy="8" r="4" /><path d="M4 21c0-4.4 3.6-8 8-8s8 3.6 8 8" /></svg>
              <span style={css("text-align:left;font:400 12px Inter;color:#5B6573;line-height:1.25;")}>Prijavite se na<br /><b style={css("font-weight:600;color:#15202B;")}>moj nalog</b></span>
            </button>
            <button onClick={goCart} className="z-op" style={css("position:relative;border:none;background:none;cursor:pointer;display:flex;align-items:center;gap:9px;padding:0;")}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#15202B" strokeWidth="1.8" strokeLinecap="round"><path d="M3 4h2l2.4 12.4a1 1 0 001 .8h9.2a1 1 0 001-.8L21 8H6" /><circle cx="9" cy="20" r="1.3" /><circle cx="18" cy="20" r="1.3" /></svg>
              <span className="z-hd-txt" style={css("font:600 13px Inter;color:#15202B;")}>{fmt(rankTotal)}</span>
              <span style={css("position:absolute;top:-6px;left:16px;background:#F5B72E;color:#13315C;font:700 9px Inter;min-width:16px;height:16px;border-radius:8px;display:flex;align-items:center;justify-content:center;padding:0 4px;")}>{cartCount}</span>
            </button>
          </div>
        </div>

        {/* CATEGORY NAV */}
        <div style={css("background:#fff;border-top:1px solid rgba(0,0,0,0.05);box-shadow:0 1px 4px rgba(0,0,0,0.04);")}>
          <div className="z-hd-nav" style={css("max-width:1232px;margin:0 auto;padding:8px 24px;display:flex;align-items:center;gap:18px;")}>
            <button onClick={goPlp} className="z-allcat" style={css("display:flex;align-items:center;gap:10px;border:none;background:#002D62;color:#fff;font:600 13.5px Inter;padding:10px 18px;border-radius:6px;cursor:pointer;flex:none;")}>
              <span className="z-allcat-txt">Sve kategorije</span>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2"><rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" /><rect x="3" y="14" width="7" height="7" rx="1" /><rect x="14" y="14" width="7" height="7" rx="1" /></svg>
            </button>
            <div className="z-hd-links" style={css("flex:1;display:flex;align-items:center;justify-content:flex-end;gap:6px;flex-wrap:wrap;")}>
              <button onClick={goHome} className="z-link" style={css("border:none;background:none;color:#15202B;font:600 14px Inter;padding:8px 14px;cursor:pointer;")}>Početna</button>
              <button onClick={goPlp} className="z-link" style={css("border:none;background:none;color:#15202B;font:500 14px Inter;padding:8px 14px;cursor:pointer;")}>Promocije</button>
              <button onClick={goPlp} className="z-link" style={css("border:none;background:none;color:#15202B;font:500 14px Inter;padding:8px 14px;cursor:pointer;")}>Zepter Svet</button>
              <button onClick={goOutlet} className="z-link" style={css("border:none;background:none;color:#15202B;font:500 14px Inter;padding:8px 14px;cursor:pointer;")}>Outlet</button>
              <button onClick={goPlp} className="z-link" style={css("border:none;background:none;color:#15202B;font:500 14px Inter;padding:8px 14px;cursor:pointer;")}>Marketplace</button>
              <button onClick={goBizz} className="z-link" style={css("border:none;background:none;color:#1769C0;font:600 14px Inter;padding:8px 14px;cursor:pointer;")}>BizzClub</button>
            </div>
          </div>
        </div>
      </header>

      {/* ============ HOME ============ */}
      {scr === "home" && (<>
        <main className="z-shell" style={css("max-width:1232px;margin:0 auto;padding:24px 24px 0;")}>
          {/* HERO MOSAIC */}
          <div className="z-hero" style={css("display:grid;grid-template-columns:288px 1fr 288px;gap:16px;height:780px;margin-bottom:40px;")}>
            {/* LEFT */}
            <div style={css("display:flex;flex-direction:column;gap:16px;")}>
              <div style={css("height:200px;border-radius:8px;position:relative;overflow:hidden;flex:none;")}>
                <img src={A("assets/znew/vacsy.jpg")} alt="VacSy" style={css("position:absolute;inset:0;width:100%;height:100%;object-fit:cover;")} />
                <div style={{ ...css("position:absolute;top:16px;right:16px;text-align:right;font:700 13px Inter;color:#15202B;line-height:1.25;"), whiteSpace: "pre-line" }}>{"VacSy\nČuvar tvoje\nhrane!"}</div>
                <button onClick={goPlp} style={css("position:absolute;bottom:16px;right:16px;background:#fff;border:none;border-radius:4px;padding:6px 16px;font:600 13px Inter;color:#002D62;cursor:pointer;box-shadow:0 2px 5px rgba(0,0,0,0.2);")}>Kupite odmah</button>
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
                <button onClick={goPlp} style={css("position:absolute;bottom:16px;left:16px;background:#fff;border:none;border-radius:4px;padding:6px 16px;font:600 13px Inter;color:#002D62;cursor:pointer;box-shadow:0 2px 5px rgba(0,0,0,0.2);")}>Kupite odmah</button>
              </div>
            </div>
            {/* CENTER */}
            <div style={css("display:flex;flex-direction:column;gap:16px;")}>
              <div className="z-hero-video" style={css("height:325px;border-radius:8px;position:relative;overflow:hidden;background:#0c0e10;display:flex;align-items:center;flex:none;")}>
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
                  <button onClick={goPlp} style={css("position:absolute;bottom:16px;left:16px;background:#fff;border:none;border-radius:4px;padding:6px 16px;font:600 13px Inter;color:#002D62;cursor:pointer;box-shadow:0 2px 5px rgba(0,0,0,0.2);")}>Kupite odmah</button>
                </div>
                <div style={css("border-radius:8px;position:relative;overflow:hidden;")}>
                  <img src={A("assets/znew/pink-lepota.jpg")} alt="Prirodna lepota" style={css("position:absolute;inset:0;width:100%;height:100%;object-fit:cover;")} />
                  <button onClick={goPlp} style={css("position:absolute;bottom:16px;right:16px;background:#fff;border:none;border-radius:4px;padding:6px 16px;font:600 13px Inter;color:#002D62;cursor:pointer;box-shadow:0 2px 5px rgba(0,0,0,0.2);")}>Kupite odmah</button>
                </div>
              </div>
              <div className="z-hero-bizz" style={css("height:130px;border-radius:8px;background:#EEFAFF;position:relative;overflow:hidden;padding:16px 20px;flex:none;display:flex;")}>
                <svg viewBox="0 0 624 130" preserveAspectRatio="xMaxYMid slice" style={css("position:absolute;inset:0;width:100%;height:100%;")} xmlns="http://www.w3.org/2000/svg">
                  <path opacity="0.6" d="M288 99.7794L624.476 18.8347L624.476 180.724L288 99.7794Z" fill="#0273BC" fillOpacity="0.5"/>
                  <path opacity="0.6" d="M367.358 10.899L624.476 -50.9999L624.476 72.7979L367.358 10.899Z" fill="#0071BD" fillOpacity="0.25"/>
                  <path opacity="0.6" d="M449.889 61.6879L624.476 18.8349L624.476 104.541L449.889 61.6879Z" fill="#0071BD" fillOpacity="0.75"/>
                </svg>
                <div className="z-hero-bizz-txt" style={css("position:relative;z-index:2;max-width:70%;display:flex;flex-direction:column;justify-content:space-between;")}>
                  <p style={css("font:300 20px Poppins,Inter;color:#002D62;margin:0;line-height:1.15;")}>Postanite <b style={css("font-weight:700;")}>ZEUS BizzClub</b> partner i ostvarite trajno višestruke pogodnosti!</p>
                  <div style={css("display:flex;align-items:center;gap:18px;")}>
                    <button onClick={goBizz} style={css("background:#fff;border:none;border-radius:4px;padding:7px 18px;font:600 14px Inter;color:#002D62;cursor:pointer;box-shadow:0 2px 5px rgba(0,0,0,0.18);")}>Želim da se učlanim</button>
                    <button onClick={goBizz} style={css("background:none;border:none;color:#002D62;font:600 14px Inter;cursor:pointer;text-decoration:underline;text-underline-offset:3px;")}>Saznajte više →</button>
                  </div>
                </div>
                <img src="/zeus-logo.svg" alt="ZEUS by Zepter" className="z-hero-bizz-logo" style={css("position:absolute;right:28px;top:50%;transform:translateY(-50%);height:66px;width:auto;z-index:2;")} />
              </div>
            </div>
            {/* RIGHT */}
            <div style={css("display:flex;flex-direction:column;gap:16px;")}>
              <div style={css("height:160px;border-radius:8px;position:relative;overflow:hidden;flex:none;")}>
                <img src={A("assets/znew/plates.jpg")} alt="Gurmanski recepti" style={css("position:absolute;inset:0;width:100%;height:100%;object-fit:cover;")} />
                <button onClick={goPlp} style={css("position:absolute;bottom:14px;right:14px;background:#fff;border:none;border-radius:4px;padding:6px 16px;font:600 13px Inter;color:#002D62;cursor:pointer;box-shadow:0 2px 5px rgba(0,0,0,0.2);")}>Kupite odmah</button>
              </div>
              <div style={css("height:200px;border-radius:8px;position:relative;overflow:hidden;flex:none;background:#F4F6F8;")}>
                <img src={A("assets/znew/posude.jpg")} alt="Posuđe" style={css("position:absolute;inset:0;width:100%;height:100%;object-fit:cover;")} />
                <div style={{ ...css("position:absolute;top:16px;left:16px;font:700 13px Inter;color:#15202B;line-height:1.25;"), whiteSpace: "pre-line" }}>{"Jedinstveno\ni superiorno posuđe"}</div>
                <button onClick={goPlp} style={css("position:absolute;bottom:14px;right:14px;background:#fff;border:none;border-radius:4px;padding:6px 16px;font:600 13px Inter;color:#002D62;cursor:pointer;box-shadow:0 2px 5px rgba(0,0,0,0.2);")}>Kupite odmah</button>
              </div>
              <div className="z-hero-tall" style={css("flex:1;border-radius:8px;position:relative;overflow:hidden;")}>
                <img src={A("assets/znew/woman-bag.png")} alt="Luksuz i stil" style={css("position:absolute;inset:0;width:100%;height:100%;object-fit:cover;object-position:center 15%;")} />
                <button onClick={goPlp} style={css("position:absolute;bottom:16px;right:16px;background:#fff;border:none;border-radius:4px;padding:6px 16px;font:600 13px Inter;color:#002D62;cursor:pointer;box-shadow:0 2px 5px rgba(0,0,0,0.2);")}>Kupite odmah</button>
              </div>
            </div>
          </div>

          {/* IZDVAJAMO */}
          <div style={css("display:flex;align-items:center;gap:14px;margin-bottom:18px;")}>
            <h2 style={css("font:700 20px Inter;margin:0;color:#000;")}>Izdvajamo iz ponude</h2>
            <button onClick={goPlp} style={css("background:none;border:none;color:#002D62;font:500 14px Inter;cursor:pointer;text-decoration:underline;text-underline-offset:3px;")}>Pogledajte sve →</button>
          </div>
          <div className="z-grid-4 z-carousel" style={css("display:grid;grid-template-columns:repeat(4,1fr);gap:16px;margin-bottom:48px;")}>
            {featured.map((p) => <ProductCard key={p.id} p={p} />)}
            {/* gold ad tile */}
            <div style={css("border-radius:12px;overflow:hidden;position:relative;background:#000;display:flex;align-items:flex-end;")}>
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
                <h3 style={{ ...css("font:700 32px Inter;margin:0 0 8px;color:#000;line-height:1.1;"), whiteSpace: "pre-line" }}>{"Bioptron\nsvetlosna terapija"}</h3>
                <p style={css("font:400 15px Inter;color:#3d4754;margin:0 0 14px;max-width:230px;")}>Sinergija svetlosti i boja bude vaša čula</p>
                <button onClick={goPlp} style={css("background:none;border:none;color:#002D62;font:600 14px Inter;cursor:pointer;padding:0;text-decoration:underline;text-underline-offset:3px;")}>Saznajte više →</button>
              </div>
            </div>
            <div style={css("display:flex;flex-direction:column;gap:16px;")}>
              <div className="z-cb-half" style={css("flex:1;border-radius:8px;position:relative;overflow:hidden;background:#fff;padding:22px;display:flex;flex-direction:column;")}>
                <img src={A("assets/znew/preciscena-voda.png")} alt="Prečišćena voda" style={css("position:absolute;inset:0;width:100%;height:100%;object-fit:cover;object-position:right center;")} />
                <div style={css("position:relative;z-index:2;")}>
                  <h3 style={css("font:700 20px Inter;margin:0 0 8px;color:#002D62;")}>Prečišćena voda</h3>
                  <p style={css("font:400 14px Inter;color:#3d4754;margin:0 0 12px;max-width:170px;line-height:1.4;")}>Najbolji izvor čiste vode za zdravo telo i zdrav život</p>
                  <button onClick={goPlp} style={css("background:none;border:none;color:#002D62;font:600 13px Inter;cursor:pointer;padding:0;text-decoration:underline;text-underline-offset:3px;")}>Saznajte više →</button>
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
                <h3 style={css("font:700 19px Inter;margin:0 0 6px;color:#15202B;max-width:160px;line-height:1.2;")}>Priprema hrane na zdrav način</h3>
                <button onClick={goPlp} style={css("background:none;border:none;color:#002D62;font:600 13px Inter;cursor:pointer;padding:0;text-decoration:underline;text-underline-offset:3px;")}>Saznajte više →</button>
              </div>
            </div>
          </div>

          {/* KATEGORIJE */}
          <div style={css("border-top:1px solid #EEFAFF;padding-top:24px;")}>
            <div style={css("display:flex;align-items:center;justify-content:space-between;margin-bottom:22px;")}>
              <h2 style={css("font:700 20px Inter;margin:0;color:#000;")}>Kategorije proizvoda</h2>
              <button onClick={goPlp} style={css("background:none;border:none;color:#002D62;font:500 14px Inter;cursor:pointer;text-decoration:underline;text-underline-offset:3px;")}>Pogledajte sve →</button>
            </div>
            <div className="z-cats" style={css("display:grid;grid-template-columns:repeat(8,1fr);gap:12px;margin-bottom:40px;")}>
              {catCircles.map((c, i) => (
                <button key={i} onClick={c.go} style={css("border:none;background:none;cursor:pointer;display:flex;flex-direction:column;align-items:center;gap:12px;padding:4px;")}>
                  <div className="z-scale z-cat-circle" style={css("width:104px;height:104px;border-radius:50%;background:#D7ECFB;display:flex;align-items:center;justify-content:center;overflow:hidden;")}>
                    {c.hasImg
                      ? <img src={c.img} alt={c.name} style={{ ...css("object-fit:contain;"), width: c.size + "px", height: c.size + "px" }} />
                      : <div style={css("width:56px;height:56px;border-radius:50%;background:repeating-linear-gradient(135deg,#bcd9f2,#bcd9f2 7px,#cfe5f7 7px,#cfe5f7 14px);")} />}
                  </div>
                  <span style={{ ...css("font:500 12.5px Inter;color:#15202B;text-align:center;line-height:1.3;"), whiteSpace: "pre-line" }}>{c.name}</span>
                </button>
              ))}
            </div>
          </div>

          {/* BIZZCLUB STRIP */}
          <div style={css("background:#EAF6FF;border-radius:8px;padding:14px 28px;display:flex;align-items:center;justify-content:center;gap:28px;margin-bottom:48px;flex-wrap:wrap;")}>
            <span style={css("font:300 20px Poppins,Inter;color:#002D62;")}>Učlanite se u <b style={css("font-weight:600;")}>ZEUS BizzClub</b> i već danas možete da ostvarite privilegovanu cenu</span>
            <button onClick={goBizz} className="z-white" style={css("background:none;border:1.5px solid #002D62;border-radius:4px;padding:8px 18px;font:600 14px Inter;color:#002D62;cursor:pointer;flex:none;")}>Želim da se učlanim</button>
          </div>

          {/* PROMOCIJE */}
          <div style={css("display:flex;align-items:center;justify-content:space-between;margin-bottom:18px;")}>
            <h2 style={css("font:700 20px Inter;margin:0;color:#000;")}>Promocije</h2>
            <button onClick={goPlp} style={css("background:none;border:none;color:#002D62;font:500 14px Inter;cursor:pointer;text-decoration:underline;text-underline-offset:3px;")}>Pogledajte sve →</button>
          </div>
          <div className="z-promo-grid z-carousel" style={css("display:grid;grid-template-columns:2fr 1fr 1fr;gap:16px;")}>
            <div style={css("border-radius:8px;overflow:hidden;position:relative;")}>
              <img src={A("assets/znew/promo-voda.png")} alt="Čista i zdrava voda" style={css("display:block;width:100%;height:100%;object-fit:cover;")} />
            </div>
            {promoProducts.map((p) => <ProductCard key={p.id} p={p} />)}
          </div>
        </main>

        {/* NEWSLETTER */}
        <div style={css("background:#EAF6FF;padding:36px 24px;margin-top:48px;")}>
          <div style={css("max-width:760px;margin:0 auto;text-align:center;")}>
            <h3 style={css("font:500 24px Inter;color:#002D62;margin:0 0 6px;")}>Prijavite se na našu mailing listu!</h3>
            <p style={css("font:400 14px Inter;color:#5B6573;margin:0 0 18px;")}>Svake nedelje dobijaćete konkretne predloge i uputstva kako da unapredite svoj život.</p>
            <button className="z-sky" style={css("background:#fff;border:1.5px solid #002D62;border-radius:4px;padding:10px 26px;font:600 14px Inter;color:#002D62;cursor:pointer;")}>Prijavite se</button>
          </div>
        </div>
      </>)}

      {/* ============ KATALOG / PLP ============ */}
      {scr === "plp" && (
        <main className="z-shell" style={css("max-width:1280px;margin:0 auto;padding:22px 24px 80px;")}>
          <div style={css("font:500 12.5px Inter;color:#5B6573;margin-bottom:18px;")}>Početna&nbsp;&nbsp;/&nbsp;&nbsp;Marketplace&nbsp;&nbsp;/&nbsp;&nbsp;<span style={css("color:#15202B;font-weight:600;")}>Svi proizvodi</span></div>
          <div style={css("display:flex;gap:10px;overflow-x:auto;padding-bottom:8px;margin-bottom:22px;")}>
            {catChips.map((c, i) => (
              <button key={i} style={{ ...css("display:flex;align-items:center;gap:10px;flex:none;border-radius:14px;padding:8px 14px 8px 8px;cursor:pointer;font:600 12.5px Inter;"), border: "1px solid " + c.border, background: c.bg, color: c.fg }}>
                <span style={css("width:34px;height:34px;border-radius:50%;background:#EAF2FC;display:block;")} />{c.name}
              </button>
            ))}
          </div>
          <div style={css("display:flex;align-items:center;justify-content:space-between;margin-bottom:20px;flex-wrap:wrap;gap:12px;")}>
            <h1 className="z-h1" style={css("font:800 28px Inter;margin:0;color:#15202B;")}>Svi proizvodi <span style={css("font:500 16px Inter;color:#94a0ae;")}>({PRODUCTS.length})</span></h1>
            <div style={css("display:flex;align-items:center;gap:10px;")}>
              <span style={css("font:500 13px Inter;color:#5B6573;")}>Sortiraj:</span>
              <select style={css("border:1px solid rgba(0,0,0,0.1);background:#fff;border-radius:10px;padding:9px 12px;font:600 13px Inter;color:#15202B;cursor:pointer;")}><option>Popularnost</option><option>Cena: rastuće</option><option>Cena: opadajuće</option><option>Novo</option></select>
            </div>
          </div>
          <div className="z-grid-4 z-carousel" style={css("display:grid;grid-template-columns:repeat(4,1fr);gap:18px;")}>
            {allProducts.map((p) => (
              <div key={p.id} className="z-card" style={css("background:#fff;border:1px solid rgba(0,0,0,0.06);border-radius:18px;overflow:hidden;display:flex;flex-direction:column;")}>
                <div style={css("position:relative;padding:18px;")}>
                  <div style={css("position:absolute;top:14px;left:14px;display:flex;flex-direction:column;gap:6px;z-index:3;")}>
                    {p.badge && <span style={css("background:#fff;border:1px solid rgba(0,0,0,0.08);color:#13315C;font:600 10.5px Inter;padding:4px 9px;border-radius:8px;box-shadow:0 2px 8px rgba(0,0,0,0.05);")}>{p.badge}</span>}
                    {p.promoOn && <PromoHex label={"−" + p.promo + "%"} h={52} />}
                  </div>
                  <button onClick={p.wish} style={css("position:absolute;top:14px;right:14px;z-index:3;border:none;background:rgba(255,255,255,0.9);border-radius:50%;width:34px;height:34px;display:flex;align-items:center;justify-content:center;cursor:pointer;box-shadow:0 2px 8px rgba(0,0,0,0.08);")}>
                    <svg width="17" height="17" viewBox="0 0 24 24" fill={p.heartFill} stroke={p.heartStroke} strokeWidth="2"><path d="M20.8 4.6a5.5 5.5 0 00-7.8 0L12 5.6l-1-1a5.5 5.5 0 10-7.8 7.8l1 1L12 21l7.8-7.6 1-1a5.5 5.5 0 000-7.8z" /></svg>
                  </button>
                  <button onClick={p.open} style={css("border:none;background:none;cursor:pointer;width:100%;padding:0;")}>
                    <div style={css("height:170px;display:flex;align-items:center;justify-content:center;")}>
                      {p.hasImg
                        ? <img src={p.img} alt={p.name} style={css("max-height:170px;max-width:100%;object-fit:contain;")} />
                        : <div style={css("width:100%;height:170px;border-radius:12px;background:repeating-linear-gradient(135deg,#EEF2F7,#EEF2F7 9px,#F6F8FB 9px,#F6F8FB 18px);display:flex;align-items:center;justify-content:center;")}><span style={css("font:600 11px ui-monospace,monospace;color:#9aa6b4;")}>{p.ph}</span></div>}
                    </div>
                  </button>
                </div>
                <div style={css("padding:0 18px 18px;display:flex;flex-direction:column;flex:1;")}>
                  <div style={css("font:600 11px Inter;color:#0E4DA4;margin-bottom:5px;")}>{p.cat}</div>
                  <button onClick={p.open} className="z-link" style={css("border:none;background:none;text-align:left;padding:0;cursor:pointer;font:600 14px Inter;color:#15202B;line-height:1.3;margin-bottom:5px;min-height:36px;")}>{p.name}</button>
                  <div style={css("font:500 11px Inter;color:#94a0ae;margin-bottom:12px;")}>SKU: {p.sku}</div>
                  <div style={css("margin-top:auto;")}>
                    {p.showRank && (<>
                      <div style={css("display:flex;align-items:baseline;gap:8px;margin-bottom:2px;")}><span style={css("font:800 19px Inter;color:#1769C0;")}>{p.rankStr}</span><span style={css("background:#EAF2FC;color:#0E4DA4;font:700 11px Inter;padding:2px 7px;border-radius:6px;")}>{p.discLabel}</span></div>
                      <div style={css("font:500 12px Inter;color:#94a0ae;text-decoration:line-through;margin-bottom:12px;")}>MP {p.mpStr}</div>
                    </>)}
                    {p.showGuest && (<>
                      <div style={css("font:500 11px Inter;color:#5B6573;margin-bottom:1px;")}>MP Cena</div>
                      <div style={css("font:800 19px Inter;color:#15202B;margin-bottom:7px;")}>{p.mpStr}</div>
                      <div style={css("display:flex;align-items:center;gap:6px;background:#EAF2FC;border-radius:8px;padding:7px 9px;margin-bottom:12px;")}><span style={css("font:700 11px Inter;color:#1769C0;")}>BizzClub</span><span style={css("font:500 11px Inter;color:#13315C;")}>do −40%</span></div>
                    </>)}
                    <button onClick={p.add} className="z-cta" style={css("width:100%;background:#13315C;color:#fff;border:none;border-radius:11px;padding:12px;font:600 13.5px Inter;cursor:pointer;")}>Dodajte u korpu</button>
                  </div>
                </div>
              </div>
            ))}
          </div>
          <div style={css("display:flex;justify-content:center;margin-top:36px;")}>
            <button className="z-sec" style={css("border:1.5px solid #0E4DA4;background:#fff;color:#0E4DA4;border-radius:12px;padding:13px 30px;font:600 14px Inter;cursor:pointer;")}>Prikaži još proizvoda</button>
          </div>
        </main>
      )}

      {/* ============ PDP ============ */}
      {scr === "pdp" && (
        <main className="z-shell" style={css("max-width:1280px;margin:0 auto;padding:22px 24px 80px;")}>
          <div style={css("font:500 12.5px Inter;color:#5B6573;margin-bottom:22px;")}>Početna&nbsp;&nbsp;/&nbsp;&nbsp;{pdp.cat}&nbsp;&nbsp;/&nbsp;&nbsp;<span style={css("color:#15202B;font-weight:600;")}>{pdp.name}</span></div>
          <div className="z-pdp-main" style={css("display:grid;grid-template-columns:1.15fr 1fr;gap:40px;margin-bottom:44px;")}>
            {/* gallery */}
            <div style={css("display:flex;gap:16px;")}>
              <div style={css("display:flex;flex-direction:column;gap:12px;flex:none;")}>
                {pdpThumbs.map((t, i) => (
                  <button key={i} style={{ ...css("width:64px;height:64px;border-radius:12px;background:#fff;cursor:pointer;padding:6px;overflow:hidden;"), border: "2px solid " + t.border }}>
                    {pdp.hasImg && <img src={pdp.img} style={css("width:100%;height:100%;object-fit:contain;")} />}
                  </button>
                ))}
              </div>
              <div className="z-pdp-stage" style={css("flex:1;background:#F7F9FC;border:1px solid rgba(0,0,0,0.06);border-radius:20px;display:flex;align-items:center;justify-content:center;padding:36px;min-height:440px;position:relative;")}>
                {pdp.promoOn && <span style={css("position:absolute;top:20px;left:20px;")}><PromoHex label={"−" + pdp.promo + "%"} h={66} /></span>}
                {pdp.hasImg
                  ? <img src={pdp.img} alt={pdp.name} style={css("max-height:380px;max-width:100%;object-fit:contain;")} />
                  : <div style={css("width:100%;height:380px;border-radius:14px;background:repeating-linear-gradient(135deg,#EEF2F7,#EEF2F7 11px,#F6F8FB 11px,#F6F8FB 22px);display:flex;align-items:center;justify-content:center;")}><span style={css("font:600 13px ui-monospace,monospace;color:#9aa6b4;")}>{pdp.ph}</span></div>}
              </div>
            </div>
            {/* buy card */}
            <div>
              <div style={css("display:inline-block;background:#EAF2FC;color:#0E4DA4;font:600 12px Inter;padding:5px 11px;border-radius:8px;margin-bottom:14px;")}>{pdp.cat}</div>
              <h1 className="z-h1" style={css("font:800 30px Inter;margin:0 0 10px;line-height:1.15;color:#15202B;")}>{pdp.name}</h1>
              <div style={css("display:flex;align-items:center;gap:14px;margin-bottom:22px;")}>
                <div style={css("display:flex;align-items:center;gap:4px;")}><span style={css("color:#F5B72E;font-size:16px;letter-spacing:1px;")}>★★★★★</span><span style={css("font:600 13px Inter;color:#15202B;")}>{pdp.rating}</span></div>
                <span style={css("font:500 13px Inter;color:#94a0ae;")}>{pdp.reviews} recenzija</span>
                <span style={css("font:500 13px Inter;color:#94a0ae;")}>SKU: {pdp.sku}</span>
              </div>

              <div style={css("background:#F7F9FC;border:1px solid rgba(0,0,0,0.06);border-radius:18px;padding:22px;margin-bottom:20px;")}>
                {pdp.showRank && (<>
                  <div style={css("font:600 12px Inter;color:#5B6573;margin-bottom:4px;")}>Vaša cena · {rank.name}</div>
                  <div style={css("display:flex;align-items:baseline;gap:12px;margin-bottom:6px;")}><span style={css("font:800 34px Inter;color:#1769C0;")}>{pdp.rankStr}</span><span style={css("background:#0E4DA4;color:#fff;font:700 13px Inter;padding:4px 10px;border-radius:8px;")}>{pdp.discLabel}</span></div>
                  <div style={css("font:500 14px Inter;color:#94a0ae;text-decoration:line-through;")}>MP Cena {pdp.mpStr}</div>
                </>)}
                {pdp.showGuest && (<>
                  <div style={css("font:600 12px Inter;color:#5B6573;margin-bottom:4px;")}>MP Cena</div>
                  <div style={css("font:800 34px Inter;color:#15202B;margin-bottom:12px;")}>{pdp.mpStr}</div>
                  <div style={css("display:flex;align-items:center;gap:10px;background:#EAF2FC;border-radius:12px;padding:12px 14px;")}>
                    <span style={css("font:800 12px Inter;color:#1769C0;letter-spacing:0.03em;")}>BIZZCLUB</span>
                    <span style={css("font:500 13px Inter;color:#13315C;")}>Učlanite se i kupite po ceni do <b>−40%</b></span>
                  </div>
                </>)}
              </div>

              {/* rank table */}
              <div style={css("border:1px solid rgba(0,0,0,0.06);border-radius:14px;overflow:hidden;margin-bottom:22px;")}>
                <div style={css("background:#13315C;color:#fff;padding:12px 16px;font:700 13px Inter;")}>Cena po rangu članstva</div>
                {rankTable.map((row, i) => (
                  <div key={i} style={{ ...css("display:flex;align-items:center;justify-content:space-between;padding:11px 16px;border-top:1px solid rgba(0,0,0,0.05);"), background: row.rowBg }}>
                    <div style={css("display:flex;align-items:center;gap:9px;")}><span style={{ ...css("font:600 13px Inter;"), color: row.nameColor }}>{row.name}</span>{row.maxTag && <span style={css("background:#F5B72E;color:#13315C;font:700 10px Inter;padding:2px 7px;border-radius:6px;")}>Max</span>}{row.youTag && <span style={css("background:#0E4DA4;color:#fff;font:700 10px Inter;padding:2px 7px;border-radius:6px;")}>Vi</span>}</div>
                    <div style={css("display:flex;align-items:center;gap:10px;")}><span style={css("font:500 12px Inter;color:#94a0ae;")}>{row.discLabel}</span><span style={{ ...css("font:700 14px Inter;"), color: row.priceColor }}>{row.priceStr}</span></div>
                  </div>
                ))}
              </div>

              <div style={css("display:flex;align-items:center;gap:14px;margin-bottom:16px;")}>
                <div style={css("display:flex;align-items:center;border:1.5px solid rgba(0,0,0,0.1);border-radius:12px;overflow:hidden;")}>
                  <button onClick={() => patch((s) => ({ qty: Math.max(1, s.qty - 1) }))} className="z-step" style={css("border:none;background:#fff;width:46px;height:46px;font:600 20px Inter;color:#13315C;cursor:pointer;")}>−</button>
                  <span style={css("width:46px;text-align:center;font:700 16px Inter;")}>{state.qty}</span>
                  <button onClick={() => patch((s) => ({ qty: s.qty + 1 }))} className="z-step" style={css("border:none;background:#fff;width:46px;height:46px;font:600 20px Inter;color:#13315C;cursor:pointer;")}>+</button>
                </div>
                <button onClick={() => addToCart(state.pdpId, state.qty)} className="z-cta" style={css("flex:1;background:#13315C;color:#fff;border:none;border-radius:12px;height:50px;font:700 15px Inter;cursor:pointer;")}>Dodajte u korpu</button>
              </div>
              <div style={css("display:flex;gap:12px;margin-bottom:20px;")}>
                <button onClick={goCart} className="z-amber" style={css("flex:1;background:#F5B72E;color:#13315C;border:none;border-radius:12px;height:46px;font:700 14px Inter;cursor:pointer;")}>Kupite odmah</button>
                <button className="z-sec" style={css("flex:none;border:1.5px solid rgba(0,0,0,0.1);background:#fff;border-radius:12px;height:46px;padding:0 18px;font:600 14px Inter;color:#13315C;cursor:pointer;display:flex;align-items:center;gap:8px;")}>🎁 Pošaljite kao poklon</button>
              </div>
              <div style={css("display:flex;align-items:center;gap:10px;font:500 13px Inter;color:#5B6573;")}><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#0E4DA4" strokeWidth="2"><path d="M1 3h13v13H1z" /><path d="M14 8h4l3 3v5h-7" /><circle cx="5.5" cy="18.5" r="2" /><circle cx="17.5" cy="18.5" r="2" /></svg>Besplatna isporuka · dostava 2–4 radna dana</div>
            </div>
          </div>

          {/* accordions */}
          <div style={css("max-width:840px;margin-bottom:48px;")}>
            {accordions.map((a, i) => (
              <div key={i} style={css("border-bottom:1px solid rgba(0,0,0,0.08);")}>
                <button onClick={a.toggle} style={css("width:100%;display:flex;align-items:center;justify-content:space-between;background:none;border:none;padding:20px 0;cursor:pointer;font:700 17px Inter;color:#15202B;text-align:left;")}>
                  {a.title}<span style={css("font-size:22px;color:#0E4DA4;font-weight:400;")}>{a.sign}</span>
                </button>
                {a.open && (
                  <div style={css("padding:0 0 22px;")}>
                    {a.rows.map((r, j) => (
                      <div key={j} style={{ ...css("display:flex;justify-content:space-between;padding:10px 14px;border-radius:8px;font:500 13.5px Inter;"), background: r.bg }}><span style={css("color:#5B6573;")}>{r.k}</span><span style={css("color:#15202B;font-weight:600;")}>{r.v}</span></div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* similar */}
          <h2 style={css("font:800 24px Inter;margin:0 0 20px;color:#15202B;")}>Slični proizvodi</h2>
          <div className="z-grid-4 z-carousel" style={css("display:grid;grid-template-columns:repeat(4,1fr);gap:18px;")}>
            {similar.map((p) => (
              <div key={p.id} className="z-card-flat" style={css("background:#fff;border:1px solid rgba(0,0,0,0.06);border-radius:18px;overflow:hidden;display:flex;flex-direction:column;")}>
                <button onClick={p.open} style={css("border:none;background:none;cursor:pointer;padding:18px;")}>
                  <div style={css("height:140px;display:flex;align-items:center;justify-content:center;")}>
                    {p.hasImg
                      ? <img src={p.img} style={css("max-height:140px;max-width:100%;object-fit:contain;")} />
                      : <div style={css("width:100%;height:140px;border-radius:12px;background:repeating-linear-gradient(135deg,#EEF2F7,#EEF2F7 9px,#F6F8FB 9px,#F6F8FB 18px);display:flex;align-items:center;justify-content:center;")}><span style={css("font:600 10px ui-monospace,monospace;color:#9aa6b4;")}>{p.ph}</span></div>}
                  </div>
                </button>
                <div style={css("padding:0 16px 16px;")}>
                  <div style={css("font:600 11px Inter;color:#0E4DA4;margin-bottom:4px;")}>{p.cat}</div>
                  <div style={css("font:600 13.5px Inter;color:#15202B;line-height:1.3;margin-bottom:8px;min-height:34px;")}>{p.name}</div>
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
          <h1 className="z-h1" style={css("font:800 30px Inter;margin:0 0 26px;")}>Vaša korpa <span style={css("font:500 17px Inter;color:#94a0ae;")}>({cartCount} proizvoda)</span></h1>
          {state.cart.length === 0 ? (
            <div style={css("text-align:center;padding:80px 20px;background:#fff;border:1px solid rgba(0,0,0,0.06);border-radius:20px;")}>
              <div style={css("width:80px;height:80px;border-radius:50%;background:#EAF2FC;display:flex;align-items:center;justify-content:center;margin:0 auto 20px;")}><svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="#0E4DA4" strokeWidth="2"><path d="M3 4h2l2.4 12.4a1 1 0 001 .8h9.2a1 1 0 001-.8L21 8H6" /></svg></div>
              <h3 style={css("font:700 20px Inter;margin:0 0 8px;")}>Korpa je prazna</h3>
              <p style={css("font:400 14px Inter;color:#5B6573;margin:0 0 22px;")}>Dodajte proizvode iz kataloga da nastavite.</p>
              <button onClick={goPlp} style={css("background:#13315C;color:#fff;border:none;border-radius:12px;padding:13px 26px;font:600 14px Inter;cursor:pointer;")}>Idi na katalog</button>
            </div>
          ) : (
            <div className="z-two-col" style={css("display:grid;grid-template-columns:1.6fr 1fr;gap:28px;align-items:start;")}>
              <div style={css("display:flex;flex-direction:column;gap:14px;")}>
                {cartRows.map((c) => (
                  <div key={c.id} className="z-cart-row" style={css("background:#fff;border:1px solid rgba(0,0,0,0.06);border-radius:16px;padding:16px;display:flex;gap:16px;align-items:center;")}>
                    <div style={css("width:88px;height:88px;border-radius:12px;background:#F7F9FC;display:flex;align-items:center;justify-content:center;flex:none;padding:8px;")}>
                      {c.hasImg
                        ? <img src={c.img} style={css("max-width:100%;max-height:100%;object-fit:contain;")} />
                        : <div style={css("width:100%;height:100%;border-radius:8px;background:repeating-linear-gradient(135deg,#EEF2F7,#EEF2F7 7px,#F6F8FB 7px,#F6F8FB 14px);")} />}
                    </div>
                    <div className="z-cart-info" style={css("flex:1;")}>
                      <div style={css("font:600 11px Inter;color:#0E4DA4;margin-bottom:3px;")}>{c.cat}</div>
                      <div style={css("font:600 14.5px Inter;color:#15202B;margin-bottom:4px;line-height:1.3;")}>{c.name}</div>
                      <div style={css("font:500 11.5px Inter;color:#94a0ae;")}>SKU: {c.sku}</div>
                    </div>
                    <div style={css("display:flex;align-items:center;border:1.5px solid rgba(0,0,0,0.1);border-radius:10px;overflow:hidden;flex:none;")}>
                      <button onClick={c.dec} className="z-step" style={css("border:none;background:#fff;width:34px;height:34px;font:600 17px Inter;color:#13315C;cursor:pointer;")}>−</button>
                      <span style={css("width:34px;text-align:center;font:700 14px Inter;")}>{c.qty}</span>
                      <button onClick={c.inc} className="z-step" style={css("border:none;background:#fff;width:34px;height:34px;font:600 17px Inter;color:#13315C;cursor:pointer;")}>+</button>
                    </div>
                    <div className="z-cart-price" style={css("text-align:right;flex:none;min-width:130px;")}>
                      <div style={css("font:800 16px Inter;color:#1769C0;")}>{c.lineStr}</div>
                      {c.showRank && <div style={css("font:500 11.5px Inter;color:#94a0ae;text-decoration:line-through;")}>{c.lineMpStr}</div>}
                    </div>
                    <button onClick={c.remove} className="z-op" style={css("border:none;background:none;cursor:pointer;flex:none;padding:6px;")}><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#c2424f" strokeWidth="2"><path d="M3 6h18M8 6V4h8v2M6 6l1 14h10l1-14" /></svg></button>
                  </div>
                ))}
              </div>
              <div className="z-sticky" style={css("background:#fff;border:1px solid rgba(0,0,0,0.06);border-radius:18px;padding:24px;position:sticky;top:120px;")}>
                <h3 style={css("font:700 18px Inter;margin:0 0 18px;")}>Pregled porudžbine</h3>
                <div style={css("display:flex;justify-content:space-between;font:500 14px Inter;color:#5B6573;margin-bottom:12px;")}><span>MP vrednost</span><span style={css("text-decoration:line-through;")}>{fmt(mpTotal)}</span></div>
                {rank.disc > 0 && <div style={css("display:flex;justify-content:space-between;font:600 14px Inter;color:#1769C0;margin-bottom:12px;")}><span>{rank.name} popust</span><span>− {fmt(savings)}</span></div>}
                <div style={css("display:flex;justify-content:space-between;font:500 14px Inter;color:#5B6573;margin-bottom:16px;")}><span>Isporuka</span><span style={css("color:#1F8A5B;font-weight:600;")}>Besplatno</span></div>
                <div style={css("border-top:1px solid rgba(0,0,0,0.08);padding-top:16px;display:flex;justify-content:space-between;align-items:baseline;margin-bottom:8px;")}><span style={css("font:700 16px Inter;")}>Ukupno</span><span style={css("font:800 24px Inter;color:#13315C;")}>{fmt(rankTotal)}</span></div>
                {rank.disc > 0 && <div style={css("background:#EAF2FC;border-radius:10px;padding:10px 12px;font:600 12.5px Inter;color:#0E4DA4;text-align:center;margin-bottom:18px;")}>Uštedeli ste {fmt(savings)} kao {rank.name} 🎉</div>}
                {rank.disc === 0 && <div style={css("background:#EAF2FC;border-radius:10px;padding:10px 12px;font:600 12.5px Inter;color:#0E4DA4;text-align:center;margin-bottom:18px;")}>Učlanite se u BizzClub i uštedite do 40% na ovu korpu</div>}
                <button onClick={goCheckout} className="z-cta" style={css("width:100%;background:#13315C;color:#fff;border:none;border-radius:12px;height:52px;font:700 15px Inter;cursor:pointer;margin-bottom:10px;")}>Nastavi na plaćanje →</button>
                <button onClick={goPlp} style={css("width:100%;background:none;border:none;color:#0E4DA4;font:600 13px Inter;cursor:pointer;")}>Nastavi kupovinu</button>
              </div>
            </div>
          )}
        </main>
      )}

      {/* ============ CHECKOUT ============ */}
      {scr === "checkout" && (
        <main className="z-shell" style={css("max-width:1100px;margin:0 auto;padding:30px 24px 80px;")}>
          <h1 className="z-h1" style={css("font:800 30px Inter;margin:0 0 6px;")}>Plaćanje</h1>
          <div style={css("display:flex;align-items:center;gap:10px;font:500 13px Inter;color:#5B6573;margin-bottom:28px;")}><span style={css("color:#0E4DA4;font-weight:600;")}>1 Korpa</span> › <span style={css("color:#0E4DA4;font-weight:600;")}>2 Podaci</span> › <span style={css("color:#94a0ae;")}>3 Potvrda</span></div>
          <div className="z-two-col" style={css("display:grid;grid-template-columns:1.5fr 1fr;gap:28px;align-items:start;")}>
            <div style={css("display:flex;flex-direction:column;gap:20px;")}>
              <div style={css("background:#fff;border:1px solid rgba(0,0,0,0.06);border-radius:18px;padding:24px;")}>
                <h3 style={css("font:700 17px Inter;margin:0 0 18px;")}>Adresa za dostavu</h3>
                <div style={css("display:grid;grid-template-columns:1fr 1fr;gap:14px;")}>
                  <label style={css("font:600 12px Inter;color:#5B6573;")}>Ime<input defaultValue="Igor" style={css("display:block;width:100%;margin-top:6px;border:1.5px solid rgba(0,0,0,0.1);border-radius:10px;padding:11px 12px;font:500 14px Inter;outline:none;")} /></label>
                  <label style={css("font:600 12px Inter;color:#5B6573;")}>Prezime<input defaultValue="Petrović" style={css("display:block;width:100%;margin-top:6px;border:1.5px solid rgba(0,0,0,0.1);border-radius:10px;padding:11px 12px;font:500 14px Inter;outline:none;")} /></label>
                  <label style={css("font:600 12px Inter;color:#5B6573;grid-column:span 2;")}>Adresa<input defaultValue="Knez Mihailova 12" style={css("display:block;width:100%;margin-top:6px;border:1.5px solid rgba(0,0,0,0.1);border-radius:10px;padding:11px 12px;font:500 14px Inter;outline:none;")} /></label>
                  <label style={css("font:600 12px Inter;color:#5B6573;")}>Grad<input defaultValue="Beograd" style={css("display:block;width:100%;margin-top:6px;border:1.5px solid rgba(0,0,0,0.1);border-radius:10px;padding:11px 12px;font:500 14px Inter;outline:none;")} /></label>
                  <label style={css("font:600 12px Inter;color:#5B6573;")}>Poštanski broj<input defaultValue="11000" style={css("display:block;width:100%;margin-top:6px;border:1.5px solid rgba(0,0,0,0.1);border-radius:10px;padding:11px 12px;font:500 14px Inter;outline:none;")} /></label>
                </div>
              </div>
              <div style={css("background:#fff;border:1px solid rgba(0,0,0,0.06);border-radius:18px;padding:24px;")}>
                <h3 style={css("font:700 17px Inter;margin:0 0 18px;")}>Način plaćanja</h3>
                <div style={css("display:flex;flex-direction:column;gap:12px;")}>
                  <label style={css("display:flex;align-items:center;gap:12px;border:1.5px solid #0E4DA4;background:#F4F8FE;border-radius:12px;padding:14px 16px;cursor:pointer;")}><span style={css("width:18px;height:18px;border-radius:50%;border:5px solid #0E4DA4;flex:none;")} /><span style={css("font:600 14px Inter;color:#15202B;")}>Platnom karticom</span><span style={css("margin-left:auto;font:600 12px Inter;color:#94a0ae;")}>Visa · Mastercard</span></label>
                  <label style={css("display:flex;align-items:center;gap:12px;border:1.5px solid rgba(0,0,0,0.1);border-radius:12px;padding:14px 16px;cursor:pointer;")}><span style={css("width:18px;height:18px;border-radius:50%;border:1.5px solid #94a0ae;flex:none;")} /><span style={css("font:600 14px Inter;color:#15202B;")}>Pouzećem (plaćanje pri preuzimanju)</span></label>
                  <label style={css("display:flex;align-items:center;gap:12px;border:1.5px solid rgba(0,0,0,0.1);border-radius:12px;padding:14px 16px;cursor:pointer;")}><span style={css("width:18px;height:18px;border-radius:50%;border:1.5px solid #94a0ae;flex:none;")} /><span style={css("font:600 14px Inter;color:#15202B;")}>Nalog za prenos (uplatnica)</span></label>
                </div>
              </div>
            </div>
            <div className="z-sticky" style={css("background:#fff;border:1px solid rgba(0,0,0,0.06);border-radius:18px;padding:24px;position:sticky;top:120px;")}>
              <h3 style={css("font:700 18px Inter;margin:0 0 18px;")}>Vaša porudžbina</h3>
              <div style={css("display:flex;flex-direction:column;gap:12px;margin-bottom:16px;")}>
                {cartRows.map((c) => (
                  <div key={c.id} style={css("display:flex;justify-content:space-between;gap:10px;font:500 13px Inter;")}><span style={css("color:#15202B;")}>{c.qty}× {c.name}</span><span style={{ ...css("color:#15202B;font-weight:600;"), whiteSpace: "nowrap" }}>{c.lineStr}</span></div>
                ))}
              </div>
              <div style={css("border-top:1px solid rgba(0,0,0,0.08);padding-top:14px;")}>
                <div style={css("display:flex;justify-content:space-between;font:500 13px Inter;color:#5B6573;margin-bottom:10px;")}><span>MP vrednost</span><span style={css("text-decoration:line-through;")}>{fmt(mpTotal)}</span></div>
                {rank.disc > 0 && <div style={css("display:flex;justify-content:space-between;font:600 13px Inter;color:#1769C0;margin-bottom:10px;")}><span>{rank.name} popust</span><span>− {fmt(savings)}</span></div>}
                <div style={css("display:flex;justify-content:space-between;font:500 13px Inter;color:#5B6573;margin-bottom:14px;")}><span>Isporuka</span><span style={css("color:#1F8A5B;font-weight:600;")}>Besplatno</span></div>
                <div style={css("display:flex;justify-content:space-between;align-items:baseline;border-top:1px solid rgba(0,0,0,0.08);padding-top:14px;margin-bottom:18px;")}><span style={css("font:700 16px Inter;")}>Ukupno</span><span style={css("font:800 22px Inter;color:#13315C;")}>{fmt(rankTotal)}</span></div>
              </div>
              <button className="z-amber" style={css("width:100%;background:#F5B72E;color:#13315C;border:none;border-radius:12px;height:52px;font:700 15px Inter;cursor:pointer;")}>Potvrdi porudžbinu</button>
              <div style={css("text-align:center;font:500 11.5px Inter;color:#94a0ae;margin-top:12px;")}>🔒 Sigurno plaćanje · SSL zaštita</div>
            </div>
          </div>
        </main>
      )}

      {/* ============ OUTLET ============ */}
      {scr === "outlet" && (
        <main style={css("max-width:1280px;margin:0 auto;padding:0 0 80px;")}>
          <div className="z-outlet-hero" style={css("background:linear-gradient(120deg,#13315C,#0B1F3A);color:#fff;padding:48px 24px;")}>
            <div style={css("max-width:1280px;margin:0 auto;display:flex;align-items:center;justify-content:space-between;gap:24px;flex-wrap:wrap;")}>
              <div>
                <div style={css("display:inline-flex;align-items:center;gap:8px;background:rgba(245,183,46,0.15);color:#F5B72E;font:700 12px Inter;padding:6px 12px;border-radius:8px;margin-bottom:14px;")}>⚡ ZEUS OUTLET · AUKCIJE</div>
                <h1 className="z-h1" style={css("font:800 38px Inter;margin:0 0 8px;")}>Licitirajte ili kupite odmah</h1>
                <p style={css("font:400 15px Inter;opacity:.8;margin:0;max-width:480px;")}>Provereni proizvodi po izuzetnim cenama. Nove aukcije svakog dana.</p>
              </div>
              <div style={css("background:rgba(255,255,255,0.08);border:1px solid rgba(255,255,255,0.15);border-radius:16px;padding:20px 28px;text-align:center;")}>
                <div style={css("font:600 12px Inter;opacity:.7;margin-bottom:8px;")}>Sledeća aukcija se zatvara za</div>
                <div style={css("display:flex;gap:10px;justify-content:center;")}>
                  <div><div style={css("font:800 30px Inter;")}>02</div><div style={css("font:500 10px Inter;opacity:.6;")}>SATI</div></div>
                  <div style={css("font:800 30px Inter;")}>:</div>
                  <div><div style={css("font:800 30px Inter;")}>14</div><div style={css("font:500 10px Inter;opacity:.6;")}>MIN</div></div>
                  <div style={css("font:800 30px Inter;")}>:</div>
                  <div><div style={css("font:800 30px Inter;color:#F5B72E;")}>38</div><div style={css("font:500 10px Inter;opacity:.6;")}>SEK</div></div>
                </div>
              </div>
            </div>
          </div>
          <div className="z-shell" style={css("max-width:1280px;margin:0 auto;padding:28px 24px 0;")}>
            <div style={css("display:flex;gap:10px;margin-bottom:24px;")}>
              {outletFilters.map((f, i) => (
                <button key={i} onClick={f.pick} style={{ ...css("border-radius:10px;padding:9px 16px;font:600 13px Inter;cursor:pointer;"), border: "1px solid " + f.border, background: f.bg, color: f.fg }}>{f.label}</button>
              ))}
            </div>
            <div className="z-grid-3 z-carousel" style={css("display:grid;grid-template-columns:repeat(3,1fr);gap:20px;")}>
              {auctions.map((a, i) => (
                <div key={i} className="z-card-flat" style={css("background:#fff;border:1px solid rgba(0,0,0,0.06);border-radius:18px;overflow:hidden;display:flex;flex-direction:column;")}>
                  <div style={css("position:relative;padding:20px;background:#F7F9FC;")}>
                    <span style={css("position:absolute;top:14px;left:14px;background:#13315C;color:#fff;font:700 11px Inter;padding:5px 10px;border-radius:8px;")}>⏱ {a.timeLeft}</span>
                    <span style={{ ...css("position:absolute;top:14px;right:14px;font:600 11px Inter;padding:5px 10px;border-radius:8px;"), background: a.condBg, color: a.condFg }}>{a.condition}</span>
                    <div style={css("height:180px;display:flex;align-items:center;justify-content:center;margin-top:8px;")}>
                      {a.hasImg
                        ? <img src={a.img} style={css("max-height:180px;max-width:100%;object-fit:contain;")} />
                        : <div style={css("width:100%;height:180px;border-radius:12px;background:repeating-linear-gradient(135deg,#EEF2F7,#EEF2F7 9px,#F6F8FB 9px,#F6F8FB 18px);display:flex;align-items:center;justify-content:center;")}><span style={css("font:600 11px ui-monospace,monospace;color:#9aa6b4;")}>{a.ph}</span></div>}
                    </div>
                  </div>
                  <div style={css("padding:18px;display:flex;flex-direction:column;flex:1;")}>
                    <div style={css("font:600 11px Inter;color:#0E4DA4;margin-bottom:5px;")}>{a.cat}</div>
                    <div style={css("font:600 15px Inter;color:#15202B;margin-bottom:14px;line-height:1.3;min-height:40px;")}>{a.name}</div>
                    <div style={css("display:flex;justify-content:space-between;align-items:flex-end;margin-bottom:14px;")}>
                      <div><div style={css("font:500 11px Inter;color:#5B6573;")}>Trenutna licitacija</div><div style={css("font:800 22px Inter;color:#1769C0;")}>{a.bidStr}</div></div>
                      <div style={css("text-align:right;")}><div style={css("font:500 11px Inter;color:#5B6573;")}>Ušteda</div><div style={css("font:700 14px Inter;color:#1F8A5B;")}>{a.savePct}</div></div>
                    </div>
                    <button className="z-cta" style={css("width:100%;background:#13315C;color:#fff;border:none;border-radius:11px;padding:12px;font:700 13.5px Inter;cursor:pointer;margin-bottom:8px;")}>Licitirajte</button>
                    <button className="z-buynow" style={css("width:100%;background:#fff;border:1.5px solid #F5B72E;color:#13315C;border-radius:11px;padding:11px;font:700 13px Inter;cursor:pointer;")}>Kupite odmah · {a.buyStr}</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </main>
      )}

      {/* ============ BIZZCLUB ============ */}
      {scr === "bizz" && (
        <main style={css("padding:0 0 80px;")}>
          <div className="z-bizz-hero" style={css("background:linear-gradient(135deg,#0E4DA4,#13315C);color:#fff;padding:64px 24px;text-align:center;")}>
            <div style={css("max-width:760px;margin:0 auto;")}>
              <div style={css("display:inline-block;background:rgba(245,183,46,0.18);color:#F5B72E;font:700 12px Inter;padding:7px 14px;border-radius:8px;margin-bottom:20px;letter-spacing:0.06em;")}>ZEUS MEMBERS CLUB</div>
              <h1 className="z-bizz-h1" style={css("font:800 44px Inter;margin:0 0 16px;line-height:1.1;")}>Kupujte pametnije.<br />Uštedite do −40%.</h1>
              <p style={css("font:400 17px Inter;opacity:.85;margin:0 0 30px;")}>Učlanjenje je besplatno. Što viši rang u BizzClub strukturi, to veći popust na sve proizvode i brendove na marketplace-u.</p>
              <button onClick={goPlp} className="z-amber" style={css("background:#F5B72E;color:#13315C;border:none;border-radius:12px;padding:15px 32px;font:700 15px Inter;cursor:pointer;")}>Učlanite se besplatno</button>
            </div>
          </div>
          <div className="z-shell" style={css("max-width:1100px;margin:0 auto;padding:56px 24px;")}>
            <h2 style={css("font:800 28px Inter;text-align:center;margin:0 0 8px;")}>Rangovi i popusti</h2>
            <p style={css("font:400 15px Inter;color:#5B6573;text-align:center;margin:0 0 36px;")}>Vaš popust raste sa napredovanjem kroz strukturu članstva.</p>
            <div className="z-grid-3" style={css("display:grid;grid-template-columns:repeat(3,1fr);gap:18px;margin-bottom:56px;")}>
              {rankCards.map((r, i) => (
                <div key={i} style={{ ...css("background:#fff;border-radius:18px;padding:26px;position:relative;"), border: "1.5px solid " + r.border }}>
                  {r.maxTag && <span style={css("position:absolute;top:18px;right:18px;background:#F5B72E;color:#13315C;font:700 10px Inter;padding:3px 9px;border-radius:6px;")}>Max popust</span>}
                  <div style={css("font:700 12px Inter;color:#0E4DA4;letter-spacing:0.05em;text-transform:uppercase;margin-bottom:12px;")}>Rang</div>
                  <div style={css("font:800 19px Inter;color:#15202B;margin-bottom:14px;")}>{r.name}</div>
                  <div style={css("font:800 44px Inter;color:#1769C0;line-height:1;")}>{r.discBig}</div>
                  <div style={css("font:500 13px Inter;color:#5B6573;margin-top:6px;")}>popusta na sve</div>
                </div>
              ))}
            </div>
            <h2 style={css("font:800 28px Inter;text-align:center;margin:0 0 36px;")}>Pogodnosti članstva</h2>
            <div className="z-grid-4" style={css("display:grid;grid-template-columns:repeat(4,1fr);gap:18px;")}>
              {benefits.map((b, i) => (
                <div key={i} style={css("background:#fff;border:1px solid rgba(0,0,0,0.06);border-radius:16px;padding:24px;text-align:center;")}>
                  <div style={css("width:54px;height:54px;border-radius:14px;background:#EAF2FC;display:flex;align-items:center;justify-content:center;margin:0 auto 16px;font-size:24px;")}>{b.icon}</div>
                  <div style={css("font:700 15px Inter;color:#15202B;margin-bottom:8px;")}>{b.title}</div>
                  <div style={css("font:400 13px Inter;color:#5B6573;line-height:1.45;")}>{b.desc}</div>
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
          <p style={css("font:400 15px Inter;color:#5B6573;margin:0 0 40px;")}>Tokeni i jezgro komponenti. Minimalistički, prozračno, Zepter plava kao prepoznatljiv akcenat.</p>

          <h2 style={css("font:700 20px Inter;margin:0 0 16px;")}>Boje</h2>
          <div className="z-grid-4" style={css("display:grid;grid-template-columns:repeat(4,1fr);gap:14px;margin-bottom:44px;")}>
            {swatches.map((s, i) => (
              <div key={i} style={css("border:1px solid rgba(0,0,0,0.06);border-radius:14px;overflow:hidden;")}>
                <div style={{ ...css("height:84px;"), background: s.hex }} />
                <div style={css("padding:12px 14px;")}><div style={css("font:600 13px Inter;color:#15202B;")}>{s.name}</div><div style={css("font:500 11.5px ui-monospace,monospace;color:#94a0ae;")}>{s.hex}</div></div>
              </div>
            ))}
          </div>

          <h2 style={css("font:700 20px Inter;margin:0 0 16px;")}>Tipografija — Inter</h2>
          <div style={css("background:#fff;border:1px solid rgba(0,0,0,0.06);border-radius:16px;padding:28px;margin-bottom:44px;display:flex;flex-direction:column;gap:14px;")}>
            <div style={css("display:flex;align-items:baseline;gap:16px;")}><span style={css("font:500 11px ui-monospace,monospace;color:#94a0ae;width:80px;")}>40 / 800</span><span style={css("font:800 40px Inter;color:#15202B;")}>Zaglavlje</span></div>
            <div style={css("display:flex;align-items:baseline;gap:16px;")}><span style={css("font:500 11px ui-monospace,monospace;color:#94a0ae;width:80px;")}>28 / 800</span><span style={css("font:800 28px Inter;color:#15202B;")}>Naslov sekcije</span></div>
            <div style={css("display:flex;align-items:baseline;gap:16px;")}><span style={css("font:500 11px ui-monospace,monospace;color:#94a0ae;width:80px;")}>20 / 700</span><span style={css("font:700 20px Inter;color:#15202B;")}>Podnaslov</span></div>
            <div style={css("display:flex;align-items:baseline;gap:16px;")}><span style={css("font:500 11px ui-monospace,monospace;color:#94a0ae;width:80px;")}>16 / 600</span><span style={css("font:600 16px Inter;color:#15202B;")}>Naziv proizvoda</span></div>
            <div style={css("display:flex;align-items:baseline;gap:16px;")}><span style={css("font:500 11px ui-monospace,monospace;color:#94a0ae;width:80px;")}>14 / 400</span><span style={css("font:400 14px Inter;color:#5B6573;")}>Tekst paragrafa, opisi i pomoćne informacije.</span></div>
          </div>

          <h2 style={css("font:700 20px Inter;margin:0 0 16px;")}>Dugmad</h2>
          <div style={css("background:#fff;border:1px solid rgba(0,0,0,0.06);border-radius:16px;padding:28px;margin-bottom:44px;display:flex;gap:14px;flex-wrap:wrap;align-items:center;")}>
            <button className="z-cta" style={css("background:#13315C;color:#fff;border:none;border-radius:12px;padding:13px 22px;font:600 14px Inter;cursor:pointer;")}>Primarno (CTA)</button>
            <button className="z-amber" style={css("background:#F5B72E;color:#13315C;border:none;border-radius:12px;padding:13px 22px;font:700 14px Inter;cursor:pointer;")}>Amber akcija</button>
            <button className="z-sec" style={css("background:#fff;color:#0E4DA4;border:1.5px solid #0E4DA4;border-radius:12px;padding:13px 22px;font:600 14px Inter;cursor:pointer;")}>Sekundarno</button>
            <button style={css("background:none;color:#0E4DA4;border:none;font:600 14px Inter;cursor:pointer;")}>Ghost link →</button>
            <button disabled style={css("background:#EEF1F5;color:#a9b2bd;border:none;border-radius:12px;padding:13px 22px;font:600 14px Inter;cursor:not-allowed;")}>Onemogućeno</button>
          </div>

          <h2 style={css("font:700 20px Inter;margin:0 0 16px;")}>Komponente</h2>
          <div className="z-grid-2" style={css("display:grid;grid-template-columns:1fr 1fr;gap:18px;")}>
            <div style={css("background:#fff;border:1px solid rgba(0,0,0,0.06);border-radius:16px;padding:24px;")}>
              <div style={css("font:600 12px Inter;color:#94a0ae;margin-bottom:14px;")}>PRICE BLOCK · GOST</div>
              <div style={css("font:500 11px Inter;color:#5B6573;")}>MP Cena</div>
              <div style={css("font:800 22px Inter;color:#15202B;margin-bottom:8px;")}>72.890,00 RSD</div>
              <div style={css("display:flex;align-items:center;gap:6px;background:#EAF2FC;border-radius:8px;padding:8px 10px;")}><span style={css("font:700 11px Inter;color:#1769C0;")}>BizzClub</span><span style={css("font:500 11px Inter;color:#13315C;")}>do −40%</span></div>
            </div>
            <div style={css("background:#fff;border:1px solid rgba(0,0,0,0.06);border-radius:16px;padding:24px;")}>
              <div style={css("font:600 12px Inter;color:#94a0ae;margin-bottom:14px;")}>PRICE BLOCK · RANG</div>
              <div style={css("display:flex;align-items:baseline;gap:8px;")}><span style={css("font:800 22px Inter;color:#1769C0;")}>43.734,00 RSD</span><span style={css("background:#EAF2FC;color:#0E4DA4;font:700 11px Inter;padding:2px 7px;border-radius:6px;")}>−40%</span></div>
              <div style={css("font:500 12px Inter;color:#94a0ae;text-decoration:line-through;")}>MP 72.890,00 RSD</div>
            </div>
            <div style={css("background:#fff;border:1px solid rgba(0,0,0,0.06);border-radius:16px;padding:24px;display:flex;align-items:center;gap:18px;")}>
              <div style={css("font:600 12px Inter;color:#94a0ae;")}>PROMO HEX</div>
              <PromoHex label="−10%" h={62} />
              <div style={css("font:600 12px Inter;color:#94a0ae;")}>CHIP</div>
              <span style={css("border:1px solid #0E4DA4;background:#EAF2FC;color:#0E4DA4;font:600 12px Inter;padding:7px 13px;border-radius:999px;")}>Filter</span>
            </div>
            <div style={css("background:#fff;border:1px solid rgba(0,0,0,0.06);border-radius:16px;padding:24px;display:flex;align-items:center;gap:18px;flex-wrap:wrap;")}>
              <div style={css("font:600 12px Inter;color:#94a0ae;")}>RATING</div>
              <div style={css("color:#F5B72E;font-size:18px;")}>★★★★★ <span style={css("color:#15202B;font:600 13px Inter;")}>4.8</span></div>
              <div style={css("font:600 12px Inter;color:#94a0ae;")}>STEPPER</div>
              <div style={css("display:flex;align-items:center;border:1.5px solid rgba(0,0,0,0.1);border-radius:10px;")}><span style={css("width:34px;height:34px;display:flex;align-items:center;justify-content:center;font:600 16px Inter;color:#13315C;")}>−</span><span style={css("width:34px;text-align:center;font:700 14px Inter;")}>1</span><span style={css("width:34px;height:34px;display:flex;align-items:center;justify-content:center;font:600 16px Inter;color:#13315C;")}>+</span></div>
            </div>
          </div>
        </main>
      )}

      {/* FOOTER */}
      <footer className="z-shell" style={css("background:#0B1F3A;color:#fff;padding:48px 24px 28px;")}>
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
