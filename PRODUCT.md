# Product

## Register

product

Product-primary, but brand-aware: this is a single public utility page that doubles as its own marketing. Design serves the search-and-compare workflow first; identity comes through restraint and clarity, not a landing-page hero.

## Users

Frontend developers deciding whether a web platform feature is safe to ship. They arrive with a feature in mind (subgrid, container queries, `:has()`, webp) and a baseline of features they already use in production. Their context: mid-task, in a PR or planning a refactor, wanting a quick, trustworthy read on browser support without parsing a dense compatibility table. The job to be done is reaching a confident ship / no-ship call by anchoring an unfamiliar feature against ones they already trust.

## Product Purpose

"If You Use" turns the caniuse dataset into a relative-risk argument. Search a feature, see its global usable support, then see other features at equal or lower support, the ones that are therefore "fair game" if this one already passed your bar. Success is a developer leaving with a clear yes/no and, ideally, a short list they can point to: "we already ship X at Y%, so Z is fine too." It exists because raw support percentages lack a reference point; a baseline you already trust is the missing context.

## Brand Personality

Friendly, calm, unintimidating. The voice is a knowledgeable colleague who answers the question and stops, never a spec sheet and never a hype machine. Plain language over jargon, confidence without loudness. It should lower the anxiety of a compatibility decision, not raise it. Where it has personality, that personality is quiet wit and clarity, not visual noise.

## Anti-references

- **caniuse.com / MDN compatibility tables as-is.** Should evoke that lineage (a developer recognizes the domain) but feel markedly lighter: far less table dump, no wall of per-browser-version cells, generous breathing room over data density.
- **Cookie-cutter SaaS dashboard.** No cards-everywhere grids, no generic blue accent, no rounded-box monotony.
- **Neon-on-black tech hype.** No glowing gradients, glassmorphism, or crypto/AI dark-mode clichés.

## Design Principles

1. **One question, one answer.** Every screen orbits a single decision: can I ship this? Don't bury that under chrome, options, or secondary data.
2. **Relative beats absolute.** A bare percentage means little; the product's whole value is anchoring the unknown against the known. Always show support in comparison, never in isolation.
3. **Lighter than the source.** Inherit caniuse's credibility, reject its density. When in doubt, remove a column, a border, a row of noise.
4. **Calm confidence.** Reduce decision anxiety. Clear hierarchy, restful pacing, no urgency theater, no alarm colors used decoratively.
5. **Honest signals.** Support data drives real decisions. Never let color be the only carrier of meaning; pair it with numbers and text so the answer survives any viewing condition.

## Accessibility & Inclusion

Target WCAG 2.2 AA: contrast on all text and meaningful UI, full keyboard operability for search and result selection, visible focus states, and `prefers-reduced-motion` honored throughout. Because the product communicates support levels, color is never the sole signal: percentages and labels always accompany any color-coding, keeping the comparison legible for colorblind users.
