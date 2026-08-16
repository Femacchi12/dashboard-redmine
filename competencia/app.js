const LEGACY_SHEET_ID = "1JNWfXHhGdZy5xiJR0S96uCmQ4am4vax-EOFKDSB9p9M";
const LEGACY_GID = "1486237576";
const BASE_SHEET_ID = "1v2sBVe_w-bTl438b8qWFmvw0gT66bj8TskcXbnY-gbU";
const BASE_PLAN_GID = "790372285";
const LEGACY_URL = `https://docs.google.com/spreadsheets/d/${LEGACY_SHEET_ID}/gviz/tq?tqx=out:csv&gid=${LEGACY_GID}`;
const BASE_PLAN_URL = `https://docs.google.com/spreadsheets/d/${BASE_SHEET_ID}/gviz/tq?tqx=out:csv&gid=${BASE_PLAN_GID}`;

const STATIC_ROWS = [
  ["Armenia","Bitwan",600,98900,"No","No especificada","2024-12-17","Relevamiento Eje Cafetero","Maestro/Gamer"],
  ["Armenia","Bitwan",400,74900,"No","No especificada","2024-12-17","Relevamiento Eje Cafetero","Profesional"],
  ["Armenia","Bitwan",300,69900,"No","No especificada","2024-12-17","Relevamiento Eje Cafetero","Experimentado"],
  ["Armenia","Bitwan",200,64900,"No","No especificada","2024-12-17","Relevamiento Eje Cafetero","Aficionado"],
  ["Armenia","Bitwan",150,59900,"No","No especificada","2024-12-17","Relevamiento Eje Cafetero","Novato II"],
  ["Armenia","Bitwan",100,54900,"No","No especificada","2024-12-17","Relevamiento Eje Cafetero","Novato I"],
  ["Armenia","Bitwan",50,49900,"No","No especificada","2024-12-17","Relevamiento Eje Cafetero","Principiante"],
  ["Armenia","Tu Cable",200,204000,"Sí","No especificada","2024-12-17","Relevamiento Eje Cafetero","Incluye TV"],
  ["Armenia","Tu Cable",150,106000,"Sí","No especificada","2024-12-17","Relevamiento Eje Cafetero","Incluye TV"],
  ["Armenia","Tu Cable",100,77000,"Sí","No especificada","2024-12-17","Relevamiento Eje Cafetero","Incluye TV"],
  ["Armenia","Legon",100,110000,"Sí","No especificada","2024-12-17","Relevamiento Eje Cafetero","Incluye TV"],
  ["Armenia","Legon",30,80000,"Sí","No especificada","2024-12-17","Relevamiento Eje Cafetero","Incluye TV"],
  ["Armenia","Legon",10,50000,"Sí","No especificada","2024-12-17","Relevamiento Eje Cafetero","Incluye TV"],
  ["Pereira","Tu Cable",200,204000,"Sí","No especificada","2024-12-17","Relevamiento Eje Cafetero","Incluye TV"],
  ["Pereira","Tu Cable",150,106000,"Sí","No especificada","2024-12-17","Relevamiento Eje Cafetero","Incluye TV"],
  ["Pereira","Tu Cable",100,77000,"Sí","No especificada","2024-12-17","Relevamiento Eje Cafetero","Incluye TV"],
  ["Pereira","Fast Play",300,119900,"Sí","No especificada","2024-12-17","Relevamiento Eje Cafetero","Empresa"],
  ["Pereira","Fast Play",250,99900,"Sí","No especificada","2024-12-17","Relevamiento Eje Cafetero","2 puntos TV"],
  ["Pereira","Fast Play",200,89900,"Sí","No especificada","2024-12-17","Relevamiento Eje Cafetero","2 puntos TV"],
  ["Pereira","Fast Play",150,79900,"Sí","No especificada","2024-12-17","Relevamiento Eje Cafetero","2 puntos TV"],
  ["Pereira","Fast Play",100,69900,"Sí","No especificada","2024-12-17","Relevamiento Eje Cafetero","2 puntos TV"],
  ["Pereira","Fast Play",75,59900,"No","No especificada","2024-12-17","Relevamiento Eje Cafetero",""],
  ["Manizales","MegaNET",200,89900,"No","FTTH","2024-12-17","Relevamiento Eje Cafetero","Sin TV"],
  ["Manizales","MegaNET",200,104900,"Sí","FTTH","2024-12-17","Relevamiento Eje Cafetero","Con TV"],
  ["Manizales","MegaNET",150,69900,"No","FTTH","2024-12-17","Relevamiento Eje Cafetero","Sin TV"],
  ["Manizales","MegaNET",150,84900,"Sí","FTTH","2024-12-17","Relevamiento Eje Cafetero","Con TV"],
  ["Manizales","MegaNET",100,49900,"No","FTTH","2024-12-17","Relevamiento Eje Cafetero","Sin TV"],
  ["Manizales","MegaNET",100,59900,"Sí","FTTH","2024-12-17","Relevamiento Eje Cafetero","Con TV"],
  ["Manizales","Super Cable",300,125000,"Sí","No especificada","2024-12-17","Relevamiento Eje Cafetero","TV digital"],
  ["Manizales","Super Cable",200,105000,"Sí","No especificada","2024-12-17","Relevamiento Eje Cafetero","TV digital"],
  ["Manizales","Super Cable",150,82000,"Sí","No especificada","2024-12-17","Relevamiento Eje Cafetero","TV digital"],
  ["Manizales","Super Cable",100,65000,"Sí","No especificada","2024-12-17","Relevamiento Eje Cafetero","TV digital"],
  ["Manizales","Super Cable",50,60000,"Sí","No especificada","2024-12-17","Relevamiento Eje Cafetero","TV digital"],
  ["Manizales","Super Cable",25,54900,"Sí","No especificada","2024-12-17","Relevamiento Eje Cafetero","TV digital"],
  ["Ibagué","Fastnet",100,55000,"No","FTTH","2026","Preexploración Ibagué","Plan visible"],
  ["Ibagué","Fastnet",200,75000,"Sí","FTTH","2026","Preexploración Ibagué","Internet + TV"],
  ["Ibagué","Fastnet",250,70000,"No","FTTH","2026","Preexploración Ibagué","Plan gamer"],
  ["Ibagué","Innova",15,50000,"No","Fibra óptica","2026","Preexploración Ibagué",""],
  ["Ibagué","Innova",15,60000,"Sí","Fibra óptica","2026","Preexploración Ibagué","100 canales"],
  ["Ibagué","Innova",20,70000,"Sí","Fibra óptica","2026","Preexploración Ibagué","100 canales"],
  ["Ibagué","Innova",30,85000,"Sí","Fibra óptica","2026","Preexploración Ibagué","100 canales"],
  ["Ibagué","Innova",50,90000,"Sí","Fibra óptica","2026","Preexploración Ibagué","100 canales"],
  ["Ibagué","Tigo",500,108000,"Sí","HFC / GPON","2026","Preexploración Ibagué","Oferta pública estratos 1–3"],
  ["Ibagué","Movistar",900,75992,"No especificado","FTTH","2026","Preexploración Ibagué","Promo 6 meses"],
].map(([city,operator,speed,price,tv,technology,date,source,note], i) => ({
  id:`static-${i}`, city, operator, speed, price, tv, technology, date, source, note,
  rawSpeed: speed ? `${speed} Mbps` : "", rawPrice: price ? formatMoney(price) : "", link:""
}));

