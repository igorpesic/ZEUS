# ZEUS — Commission Engine + God Mode — Tehnički Spec

> **Modul:** Commission Engine sa God Mode integracijom
> **Verzija:** v0.1 — 2026-06-05 (polazna tačka / predlog za projektovanje)
> **Autor predloga:** Igor (Product Lead) uz Claude asistenciju
> **Revizor:** Čeda (Software Architect + QA) — donosi konačne tehničke odluke
> **Status:** Predlog kako bi moglo da se napravi i radi. Sve podložno reviziji.
> **Povezano:** `ZEUS-Master-Brief.md`, `ZEUS-Ground-Zero-Plan.md`, `ZEUS-Architecture-v04-ceda.svg`

---

## 0. Kako čitati ovaj dokument

Ovo nije konačna arhitektura — to je polazni predlog koji Čeda uzima i projektuje dalje. Cilj je da damo dovoljno konkretan model (tabele, tok, eventi, granični slučajevi) da diskusija krene od nečeg opipljivog, a ne od prazne table. Sve odluke su uz **eksplicitne kompromise** i mesta označena ⚠️ su otvorena za Čedinu reviziju.

---

## 1. Zahtevi

### 1.1 Funkcionalni
- Obračunati 5 vrsta komisija (SC, MSC, RMC, MC, DSC) po pravilima koja su **config, ne kod**.
- Podržati 6 rangova: CM → LC → TM → SM → DM → RM.
- Pravila se razlikuju **po zemlji** i menjaju se preko **God Mode** panela u realnom vremenu.
- Cross-border downline obračun do **L10**.
- Svaka promena pravila → automatski recompute pogođenih članova + notifikacija.
- Pun audit trail i rollback.

### 1.2 Nefunkcionalni (ciljevi, ⚠️ potvrditi sa Čedom)
- **Skala:** 2M+ članova, downline graf do 10 nivoa.
- **God Mode primena:** percepcija "realtime" — potvrda promene < 2s; pun recompute pogođenog skupa asinhrono, sa progresom.
- **Tačnost:** obračun mora biti deterministički i ponovljiv (isti ulaz → isti izlaz).
- **Dostupnost:** obračun ne sme da obori transakcioni put (kupovinu).
- **Auditabilnost:** svaka izmena i svaki obračun rekonstruktivni unazad.

### 1.3 Ograničenja
- Dvočlani tim; bira se stack koji je održiv malim timom.
- P11 (pravila) je iz 2019 — **DSC formula još nije definisana** → Engine mora raditi i bez nje (feature flag po tipu komisije).

---

## 2. Data model

Predlog relacione šeme (PostgreSQL pretpostavka, ⚠️ Čeda potvrđuje bazu). Nazivi su ilustrativni.

### 2.1 `member`
```
member
---------------------------------------------------------------
id                UUID        PK
parent_id         UUID        FK → member.id   (sponzor / upline; NULL za root)
country_code      CHAR(2)     ISO zemlja (određuje koji config važi)
rank_id           SMALLINT    FK → rank.id     (trenutni rang)
status            ENUM        active | inactive | suspended
psv_current       NUMERIC     Personal Sales Volume (tekući mesec, denormalizovano)
joined_at         TIMESTAMPTZ
created_at        TIMESTAMPTZ
```
Indeksi: `parent_id` (obilazak downline-a), `country_code`, `rank_id`.

> **Downline graf:** `parent_id` daje stablo. Za brzo čitanje L1–L10 predlog je materijalizovana putanja ili closure table (vidi §8.3) — ⚠️ ključna Čedina odluka.

### 2.2 `rank`
```
rank
---------------------------------------------------------------
id          SMALLINT  PK
code        VARCHAR   CM | LC | TM | SM | DM | RM
level       SMALLINT  redosled (1..6) za poređenje "viši/niži rang"
name        VARCHAR
```
Rangovi su retki i stabilni — drže se kao šifarnik, ne kao config koji God Mode menja (⚠️ potvrditi: da li Philip menja granice rangova ili samo procente?).

