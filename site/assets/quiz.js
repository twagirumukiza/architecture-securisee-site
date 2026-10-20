(function(){
const BANK=window.QUIZ, S=window.AS, root=document.getElementById("quiz-app");
BANK.forEach((q,i)=>q.id="q"+i);
const themes=[...new Set(BANK.map(q=>q.t))];
const esc=s=>String(s).replace(/&/g,"&amp;").replace(/</g,"&lt;");
const shuffle=a=>{a=a.slice();for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]]}return a};
const isMulti=q=>Array.isArray(q.a);
const fmt=n=>(Math.round(n*10)/10).toString().replace(".",",");
let cur=S.get("quiz:cur",null);       // {qs:[{id,order[]}], ans:[[]], i, instant, done}

function start(){
  const hist=S.get("quiz:hist",[]);const stats=S.get("quiz:stats",{});
  const missed=BANK.filter(q=>stats[q.id]&&stats[q.id].ko>0).length;
  const best=hist.reduce((m,h)=>Math.max(m,h.s20),0);
  let h=`<div class="card"><h3 style="margin-top:0">Nouvel essai</h3>
  <p><label>Nombre de questions : <select id="n"><option value="10">10</option><option value="20" selected>20</option><option value="${BANK.length}">Toutes (${BANK.length})</option></select></label></p>
  <p><b>Thèmes</b> <span class="small">(tout est coché par défaut)</span><br>${themes.map(t=>`<label class="pill"><input type="checkbox" class="th" value="${esc(t)}" checked> ${esc(t)}</label>`).join(" ")}</p>
  <p><label><input type="checkbox" id="instant"> Mode entraînement : voir la correction après chaque question</label></p>
  <div class="btns"><button class="btn" id="go">Commencer le quiz</button>
  <button class="btn alt" id="goMiss" ${missed?"":"disabled"} title="Reprendre les questions déjà ratées">Revoir mes erreurs (${missed})</button></div></div>`;
  if(hist.length){
    h+=`<div class="card"><h3 style="margin-top:0">Mes résultats</h3><p>Meilleur score : <b>${fmt(best)} / 20</b> · ${hist.length} essai(s)</p><div class="tw"><table><tr><th>Date</th><th>Score</th><th>Bonnes réponses</th><th>Thèmes</th></tr>`+
    hist.slice().reverse().slice(0,10).map(x=>`<tr><td>${new Date(x.d).toLocaleString("fr-FR",{dateStyle:"short",timeStyle:"short"})}</td><td><b>${fmt(x.s20)} / 20</b></td><td>${x.ok} / ${x.n}</td><td class="small">${esc(x.th)}</td></tr>`).join("")+
    `</table></div><button class="btn ghost" id="clr">Effacer mes scores</button></div>`;
  }
  if(cur&&!cur.done)h=`<div class="box key"><b>Un quiz est en cours</b>Question ${cur.i+1} sur ${cur.qs.length}. <button class="btn" id="resume">Reprendre</button></div>`+h;
  root.innerHTML=h;
  const r=document.getElementById("resume");if(r)r.onclick=render;
  document.getElementById("go").onclick=()=>{
    const th=[...document.querySelectorAll(".th:checked")].map(x=>x.value);
    if(!th.length){alert("Choisissez au moins un thème.");return}
    let pool=BANK.filter(q=>th.includes(q.t));
    const n=Math.min(+document.getElementById("n").value,pool.length);
    launch(shuffle(pool).slice(0,n),document.getElementById("instant").checked,th.length===themes.length?"Tous":th.join(", "));
  };
  document.getElementById("goMiss").onclick=()=>{
    const pool=BANK.filter(q=>stats[q.id]&&stats[q.id].ko>0);
    launch(shuffle(pool).slice(0,20),document.getElementById("instant").checked,"Mes erreurs");
  };
  const c=document.getElementById("clr");if(c)c.onclick=()=>{if(confirm("Effacer l'historique des scores ?")){S.del("quiz:hist");S.del("quiz:stats");start()}};
}
function launch(qs,instant,th){
  cur={qs:qs.map(q=>({id:q.id,order:shuffle(q.o.map((_,i)=>i))})),ans:qs.map(()=>[]),i:0,instant,th,checked:false,done:false};
  S.set("quiz:cur",cur);render();
}
const byId=id=>BANK.find(q=>q.id===id);
function correct(q,sel){const a=isMulti(q)?q.a:[q.a];return sel.length===a.length&&a.every(x=>sel.includes(x))}
function render(){
  if(cur.done)return result();
  const it=cur.qs[cur.i],q=byId(it.id),sel=cur.ans[cur.i];
  const locked=cur.instant&&cur.checked;
  const right=isMulti(q)?q.a:[q.a];
  let h=`<div class="small">Question ${cur.i+1} / ${cur.qs.length} · <span class="pill">${esc(q.t)}</span></div><div class="bar"><i style="width:${Math.round(cur.i/cur.qs.length*100)}%"></i></div>
  <div class="qcard"><h3 style="margin-top:0">${esc(q.q)}</h3>${isMulti(q)?'<p class="small">Plusieurs réponses possibles.</p>':""}`;
  it.order.forEach(oi=>{
    let cl="opt"+(sel.includes(oi)?" sel":"");
    if(locked){if(right.includes(oi))cl+=" good";else if(sel.includes(oi))cl+=" bad"}
    h+=`<button class="${cl}" data-o="${oi}" ${locked?"disabled":""}>${isMulti(q)?(sel.includes(oi)?"☑ ":"☐ "):""}${esc(q.o[oi])}</button>`;
  });
  if(locked)h+=`<div class="exp"><b>${correct(q,sel)?"Correct.":"Incorrect."}</b> ${esc(q.e)}</div>`;
  h+=`</div><div class="btns">`;
  if(cur.i>0&&!cur.instant)h+=`<button class="btn ghost" id="prev">← Précédente</button>`;
  if(cur.instant&&!cur.checked)h+=`<button class="btn" id="chk" ${sel.length?"":"disabled"}>Valider</button>`;
  else h+=`<button class="btn" id="next">${cur.i===cur.qs.length-1?"Terminer et voir mon score":"Suivante →"}</button>`;
  h+=`<button class="btn ghost" id="quit">Abandonner</button></div>`;
  root.innerHTML=h;
  root.querySelectorAll(".opt").forEach(b=>b.onclick=()=>{
    const oi=+b.dataset.o;let s=cur.ans[cur.i];
    if(isMulti(q))s=s.includes(oi)?s.filter(x=>x!==oi):s.concat(oi);else s=[oi];
    cur.ans[cur.i]=s;S.set("quiz:cur",cur);render();
  });
  const g=id=>document.getElementById(id);
  if(g("prev"))g("prev").onclick=()=>{cur.i--;S.set("quiz:cur",cur);render()};
  if(g("chk"))g("chk").onclick=()=>{cur.checked=true;S.set("quiz:cur",cur);render()};
  if(g("next"))g("next").onclick=()=>{
    if(cur.i===cur.qs.length-1){finish()}else{cur.i++;cur.checked=false;S.set("quiz:cur",cur);render()}
  };
  g("quit").onclick=()=>{if(confirm("Abandonner ce quiz ? Il ne sera pas noté.")){cur=null;S.del("quiz:cur");start()}};
}
function finish(){
  const stats=S.get("quiz:stats",{});let ok=0;
  cur.qs.forEach((it,i)=>{const q=byId(it.id),good=correct(q,cur.ans[i]);if(good)ok++;
    const s=stats[q.id]||(stats[q.id]={ok:0,ko:0});good?s.ok++:s.ko++;
    // une question réussie à nouveau sort de la liste « erreurs »
    if(good&&s.ko>0&&s.lastKo)s.ko=0;s.lastKo=!good;});
  const n=cur.qs.length,s20=ok/n*20;
  const hist=S.get("quiz:hist",[]);hist.push({d:Date.now(),s20,ok,n,th:cur.th});S.set("quiz:hist",hist);S.set("quiz:stats",stats);
  cur.done=true;cur.ok=ok;cur.s20=s20;S.set("quiz:cur",cur);result();
}
function result(){
  const n=cur.qs.length,ok=cur.ok,s20=cur.s20;
  const msg=s20>=16?"Excellent : vous maîtrisez l'essentiel.":s20>=12?"Bien : quelques notions à consolider.":s20>=8?"Moyen : relisez les parties du cours signalées ci-dessous.":"Insuffisant pour l'instant : relisez le cours puis recommencez, c'est fait pour ça.";
  let h=`<div class="card" style="text-align:center"><div class="small">Votre score</div><div class="score">${fmt(s20)} / 20</div><p><b>${ok}</b> bonne(s) réponse(s) sur ${n}. ${msg}</p>
  <div class="btns" style="justify-content:center"><button class="btn" id="again">Recommencer un nouveau quiz</button><a class="btn ghost" href="cours.html">Relire le cours</a><button class="btn ghost" id="home">Mes résultats</button></div></div><h2 style="border:0">Correction détaillée</h2>`;
  cur.qs.forEach((it,i)=>{
    const q=byId(it.id),sel=cur.ans[i],good=correct(q,sel),right=isMulti(q)?q.a:[q.a];
    h+=`<div class="qcard ${good?"res-ok":"res-ko"}"><div class="small">Question ${i+1} · ${esc(q.t)} · ${good?"✔ correct":"✘ incorrect"}</div><h4 style="margin-top:4px">${esc(q.q)}</h4>`;
    it.order.forEach(oi=>{let cl="opt";if(right.includes(oi))cl+=" good";else if(sel.includes(oi))cl+=" bad";
      h+=`<div class="${cl}" style="cursor:default">${right.includes(oi)?"✔ ":sel.includes(oi)?"✘ ":""}${esc(q.o[oi])}${sel.includes(oi)?" <span class='small'>(votre réponse)</span>":""}</div>`});
    h+=`<div class="exp">${esc(q.e)}</div></div>`;
  });
  root.innerHTML=h;
  document.getElementById("again").onclick=()=>{cur=null;S.del("quiz:cur");start();window.scrollTo(0,0)};
  document.getElementById("home").onclick=()=>{cur=null;S.del("quiz:cur");start();window.scrollTo(0,0)};
  window.scrollTo(0,0);
}
cur&&cur.done?start():start();
if(cur&&cur.done){cur=null;S.del("quiz:cur")}
})();
