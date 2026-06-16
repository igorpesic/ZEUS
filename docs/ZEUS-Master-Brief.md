# ZEUS — Master Brief

> **Status dokumenta:** Polazna tačka (ground zero), v0.1 — 2026-06-05
> **Izvor:** Sećanje dvojice autora (Igor + Čeda), iz diskusija starih par godina.
> ⚠️ Svi podaci su podložni promenama, dopunama i korekcijama — posebno Marketing Plan (P11). Ovo nije finalna dokumentacija.

---

## 1. Klijent

**Zepter International** — globalna kompanija prisutna u desetinama zemalja.
- **Vlasnik / osnivač:** Philip Zepter
- **Kontakt:** direktan sa Philipom

---

## 2. Platforma

**Ime:** ZEUS — *Zepter Ecosystem Unified System*

**Vizija:** jedna platforma koja spaja tri sloja koji nigde na svetu ne postoje zajedno:

1. **Luxury Members Club**
2. **Global Marketplace**
3. **MLM Earning Network**

**Referentna poređenja:** Amex Centurion + Net-a-Porter + Quintessentially + Airbnb Luxe — ali sa dodatnim **MLM earning layerom** kao diferencijatorom.

---

## 3. Asset Portfolio (u vlasništvu Zeptera)

| Asset | Opis |
|-------|------|
| **Proizvodi** | Premium manufaktura — cookware, medical, cosmetics… |
| **Zepter Hotels** | Vlastita hotelska mreža |
| **Philip Zepter Yachts** | Vlastita flota jahti |
| **Privatni avion** | Vlastita flota |
| **Nekretnine** | Preko 1.500.000 m² u vlasništvu |
| **Membership** | 2M+ članova globalno |

Svi asseti su uključeni u rank-based pricing (vidi §6).

---

## 4. Marketplace Model

Dva tipa listinga:

**1. Zepter Own**
Zepter je prodavac. Partner zarađuje komisiju na ostvarenu prodaju.

**2. External Partner Listings**
Vanjski luxury brendovi koje **Philip lično odobrava** — "ZEUS worthy" quality gate.
- Biti na ZEUS listi je **statusni simbol** za brend.
- Zepter uzima **%** od ostvarene prodaje.
- Kupac dobija **rank-based popust**.

---

## 5. Marketing Plan — P11

> ⚠️ Zastareo (verzija 2019), podložan promenama. Okvirni podaci:

**6 titula (rang lestvica):**
CM → LC → TM → SM → DM → RM

**5 vrsta komisija:**

| Kod | Naziv | Opis |
|-----|-------|------|
| **SC** | Sales Commission | 10–30%, po PSV-u prethodnog meseca |
| **MSC** | Managerial Sales Commission | 20–40%, po tituli |
| **RMC** | Recruiter Commission | ~8% na L1 članove |
| **MC** | Managerial Commission | L1–L10 downline (0.3–8%) |
| **DSC** | Diferencijalna komisija | — |

**Rank-based popusti** važe za SVE kategorije (proizvodi, hoteli, jahta, avion, nekretnine).

---

## 6. Ključne karakteristike (Key Features)

**1. Commission Engine**
Svaki threshold, procenat i stopa je **config record u bazi** — nije hardkodiran u kodu. Omogućava izmene pravila bez deploy-a.

**2. God Mode Panel**
Philip jednim unosom sa mobitela menja uslove marketing plana za bilo koju zemlju. Primenjuje se u **realnom vremenu** na sve pogođene članove, uz notifikaciju.

**3. Cross-border Network**
Član u Srbiji recruituje člana u Brazilu, prati celu mrežu globalno i prima komisiju na sve nivoe.

**4. Rank-based Pricing**
Svaki rang automatski vidi svoju cenu na svim kategorijama.

---

## 7. Tehnički status

- ~**60%** dizajna i arhitekture urađeno.
- Projekat **pauziran**, sada se **reaktivira**.
- **Nema** još GitHub repo-a.

---

## 8. Tim

| Ko | Uloga | Odlučuje |
|----|-------|----------|
| **Igor** | Senior UX/UI Designer + Product Lead | Proizvodne / dizajn odluke |
| **Čeda** (Čedomir) | Software Architect + QA | Tehničke odluke |
| **Claude** | AI asistent | Ne donosi odluke samostalno — asistira |

---

## 9. Faza

**Trenutno:** planiranje, scope definicija, dokumentacija.
**Sledeće:** feature spec-ovi, arhitekturalne odluke, repo setup.

---

## 10. Otvorena pitanja (za razrešiti)

- [ ] Marketing Plan P11 — potvrditi/aktuelizovati (verzija je iz 2019).
- [ ] Definisati MVP scope po pillaru (Members Club / Marketplace / MLM).
- [ ] Data model — entiteti i veze (member, rank, downline, listing, commission config).
- [ ] DSC (Diferencijalna komisija) — definisati formulu/pravila.
- [ ] Pravni/compliance okvir za MLM po zemljama (cross-border).