### 2.3 `commission_config` — srce sistema
Svaki red je jedno pravilo. Engine **nikad nema procenat u kodu** — sve čita odavde.
```
commission_config
---------------------------------------------------------------
id              UUID        PK
commission_type ENUM        SC | MSC | RMC | MC | DSC
country_code    CHAR(2)     '*' = globalni default; specifična zemlja override-uje
rank_code       VARCHAR     na koji rang se odnosi ('*' = svi)
level           SMALLINT    za MC: nivo downline-a 1..10 (NULL ako nije primenjivo)
threshold_min   NUMERIC     donji prag (npr. PSV prethodnog meseca) ; NULL = bez praga
threshold_max   NUMERIC     gornji prag ; NULL = bez gornje granice
rate            NUMERIC     procenat/stopa (npr. 0.10 = 10%)
formula_ref     VARCHAR     opciono: referenca na imenovanu formulu (za DSC)
valid_from      TIMESTAMPTZ kada pravilo počinje da važi
valid_to        TIMESTAMPTZ NULL = aktuelno; postavlja se kad pravilo biva zamenjeno
version         INT         verzija u okviru iste (type,country,rank,level) kombinacije
created_by      UUID        ko je uneo (God Mode user / Philip)
created_at      TIMESTAMPTZ
change_set_id   UUID        FK → god_mode_change_set.id (grupiše izmene jedne akcije)
```
**Ključni princip — nema UPDATE, samo INSERT (append-only / temporal):** promena pravila ne menja postojeći red, već zatvara stari (`valid_to = now`) i ubacuje novi sa `version+1`. Ovo daje besplatan istorijat i čini rollback trivijalnim (vidi §6, §7).

Indeks za lookup: `(commission_type, country_code, rank_code, level, valid_from, valid_to)`.

### 2.4 `transaction`
```
transaction
---------------------------------------------------------------
id              UUID        PK
member_id       UUID        FK → member.id  (kupac / nosilac PSV-a)
amount          NUMERIC
currency        CHAR(3)
category        ENUM        product | hotel | yacht | plane | real_estate
country_code    CHAR(2)
occurred_at     TIMESTAMPTZ
status          ENUM        pending | settled | reversed
```

### 2.5 `commission_ledger` — rezultat obračuna
Append-only knjiga obračunatih komisija. Ovde Engine piše izlaz.
```
commission_ledger
---------------------------------------------------------------
id                UUID        PK
beneficiary_id    UUID        FK → member.id  (ko zarađuje)
source_member_id  UUID        ko je generisao volumen (za RMC/MC)
transaction_id    UUID        FK → transaction.id (NULL za period-based SC/MSC)
commission_type   ENUM        SC | MSC | RMC | MC | DSC
level             SMALLINT    nivo (za MC)
base_amount       NUMERIC     osnovica
rate_applied      NUMERIC     primenjena stopa
amount            NUMERIC     obračunata komisija
config_id         UUID        FK → commission_config.id (TAČNO pravilo korišćeno)
period            DATE        obračunski mesec
computed_at       TIMESTAMPTZ
recompute_run_id  UUID        FK → recompute_run.id
status            ENUM        active | superseded   (kod recompute-a stari red → superseded)
```
> **Zašto `config_id` u svakom redu:** svaki obračunati iznos zna tačno koje je pravilo (i koju verziju) koristio. To je temelj i audita i rollback-a.

---

## 3. Kako Engine čita config i obračunava

### 3.1 Config resolution (koje pravilo važi)
Za dati (tip komisije, zemlja, rang, nivo, trenutak):
1. Traži red gde `valid_from <= t < COALESCE(valid_to, ∞)`.
2. **Zemlja specifična pobeđuje globalni default** (`country_code = 'RS'` ima prednost nad `'*'`).
3. Ako ima više kandidata, najviša `version`.
4. Rezultat se kešira (vidi §8.4) po ključu `(type,country,rank,level,period)`.

### 3.2 Obračun po tipu

**SC — Sales Commission (10–30%, po PSV-u prethodnog meseca)**
```
psv = PSV člana za prethodni mesec
config = resolve(SC, member.country, member.rank, level=NULL, t)
        gde threshold_min <= psv <= threshold_max
SC = psv * config.rate        (ili po transakciji: amount * rate, ⚠️ potvrditi osnovicu)
```

