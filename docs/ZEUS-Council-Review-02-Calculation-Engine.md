# ZEUS — Council of Five Review #02 — Calculation Engine v0.2

> **Datum:** 2026-06-07 · **Predmet:** `ZEUS-Calculation-Engine-Spec.md` (v0.2) + `ZEUS-Calculation-Engine.svg`
> **Format:** Council of Five protokol · **Prethodni:** Review #01 (ceo projekat)

---

## 1. Odluka koja se razmatra

Usvojiti **plan-agnostic Calculation Engine v0.2** — marketing plan kao podatak, 5 računskih primitiva (PERSONAL_RATE, EVENT_BONUS, LEVEL_RATE, DIFFERENTIAL, GATE/MODIFIER), rangovi kao config, God Mode tok edit → obavezna simulacija → publish → rollback — kao osnovu za Čedinu tehničku reviziju i dalji development.

---

## 2. Pozicije pet eksperata

### Product Strategist — ZA, uz korekciju faza
Plan-agnostic pristup **skida blokadu "koji plan važi"** sa kritičnog puta — development ne čeka Philipovu potvrdu, a potvrda i dalje ostaje potrebna kao poslovna odluka. Simulacija je direktan odgovor na Philipovu želju i najjači prodajni momenat projekta. **Prigovor:** simulacija je u fazi 2, a ona je Philipov "wow" — demo bez simulacije ne prodaje viziju. Povući simulaciju u MVP, makar na demo datasetu jedne zemlje.

### UX/UI Expert — ZA, uz uslov da primitivi ne cure u UI
Philip nije tehničar. U God Mode panelu **ne sme da vidi `rule_type` enum** — vidi "provizija za Brazil: 20% → 25%". Pet primitiva su implementacioni detalj; UI mora ostati na nivou poslovnih pojmova. Simulacioni izveštaj (pogođeni, Δ isplata, top liste) je dobar mentalni model, ali treba jasno **draft vs published stanje** (vizuelno nedvosmisleno "ovo još ne važi"). Dvostruka potvrda za rizične promene ne sme postati friction koji ga tera da zaobilazi sistem. Posebna pažnja: **notifikacija članovima o promeni uslova** — masovna poruka mreži može izazvati paniku; UX copy je tu produkt, ne detalj.

### Technical Architect — ZA, uz dva tehnička uslova
Pet čistih funkcija + append-only + nasleđena v0.1 infrastruktura = održivo za dvočlani tim; ovo je prava granica kompleksnosti (bez rules-DSL-a). **Uslov 1 — GATE je najopasniji primitiv:** `override` semantika je mini-DSL na mala vrata. Redosled primene gate-ova, konflikt dva gate-a nad istim pravilom, prioriteti — mora biti deterministički specificirano **pre koda**, inače determinizam (§3) pada. **Uslov 2 — simulacija na 2M članova nije besplatna:** dry-run mora raditi na suženom affected setu + statističkom uzorku, ne celoj bazi, da bi bila brza na telefonu. Sitnice: validacija `rate_table` JSONB šeme (svi rangovi pokriveni?); prelazak zemlje s plana A na plan B usred meseca → period split po `occurred_at` (analogno v0.1 §9).

### QA / Risk Analyst — USLOVNO ZA
Najveći rizik: **kombinatorna test matrica** (5 primitiva × gates × zemlje × rangovi × planovi). Mitigacija postoji u spec-u — P11 seed kao test plan-agnostičnosti (faza 2) — formalizovati kao **golden test suite**: oba plana kao fixture, poznati ulazi → poznati izlazi. Drugi rizik: **simulacija koja laže je gora od nikakve** — ako preview kaže Δ +50k a stvarnost bude +500k, Philipovo poverenje je nepovratno izgubljeno; identičan kod (jeste, dry_run flag) + identičan snapshot podataka (specificirati konzistenciju). Treći — **rupa u spec-u:** član ima rang iz plana sa 6 rangova, zemlja pređe na plan sa 5 — mapiranje rangova između planova nije definisano. Četvrti: rollback nakon isplate — pravilo "koriguje se, ne prepisuje" postoji (v0.1 §7.3), ali treba eksplicitan test scenario.

