import { useState, useMemo } from "react";
import {
  ChevronLeft, ChevronRight, Settings2, History, TrendingUp, TrendingDown,
  AlertTriangle, Check, Send, RotateCcw, Bell, ShieldCheck, Globe,
  Percent, UserPlus, Users, GitBranch, Award, Sparkles, ArrowUp, ArrowDown,
  Tag, Map as MapIcon, SlidersHorizontal
} from "lucide-react";

// ─────────────────────────────────────────────────────────────
// ZEUS — God Mode panel · FE prototip (mock podaci, Live 100)
// 6 izmenljivih pravila = 5 primitiva + kvalifikacija rangova.
// Brojevi i imena zavise od izabrane zemlje (PT / SR / IT).
// Engine se kači posle: published/draft state + simulate() su mock.
// ─────────────────────────────────────────────────────────────

const GOLD = "#B8923E";
const GOLD_SOFT = "#F3ECDD";
const AFP = 350; // prosečna prva kupovina regruta (€)

const RANK_ORDER = ["CC", "TM", "SM", "DM", "RM"];
const RANK_NAME = {
  CC: "Club Consultant", TM: "Team Manager", SM: "Sales Manager",
  DM: "District Manager", RM: "Regional Manager",
};
const RANK_PROFILE = {
  CC: { avgVolume: 420, avgRecruits: 0.3, avgL1Vol: 0 },
  TM: { avgVolume: 1100, avgRecruits: 1.2, avgL1Vol: 1300 },
  SM: { avgVolume: 2400, avgRecruits: 2.0, avgL1Vol: 3200 },
  DM: { avgVolume: 5200, avgRecruits: 3.2, avgL1Vol: 7000 },
  RM: { avgVolume: 9800, avgRecruits: 5.0, avgL1Vol: 14000 },
};
// pragovi rangova (mesečni PSV €) — granica za ulazak u rang; CC = 0
const PSV_BAND = { CC: [60, 600], TM: [600, 1800], SM: [1800, 4000], DM: [4000, 8000], RM: [8000, 16000] };

// Brojevi su usklađeni sa zvaničnim Zepter podatkom: "over 100,000 consultants
// across 60 countries" (zepter.com → Company profile → Zepter in numbers).
// Globalno = ~100.000 konsultanata; pojedine zemlje su ilustrativni podskup (3 od 60).
const COUNTRIES = {
  Brazil: {
    flag: "🇧🇷", lang: "PT",
    counts: { CC: 8000, TM: 2600, SM: 1000, DM: 320, RM: 80 },
    people: [
      ["Ana Beatriz Costa", "RM", 0.6], ["João Vinícius", "RM", 0.1],
      ["Carlos Menezes", "DM", 0.7], ["Sofia Ribeiro", "DM", 0.05],
      ["Lucas Pereira", "SM", 0.85], ["Pedro Alves", "SM", 0.1],
      ["Marina Souza", "TM", 0.9], ["Rafael Lima", "TM", 0.15],
      ["Beatriz Rocha", "CC", 0.95], ["Tiago Fernandes", "CC", 0.5],
    ],
  },
  Srbija: {
    flag: "🇷🇸", lang: "SR",
    counts: { CC: 4000, TM: 1300, SM: 520, DM: 150, RM: 30 },
    people: [
      ["Jelena Petrović", "RM", 0.55], ["Miloš Jovanović", "RM", 0.1],
      ["Ana Nikolić", "DM", 0.7], ["Stefan Đorđević", "DM", 0.05],
      ["Marija Ilić", "SM", 0.85], ["Nikola Stanković", "SM", 0.12],
      ["Ivana Pavlović", "TM", 0.9], ["Marko Kostić", "TM", 0.15],
      ["Tijana Lukić", "CC", 0.95], ["Nemanja Ristić", "CC", 0.45],
    ],
  },
  Italija: {
    flag: "🇮🇹", lang: "IT",
    counts: { CC: 6000, TM: 1950, SM: 780, DM: 220, RM: 50 },
    people: [
      ["Giulia Romano", "RM", 0.6], ["Marco Ricci", "RM", 0.1],
      ["Francesca Greco", "DM", 0.7], ["Alessandro Conti", "DM", 0.08],
      ["Sofia Marino", "SM", 0.85], ["Lorenzo Bruno", "SM", 0.1],
      ["Chiara Esposito", "TM", 0.9], ["Matteo Gallo", "TM", 0.15],
      ["Elena Costa", "CC", 0.95], ["Davide Ferrari", "CC", 0.5],
    ],
  },
};
// Globalno = zvanični svetski podatak (~100.000 konsultanata u 60 zemalja),
// a NE zbir tri prikazane zemlje (one su samo 3 od 60 tržišta).
COUNTRIES.Globalno = {
  flag: "🌍", lang: "—",
  counts: { CC: 68000, TM: 21000, SM: 8000, DM: 2400, RM: 600 },
  people: [...COUNTRIES.Brazil.people, ...COUNTRIES.Srbija.people, ...COUNTRIES.Italija.people],
};

const PLANS = ["Live 100 (2020)", "P11 (2019)", "ZEUS v1 (novi)"];

const PUBLISHED_SEED = {
  sales: { CC: 0.2, TM: 0.25, SM: 0.3, DM: 0.35, RM: 0.4 },
  recruit: { rate: 0.08 },
  manager: { rate: 0.08, gate: 500 },
  differential: { rate: 0.05 },
  ranks: { TM: 600, SM: 1800, DM: 4000, RM: 8000 },
  promo: { active: false, targetRate: 0.3, label: "Stimulacija mart–maj", months: "mart–maj" },
  discount: { CC: 0.05, TM: 0.1, SM: 0.15, DM: 0.2, RM: 0.2 },
  plan: { Brazil: "Live 100 (2020)", Srbija: "Live 100 (2020)", Italija: "Live 100 (2020)", Globalno: "—" },
  risk: { pp: 5, members: 5000 },
};