**MSC — Managerial Sales Commission (20–40%, po tituli)**
```
config = resolve(MSC, country, member.rank, NULL, t)
MSC = managerial_base * config.rate
```
⚠️ definisati `managerial_base` (volumen tima vs. razlika u odnosu na downline).

**RMC — Recruiter Commission (~8% na L1 članove)**
```
za svakog direktnog (L1) recruita r:
  config = resolve(RMC, country, member.rank, level=1, t)
  RMC += volume(r, period) * config.rate
```

**MC — Managerial Commission (L1–L10 downline, 0.3–8%)**
```
za nivo L = 1..10:
  config = resolve(MC, country, member.rank, level=L, t)
  level_volume = Σ volume(svi članovi na nivou L u downline-u)
  MC += level_volume * config.rate
```

**DSC — Diferencijalna komisija** — ⚠️ formula nije definisana (P11 otvoreno). Engine drži `formula_ref` slot i feature flag; obračunava se tek kad pravilo postoji. Do tada se preskače bez greške.

### 3.3 Princip determinizma
Obračun za dati period i dati `config` snapshot uvek daje isti rezultat. Recompute = ponovi obračun nad istim ulazom sa novim config-om i upiši nove ledger redove (stari → `superseded`).

---

## 4. God Mode flow — korak po korak

Scenario: Philip sa telefona menja SC stopu za Brazil sa 12% na 15%.

```
1.  UI (mobilni God Mode panel)
    Philip bira: zemlja=BR, tip=SC, rang=*, nova stopa=15%, razlog="Q3 push BR"
    → vidi PREVIEW: koliko članova je pogođeno, procena promene isplata.

2.  POST /godmode/change  →  Config/God Mode Service
    (JEDINA tačka direktnog upisa u sistem — v0.4 dijagram)

3.  Validacija:
    - autorizacija (samo God Mode role)
    - granične provere (rate u dozvoljenom opsegu, npr. 0–100%)
    - zahteva se 'reason' (obavezno polje za audit)
    - opciono: korak potvrde za "rizične" promene (vidi §6.4)

4.  Upis u JEDNOJ transakciji:
    a) kreiraj god_mode_change_set (ko, kada, šta, zašto)
    b) zatvori stari commission_config red (valid_to = now)
    c) INSERT novi commission_config (version+1, change_set_id, created_by)
    d) INSERT audit_log zapis
    → COMMIT.  Philip dobija potvrdu < 2s.

5.  Emit event: ConfigChanged { change_set_id, country=BR, type=SC, affected_scope }

6.  Commission Engine (consumer):
    - odredi pogođeni skup članova (BR + SC relevantni)
    - pokrene recompute_run (asinhrono, batch — vidi §8)
    - upiše nove ledger redove, stare markira superseded

7.  Notification Service (consumer istog eventa):
    - notifikuje pogođene članove ("uslovi su ažurirani")
    - notifikuje Philipa kad recompute_run završi (sa rezimeom)

8.  Dashboard svakog pogođenog člana čita sveže ledger/cene.
```

Ključno: **korak 4 (upis) i koraci 6–7 (propagacija) su razdvojeni.** Upis je sinhron i brz; propagacija je asinhrona i otporna na opterećenje. Odgovara semantici v0.4 dijagrama (puna narandžasta = direktan upis; isprekidana zlatna = propagacija).

---

## 5. Event arhitektura

```
God Mode Panel
     │  (sync write)
     ▼
Config/God Mode Service ──INSERT──► commission_config (append-only)
     │                              audit_log
     │  emit
     ▼
[ ConfigChanged ] ──────────────► event bus (Kafka / NATS / Postgres-LISTEN, ⚠️ Čeda)
     │                                  │
     ├──────────────► Commission Engine (recompute consumer)
     │                     │ piše commission_ledger
     │                     └─ emit [ RecomputeCompleted ]
     │
     └──────────────► Notification Service (member + Philip notifikacije)
```

