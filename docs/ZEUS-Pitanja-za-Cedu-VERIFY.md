# ZEUS — Pitanja za Čedu · Faza VERIFY

> **Datum:** 2026-06-15 · **Za:** Čeda (Software Architect + QA) · **Od:** Igor (Product Lead)
> **Svrha:** Jedan dokument sa svim otvorenim/neverifikovanim stavkama izvučenim iz svih ZEUS spec-ova i Council review-a.
> **Pravilo verifikacije:** verifikaciju daju **Igor + Čeda**. **Philip se trenutno NE računa** — on daje input tek posle MVP faze. Stavke koje bi inače čekale Philipa rešavamo kao **radnu pretpostavku za MVP** (kolona "Radna pretpostavka"), Philip ih potvrđuje/koriguje kasnije.
>
> **Izvori:** Commission Engine Spec v0.1, Calculation Engine Spec v0.2, Ground Zero Plan, Council Review #01 i #02, Zepter Research, Master Brief.
> **Legenda:** 🔴 BLOKIRA MVP · 🟡 BLOKIRA Fazu 2 · ⚪ može uz razvoj

---

## 1. Data model i downline graf

| # | Pitanje | Predlog iz spec-a | Radna pretpostavka (MVP) | Prio |
|---|---------|-------------------|--------------------------|------|
| 1.1 | **Closure table vs. materijalizovana putanja** za downline (predak↔potomak + nivo). Trade-off: brže čitanje L1–L10 vs. održavanje pri recruitingu. | Closure table ili mat. putanja umesto `parent_id` rekurzije na 10 nivoa. | Closure table; za MVP (Live 100, samo L1) jeftino. | 🔴 |
| 1.2 | **Finalizacija data modela** — entiteti i veze: member, rank, downline, listing, earning_rule/commission_config, transaction, ledger. | Šeme date u oba spec-a. | Usvojiti v0.2 šeme (`plan`/`earning_rule`/`rank_ladder`) kao osnovu. | 🔴 |
| 1.3 | **Rangovi: config po planu vs. fiksni šifarnik.** v0.1 ih drži kao šifarnik (6 rangova), v0.2 kao config po planu (5 ili 6). | v0.2: `rank_ladder` config po planu. | Config po planu — engine-u svejedno koliko ih ima. | ⚪ |
| 1.4 | **Mapiranje rangova pri prelasku plan→plan (6→5).** Član ima rang iz plana sa 6 rangova, zemlja pređe na plan sa 5 — mapiranje nije definisano. | Nedefinisano (rupa u spec-u, Council #02). | Definisati mapping pravilo pre nego što multi-plan uđe u kod (Faza 2). | 🟡 |

---

## 2. God Mode — opseg upisa i simulacija

| # | Pitanje | Predlog iz spec-a | Radna pretpostavka (MVP) | Prio |
|---|---------|-------------------|--------------------------|------|
| 2.1 | **Opseg upisa God Mode-a** — piše ISKLJUČIVO u Config/Plan Definition, ili može direktno override Pricing Service? (otvoreno iz v0.4 dijagrama). | v0.2: piše isključivo u Plan Definition (draft), nikad direktno u published. | Isključivo u Plan Definition; propagacija ide async kroz ConfigChanged. | 🔴 |
| 2.2 | **Konzistencija snapshot-a za simulaciju.** Simulacija koja laže je gora od nikakve — preview mora pokazati isti rezultat kao stvarni obračun. | Isti kalkulatori + `dry_run=true`; isti snapshot podataka. | Specificirati garanciju konzistencije snapshot-a (Council #02 rizik #4). | 🟡 |
| 2.3 | **Recompute / simulacija na 2M+ članova.** Dry-run na celoj bazi nije izvodljiv na telefonu. | Suženi affected set + statistički uzorak. | MVP: simulacija na demo datasetu jedne zemlje; puna skala Faza 2. | 🟡 |
| 2.4 | **Pragovi rizičnih promena** (dvostruka potvrda: stopa ±X pp ili >N pogođenih). U spec-u označeno "Igor + Philip". | Dvostruka potvrda iznad praga; opciono publish van špica. | Igor + Čeda postavljaju radne pragove za MVP; Philip kalibriše posle. | ⚪ |

---

## 3. Calculation engine — interna semantika

| # | Pitanje | Predlog iz spec-a | Radna pretpostavka (MVP) | Prio |
|---|---------|-------------------|--------------------------|------|
| 3.1 | **GATE override semantika** — redosled primene gate-ova, konflikt dva gate-a nad istim pravilom, prioriteti. Mora biti deterministički PRE koda, inače determinizam pada. | Council #02: ide u spec kao novi paragraf, ne ostavlja se "Čeda će rešiti". | Igor + Čeda zajedno definišu deterministička pravila pre implementacije GATE-a. | 🔴 |
| 3.2 | **GATE override: poseban red ili kolona `effect`?** | Otvoreno (Calc spec §9). | Čedina odluka o implementaciji. | 🟡 |
| 3.3 | **Hipoteza "5 primitiva pokriva 100% klauzula oba plana"** — nepotvrđena; spec daje primere, ne kompletno mapiranje. | Council #02 uslov #1: mapping tabela klauzula red-po-red. | Igor (+Claude) izvlači mapping; rezultat → spec v0.3 → Čeda na reviziju. | 🔴 |
| 3.4 | **Recompute strategija** na 2M+ članova bez degradacije (sync/async, batch/event). | Worker-i / read-replike; ledger kroz queue, ne inline. | MVP: sync na malom skupu; async batch Faza 2. | ⚪ |
| 3.5 | **Konkurentne God Mode promene** na isto pravilo. | Serijalizacija po `(type,country,rank,level)` ključu, optimistic version check. | Usvojiti predlog. | 🟡 |
| 3.6 | **Promena tokom recompute-a u toku.** | Predlog: otkaži tekući run za isti scope, pokreni novi. | Usvojiti predlog. | 🟡 |
| 3.7 | **Član promeni zemlju/rang usred perioda** — koji config važi za koji deo perioda? | Predlog: po `occurred_at` transakcije (period split). | Usvojiti predlog. | ⚪ |
| 3.8 | **Rollback posle isplate** — šta ako su komisije iz pogrešnog pravila već isplaćene? U spec-u "Čeda + Igor + Philip". | Isplaćeno se ne prepisuje — koriguje se sledećim obračunom (ledger korekcija). | Igor + Čeda usvajaju pravilo korekcije; treba eksplicitan test scenario. | 🟡 |

---

## 4. Infrastruktura / event arhitektura

| # | Pitanje | Predlog iz spec-a | Radna pretpostavka (MVP) | Prio |
|---|---------|-------------------|--------------------------|------|
| 4.1 | **Izbor event magistrale** — Postgres outbox + LISTEN/NOTIFY (MVP) vs. Kafka/NATS (skala). | Outbox/LISTEN-NOTIFY za mali tim u MVP. | Postgres outbox za MVP; Kafka/NATS kad skala traži. | ⚪ |
| 4.2 | **Tech stack i hosting** — finalna potvrda. | PostgreSQL pretpostavka. | Čedina potvrda baze i hostinga. | ⚪ |
| 4.3 | **Procena opterećenja** — lokalna promena (~50k članova) = minute; globalna (`country='*'`) = worst case ceo skup. | Gruba procena, treba validirati. | Validirati brojke pre Faze 2; globalne promene kao retka, zakazana batch operacija. | 🟡 |
| 4.4 | **Nefunkcionalni ciljevi** (latencija obračuna, throughput, SLA) — u spec-u označeno "potvrditi sa Čedom". | Ciljevi navedeni u Commission spec §1.2. | Čeda potvrđuje/koriguje NFR ciljeve. | ⚪ |

---

## 5. Formula gaps (bivše "Plan/Philip" stavke → sada radna pretpostavka)

> Ovo su pitanja koja bi inače rešio Philip / važeći marketing plan. Pošto Philip dolazi posle MVP-a, **držimo ih kao slot + feature flag** — engine ih preskače bez greške dok pravilo ne postoji.

| # | Pitanje | Status | Radna pretpostavka (MVP) | Prio |
|---|---------|--------|--------------------------|------|
| 5.1 | **DSC — Diferencijalna komisija** — formula i osnovica nisu definisane (P11 otvoreno). | Blokirano planom. | `formula_ref` slot + feature flag; obračun se preskače dok pravilo ne postoji. Van MVP scope-a. | 🟡 |
| 5.2 | **Osnovica diferencijala** — bruto L1 prodaja ili posle popusta? | Otvoreno. | Pretpostavka dokumentovana; potvrda posle MVP. | 🟡 |
| 5.3 | **Osnovica SC/MSC** — PSV mesečno vs. po transakciji. | Otvoreno (P11 mod). | Live 100 je MVP baseline → P11 osnovica nije na kritičnom putu. | ⚪ |
| 5.4 | **Live 100 (2020) kao baseline za ZEUS** — radna pretpostavka, nepotvrđena. | Pretpostavka. | Gradimo na Live 100; plan-agnostic engine svejedno apsorbuje promenu. | ⚪ |
| 5.5 | **Da li God Mode menja kvalifikacije rangova ili samo stope/pragove?** | Otvoreno (Igor + Philip). | MVP: samo stope/pragove; tehnički v0.2 omogućava i kvalifikacije. | ⚪ |
| 5.6 | **Valuta obračuna + FX trenutak + zaokruživanje.** | Blokira Fazu 3 (povezano sa payout modelom). | Van MVP; jedna zemlja / jedna valuta u MVP. | 🟡 |

---

## 6. Migracija i scope

| # | Pitanje | Status | Radna pretpostavka (MVP) | Prio |
|---|---------|--------|--------------------------|------|
| 6.1 | **Migracija postojećih ZepterClub članova** u ZEUS rang sistem (CM→RM) — mapiranje statusa i popusta. Migracioni zadatak, ne greenfield. | Otvoreno pitanje (Zepter Research). | Igor + Čeda definišu mapping; nije nužno u MVP ako MVP ide na demo datasetu. | ⚪ |
| 6.2 | **Migracija Zepter Real Estate portfolija** (~80 listinga, zastarela tehnologija) u Marketplace real-estate kategoriju sa rank-based cenama. | [U TOKU] Igor + Čeda. | Van MVP scope-a. | ⚪ |
| 6.3 | **MVP scope po pillaru** — šta tačno ulazi u Members Club / Marketplace / MLM v1. | [BLOKIRA] Igor + Čeda. | Council preporuka: earning-loop thin slice — jedna zemlja, jedna kategorija, prodajna provizija + regrutna premija, sandboxed God Mode preview. | 🔴 |
| 6.4 | **Payout / KYC model** za 50+ zemalja — provajder, KYC, isplata. Najteži neizgrađeni sistem; oblikuje ledger/data model već sada. | [BLOKIRA pre Faze 2] Čeda + Igor (+ Philip posle). | Van MVP; ali ledger/valuta dizajnirati tako da ne blokira kasniju integraciju. | 🟡 |
| 6.5 | **Kapacitet dvočlanog tima** vs. 4-fazna globalna platforma — ne postoji plan sekvenciranja. | Rizik R6 / Council #01. | Igor + Čeda: jasna podela (Igor=proizvod, Čeda=tehnika) + sekvenciranje po fazama. | ⚪ |

---

## 7. Šta je BLOKADA za start MVP-a (sažetak)

Pre prvog reda koda za MVP, Igor + Čeda treba da zaključe:

1. **1.1 / 1.2** — downline graf (closure table) + finalan data model.
2. **2.1** — God Mode piše isključivo u Plan Definition.
3. **3.1** — GATE override deterministička semantika (u spec pre koda).
4. **3.3** — mapping tabela klauzula (dokaz hipoteze "5 primitiva") → spec v0.3.
5. **6.3** — zaključen MVP scope (earning-loop thin slice, jedna zemlja).

Sve ostalo (🟡/⚪) može uz razvoj ili ulazi u Fazu 2/3.

---

## 8. Cross-border / International Affiliate (novo — iz diskusije Igor)

> **Model (radna odluka Igor):** partner se registruje u jednoj **matičnoj** zemlji, dobija globalni **`partner_key`** koji ga prati kroz sve nacionalne sisteme (preko ESB-a). Prodaje bilo gde; downline mu je globalan (vidi celu strukturu, i preko granica). **Stopa provizije = matična zemlja partnera (izbor A).** **Porez = uvek po zakonu zemlje prodaje** (withholding na izvoru), pa doplata do domaće stope uz kredit za strani porez. **Isplata u matičnoj zemlji/valuti.** ZEUS engine računa bruto + porez + neto; **ne izvršava transfer novca** — to je Zepterova postojeća pozadina (integraciona tačka).

### 8.1 Tehnika / proizvod — vlasnik: Čeda + Igor

| # | Pitanje | Radna pretpostavka | Prio |
|---|---------|--------------------|------|
| 8.1.1 | **`partner_key`** — globalni ID nosi `home_country` + `home_currency`; izdaje se jednom, ne menja se preko granice. | Centralni Partner Registry = izvor istine; nacionalne baze referenciraju ključ, ne kopiraju partnera. | 🟡 |
| 8.1.2 | **ESB integracija** — ključ + identitet se objavljuju svim nacionalnim bazama; svaka prodaja nosi `partner_key` + `sale_country`. | Centralni hub model (poklapa se sa „centralni clearing"). | 🟡 |
| 8.1.3 | **Geo-aware affiliate link** — link prepoznaje lokaciju kupca i **povlači datu sa šopa te zemlje** (katalog, cena, valuta, PDV, dostupnost), a prodaju i dalje pripisuje partneru (`partner_key`). | Geo-detekcija (IP/locale) → redirect na lokalni šop; atribucija kroz ključ u linku. | 🟡 |
| 8.1.4 | **Fallback** — šta ako zemlja kupca nema ZEUS/Zepter šop? (preusmeri na najbliži / globalni katalog?) | Definisati default tržište + poruku. | ⚪ |
| 8.1.5 | **Privatnost geo-detekcije** — saglasnost/koliko se čuva o lokaciji kupca (GDPR). | Minimalno: zemlja za rutiranje, bez trajnog profila bez pristanka. | ⚪ |
| 8.1.6 | **Kvalifikacija ranga cross-border** — globalni volumen partnera (sve zemlje) ili samo matični? | Globalni volumen sabran na `partner_key`, prag po matičnom planu. | 🟡 |

### 8.2 Finansije / pravni — vlasnik: Zepter finansije + pravni (posle MVP)

| # | Pitanje | Napomena | Prio |
|---|---------|----------|------|
| 8.2.1 | **Intercompany model / transfer pricing** — kako entitet zemlje prodaje prenosi proviziju matičnom entitetu (arm's-length, dokumentovano). | Zepter verovatno već ima model (posluje u 60 zemalja). ZEUS se prikačinje, ne izmišlja. | 🟡 |
| 8.2.2 | **Withholding + poreski ugovori** — porez na izvoru u zemlji prodaje + izbegavanje dvostrukog oporezivanja (kredit u matici). | U simulatoru: efektivno = max(stopa izvora, domaća stopa). Potvrditi realne stope. | 🟡 |
| 8.2.3 | **Permanent establishment (PE)** rizik — agresivna prodaja u stranoj zemlji može napraviti poreski nexus za firmu/partnera. | Pravna analiza po ključnim tržištima. | 🟡 |
| 8.2.4 | **PDV/GST na prodaju** — odvojeno od provizije, po zemlji prodaje. | Deo šopa te zemlje (vidi 8.1.3). | ⚪ |
| 8.2.5 | **Payout entitet + lokalni compliance** — koji entitet isplaćuje partneru, KYC/AML, da li partner mora biti registrovan / izdaje fakturu; FX trenutak. | Vezano za 6.4 (payout/KYC). | 🟡 |
| 8.2.6 | **Model isplate** — lokalni entitet / centralni hub / direktna prekogranična isplata. | Simulator pokazuje sva tri; Zepter bira po postojećoj praksi. | 🟡 |
