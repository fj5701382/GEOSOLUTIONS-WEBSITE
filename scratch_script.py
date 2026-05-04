import os

pages_dir = r"c:\Users\HomePC\GEOSOLUTIONS-WEBSITE\pages"

button_html_public = """        <button class="theme-toggle" id="themeToggle" aria-label="Toggle theme" title="Toggle dark/light mode">
          <span class="slider">
            <span class="slider-icon sun">☀️</span>
            <span class="slider-icon moon">🌙</span>
          </span>
        </button>"""

for filename in os.listdir(pages_dir):
    if not filename.endswith(".html"):
        continue
    filepath = os.path.join(pages_dir, filename)
    
    # Use utf-8 encoding for safety
    with open(filepath, "r", encoding="utf-8") as f:
        content = f.read()
    
    # 1. Add script tag to head
    if 'src="../js/theme.js"' not in content:
        content = content.replace("</head>", '<script src="../js/theme.js"></script>\n</head>')
    
    # 2. Add button
    # 404.html uses old button style, replace it
    if filename == "404.html":
        import re
        content = re.sub(r'<button class="theme-toggle" onclick="toggleTheme\(\)".*?</button>', button_html_public, content, flags=re.DOTALL)
    
    # Add button to public pages with nav-actions
    elif filename in ["about.html", "contact.html", "programs.html", "services.html", "techhub.html", "admin.html"]:
        if "id=\"themeToggle\"" not in content:
            # Insert button right before </div> closing nav-actions
            content = content.replace('<div class="nav-actions">\n', f'<div class="nav-actions">\n{button_html_public}\n')

    # Add button to dashboard pages (topbar-right)
    elif filename in ["student-dashboard2.html", "teacher-dashboard2.html", "admin-dashboard2.html"]:
        if "id=\"themeToggle\"" not in content:
            # Insert before <div class="topbar-user">
            button_dashboard = button_html_public.replace('class="theme-toggle"', 'class="theme-toggle" style="margin-right: 12px;"')
            content = content.replace('<div class="topbar-user">', f'{button_dashboard}\n        <div class="topbar-user">')

    # Add button to auth pages
    elif filename in ["index2.html", "register2.html"]:
        if "id=\"themeToggle\"" not in content:
            # Insert in auth-page
            button_auth = button_html_public.replace('class="theme-toggle"', 'class="theme-toggle" style="position:absolute; top:20px; right:20px; z-index:100;"')
            content = content.replace('<div class="auth-page">', f'<div class="auth-page">\n  {button_auth}')
    
    with open(filepath, "w", encoding="utf-8") as f:
        f.write(content)
