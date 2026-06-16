# ZEUS — Ground Zero Projektni Plan

> **Platforma:** ZEUS — *Zepter Ecosystem Unified System*
> **Klijent:** Zepter International (vlasnik: Philip Zepter)
> **Verzija dokumenta:** v0.1 — 2026-06-05
> **Autori:** Igor (Product Lead, UX/UI) + Čeda (Software Architect, QA)
> **Status:** Polazna tačka (ground zero) — planiranje i definicija scope-a
> ⚠️ Radni dokument. Svi podaci podložni su promenama — posebno Marketing Plan (P11, verzija 2019). Nije finalna dokumentacija.

---

## 0. Svrha ovog dokumenta

Ovo je jedinstvena referentna tačka koja sve što znamo o ZEUS-u prevodi u strukturiran plan: viziju, module, faze razvoja, otvorena pitanja i rizike. Namenjen je za deljenje sa Philipom i timom kako bismo se usaglasili oko obima pre nego što krenemo u feature spec-ove, arhitekturalne odluke i postavljanje repozitorijuma.

Plan ne donosi konačne odluke — on ih uokviruje. Sve označeno kao **otvoreno pitanje** čeka odluku Igora i Čede (uz Philipovo usaglašavanje gde je naznačeno).

---

## 1. Vizija i ciljevi

### 1.1 Vizija

ZEUS je jedna platforma koja spaja tri sloja koja nigde na svetu ne postoje zajedno:

1. **Luxury Members Club** — ekskluzivni članski svet sa rank-based privilegijama.
2. **Global Marketplace** — premium tržište (Zepter proizvodi + spoljni brendovi koje Philip lično odobrava).
3. **MLM Earning Network** — globalna mreža zarade koja povezuje, prati i nagrađuje članove kroz nivoe.

Referentno pozicioniranje: **Amex Centurion + Net-a-Porter + Quintessentially + Airbnb Luxe** — ali sa **MLM earning layerom** kao ključnim diferencijatorom kojeg konkurencija nema.

### 1.2 Strateški ciljevi

- **Aktivirati postojeću imovinu Zeptera** kroz jednu digitalnu tačku: proizvodi, hoteli, jahte, avion, nekretnine (>1.500.000 m²), 2M+ članova.
- **Pretvoriti članstvo u status i zaradu** — svaki rang vidi svoju cenu i ostvaruje komisije kroz mrežu.
- **Dati Philipu potpunu kontrolu u realnom vremenu** nad uslovima marketing plana, po zemlji, bez tehničke intervencije (God Mode).
- **Učiniti "biti na ZEUS listi" statusnim simbolom** za spoljne luksuzne brendove kroz quality gate koji Philip lično drži.

### 1.3 Principi proizvoda

- **Config, ne kod** — pravila zarade i cena su podaci u bazi, ne hardkod. Promena pravila ne znači deploy.
- **Globalno od prvog dana** — cross-border mreža i više zemalja/valuta/jezika su osnovna pretpostavka, ne naknadna.
- **Status kroz svaki dodir** — rang određuje cenu, pristup i doživljaj na svim kategorijama.
- **Jedna istina o komisiji** — Commission Engine je jedini izvor obračuna; ostali moduli ga čitaju, ne dupliraju logiku.

---

## 2. Moduli i komponente

Pregled svih modula sa odgovornošću, ključnim funkcijama i statusom. (Status se odnosi na ~60% urađenog dizajna/arhitekture; kod još ne postoji.)

### 2.1 Marketplace
**Šta radi:** Premium tržište sa dva tipa listinga.

- **Zepter Own** — Zepter je prodavac; partner zarađuje komisiju na ostvarenu prodaju.
- **External Partner Listings** — spoljni luksuzni brendovi koje **Philip lično odobrava** ("ZEUS worthy" quality gate); Zepter uzima % od prodaje, kupac dobija rank-based popust.
- Kategorije: proizvodi (cookware, medical, cosmetics…), hoteli, jahte, avion, nekretnine.
- Rank-based cene/popusti primenjuju se na sve kategorije.

**Zavisi od:** Commission Engine (komisija po prodaji), Rank-based Pricing, katalog/asset model.

### 2.2 Commission Engine
**Šta radi:** Srce platforme — obračunava sve komisije i drži pravila kao konfiguraciju.

