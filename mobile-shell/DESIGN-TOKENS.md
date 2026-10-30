# Mobile shell: design tokens and rules

Dense marketplace look: small type, tight gaps, white cards on a light-grey page, one brand colour, one "sale" colour.
Tokens live in `tailwind.config.js` (names below) and `src.css` (component classes). Rebuild with `node mobile-shell/build-css.mjs`.

## Colour
| Token | Value | Use |
|---|---|---|
| `brand` | `#7c3aed` (dark `#6d28d9`, soft `#f5f0ff`) | active nav, selected chip, primary buttons, links. Same as the site's `theme-color` |
| `sale` | `#e11d48` | price, discount badge, cart/deals badge. Nothing else is red |
| `star` | `#f59e0b` | rating stars (empty stars `#d1d5db`) |
| `ink` / `mute` | `#1f2937` / `#6b7280` | primary / secondary text, inactive icons |
| `line` | `#e5e7eb` | hairlines, sheet dividers |
| `page` | `#f4f4f5` | page background behind cards |

To re-skin: change `brand` and `sale` only.

## Type
Font: system UI stack (no web font, fastest on 4G). Sizes: `2xs` 10/12 (badges, old price, review count), `xs` 11/14 (card title, chips, nav labels), `sm` 13/18 (body), `base` 16 (cart total), `lg` 18 (quick-buy price). Weights: 400 body, 500 chips, 600 headings and active nav, 700 prices.

## Space, size, shape
- Page gutter 8px (`px-2`) around the grid, 12px (`px-3`) elsewhere. Grid gap 8px (`gap-2`). Card inner padding 8px.
- App bar 48px (`h-bar`), bottom nav 56px (`h-nav`) plus `env(safe-area-inset-bottom)`, chips 32px high.
- Minimum tap target 40px for header icons and nav; the small add (+) and stepper buttons are 28px with 8px gaps around them. Do not go smaller.
- Radius: cards 8px, chips and buttons full pill, sheets 16px top corners.
- Elevation: cards `shadow-card` (1px), bottom sheet `shadow-sheet`. Scrim `black/50`.
- Z-index: header and nav 30, scrim 40, sheets 50, toast 60.

## Components
- **Product card**: square image, `-NN%` badge top-left (only when old price exists, computed from prices), title clamped to 2 lines, bold sale-coloured price with struck old price, 5-star rating (fill set by `--fill`) with review count, round add button bottom-right. Tap card = quick-buy sheet, tap (+) = add 1.
- **Chips**: 32px pill, grey inactive, brand-filled active (`aria-selected`). Active chip scrolls to centre.
- **Bottom nav**: Home, Categories, Deals, Cart, Account. Active = brand colour, bold label, icon scaled 1.18. Badges: cart shows quantity (99+ cap), Deals shows unseen deals and clears on visit. Badge pops (scale 1.45) when the number goes up.
- **Header on scroll**: bar height never changes. Scrolling down more than 6px past 60px slides the chip row up behind the search bar and shrinks the search field to 34px; scrolling up or nearing the top brings it back.
- **Sheets**: bottom sheet (filters, quick buy) max 85dvh; left drawer 84% wide, max 340px. 300ms slide, 200ms scrim fade. Body scroll locked while open.

## Motion and touch
- Every tappable element has the `tap` utility: on `:active` scale .94 and opacity .8 over 100ms.
- `prefers-reduced-motion` turns all transitions and animations off.
- Skeleton cards (grey blocks with a 1.2s shimmer) fill the grid while a page loads: 6 on a fresh query, 4 on infinite scroll.

## History rules (back button)
1. Opening a sheet or drawer pushes one history entry that stores the open stack.
2. The device Back button, the scrim, Esc, and every close button all end in `history.back()`. Closing never leaves the site.
3. Leaving Home for another tab pushes one entry, so Back returns to Home. Hopping between other tabs replaces the entry.
4. Back on Home with nothing open leaves the site (normal browser behaviour).
5. Reloading, or going Forward into a stale entry, never reopens a sheet.
6. Actions that close sheets and then navigate (Buy now, pick a category in the drawer) go back first, then act, so no extra history entries pile up.

## Not copied
Layout patterns and interaction behaviour only. No logo, icon artwork, photography or text from any other store. Product thumbnails are emoji placeholders until real product photos are wired in.
