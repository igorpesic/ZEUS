# Prompt za Claude (Figma) — ZEUS Marketplace redizajn

> Nalepi ovo kao zadatak. Claude ima pristup celom Figma fajlu.

---

## Kontekst

Redizajniraš **ZEUS** — luksuzni members-club + globalni marketplace za **Zepter International**. Postojeći Figma fajl je **Zepter / BizzClub dizajn iz 2023** i služi kao osnova: zadrži strukturu, informacionu arhitekturu i prepoznatljiv Zepter brand, ali **modernizuj sve** — čist, minimalistički, savremen UX/UI (standardi 2025/26). Ne kopiraj 2023 1:1; podigni ga na današnji nivo.

Cilj: **obraditi sve ekrane/frejmove koji postoje u fajlu**, plus dodati nedostajuća stanja navedena niže, i isporučiti konzistentan design system.

---

## Brand & vizuelni pravac

Zadrži Zepter identitet, ali minimalistički i prozračno.

**Boje (kreiraj kao Variables/Styles):**
- Brand plava `#0E4DA4` — primarni akcenat, linkovi, aktivna stanja
- Navy `#13315C` — primarne CTA dugmad ("Dodajte u korpu")
- Amber `#F5B72E` — sekundarni akcenat (search dugme, promo hex badge, „do −40%")
- Sky `#EAF2FC` / `#D3E6FA` — svetli plavi tintovi, kategorijski krugovi, čipovi
- BizzClub plava `#1769C0` — cenovni/članski elementi
- Ink `#15202B` tekst; pozadina `#FBFCFE`; linije `rgba(0,0,0,0.06)`

**Tipografija:** moderan grotesk (Inter / Geist / sličan). Jasna skala (npr. 12/14/16/20/28/40), čvrst hijerarhijski kontrast, dosta praznog prostora.

**Stil:** radijusi 12–20px, meke senke (low-spread, plava nijansa), tanke linije, krupne fotografije proizvoda na belom, suzdržan UI chrome. Minimalno boja po ekranu — plava + amber kao akcenti, ostalo neutralno. Smanji 2023 „gustinu/boxy" osećaj.

**Stanja & motion:** definiši hover/focus/active/disabled za sve interaktivne elemente; suptilne tranzicije (150–200ms).

---

## Ključna mehanika koju UI mora da prikaže

**1. Cene po rangu (ZEUS nadogradnja BizzClub logike).**
- Default = **Gost** → prikaži **„MP Cena"** + teaser **„BizzClub · Učlanite se i kupite do −40%"** (najveći dostupan popust).
- **Rank switcher** (segmented/pills u headeru): Gost → BizzClub Member (−5%) → Club Consultant (−20%) → Team Manager (−28%) → Sales Manager (−34%) → District Manager (−40%). Promena ranga menja sve prikazane cene.
- Za ulogovan rang: prikaži cenu ranga (plavo) + precrtanu MP cenu + badge „−X%".
- Na PDP: **tabela svih rangova** sa cenom za svaki (max −40% označi kao „Max").
- Popusti su konfigurabilni — tretiraj kao podatak, ne hardkoduj vizuelno.

**2. International affiliate.**
- Lokacija/valuta selektor (Srbija ▾ / Eurozona / USA / Brazil) lokalizuje cenu i valutu (RSD baza). Kratka napomena: affiliate link prepoznaje lokaciju kupca i prikazuje cenu njegovog tržišta.

**3. Promo.** Žuti **heksagon −10%** badge na proizvodima u akciji (precrtana MP, sniženo).

---

## Ekrani za isporuku

Obradi **sve frejmove u fajlu**. Poznati ekrani (desktop + obavezno **mobilne** verzije):

1. **Home** — hero mozaik/grid promo pločica, „Izdvajamo iz ponude", kategorijski krugovi, „Promocije", newsletter, footer.
2. **Mega-menu „Sve kategorije"** — Zepter Shop / Marketplace tabovi, kartice kategorija sa krug-vizualima.
3. **Katalog (PLP)** — breadcrumb, kategorijski filteri (krugovi), sort/grid toggle, kartice proizvoda (wishlist heart, promo hex, slika, linija, SKU, MP Cena, BizzClub teaser, „Dodajte u korpu"), paginacija/„prikaži još".
4. **Detalj proizvoda (PDP)** — galerija sa thumbnailovima, info/buy kartica (kategorija tag, naziv, SKU, rejting, cena + rank tabela, isporuka, „Pošaljite kao poklon"), akordeoni **Dimenzije uređaja** / **Tehnički podaci** (spec tabela), „O proizvodu", „Slični proizvodi".
5. **Outlet** — aukcije: hero sa odbrojavanjem, kartice „Licitirajte" + „Kupite odmah bez licitacije", stanje proizvoda, ostvarena ušteda, filteri (Na stanju / Ograničena ponuda / Sve).
6. **BizzClub** — landing članstva: rangovi, pogodnosti, „do −40%", poziv na učlanjenje.
7. **Zepter Svet / Promocije** — sadržajne/landing stranice ako postoje u fajlu.

**Dodaj stanja koja 2023 fajl nema (potrebna za moderan flow):**
- **Header — Gost vs Ulogovan** (sa aktivnim rangom i rank switcher-om).
- **Korpa (drawer + stranica)** i **Checkout** sa cenama po rangu i obračunom uštede.
- **Wishlist / Lista želja**.
- **Nalog** (osnovni: porudžbine, rang/status, affiliate link).
- **Pretraga** — rezultati + prazno stanje.
- **Empty / loading / error** stanja za liste, korpu, rezultate.

---

## Design system (isporuči kao deo fajla)

- **Variables**: boje (gore), spacing skala, radijusi, tipografska skala, breakpoint-ovi.
- **Komponente sa variantama i stanjima**: Button (primary/secondary/ghost; hover/focus/disabled), Input/Search, Chip/Pill, Rank switcher (segmented), Price block (gost/rank), Promo hex badge, Wishlist toggle, Product card, Rating, Accordion, Spec-row (zebra), Breadcrumb, Tabs, Quantity stepper, Toast, Header, Footer, Mega-menu, Auction card.
- **Auto-layout svuda**, responsivno; koristi tokene umesto hardkodovanih vrednosti.
- Dokumentuj komponente kratko (varijante, kada se koristi).

---

## UX standardi (obavezno)

- **Responsive**: desktop + tablet + mobile za svaki ekran; rank switcher i cene moraju raditi na uskom ekranu.
- **Pristupačnost (WCAG AA)**: kontrast teksta ≥ 4.5:1 (paziti na amber na belom — koristi navy tekst na amber površini), touch target ≥ 44px, vidljiv focus ring, alt/labeli.
- **Konzistentnost**: ista komponenta = ista instanca; bez „rogue" stilova.
- **Copy**: srpski (latinica), cene u RSD format `1.357.236,00 RSD`. Zadrži postojeću terminologiju: „MP Cena", „BizzClub", „Dodajte u korpu".

---

## Kako da radiš

1. Prvo **audit** postojećeg fajla (popis svih frejmova/stranica) i kratak plan.
2. Postavi **Variables/Styles + jezgro komponenti** (design system).
3. Onda redizajniraj ekran-po-ekran, sekciju-po-sekciju, koristeći komponente i tokene.
4. Drži se postojeće IA i naziva stranica; ne brišeš sadržaj, modernizuješ formu.
5. Na kraju daj kratak rezime: šta je urađeno po ekranu + otvorena pitanja za mene (Igor).

Brand prepoznatljivost (Zepter plava) ostaje; izvedba je čista, minimalistička i savremena.
