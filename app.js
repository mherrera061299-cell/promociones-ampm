const KEYS={promos:"ampm_promos_pro",user:"ampm_user_pro",session:"ampm_session_pro"};
const $=id=>document.getElementById(id);
const iso=d=>d.toISOString().slice(0,10);
const addDays=n=>{const d=new Date();d.setDate(d.getDate()+n);return iso(d)};
const defaultUser={username:"admin",password:"ampm123"};
const samplePromos=[
  {id:crypto.randomUUID(),name:"Combo desayuno",code:"PROMO-001",product:"Café + sándwich",price:89,oldPrice:110,store:"Todas las tiendas",start:addDays(-2),end:addDays(12),image:"",description:"Ideal para comenzar el día."},
  {id:crypto.randomUUID(),name:"2x1 en bebidas",code:"PROMO-002",product:"Bebidas seleccionadas",price:45,oldPrice:90,store:"A42 Ocotal",start:addDays(1),end:addDays(10),image:"",description:"Aplican productos seleccionados."}
];

let promotions=loadPromotions();

function loadPromotions(){
  const raw=localStorage.getItem(KEYS.promos);
  if(!raw){localStorage.setItem(KEYS.promos,JSON.stringify(samplePromos));return [...samplePromos]}
  try{return JSON.parse(raw)}catch{return []}
}
function savePromotions(){localStorage.setItem(KEYS.promos,JSON.stringify(promotions))}
function getUser(){
  const raw=localStorage.getItem(KEYS.user);
  if(!raw){localStorage.setItem(KEYS.user,JSON.stringify(defaultUser));return {...defaultUser}}
  try{return JSON.parse(raw)}catch{return {...defaultUser}}
}
function toast(message){
  const el=$("toast");el.textContent=message;el.classList.add("show");
  clearTimeout(window.__toast);window.__toast=setTimeout(()=>el.classList.remove("show"),2300)
}
function statusOf(p){
  const today=iso(new Date());
  if(p.start>today)return"upcoming";
  if(p.end<today)return"expired";
  return"active"
}
function statusLabel(s){return{active:"Activa",upcoming:"Próxima",expired:"Vencida"}[s]}
function money(v){return new Intl.NumberFormat("es-NI",{style:"currency",currency:"NIO"}).format(Number(v||0))}
function esc(v=""){return String(v).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[c]))}

function promoCard(p){
  const s=statusOf(p);
  const image=p.image?`<img src="${esc(p.image)}" alt="${esc(p.name)}" onerror="this.parentElement.innerHTML='🏷️'">`:"🏷️";
  return `<article class="promo-card">
    <div class="promo-image">${image}</div>
    <div class="promo-body">
      <span class="badge ${s}">${statusLabel(s)}</span>
      <h4>${esc(p.name)}</h4>
      <div class="price">${money(p.price)}</div>
      ${p.oldPrice?`<div class="old-price">${money(p.oldPrice)}</div>`:""}
      <div class="meta">
        ${p.code?`<span>🔖 ${esc(p.code)}</span>`:""}
        <span>🛒 ${esc(p.product)}</span>
        <span>🏪 ${esc(p.store)}</span>
        <span>📅 ${p.start} al ${p.end}</span>
        ${p.description?`<span>${esc(p.description)}</span>`:""}
      </div>
      <div class="card-actions">
        <button class="btn secondary" onclick="editPromotion('${p.id}')">Editar</button>
        <button class="btn danger" onclick="deletePromotion('${p.id}')">Eliminar</button>
      </div>
    </div>
  </article>`
}

