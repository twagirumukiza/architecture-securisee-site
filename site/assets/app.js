(function(){
const NS="archi-sec:v1:";
const S={
  get(k,d){try{const v=localStorage.getItem(NS+k);return v===null?d:JSON.parse(v)}catch(e){return d}},
  set(k,v){try{localStorage.setItem(NS+k,JSON.stringify(v))}catch(e){}},
  del(k){try{localStorage.removeItem(NS+k)}catch(e){}},
  all(){const o={};try{for(let i=0;i<localStorage.length;i++){const k=localStorage.key(i);if(k.startsWith(NS))o[k.slice(NS.length)]=JSON.parse(localStorage.getItem(k))}}catch(e){}return o}
};
window.AS=S;

function ready(f){document.readyState!=="loading"?f():document.addEventListener("DOMContentLoaded",f)}
ready(function(){
  // pied de page / config
  const cfg=window.SITE||{};
  document.querySelectorAll("[data-linkedin]").forEach(a=>{a.href=cfg.linkedin||"#"});

  // table des matières
  const toc=document.querySelector("aside.toc .links");
  if(toc){
    document.querySelectorAll("main h2[id]").forEach(h=>{
      const a=document.createElement("a");a.href="#"+h.id;a.textContent=h.textContent.replace(/^#\s*/,"");a.dataset.for=h.id;toc.appendChild(a);
    });
  }

  // boutons copier
  document.querySelectorAll("pre").forEach(p=>{
    const b=document.createElement("button");b.className="copy";b.textContent="Copier";
    b.onclick=()=>{
      const cmds=[...p.querySelectorAll(".w")].map(x=>x.textContent);
      const txt=cmds.length?cmds.join("\n"):p.innerText.replace(/Copier\s*$/,"");
      (navigator.clipboard?navigator.clipboard.writeText(txt):Promise.reject()).then(()=>{b.textContent="Copié ✓";setTimeout(()=>b.textContent="Copier",1500)}).catch(()=>{});
    };
    p.appendChild(b);
  });

  // champs sauvegardés automatiquement
  document.querySelectorAll("[data-save]").forEach(el=>{
    const k="f:"+el.dataset.save;const v=S.get(k);
    if(el.type==="checkbox"){el.checked=!!v;el.addEventListener("change",()=>S.set(k,el.checked))}
    else{if(v!=null)el.value=v;el.addEventListener("input",()=>S.set(k,el.value))}
  });

  // suivi de lecture / TP terminé
  function refreshTrack(){
    document.querySelectorAll("input[data-track]").forEach(c=>{
      const done=!!S.get("t:"+c.dataset.track);c.checked=done;
      const a=document.querySelector('aside.toc a[data-for="'+c.dataset.sec+'"]');if(a)a.classList.toggle("done",done);
    });
  }
  document.querySelectorAll("input[data-track]").forEach(c=>{
    c.addEventListener("change",()=>{S.set("t:"+c.dataset.track,c.checked);refreshTrack()});
  });
  refreshTrack();

  // accueil : progression
  const ids=window.IDS||{cours:[],tp:[]};
  function pct(list){if(!list.length)return 0;return Math.round(100*list.filter(i=>S.get("t:"+i)).length/list.length)}
  const set=(id,p,txt)=>{const e=document.getElementById(id);if(e){e.style.width=p+"%"}const t=document.getElementById(id+"-t");if(t)t.textContent=txt};
  const pc=pct(ids.cours),pt=pct(ids.tp);
  set("bar-cours",pc,pc+" % du cours lu");
  set("bar-tp",pt,pt+" % des TP terminés");
  const hist=S.get("quiz:hist",[]);
  const best=hist.reduce((m,h)=>Math.max(m,h.s20),0);
  set("bar-quiz",Math.round(best/20*100),hist.length?("Meilleur score : "+best.toFixed(1).replace(".0","")+" / 20 — "+hist.length+" essai(s)"):"Aucun essai pour l'instant");

  // export / import progression
  const ex=document.getElementById("exp");
  if(ex)ex.onclick=()=>{
    const blob=new Blob([JSON.stringify(S.all(),null,1)],{type:"application/json"});
    const a=document.createElement("a");a.href=URL.createObjectURL(blob);a.download="progression-architecture-securisee.json";a.click();
  };
  const im=document.getElementById("imp");
  if(im)im.onchange=()=>{
    const f=im.files[0];if(!f)return;const r=new FileReader();
    r.onload=()=>{try{const o=JSON.parse(r.result);Object.keys(o).forEach(k=>S.set(k,o[k]));alert("Progression importée.");location.reload()}catch(e){alert("Fichier invalide.")}};
    r.readAsText(f);
  };
  const rs=document.getElementById("reset");
  if(rs)rs.onclick=()=>{if(confirm("Effacer toute votre progression, vos réponses et vos scores sur cet appareil ?")){Object.keys(S.all()).forEach(k=>S.del(k));location.reload()}};

  // impression : tout déplier
  window.addEventListener("beforeprint",()=>document.querySelectorAll("details").forEach(d=>d.open=true));
});
})();
