---
name: commerce-landing
description: >-
  Design and build a landing page, campaign page or page section that sells a product, so that it
  looks made for this brand and this offer, sells honestly, and does not read as AI-generated. Use
  before planning, building, restyling or reviewing a product, launch, waitlist, sold-out or
  seasonal page for a shop on any stack, before adding motion or a scroll effect to one, and before
  judging a screenshot of one. Covers the direction and plan, facts and placeholders, commerce
  honesty, and a screenshot loop with a separate critic. Not for app UI, dashboards or writing
  marketing copy.
---

# Commerce landing

A generated shop page fails in two ways: it could belong to any shop, and it says things nobody
checked. Passages marked with a source are copied from it; `NOTICE.md` holds the licences.

The brand's own tokens and the brief's own words win over every rule here except the honesty
rules. A project may add its own rules on top; where they are stricter, they win.

## 1. Read first

- The brand as built: the project's typefaces, colours, spacing and radius, read from its theme or
  token files and its most recent page of this kind. Reuse them. A campaign colour is sampled from
  the physical product or its packaging, not invented.
- The offer: what is sold, the price and what it includes, dates, delivery, returns, and which
  **state** the page is in now (before the sale, on sale, sold out). List what you do not know.
- The real assets: product photographs, cutouts, the packaging. No real asset means a visible gap
  to report, not a generated stand-in for the product.

## 2. Write the direction

Five lines, derived from the offer and the brand, before any layout:

- **Offer.** What it is, for whom, and the one action the page exists for.
- **Character.** Two or three concrete words.
  > Words like clean, modern, sleek, minimal and premium are not allowed, because they describe
  > every template. — unslop by Damir Sokolovsky, CC BY 4.0
- **World.** The material this offer belongs to: its packaging, paper, light, season.
- **The one moment.** The single place the page gets rich. Usually the product itself, shown large
  and well.
- **Signature.** One small detail only this offer would have, taken from the object (its own
  printed mark, a material, a fold), used consistently.

## 3. Plan, then compare the plan with the default

> Work in two passes. First, brainstorm a short design plan based on the client's design brief:
> create a compact token system with color, type, layout, and principles.
> - Color: describe the core base palette as 4–6 named hex values.
> - Type: the typefaces and their roles.
> - Layout: a layout concept, using one-sentence prose descriptions and ASCII wireframes to ideate
>   and compare. Include alignment guidance; should the content be left aligned, center aligned,
>   justified?
> - Principles: the high-level guidance for what makes this page unique.
>
> Then review that plan against the brief before building: if any part of it reads like the generic
> default you would produce for any similar page (work through a similar prompt to see if you
> arrive somewhere similar) rather than a choice made for this specific brief — revise that part,
> say what you changed and why. Only after you've confirmed the relative uniqueness of your design
> plan should you start to write the code, following the revised plan.
>
> — Anthropic `frontend-design`, Apache-2.0

Where the brand already fixes the palette and type, the plan names which tokens it uses and for
what. Draw the wireframe for a phone first, then the desktop. Read `references/tells.md` for the
review.

The comparison is about expression, not about conventions a buyer relies on. A buy or sign-up
control that looks like one, a product named with its size, the price by the action and ordinary
form fields stay recognisable; departing from one needs a reason from this offer.

For any effect beyond a hover, read `references/motion.md` and show whoever owns the page the
options with their costs before building one. To show an option of any kind, shoot it: apply the
variant's styles in the browser for the screenshot only, and commit the one that is chosen. No
variant switch goes into the page.

## 4. Build

**The first phone screen carries the decision.**

> For **Persuade**, the opening must make the offer intelligible and desirable, expose a clear
> action, and demonstrate something only this product can prove. The action is the one the
> category's visitors came to take, in its working form: an airline's route-and-dates search, a
> clinic's open appointment slots, a store's add to cart. A decorative link pointing at it elsewhere
> does not count.
>
> — Impeccable `reference/mode-persuade.md`, Apache-2.0