const RULES = [
  { id: "sales", group: "earn", title: "Prodajna provizija", sub: "% po rangu na sopstvenu prodaju", icon: Percent },
  { id: "recruit", group: "earn", title: "Regruterska premija", sub: "% na prvu kupovinu novog člana", icon: UserPlus },
  { id: "manager", group: "earn", title: "Menadžerska provizija", sub: "% na L1 · uslov aktivnosti", icon: Users },
  { id: "differential", group: "earn", title: "Diferencijalna provizija", sub: "razlika stope na L1 prodaju", icon: GitBranch },
  { id: "ranks", group: "earn", title: "Kvalifikacija rangova", sub: "pragovi za ulazak u rang", icon: Award },
  { id: "promo", group: "earn", title: "Promotivne akcije", sub: "privremena stimulacija mreže", icon: Sparkles },
  { id: "discount", group: "earn", title: "Lični popust", sub: "% popusta na sopstvene kupovine", icon: Tag },
  { id: "plan", group: "set", title: "Marketing plan po zemlji", sub: "koji plan važi za izabranu zemlju", icon: MapIcon },
  { id: "risk", group: "set", title: "Pragovi opreza", sub: "kada se traži dvostruka potvrda", icon: SlidersHorizontal },
];

const eur = (n) => "€" + Math.round(n).toLocaleString("de-DE");
const num = (n) => Math.round(n).toLocaleString("de-DE");
const pp = (n) => (n * 100).toFixed(0) + "%";
const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));

// PSV osobe iz ranga + pozicije u bandu (po published pragovima)
const psvOf = (rank, pos) => {
  const [lo, hi] = PSV_BAND[rank];
  return Math.round(lo + pos * (hi - lo));
};
const enrich = (country) =>
  COUNTRIES[country].people.map(([name, rank, pos]) => {
    const psv = psvOf(rank, pos);
    const spread = 0.7 + pos * 0.6;
    return {
      name, rank, pos, psv,
      volume: psv,
      recruits: RANK_PROFILE[rank].avgRecruits * spread,
      l1vol: RANK_PROFILE[rank].avgL1Vol * spread,
    };
  });

const rankByThresholds = (psv, t) =>
  psv >= t.RM ? "RM" : psv >= t.DM ? "DM" : psv >= t.SM ? "SM" : psv >= t.TM ? "TM" : "CC";

const managerShare = (gate, rank) => {
  const base = { TM: 0.55, SM: 0.7, DM: 0.85, RM: 0.95 }[rank] || 0;
  return clamp(base * (500 / gate), 0, 1);
};