- Svaki threshold, procenat i stopa je **config record u bazi**, ne hardkod.
- Podržava 5 vrsta komisija (SC, MSC, RMC, MC, DSC) i 6 rangova (CM→LC→TM→SM→DM→RM).
- Recompute na promenu konfiguracije (ConfigChanged event) i na transakcije.
- Pravila se mogu razlikovati po zemlji.

**Zavisi od:** Data model (member, rank, downline, transaction, commission config), God Mode (ulaz izmena), Cross-border Network (downline obuhvat).

### 2.3 God Mode Panel
**Šta radi:** Philipov kontrolni sloj — menja uslove marketing plana iz džepa.

- Philip jednim unosom sa mobitela menja uslove za bilo koju zemlju.
- Primena u **realnom vremenu** na sve pogođene članove, uz notifikaciju.
- Tok izmene: God Mode Panel → Config/God Mode Service → Commission Config Store → ConfigChanged event → recompute → Notification Service → članovi.
- **Config/God Mode Service je jedina tačka direktnog upisa** (jasno izolovana u arhitekturi v0.4).

**Zavisi od:** Commission Engine, Notification Service, Config Store, audit/log sloj (svaka izmena mora biti zabeležena).

### 2.4 Member Dashboard
**Šta radi:** Doživljaj člana — članski svet, kupovina, uvid u zaradu.

- Prikaz ranga, privilegija i rank-based cena na svim kategorijama.
- Kupovina kroz Marketplace.
- Lični uvid u komisije i status napredovanja ka sledećem rangu.
- Notifikacije (uključujući God Mode promene koje utiču na člana).

**Zavisi od:** Marketplace, Commission Engine (prikaz zarade), Rank-based Pricing, Notification Service.

### 2.5 Partner Portal
**Šta radi:** Radni prostor za partnere/prodavce i spoljne brendove.

- Upravljanje listinzima (za odobrene spoljne brendove).
- Uvid u ostvarenu prodaju i komisije.
- Onboarding spoljnih brendova kroz "ZEUS worthy" odobravanje (Philip kao finalni gate).

**Zavisi od:** Marketplace, Commission Engine, role/permission model, quality-gate workflow.

### 2.6 Cross-border Network
**Šta radi:** Globalni MLM sloj — mreža bez granica.

- Član u Srbiji recruituje člana u Brazilu, prati celu mrežu globalno i prima komisiju na sve nivoe (L1–L10).
- Vizualizacija downline-a i praćenje rasta mreže.
- Obračun komisija preko granica (valuta, poreske/pravne implikacije po zemlji — vidi rizike).

**Zavisi od:** Commission Engine, Data model (downline graf), compliance okvir po zemljama.

### 2.7 Presečne komponente (cross-cutting)
Nisu zaseban "modul" ali su nužne za sve gore navedeno:

- **Identitet i pristup** — autentikacija, role (član, partner, admin, Philip/God Mode), permisije.
- **Notification Service** — realtime obaveštenja (God Mode promene, komisije, statusi).
- **Audit & Log** — trag svake God Mode izmene i obračuna komisije.
- **Lokalizacija** — jezici, valute, formati po zemlji.
- **Plaćanja i isplate** — naplata na Marketplace-u i isplata komisija (model TBD).

---

## 3. Faze razvoja (MVP → Production)

Predlog faznog plana. Cilj je usko definisan MVP koji dokazuje srž (config-driven komisija + rank pricing + jedna zemlja), pa širenje. Trajanja su namerno izostavljena dok se ne potvrdi tim i scope — prioritet je redosled, ne datumi.

### Faza 0 — Temelji (Foundations)
- Postavljanje GitHub repozitorijuma i razvojnog okruženja.
- Finalizacija data modela (member, rank, downline, listing, commission config, transaction).
- Potvrda tech stacka i arhitekture (na osnovu v0.4 dijagrama).
- Potvrda/aktuelizacija Marketing Plana P11.

**Izlaz iz faze:** usaglašen data model + arhitektura + repo spreman.

### Faza 1 — MVP (dokaz srži)
Najmanji obim koji dokazuje da platforma rešava ključni problem.

- **Commission Engine** v1 — config-driven, podržava SC i osnovnu MC logiku; jedna zemlja.
- **Rank-based Pricing** na proizvodima (jedna kategorija za početak).
- **Member Dashboard** v1 — rang, cene, osnovni uvid u zaradu.
- **Marketplace** v1 — samo Zepter Own listinzi, proizvodi.
- **God Mode** v1 — izmena ključnih parametara za jednu zemlju, sa recompute i notifikacijom.
- **Identitet/role** — član + admin + God Mode.

