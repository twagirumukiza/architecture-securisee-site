#!/usr/bin/env python3
"""Assemble les pages du site à partir des fragments de src/."""
import re, pathlib, json
ROOT=pathlib.Path(__file__).parent; SRC=ROOT/"src"; OUT=ROOT/"site"
NAV=[("index.html","Accueil"),("cours.html","① Cours"),("tp.html","② TP"),("quiz.html","③ Quiz"),("correction.html","Corrigé"),("telechargements.html","PDF")]
def page(fname,title,body,toc=True,extra_head="",extra_js=""):
    nav="".join(f'<a href="{h}"{" class=on" if h==fname else ""}>{t}</a>' for h,t in NAV)
    aside='<aside class="toc"><b>Sommaire</b><div class="links"></div></aside>' if toc else ""
    cls="wrap" if toc else "wrap single"
    return f'''<!doctype html>
<html lang="fr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>{title} — Architecture sécurisée · BTS SIO 2</title>
<meta name="description" content="Cours, travaux pratiques (Proxmox, pfSense, Kali) et quiz noté sur l'architecture sécurisée : DMZ, VLAN, pare-feu. BTS SIO 2 — par Twagirumukiza.">
<link rel="stylesheet" href="assets/style.css">{extra_head}</head><body>
<header class="topbar"><div class="in"><a class="brand" href="index.html">Architecture sécurisée<small>BTS SIO 2 · Bloc cybersécurité</small></a><nav class="main">{nav}</nav></div></header>
<div class="{cls}">{aside}<main>
{body}
</main></div>
<footer class="site"><div class="in"><span>© 2026 <b>Twagirumukiza</b> — Support pédagogique BTS SIO 2 · Cybersécurité</span><span><a data-linkedin href="#" target="_blank" rel="noopener">Suivre Twagirumukiza sur LinkedIn ↗</a></span></div></footer>
<script src="assets/config.js"></script><script src="assets/ids.js"></script><script src="assets/app.js"></script>{extra_js}
</body></html>'''

import html as _h
def _sh(m):
    lines=m.group(1).strip("\n").split("\n");o=[]
    for l in lines:
        l=_h.unescape(l)
        e=_h.escape(l,quote=False)
        if l.startswith("$ "): o.append('<span class="p">$</span> <span class="w">'+_h.escape(l[2:],quote=False)+'</span>')
        elif l.startswith("# "): o.append('<span class="p">#</span> <span class="w">'+_h.escape(l[2:],quote=False)+'</span>')
        elif l.startswith("## "): o.append('<span class="d"># '+_h.escape(l[3:],quote=False)+'</span>')
        elif l.startswith("OK: "): o.append('<span class="g">'+_h.escape(l[4:],quote=False)+'</span>')
        elif l.startswith("KO: "): o.append('<span class="r">'+_h.escape(l[4:],quote=False)+'</span>')
        elif l.startswith("WARN: "): o.append('<span class="y">'+_h.escape(l[6:],quote=False)+'</span>')
        else: o.append(e)
    return '<pre>'+"\n".join(o)+'</pre>'
def macros(t):
    t=re.sub(r'<pre class="sh">(.*?)</pre>',_sh,t,flags=re.S)
    t=re.sub(r'\{\{ON:(\w+)\|([^|}]+)\|?([^}]*)\}\}',lambda m:f'<div class="on-bar on-{m.group(1)}">Sur : {m.group(2)}'+(f' <span>— {m.group(3)}</span>' if m.group(3) else '')+'</div>',t)
    def q(m):
        return f'<div class="q"><b class="k">Question {m.group(1)}.</b> {m.group(2)}<textarea data-save="q-{m.group(1)}" placeholder="Votre réponse (enregistrée automatiquement)…"></textarea></div>'
    t=re.sub(r'\{\{Q:([\d.]+)\|(.*?)\}\}',q,t,flags=re.S)
    def chk(m):
        items=[x.strip() for x in m.group(2).split(";;")]
        r='<div class="checks"><b>Validation de fin de TP</b>'
        for i,x in enumerate(items): r+=f'<label><input type="checkbox" data-save="chk-{m.group(1)}-{i}"> {x}</label>'
        return r+'</div>'
    t=re.sub(r'\{\{CHK:(\w+)\|(.*?)\}\}',chk,t,flags=re.S)
    return t

ids={"cours":[],"tp":[]}
def frag(name):
    t=(SRC/name).read_text(encoding="utf-8")
    t=re.sub(r"\{\{READ:(\w+)\}\}",lambda m:f'<div class="readdone"><input type="checkbox" id="rd-{m.group(1)}" data-track="{m.group(1)}" data-sec="{m.group(1)}"><label for="rd-{m.group(1)}">J\'ai lu cette partie</label></div>',t)
    t=re.sub(r"\{\{DONE:(\w+)\}\}",lambda m:f'<div class="readdone"><input type="checkbox" id="rd-{m.group(1)}" data-track="{m.group(1)}" data-sec="{m.group(1)}"><label for="rd-{m.group(1)}">J\'ai terminé ce TP</label></div>',t)
    return macros(t)
def collect(kind,t):
    for m in re.finditer(r'data-track="([^"]+)"',t):
        if m.group(1) not in ids[kind]: ids[kind].append(m.group(1))
pages={}
cours=frag("cours.html"); collect("cours",cours)
tp=frag("tp.html"); collect("tp",tp)
pages["cours.html"]=("Cours",cours,True,"","")
pages["tp.html"]=("Travaux pratiques",tp,True,"","")
pages["correction.html"]=("Corrigé",frag("correction.html"),True,"","")
pages["index.html"]=("Accueil",frag("index.html"),False,"","")
pages["telechargements.html"]=("Téléchargements",frag("telechargements.html"),False,"","")
pages["quiz.html"]=("Quiz",frag("quiz.html"),False,"",'<script src="assets/quiz-data.js"></script><script src="assets/quiz.js"></script>')
(OUT/"assets"/"ids.js").write_text("window.IDS="+json.dumps(ids)+";",encoding="utf-8")
for f,(t,b,toc,h,j) in pages.items():
    (OUT/f).write_text(page(f,t,b,toc,h,j),encoding="utf-8")
print("ok",{k:len(v) for k,v in ids.items()})