// ── Simulacija (mock engine) ──
function simulate(ruleId, country, draft, published) {
  const counts = COUNTRIES[country].counts;
  const people = enrich(country);
  const risk = published.risk;
  let deltaMonthly = 0, affected = 0, stats = [], winners = [], losers = [], note = null;
  let risky = false, period = "/ mesec";

  const mkMembers = (fn) => {
    const arr = people.map(fn).filter(Boolean);
    winners = arr.filter((m) => m.d > 0).sort((a, b) => b.d - a.d).slice(0, 4);
    losers = arr.filter((m) => m.d < 0).sort((a, b) => a.d - b.d).slice(0, 4);
  };

  if (ruleId === "sales") {
    let maxPp = 0;
    RANK_ORDER.forEach((r) => {
      const d = draft.sales[r] - published.sales[r];
      if (d !== 0) { affected += counts[r]; deltaMonthly += counts[r] * RANK_PROFILE[r].avgVolume * d; maxPp = Math.max(maxPp, Math.abs(d) * 100); }
    });
    mkMembers((m) => {
      const before = m.volume * published.sales[m.rank];
      const after = m.volume * draft.sales[m.rank];
      return { ...m, before, after, d: after - before, meta: m.rank };
    });
    stats = [{ l: "Pogođenih konsultanata", v: num(affected) }, { l: "Najveća promena", v: "±" + maxPp.toFixed(0) + " pp" }];
    risky = maxPp >= risk.pp || affected > risk.members;
  }

  if (ruleId === "recruit") {
    const d = draft.recruit.rate - published.recruit.rate;
    let newRecruits = 0;
    RANK_ORDER.forEach((r) => { newRecruits += counts[r] * RANK_PROFILE[r].avgRecruits; affected += counts[r]; });
    deltaMonthly = newRecruits * AFP * d;
    mkMembers((m) => {
      const base = m.recruits * AFP;
      const before = base * published.recruit.rate, after = base * draft.recruit.rate;
      return { ...m, before, after, d: after - before, meta: m.recruits.toFixed(1) + " reg/mes" };
    });
    stats = [{ l: "Novih regruta / mes", v: num(newRecruits) }, { l: "Premija po regrutu", v: eur(AFP * draft.recruit.rate) }];
    risky = Math.abs(d) * 100 >= risk.pp || affected > risk.members;
  }

  if (ruleId === "manager") {
    const payout = (st) => RANK_ORDER.reduce((s, r) =>
      s + (RANK_PROFILE[r].avgL1Vol > 0 ? counts[r] * managerShare(st.gate, r) * RANK_PROFILE[r].avgL1Vol * st.rate : 0), 0);
    deltaMonthly = payout(draft) - payout(published);
    let qualified = 0;
    RANK_ORDER.forEach((r) => {
      if (RANK_PROFILE[r].avgL1Vol > 0) {
        qualified += counts[r] * managerShare(draft.manager.gate, r);
        affected += Math.round(counts[r] * Math.max(managerShare(draft.manager.gate, r), managerShare(published.manager.gate, r)));
      }
    });
    mkMembers((m) => {
      if (RANK_PROFILE[m.rank].avgL1Vol === 0) return null;
      const qD = m.psv >= draft.manager.gate, qP = m.psv >= published.manager.gate;
      const before = qP ? m.l1vol * published.manager.rate : 0;
      const after = qD ? m.l1vol * draft.manager.rate : 0;
      const drop = qP && !qD ? " · ispada" : !qP && qD ? " · ulazi" : "";
      return { ...m, before, after, d: after - before, meta: m.rank + drop };
    });
    stats = [{ l: "Kvalifikovanih menadžera", v: num(qualified) }, { l: "Prag aktivnosti", v: eur(draft.manager.gate) + "/m" }];
    risky = affected > risk.members || Math.abs(draft.manager.rate - published.manager.rate) * 100 >= risk.pp || Math.abs(draft.manager.gate - published.manager.gate) >= 200;
  }

  if (ruleId === "differential") {
    const d = draft.differential.rate - published.differential.rate;
    ["SM", "DM", "RM"].forEach((r) => { affected += counts[r]; deltaMonthly += counts[r] * RANK_PROFILE[r].avgL1Vol * 0.4 * d; });
    mkMembers((m) => {
      if (!["SM", "DM", "RM"].includes(m.rank)) return null;
      const base = m.l1vol * 0.4;
      const before = base * published.differential.rate, after = base * draft.differential.rate;
      return { ...m, before, after, d: after - before, meta: m.rank };
    });
    stats = [{ l: "Pogođenih menadžera", v: num(affected) }, { l: "Stopa", v: pp(draft.differential.rate) }];
    note = "Osnovica diferencijala (bruto L1 vs. posle popusta) još nije finalno definisana u planu — prikaz je procena.";
    risky = affected > risk.members || Math.abs(d) * 100 >= risk.pp;
  }

  if (ruleId === "ranks") {
    let up = 0, down = 0, dlt = 0;
    ["TM", "SM", "DM", "RM"].forEach((r) => {
      const dThr = draft.ranks[r] - published.ranks[r];
      if (dThr === 0) return;
      const dens = counts[r] / (PSV_BAND[r][1] - PSV_BAND[r][0]); // članova po € praga
      const movers = Math.round(dens * Math.abs(dThr) * 1.4);
      if (dThr < 0) { up += movers; dlt += movers * RANK_PROFILE[r].avgVolume * 0.05; }
      else { down += movers; dlt -= movers * RANK_PROFILE[r].avgVolume * 0.05; }
    });
    affected = up + down;
    deltaMonthly = dlt;
    mkMembers((m) => {
      const nr = rankByThresholds(m.psv, draft.ranks);
      const cur = m.rank;
      const di = RANK_ORDER.indexOf(nr) - RANK_ORDER.indexOf(cur);
      if (di === 0) return null;
      const before = m.volume * published.sales[cur];
      const after = m.volume * draft.sales[nr];
      return { ...m, before, after, d: after - before, meta: cur + " → " + nr, jump: di };
    });
    stats = [{ l: "Napreduje rang", v: num(up) }, { l: "Pada rang", v: num(down) }];
    note = "Pomeranje rangova je procena raspodele članova oko granice; tačan broj zna se tek na realnim podacima.";
    risky = affected > risk.members;
  }

  if (ruleId === "promo") {
    period = "tokom akcije (" + draft.promo.months + ")";
    const cost = (st) => st.promo.active
      ? RANK_ORDER.reduce((s, r) => s + counts[r] * RANK_PROFILE[r].avgVolume * Math.max(0, st.promo.targetRate - draft.sales[r]), 0)
      : 0;
    deltaMonthly = cost(draft) - cost(published);
    RANK_ORDER.forEach((r) => { if (draft.promo.active && draft.promo.targetRate > draft.sales[r]) affected += counts[r]; });
    mkMembers((m) => {
      const boost = draft.promo.active ? Math.max(0, draft.promo.targetRate - draft.sales[m.rank]) : 0;
      const pubBoost = published.promo.active ? Math.max(0, published.promo.targetRate - published.sales[m.rank]) : 0;
      const before = m.volume * (published.sales[m.rank] + pubBoost);
      const after = m.volume * (draft.sales[m.rank] + boost);
      if (before === after) return null;
      return { ...m, before, after, d: after - before, meta: m.rank };
    });
    stats = [{ l: "Pogođenih konsultanata", v: num(affected) }, { l: "Ciljana stopa", v: pp(draft.promo.targetRate) }];
    if (!draft.promo.active && !published.promo.active) note = "Akcija je isključena — uključi je da vidiš efekat.";
    risky = affected > risk.members;
  }

  if (ruleId === "discount") {
    let maxPp = 0;
    RANK_ORDER.forEach((r) => {
      const d = draft.discount[r] - published.discount[r];
      if (d !== 0) { affected += counts[r]; deltaMonthly += counts[r] * (RANK_PROFILE[r].avgVolume * 0.35) * d; maxPp = Math.max(maxPp, Math.abs(d) * 100); }
    });
    mkMembers((m) => {
      const op = m.volume * 0.35;
      const before = op * published.discount[m.rank], after = op * draft.discount[m.rank];
      return { ...m, before, after, d: after - before, meta: m.rank };
    });
    stats = [{ l: "Pogođenih konsultanata", v: num(affected) }, { l: "Najveća promena", v: "±" + maxPp.toFixed(0) + " pp" }];
    note = "Popust je trošak na sopstvene kupovine članova (procena na osnovu prosečne lične potrošnje).";
    risky = maxPp >= risk.pp || affected > risk.members;
  }

  if (ruleId === "plan") {
    RANK_ORDER.forEach((r) => { affected += counts[r]; });
    deltaMonthly = 0;
    stats = [{ l: "Pogođenih konsultanata", v: num(affected) }, { l: "Novi plan", v: draft.plan[country] }];
    note = "Menja se ceo marketing plan za " + country + ". Sva pravila zarade prelaze na strukturu novog plana — obavezno simuliraj na demo podacima pre objave.";
    risky = draft.plan[country] !== published.plan[country];
  }

  if (ruleId === "risk") {
    deltaMonthly = 0; affected = 0;
    stats = [{ l: "Prag skoka", v: draft.risk.pp + " pp" }, { l: "Prag obima", v: num(draft.risk.members) + " kons." }];
    note = "Ovo ne menja isplate. Određuje kada God Mode traži dvostruku potvrdu: za promenu veću od " + draft.risk.pp + " pp ili više od " + num(draft.risk.members) + " pogođenih konsultanata.";
    risky = false;
  }

  return { deltaMonthly, affected, stats, winners, losers, note, risky, period };
}