const CITY_ALIASES = {
  "barranquillla":"Barranquilla","barranquilla":"Barranquilla","monteria":"Montería","cerete":"Cereté","chinu":"Chinú",
  "c de oro":"Ciénaga de Oro","p rica":"Planeta Rica","s marcos":"San Marcos","t alta":"Tierralta","maria la baja":"María la Baja",
  "carmen del bolivar":"Carmen de Bolívar","tolu viejo":"Tolú Viejo","montelibano":"Montelíbano"
};
const TECH_OVERRIDES = new Map([
  ["conexión digital","FTTH"],["conexion digital","FTTH"],["cabletelco - impar t.v.","FTTH / HFC"],["cabletelco","FTTH / HFC"],
  ["tv cable social - monitor space","FTTH / HFC"],["movistar ftth","FTTH"],["tigo ftth","FTTH"],["tigo hfc","HFC"],["claro ftth","FTTH"],["claro hfc","HFC"]
]);

const FILTER_DEFS = {
  city:{label:"Ciudad / localidad",plural:"Todas"}, operator:{label:"Operador",plural:"Todos"}, technology:{label:"Tecnología",plural:"Todas"},
  tv:{label:"TV incluida",plural:"Todos"}, priceBand:{label:"Rango de precio",plural:"Todos"}, source:{label:"Fuente",plural:"Todas"}
};
const filters = Object.fromEntries(Object.keys(FILTER_DEFS).map(k => [k, new Set()]));
let allRows = [], filteredRows = [], tableRows = [], showAllRows = false;
let sortState = {field:"price",direction:"asc"};
let visibleColumns = {city:true,operator:true,speed:true,price:true,tv:true,technology:true,date:true,source:true,note:true};
let charts = {};

