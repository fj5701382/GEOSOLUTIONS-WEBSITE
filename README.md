# GEOSOLUTION Educational Services — Website

## Project Structure

```
geosolution/
├── index.html              ← Home page
├── css/
│   └── style.css           ← All styles (responsive, animations, themes)
├── js/
│   └── script.js           ← Navbar, scroll effects, counters, form
├── pages/
│   ├── about.html          ← About Us page
│   ├── services.html       ← Services & Courses page
│   ├── techhub.html        ← GeoTech Academy page
│   └── contact.html        ← Contact page with form
└── images/                 ← (Place your own images here)
```

---

## How to Run in VS Code

### Option 1 — Live Server (Recommended)
1. Open VS Code
2. Install the **Live Server** extension (by Ritwick Dey)
3. Open the `geosolution/` folder in VS Code
4. Right-click `index.html` → **Open with Live Server**
5. Your browser opens at `http://127.0.0.1:5500`

### Option 2 — Open directly
1. Navigate to the `geosolution/` folder on your computer
2. Double-click `index.html` to open in your browser
   *(Note: some features like form submission work best with a server)*

---

## Pages
| File | URL | Description |
|------|-----|-------------|
| `index.html` | `/` | Home — hero, services cards, academic, tech hub, stats, testimonials |
| `pages/about.html` | `/pages/about.html` | About — story, mission, values, team |
| `pages/services.html` | `/pages/services.html` | Services — JAMB, WAEC, CBT, IELTS, Consultancy |
| `pages/techhub.html` | `/pages/techhub.html` | GeoTech Academy — 8 tech programs |
| `pages/contact.html` | `/pages/contact.html` | Contact — form, map, contact info |

---

## Features
- ✅ Fully responsive (mobile, tablet, desktop)
- ✅ Sticky navbar with scroll effect and mobile hamburger menu
- ✅ Hero with animated floating badges and search bar
- ✅ Animated count-up statistics (IntersectionObserver)
- ✅ Scroll-reveal animations on all sections
- ✅ Hover tilt effects on cards
- ✅ Smooth scroll-to-top button
- ✅ Contact form with loading animation
- ✅ Google Fonts (Poppins)
- ✅ Font Awesome icons
- ✅ Google Maps embed on contact page

---

## Customisation

### To change colours, edit CSS variables in `css/style.css`:
```css
:root {
  --teal:   #2ec4b6;   /* Primary brand colour */
  --yellow: #f7c948;   /* Accent colour */
  --dark:   #1a2332;   /* Dark backgrounds */
}
```

### To add real images:
- Place your photos in the `images/` folder
- Replace `https://images.unsplash.com/...` URLs in the HTML files

### To connect the contact form to a real backend:
- Replace the fake submit handler in `js/script.js` with a `fetch()` call to your API endpoint
- Or use services like **EmailJS**, **Formspree**, or **Netlify Forms**

---

## Tech Stack
- **HTML5** — Semantic markup
- **CSS3** — Custom properties, Grid, Flexbox, animations
- **Vanilla JavaScript** — No frameworks or build tools required
- **Google Fonts** — Poppins
- **Font Awesome 6** — Icons (CDN)

---

*Built for Geosolution Educational Services, Lagos Nigeria — Est. 2012*