// ── Sažetak promene (za potvrdu + istoriju) ──
function summarize(ruleId, draft, published) {
  if (ruleId === "sales") {
    const ch = RANK_ORDER.filter((r) => draft.sales[r] !== published.sales[r])
      .map((r) => `${r}: ${pp(published.sales[r])} → ${pp(draft.sales[r])}`);
    return "Prodajna provizija — " + (ch.join(" · ") || "bez izmena");
  }
  if (ruleId === "recruit") return `Regruterska premija: ${pp(published.recruit.rate)} → ${pp(draft.recruit.rate)}`;
  if (ruleId === "manager") {
    const parts = [];
    if (draft.manager.rate !== published.manager.rate) parts.push(`stopa ${pp(published.manager.rate)} → ${pp(draft.manager.rate)}`);
    if (draft.manager.gate !== published.manager.gate) parts.push(`prag ${eur(published.manager.gate)} → ${eur(draft.manager.gate)}`);
    return "Menadžerska provizija — " + (parts.join(" · ") || "bez izmena");
  }
  if (ruleId === "differential") return `Diferencijalna provizija: ${pp(published.differential.rate)} → ${pp(draft.differential.rate)}`;
  if (ruleId === "ranks") {
    const ch = ["TM", "SM", "DM", "RM"].filter((r) => draft.ranks[r] !== published.ranks[r])
      .map((r) => `${r}: ${eur(published.ranks[r])} → ${eur(draft.ranks[r])}`);
    return "Kvalifikacija rangova — " + (ch.join(" · ") || "bez izmena");
  }
  if (ruleId === "promo") {
    if (draft.promo.active !== published.promo.active)
      return `Akcija „${draft.promo.label}" — ${draft.promo.active ? "uključena" : "isključena"} (min ${pp(draft.promo.targetRate)})`;
    return `Akcija „${draft.promo.label}" — ciljana stopa ${pp(draft.promo.targetRate)}`;
  }
  if (ruleId === "discount") {
    const ch = RANK_ORDER.filter((r) => draft.discount[r] !== published.discount[r])
      .map((r) => `${r}: ${pp(published.discount[r])} → ${pp(draft.discount[r])}`);
    return "Lični popust — " + (ch.join(" · ") || "bez izmena");
  }
  if (ruleId === "plan") {
    const c = Object.keys(draft.plan).find((k) => draft.plan[k] !== published.plan[k]);
    return c ? `Marketing plan (${c}): ${published.plan[c]} → ${draft.plan[c]}` : "Marketing plan — bez izmena";
  }
  if (ruleId === "risk") {
    const parts = [];
    if (draft.risk.pp !== published.risk.pp) parts.push(`skok ${published.risk.pp} → ${draft.risk.pp} pp`);
    if (draft.risk.members !== published.risk.members) parts.push(`obim ${num(published.risk.members)} → ${num(draft.risk.members)} čl.`);
    return "Pragovi opreza — " + (parts.join(" · ") || "bez izmena");
  }
  return "";
}

function notifText(country) {
  const c = COUNTRIES[country];
  const market = country === "Globalno" ? "svim tržištima" : country;
  return `Od 1. jula menjamo uslove zarade u ${market}. Tvoja nova stopa biće vidljiva u profilu, a svaka obračunata stavka ostaje proverljiva.${c.lang !== "—" ? ` (šalje se na jeziku tržišta: ${c.lang})` : ""}`;
}

export default function ZeusGodMode() {
  const [country, setCountry] = useState("Brazil");
  const [view, setView] = useState("rules");
  const [activeRule, setActiveRule] = useState(null);
  const [published, setPublished] = useState(PUBLISHED_SEED);
  const [draft, setDraft] = useState(PUBLISHED_SEED);
  const [rollbackBanner, setRollbackBanner] = useState(null);
  const [history, setHistory] = useState([
    { id: 1, date: "12.06.2026 · 09:14", who: "Philip Z.", country: "Brazil",
      summary: "Prodajna provizija — RM: 38% → 40%", delta: 23520, period: "/ mesec",
      before: { ...PUBLISHED_SEED, sales: { ...PUBLISHED_SEED.sales, RM: 0.38 } }, ruleId: "sales" },
  ]);

  const total = useMemo(() => RANK_ORDER.reduce((s, r) => s + COUNTRIES[country].counts[r], 0), [country]);
  const sim = useMemo(() => activeRule ? simulate(activeRule, country, draft, published) : null, [activeRule, country, draft, published]);
  const dirty = useMemo(() => JSON.stringify(draft) !== JSON.stringify(published), [draft, published]);

  const openRule = (id) => { setDraft(JSON.parse(JSON.stringify(published))); setActiveRule(id); setRollbackBanner(null); setView("edit"); };
  const setRule = (patch) => setDraft((d) => ({ ...d, [activeRule]: { ...d[activeRule], ...patch } }));

  const doPublish = () => {
    setHistory((h) => [{
      id: h.length + 2, date: "16.06.2026 · 14:22", who: "Philip Z.", country,
      summary: summarize(activeRule, draft, published), delta: sim.deltaMonthly, period: sim.period,
      before: JSON.parse(JSON.stringify(published)), ruleId: activeRule,
    }, ...h]);
    setPublished(JSON.parse(JSON.stringify(draft)));
    setView("published");
  };
  const startRollback = (entry) => {
    setActiveRule(entry.ruleId);
    setDraft(JSON.parse(JSON.stringify(entry.before)));
    setRollbackBanner(entry.date);
    setView("simulate");
  };

  return (
    <div className="min-h-screen w-full flex items-start justify-center py-8 px-4" style={{ background: "#100F0D" }}>
      <div className="w-full max-w-md rounded-3xl overflow-hidden shadow-2xl bg-stone-50 flex flex-col" style={{ minHeight: 760 }}>
        {/* App bar */}
        <div className="px-5 pt-5 pb-4 text-white" style={{ background: "linear-gradient(135deg,#1c1a16,#2b2720)" }}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-xs tracking-[0.3em] font-semibold" style={{ color: GOLD }}>ZEUS</span>
              <span className="text-xs tracking-wide text-stone-400">· God Mode</span>
            </div>
            <button onClick={() => setView("history")} className="p-1.5 rounded-lg hover:bg-white/10">
              <History size={18} className="text-stone-300" />
            </button>
          </div>
          <div className="mt-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Globe size={15} className="text-stone-400" />
              <select value={country} onChange={(e) => setCountry(e.target.value)}
                className="bg-transparent text-sm font-medium text-white outline-none cursor-pointer">
                {Object.keys(COUNTRIES).map((c) => (
                  <option key={c} value={c} className="text-black">{COUNTRIES[c].flag} {c}</option>
                ))}
              </select>
            </div>
            <span className="text-xs text-stone-400">{num(total)} konsultanata{country === "Globalno" ? " · 60 zemalja" : ""}</span>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {view === "rules" && <RulesView country={country} published={published} onOpen={openRule} />}
          {view === "edit" && (
            <EditView ruleId={activeRule} country={country} draft={draft} published={published}
              setRule={setRule} dirty={dirty} onBack={() => setView("rules")} onNext={() => setView("simulate")} />
          )}
          {view === "simulate" && sim && (
            <SimulateView sim={sim} rollbackBanner={rollbackBanner}
              onBack={() => setView("edit")} onNext={() => setView("confirm")} />
          )}
          {view === "confirm" && sim && (
            <ConfirmView ruleId={activeRule} country={country} draft={draft} published={published}
              sim={sim} onBack={() => setView("simulate")} onPublish={doPublish} />
          )}
          {view === "published" && sim && <PublishedView sim={sim} onDone={() => setView("rules")} />}
          {view === "history" && <HistoryView history={history} onBack={() => setView("rules")} onRollback={startRollback} />}
        </div>
      </div>
    </div>
  );
}

