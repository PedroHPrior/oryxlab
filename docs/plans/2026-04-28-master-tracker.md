# Master tracker — what the launch surfaced + how to close it

Single source of truth for everything we learned from the r/RotMG launch
(post + comments + DMs) and where each thread stands. References the
detailed implementation plans (Plans A/B/C/D) for execution shapes.

---

## 1. Insights extracted, by source

### From WoodyBolle (DM, shared spreadsheet)

What he gave us:
- His full 2026 hand-built DPS calc as `.xlsx` (vendored at `product/data/_references/woodybolle/`)
- Empirical confirmation that **DEX above 75 does NOT increase burst rate**, tested at 70/75/80/85
- A complete burst formula with `burstMin`, `burstMax`, `numBursts` per weapon
- Confirmation that **berserk overrides** the DEX-75 cap

What it told us:
- Our `attMod = 0.5 + ATT/50` is correct (matches his)
- Our engine has **no burst codepath** at all — every weapon goes through linear DEX scaling
- Our STAFF DPS comes out 46% over his hand-calc because of the missing burst path
- The in-game dummy reading (4100) is unexplained on both sides — not pet damage, not exalt boost alone, source unknown

### From Hellkids (Reddit thread)

Concrete complaints:
- "PhD to use" — UI overwhelmed him
- New build column shouldn't preset a Wizard with gear — should start empty
- Draconic Insignia shows 2 DPS (confirmed by screenshot)
- Druid transformation toggle missing
- Optimizer needs a way to exclude specific items (his MV trap example)

What it told us:
- Onboarding tour + scenario panel are too dense for casual users
- Buff sigils (`duration > 0` + stat bonuses) are entirely uncomputed
- Optimizer needs a blocklist constraint

### From xdxdGabriel (Reddit thread)

Two-line complaint: "decent before the enchants and stat scaling, rn is garbage"

What it told us:
- Enchants are completely missing (data + engine + UI)
- Some class scaling reworks aren't reflected

We don't have specifics yet — he hasn't replied to the follow-up question.

### From the JRelay 2020 dump (validation pass)

- 86 weapons diverge from JRelay by 5%+
- **3 are confirmed scrape errors** (Ray Katana undefined damage, Bow of Innocent Blood / Bow of Fey Magic with implausibly narrow ranges)
- **~80 are likely legitimate Deca rebalances** between 2020 and now — don't touch

### From the rotmg-stash 2026 catalog

- Modern catalog has 12,119 items
- We have 1,601 (≈13%)
- Their data is **metadata only** (no damage/RoF), so it's good for "what items exist" but not for stat fixes

### From u/larrytheevilbunnie (Reddit thread)

- Public testing API exists; might surface PT items
- Wiki Discord has private extraction tooling

Action: ask Discord people for entry points. No public link available.

### From u/coaster132 (Reddit thread, em-dash roast)

Em-dashes in tour copy + UI. **Already shipped fix in commit `8419453`** — 79 em-dashes purged across 26 files.

### From quiet wins (positive comments)

- WuShanDroid (Assassin) — wants a more accurate calc
- caoferventebro, Relajarseee, BNaoC — supportive
- Sneshu's calc reference still hasn't been updated since whenever — community void we're filling

---

## 2. Issue inventory (current state)

| # | Title | Priority | Effort | Blocker | Plan |
|---|---|---|---|---|---|
| #16 | New-build column default empty | **P0** | 30min | none | A · Task 1 |
| #15 | Simple mode UX | P1 | 3h | none | A · Tasks 2-4 |
| #18 | Draconic Insignia / buff sigil bug | P0 | 2h | none | B · Task 5 |
| #20 | Burst weapon math + DEX-75 cap | **P0** | 4-6h | none | (write new) |
| #17 | Range-based effective shot rate | P3 | 4h | partly superseded by #20 | B · Tasks 1-4 |
| #21 | Omit items from optimizer | P2 | 1-2h | none | (write new, simple) |
| #19 | Druid transformation toggle | P3 | — | blocked on #14 | D |
| #14 | Modern stat scaling | P3 | — | blocked on xdxdGabriel response | D |
| #13 | Item enchants | P3 | — | blocked on #11 (data) | C · Task 3 (types only) |
| #12 | JRelay drift cleanup | P2 | 1h (3 fixes only) | rest is rebalance noise | C · Tasks 1-2 |
| #11 | Game-asset extraction pipeline | P3 | days | blocked on tooling | D |