const columns = [
  {field:"city",label:"Ciudad / localidad"},{field:"operator",label:"Operador"},{field:"speed",label:"Velocidad"},{field:"price",label:"Precio"},
  {field:"tv",label:"TV"},{field:"technology",label:"Tecnología"},{field:"date",label:"Fecha"},{field:"source",label:"Fuente"},{field:"note",label:"Nota"}
];

function normalizeText(v){ return String(v ?? "").trim(); }
function fold(v){ return normalizeText(v).normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLowerCase(); }
function normalizeCity(v){ const raw=normalizeText(v); return CITY_ALIASES[fold(raw)] || raw.replace(/\s+/g," "); }
function parseNumber(v){ const m=normalizeText(v).replace(/\./g,"").replace(/,/g,".").match(/\d+(?:\.\d+)?/); return m ? Number(m[0]) : null; }
function parseSpeed(v){ const n=parseNumber(v); return n && n>0 ? n : null; }
function parsePrice(v){
  const s=normalizeText(v); if(!s || /^[-—\s]+$/.test(s)) return null;
  const nums=[...s.matchAll(/\$?\s*([0-9]{1,3}(?:[.,][0-9]{3})+|[0-9]{4,6})/g)].map(m=>Number(m[1].replace(/[.,]/g,""))).filter(n=>n>=1000);
  if(nums.length) return Math.min(...nums);
  const n=parseNumber(s); return n && n>=1000 ? n : null;
}
function normalizeTv(v){ const s=fold(v); if(!s || /^[-—]+$/.test(s)) return "No especificado"; if(s==="no") return "No"; if(s.includes("si")||s.includes("canal")||s.includes("premium")||s.includes("tv")) return "Sí"; return "No especificado"; }
function normalizeTechnology(operator,note){ const key=fold(operator); if(TECH_OVERRIDES.has(key)) return TECH_OVERRIDES.get(key); const n=fold(note); if(n.includes("ftth")&&n.includes("hfc"))return "FTTH / HFC"; if(n.includes("ftth"))return "FTTH"; if(n.includes("hfc"))return "HFC"; return "No especificada"; }
function priceBand(price){ if(!price) return "Sin precio"; if(price<50000)return "< $50k"; if(price<=75000)return "$50k–$75k"; if(price<=100000)return "$75k–$100k"; return "> $100k"; }
function formatMoney(n){ return n==null ? "—" : new Intl.NumberFormat("es-CO",{style:"currency",currency:"COP",maximumFractionDigits:0}).format(n); }
function median(values){ const a=values.filter(Number.isFinite).sort((x,y)=>x-y); if(!a.length)return null; const m=Math.floor(a.length/2); return a.length%2?a[m]:(a[m-1]+a[m])/2; }
function unique(values){ return [...new Set(values.filter(Boolean))]; }