function StatusBadge({ draft }) {
  return draft ? (
    <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold" style={{ background: "#FBE5C8", color: "#8A5A00" }}>
      <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" /> NACRT — još ne važi
    </div>
  ) : (
    <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-emerald-100 text-emerald-700">
      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> AKTIVNO
    </div>
  );
}

function RuleButton({ rule, country, published, onOpen }) {
  const Icon = rule.icon;
  const promoOn = rule.id === "promo" && published.promo.active;
  const badge =
    rule.id === "plan" && country !== "Globalno" ? published.plan[country].split(" ")[0] + " " + published.plan[country].split(" ")[1]
    : rule.id === "risk" ? published.risk.pp + "pp · " + (published.risk.members / 1000) + "k"
    : null;
  return (
    <button onClick={() => onOpen(rule.id)}
      className="w-full text-left rounded-2xl border border-stone-200 bg-white p-4 hover:border-stone-300 transition shadow-sm flex items-center gap-3">
      <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: GOLD_SOFT }}>
        <Icon size={18} style={{ color: GOLD }} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="font-semibold text-stone-800 flex items-center gap-2">
          {rule.title}
          {promoOn && <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-emerald-100 text-emerald-700 font-medium">aktivna</span>}
        </div>
        <div className="text-xs text-stone-400 mt-0.5 truncate">{badge || rule.sub}</div>
      </div>
      <ChevronRight size={18} className="text-stone-300 shrink-0" />
    </button>
  );
}

function RulesView({ country, published, onOpen }) {
  const earn = RULES.filter((r) => r.group === "earn");
  const set = RULES.filter((r) => r.group === "set");
  return (
    <div className="p-5">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-stone-800">Pravila zarade</h2>
        <StatusBadge draft={false} />
      </div>
      <div className="space-y-2.5">
        {earn.map((rule) => <RuleButton key={rule.id} rule={rule} country={country} published={published} onOpen={onOpen} />)}
      </div>

      <h2 className="text-lg font-semibold text-stone-800 mt-6 mb-3">Podešavanja</h2>
      <div className="space-y-2.5">
        {set.map((rule) => <RuleButton key={rule.id} rule={rule} country={country} published={published} onOpen={onOpen} />)}
      </div>

      <div className="mt-5 flex items-center gap-2 text-xs text-stone-400">
        <ShieldCheck size={14} /> Svaka promena ide kroz simulaciju i potvrdu pre nego što počne da važi.
      </div>
    </div>
  );
}

function SliderRow({ label, code, sub, valueText, oldText, changed, children }) {
  return (
    <div>
      <div className="flex items-baseline justify-between mb-1.5">
        <div className="flex items-center gap-2 min-w-0">
          {code && <span className="text-[11px] font-semibold text-stone-500 w-7 shrink-0">{code}</span>}
          <span className="text-sm text-stone-700 truncate">{label}</span>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {changed && oldText && <span className="text-[11px] text-stone-400 line-through">{oldText}</span>}
          <span className="text-base font-bold tabular-nums" style={{ color: changed ? GOLD : "#44403c" }}>{valueText}</span>
        </div>
      </div>
      {children}
      {sub && <div className="text-[11px] text-stone-400 mt-1">{sub}</div>}
    </div>
  );
}