**Izlaz iz faze:** član može da kupi proizvod po rang-ceni, ostvari komisiju, i Philip može da promeni parametar koji se odmah primeni.

### Faza 2 — Mreža i partneri
- **Cross-border Network** — recruiting i downline (L1–L10) preko granica.
- Sve vrste komisija (MSC, RMC, DSC) — uz potvrđeni P11.
- **Partner Portal** v1 — partneri vide prodaju i komisije.
- Proširenje kategorija (hoteli, pa ostalo).
- Više zemalja/valuta.

**Izlaz iz faze:** funkcionalna globalna mreža zarade sa više zemalja.

### Faza 3 — Luksuzni sloj i spoljni brendovi
- **External Partner Listings** + "ZEUS worthy" odobravanje (Philip gate).
- Pune kategorije: jahte, avion, nekretnine.
- Bogat Luxury Members Club doživljaj (privilegije, concierge nivo).
- Napredne God Mode mogućnosti (više parametara, više zemalja odjednom).

**Izlaz iz faze:** kompletna tri-pillar platforma.

### Faza 4 — Production hardening & scale
- Performanse i skaliranje (2M+ članova, globalni recompute).
- Compliance po zemljama (MLM regulativa, porezi, isplate).
- Sigurnost, audit, monitoring.
- Optimizacija i polish pred široko lansiranje.

**Izlaz iz faze:** production-ready platforma.

---

## 4. Otvorena pitanja (za razrešiti)

Pitanja koja Igor i Čeda treba da razreše pre ili tokom razvoja. Označeno: **[BLOKIRA]** = mora pre početka relevantne faze; **[U TOKU]** = može se razrešiti uz razvoj. Vlasnik = ko vodi odgovor.

### Proizvod / poslovno
- **[BLOKIRA]** Marketing Plan P11 — potvrditi ili aktuelizovati (verzija je iz 2019). *Vlasnik: Igor + Philip.* Blokira ceo Commission Engine.
- **[BLOKIRA]** MVP scope po pillaru — šta tačno ulazi u Members Club / Marketplace / MLM v1. *Vlasnik: Igor + Čeda.*
- **[U TOKU]** DSC (Diferencijalna komisija) — definisati formulu i pravila. *Vlasnik: Igor + Philip.*
- **[U TOKU]** Koje kategorije idu prve u rank-pricing (proizvodi → hoteli → ostalo)? *Vlasnik: Igor.*
- **[U TOKU]** Model "ZEUS worthy" odobravanja — kako tehnički teče Philipov gate za spoljne brendove? *Vlasnik: Igor.*
- **[U TOKU]** Tačan obuhvat i kvadratura nekretnina — Zepter Real Estate sajt navodi 380.000 m² (samo Srbija), brief kaže >1.500.000 m². Potvrditi tačan broj i da li je globalno ili po zemlji pre prezentacije Philipu. *Vlasnik: Igor + Philip.*
- **[U TOKU]** Integracija/migracija postojećeg Zepter Real Estate portfolija (zepterrealestate.rs, ~80 listinga, zastarela tehnologija) u ZEUS Marketplace real-estate kategoriju sa rank-based cenama. *Vlasnik: Igor + Čeda.*

### Tehnika / arhitektura
- **[BLOKIRA]** Data model — finalizovati entitete i veze (member, rank, downline, listing, commission config, transaction). *Vlasnik: Čeda.*
- **[BLOKIRA]** God Mode opseg upisa — da li God Mode piše ISKLJUČIVO u Config Store, ili može direktno da override-uje Pricing Service? (otvoreno iz v0.4 dijagrama). *Vlasnik: Čeda.*
- **[U TOKU]** Recompute strategija — kako se obračun radi na 2M+ članova bez degradacije (sync/async, batch/event)? *Vlasnik: Čeda.*
- **[U TOKU]** Tech stack i hosting — finalna potvrda. *Vlasnik: Čeda.*