function parseCSV(text){
  const rows=[]; let row=[], value="", quoted=false;
  for(let i=0;i<text.length;i++){
    const c=text[i], n=text[i+1];
    if(c==='"'&&quoted&&n==='"'){ value+='"'; i++; }
    else if(c==='"') quoted=!quoted;
    else if(c===","&&!quoted){ row.push(value); value=""; }
    else if((c==="\n"||c==="\r")&&!quoted){ if(c==="\r"&&n==="\n")i++; if(value||row.length){row.push(value);rows.push(row);row=[];value="";} }
    else value+=c;
  }
  if(value||row.length){row.push(value);rows.push(row);} return rows;
}
function csvToObjects(csv){ const rows=parseCSV(csv); const headers=rows[0]||[]; return rows.slice(1).map(r=>Object.fromEntries(headers.map((h,i)=>[normalizeText(h),normalizeText(r[i])]))); }

function legacyRow(row,idx){
  const city=normalizeCity(row["Ciudad/Localidad"]); const operator=normalizeText(row["Operador"]); if(!city&&!operator)return null;
  const rawSpeed=normalizeText(row["Velocidad"]), rawPrice=normalizeText(row["Precio"]), note=normalizeText(row["NOTA"]), link=normalizeText(row["Link"]);
  const speed=parseSpeed(rawSpeed), price=parsePrice(rawPrice), tv=normalizeTv(row["Incluye TV"]), technology=normalizeTechnology(operator,note);
  return {id:`legacy-${idx}`,city,operator:operator||"Sin operador",speed,price,tv,technology,date:"Histórico",source:"Competencia histórica",note,link,rawSpeed,rawPrice};
}
function baseRow(row,idx){
  const city=normalizeCity(row["Ciudad"]), operator=normalizeText(row["Operador_Normalizado"]); if(!city&&!operator)return null;
  const speed=parseSpeed(row["Velocidad_Bajada_Mbps"]); const price=parsePrice(row["Precio_Usado_COP"]||row["Precio_Regular_COP"]||row["Precio_Promocional_COP"]);
  return {id:`base-${idx}`,city,operator:operator||"Sin operador",speed,price,tv:normalizeTv(row["TV_Incluida"]),technology:normalizeText(row["Tecnologia"])||"No especificada",date:normalizeText(row["Fecha_Relevamiento"]),source:"Base General",note:normalizeText(row["Estado_Vigencia"]),link:"",rawSpeed:normalizeText(row["Velocidad_Bajada_Mbps"]),rawPrice:normalizeText(row["Precio_Usado_COP"]||row["Precio_Regular_COP"]||row["Precio_Promocional_COP"])};
}

