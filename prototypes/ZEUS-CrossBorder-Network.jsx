import { useState, useMemo } from "react";
import { Crown, Users, Globe, TrendingUp, Info, Receipt, Link2, MapPin, ArrowDown, SlidersHorizontal, ChevronDown } from "lucide-react";

// ─────────────────────────────────────────────────────────────
// ZEUS — Međunarodna mreža (cross-border) · FE prototip, mock podaci
// KOMPLETAN TOK int. affiliate-a, od linka do neto isplate:
//
//  geo-link → prepozna lokaciju kupca → učita ŠOP te zemlje (katalog/cena/valuta/PDV)
//  → prodaja pripisana partneru (partner_key)
//  → provizija po STOPI (A = matična / B = zemlja prodaje)
//  → POREZ po zakonu ZEMLJE PRODAJE (withholding) + doplata do domaće stope (kredit)
//  → MODEL ISPLATE (lokalni entitet / centralni hub / direktno) → neto u matici.
//
// "RADNE PRETPOSTAVKE": sve neizvesno (override stope, porezi po zemlji, domaća
// stopa) je editabilno → simuliraj sad, realne brojke ubaci kad pravni/finansije
// potvrde. Engine ne izvršava transfer novca — to je Zepterova pozadina.
// ─────────────────────────────────────────────────────────────

const GOLD = "#B8923E";
const GOLD_SOFT = "#F3ECDD";

// Statički podaci o zemlji (ne menjaju se u simulaciji)
const META = {
  RS: { flag: "🇷🇸", name: "Srbija", personal: 0.25, cur: "RSD", sample: "175.000" },
  BR: { flag: "🇧🇷", name: "Brazil", personal: 0.30, cur: "R$", sample: "12.900" },
  US: { flag: "🇺🇸", name: "USA", personal: 0.35, cur: "$", sample: "2.290" },
  IT: { flag: "🇮🇹", name: "Italija", personal: 0.28, cur: "€", sample: "1.990" },
};
// Podrazumevane (žute) pretpostavke — editabilne u panelu
const DEFAULT_RATES = {
  RS: { override: 0.08, tax: 0.20 },
  BR: { override: 0.10, tax: 0.15 },
  US: { override: 0.12, tax: 0.30 },
  IT: { override: 0.09, tax: 0.22 },
};
const ROOT_COUNTRY = "RS";

const PAYOUT_MODELS = {
  local: { label: "Lokalni entitet", flow: (c) => `${c} entitet → (intercompany) → 🇷🇸 matični → tebi` },
  hub: { label: "Centralni hub", flow: (c) => `${c} → centralni hub 🇨🇭 → 🇷🇸 matični → tebi` },
  direct: { label: "Direktna isplata", flow: (c) => `${c} → direktno tebi (withholding), prijava 🇷🇸` },
};

const TREE = {
  id: "you", name: "Ti", country: "RS", rank: "RM", sales: 6000, root: true,
  children: [{
    id: "joao", name: "João Vinícius", country: "BR", rank: "DM", sales: 5000,
    children: [
      { id: "ana", name: "Ana Beatriz", country: "BR", rank: "SM", sales: 3000,
        children: [{ id: "carlos", name: "Carlos Menezes", country: "BR", rank: "TM", sales: 1500, children: [] }] },
      { id: "pedro", name: "Pedro Alves", country: "BR", rank: "SM", sales: 2800,
        children: [{ id: "mike", name: "Mike Carter", country: "US", rank: "TM", sales: 2000,
          children: [{ id: "sarah", name: "Sarah Lopez", country: "US", rank: "CC", sales: 900, children: [] }] }] },
    ],
  }],
};

const eur = (n) => "€" + Math.round(n).toLocaleString("de-DE");
const pp = (n) => Math.round(n * 100) + "%";