**Eventi (predlog):**
- `ConfigChanged { change_set_id, country, type, rank, scope, actor_id, ts }`
- `RecomputeStarted { run_id, change_set_id, affected_count, ts }`
- `RecomputeCompleted { run_id, processed, failed, duration, ts }`
- `TransactionSettled { transaction_id, member_id, ts }` — takođe okida obračun (redovan tok, ne God Mode).

**Garancije:** at-least-once isporuka + idempotentan consumer (recompute je idempotentan jer je deterministički i piše po `recompute_run_id`). Dead-letter queue za neuspele batch-eve.

⚠️ Izbor magistrale: za MVP je Postgres outbox + LISTEN/NOTIFY dovoljan i jednostavan za mali tim; Kafka/NATS kad skala to traži. Čedina odluka.

---

## 6. Audit trail

Svaka promena mora odgovoriti na **ko / kada / šta / zašto**.

### 6.1 `god_mode_change_set`
```
god_mode_change_set
---------------------------------------------------------------
id            UUID        PK
actor_id      UUID        KO (Philip / God Mode user)
reason        TEXT        ZAŠTO (obavezno)
scope         JSONB       ŠTA (zemlja, tip, rang, opseg)
created_at    TIMESTAMPTZ KADA
status        ENUM        applied | rolled_back
rollback_of   UUID        NULL ili FK → change_set koji ovaj poništava
```

### 6.2 `audit_log` (generalni, append-only, immutable)
```
audit_log
---------------------------------------------------------------
id            UUID
actor_id      UUID
action        VARCHAR     config.update | godmode.rollback | ...
entity        VARCHAR     commission_config
entity_id     UUID
before        JSONB       stanje pre
after         JSONB       stanje posle
change_set_id UUID
ts            TIMESTAMPTZ
```
- Tabela je **samo-INSERT**; nema UPDATE/DELETE (DB privilegije to forsiraju).
- `commission_config` je već temporalan (§2.3), pa je istorijat pravila ugrađen u sam podatak — `audit_log` je dodatni, čoveku-čitljiv sloj.

### 6.3 Šta se beleži
Svaka God Mode akcija, svaki recompute_run (sa brojem pogođenih i rezultatom), svaki rollback. Ledger redovi nose `config_id` → za svaki isplaćeni cent zna se tačno pravilo.

### 6.4 "Rizične" promene
Promene iznad praga (npr. stopa +X%, ili >N pogođenih članova) mogu zahtevati dodatnu potvrdu / dvostruki tap. ⚠️ Pragove definišu Igor + Philip.

---

## 7. Rollback mehanizam

Pošto je `commission_config` append-only i sve je grupisano po `change_set_id`, rollback je čista operacija.

### 7.1 Config rollback (vraćanje pravila)
```
1. Philip / admin bira change_set X za poništavanje (iz God Mode istorije).
2. Sistem kreira NOVI change_set (rollback_of = X):
   - za svako pravilo iz X: zatvori trenutni red (valid_to=now)
   - reaktiviraj prethodnu verziju kao novi red (version+1, vrednosti = stanje pre X)
3. Emit ConfigChanged → isti recompute + notify tok kao i obična promena.
4. change_set X.status = rolled_back.
```
Rollback je, dakle, **još jedna promena unapred** koja vraća staro stanje — ništa se fizički ne briše. Pun audit ostaje.

### 7.2 Ledger ispravka
Recompute nakon rollback-a ponovo obračuna pogođeni skup po vraćenom pravilu; prethodni ledger redovi → `superseded`. Pošto je obračun deterministički, rezultat je tačno staro stanje.

### 7.3 Granice
⚠️ Otvoreno (Čeda + Igor + Philip): šta ako su komisije iz pogrešnog pravila već **isplaćene**? Tada rollback obračuna ledger razliku (korekciju), ne tihu prepravku. Pravilo: isplaćeno se ne prepisuje — koriguje se sledećim obračunom.

---

## 8. Performanse — recompute na 2M+ članova

Najveći tehnički rizik. Cilj: God Mode promena se potvrdi odmah, a težak posao teče u pozadini bez obaranja sistema.

### 8.1 Razdvajanje upisa od obračuna
Upis pravila je O(1) i sinhron. Recompute je težak i **uvek asinhron** (§4 korak 6). Korisnik nikad ne čeka pun recompute.