async function fetchSource(url){ const r=await fetch(`${url}&cacheBust=${Date.now()}`,{cache:"no-store"}); if(!r.ok)throw new Error(`HTTP ${r.status}`); return csvToObjects(await r.text()); }
async function loadData(){
  setStatus("Cargando…");
  const [legacyResult,baseResult]=await Promise.allSettled([fetchSource(LEGACY_URL),fetchSource(BASE_PLAN_URL)]);
  const legacy=legacyResult.status==="fulfilled"?legacyResult.value.map(legacyRow).filter(Boolean):[];
  const base=baseResult.status==="fulfilled"?baseResult.value.map(baseRow).filter(Boolean):[];
  allRows=[...legacy,...base,...STATIC_ROWS].filter(r=>r.city&&r.operator);
  const dedupe=new Map();
  for(const r of allRows){ const key=[fold(r.city),fold(r.operator),r.speed||"",r.price||"",r.tv,fold(r.source)].join("|"); if(!dedupe.has(key))dedupe.set(key,r); }
  allRows=[...dedupe.values()];
  const sourceBits=[]; if(legacy.length)sourceBits.push(`${legacy.length} histórico`); if(base.length)sourceBits.push(`${base.length} Base General`); sourceBits.push(`${STATIC_ROWS.length} relevamientos`);
  document.getElementById("sourceStatus").textContent=sourceBits.join(" · ");
  document.getElementById("updatedAt").textContent=new Intl.DateTimeFormat("es-CO",{dateStyle:"short",timeStyle:"short"}).format(new Date());
  if(!legacy.length) console.warn("No se pudo cargar Competencia histórica",legacyResult.reason); if(baseResult.status==="rejected") console.warn("Base General no disponible por gviz",baseResult.reason);
  buildFilters(); applyFilters(); setStatus("");
}
function setStatus(text){ const el=document.getElementById("sourceStatus"); if(text)el.textContent=text; }

function getFilterValue(row,key){ if(key==="priceBand")return priceBand(row.price); return normalizeText(row[key]); }
function filterOptions(key){ return unique(allRows.map(r=>getFilterValue(r,key))).sort((a,b)=>a.localeCompare(b,"es",{numeric:true})); }
function buildFilters(){
  document.querySelectorAll(".multi-filter").forEach(host=>{
    const key=host.dataset.filter, def=FILTER_DEFS[key]; host.innerHTML=""; const shell=document.createElement("div"); shell.className="filter-shell";
    const label=document.createElement("label"); label.className="filter-label"; label.textContent=def.label;
    const button=document.createElement("button"); button.className="filter-button"; button.type="button"; button.innerHTML=`<strong>${def.plural}</strong><span>▾</span>`;
    const menu=document.createElement("div"); menu.className="filter-menu"; menu.hidden=true;
    const search=document.createElement("input"); search.className="filter-search"; search.placeholder="Buscar…"; search.type="search";
    const opts=document.createElement("div"); opts.className="filter-options"; menu.append(search,opts); shell.append(label,button,menu); host.append(shell);
    const renderOptions=()=>{ const q=fold(search.value); opts.innerHTML=""; const vals=filterOptions(key).filter(v=>!q||fold(v).includes(q)); if(!vals.length){opts.innerHTML='<div class="filter-empty">Sin coincidencias</div>';return;} vals.forEach(v=>{ const line=document.createElement("label"); line.className="filter-option"; const cb=document.createElement("input"); cb.type="checkbox"; cb.checked=filters[key].has(v); cb.addEventListener("change",()=>{cb.checked?filters[key].add(v):filters[key].delete(v); updateFilterButton(key,button,def); applyFilters();}); const span=document.createElement("span");span.textContent=v;line.append(cb,span);opts.append(line);}); };
    button.addEventListener("click",e=>{e.stopPropagation();document.querySelectorAll(".filter-menu").forEach(m=>{if(m!==menu)m.hidden=true;});menu.hidden=!menu.hidden;if(!menu.hidden){search.value="";renderOptions();search.focus();}});
    search.addEventListener("input",renderOptions); menu.addEventListener("click",e=>e.stopPropagation()); renderOptions(); updateFilterButton(key,button,def);
  });
}
function updateFilterButton(key,button,def){ const n=filters[key].size; button.querySelector("strong").textContent=n===0?def.plural:(n===1?[...filters[key]][0]:`${n} seleccionados`); }
function applyFilters(){
  filteredRows=allRows.filter(row=>Object.keys(filters).every(key=>!filters[key].size||filters[key].has(getFilterValue(row,key)))); tableRows=[...filteredRows]; showAllRows=false; renderActiveFilters(); renderKPIs(); renderCharts(); renderTable();
}
function renderActiveFilters(){ const parts=Object.entries(filters).filter(([,s])=>s.size).map(([k,s])=>`${FILTER_DEFS[k].label}: ${[...s].join(", ")}`); document.getElementById("activeFilterSummary").textContent=parts.length?parts.join(" · "):"Sin filtros aplicados."; }

