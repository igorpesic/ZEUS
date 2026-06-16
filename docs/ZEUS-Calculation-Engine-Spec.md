# ZEUS — Calculation Engine v0.2 — Plan-agnostic model

> **Modul:** Calculation Engine (nadgradnja Commission Engine v0.1)
> **Verzija:** v0.2 — 2026-06-07
> **Autor predloga:** Igor (Product Lead) uz Claude asistenciju
> **Revizor:** Čeda (Software Architect + QA) — donosi konačne tehničke odluke
> **Status:** Predlog. Sve podložno reviziji.
> **Povezano:** `ZEUS-Commission-Engine-Spec.md` (v0.1 — infrastruktura se prenosi), `ZEUS-Master-Brief.md`, `ZEUS-Calculation-Engine.svg`

---

## 0. Zašto v0.2 — problem dva plana

v0.1 je modelovao **P11 (2019)**: 6 rangova, SC/MSC/RMC/MC/DSC, downline L1–L10. U međuvremenu je pronađen **noviji plan — "Zepter Club Live 100" (2020)**: 5 rangova, 5 mehanizama zarade, bez dubokih nivoa (diferencijal samo na L1, dubina kroz trajnu vezu regruter↔regrut). Plus, Philip želi **sam da menja i ažurira kalkulacije**.

**Zaključak: ne biramo plan — pravimo engine kome je marketing plan PODATAK, ne kod.** Oba plana (i svaki budući koji Philip smisli) su redovi u bazi. Time pitanje "koji plan važi" prestaje da blokira development.

---

## 1. Ključni princip: 5 računskih primitiva

Engine ne zna ni za P11 ni za Live 100. Zna za **5 primitiva** — malih, čistih (pure) funkcija. Svako pravilo svakog plana je kombinacija: **primitiv + osnovica + stopa/tabela + uslovi + scope**.

| # | Primitiv | Live 100 (2020) | P11 (2019) |
|---|----------|-----------------|------------|
| 1 | **PERSONAL_RATE** — % na sopstvenu kupovinu/prodaju | lični popust do 10/20%; prodajna provizija 20–40% po rangu | SC 10–30% po PSV pragu |
| 2 | **EVENT_BONUS** — jednokratni okidač | regrutna premija do 8% na **prvu** kupovinu novog člana | — |
| 3 | **LEVEL_RATE** — % na volumen nivoa L downline-a | menadžerska provizija do 8% na kasnije kupovine regruta (L1, uslov: aktivan) | RMC ~8% (L1); MC 0.3–8% (L1–L10) |
| 4 | **DIFFERENTIAL** — razlika moje i tuđe stope | menadžerska diferencijalna na L1 prodaju | DSC (formula otvorena) |
| 5 | **GATE / MODIFIER** — uslov koji uključuje/menja pravilo | aktivnost >€500/mes; upiši 2 → 20% popust na tu kupovinu; upiši 10 → 20% trajno; stimulacija meseci III–V → svi 30% | PSV pragovi za SC |

Novi mehanizam u budućem planu = (najčešće) novi red u bazi; (retko) novi primitiv. Oba su lokalne promene.

---

## 2. Model podataka (delta u odnosu na v0.1)

Sve tabele su **append-only / temporalne** kao u v0.1 §2.3 (nema UPDATE — zatvori stari red, INSERT novi). Audit, change_set i rollback mehanika iz v0.1 §6–7 važe nepromenjeni.

### 2.1 `plan`
```
id, code (P11-2019 | LIVE100-2020 | ZEUS-V1 ...), name,
status ENUM (draft | published | retired), created_by, created_at
```
Imenovana verzija marketing plana. God Mode menja **draft**, nikad direktno published.

### 2.2 `plan_activation`
```
id, plan_id, country_code ('*' = globalno), valid_from, valid_to, change_set_id
```
Koja zemlja vozi koji plan od kada. Zemlja-specifično pobeđuje globalno (kao v0.1 §3.1).

