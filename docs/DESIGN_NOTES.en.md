# Design Notes — The Philosophy Behind 难得读书 (mybook)

> The English companion to `docs/价值说明.md`. This is a condensed 1–2 page
> summary; the Chinese document is the authoritative, full-length version.
> Every principle maps to real code in `src/lib/agent/` and
> `src/app/api/narrative/`.

## The core thesis

> **Without presupposing "what is right," help a person discover their own
> values; then use extreme pressure to force out the deeper values they didn't
> even know they held; and finally let those two versions of themselves meet
> face to face.**

Everything below expands that one sentence into 17 design principles, plus a
"backlog" of ideas not yet shipped.

## Meta-principle (methodology): Reverse Productization

This document was **not** written first and implemented afterward — the
opposite is true. It came out of a reverse, looping process:

```
Build first (ship a version on instinct / inspiration / a big plan)
   → Extract, name, and connect "principles" from what was built
   → Use the principles as a ruler to measure the product:
     which land hard, which are only pretty on paper
   → Fix the product against the "unfulfilled" principles
     so the experience catches up to the principle
   → Extract again → measure again (a continuous loop)
```

Why this is both novel and more honest:

1. **It runs opposite to the norm.** Most products go "principles first →
   implementation." Here principles are not the *starting point* but a tool
   that *grows out of practice and then calibrates practice back.*
2. **It has built-in lie-detection.** The moment a fuzzy instinct becomes a
   sharp written principle, any gap between "pretty principle" and "flat
   experience" is exposed. The sharper the principle, the clearer it shows what
   the product still lacks.
3. **It turns "sighs" into a roadmap.** A good design doc should run slightly
   ahead of the current product. So "great principle, dull experience" is not
   embarrassing — it is a to-do list.
4. **It loops, it is not one-shot.** Extracted principles point to new changes;
   new changes yield new principles.

A real run of this loop (verifiable in git history): we first flagged
"value-anchors / spacetime-folds / extreme-pressure" as *pretty in principle
but weak in landing*, then reverse-fixed the product — adding positive/negative
few-shot examples to force generic platitudes into "lines that belong only to
this playthrough," making extreme pressure *evidence-driven* by pointing back
at the specific thing you did last run, drawing the previously-computed-but-
never-shown meta-value-axes onto the result page, and expanding the content
libraries.

## The 17 principles (at a glance)

1. **Neutrality** — never presuppose a value stance; no "correct" answer.
2. **Discovering values** — through *accumulated behavior*, not self-report questionnaires.
3. **Extreme pressure** — force out the *deep* values, not the performed ones.
4. **Anchor design** — turn conclusions into a mirror that reflects real life.
5. **Two-pass comparison** — let the *everyday you* meet the *extreme you*.
6. **Cross-run comparability** — "meta-value-axes" put different characters on one ruler.
7. **Main plot vs. free choice** — how to balance authored spine and player agency.
8. **Branching strategy** — *rule-triggered* transitions instead of a pre-written script tree.
9. **Re-reading classics through a modern lens** — the heart of the whole thing.
10. **Story construction** — "five-layer core drives" as the bedrock of every dilemma.
11. **Dramatic arc** — setup/development/turn/resolution as a *hard* constraint, not a suggestion.
12. **Choice design** — every option is a "triple" that measures *motive*, not behavior.
13. **Why two analyses** — one pass reads a persona; two passes read values.
14. **Separation of duties** — "character DNA" for fidelity, "dilemma library" for material, decoupled.
15. **Comparison page** — only "the same ruler" reveals the gap.
16. **Cost logic** — reversals are *relational blowback*, not punishment from the sky.
17. **Choice → feedback loop** — coherent, striking, and surprising, all at once.

## Landing-status self-assessment

We grade each principle honestly by how much lives in hard code vs. AI:

- 🟢 **Truly landed** — deterministic, enforced in code
  (e.g. neutral centered start, behavior accumulation, rule-triggered
  branching, meta-axes math, the comparison page's shared ruler).
- 🟡 **Strong skeleton, AI-fleshed** — the trigger/structure is hard, the
  prose quality leans on AI (e.g. anchor sharpness, cost-logic coherence, the
  choice→feedback loop).
- 🔴 **Heavily AI-dependent** — mostly a single-shot generation to keep
  polishing next.

Content volume (not a principle, but it shapes the experience): the dilemma
library grew 41 → 81 and curated characters 13 → 21, easing the
"replay = repeat" problem. *(Honest note: mid-expansion 8 entries were lost to
a dropped edit and the count briefly sat at 73; it has since been verified back
up to 81 — recorded here in keeping with the reverse-productization principle
of honest self-checking.)*

---

*License: this project is released under CC BY-NC 4.0. It reinterprets
public-domain classical Chinese literature; the original interpretation,
dilemma design, code, and narrative framing are what the license covers. See
`LICENSE`.*
