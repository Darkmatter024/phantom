# PHANTOM — UI Design Rules

> **Purpose.** Codifies Anthropic's official `frontend-design` skill best practices,
> adapted to PHANTOM's operating reality. **Reference this file before every UI task.**
>
> **Sources:**
> - [frontend-design SKILL.md — anthropics/skills](https://github.com/anthropics/skills/blob/main/skills/frontend-design/SKILL.md)
> - [anthropics/skills repository](https://github.com/anthropics/skills)
>
> **Codified:** 2026-06-24 · **Upstream skill:** `skills/frontend-design`

---

## 0. Prime Directive (PHANTOM context overrides generic taste)

Every UI decision is evaluated against PHANTOM's reality, not abstract aesthetics:

- **Operator profile** — Network Deployment Lead working in a **cold aisle**, on an **iPad**, with **gloved hands**, running an OODA loop under time pressure. Touch targets must be glove-sized; contrast must survive aisle lighting; nothing requires precision tapping.
- **Offline-first monolith** — no runtime CDN fonts, no external asset fetches at use time. Self-host every font, icon, and image. A rule below that implies a web font must be satisfied by a locally bundled face.
- **5 functional pillars** — every screen serves one of PHANTOM's five pillars; if a UI element serves none, cut it (see §6, "spend boldness in one place").

When generic design advice and PHANTOM reality conflict, **PHANTOM reality wins.**

---

## 1. Anti-Slop Rules (what NOT to do)

Reject choices that signal generic AI output:

- **Banned default fonts:** Inter, Roboto, Arial, raw system-font stacks as the *display* face. (System stack is acceptable only as a fallback, never the design statement.)
- **Banned color cliché:** purple/violet gradients on white.
- **Anthropic's three named layout clichés** — legitimate *only* if the brief specifically calls for one, never as a reflex:
  1. Warm cream background (`#F4F1EA`) + high-contrast serif + terracotta accent.
  2. Near-black background + acid-green or vermilion accent.
  3. Broadsheet/newspaper layout with hairline rules and dense columns.
- **Scattered animation** — many small effects sprinkled around the page is the #1 AI tell. Prefer one orchestrated moment (see §4).
- **Decoration that serves nothing** — cut any element that doesn't carry information or reinforce the signature.

---

## 2. Process — Two Passes Before Code

**Pass 1 — Brainstorm a compact token system** tied to *this* brief:
- **Color:** 4–6 named hex values, defined as CSS variables.
- **Type:** a characterful **display** face + a complementary **body** face + a **utility** face (captions/data) if needed.
- **Layout:** one-sentence prose description per region + an ASCII wireframe.
- **Signature:** the single element this screen will be remembered by.

**Pass 2 — Critique & revise.** Test the plan against the brief: *Is this specific to PHANTOM, or a generic solution I'd apply to any app?* If it's generic, redo it.

---

## 3. Typography

- Pair display + body faces **deliberately**; don't reuse the same pairing across unrelated work.
- Set a clear **type scale** with intentional weights, widths, and spacing.
- Make the type treatment itself memorable — type is personality, not neutral delivery.
- Use display faces with **restraint**; body face complements; utility face for captions/data.
- **PHANTOM:** all faces bundled locally (offline-first). No Google Fonts / CDN links.

---

## 4. Color

- Palette = **4–6 named hex values**, exposed as CSS custom properties (`--`).
- Choices must be **specific to the subject**, not defaults.
- Avoid the three default clusters listed in §1.
- **PHANTOM:** verify legibility under cold-aisle lighting and on glossy iPad glass; favor high effective contrast.

---

## 5. Motion & Animation

- Use motion **deliberately**, where it serves the subject.
- Consider: page-load sequence, scroll-triggered reveals, hover/press interactions, ambient atmosphere.
- **One orchestrated moment lands harder than scattered effects.** Pick one.
- Always respect **`prefers-reduced-motion`**.
- **PHANTOM:** motion must not block or delay an operator mid-OODA-loop; instant feedback on tap beats decorative transitions.

---

## 6. Spatial Composition & Layout

- **Structure encodes meaning** — markers, dividers, and labels carry information; they don't decorate.
- Numbered markers (01 / 02 / 03) only if the content is **truly sequential**.
- Ideate with **ASCII wireframes** + one-sentence prose per region.
- **Spend your boldness in one place.** Keep everything around the signature element quiet and disciplined.
- Match complexity to vision: minimalism demands *more* precision in spacing/type/detail, not less.

---

## 7. Accessibility & Responsiveness (quality floor — non-negotiable)

- **Visible keyboard focus** states.
- Respect **reduced-motion** preferences.
- **Responsive down to mobile / iPad** as the minimum quality bar.
- Don't announce baseline a11y work — just do it.
- **PHANTOM Rule 1 — Zero Horizontal Overflow:** no element ever pushes the viewport past `100vw`. Enforce globally on `html`, `body`, `#app`, and all sheets/modals. This is a hard gate; a layout that overflows horizontally is broken regardless of how it looks.
- **PHANTOM:** touch targets sized for **gloved hands** (generous hit areas, ample spacing — no precision taps).

---

## 8. Copywriting (copy is design material)

- Words exist to make the UI **easier to understand and therefore easier to use**.
- Write from the **end user's perspective**; name things by what people control.
- **Active voice:** "Save changes," not "Submit."
- Actions keep the **same name through a flow** ("Publish" → "Published").
- Plain verbs, **sentence case**, no filler; tone matched to PHANTOM's voice.
- **Errors** explain what went wrong — never vague about what happened.
- **Empty states** are invitations to act, not mood pieces.

---

## 9. Pre-Ship Checklist

- [ ] No banned default font as the display face; faces bundled locally.
- [ ] No banned color cliché; palette is 4–6 named CSS variables.
- [ ] Not one of the three named layout clichés (unless the brief demands it).
- [ ] Motion is one orchestrated moment, not scattered; `prefers-reduced-motion` honored.
- [ ] Boldness spent in exactly one signature element; rest is disciplined.
- [ ] Visible keyboard focus + responsive to iPad/mobile.
- [ ] **Zero horizontal overflow past 100vw** (html/body/#app/sheets).
- [ ] Touch targets glove-sized.
- [ ] Copy in active voice, consistent action names, helpful errors, inviting empty states.
- [ ] Every visible element serves one of PHANTOM's 5 pillars — else cut it.
