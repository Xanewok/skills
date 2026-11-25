# Commerce: what the page may say and show

No rule here promises a conversion lift. The public evidence for one is vendor write-ups with
mixed signs, and a small shop's traffic cannot detect small effects. These rules remove known
omissions and known falsehoods. Quoted blocks are copied from the named source; `NOTICE.md` holds
the licences.

## Stop and ask the merchant

None of this is legal advice, and the rules differ by country. Do not settle any of these yourself,
and do not build the page so that it implies an answer:

- **A value or saving claim** ("worth X", "over X", "N times the price"). It must be true for every
  unit sold, not for the best case, and its reference prices must be real.
- **A price reduction** (a struck-through price, "-N%"). EU price-indication rules require the
  lowest price of the thirty days before the reduction beside it; other places have their own. A
  product with no earlier price has no reference price to show.
- **Random or surprise contents.** State what every unit contains and what varies. Never sell the
  variation as luck, a chance or a win. A prize or bonus that only some buyers get is a different
  legal category: stop.
- **Returns.** Never write "no returns once opened" or anything narrower than the buyer's
  statutory right. Exceptions, such as hygiene, are narrower than shops tend to assume.
- **A delivery promise or an order-by date.**
- **What a sign-up sends.** The form may promise only what the shop will actually send. A launch
  notice and ongoing marketing are two purposes; the second needs its own consent.

Until answered, each is a marked placeholder that cannot reach the live page: not live text, not
a setting's default, not a line softened into a hint or a "secret".

An answer is the merchant's own sentence saying that this claim may appear on this page. Quote it
in the hand-off. None of these is an answer: the merchant describing how the thing works, a note
in a brief or a feedback file, a line on an earlier page, or your reading of what they would want.
If you cannot quote the sentence, you do not have it.

## Proof

> **The default when there is no proof is to build the slot and leave it empty, and to say so.**
> Never generate a number.
>
> - Never emit a star rating, a review count, a "X people are viewing", a "sold in the last hour"
>   figure, or a testimonial with an invented name.
> - If a rating is required by the layout, take it from real data or render the block with the data
>   absent.
> - Countdown timers, scarcity counters and "only 3 left" belong to real inventory or to nothing.
>
> — store-design by uxgen, MIT (`references/proof.md`, selected lines)

Honest substitutes when there are no reviews, from the same source:

> - **The maker's own account.** Who made it, where, and why it is like this.
> - **The guarantee, stated concretely.** […] A shop that carries the risk is making a checkable
>   claim.
> - **The specification.** Weight, dimensions, material, origin. Facts are proof.
>
> — store-design by uxgen, MIT (`references/proof.md`, selected lines)

A badge is a statement of fact: "bestseller" needs sales behind it. A past result ("sold out in
N days") is shown with its number and source or not at all. A real limit is stated as its real
number; it needs no timer.

## Facts beside the action

The visitor decides where the button is. In the same block as the action, or within one phone
screen of it: the price and what it includes, delivery cost and time, the return rule, and what
happens after the tap. Before the sale opens: the opening date and what the sign-up will send.
Unknown ones are placeholders and the block is designed to hold together without them.

On a long page the action is reachable again after each long section, as the working control or a
link to it. A sticky phone bar is a test, not a rule: show it only after the inline action has left
the screen, and keep it clear of the phone's bottom inset (`env(safe-area-inset-bottom)`).

## Page states

Before the sale, on sale and sold out are three pages sharing one layout. One state value drives
the heading, every action, every line that mentions the state, and the FAQ. A waiting or sold-out
page leads with what the visitor can do now and the next date, not with what they missed. A
question renders only when both it and its answer are filled.

## Showing a set, a box or a bundle

- Every item the page shows appears with its full name, brand and size, as real text. On a phone
  that means at most two named items across. Which items to disclose is the merchant's offer, not a
  layout choice.
- A short list is a decision. Give each item room, state the count plainly as the specification,
  and match the grid to the count so no cell sits empty.
- Examples are labelled as examples, once, next to them. Show one example at a time, and do not
  name or style examples so that they read as options to choose.
- A caveat is said once, precisely, where it applies. Repeating it reads as doubt.
- The same fact has the same wording and number everywhere on the page, on phone and desktop.
- A brand is named with what it is there for, if the merchant supplies that reason. Otherwise the
  name alone, never an invented role, origin or curator.
- The packaging is described as plain facts (material, closure, what is inside the lid) and shown
  once in a prepared photograph. Do not show an interior, a wrapping or an extra nobody has
  confirmed.
- Text and anything that may change (the product list, a price) are never baked into an image.

## Forms

> - **One field.**
> - `type="email"`, `autocomplete="email"`, `inputMode="email"`. On a phone this is the difference
>   between the right keyboard and the wrong one.
> - A real `<label>`, not a placeholder standing in for one.
> - The button says what happens: "Notify me", not "Submit".
> - Errors appear next to the field, in words: "That address is missing an @".
> - Success replaces the form with a confirmation in the same space.
> - No pre-ticked newsletter box, anywhere, ever.
> - No address required to see a price.
> - No spin-the-wheel discount gate.
>
> — store-design by uxgen, MIT (`references/email-capture.md`, selected lines)

No modal before the visitor has seen the offer. Form fields are at least 16 px so iOS
does not zoom.