function renderKPIs(){
  const validPrices=filteredRows.map(r=>r.price).filter(Number.isFinite), speeds=filteredRows.map(r=>r.speed).filter(Number.isFinite); const tvKnown=filteredRows.filter(r=>r.tv!=="No especificado"), tvYes=tvKnown.filter(r=>r.tv==="Sí").length;
  const data=[
    ["Registros competitivos",filteredRows.length,`${allRows.length} en la base cargada`,true],
    ["Operadores únicos",unique(filteredRows.map(r=>r.operator)).length,`${unique(filteredRows.map(r=>r.city)).length} ciudades/localidades`,false],
    ["Precio mediano",median(validPrices)?formatMoney(median(validPrices)):"—",`${validPrices.length} planes con precio usable`,false],
    ["Velocidad mediana",median(speeds)?`${Math.round(median(speeds))} Mbps`:"—",`${speeds.length} planes con velocidad`,false],
    ["Oferta con TV",tvKnown.length?`${Math.round(tvYes/tvKnown.length*100)}%`:"—",`${tvYes} de ${tvKnown.length} ofertas con dato`,false]
  ];
  document.getElementById("kpis").innerHTML=data.map(([t,v,s,a])=>`<article class="kpi ${a?'accent':''}"><span>${t}</span><b>${v}</b><small>${s}</small></article>`).join("");
}

