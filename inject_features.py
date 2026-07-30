"""
Feature Mega-Pack Injector
Injects loader, toast, and other new asset references into all HTML pages.
Also modifies testimonials to carousel in index.html.
"""

import os
import re

PAGES_DIR = r"c:\Users\HomePC\GEOSOLUTIONS-WEBSITE\pages"
CSS_DIR = r"c:\Users\HomePC\GEOSOLUTIONS-WEBSITE\css"
JS_DIR = r"c:\Users\HomePC\GEOSOLUTIONS-WEBSITE\js"

def inject_assets():
    """Inject loader.css, loader.js, and toast.js into all HTML pages."""
    print("Injecting new assets into all HTML pages...")
    
    for filename in os.listdir(PAGES_DIR):
        if not filename.endswith(".html"):
            continue
        
        filepath = os.path.join(PAGES_DIR, filename)
        with open(filepath, "r", encoding="utf-8") as f:
            html = f.read()
        
        changed = False
        
        # Add loader.css before </head> (if not already present)
        if 'loader.css' not in html:
            html = html.replace('</head>', '  <link rel="stylesheet" href="../css/loader.css">\n</head>')
            changed = True
        
        # Add loader.js right after the opening <body> tag (if not already present)
        if 'loader.js' not in html:
            html = html.replace('</head>', '  <script src="../js/loader.js"></script>\n</head>')
            changed = True
        
        # Add toast.js before </body> (if not already present)
        if 'toast.js' not in html:
            html = html.replace('</body>', '<script src="../js/toast.js"></script>\n</body>')
            changed = True
        
        if changed:
            with open(filepath, "w", encoding="utf-8") as f:
                f.write(html)
            print(f"  ✓ {filename}")

def convert_testimonials_to_carousel():
    """Convert the static testimonials grid to a carousel in index.html."""
    print("Converting testimonials to carousel...")
    
    filepath = os.path.join(PAGES_DIR, "index.html")
    with open(filepath, "r", encoding="utf-8") as f:
        html = f.read()
    
    old_section = '''      <div class="testimonials-grid">
        <div class="testi-card reveal">
          <div class="quote">"</div>
          <div class="testi-stars">\u2605\u2605\u2605\u2605\u2605</div>
          <p>Geosolution helped me score 298 in JAMB! The tutors are amazing and the CBT practice sessions gave me the
            confidence I needed. I got admission into UNILAG.</p>
          <div class="testi-author">
            <div class="testi-avatar">AO</div>
            <div>
              <h5>Adebola Okafor</h5>
              <small>JAMB Student, 2023</small>
            </div>
          </div>
        </div>
        <div class="testi-card reveal">
          <div class="quote">"</div>
          <div class="testi-stars">\u2605\u2605\u2605\u2605\u2605</div>
          <p>The Tech Hub program changed my life. I went from zero coding knowledge to building full-stack apps in just
            6 months. Now I work remotely for a UK company.</p>
          <div class="testi-author">
            <div class="testi-avatar">KA</div>
            <div>
              <h5>Kingsley Abe</h5>
              <small>Tech Hub Graduate, 2022</small>
            </div>
          </div>
        </div>
        <div class="testi-card reveal">
          <div class="quote">"</div>
          <div class="testi-stars">\u2605\u2605\u2605\u2605\u2605</div>
          <p>I struggled with IELTS twice before Geosolution. Their IELTS coaching is structured and thorough. I scored
            7.5 and I\u2019m now studying in Canada!</p>
          <div class="testi-author">
            <div class="testi-avatar">FE</div>
            <div>
              <h5>Funmilayo Eze</h5>
              <small>IELTS Student, 2024</small>
            </div>
          </div>
        </div>
      </div>'''

    new_section = '''      <div class="testi-carousel" id="testiCarousel">
        <div class="testi-track">
          <div class="testi-card">
            <div class="quote">\u201c</div>
            <div class="testi-stars">\u2605\u2605\u2605\u2605\u2605</div>
            <p>Geosolution helped me score 298 in JAMB! The tutors are amazing and the CBT practice sessions gave me the confidence I needed. I got admission into UNILAG.</p>
            <div class="testi-author">
              <div class="testi-avatar">AO</div>
              <div><h5>Adebola Okafor</h5><small>JAMB Student, 2023</small></div>
            </div>
          </div>
          <div class="testi-card">
            <div class="quote">\u201c</div>
            <div class="testi-stars">\u2605\u2605\u2605\u2605\u2605</div>
            <p>The Tech Hub program changed my life. I went from zero coding knowledge to building full-stack apps in just 6 months. Now I work remotely for a UK company.</p>
            <div class="testi-author">
              <div class="testi-avatar">KA</div>
              <div><h5>Kingsley Abe</h5><small>Tech Hub Graduate, 2022</small></div>
            </div>
          </div>
          <div class="testi-card">
            <div class="quote">\u201c</div>
            <div class="testi-stars">\u2605\u2605\u2605\u2605\u2605</div>
            <p>I struggled with IELTS twice before Geosolution. Their IELTS coaching is structured and thorough. I scored 7.5 and I\u2019m now studying in Canada!</p>
            <div class="testi-author">
              <div class="testi-avatar">FE</div>
              <div><h5>Funmilayo Eze</h5><small>IELTS Student, 2024</small></div>
            </div>
          </div>
          <div class="testi-card">
            <div class="quote">\u201c</div>
            <div class="testi-stars">\u2605\u2605\u2605\u2605\u2605</div>
            <p>My son passed all his WAEC subjects with A\u2019s and B\u2019s thanks to Geosolution. The teachers are dedicated and the environment is excellent for learning.</p>
            <div class="testi-author">
              <div class="testi-avatar">MN</div>
              <div><h5>Mrs. Ngozi Obi</h5><small>Parent, 2024</small></div>
            </div>
          </div>
          <div class="testi-card">
            <div class="quote">\u201c</div>
            <div class="testi-stars">\u2605\u2605\u2605\u2605\u2605</div>
            <p>The admission processing service saved me so much stress. They handled everything from JAMB change of institution to my post-UTME screening. Highly recommend!</p>
            <div class="testi-author">
              <div class="testi-avatar">TO</div>
              <div><h5>Tunde Olamide</h5><small>Admission Student, 2023</small></div>
            </div>
          </div>
        </div>
        <div class="testi-dots" id="testiDots"></div>
      </div>'''

    if old_section in html:
        html = html.replace(old_section, new_section)
        with open(filepath, "w", encoding="utf-8") as f:
            f.write(html)
        print("  \u2713 Converted testimonials to carousel in index.html")
    else:
        print("  \u26a0 Could not find exact testimonials grid match - skipping carousel conversion")
        # Try a regex-based approach
        pattern = r'<div class="testimonials-grid">.*?</div>\s*</div>\s*</div>'
        if re.search(pattern, html, re.DOTALL):
            html = re.sub(pattern, new_section, html, count=1, flags=re.DOTALL)
            with open(filepath, "w", encoding="utf-8") as f:
                f.write(html)
            print("  \u2713 Converted testimonials to carousel via regex")

if __name__ == "__main__":
    inject_assets()
    convert_testimonials_to_carousel()
    print("\nDone!")
