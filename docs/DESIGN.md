# Design direction

A matchday desk: the precision of a fixture sheet with the visual weight of a stadium scoreboard. The first viewport contains the match feed, not a promotional hero.

## Tokens

Ink `#101B3D`, paper `#F2F4F7`, rule `#C9D2E0`, blue `#1E4FD8`, live signal `#FF5A1F`, quiet `#52617B`. Quiet was darkened from the brief's starting value to meet AA contrast on paper. A white inset surface gives lists clear separation. Dark mode uses ink surfaces, pale text and restrained blue rules. Signal remains identical.

Orange denotes only an IN_PLAY or PAUSED state. A historical replay labels that state explicitly. The signal dot sits on ink or uses dark text on its orange pill; orange is never small text on white. No decorative orange, warning orange, or fake status dots.

## Typography

Self-hosted Archivo variable, expanded to 125%, weight 650–850 for team names, headings and scores. Inter variable for interface text. Body 16px, metadata 13–14px, section headings 22px, main heading 40–56px, live scores 44px. All numerals are tabular. Both fonts use swap and ship with OFL licenses.

## Layout

56px sticky header → season/title row → full-width live strip or next kickoff → sticky section tabs → schedule and side rail. On desktop the split is 60/40. At smaller sizes the tabs select one pane. Fixture rows use hairlines, fixed score space and flexible team names; only live matches have card surfaces. A complete table remains available through the Table tab. Its team column and header are sticky in its own scroll region.

No decorative imagery is needed. Local monograms support the archival demo; live club crests use only the approved provider CDNs with a fallback. A simple star icon serves as an independent project mark, not an official UEFA logo.

## Interaction and states

Tabs support arrows, Home/End and visible keyboard focus. Match rows open a native modal dialog with focus containment and return. Skeleton rows use the final heights. Empty, unavailable and stale messages remain inside the affected section. An unavailable scorer feed does not hide matches.

The live dot is the sole looping motion. Score updates receive one short flash. Reduced motion disables both. Relative update text changes every second without repeatedly announcing the time to screen readers. Only changed scores are announced.

## Review against the brief

Preserves the supplied palette, editorial rows, expanded type, mobile tabs, desktop split, qualification bands and honest live semantics. Theme follows the system until explicitly toggled; the preference lasts only for the current page. Historical data keeps its actual 2024/25 season label. A missing live credential produces an actionable feed message and replay link, never fabricated current data.