function ensureCharts(){ return new Promise(resolve=>{ let n=0; const t=setInterval(()=>{if(window.Chart||n++>50){clearInterval(t);resolve();}},50);}); }
function chartColors(n){ const base=["#00f29a","#73b9ff","#f5d547","#00c77d","#ff7585","#9e8cff","#52d1dc","#f3a76f"]; return Array.from({length:n},(_,i)=>base[i%base.length]); }
function destroyChart(name){ if(charts[name]){charts[name].destroy();charts[name]=null;} }
async function renderCharts(){
  await ensureCharts(); if(!window.Chart)return;
  const chartBase={responsive:true,maintainAspectRatio:false,plugins:{legend:{labels:{color:"#8fa9a0",boxWidth:10,font:{family:"Inter",size:10}}},tooltip:{backgroundColor:"#0f1714",titleColor:"#f4fff9",bodyColor:"#c9d7d1",borderColor:"#1b3028",borderWidth:1}},scales:{x:{ticks:{color:"#8fa9a0",font:{size:9}},grid:{color:"rgba(27,48,40,.35)"}},y:{ticks:{color:"#8fa9a0",font:{size:9}},grid:{color:"rgba(27,48,40,.35)"}}}};
  const scatter=filteredRows.filter(r=>r.speed&&r.price).slice(0,700).map(r=>({x:r.speed,y:r.price,_r:r})); destroyChart("scatter"); charts.scatter=new Chart(document.getElementById("priceSpeedChart"),{type:"scatter",data:{datasets:[{label:"Planes",data:scatter,pointRadius:4,pointHoverRadius:6,backgroundColor:"rgba(0,242,154,.6)",borderColor:"#00f29a"}]},options:{...chartBase,plugins:{...chartBase.plugins,tooltip:{...chartBase.plugins.tooltip,callbacks:{label:c=>{const r=c.raw._r;return `${r.operator} · ${r.city} · ${r.speed} Mbps · ${formatMoney(r.price)}`;}}}},scales:{x:{...chartBase.scales.x,title:{display:true,text:"Mbps",color:"#8fa9a0"}},y:{...chartBase.scales.y,title:{display:true,text:"Precio COP",color:"#8fa9a0"},ticks:{...chartBase.scales.y.ticks,callback:v=>`$${Math.round(v/1000)}k`}}}}});
  const cityMap=new Map(); filteredRows.forEach(r=>{if(!cityMap.has(r.city))cityMap.set(r.city,new Set());cityMap.get(r.city).add(r.operator);}); const cities=[...cityMap.entries()].sort((a,b)=>b[1].size-a[1].size).slice(0,20); destroyChart("cities"); charts.cities=new Chart(document.getElementById("cityOperatorsChart"),{type:"bar",data:{labels:cities.map(x=>x[0]),datasets:[{label:"Operadores",data:cities.map(x=>x[1].size),backgroundColor:"rgba(115,185,255,.65)",borderColor:"#73b9ff",borderWidth:1}]},options:{...chartBase,indexAxis:"y",plugins:{...chartBase.plugins,legend:{display:false}},scales:{x:{...chartBase.scales.x,beginAtZero:true,ticks:{...chartBase.scales.x.ticks,precision:0}},y:{...chartBase.scales.y}}}});
  const opMap=new Map(); filteredRows.forEach(r=>opMap.set(r.operator,(opMap.get(r.operator)||0)+1)); const ops=[...opMap.entries()].sort((a,b)=>b[1]-a[1]).slice(0,20); destroyChart("ops"); charts.ops=new Chart(document.getElementById("operatorPlansChart"),{type:"bar",data:{labels:ops.map(x=>x[0]),datasets:[{label:"Registros de planes",data:ops.map(x=>x[1]),backgroundColor:chartColors(ops.length)}]},options:{...chartBase,plugins:{...chartBase.plugins,legend:{display:false}},scales:{x:{...chartBase.scales.x,ticks:{...chartBase.scales.x.ticks,maxRotation:60,minRotation:35}},y:{...chartBase.scales.y,beginAtZero:true,ticks:{...chartBase.scales.y.ticks,precision:0}}}}});
  const tvCounts={"Sí":0,"No":0,"No especificado":0}; filteredRows.forEach(r=>tvCounts[r.tv]=(tvCounts[r.tv]||0)+1); const total=filteredRows.length||1; document.getElementById("tvSummary").innerHTML=[['Sí','yes'],['No',''],['No especificado','unknown']].map(([k,c])=>`<article class="tv-stat ${c}"><span>${k}</span><b>${Math.round(tvCounts[k]/total*100)}%</b><small>${tvCounts[k]} registros</small></article>`).join("");
}