function render(){
  const query=($("searchInput")?.value||"").trim().toLowerCase();
  const statusFilter=$("statusFilter")?.value||"all";
  const storeFilter=$("storeFilter")?.value||"all";

  const stores=[...new Set(promotions.map(p=>p.store).filter(Boolean))].sort();
  const currentStore=$("storeFilter").value;
  $("storeFilter").innerHTML='<option value="all">Todas las tiendas</option>'+stores.map(s=>`<option value="${esc(s)}">${esc(s)}</option>`).join("");
  $("storeFilter").value=stores.includes(currentStore)?currentStore:"all";

  const filtered=promotions.filter(p=>{
    const text=[p.name,p.code,p.product,p.store,p.description].join(" ").toLowerCase();
    return text.includes(query)&&(statusFilter==="all"||statusOf(p)===statusFilter)&&(storeFilter==="all"||p.store===storeFilter)
  });

  $("promoGrid").innerHTML=filtered.length?filtered.map(promoCard).join(""):'<div class="empty">No hay promociones para mostrar.</div>';
  const active=promotions.filter(p=>statusOf(p)==="active");
  $("featuredGrid").innerHTML=active.length?active.slice(0,3).map(promoCard).join(""):'<div class="empty">No hay promociones activas.</div>';

  $("statTotal").textContent=promotions.length;
  $("statActive").textContent=active.length;
  $("statExpired").textContent=promotions.filter(p=>statusOf(p)==="expired").length;
  $("statEnding").textContent=active.filter(p=>{
    const diff=(new Date(p.end)-new Date())/86400000;
    return diff>=0&&diff<=5
  }).length;

  renderReports()
}
function renderReports(){
  const byStatus={Activas:0,Próximas:0,Vencidas:0};
  promotions.forEach(p=>{const s=statusOf(p);if(s==="active")byStatus.Activas++;else if(s==="upcoming")byStatus.Próximas++;else byStatus.Vencidas++});
  $("statusReport").innerHTML='<div class="report-list">'+Object.entries(byStatus).map(([k,v])=>`<div class="report-row"><span>${k}</span><strong>${v}</strong></div>`).join("")+"</div>";

  const stores={};
  promotions.forEach(p=>stores[p.store]=(stores[p.store]||0)+1);
  $("storeReport").innerHTML='<div class="report-list">'+(Object.entries(stores).length?Object.entries(stores).sort((a,b)=>b[1]-a[1]).map(([k,v])=>`<div class="report-row"><span>${esc(k)}</span><strong>${v}</strong></div>`).join(""):'<div class="empty">Sin datos</div>')+"</div>"
}
function showApp(){
  $("loginView").classList.add("hidden");
  $("appView").classList.remove("hidden");
  $("dateLabel").textContent=new Intl.DateTimeFormat("es-NI",{dateStyle:"full"}).format(new Date());
  render()
}
function openDialog(p=null){
  $("promoForm").reset();
  $("promoId").value=p?.id||"";
  $("dialogTitle").textContent=p?"Editar promoción":"Nueva promoción";
  $("promoName").value=p?.name||"";
  $("promoCode").value=p?.code||"";
  $("promoProduct").value=p?.product||"";
  $("promoPrice").value=p?.price||"";
  $("promoOldPrice").value=p?.oldPrice||"";
  $("promoStore").value=p?.store||"";
  $("promoStart").value=p?.start||iso(new Date());
  $("promoEnd").value=p?.end||addDays(7);
  $("promoImage").value=p?.image||"";
  $("promoDescription").value=p?.description||"";
  $("promoDialog").showModal()
}

window.editPromotion=id=>openDialog(promotions.find(p=>p.id===id));
window.deletePromotion=id=>{
  if(confirm("¿Eliminar esta promoción?")){
    promotions=promotions.filter(p=>p.id!==id);
    savePromotions();render();toast("Promoción eliminada")
  }
};

