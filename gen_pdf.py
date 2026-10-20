import subprocess, pathlib, base64
from playwright.sync_api import sync_playwright
ROOT=pathlib.Path(__file__).parent; SITE=ROOT/"site"; PDF=SITE/"pdf"; PDF.mkdir(exist_ok=True)
base="file://"+str(SITE)+"/"
FOOT='''<div style="width:100%;font-size:8px;color:#555;padding:0 14mm;display:flex;justify-content:space-between;font-family:sans-serif"><span>© 2026 Twagirumukiza — BTS SIO 2 · Architecture sécurisée</span><span>Page <span class="pageNumber"></span> / <span class="totalPages"></span></span></div>'''
jobs=[("cours.html","Cours_Architecture_securisee.pdf"),("tp.html","Cahier_TP_Architecture_securisee.pdf"),("correction.html","Corrige_Architecture_securisee.pdf")]
with sync_playwright() as p:
    b=p.chromium.launch();ctx=b.new_context(color_scheme="light");pg=ctx.new_page()
    for src,out in jobs:
        pg.goto(base+src);pg.wait_for_timeout(400)
        pg.emulate_media(media="print")
        pg.evaluate("document.querySelectorAll('details').forEach(d=>d.open=true)")
        pg.pdf(path=str(PDF/out),format="A4",print_background=True,margin={"top":"14mm","bottom":"16mm","left":"13mm","right":"13mm"},display_header_footer=True,header_template="<span></span>",footer_template=FOOT)
        print(out,(PDF/out).stat().st_size//1024,"Ko")
    # EPUB du cours
    pg.emulate_media(media="screen");pg.goto(base+"cours.html");pg.wait_for_timeout(300)
    tmp=ROOT/"tmp_epub";tmp.mkdir(exist_ok=True)
    for i,el in enumerate(pg.query_selector_all("main svg.diag")):
        el.screenshot(path=str(tmp/f"schema{i}.png"))
    html=pg.evaluate("""()=>{const m=document.querySelector('main').cloneNode(true);
      m.querySelectorAll('.readdone,textarea,button,.copy,script').forEach(e=>e.remove());
      let i=0;m.querySelectorAll('svg.diag').forEach(s=>{const im=document.createElement('img');im.src='schema'+(i++)+'.png';im.alt='Schéma';s.replaceWith(im)});
      m.querySelectorAll('details').forEach(d=>{const s=d.querySelector('summary');const h=document.createElement('p');h.innerHTML='<b>'+s.innerHTML+'</b>';s.remove();d.before(h);d.replaceWith(...d.childNodes)});
      return m.innerHTML}""")
    b.close()
(tmp/"cours.html").write_text('<!doctype html><html lang="fr"><head><meta charset="utf-8"><title>Architecture sécurisée</title></head><body>'+html+'</body></html>',encoding="utf-8")
subprocess.run(["pandoc","cours.html","-f","html","-t","epub3","-o",str(PDF/"Cours_Architecture_securisee.epub"),"--metadata","title=Architecture sécurisée : DMZ, VLAN, pare-feu — Le cours","--metadata","author=Twagirumukiza","--metadata","lang=fr","--toc","--toc-depth=2","--split-level=2"],cwd=tmp,check=True)
print("epub ok",(PDF/"Cours_Architecture_securisee.epub").stat().st_size//1024,"Ko")
