# Motion and scroll effects

Read before adding anything that moves without a tap. Quoted blocks are copied from the named
source; `NOTICE.md` holds the licences.

## The default is a still page

> Use non-user-triggered motion sparingly and deliberately, only to draw attention. A single
> orchestrated moment — one page-load sequence or one reveal — lands better than scattered effects;
> fade-and-slide-up entrances on each section and hover transitions on every card are the generic
> default and read as AI-generated. Motion that answers a person's action (opening, expanding,
> confirming) is welcome when it shows what changed.
>
> — Anthropic `frontend-design`, Apache-2.0

A shop for physical products stays calm: photographs, type and flat colour. No ticker, marquee,
looping picture, pulsing dot or count-up. No canvas, WebGL, animation library or smooth-scroll
library.

## Choosing the one moment

Take the first rung that carries the idea. Each rung below costs more to build, costs more on a
phone, and has more ways to fail.

1. **A still composition.** The real product, large, well lit, with room.
2. **A tap-driven change.** A switch between states built on radio inputs or `<details>`, which
   works without script.
3. **One entrance on load**, on the hero only.
4. **One scroll-linked change that does not hold the page**: a crossfade or a wipe on an element's
   own `view()` timeline as it passes.
5. **A pinned, scrubbed scene.** Only on a person's decision, made on a written comparison with
   rungs 1 to 4: what it adds that a still does not, its weight, its build cost, and what must be
   re-made when a product changes. A frame sequence, a scrubbed video or 3D is a separate
   decision again.

No published study shows that scroll storytelling sells more. Usability research on pages that
hold the scroll finds visitors disoriented, more so on phones and when there is text to read
inside the effect.

## Contract for a scroll-linked effect

> **Scrolling moves nothing but the dealt moment.** No card, row or tile ever fades, rises or
> staggers in as the page scrolls (stock reveals), no text moves at another speed than the page
> (parallax on text), and the page is never held or steered by script (scroll-jacking,
> smooth-scroll libraries). A moment may hold its own section on screen with `position: sticky`
> while the page scrolls natively.
>
> — Taste Skill, MIT (`references/motion.md`)

> A scroll moment is scrubbed to the scrollbar (it runs back on the way up) and shows a finished
> state at both ends […]. Its text is live and visible without the motion (opacity 1, 4.5:1 at
> every step); reduced motion and no script show the finished still […]. It never moves a card, a
> photograph, pricing, an FAQ, a quote block or the footer.
>
> — Taste Skill, MIT (`references/motion.md`)

> - **Order matters:** the `animation` shorthand resets `animation-timeline` and `animation-range`,
>   so declare them after it.
> - **`linear` is correct here:** scrubbing maps scroll distance to progress one to one; an easing
>   curve detaches the page from the thumb.
>
> — Hallmark, MIT (`references/scroll-choreography.md`)

```css
.thing { /* base: fully drawn, the finished page */ }
@supports (animation-timeline: view()) {
  @media (prefers-reduced-motion: no-preference) {
    .thing {
      animation: thing-in linear both;
      animation-timeline: view();
      animation-range: entry 20% cover 45%;
    }
    @keyframes thing-in { from { opacity: 0.3; } to { opacity: 1; } }
  }
}
```

Adapted from the same Hallmark file, which also sets the three gates every scroll-linked effect
keeps. The base CSS, outside any gate, draws the finished page. The effect lives entirely inside
`@supports (animation-timeline: view())` and `@media (prefers-reduced-motion: no-preference)`. A
browser without support, a visitor who asked for less motion and a failed stylesheet all get the
complete page.

Which widths get the effect depends on its weight. Hallmark keeps every scroll effect at `40rem`
and wider; this skill lets the lightest kind through:

- **On a phone**, a scroll-linked effect may run only if it animates nothing but `opacity` and
  `transform`, and holds nothing in place.
- **Anything heavier** stays inside `(min-width: 40rem)`: `clip-path`, a mask, a filter or blur,
  and any pinned or held section. Narrower screens get the still.

Also:

- Do not state which browsers support what from memory. The `@supports` gate decides, and the
  ungated page must be finished.
- No pinned section holds text to read, a swipeable row or a control. A swipe inside a pinned
  scroll fights the scroll.
- Pinned heights use `svh`. An in-app browser resizes its toolbar while scrolling and `vh` jumps.
- The effect never delays or animates the first screen's main image.
- No frame of the effect shows a state the shop does not deliver (a wrapping, an extra, an
  interior nobody confirmed).
- Products stay separate layers, so a changed product needs a new file, not a new render.
- `position: sticky` fails silently when any ancestor between the element and the page's scroller
  has `overflow` other than `visible` or `clip`; a section's own `overflow: hidden` is enough. Use
  `overflow: clip` there, and shoot the pinned state to prove it holds.
- Find out what scrolls. Where the page scrolls inside an element and not the document, `view()`
  follows the nearest scroller and works, while `scroll(root)` and `window.scrollY` do not move.
- A script that polls scroll position is a last resort. Elements inside a stuck pane cannot drive
  their own `view()`; give the tall parent a named `view-timeline`.

## Hover, timing, reduced motion

Nothing may depend on hover: most visitors have none. Where hover exists:

> Hover motion never moves a neighbor or takes its pointer target. Keep the hovered element still
> and let a child carry the motion (`.card:hover .card-surface { transform: translateY(-2px) }`).
> An element that moves itself slides out from under a pointer near its edge and flickers.
>
> — Impeccable `reference/animate.md`, Apache-2.0

> | Duration | Typical use |
> |---|---|
> | 100–150 ms | immediate feedback |
> | 150–300 ms | routine state change |
> | 300–500 ms | layout, overlay, or view transition |
> | 500–800 ms | a deliberately authored focal entrance |
>
> Exit faster than entrance. Use natural deceleration such as `cubic-bezier(0.16, 1, 0.3, 1)` for
> confident arrivals; do not use bounce or elastic curves by reflex.
>
> — Impeccable `reference/animate.md`, Apache-2.0

> Keep content visible in the default state so failed scripts do not hide the page. […] Reduced
> motion means fewer and gentler animations, not disabling all motion; feedback that confirms an
> action should remain legible.
>
> — Impeccable `reference/animate.md`, Apache-2.0

Name transitioned properties; never `transition: all`. Animate transform and opacity first.
