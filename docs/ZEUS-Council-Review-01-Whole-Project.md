# ZEUS — Council of Five Review #01: The Whole Project

> **Date:** 2026-06-06
> **Protocol:** Council of Five (Product Strategist, UX/UI Expert, Technical Architect, QA/Risk Analyst, Skeptical Decision Reviewer)
> **Inputs:** ZEUS-Master-Brief.md, ZEUS-Ground-Zero-Plan.md, ZEUS-Commission-Engine-Spec.md (v0.1), ZEUS-Zepter-Research.md, 2023 Figma (BizzClub) analysis
> **For:** Igor + Čeda

---

## 1. Decision being reviewed

Should ZEUS proceed as currently framed — three pillars (Luxury Members Club + Global Marketplace + MLM Earning Network) in one platform, per Master Brief v0.1 and Ground Zero Plan v0.1 — and is the current plan the right path from reactivation to MVP?

## 2. Five expert positions

### Product Strategist
The vision is differentiated and the asset leverage is real (hotels, yachts, real estate, claimed 2M+ members). ZepterClub evolution de-risks pillars 1–2, and the 2023 Figma proves they were buildable — Philip has already seen the predecessor. But the documents have the center of gravity wrong: the brief frames three equal pillars, while the actual thesis is *"a network where you earn — commerce is the fuel."* MVP must prove the earning loop, not the catalog. Biggest strategic hole: **no confirmed mandate, budget, or commercial agreement with Philip is recorded anywhere.** Everything downstream hangs on one unscheduled conversation.

### UX/UI Expert
~60% of design exists, but it encodes the wrong frame ("shop with member discounts") and pillar 3 — the differentiator — is ~10% seeded: no Partner Portal, no downline visualization, no earnings UX. Given Zepter's documented history of unpaid-commission disputes, **earnings transparency is the trust surface**: a member must be able to reconstruct *why* they earned X. That is a product feature, not reporting. God Mode changes a country's economics from a phone in real time — preview/confirm/rollback must be first-class UX, not an admin afterthought. Don't modernize 2023 screens first; design the earning loop first.

### Technical Architect
Config-driven Commission Engine is the right call and spec v0.1 is a solid starting point. But there is an unresolved fork that changes everything: **2019 P11 (6 ranks, L1–L10 deep downline) vs 2020 "Live 100" (5 ranks, L1 differential only, permanent recruiter bond).** Different graphs, different recompute strategies, ~an order of magnitude difference in complexity. The spec currently assumes L10 — possibly the wrong, harder plan. Closure-table-vs-materialized-path must not be decided until the plan version is confirmed. Payouts/KYC across 50+ countries is the hardest unbuilt system, has zero design, and shapes the data model *now* (ledger, currency, tax) even though it's slotted for Phase 2.

### QA / Risk Analyst
Risk R1 (building on wrong commission rules) is not hypothetical — two conflicting plans sit in the docs today. God Mode is a global-blast-radius write path: staged rollout, dry-run diff preview, audit, and rollback must be **acceptance criteria for v1**, not Phase 4 hardening. Commission calculation must be deterministic and reproducible from day one — that is also the legal shield. Cross-border MLM legality is high-likelihood/high-impact and partially blocks *design*, not just Phase 2: some markets may prohibit the model outright, which changes pillar-3 scope itself. There is no capacity plan mapping a two-person team to a four-phase global platform.

### Skeptical Decision Reviewer
What cannot be confirmed from the record: (a) any signed engagement from Zepter — this is a reactivation built on two people's memory of years-old discussions; (b) asset facts — the real-estate discrepancy (1.5M m² claimed vs 380k m² found) is already caught; wealth/member figures are unreliable; (c) that 2M+ members are *active, reachable digital users*; (d) that luxury brands will accept adjacency to MLM — "Amex Centurion + MLM" may be self-contradictory positioning; partner brands might see the ZEUS list as status *or* see MLM and walk. A simpler alternative exists: relaunch club + marketplace (proven 2023 design) and pilot the earning network in one country as an experiment. Final point: **the binding constraint is one meeting with Philip, not another spec.**

## 3. Debate / disagreements

- **MLM: moat or poison?** Strategist: the earning layer is the only true differentiator. Skeptic: it may kill luxury-brand adoption. Not resolvable in-house — needs Philip plus soundings with 2–3 target partner brands. Shared mitigation: the config-driven design already allows pillar 3 to be toggled per country — architect it as switchable.
- **Engine spec timing.** Architect concedes the spec ran ahead of plan confirmation. Agreement: engine work freezes at the interface/config-schema level — no downline graph implementation until the plan version is confirmed.
- **God Mode for the demo.** UX wants the Philip "wow"; QA refuses live blast radius. Agreement: **sandboxed God Mode preview** (simulated country, diff view) — full wow, zero risk.
- **More docs vs. meeting.** Unanimous: documentation is now *sufficient* to support the Philip conversation. Further spec work before the mandate is speculative effort.

## 4. Key risks and unknowns

| # | Risk / unknown | Why it matters |
|---|---|---|
| 1 | No confirmed mandate/budget from Philip | Everything else is speculative until this exists |
| 2 | Marketing plan conflict (2019 P11 vs 2020 Live 100) | Blocks Commission Engine, data model, MVP scope |
| 3 | Cross-border MLM legality per country | Can prohibit pillar 3 in whole markets; affects design now |
| 4 | Payout/KYC model (50+ countries) undesigned | Hardest system in the platform; shapes the ledger/data model |
| 5 | Luxury × MLM brand tension | Could undermine External Partner Listings entirely |
| 6 | Two-person capacity vs. 4-phase global platform | No staffing/sequencing plan exists |
| 7 | Asset-fact discrepancies (m², member count) | Embarrassment risk in the Philip presentation itself |
| 8 | Zepter commission-dispute reputation | Makes audit/transparency a product feature, not infra |

## 5. Unified recommendation

**Proceed — but converge, don't widen.** The three-pillar vision is coherent, the ZepterClub-evolution framing is correct, and the config-driven engine is precisely the right hedge against every business unknown above. However, the project currently risks accumulating speculative documentation around an unconfirmed mandate and an unresolved plan version.

Stop broadening specs and funnel everything into a single gate — a **Philip alignment meeting** with exactly three asks:

1. **Commercial mandate** (engagement, budget, decision cadence).
2. **Which marketing plan governs ZEUS** — 2019 P11 / 2020 Live 100 / new.
3. **Verification of asset and member facts** (real estate m², active member count).

Until that gate passes: no engine implementation, no data-model freeze.

Redefine MVP as the **earning-loop thin slice** — one country, one product category, sales commission + recruiter premium only, sandboxed God Mode preview — architected so downline depth (L1 vs L10) is config and pillar 3 is per-country switchable. Elevate commission auditability to a headline product feature: it is the reputational shield.

## 6. Recommended next step

Build the **Philip Alignment Pack** — one-pager + v0.3 architecture diagram + side-by-side comparison of the two marketing plans + the three decision asks — and review it with Čeda first to lock the technical questions (God Mode write scope, plan-version implications on the data model) before the meeting is booked.
