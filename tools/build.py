"""Rimette insieme l'app in un unico file HTML, da pubblicare o condividere.

uso: python3 tools/build.py            -> dist/orca-school-poker.html
Legge index.html e mette dentro, nello stesso ordine, tutti i file css/ e js/ collegati.
"""
import os, re

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, "dist", "orca-school-poker.html")


def read(rel):
    with open(os.path.join(ROOT, rel), encoding="utf-8") as f:
        return f.read()


html = read("index.html")
css = re.findall(r'<link rel="stylesheet" href="(css/[^"]+)">', html)
js = re.findall(r'<script src="(js/[^"]+)"></script>', html)

# i <link> locali diventano un solo <style>, gli <script src> un solo <script>
style = "<style>\n" + "".join(read(c) for c in css) + "</style>"
script = "<script>\n" + "".join(read(j) for j in js).replace("</script", "<\\/script") + "</script>"

lines, put_css, put_js = [], False, False
for line in html.split("\n"):
    if re.match(r'<link rel="stylesheet" href="css/', line):
        if not put_css:
            lines.append(style); put_css = True
    elif re.match(r'<script src="js/', line):
        if not put_js:
            lines.append(script); put_js = True
    else:
        lines.append(line)

os.makedirs(os.path.dirname(OUT), exist_ok=True)
with open(OUT, "w", encoding="utf-8") as f:
    f.write("\n".join(lines))
print(f"creato {os.path.relpath(OUT, ROOT)}: {len(css)} css, {len(js)} js, {os.path.getsize(OUT) // 1024} KB")
