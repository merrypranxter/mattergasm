# MATTERGASM
## A psychedelic matter-genesis art studio

**Mathematics grows the matter. The artist directs the beauty.**

Mattergasm is a new, independent, mobile-first mathematical art instrument inspired by [EX NIHILO](https://github.com/merrypranxter/ex_nihilo_art_app) and [EX NIHILO II](https://github.com/merrypranxter/ex_nihilo_2), intended to grow brilliant, hypnotic, strikingly different animated patterns and textures from true mathematical processes rather than cosmetic filters.

**Current status:** planning complete; no app implementation yet. Work begins at **Phase 01** when the artist says **Next**. See [the 15-phase roadmap](docs/ROADMAP.md).

### The money rule — zero paid hosting
- **Never call Netlify or initiate its builds, deploy previews, API calls or paid agents.** This repository is not to be connected to Netlify during development.
- **GitHub Pages is the preferred preview host**, free for this public repository within platform limits. Direct static HTML/CSS/JS with relative asset paths should work without a server-side API or a custom paid deployment. Use a build tool only if warranted, and only with no-cost workflows.
- **Every meaningful phase must include a working HTML preview**, ideally the repo-root `index.html` deployable to GitHub Pages, plus a single-file standalone preview when feasible. HTML must have real working controls, not a fake screenshot.
- No new dependency, plugin, network API, or cloud render service should incur charges. Warn and get permission before any service with possible cost.

### Publishing the playable app
Once Phase 01 adds a working root `index.html`:
1. Go to this repo's **Settings → Pages**.
2. Under **Build and deployment → Source**, select **Deploy from a branch**.
3. Pick **main** and **/(root)**, then **Save**.
4. The expected public URL is **https://merrypranxter.github.io/mattergasm/** once GitHub confirms the deployment. It is **not live yet**.
5. Each new phase updates the same page. Do not use Netlify.

GitHub Pages is static hosting, but client-side JavaScript, Canvas2D, WebGL2, gesture controls, local download and browser-side encoders can run there. It does *not* run server-side Netlify Functions. For large libraries/builds, adapt the publishing strategy without incurring cost or claiming an untested video codec works.

### What the artist requires
- Colorful, visually rewarding, psychedelic, strange, prismatic, interesting in motion, **artworthy** at first launch rather than scientific-demo defaults.
- Native designed 1:1 and 9:16 compositions, with other aspect ratios when appropriate.
- The entire existing 199-palette catalog, plus free editable custom colors, per-stop shuffle, vivid/neon controls, warm/cool filtering, and independent background color.
- Touchable art: seed, draw constraints, steer, sculpt, pan, pinch, Undo/Redo. Save worlds and DNA separately.
- A genuine **SURPRISE ME** button for all independent art variables, always editable after the surprise.
- Clear **NEW DESIGN** confirmation; never erase surviving world history by touching a palette/camera control.
- Eventually high-resolution PNG/GIF and real MP4 where supported, 2–3 second periodic loops, GIF/MP4 scrub and export QA.
- Keep large artwork viewport on iPhone, compact grouped tabs, and no gigantic wasted header.

### Safe source inspirations
Read the original repositories and the artist's related projects. Copy narrowly and check interfaces rather than moving whole apps or mutating the original repositories: `ex_nihilo_art_app`, `ex_nihilo_2`, `crystal_math_art`, `phason_riot`, `strataclysm`, `lightloom_art`, `impossibleloom`, `frothrot`, `liquid_light_show`, `caustic_art_app`, `belousov_zhabotinsky`, `optical_liar`, `slimemoldartapp`.

### Development rhythm
**User: “Next” →** implement the next bounded roadmap phase (or honest subphase), test code available in the current runtime, update the GitHub repo, give the working preview path/link *only after confirmed*, and explain what genuinely changed. Do not skip directly to decorative extras or deploy elsewhere.

No phase is complete merely because its README claims it is. Distinguish source written, logic tests passing, browser render verified and actual iPhone Safari/CapCut exports verified.