### 8.2 Suženje pogođenog skupa (ne računaj sve)
Promena za BR/SC dira samo BR članove relevantne za SC — ne svih 2M. Engine prvo izračuna `affected set` filterom po zemlji/tipu/rangu, pa računa samo njih. Većina God Mode promena je lokalna (jedna zemlja).

### 8.3 Brz obilazak downline-a
`parent_id` rekurzija na 10 nivoa je skupa. Predlog: **closure table** ili materijalizovana putanja koja drži predak↔potomak + nivo, pa je "svi na nivou L ispod člana M" jedan indeksiran upit. ⚠️ Čedina ključna odluka (trade-off: brže čitanje vs. održavanje pri recruitingu).

### 8.4 Batch + paralelizacija
- Recompute u **batch-evima** (npr. 5–10k članova) preko worker pool-a.
- Idempotentno po `recompute_run_id` → bezbedan retry pojedinačnog batch-a.
- Progres se prati; Philip vidi "X/Y obrađeno"; po završetku `RecomputeCompleted`.

### 8.5 Keširanje config-a
Razrešena pravila (§3.1) se kešOiraju; keš se invalidira na `ConfigChanged` za pogođeni ključ. Obračun ne udara bazu za svako pravilo.

### 8.6 Izolacija od transakcionog puta
Recompute radi na zasebnim worker-ima / read-replikama gde je moguće, da težak obračun ne uspori kupovinu (write put). Ledger upisi idu kroz queue, ne inline sa kupovinom.

### 8.7 Procena opterećenja (gruba, ⚠️ validirati)
- Lokalna promena (jedna srednja zemlja, ~50k članova): minute, prihvatljivo.
- Globalna promena (`country='*'`, svi rangovi): worst case ceo skup → planirati kao retku, batch-ovanu, možda zakazanu operaciju van špica.

---

## 9. Granični slučajevi i otvorena pitanja za Čedu

- **Konkurentne God Mode promene** na isto pravilo → serijalizacija po `(type,country,rank,level)` ključu (optimistic version check).
- **Promena tokom recompute-a u toku** → novi `ConfigChanged` poništava/nadovezuje run? (predlog: otkaži tekući run za isti scope, pokreni novi).
- **Member promeni zemlju/rang** usred perioda → koji config važi za koji deo perioda? (predlog: po `occurred_at` transakcije).
- **DSC** — formula i osnovica (blokirano P11).
- **Osnovica SC/MSC** — PSV mesečno vs. po transakciji (potvrditi iz P11).
- **Granice rangova** — da li ih God Mode menja ili su fiksne?
- **Valute** — obračun u kojoj valuti, FX i zaokruživanje (povezano sa modelom isplate — blokira Fazu 2).
- **Event bus izbor** — Postgres outbox (MVP) vs. Kafka/NATS (skala).
- **Closure table vs. materijalizovana putanja** za downline.

---

## 10. Predlog faza implementacije (uskladiti sa Ground Zero planom)

1. **MVP:** `commission_config` + `member`/`rank`/`transaction` šeme; SC + osnovni MC; jedna zemlja; God Mode upis + audit + rollback; recompute sinhron na malom skupu.
2. **Faza 2:** RMC/MSC, cross-border downline (closure table), event bus + asinhroni batch recompute, više zemalja/valuta.
3. **Faza 3+:** DSC (kad P11 definiše), optimizacije skale, izolacija na replike, napredni God Mode pragovi.

---

## Dodatak — sažeti rečnik tabela

| Tabela | Uloga |
|--------|-------|
| `member` | Članovi + upline (`parent_id`), rang, zemlja, PSV |
| `rank` | Šifarnik 6 rangova (CM..RM) |
| `commission_config` | Append-only pravila (srce; God Mode piše ovde) |
| `transaction` | Prodaje/volumen |
| `commission_ledger` | Append-only rezultat obračuna (nosi `config_id`) |
| `god_mode_change_set` | Ko/kada/šta/zašto za svaku God Mode akciju |
| `audit_log` | Immutable before/after trag |
| `recompute_run` | Praćenje batch obračuna (progres, rezultat) |