Design for a phone first. A visitor arriving from a social app sees the page in that app's
browser, which shows less height than the device viewport. The product, what the offer is, its
price or the plain statement of when the price comes, and the working action all fit that first
screen. Size the hero with `svh`, and count a sticky header against it.

**One place for boldness.**

> Spend your boldness in one place. Let one element be the memorable thing, keep everything around
> it quiet and disciplined, and cut any decoration that does not serve the brief.
>
> — Anthropic `frontend-design`, Apache-2.0

> Visual structure is information. Structural devices like outlines, borders, numbering, eyebrows,
> dividers, labels, etc., encode useful information about the content rather than decorate it.
>
> — Anthropic `frontend-design`, Apache-2.0

**The product is shown in photographs of the product.** Real photographs and true cutouts carry
the page; one light and one grade across the set. A generated or rendered image is an illustration
of mood or setting. It never stands for the real product, its contents or its packaging, and it
never shows something the shop does not provide. A logo, photograph, font or quote that is not the
shop's own is used only with its source and the right to use it on record; a file being in a
repository or on a supplier's site is not that right.

**Never guess a fact.** Text on the page says only what is known. A fact you do not have is a
marked placeholder that cannot reach the live page: the template leaves it out, or a check fails
on it. Lay out for real word lengths in the page's language, and never truncate a product or brand
name.

**A heading that must hold one line needs slack.** Size it from its container (`min(8cqi, 4rem)`, on
a parent with `container-type: inline-size`), not from the viewport, and check that a `clamp()` floor is not larger than a narrow screen allows.
Then try it in the fallback face and with text scaled up by a tenth or more: a line that only just
fits will wrap for someone.

**Honesty is not negotiable.** No invented urgency, scarcity, counter, rating, review, quote,
logo, "bestseller" badge or struck-through price. A number on the page comes from data the shop
holds. A slot with nothing true to put in it stays empty or is left out. Read
`references/commerce.md` before building anything that states a price, a value, a limit, a date,
proof, a return rule, random contents or a form.

**One page state drives every state-dependent string and action**, so a page that goes on sale or
sells out changes everywhere at once. Design each state, not only the current one.

## 5. Verify with screenshots and a separate critic

A clean build says nothing about how the page looks.

1. **Shoot the rendered page in a real browser**, the phone first: the first screen at the short
   in-app height, then the whole page a screen at a time, then the desktop. Shoot every page state,
   each step of any motion, and once with reduced motion. Check that the shots show the whole
   page: where the page scrolls inside an element and not the document, a full-page capture shows
   one screen. Look at every shot yourself and fix what one look shows. Shoot the action's
   error and success states. Submit it for real only where that writes no live data: a preview
   wired to the real store creates real customers and orders. Otherwise drive the page into each
   state in the browser without sending, and report the round trip as unverified.
2. **Hand the shots to a separate critic**: a fresh agent that did not build the page, from another
   model family when one is available. Give it the shots, the five direction lines, the brand tokens
   the page uses, `references/critic.md`, `references/tells.md` and any project rules. Do not give it your plan,
   your reasoning or your opinion of the result. A builder grading its own page skews positive.
3. **Fix the defects it ranks highest, then shoot again.** Most of the gain comes in the first
   round, so stop after the second; a third is for motion only. Commit each round. Go back to the
   earlier one when a round adds a blocking defect, breaks something that worked or leaves more
   defects than it fixed, never because a score moved. Do not mix bug fixes into a polish round. Stop early
   when what remains needs a person: copy, a fact, a taste call.
4. **Before finishing, remove one thing.**

A model critic finds defects reliably: overlap, clipped text, weak contrast, a missing action, a
tell. It does not rank taste reliably. Taste calls, and any disagreement with the critic you do not
act on, go to a person with the shots.

## 6. Hand off

Report: the direction and what you changed after comparing with the default; every placeholder
left; every generated image and what it illustrates; every third-party asset with its source and
rights; the critic's findings you did not fix; and what you did not verify (a real phone, an
in-app browser, a page state).