function EditView({ ruleId, country, draft, published, setRule, dirty, onBack, onNext }) {
  const rule = RULES.find((r) => r.id === ruleId);
  const range = (props) => <input type="range" {...props} className="w-full accent-amber-600" />;

  return (
    <div className="p-5">
      <button onClick={onBack} className="flex items-center gap-1 text-sm text-stone-500 mb-3"><ChevronLeft size={16} /> Pravila</button>
      <div className="flex items-center justify-between mb-1">
        <h2 className="text-lg font-semibold text-stone-800">{rule.title}</h2>
        <StatusBadge draft={true} />
      </div>
      <p className="text-xs text-stone-400 mb-5">{country} · {rule.sub}</p>

      <div className="space-y-5">
        {ruleId === "sales" && RANK_ORDER.map((r) => (
          <SliderRow key={r} code={r} label={RANK_NAME[r]} changed={draft.sales[r] !== published.sales[r]}
            valueText={pp(draft.sales[r])} oldText={pp(published.sales[r])}>
            {range({ min: 0, max: 60, step: 1, value: Math.round(draft.sales[r] * 100), onChange: (e) => setRule({ [r]: +e.target.value / 100 }) })}
          </SliderRow>
        ))}

        {ruleId === "recruit" && (
          <SliderRow label="Premija na prvu kupovinu" changed={draft.recruit.rate !== published.recruit.rate}
            valueText={pp(draft.recruit.rate)} oldText={pp(published.recruit.rate)}
            sub={`≈ ${eur(AFP * draft.recruit.rate)} po novom članu (prosečna prva kupovina €${AFP})`}>
            {range({ min: 0, max: 20, step: 1, value: Math.round(draft.recruit.rate * 100), onChange: (e) => setRule({ rate: +e.target.value / 100 }) })}
          </SliderRow>
        )}

        {ruleId === "manager" && (<>
          <SliderRow label="Stopa na L1 volumen" changed={draft.manager.rate !== published.manager.rate}
            valueText={pp(draft.manager.rate)} oldText={pp(published.manager.rate)}>
            {range({ min: 0, max: 20, step: 1, value: Math.round(draft.manager.rate * 100), onChange: (e) => setRule({ rate: +e.target.value / 100 }) })}
          </SliderRow>
          <SliderRow label="Prag aktivnosti (PSV/mes)" changed={draft.manager.gate !== published.manager.gate}
            valueText={eur(draft.manager.gate)} oldText={eur(published.manager.gate)}
            sub="Viši prag = manje kvalifikovanih menadžera (manji trošak), ali stroži uslov.">
            {range({ min: 0, max: 1500, step: 50, value: draft.manager.gate, onChange: (e) => setRule({ gate: +e.target.value }) })}
          </SliderRow>
        </>)}

        {ruleId === "differential" && (
          <SliderRow label="Diferencijalna stopa" changed={draft.differential.rate !== published.differential.rate}
            valueText={pp(draft.differential.rate)} oldText={pp(published.differential.rate)}
            sub="⚠ Osnovica (bruto vs. posle popusta) još nije finalno definisana u planu.">
            {range({ min: 0, max: 15, step: 1, value: Math.round(draft.differential.rate * 100), onChange: (e) => setRule({ rate: +e.target.value / 100 }) })}
          </SliderRow>
        )}

        {ruleId === "ranks" && ["TM", "SM", "DM", "RM"].map((r) => (
          <SliderRow key={r} code={r} label={"Prag za " + RANK_NAME[r]} changed={draft.ranks[r] !== published.ranks[r]}
            valueText={eur(draft.ranks[r])} oldText={eur(published.ranks[r])}>
            {range({ min: 200, max: 14000, step: 100, value: draft.ranks[r], onChange: (e) => setRule({ [r]: +e.target.value }) })}
          </SliderRow>
        ))}

        {ruleId === "promo" && (<>
          <div className="flex items-center justify-between rounded-2xl border border-stone-200 bg-white p-4">
            <div>
              <div className="font-medium text-stone-700">{draft.promo.label}</div>
              <div className="text-xs text-stone-400 mt-0.5">Period: {draft.promo.months}</div>
            </div>
            <button onClick={() => setRule({ active: !draft.promo.active })}
              className={"w-12 h-7 rounded-full transition relative " + (draft.promo.active ? "" : "bg-stone-300")}
              style={{ background: draft.promo.active ? GOLD : undefined }}>
              <span className={"absolute top-0.5 w-6 h-6 rounded-full bg-white shadow transition-all " + (draft.promo.active ? "left-[22px]" : "left-0.5")} />
            </button>
          </div>
          <SliderRow label="Garantovani minimum provizije" changed={draft.promo.targetRate !== published.promo.targetRate}
            valueText={pp(draft.promo.targetRate)} oldText={pp(published.promo.targetRate)}
            sub="Svako ko ima nižu prodajnu proviziju od ovog praga dobija boost tokom akcije.">
            {range({ min: 10, max: 50, step: 1, value: Math.round(draft.promo.targetRate * 100), onChange: (e) => setRule({ targetRate: +e.target.value / 100 }) })}
          </SliderRow>
        </>)}

        {ruleId === "discount" && RANK_ORDER.map((r) => (
          <SliderRow key={r} code={r} label={RANK_NAME[r]} changed={draft.discount[r] !== published.discount[r]}
            valueText={pp(draft.discount[r])} oldText={pp(published.discount[r])}>
            {range({ min: 0, max: 40, step: 1, value: Math.round(draft.discount[r] * 100), onChange: (e) => setRule({ [r]: +e.target.value / 100 }) })}
          </SliderRow>
        ))}

        {ruleId === "plan" && (
          country === "Globalno" ? (
            <div className="rounded-2xl border border-stone-200 bg-stone-50 p-4 text-sm text-stone-500">
              Plan se bira po konkretnoj zemlji. Izaberi zemlju gore (npr. Brazil) da promeniš njen marketing plan.
            </div>
          ) : (
            <div className="space-y-2.5">
              <p className="text-xs text-stone-400 -mt-2 mb-1">Koji marketing plan važi za {country}:</p>
              {PLANS.map((p) => {
                const active = draft.plan[country] === p;
                return (
                  <button key={p} onClick={() => setRule({ [country]: p })}
                    className={"w-full flex items-center justify-between rounded-2xl border p-4 text-left transition " + (active ? "bg-white" : "border-stone-200 bg-white hover:border-stone-300")}
                    style={active ? { borderColor: GOLD } : {}}>
                    <span className={"text-sm " + (active ? "font-semibold text-stone-800" : "text-stone-600")}>{p}</span>
                    <span className={"w-5 h-5 rounded-full border-2 flex items-center justify-center"} style={{ borderColor: active ? GOLD : "#d6d3d1" }}>
                      {active && <span className="w-2.5 h-2.5 rounded-full" style={{ background: GOLD }} />}
                    </span>
                  </button>
                );
              })}
              <div className="flex items-start gap-2 rounded-xl border border-amber-300 bg-amber-50 px-3 py-2.5 mt-1">
                <AlertTriangle size={15} className="text-amber-600 mt-0.5 shrink-0" />
                <span className="text-xs text-amber-800">Promena plana menja celu strukturu zarade za {country}.</span>
              </div>
            </div>
          )
        )}

        {ruleId === "risk" && (<>
          <SliderRow label="Prag skoka stope" changed={draft.risk.pp !== published.risk.pp}
            valueText={draft.risk.pp + " pp"} oldText={published.risk.pp + " pp"}
            sub="Promena stope veća od ovoga traži dvostruku potvrdu.">
            {range({ min: 1, max: 20, step: 1, value: draft.risk.pp, onChange: (e) => setRule({ pp: +e.target.value }) })}
          </SliderRow>
          <SliderRow label="Prag broja pogođenih" changed={draft.risk.members !== published.risk.members}
            valueText={num(draft.risk.members)} oldText={num(published.risk.members)}
            sub="Promena koja pogađa više konsultanata od ovoga traži dvostruku potvrdu.">
            {range({ min: 500, max: 30000, step: 500, value: draft.risk.members, onChange: (e) => setRule({ members: +e.target.value }) })}
          </SliderRow>
        </>)}
      </div>

      <button disabled={!dirty} onClick={onNext}
        className="mt-7 w-full py-3.5 rounded-xl font-semibold text-white transition disabled:opacity-40"
        style={{ background: dirty ? GOLD : "#a8a29e" }}>
        Simuliraj promenu
      </button>
      {!dirty && <p className="text-center text-xs text-stone-400 mt-2">Promeni bar jednu vrednost da nastaviš</p>}
    </div>
  );
}