### 2.3 `rank_ladder`
```
id, plan_id, code, level (1..N), name, qualification JSONB, valid_from/to, version
```
**Rangovi su config po planu, ne šifarnik** (promena u odnosu na v0.1 §2.2): Live 100 ima 5, P11 ima 6 — engine-u svejedno. ⚠️ Politika: da li Philip menja i kvalifikacije rangova ili samo stope? Tehnički v0.2 to omogućava.

### 2.4 `earning_rule` — srce sistema
```
earning_rule
---------------------------------------------------------------
id              UUID    PK
plan_id         UUID    FK → plan.id
rule_type       ENUM    PERSONAL_RATE | EVENT_BONUS | LEVEL_RATE | DIFFERENTIAL | GATE
base            ENUM    own_purchase | own_sales_volume | recruit_first_purchase |
                        recruit_volume | level_volume | differential_base
country_code    CHAR(2) '*' = default; zemlja override
rank_code       VARCHAR '*' = svi
level           SMALLINT NULL | 1..N (za LEVEL_RATE / DIFFERENTIAL)
rate            NUMERIC  flat stopa, ILI:
rate_table      JSONB    npr. {"CC":0.20,"TM":0.25,"SM":0.30,"DM":0.35,"RM":0.40}
conditions      JSONB    gates: {"min_monthly_psv":500} / {"trigger":"first_purchase"} ...
valid_from/to, version, change_set_id, created_by, created_at
```

**Primeri (Live 100 seed):**
```
-- prodajna provizija po rangu
rule_type=PERSONAL_RATE, base=own_sales_volume,
rate_table={"CC":.20,"TM":.25,"SM":.30,"DM":.35,"RM":.40}

-- regrutna premija na prvu kupovinu
rule_type=EVENT_BONUS, base=recruit_first_purchase, rate=.08,
conditions={"trigger":"first_purchase_of_direct_recruit"}

-- menadžerska na kasnije kupovine regruta (uslov aktivnosti)
rule_type=LEVEL_RATE, base=recruit_volume, level=1, rate=.08,
conditions={"min_monthly_psv":500}

-- stimulacija III–V: svi 30%
rule_type=GATE, conditions={"months":[3,4,5]},
effect={"override":{"PERSONAL_RATE.own_sales_volume":".30"}}
```
**Primer (P11):** `rule_type=LEVEL_RATE, base=level_volume, level=4, rate=.02, plan=P11-2019` — isti mehanizam, drugi red.

### 2.5 `commission_ledger`
Kao v0.1 §2.5, s tim da svaki red nosi **`rule_id` + verziju** (umesto config_id) → za svaki obračunati cent zna se tačno pravilo, plan i verzija.

---

## 3. Tok obračuna (runtime)

```
Trigger:  TransactionSettled │ kraj perioda │ ConfigChanged (recompute)
   ↓
1. Context loader   — član (zemlja, rang, status), transakcija/period,
                      downline graf (closure table, v0.1 §8.3), PSV
2. Rule Resolver    — aktivan plan za zemlju (plan_activation)
                      → pravila koja matchuju (rang, nivo, vreme)
                      → primeni GATE uslove (uključi/isključi/override)
3. Kalkulatori      — 5 primitiva, svaki čista funkcija (rule, context) → stavke
4. Aggregator       — kombinovanje (npr. 8% + 20% = 28%), capovi,
                      zaokruživanje, valuta
5. Ledger upis      — append-only, rule_id + verzija u svakom redu
```
Determinizam kao v0.1 §3.3: isti ulaz + isti plan snapshot → isti izlaz. Recompute = ponovi sa novim pravilima, stari redovi → `superseded`.

---

## 4. God Mode v2 — edit → simuliraj → objavi

Razlika u odnosu na v0.1 §4: ubačen **obavezan korak simulacije**. To je ono što čini realnim da Philip sam menja plan.