function compare(a,b,field){ const va=a[field],vb=b[field]; if(field==="price"||field==="speed") return (va??Infinity)-(vb??Infinity); return normalizeText(va).localeCompare(normalizeText(vb),"es",{numeric:true}); }
function renderTable(){
  const query=fold(document.getElementById("tableSearch").value); tableRows=filteredRows.filter(r=>!query||columns.some(c=>fold(r[c.field]).includes(query))||fold(r.rawPrice).includes(query)||fold(r.rawSpeed).includes(query));
  tableRows.sort((a,b)=>sortState.direction==="asc"?compare(a,b,sortState.field):compare(b,a,sortState.field));
  const visible=columns.filter(c=>visibleColumns[c.field]); const head=document.getElementById("recordsHead"); head.innerHTML=`<tr>${visible.map(c=>`<th data-field="${c.field}" class="${sortState.field===c.field?'sorted':''}">${c.label}${sortState.field===c.field?(sortState.direction==='asc'?' ↑':' ↓'):''}</th>`).join("")}</tr>`;
  head.querySelectorAll("th").forEach(th=>th.addEventListener("click",()=>{const f=th.dataset.field;if(sortState.field===f)sortState.direction=sortState.direction==="asc"?"desc":"asc";else sortState={field:f,direction:"asc"};showAllRows=false;renderTable();}));
  const shown=showAllRows?tableRows:tableRows.slice(0,10); document.getElementById("recordsBody").innerHTML=shown.map(r=>`<tr>${visible.map(c=>`<td title="${escapeHtml(cellText(r,c.field))}">${cellHtml(r,c.field)}</td>`).join("")}</tr>`).join("")||`<tr><td colspan="${visible.length}" class="loading-note">No hay registros para esta selección.</td></tr>`;
  document.getElementById("recordCount").textContent=`${tableRows.length} registros`;
  const btn=document.getElementById("showMoreRows"); btn.hidden=tableRows.length<=10; btn.textContent=showAllRows?"VER MENOS":`VER MÁS (${tableRows.length-10})`; btn.setAttribute("aria-expanded",showAllRows?"true":"false"); document.getElementById("tableWrap").classList.toggle("expanded",showAllRows);
}
function cellText(r,f){ if(f==="price")return r.price?formatMoney(r.price):(r.rawPrice||"—"); if(f==="speed")return r.speed?`${r.speed} Mbps`:(r.rawSpeed||"—"); return normalizeText(r[f])||"—"; }
function cellHtml(r,f){ const t=escapeHtml(cellText(r,f)); if(f==="tv")return `<span class="badge ${r.tv==='Sí'?'green':r.tv==='No especificado'?'yellow':''}">${t}</span>`; if(f==="price")return `<span class="price">${t}</span>`; if(f==="source")return `<span class="badge">${t}</span>`; return t; }
function escapeHtml(v){ return String(v??"").replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[m])); }
function setupColumns(){ const menu=document.getElementById("columnsMenu"); menu.innerHTML=columns.map(c=>`<label><input type="checkbox" data-col="${c.field}" ${visibleColumns[c.field]?'checked':''}> ${c.label}</label>`).join(""); menu.addEventListener("change",e=>{const f=e.target.dataset.col;if(f){visibleColumns[f]=e.target.checked;renderTable();}}); }

function clearAllFilters(){ Object.values(filters).forEach(s=>s.clear()); buildFilters(); applyFilters(); }
function resetFilters(){ clearAllFilters(); }
function initUI(){
  document.addEventListener("click",()=>document.querySelectorAll(".filter-menu").forEach(m=>m.hidden=true));
  document.getElementById("clearFilters").addEventListener("click",clearAllFilters); document.getElementById("resetFilters").addEventListener("click",resetFilters);
  document.getElementById("refreshBtn").addEventListener("click",loadData); document.getElementById("tableSearch").addEventListener("input",()=>{showAllRows=false;renderTable();});
  document.getElementById("showMoreRows").addEventListener("click",()=>{showAllRows=!showAllRows;renderTable();});
  document.getElementById("scrollLeft").addEventListener("click",()=>document.getElementById("tableWrap").scrollBy({left:-420,behavior:"smooth"})); document.getElementById("scrollRight").addEventListener("click",()=>document.getElementById("tableWrap").scrollBy({left:420,behavior:"smooth"}));
  document.getElementById("tableWrap").addEventListener("wheel",e=>{if(e.shiftKey){e.preventDefault();e.currentTarget.scrollLeft+=e.deltaY;}},{passive:false});
  const columnsButton=document.getElementById("columnsButton"),columnsMenu=document.getElementById("columnsMenu"); columnsButton.addEventListener("click",e=>{e.stopPropagation();columnsMenu.hidden=!columnsMenu.hidden;columnsButton.setAttribute("aria-expanded",String(!columnsMenu.hidden));}); columnsMenu.addEventListener("click",e=>e.stopPropagation()); setupColumns();
}

initUI();
loadData().catch(err=>{console.error(err);document.getElementById("sourceStatus").textContent="Error de carga";document.getElementById("recordsBody").innerHTML='<tr><td class="loading-note">No fue posible cargar las fuentes. Revisa los permisos públicos de lectura de los Google Sheets.</td></tr>';});
