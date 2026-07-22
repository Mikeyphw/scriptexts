# MenOfPorn Modern UI Audit

Audited build: `menofporn_modern_ui_build.zip` (`@version 1.2.0`)

Also checked: directly linked `/mnt/data/menofporn_modern_ui/menofporn_modern_ui.user.js`, which currently reports `@version 1.0.0` and is not identical to the ZIP build.

## Executive summary

The feed redesign has a strong foundation: responsive grid, coherent dark tokens, useful local saved/viewed state, large primary controls, reduced-motion handling, safe-area support, and restrained borderless surfaces. The main weaknesses are implementation drift, an incomplete individual-post experience, overly aggressive article-title typography, undersized secondary text, contrast loss in viewed/OLED states, and accessibility gaps in the drawer.

### Scores

| Area | Score | Summary |
|---|---:|---|
| Typography | 6.5/10 | Good body sizing, but article titles are too large/tight and several labels are too small. |
| Color and contrast | 7/10 | Main palette is strong; faint text, viewed cards, and OLED hierarchy need repair. |
| Feed UI | 7.5/10 | Clean and responsive, with a few density and discoverability issues. |
| Post-page UI | 4.5/10 | Dedicated CSS exists, but the promised contextual controls and structured components do not. |
| UX and accessibility | 5.5/10 | Useful features, but misleading search scope, no focus trap/inert background, immediate destructive actions, and premature viewed tracking. |
| Overall | 6/10 | Promising redesign that needs a correctness and accessibility pass before more decoration. |

## P0: correctness and regression findings

### 1. Direct userscript and ZIP are different builds

- The ZIP contains `@version 1.2.0`.
- The directly linked userscript currently contains `@version 1.0.0`.
- The direct file lacks the home-page `code-block-*` ad rule and the post ellipsis reset found in the ZIP.

This can make users install the stale build while believing they received the fixed version. The release process should generate the standalone script and ZIP from one canonical file, then verify byte-for-byte equality.

### 2. README advertises post features absent from the script

The README claims:

- reading progress
- save/comments/copy-link action bar
- Back/Save/Comments/Top/More mobile controls
- wider desktop media
- first-image eager loading
- structured threaded comments
- compact ratings
- enhanced previous/next navigation

The v1.2.0 script contains no implementation markers or behavior for these features. The post page currently gets broad CSS normalization only. Either implement these features or remove the claims.

### 3. Search scope is misleading

The search drawer searches only `article.bloglo-article` elements already loaded in the current DOM.

- On the home page, it searches the currently loaded feed, not the whole site.
- On an individual post, it generally searches only that one post.

Rename it to “Search this page” or connect it to the site's real search endpoint. On posts, the search button should open true site search.

## Typography audit

### Strengths

- Base body size of 16px and line-height 1.6 are comfortable.
- Post body text at 17–19px and line-height 1.72 is readable.
- Feed card hierarchy is clear: category, title, excerpt, metadata.
- Full-post ellipsis inheritance is correctly reset in the ZIP build.

### Problems

1. **Individual-post titles are oversized.** A 133-character title can render at roughly 39px on a 390px phone, with `line-height: 1.02` and `letter-spacing: -.055em`. This creates a dense wall at the top of the article.

   Recommended mobile range: `clamp(28px, 8vw, 40px)`, line-height `1.08–1.14`, letter-spacing no tighter than `-.035em`.

2. **The article measure is slightly wide for prose.** The same 780px container is used for text and media. Use a 680–720px prose column while allowing media to break out to 880–980px on desktop.

3. **Unsupported pseudo-variable weights are overused.** Values such as 720, 760, 780, 820, 850, and 860 are unpredictable with system fonts because no variable font is loaded. Use 400, 500, 600, 700, and 800, or deliberately load a variable font.

4. **Small labels are too small.** Bottom-nav labels are 10px, category/viewed labels are 11px, and several metadata rows are 12px. Raise persistent UI text to at least 12px, metadata to 13px, and interactive chips to 13–14px.

5. **Post metadata still inherits feed-oriented styling.** It remains compact, 12px, and may ellipsize category data. Post metadata needs a separate, non-clamped layout.

6. **Comments are not typographically normalized.** Comment bodies get a surface and padding, but no explicit text size, line-height, heading hierarchy, or nesting rhythm.

## Color and contrast audit

### Measured strengths

- Primary text `#f2f4f7` on `#090b0f`: approximately 17.9:1.
- Muted text `#9aa4b2` on main dark surfaces: approximately 6.0–7.8:1.
- Accent `#d35cff` on main dark surfaces: approximately 4.9–6.3:1.
- Dark selected-button text on the accent: approximately 6.2:1.

### Problems

1. **Faint text fails for normal-size copy.** `#697383` measures roughly 3.2–4.1:1 across the surfaces where it is used. It appears in 12px metadata and placeholders, where WCAG AA requires 4.5:1.

   Promote it to approximately `#7f8998` or use the existing muted token.

2. **Viewed cards dim all content using opacity.** At 0.67 opacity, muted text drops to about 3.9:1 and faint text to about 2.4:1. Do not reduce text opacity. Dim only the image, add a viewed badge, and slightly lower title emphasis without crossing contrast thresholds.