// Sve compute funkcije uzimaju `rates` (žute pretpostavke)
const grossToRoot = (n, rule, r) => n.sales * (rule === "A" ? r[ROOT_COUNTRY].override : r[n.country].override);
const srcTax = (n, rule, r) => grossToRoot(n, rule, r) * r[n.country].tax;
const homeTopUp = (n, rule, r) => grossToRoot(n, rule, r) * Math.max(0, r[ROOT_COUNTRY].tax - r[n.country].tax);
const netToRoot = (n, rule, r) => grossToRoot(n, rule, r) - srcTax(n, rule, r) - homeTopUp(n, rule, r);
const effTax = (country, r) => Math.max(r[country].tax, r[ROOT_COUNTRY].tax);
const personalComm = (n) => n.sales * META[n.country].personal;

const flatten = (node, depth = 0, acc = []) => { acc.push({ ...node, depth }); (node.children || []).forEach((c) => flatten(c, depth + 1, acc)); return acc; };

export default function ZeusCrossBorder() {
  const [rule, setRule] = useState("A");
  const [payout, setPayout] = useState("local");
  const [buyerGeo, setBuyerGeo] = useState("BR");
  const [rates, setRates] = useState(DEFAULT_RATES);
  const [showAssume, setShowAssume] = useState(false);

  const nodes = useMemo(() => flatten(TREE), []);
  const downline = nodes.filter((n) => !n.root);
  const setRate = (c, key, val) => setRates((r) => ({ ...r, [c]: { ...r[c], [key]: val } }));

  const t = useMemo(() => {
    const sum = (fn) => downline.reduce((s, n) => s + fn(n), 0);
    const o = {
      sales: sum((n) => n.sales),
      grossA: sum((n) => grossToRoot(n, "A", rates)), grossB: sum((n) => grossToRoot(n, "B", rates)),
      srcA: sum((n) => srcTax(n, "A", rates)), srcB: sum((n) => srcTax(n, "B", rates)),
      topA: sum((n) => homeTopUp(n, "A", rates)), topB: sum((n) => homeTopUp(n, "B", rates)),
      netA: sum((n) => netToRoot(n, "A", rates)), netB: sum((n) => netToRoot(n, "B", rates)),
      byCountry: {},
    };
    downline.forEach((n) => {
      const c = (o.byCountry[n.country] ||= { count: 0, sales: 0, netA: 0, netB: 0, grossA: 0, grossB: 0 });
      c.count++; c.sales += n.sales;
      c.netA += netToRoot(n, "A", rates); c.netB += netToRoot(n, "B", rates);
      c.grossA += grossToRoot(n, "A", rates); c.grossB += grossToRoot(n, "B", rates);
    });
    return o;
  }, [downline, rates]);

  const A = rule === "A";
  const gross = A ? t.grossA : t.grossB, src = A ? t.srcA : t.srcB, top = A ? t.topA : t.topB, net = A ? t.netA : t.netB;
  const saleCountries = [...new Set(downline.map((n) => n.country))];
  const dirty = JSON.stringify(rates) !== JSON.stringify(DEFAULT_RATES);

  return (
    <div className="min-h-screen w-full flex items-start justify-center py-8 px-4" style={{ background: "#100F0D" }}>
      <div className="w-full max-w-md rounded-3xl overflow-hidden shadow-2xl bg-stone-50 flex flex-col" style={{ minHeight: 760 }}>
        {/* App bar */}
        <div className="px-5 pt-5 pb-4 text-white" style={{ background: "linear-gradient(135deg,#1c1a16,#2b2720)" }}>
          <div className="flex items-center gap-2">
            <span className="text-xs tracking-[0.3em] font-semibold" style={{ color: GOLD }}>ZEUS</span>
            <span className="text-xs tracking-wide text-stone-400">· Međunarodni affiliate</span>
          </div>
          <div className="mt-1 flex items-center gap-1.5 text-stone-300">
            <Crown size={15} style={{ color: GOLD }} /><span className="text-sm font-medium">Tvoj pogled kao glavni mentor</span>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {/* 1) Geo-aware affiliate link */}
          <div className="px-5 pt-4">
            <SectionLabel n="1" text="AFFILIATE LINK (GEO-AWARE)" />
            <div className="rounded-2xl border border-stone-200 bg-white p-3">
              <div className="flex items-center gap-2 rounded-lg bg-stone-100 px-2.5 py-2">
                <Link2 size={14} className="text-stone-400 shrink-0" />
                <span className="text-xs text-stone-600 truncate">zeus.club/r/<b className="text-stone-800">IGOR-RS</b></span>
              </div>
              <div className="mt-2.5 flex items-center justify-between">
                <span className="text-xs text-stone-500 flex items-center gap-1"><MapPin size={13} /> Kupac otvara iz:</span>
                <select value={buyerGeo} onChange={(e) => setBuyerGeo(e.target.value)}
                  className="text-sm font-medium text-stone-800 bg-stone-100 rounded-lg px-2 py-1 outline-none cursor-pointer">
                  {Object.keys(META).map((c) => <option key={c} value={c}>{META[c].flag} {META[c].name}</option>)}
                </select>
              </div>
              <div className="mt-2.5 rounded-xl p-3" style={{ background: GOLD_SOFT }}>
                <div className="text-xs" style={{ color: "#8A5A00" }}>
                  Prepoznata lokacija → učitan <b>{META[buyerGeo].flag} {META[buyerGeo].name}</b> šop · valuta <b>{META[buyerGeo].cur}</b> · lokalni katalog, cene i PDV.
                </div>
                <div className="mt-1.5 flex items-center justify-between text-xs text-stone-600">
                  <span>Bioptron Hyperlight (primer)</span>
                  <span className="font-semibold tabular-nums">{META[buyerGeo].sample} {META[buyerGeo].cur}</span>
                </div>
                <div className="mt-1 text-[11px] text-stone-500">Prodaja se pripisuje tebi (IGOR-RS), ma gde kupac bio.</div>
              </div>
            </div>
          </div>

          {/* 2) Stopa A/B */}
          <div className="px-5 pt-4">
            <SectionLabel n="2" text="STOPA PROVIZIJE" />
            <div className="grid grid-cols-2 gap-1 p-1 rounded-xl bg-stone-200">
              {[["A", "Matična zemlja"], ["B", "Zemlja prodaje"]].map(([k, label]) => (
                <button key={k} onClick={() => setRule(k)}
                  className={"py-2 rounded-lg text-xs font-semibold transition " + (rule === k ? "bg-white shadow text-stone-800" : "text-stone-500")}>
                  <span className="inline-flex items-center justify-center w-5 h-5 rounded-full mr-1 text-white text-[10px]" style={{ background: rule === k ? GOLD : "#a8a29e" }}>{k}</span>{label}
                </button>
              ))}
            </div>
          </div>

          {/* 3) Model isplate */}
          <div className="px-5 pt-4">
            <SectionLabel n="3" text="MODEL ISPLATE" />
            <div className="flex gap-1 p-1 rounded-xl bg-stone-200">
              {Object.entries(PAYOUT_MODELS).map(([k, m]) => (
                <button key={k} onClick={() => setPayout(k)}
                  className={"flex-1 py-2 rounded-lg text-[11px] font-semibold transition " + (payout === k ? "bg-white shadow text-stone-800" : "text-stone-500")}>
                  {m.label}
                </button>
              ))}
            </div>
          </div>

          {/* Radne pretpostavke (žuto – editabilno) */}
          <div className="px-5 pt-4">
            <button onClick={() => setShowAssume((s) => !s)}
              className="w-full flex items-center justify-between rounded-2xl border px-4 py-3"
              style={{ borderColor: dirty ? GOLD : "#fcd9a8", background: "#FFFBF3" }}>
              <span className="flex items-center gap-2 text-sm font-semibold" style={{ color: "#8A5A00" }}>
                <SlidersHorizontal size={15} /> Radne pretpostavke {dirty && <span className="text-[10px] px-1.5 py-0.5 rounded-full text-white" style={{ background: GOLD }}>izmenjeno</span>}
              </span>
              <ChevronDown size={16} className={"text-amber-700 transition-transform " + (showAssume ? "rotate-180" : "")} />
            </button>
            {showAssume && (
              <div className="mt-2 rounded-2xl border border-stone-200 bg-white p-4 space-y-4">
                <p className="text-[11px] text-stone-500 -mt-1">
                  Sve neizvesno je ovde podesivo. Menjaj dok pravni/finansije ne potvrde realne brojke — sve ispod se preračunava uživo. Srbija „porez" = domaća stopa za doplatu/kredit.
                </p>
                {["RS", "BR", "US"].map((c) => (
                  <div key={c}>
                    <div className="text-sm font-medium text-stone-700 mb-1.5">{META[c].flag} {META[c].name}{c === ROOT_COUNTRY && <span className="text-[11px] text-stone-400"> · matična</span>}</div>
                    <MiniSlider label="override stopa" value={rates[c].override} max={20} onChange={(v) => setRate(c, "override", v)} />
                    <MiniSlider label="porez (withholding)" value={rates[c].tax} max={40} onChange={(v) => setRate(c, "tax", v)} />
                  </div>
                ))}
                {dirty && (
                  <button onClick={() => setRates(DEFAULT_RATES)} className="text-xs font-medium" style={{ color: GOLD }}>
                    ↺ Vrati na podrazumevano
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Summary */}
          <div className="px-5 pt-4 grid grid-cols-2 gap-3">
            <div className="rounded-2xl border border-stone-200 bg-white p-3">
              <div className="flex items-center gap-1.5 text-xs text-stone-400"><Users size={13} /> Mreža</div>
              <div className="text-lg font-bold text-stone-800">{downline.length} <span className="text-sm font-medium text-stone-400">osoba</span></div>
              <div className="text-[11px] text-stone-400 mt-0.5">prodaja {eur(t.sales)}/mes</div>
            </div>
            <div className="rounded-2xl p-3" style={{ background: GOLD_SOFT }}>
              <div className="flex items-center gap-1.5 text-xs" style={{ color: "#8A5A00" }}><TrendingUp size={13} /> Tebi NETO / mes</div>
              <div className="text-xl font-bold" style={{ color: GOLD }}>{eur(net)}</div>
              <div className="text-[11px] mt-0.5" style={{ color: "#8A5A00" }}>A {eur(t.netA)} · B {eur(t.netB)}</div>
            </div>
          </div>

          {/* 4) Lanac isplate */}
          <div className="px-5 pt-4">
            <SectionLabel n="4" text="LANAC ISPLATE" />
            <div className="rounded-2xl border border-stone-200 bg-white p-4">
              <ChainStep label="Bruto provizija" sub="zemlje prodaje" val={eur(gross)} />
              <ChainArrow />
              <ChainStep label="− Porez na izvoru" sub="withholding zemlje prodaje" val={"−" + eur(src)} neg icon={<Receipt size={12} />} />
              <ChainArrow note={PAYOUT_MODELS[payout].flow(saleCountries.map((c) => META[c].flag).join(""))} />
              <ChainStep label="− Doplata u matici" sub={top > 0 ? "do domaće stope, sa kreditom za strani porez" : "0 — strani porez ≥ domaći (kredit pokriva)"} val={top > 0 ? "−" + eur(top) : "€0"} neg={top > 0} />
              <ChainArrow />
              <ChainStep label="Neto partneru" sub="u matici (RSD)" val={eur(net)} gold big />
            </div>
          </div>

          {/* Po zemlji */}
          <div className="px-5 pt-4">
            <SectionLabel text="PO ZEMLJI PRODAJE" />
            <div className="rounded-2xl border border-stone-200 bg-white divide-y divide-stone-100">
              {Object.entries(t.byCountry).map(([c, d]) => (
                <div key={c} className="flex items-center justify-between px-3 py-2.5">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">{META[c].flag}</span>
                    <div>
                      <div className="text-sm text-stone-700">{META[c].name}</div>
                      <div className="text-[11px] text-stone-400">{d.count} osoba · {eur(d.sales)}/mes · porez efektivno {pp(effTax(c, rates))}</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-semibold tabular-nums" style={{ color: GOLD }}>{eur(A ? d.netA : d.netB)}</div>
                    <div className="text-[11px] text-stone-400">neto · bruto {eur(A ? d.grossA : d.grossB)}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Stablo */}
          <div className="px-5 pt-4 pb-6">
            <SectionLabel text="CELA STRUKTURA" icon={<Globe size={13} />} />
            <div className="space-y-1.5">{nodes.map((n) => <NodeRow key={n.id} n={n} rule={rule} rates={rates} />)}</div>

            <div className="mt-4 flex items-start gap-2 rounded-xl border border-amber-300 bg-amber-50 px-3 py-2.5 text-[11px] text-amber-800">
              <Info size={13} className="text-amber-600 mt-0.5 shrink-0" />
              Sve stope su radne pretpostavke (uredive gore). Stvarni cross-border porez (PDV vs. withholding, poreski ugovori, dvostruko oporezivanje, PE rizik) i intercompany model potvrđuje Zepterov pravni/poreski tim — usputno zamenjujemo pretpostavke realnim brojkama.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function SectionLabel({ n, text, icon }) {
  return (
    <div className="text-[11px] font-semibold text-stone-400 mb-1.5 tracking-wide flex items-center gap-1.5">
      {n && <span className="inline-flex items-center justify-center w-4 h-4 rounded-full bg-stone-300 text-white text-[9px]">{n}</span>}
      {icon}{text}
    </div>
  );
}

function MiniSlider({ label, value, max, onChange }) {
  return (
    <div className="flex items-center gap-2 mb-1.5">
      <span className="text-[11px] text-stone-500 w-28 shrink-0">{label}</span>
      <input type="range" min={0} max={max} step={1} value={Math.round(value * 100)}
        onChange={(e) => onChange(+e.target.value / 100)} className="flex-1 accent-amber-600" />
      <span className="text-xs font-semibold tabular-nums w-9 text-right" style={{ color: GOLD }}>{pp(value)}</span>
    </div>
  );
}

function ChainStep({ label, sub, val, neg, gold, big, icon }) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-1.5">
        {icon && <span className="text-stone-400">{icon}</span>}
        <div>
          <div className={"text-sm " + (gold ? "font-bold text-stone-800" : "text-stone-700")}>{label}</div>
          {sub && <div className="text-[11px] text-stone-400">{sub}</div>}
        </div>
      </div>
      <div className={"tabular-nums " + (big ? "text-lg font-bold" : "text-sm font-semibold") + " " + (neg ? "text-orange-600" : "")}
        style={gold ? { color: GOLD } : {}}>{val}</div>
    </div>
  );
}
function ChainArrow({ note }) {
  return (
    <div className="flex items-center gap-2 my-1.5">
      <ArrowDown size={13} className="text-stone-300 ml-1" />
      {note && <span className="text-[10px] text-stone-400 leading-tight">{note}</span>}
    </div>
  );
}

function NodeRow({ n, rule, rates }) {
  const m = META[n.country];
  const net = n.root ? 0 : netToRoot(n, rule, rates);
  return (
    <div className="flex items-center gap-2" style={{ paddingLeft: n.depth * 16 }}>
      {n.depth > 0 && <span className="text-stone-300 -mr-1">└</span>}
      <div className={"flex-1 flex items-center justify-between rounded-xl border p-2.5 " + (n.root ? "border-transparent" : "border-stone-200 bg-white")}
        style={n.root ? { background: "#2b2720" } : {}}>
        <div className="flex items-center gap-2 min-w-0">
          <span className="text-base">{m.flag}</span>
          <div className="min-w-0">
            <div className={"text-sm font-medium truncate flex items-center gap-1.5 " + (n.root ? "text-white" : "text-stone-800")}>
              {n.root && <Crown size={12} style={{ color: GOLD }} />}{n.name}
              {n.depth > 0 && <span className="text-[10px] text-stone-400">L{n.depth}</span>}
            </div>
            <div className="text-[11px] text-stone-400">{n.rank} · {eur(n.sales)} prodaja · provizija {eur(personalComm(n))}</div>
          </div>
        </div>
        {!n.root && (
          <div className="text-right shrink-0 pl-2">
            <div className="text-sm font-semibold tabular-nums" style={{ color: GOLD }}>→ {eur(net)}</div>
            <div className="text-[10px] text-stone-400">neto · −{pp(effTax(n.country, rates))} porez</div>
          </div>
        )}
      </div>
    </div>
  );
}