function SimulateView({ sim, rollbackBanner, onBack, onNext }) {
  const increase = sim.deltaMonthly > 0;
  const flat = Math.round(sim.deltaMonthly) === 0;
  return (
    <div className="p-5">
      <button onClick={onBack} className="flex items-center gap-1 text-sm text-stone-500 mb-3"><ChevronLeft size={16} /> Izmena</button>
      {rollbackBanner && (
        <div className="mb-4 flex items-center gap-2 rounded-xl bg-stone-800 text-white px-3 py-2 text-xs">
          <RotateCcw size={14} style={{ color: GOLD }} /> Vraćanje na stanje od {rollbackBanner}
        </div>
      )}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-stone-800">Simulacija</h2>
        <StatusBadge draft={true} />
      </div>

      <div className="rounded-2xl p-4 mb-3" style={{ background: flat ? "#F5F5F4" : increase ? "#FEF2E7" : "#ECFDF5" }}>
        <div className="text-xs text-stone-500 mb-1">Δ ukupnih isplata {sim.period}</div>
        <div className="flex items-center gap-2">
          {!flat && (increase ? <TrendingUp size={22} className="text-orange-600" /> : <TrendingDown size={22} className="text-emerald-600" />)}
          <span className={"text-2xl font-bold " + (flat ? "text-stone-500" : increase ? "text-orange-700" : "text-emerald-700")}>
            {flat ? "€0" : (increase ? "+" : "−") + eur(Math.abs(sim.deltaMonthly))}
          </span>
        </div>
        <div className="text-xs text-stone-400 mt-1">{flat ? "nema neto promene troška" : increase ? "veći trošak provizija" : "ušteda na proviziji"} · procena</div>
      </div>

      <div className="grid grid-cols-2 gap-3 mb-4">
        {sim.stats.map((s) => <Stat key={s.l} label={s.l} value={s.v} />)}
      </div>

      {sim.note && (
        <div className="mb-4 flex items-start gap-2 rounded-xl border border-stone-200 bg-stone-50 px-3 py-2.5 text-xs text-stone-500">
          <AlertTriangle size={14} className="text-stone-400 mt-0.5 shrink-0" /> {sim.note}
        </div>
      )}
      {sim.risky && (
        <div className="mb-4 flex items-start gap-2 rounded-xl border border-amber-300 bg-amber-50 px-3 py-2.5">
          <AlertTriangle size={16} className="text-amber-600 mt-0.5 shrink-0" />
          <div className="text-xs text-amber-800"><b>Rizična promena.</b> Veliki obim ili veliki skok — pri objavljivanju je potrebna dvostruka potvrda.</div>
        </div>
      )}

      {sim.winners.length > 0 && <Section title="Najveći dobitnici" color="text-emerald-600">{sim.winners.map((m) => <MemberRow key={m.name} m={m} />)}</Section>}
      {sim.losers.length > 0 && <Section title="Najveći gubitnici" color="text-orange-600">{sim.losers.map((m) => <MemberRow key={m.name} m={m} />)}</Section>}
      {sim.winners.length === 0 && sim.losers.length === 0 && (
        <div className="text-center text-sm text-stone-400 py-6">Nema pojedinačnih efekata za prikaz.</div>
      )}

      <button onClick={onNext} className="mt-2 w-full py-3.5 rounded-xl font-semibold text-white" style={{ background: GOLD }}>Nastavi na objavljivanje</button>
      <p className="text-center text-xs text-stone-400 mt-2">Ništa još nije upisano — ovo je samo pregled.</p>
    </div>
  );
}

function Stat({ label, value }) {
  return (
    <div className="rounded-2xl border border-stone-200 bg-white p-3">
      <div className="text-xs text-stone-400">{label}</div>
      <div className="text-lg font-bold text-stone-800 tabular-nums">{value}</div>
    </div>
  );
}
function Section({ title, color, children }) {
  return (
    <div className="mb-4">
      <div className={"text-xs font-semibold mb-2 " + color}>{title}</div>
      <div className="rounded-2xl border border-stone-200 bg-white divide-y divide-stone-100">{children}</div>
    </div>
  );
}
function MemberRow({ m }) {
  const up = m.d > 0;
  return (
    <div className="flex items-center justify-between px-3 py-2.5">
      <div className="min-w-0">
        <div className="text-sm text-stone-700 truncate flex items-center gap-1.5">
          {m.jump ? (m.jump > 0 ? <ArrowUp size={13} className="text-emerald-600" /> : <ArrowDown size={13} className="text-orange-600" />) : null}
          {m.name}
        </div>
        <div className="text-[11px] text-stone-400">{m.meta} · {eur(m.before)} → {eur(m.after)}</div>
      </div>
      <div className={"text-sm font-semibold tabular-nums shrink-0 " + (up ? "text-emerald-600" : "text-orange-600")}>
        {up ? "+" : "−"}{eur(Math.abs(m.d))}
      </div>
    </div>
  );
}