3. **OLED surfaces have insufficient tonal separation.** `#000`, `#080808`, and `#101010` make borderless cards and drawers nearly merge. Increase OLED surface steps, for example `#000`, `#0d0f12`, `#171a1f`, and `#22262d`.

4. **Long-form text is almost pure white.** The very high contrast is technically excellent but can feel glaring on a black background. Keep headings bright and use a softer body token around `#dce1e7`.

5. **Header and bottom bar depend heavily on blur.** On devices without reliable `backdrop-filter`, the translucent surfaces may not separate enough from content. Add an opaque fallback or stronger tonal background under `@supports not`.

## UI audit

### Feed strengths

- Clear responsive grid: one column on phones, two on medium screens, three on wide screens.
- Flat cards use tonal separation instead of decorative borders.
- Card action placement is understandable.
- Empty state, filter chips, bottom navigation, and drawers are visually coherent.
- Ad blocks are correctly hidden in the ZIP's home-feed CSS and are direct grid children, so they should not leave empty grid slots.

### Feed improvements

- Category pills are only 29px tall and filter chips 40px. Interactive targets should be at least 44px, preferably 48px on phones.
- Card actions are 42px square. Increase them to 44–48px.
- The entire card is not clickable. Make the non-action card area activate the post while keeping nested controls independent.
- Image cropping uses `object-fit: cover` with default centered positioning. A top-centered crop or user-selectable “fit images” mode would reduce clipped faces/heads.
- The viewed state is visually too punitive. It should communicate status, not make content difficult to scan.

### Post-page weaknesses

- Mobile bottom navigation remains generic Home/Browse/Search/Saved/More instead of becoming article-specific.
- There is no direct way to save the current post.
- There is no jump-to-comments or jump-to-top control.
- No reading-progress component exists.
- Previous/next navigation and ratings are not actually redesigned by dedicated selectors.
- Nested comments are not given mobile-safe indentation rules.
- Media does not break wider than the 780px article container despite the README claim.

## UX and accessibility audit

### Strengths

- Focus-visible outlines are present.
- Escape closes the drawer.
- Focus returns to the trigger after closing.
- Safe-area insets and reduced-motion preferences are supported.
- Mobile bottom-nav targets are tall enough.
- Decorative search thumbnails use empty alt text.

### Problems

1. **No focus trap or inert background.** Keyboard users can tab behind an open modal drawer. Set the main page and fixed navigation to `inert`, trap focus inside the drawer, and restore state on close.

2. **Triggers do not expose drawer state.** Add `aria-expanded` and `aria-controls` to Search, Browse, Filter, and More buttons.

3. **Bottom navigation lacks current-page semantics.** Only Saved gets a visual class. Use `aria-current="page"` or `aria-pressed` and highlight Home/post context consistently.

4. **Destructive data actions execute immediately.** Clearing saved/viewed data should require confirmation or provide a reliable Undo action.

5. **Posts are marked viewed immediately on load.** An accidental open counts as viewed. Mark after a dwell time, meaningful scroll, or page visibility threshold.

6. **Toast duration is short.** 2.2 seconds is easy to miss. Use roughly 4 seconds and keep important undo actions available longer.

7. **Expandable menu groups have weak affordance.** Add a chevron and open-state rotation to `details > summary`.

8. **The search shortcut `/` is useful but undiscoverable.** Show it as a desktop hint in the search button or drawer.

9. **The drawer contains nested scrolling.** Large menu sections create a scroll area inside the drawer's own scroll area, which is awkward on touch devices. Prefer one scroll container or collapsible chunks without a fixed 360px inner height.

## Performance observations

- `content-visibility`, lazy loading, async decoding, and debounced mutation handling are good choices.
- The MutationObserver rescans every article and image after each content insertion. With long infinite-scroll sessions this becomes progressively more expensive. Process only newly added subtrees.
- Multiple fixed `backdrop-filter` layers plus blurred images can cause mobile GPU jank. Add a reduced-transparency/performance mode and opaque fallbacks.

## Recommended implementation order

### Phase 1: release correctness

1. Choose one canonical source file.
2. Regenerate the standalone script and ZIP from it.
3. Add release checks for version equality, identical script bytes, syntax, ZIP integrity, ad rule, and post clamp reset.
4. Implement the README's post features or trim the README to reality.

### Phase 2: post-page UX

1. Contextual mobile navigation: Back, Save, Comments, Top, More.
2. Save/copy/comment action row.
3. Reading progress.
4. Separate prose and media widths.
5. Dedicated metadata, ratings, post navigation, comments, and reply-form styling.

### Phase 3: typography and contrast

1. Reduce article-title scale and negative tracking.
2. Standardize font weights.
3. Raise all persistent UI text to 12–14px.
4. Replace the faint token and remove text opacity from viewed cards.
5. Strengthen OLED surface separation and soften long-form body white.

### Phase 4: accessibility and interaction polish

1. Focus trap and inert background.
2. ARIA expanded/current states.
3. Confirmation or Undo for destructive actions.
4. Read-threshold viewed tracking.
5. Larger small touch targets.
6. Efficient incremental MutationObserver processing.