$("loginForm").addEventListener("submit",e=>{
  e.preventDefault();
  const user=getUser();
  if($("loginUser").value===user.username&&$("loginPass").value===user.password){
    sessionStorage.setItem(KEYS.session,"1");showApp()
  }else toast("Usuario o contraseña incorrectos")
});
$("logoutBtn").addEventListener("click",()=>{
  sessionStorage.removeItem(KEYS.session);
  location.reload()
});
document.querySelectorAll(".nav-btn").forEach(btn=>btn.addEventListener("click",()=>{
  document.querySelectorAll(".nav-btn").forEach(b=>b.classList.remove("active"));
  btn.classList.add("active");
  const view=btn.dataset.view;
  document.querySelectorAll(".view").forEach(v=>v.classList.add("hidden"));
  $(view+"View").classList.remove("hidden");
  $("pageTitle").textContent={dashboard:"Resumen",promotions:"Promociones",reports:"Reportes",settings:"Configuración"}[view];
  $("sidebar").classList.remove("open")
}));
$("menuBtn").addEventListener("click",()=>$("sidebar").classList.toggle("open"));
$("quickAddBtn").addEventListener("click",()=>openDialog());
$("addPromoBtn").addEventListener("click",()=>openDialog());
$("closeDialogBtn").addEventListener("click",()=>$("promoDialog").close());
$("cancelDialogBtn").addEventListener("click",()=>$("promoDialog").close());
$("searchInput").addEventListener("input",render);
$("statusFilter").addEventListener("change",render);
$("storeFilter").addEventListener("change",render);

$("promoForm").addEventListener("submit",e=>{
  e.preventDefault();
  const data={
    id:$("promoId").value||crypto.randomUUID(),
    name:$("promoName").value.trim(),
    code:$("promoCode").value.trim(),
    product:$("promoProduct").value.trim(),
    price:Number($("promoPrice").value),
    oldPrice:Number($("promoOldPrice").value||0),
    store:$("promoStore").value.trim(),
    start:$("promoStart").value,
    end:$("promoEnd").value,
    image:$("promoImage").value.trim(),
    description:$("promoDescription").value.trim()
  };
  if(data.end<data.start){toast("La fecha final no puede ser anterior a la inicial");return}
  const index=promotions.findIndex(p=>p.id===data.id);
  if(index>=0)promotions[index]=data;else promotions.unshift(data);
  savePromotions();$("promoDialog").close();render();toast(index>=0?"Promoción actualizada":"Promoción creada")
});

$("credentialsForm").addEventListener("submit",e=>{
  e.preventDefault();
  localStorage.setItem(KEYS.user,JSON.stringify({username:$("newUsername").value.trim(),password:$("newPassword").value}));
  toast("Credenciales actualizadas");
  e.target.reset()
});

$("exportBtn").addEventListener("click",()=>{
  const payload={promotions,user:getUser(),exportedAt:new Date().toISOString()};
  const blob=new Blob([JSON.stringify(payload,null,2)],{type:"application/json"});
  const a=document.createElement("a");
  a.href=URL.createObjectURL(blob);
  a.download="respaldo-promociones-ampm.json";
  a.click();
  URL.revokeObjectURL(a.href)
});

$("importFile").addEventListener("change",async e=>{
  const file=e.target.files[0];
  if(!file)return;
  try{
    const data=JSON.parse(await file.text());
    if(!Array.isArray(data.promotions))throw new Error();
    promotions=data.promotions;
    savePromotions();
    if(data.user)localStorage.setItem(KEYS.user,JSON.stringify(data.user));
    render();toast("Respaldo importado")
  }catch{toast("Archivo de respaldo inválido")}
  e.target.value=""
});

$("resetBtn").addEventListener("click",()=>{
  if(confirm("¿Restablecer todos los datos?")){
    localStorage.removeItem(KEYS.promos);
    localStorage.removeItem(KEYS.user);
    location.reload()
  }
});

$("printReportBtn").addEventListener("click",()=>window.print());

if("serviceWorker" in navigator){
  window.addEventListener("load",()=>navigator.serviceWorker.register("service-worker.js").catch(()=>{}))
}
if(sessionStorage.getItem(KEYS.session)==="1")showApp();