function ConfirmView({ ruleId, country, draft, published, sim, onBack, onPublish }) {
  const [c1, setC1] = useState(false);
  const [c2, setC2] = useState(false);
  const ready = sim.risky ? c1 && c2 : c1;
  const increase = sim.deltaMonthly > 0;
  const flat = Math.round(sim.deltaMonthly) === 0;
  return (
    <div className="p-5">
      <button onClick={onBack} className="flex items-center gap-1 text-sm text-stone-500 mb-3"><ChevronLeft size={16} /> Simulacija</button>
      <h2 className="text-lg font-semibold text-stone-800 mb-1">Objavi promenu</h2>
      <p className="text-xs text-stone-400 mb-4">{country}</p>

      <div className="rounded-2xl border border-stone-200 bg-white p-4 mb-4">
        <div className="text-sm text-stone-700">{summarize(ruleId, draft, published)}</div>
        <div className="pt-2 mt-2 border-t border-stone-100 flex items-center justify-between text-sm">
          <span className="text-stone-500">Efekat {sim.period}</span>
          <span className={"font-bold " + (flat ? "text-stone-500" : increase ? "text-orange-700" : "text-emerald-700")}>
            {flat ? "€0" : (increase ? "+" : "−") + eur(Math.abs(sim.deltaMonthly))}
          </span>
        </div>
        <div className="flex items-center justify-between text-sm mt-1">
          <span className="text-stone-500">Pogođenih konsultanata</span>
          <span className="font-medium text-stone-800">{num(sim.affected)}</span>
        </div>
      </div>

      <div className="rounded-2xl border border-stone-200 bg-white p-4 mb-4">
        <div className="flex items-center gap-2 mb-2"><Bell size={15} style={{ color: GOLD }} /><span className="text-sm font-medium text-stone-700">Poruka članovima (pregled)</span></div>
        <div className="rounded-xl bg-stone-50 p-3 text-xs text-stone-600 leading-relaxed">„{notifText(country)}”</div>
      </div>

      <label className="flex items-start gap-2 mb-2 cursor-pointer">
        <input type="checkbox" checked={c1} onChange={(e) => setC1(e.target.checked)} className="mt-0.5 accent-amber-600" />
        <span className="text-sm text-stone-600">Razumem da ovo menja stvarne uslove zarade konsultantima.</span>
      </label>
      {sim.risky && (
        <label className="flex items-start gap-2 mb-2 cursor-pointer">
          <input type="checkbox" checked={c2} onChange={(e) => setC2(e.target.checked)} className="mt-0.5 accent-amber-600" />
          <span className="text-sm text-stone-600">Potvrđujem rizičnu promenu (veliki obim / veliki skok).</span>
        </label>
      )}

      <button disabled={!ready} onClick={onPublish}
        className="mt-4 w-full py-3.5 rounded-xl font-semibold text-white flex items-center justify-center gap-2 transition disabled:opacity-40"
        style={{ background: ready ? GOLD : "#a8a29e" }}>
        <Send size={17} /> Objavi i pokreni obračun
      </button>
    </div>
  );
}

function PublishedView({ sim, onDone }) {
  return (
    <div className="p-5 flex flex-col items-center text-center pt-10">
      <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center mb-4"><Check size={32} className="text-emerald-600" /></div>
      <h2 className="text-lg font-semibold text-stone-800">Promena je objavljena</h2>
      <div className="mt-2"><StatusBadge draft={false} /></div>
      <p className="text-sm text-stone-500 mt-4 max-w-xs">
        Novo pravilo važi od sada. Obračun za <b>{num(sim.affected)}</b> konsultanata radi se u pozadini — dobićeš izveštaj kad se završi.
      </p>
      <div className="w-full mt-5 rounded-2xl border border-stone-200 bg-white p-4 text-left text-xs text-stone-500 space-y-1.5">
        <div className="flex justify-between"><span>Upisano u plan (verzija)</span><span className="text-stone-700 font-medium">draft → published</span></div>
        <div className="flex justify-between"><span>Audit zapis</span><span className="text-stone-700 font-medium">Philip Z. · 16.06.2026</span></div>
        <div className="flex justify-between"><span>Notifikacija mreži</span><span className="text-stone-700 font-medium">zakazana</span></div>
        <div className="flex justify-between"><span>Rollback</span><span className="text-stone-700 font-medium">dostupan u Istoriji</span></div>
      </div>
      <button onClick={onDone} className="mt-6 w-full py-3.5 rounded-xl font-semibold text-white" style={{ background: GOLD }}>Gotovo</button>
    </div>
  );
}

function HistoryView({ history, onBack, onRollback }) {
  return (
    <div className="p-5">
      <button onClick={onBack} className="flex items-center gap-1 text-sm text-stone-500 mb-3"><ChevronLeft size={16} /> Nazad</button>
      <h2 className="text-lg font-semibold text-stone-800 mb-4">Istorija promena</h2>
      <div className="relative pl-5">
        <div className="absolute left-1.5 top-1 bottom-1 w-px bg-stone-200" />
        {history.map((h, i) => (
          <div key={h.id} className="relative mb-4">
            <span className="absolute -left-[14px] top-1.5 w-3 h-3 rounded-full border-2 border-white" style={{ background: i === 0 ? GOLD : "#d6d3d1" }} />
            <div className="rounded-2xl border border-stone-200 bg-white p-4">
              <div className="flex items-center justify-between">
                <span className="text-[11px] text-stone-400">{h.date}</span>
                <span className="text-[11px] text-stone-400">{h.who} · {h.country}</span>
              </div>
              <div className="text-sm text-stone-700 mt-1">{h.summary}</div>
              <div className="text-[11px] text-stone-400 mt-0.5">{h.delta > 0 ? "+" : h.delta < 0 ? "−" : ""}{eur(Math.abs(h.delta))} {h.period}</div>
              <button onClick={() => onRollback(h)}
                className="mt-2.5 flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg border border-stone-200 hover:bg-stone-50" style={{ color: GOLD }}>
                <RotateCcw size={13} /> Vrati na ovo stanje
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