### Pravno / compliance
- **[BLOKIRA pre Faze 2]** Pravni/compliance okvir za MLM po zemljama (cross-border legalnost, porezi, isplate). *Vlasnik: Igor + Philip + pravni tim Zeptera.*
- **[BLOKIRA pre Faze 2]** Model isplate komisija — koji provajder, kako KYC, kako isplata u 50+ zemalja. Bez rešenog modela isplate nema funkcionalne MLM mreže zarade. *Vlasnik: Čeda + Igor + Philip.*

---

## 5. Rizici i zavisnosti

### 5.1 Rizici

| # | Rizik | Uticaj | Verovatnoća | Ublažavanje |
|---|-------|--------|-------------|-------------|
| R1 | **P11 zastareo (2019)** — gradimo Commission Engine na netačnim pravilima | Visok | Srednja | Potvrditi P11 sa Philipom pre Faze 1; držati pravila kao config da izmene budu jeftine |
| R2 | **MLM legalnost po zemljama** — cross-border MLM je pravno osetljiv | Visok | Visoka | Rana pravna analiza po ključnim tržištima; dizajn koji dozvoljava gašenje/izmenu po zemlji |
| R3 | **Skala obračuna** — realtime recompute na 2M+ članova i L1–L10 mreži | Visok | Srednja | Event-driven arhitektura, async recompute, testovi opterećenja rano |
| R4 | **God Mode = jedna tačka upisa sa velikim dometom** — greška se širi globalno u realnom vremenu | Visok | Niska–Srednja | Audit log, potvrde/preview pre primene, mogućnost rollback-a |
| R5 | **Scope creep** — tri pillara u jednom proizvodu lako naraste | Srednji | Visoka | Strogi non-goals po fazi; svaki dodatak traži uklanjanje ili pomeranje roka |
| R6 | **Dvočlani tim + zavisnost od Philipa** — usko grlo za odluke | Srednji | Srednja | Jasna podela odluka (Igor=proizvod, Čeda=tehnika); grupisati pitanja za Philipa |
| R7 | **Reaktivacija pauziranog projekta** — ~60% dizajna možda zastarelo | Srednji | Srednja | Revizija postojećih artefakata na početku Faze 0 |
| R8 | **Isplate i plaćanja** — model još nije definisan, a kritičan je za MLM | Visok | Srednja | Rano istražiti provajdere; tretirati kao zaseban tok od Faze 2 |

### 5.2 Ključne zavisnosti

- **Commission Engine** je centralna zavisnost — Member Dashboard, Partner Portal, Cross-border Network i Marketplace svi zavise od njega.
- **Data model** blokira sve — bez finalizovanih entiteta nema Commission Engine-a.
- **P11 potvrda** blokira Commission Engine pravila.
- **Pravni okvir** blokira širenje Cross-border mreže (Faza 2).
- **God Mode** zavisi od Config Store + Notification Service + audit sloja.
- **Eksterna zavisnost:** Philipova dostupnost za P11, "ZEUS worthy" gate i pravna pitanja.

---

## 6. Sledeći koraci

1. **Sastanak za usaglašavanje** ovog plana (Igor + Čeda), pa prezentacija Philipu.
2. Razrešiti dva **[BLOKIRA]** pitanja koja otključavaju sve: potvrda P11 i finalizacija data modela.
3. Definisati precizan MVP scope po pillaru (Faza 1).
4. Postaviti GitHub repo i razvojno okruženje (Faza 0).
5. Pretvoriti svaki MVP modul u feature spec (PRD).

---

## Dodatak A — Referentni artefakti

- `ZEUS-Master-Brief.md` — izvorni brief (ground zero, v0.1).
- `ZEUS-Architecture.svg` (v0.3) — prezentacioni dijagram za Philipa i stakeholdere.
- `ZEUS-Architecture-v04-ceda.svg` (v0.4) — inženjerski dijagram (direktan upis vs. propagacija) za Čedu.

## Dodatak B — Rečnik

| Termin | Značenje |
|--------|----------|
| **ZEUS** | Zepter Ecosystem Unified System |
| **P11** | Marketing plan (rang lestvica + komisije), verzija 2019 |
| **Rangovi** | CM → LC → TM → SM → DM → RM |
| **SC / MSC / RMC / MC / DSC** | Sales / Managerial Sales / Recruiter / Managerial / Diferencijalna komisija |
| **God Mode** | Philipov realtime kontrolni panel nad uslovima plana |
| **ZEUS worthy** | Quality gate za spoljne brendove (Philip lično odobrava) |
| **PSV** | Personal Sales Volume (osnova za SC) |
