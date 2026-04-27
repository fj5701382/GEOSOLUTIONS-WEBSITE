# Responsiveness Fix TODO

## Global CSS (all stylesheets)
- [x] Add `html, body { overflow-x: hidden; }`
- [x] Fix `.geo-logo-img` height: `max-height: 48px !important; height: auto !important;`

## `css/style.css` (older theme)
- [x] Fix `.hero` `padding-top` to clear fixed navbar (`calc(72px + 1.5rem)`)
- [x] Add complete `.mobile-nav` overlay styles (slide-in, backdrop)
- [x] Fix `.hero-stats` (`flex-wrap`, `justify-content: center`)
- [x] Fix `.hero-search` (stack vertically, `width: 100%` at ≤768px)
- [x] Hide `.hero-float-badge` at ≤480px
- [x] Fix grids: `.services-detail-grid`, `.services-grid`, `.achievements-inner`, `.tech-programs-grid`
- [x] Reduce section padding (`90px` → `60px` tablet / `40px` mobile)
- [x] Reduce `.contact-form` padding on mobile
- [x] Fix `.academic-badge` position on mobile

## `css/styles.css` (newer theme)
- [x] Fix `.search-wrapper input` width
- [x] Fix `.toast` width for mobile
- [x] Add missing mobile nav responsive rules
- [x] Reduce section padding on mobile
- [x] Add admin table column-hiding for mobile

## `css/auth.css`
- [x] Add `overflow-x: hidden`
- [x] Fix logo image
- [x] Reduce orb sizes at ≤480px

## HTML inline-style fixes
- [x] `pages/techhub.html`: Remove hardcoded `grid-template-columns: repeat(4,1fr)`
- [x] `pages/admin.html`: Remove `overflow-x:auto` wrappers, fix search input widths
- [x] `pages/admin-dashboard2.html`: Add responsive table and grid rules
- [x] `pages/student-dashboard2.html`: Add responsive grid rules
- [x] `pages/teacher-dashboard2.html`: Add responsive table and grid rules

## JS fixes
- [x] Fix `script.js` mobile nav selector to target `.mobile-nav` correctly

## Testing
- [x] Verified no horizontal scroll via `overflow-x: hidden` on html/body
- [x] Verified mobile nav CSS exists for all themes
- [x] Verified all grids collapse to 1fr on ≤480px

---

# Image Responsiveness & Lazy Loading TODO

## CSS Updates
- [x] Add lazy-load fade-in animation + `.img-responsive` utility to `css/style.css`
- [x] Add lazy-load fade-in animation to `css/styles.css`
- [x] Add global `img` responsive rule + lazy-load styles to `css/style2.css`
- [x] Add global `img` responsive rule to `css/auth.css`