```
1. EDIT        Philip (telefon) menja stopu/prag/pravilo u DRAFT kopiji plana.
2. SIMULACIJA  Engine u dry-run modu nad snapshotom produkcije:
               - koliko članova pogođeno
               - Δ ukupnih isplata / mesec (procena troška promene)
               - top 10 dobitnika / gubitnika, pre/posle poređenje
               Bez upisa u ledger. ISTI kalkulatori — simulator ne košta novi kod.
3. PUBLISH     Sinhron upis < 2s: zatvori stari red, INSERT novi,
               change_set + audit (ko/kada/šta/zašto) → emit ConfigChanged.
4. PROPAGACIJA Async recompute pogođenog skupa (batch, v0.1 §8),
               notifikacije članovima, izveštaj Philipu kad run završi.
5. ROLLBACK    Jedan tap iz istorije (v0.1 §7) — promena unapred koja
               vraća staro stanje; prolazi isti simulacija→publish tok.
```
**Zaštite:** rizične promene (stopa ±X pp ili >N pogođenih) traže dvostruku potvrdu; opciono "publish zakazan za van špica" za globalne promene. ⚠️ Pragove definišu Igor + Philip.

---

## 5. Dijagram

`ZEUS-Calculation-Engine.svg` — ista semantika kao v0.4: **puna narandžasta = direktan upis** (God Mode piše ISKLJUČIVO u Plan Definition), **isprekidana zlatna = propagacija** (ConfigChanged → recompute → notifikacije), siva isprekidana = simulacioni dry-run krug.

---

## 6. Šta se prenosi iz v0.1 bez izmena

Event arhitektura (§5: outbox + LISTEN/NOTIFY za MVP), audit trail (§6), rollback (§7), performanse (§8: suženje pogođenog skupa, closure table, batch + idempotentnost, keš, izolacija od transakcionog puta). **v0.2 menja samo model pravila** (commission_config → plan/earning_rule primitivi) **i dodaje simulator.**

---

## 7. Zašto je ovo realno za dvočlani tim

- 5 kalkulatora = 5 malih čistih funkcija → trivijalno testabilno (golden testovi).
- **Nema rules-DSL / no-code engine-a** — primitivi pokrivaju oba poznata plana; to je svesna granica kompleksnosti.
- MVP = samo Postgres (bez Kafke), kao v0.1.
- Simulator = isti engine sa flagom `dry_run=true` — nije poseban sistem.
- Philip ne piše formule: UI mu nudi postojeća pravila sa slajderima/poljima + simulaciju. Strukturne promene (novi primitiv) ostaju dev posao.

---

## 8. Faze

1. **MVP:** `plan`/`earning_rule`/`rank_ladder` šeme; PERSONAL_RATE + EVENT_BONUS; Live 100 seed; jedna zemlja; God Mode edit + publish + rollback + audit; recompute sinhron na malom skupu.
2. **Faza 2:** LEVEL_RATE, DIFFERENTIAL, GATE; closure table; **simulator/preview**; async batch recompute; multi-country override; P11 seed kao test plan-agnostičnosti.
3. **Faza 3:** valute/FX, payout integracija, napredni pragovi rizika, skala (replike, particionisanje).

---

## 9. Otvorena pitanja

- **Philip:** potvrda da je Live 100 (2020) baseline za ZEUS (radna pretpostavka: jeste).
- **Philip + Igor:** menja li God Mode i rang lestvicu/kvalifikacije ili samo stope i pragove?
- **Plan:** osnovica diferencijala (bruto L1 prodaja ili posle popusta?); osnovica SC/MSC iz v0.1 §9 i dalje otvorena za P11 mod.
- **Čeda:** closure table vs materijalizovana putanja; event bus (outbox MVP → Kafka/NATS); da li GATE override ide kroz poseban red ili kolonu `effect`.
- **Valuta obračuna + FX trenutak** (blokira fazu 3, kao v0.1).

---

## Dodatak — rečnik tabela (delta)

| Tabela | Uloga |
|--------|-------|
| `plan` | Imenovane verzije marketing plana (draft/published/retired) |
| `plan_activation` | Koja zemlja vozi koji plan, od kada (append-only) |
| `rank_ladder` | Rangovi kao config po planu (5 ili 6 — svejedno engine-u) |
| `earning_rule` | Srce: pravilo = primitiv + osnovica + stopa/tabela + uslovi |
| `commission_ledger` | Kao v0.1, nosi `rule_id` + verziju |
| ostalo | `god_mode_change_set`, `audit_log`, `recompute_run` — nepromenjeno iz v0.1 |
