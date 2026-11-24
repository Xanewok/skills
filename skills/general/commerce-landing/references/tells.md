# Defaults that are not choices

Read this twice: when you review the plan, and when you brief the critic. Quoted blocks are copied
from the named source; `NOTICE.md` holds the licences.

Everything below is a default: it appears whatever the subject is, so reaching for it means
nobody decided. The brand's tokens and the brief's own words can earn any of them, and a project
may turn any of them into a ban. Two are worth deleting on sight: a small label line above a
heading, and 01 / 02 / 03 numbering on content that is not a sequence (steps and a timeline are;
items in a set, brands, benefits and sections are not). When you remove a default, do not put its
neighbour in its place:

> Do not replace removed decoration with new decoration, and do not swap one trend for another like
> glass, grain, noise, neon or bento grids.
>
> — unslop by Damir Sokolovsky, CC BY 4.0

## The looks generated pages cluster around

> For calibration, AI-generated design right now clusters around some traits:
> 1. a warm cream background (near #F4F1EA) with a high-contrast serif display and a terracotta or
>    warm-clay accent (often near #D97757 — Anthropic's own Claude-interaction accent, so on a user's
>    brief it reads as a tell);
> 2. a near-black background with a single bright acid-green or vermilion accent;
> 3. a broadsheet-style layout with hairline rules, zero border-radius, and dense newspaper-like
>    columns;
> 4. the SaaS-card kit: content chopped into identical rounded cards, one border-radius on everything
>    regardless of hierarchy, the same soft grey shadow (rgba(0,0,0,.1)) under each, and gradient
>    washes as decoration;
> 5. template chrome that appears whatever the subject: a tracked-out ALL-CAPS eyebrow label above
>    every heading; meta strings joined with middle dots ('A · B · C'); labels built as
>    'WORD — fragment' with a spaced em dash; tinted near-black (#0B0B0B, #111) standing in for black;
>    a monospace face for small data labels; a '→' appended to link and button text.
>
> All traits are legitimate for some briefs, but they are defaults rather than choices, and they
> appear regardless of subject. Where the brief pins down a visual direction, follow it exactly — the
> brief's own words always win, including when it asks for one of these looks. Where it leaves an
> axis free, don't spend that freedom on one of these defaults.
>
> — Anthropic `frontend-design`, Apache-2.0

> Avoid these default typographic treatments; they are the commonest tells of a generated page:
> - Accenting just a single word or phrase in a headline, like putting one word in italic/bold or a
>   different color.
> - Using all caps for labels.
> - Adding unnecessary typographic labels above content.
>
> — Anthropic `frontend-design`, Apache-2.0

The hex values and font names in such lists drift, and a banned look is replaced by the next most
likely one. Judge by the test, not the list: would you have produced this for any shop?

## Page scaffolds and surface habits

> - Same-size cards of icon plus heading plus text as the page structure. Cards are the lazy
>   container; nested cards are always wrong.
> - The hero-metric template: big number, small label, supporting stats, accent.
> - Gradient text. Emphasis comes from weight or size.
> - Glass and blur as decoration rather than as a specific effect.
> - A bar down one side of a rounded box (a one-sided border, inset shadow or pseudo-element), any
>   colour or state. Use a full border, a tint, or a leading icon or label.
> - Unicode glyphs or emoji standing in for an icon system. Icons are drawn, from a real library or
>   authored SVG, in one consistent stroke and weight.
> - Geometric masks standing in for organic contours. A circle, polygon, or radial-gradient cutout
>   approximating a photographic subject's edge is the cheap version of the effect and reads worse
>   than omitting it. Derive an alpha matte from the actual image, or produce a cut-out asset.
> - Declare elevation once, border or shadow. A 1px border under a wide soft shadow is the ghost
>   card.
> - Real illustration or none. Sketch-style SVG scenes, `loose-sketch` / `doodle` class names, and
>   `feTurbulence` grain read as amateur.
>
> — Impeccable `reference/craft-floor.md`, Apache-2.0 (selected lines)

> Both ends erase the direction: the painted poster, and the generic product page (a headline over
> subcopy and a button, a row of equal cards below). […] a split hero (copy on one side, the product
> on the other, a badge row under it) or a centred headline over a row of cards is the template
> whatever world paints it.
>
> — Impeccable `reference/mode-persuade.md`, Apache-2.0

## Heroes, visuals and motion

Each line pairs the sign with its fix.

> - A pill badge above the headline, like `✨ Introducing X 2.0` → remove, or a quiet text link if it
>   is real news
> - A headline that could fit any product, like `Supercharge your workflow with AI` → say what the
>   product does for whom
> - Floating blobs, orbs, grids and glowing lines behind the hero → plain background or one real
>   product visual
> - Three or more buttons, or chips and avatars stacked under the buttons → one primary and at most
>   one secondary action
> - `Trusted by 10,000+ teams`, `Loved by 10,000+`, rows of avatar dots or five stars without a
>   source → ask if it is real, then make it quiet and specific or remove it
> - Feature cards with an emoji, a bold title and a vague line each → fewer features, concrete copy,
>   line icons or none
> - Text, fake buttons or a fake logo baked into an image → real text in the page, a clean image
>   without text
> - A visual on every section → one visual where it helps, usually only the hero
> - `animate-pulse`, `animate-ping` or breathing glows on things that are not live → static
> - `transition-all` and `hover:scale` on cards and buttons → color or surface step on hover, a tiny
>   scale down on press
> - Bouncy springs and overshoot on simple UI → one ease-out curve
> - Parallax, floating loops and elements that move on scroll → static layout
> - Animating width, height, top or left → transform and opacity
>
> — unslop by Damir Sokolovsky ([@heydamir](https://x.com/heydamir)), CC BY 4.0, selected lines from
> `references/signs.md`. Keep this credit in copies and adaptations.

## Shop and gift pages

The same reflex, in this category's clothes:

- "Beauty" painted as a pink-to-peach gradient wash, sparkle emoji or floating bokeh.
- "Luxury" painted as a gold gradient, glass, or wide-tracked serif capitals. Metal is a material:
  show it once, on the object that has it, on a quiet ground.
- A countdown, a stock counter, a "N people are viewing" line, a star row or a logo cloud added
  because the layout had a slot for it. `commerce.md` says when each may exist.
- A stack of promo bars, or a pop-up before the visitor has seen the offer.
- An offer written as arithmetic (`A + B = C`) or in bargain typography on a page meant to feel
  like a gift.
- A row of brand logos with nothing said about any of them.
- The same fade-and-rise entrance on every section.
