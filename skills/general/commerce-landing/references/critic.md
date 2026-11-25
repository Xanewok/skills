# Critic brief and rubric

For the agent reviewing screenshots of a shop landing page. You did not build this page. You have
the screenshots, the builder's five direction lines, the brand tokens the page uses, any approvals
the merchant gave, quoted, this file and `tells.md`. If you were given
the builder's plan or its opinion of the result, ignore both. Quoted blocks are copied from the
named source; `NOTICE.md` holds the licences.

Assume the page is mediocre until the shots show otherwise. List defects first, then score. Judge
only what the shots show; say which checks you could not make from them.

## How to look

1. The first phone shot, alone, for five seconds. Write what is being sold, for how much, and what
   to do next. Whatever you could not answer is a defect.
2. The phone page top to bottom, then the desktop page.
3. Every page state supplied, then the motion frames, then the reduced-motion shot.

## Checks

Answer each with pass, fail or cannot tell, and the shot it shows in.

**First phone screen**

- The product, the offer, the price (or the plain statement of when it comes) and the working
  action are all visible without scrolling.
- Hide the header in your mind: the screen still belongs to this brand and no other.
- Remove the main image in your mind: the screen gets clearly worse. If not, the image is filler.
- Swap in another shop's name: the screen stops fitting. If it still fits, it is a template.

**Offer and action**

- One primary action, named for what it does, the same name everywhere, and recognisable as a
  control at a glance.
- The error and success shots of the action exist and read as finished.
- The action is reachable again after each long section.
- Price contents, delivery, returns and what happens next sit by the action, or their absence is a
  designed gap, not a hole.
- Every page state reads as finished, and no string belongs to another state.

**Contents**

- Every product and brand name is complete. Sizes are visible on the phone.
- No empty grid cell, no dead band of empty space, no image used twice.
- The same fact is worded the same everywhere.

**Honesty.** Each of these is a blocking defect:

- A rating, review, quote, countdown, stock line, badge, struck-through price, or a count of
  buyers, sales or viewers, with no visible source. A specification is not proof: how many items
  a unit holds, a size or a material needs no source on the page.
- A placeholder marker, filler text or a labelled placeholder image in a storefront shot. The
  builder's draft copy is expected: judge whether it fits its slot, not its wording.
- A rendered or generated image presented as the real product, its contents or its packaging.
- A picture or a line promising something the page does not offer.
- A claim from the stop list in `commerce.md` (a value, a reduction, luck or a bonus for some
  buyers, a return rule, a delivery promise, what a sign-up sends) with no approving sentence from
  the merchant supplied to you. You cannot tell whether it is approved, and that is the defect:
  list it here, not under "could not check".

**Tells.** Every entry in `tells.md` that appears. Anything the project bans is blocking.

**Craft**

> - **Contrast:** body and placeholder text ≥4.5:1, large text ≥3:1. On colored surfaces tint
>   secondary text from that hue or the foreground; never gray.
> - **Depth:** shadows carry an offset and a soft blur. A zero-offset colored halo is decoration.
> - **Spacing:** tight groups, generous separation, more space above a heading than below it.
> - **Type:** body measure 65–75ch, display max 6rem, tracking floor -0.04em, balanced headings,
>   obvious scale and weight steps. Run the real copy at every breakpoint and fix what overflows.
> - **Motion:** one authored moment, not scattered effects and not one identical entrance on every
>   section.
> - **States:** hover, disabled, loading, error, empty. Plus real content, working controls,
>   responsive composition, keyboard focus.
> - **Browser surfaces:** the parts you did not draw still carry the design. Text selection, the
>   caret, custom scrollbars, focus rings, underline offset, and the numerals in tabular data all
>   ship with browser defaults that belong to no design system. Theme them from the palette.
>
> — Impeccable `reference/craft-floor.md`, Apache-2.0 (selected lines, some shortened)

The numbers above are a floor for a page with no brand behind it. Where a brand token differs
(a tighter heading tracking, a longer measure), the token is right and is not a defect.

Also: no sideways scroll on the phone; tap targets at least 44 px; nothing under the sticky header
or the phone's bottom bar; a cutout sits on its ground, not pasted over it. The page's language is set
properly: its diacritics render in the brand face, not a fallback, and its quotation marks, line
breaks and price format follow that language's conventions.

**Motion**, if any: one moment; each frame is a finished-looking state; the reduced-motion shot is
the complete page; no text is unreadable mid-effect.

**Weight**, only if the builder supplied numbers. These are a starting budget from Taste Skill
(MIT), not measured on your stack: the hero image under 400 KiB and any other photograph under
250 KiB; no image more than about twice its shown width; width and height on every image; images
below the first screen lazy, the hero not; at most two font families; layout shift under 0.1.

## Output

1. **Blocking defects**, each with the shot and the place in it.
2. **Other defects**, ranked by how much fixing each would improve the page, at most ten.
3. **Scores** from 1 to 10: design quality, originality, craft, function. Design quality and
   originality count double; a competent page that could be any shop's scores low on both. One
   sentence of reason each. The scores describe this round. They are not comparable between
   rounds and nobody picks a round by them.
4. **Taste questions for a person**: choices that are defensible either way. Do not rank these as
   defects.
5. **Could not check.**

Describe defects in terms of what is on the page and the direction lines. Do not prescribe a
style, and do not praise.