### Skeptical Decision Reviewer — NIJE PROTIV, ali traži dokaz hipoteze
Glavno pitanje: **da li plan-agnostic rešava problem ili ga elegantno odlaže?** Najjeftinija alternativa je da Philip potvrdi plan — jedan sastanak. Protiv-argument koji drži: Philipova želja da menja plan znači da plan evoluira i POSLE potvrde — apstrakcija nije zbog izbora 2019/2020, nego zbog budućnosti. **Ali:** "5 primitiva pokriva oba plana" je hipoteza, ne činjenica. Spec daje primere, ne kompletno mapiranje. Niko nije prošao kroz SVE klauzule oba plana red po red. Ako i dve klauzule ne staju u primitive, model se lomi tamo gde je najskuplje — posle implementacije. Sporedna sumnja: "rangovi kao config" je možda YAGNI, ali cena je niska (tabela umesto enuma) — prihvatljivo.

---

## 3. Debata / neslaganja

- **Strategist vs Architect (simulacija u MVP?):** Architect prihvata — ako je engine čist, dry-run na malom datasetu je jeftin. Kompromis usvojen: simulacija ulazi u MVP na jednoj zemlji / demo datasetu, puna skala (affected set + uzorak) u fazi 2.
- **Skeptic vs Strategist (zašto ne samo potvrditi plan?):** Strategist: potvrda ostaje na agendi, ali plan-agnostic je čini ne-blokirajućom — development teče paralelno. Skeptic prihvata uz uslov da se hipoteza o primitivima dokaže mapiranjem pre koda.
- **QA vs Architect (GATE):** saglasni — GATE semantika (redosled, konflikti, prioritet) ide u spec kao novi paragraf pre Čedine revizije, ne ostavlja se "Čeda će rešiti".
- **UX vs svi:** niko nije adresirao God Mode UI u spec-u v0.2 — prihvaćeno kao poseban dokument (Igorov domen), ne proširenje tehničkog spec-a.

---

## 4. Ključni rizici i nepoznanice

| # | Rizik / nepoznanica | Težina | Vlasnik |
|---|---------------------|--------|---------|
| 1 | Hipoteza "5 primitiva pokriva 100% klauzula oba plana" — nepotvrđena | **Visoka** | Igor (+ Claude) |
| 2 | GATE override semantika (redosled, konflikti) nedefinisana | **Visoka** | Igor → Čeda |
| 3 | Mapiranje rangova pri prelasku plan→plan (6→5) nedefinisano | Srednja | Igor + Philip |
| 4 | Konzistencija snapshot-a za simulaciju (poverenje u preview) | Srednja | Čeda |
| 5 | Osnovica diferencijala / DSC formula | Srednja (F2) | Philip / plan |
| 6 | Valuta obračuna + FX | Niska (F3) | Čeda + Philip |
| 7 | UX God Mode panela — primitivi ne smeju u UI; notifikacije mreži | Srednja | Igor |

Činjenice: dva plana postoje i razlikuju se; Philip želi samostalnost; v0.1 infra je dizajnirana i prenosiva. Pretpostavke: Live 100 je baseline (nepotvrđeno); Philip menja samo stope/pragove, ne strukturu (nepotvrđeno).

---

## 5. Jedinstvena preporuka

**USVOJITI v0.2 kao pravac** — plan-agnostic model je ispravan odgovor na realnost dva plana i Philipovu želju za samostalnošću, a granica kompleksnosti (primitivi, bez DSL-a) je dobro postavljena za dvočlani tim. Usvajanje je **uslovno** — četiri stavke pre predaje Čedi / pre koda:

1. **Mapping tabela 100% klauzula** — svaka klauzula P11 i Live 100, red po red → primitiv + parametri. Ako sve staje, hipoteza dokazana; ako ne staje, jeftino smo saznali sada.
2. **GATE semantika u spec** — deterministički redosled primene, rešavanje konflikata, prioriteti (novi paragraf §3.x).
3. **Rang-mapiranje plan→plan** — pravilo za člana čiji rang ne postoji u novom planu (dodatak §2.3).
4. **Simulacija u MVP** — na demo datasetu jedne zemlje (revizija §8 faza); puna skala ostaje F2.

---

## 6. Preporučeni sledeći korak

Igor (uz Claude): izvući **mapping tabelu klauzula iz oba plana** (P11 2019 + Live 100 2020 PPT) — to je uslov #1 i ulaz za uslove #2 i #3. Rezultat ugraditi kao spec v0.3, pa tek onda → Čeda na tehničku reviziju.