Closed:
- #10 — superseded by #17 (already closed)

---

## 3. Recommended execution sequence

### Sprint 1 — Quick wins (half a day)

Goal: ship visible improvements that close the loudest community feedback.

1. **#16** — empty new build (30min, Plan A Task 1)
2. **#12** — 3 confirmed scrape-error weapons (30min, Plan C Task 1)
3. **#21** — omit-items optimizer constraint (1-2h, simple addition)
4. **#13** — enchant type plumbing only (15min, Plan C Task 3)

End of sprint: ship a single deploy, comment on each closed issue with the commit SHA.

### Sprint 2 — Engine correctness (one full day)

Goal: close the biggest accuracy gap surfaced by WoodyBolle.

1. **#20** — burst formula + DEX-75 cap (4-6h)
   - New `isBurst` / `burstMin` / `burstMax` / `numBursts` fields on `ItemStats`
   - Branch in `dps.ts` weapon DPS path
   - Calibrate STAFF, Recompense, Bulwark, Esben, Sacred Lute against community references
   - Re-run bench
2. **#18** — buff sigil uptime (2h, Plan B Task 5)
   - Detect abilities with `duration > 0` + stat bonuses
   - Fold uptime-weighted stats into player totals before weapon DPS

Together these should drop bench drift significantly and address Hellkids + WoodyBolle directly.

### Sprint 3 — UX polish (half a day)

1. **#15** — simple mode toggle (Plan A Tasks 2-4)

This is the "tool now feels approachable" sprint. Land it after engine correctness so we're not polishing inaccurate numbers.

### Sprint 4 — Backlog pulls (when external input lands)

- **#14** when xdxdGabriel replies with specifics
- **#19** when class transformation data sources surface
- **#11** when Discord/community shares an extraction tool
- **#17** if range-based hit-rate still adds value after #20 ships

---

## 4. Updates to existing plans

After the launch-day learning, the plans need a few edits:

- **Plan B** already updated to prioritize #20 (burst) over #17 (range-based)
- **Plan B Task 5** (buff sigils) is correct as-is
- **Plan B has NO task for #20 yet** — needs a new section. Burst formula task is the highest-value engine work and should be the first task in Plan B's next revision
- **Plan A** is correct
- **Plan C** is correct (3-fix narrow scope)
- **Plan D** stays as research notes; #19 stays parked there until #14 unblocks

---

## 5. Done criteria for "launch fully addressed"

We declare launch wrap-up complete when:

- [x] Em-dashes purged (shipped 8419453)
- [x] Talisman dead slot removed (shipped 16845fd)
- [x] Reference data vendored (JRelay + WoodyBolle)
- [ ] Sprint 1 shipped (#16, #12, #21, #13 types)
- [ ] Sprint 2 shipped (#20, #18)
- [ ] Sprint 3 shipped (#15)
- [ ] Sprint 4 issues either resolved or cleanly documented as awaiting external input

Anything past Sprint 4 is **post-launch work**, not launch follow-up. Treated as normal iteration.

---

## 6. Communication plan (Reddit thread + DMs)

Pending replies:
- WoodyBolle: closing reply about the in-game/hand-calc gap (drafted, not sent yet — user reviewing)
- Hellkids: reply with #18 + #21 status (drafted)
- coaster132: em-dash fix link (drafted, references commit `8419453`)

After Sprint 1: edit the original Reddit post with a "what shipped this week" footer linking to closed issues.

---

## What this document is NOT

- Not a replacement for plans A/B/C/D — those are the execution detail
- Not a marketing roadmap — this is internal tracking
- Not exhaustive of every Reddit comment — only the ones that surfaced new technical work
