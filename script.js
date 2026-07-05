const CONFIG = {
  SHEET_ID:   "COLE_AQUI_O_ID_DA_PLANILHA",
  SHEET_NAME: "Oportunidades",
};

const LIMITE = 8;
let todas = [], filtroCat = "", filtroBusca = "", filtroStatus = "", mostrarTodas = false;
const statusOpcoes = ["", "Abertas", "Em breve", "Em andamento", "Encerrada"];
let statusIdx = 0;

function sl(s){ return (s||"").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g,""); }

function statusInfo(s){
  const v = sl(s||"");
  if(v.includes("aberta")||v==="abertas") return {bg:"#DCFCE7",cor:"#14532D",dot:"#16A34A"};
  if(v.includes("breve"))                 return {bg:"#FEF9C3",cor:"#713F12",dot:"#CA8A04"};
  if(v.includes("andamento"))             return {bg:"#DBEAFE",cor:"#1E3A8A",dot:"#2563EB"};
  return {bg:"#F3F4F6",cor:"#6B7280",dot:"#9CA3AF"};
}

async function carregar(){
  try {
    const url  = `https://docs.google.com/spreadsheets/d/${CONFIG.SHEET_ID}/gviz/tq?tqx=out:json&sheet=${encodeURIComponent(CONFIG.SHEET_NAME)}`;
    const res  = await fetch(url);
    const text = await res.text();
    const json = JSON.parse(text.match(/google\.visualization\.Query\.setResponse\(([\s\S]*)\)/)[1]);
    const todasLinhas = json.table.rows || [];
    // Pular linha 1 (cabeçalhos) e linha 2 (exemplos)
    const rows = todasLinhas.slice(2);
    const v = (row, i) => row.c[i] ? (row.c[i].f || row.c[i].v || "") : "";

    todas = rows.map(row => ({
      titulo:          v(row,0),
      categoria:       v(row,1),
      subtitulo:       v(row,2),
      descricao:       v(row,3),
      status:          v(row,4),
      data_limite:     v(row,5),
      vagas:           v(row,6),
      icone:           v(row,7),
      link_saiba_mais: v(row,8),
      link_edital:     v(row,9),
      imagem_url:      v(row,10),
      cor_card:        v(row,11),
    })).filter(o => String(o.titulo||"").trim() !== "");

    atualizarContadores();
    renderizar();
  } catch(e) {
    console.error(e);
    document.getElementById("oport-grid").innerHTML =
      `<div class="loading-wrap" style="grid-column:1/-1">⚠️ Não foi possível carregar.<br><small>${e.message}</small></div>`;
  }
}

function atualizarContadores(){
  const abertas = todas.filter(o=>sl(o.status||"").includes("aberta")).length;
  const breve   = todas.filter(o=>sl(o.status||"").includes("breve")).length;
  const cats    = new Set(todas.map(o=>o.categoria).filter(Boolean)).size;
  document.getElementById("cnt-abertas").textContent = String(abertas).padStart(2,"0");
  document.getElementById("cnt-breve").textContent   = String(breve).padStart(2,"0");
  document.getElementById("cnt-total").textContent   = String(todas.length).padStart(2,"0");
  document.getElementById("cnt-cats").textContent    = String(cats).padStart(2,"0");
}

function filtradas(){
  let f = todas.filter(o=>{
    if(filtroCat    && sl(o.categoria||"")!==sl(filtroCat))   return false;
    if(filtroBusca  && !sl(o.titulo||"").includes(filtroBusca)
                    && !sl(o.subtitulo||"").includes(filtroBusca)
                    && !sl(o.descricao||"").includes(filtroBusca)) return false;
    if(filtroStatus && sl(o.status||"")!==sl(filtroStatus))   return false;
    return true;
  });
  const ord = document.getElementById("select-ordem")?.value||"recentes";
  if(ord==="az")      f=[...f].sort((a,b)=>(a.titulo||"").localeCompare(b.titulo||""));
  if(ord==="abertas") f=[...f].sort((a,b)=>(sl(a.status||"").includes("aberta")?0:1)-(sl(b.status||"").includes("aberta")?0:1));
  return f;
}

function card(o){
  const cor  = o.cor_card || "#1A3D2B";
  const icon = o.icone || "🎯";
  const st   = statusInfo(o.status);
  const esc  = (o.titulo||"").replace(/'/g,"\\'");
  const capa = o.imagem_url ? `background-image:url('${o.imagem_url}')` : `background:${cor}`;
  return `
  <div class="oport-card" onclick="abrirModal('${esc}')">
    <div class="card-capa">
      <div class="card-capa-bg" style="${capa}"></div>
      <div class="card-capa-overlay"></div>
      <div class="card-capa-borda"></div>
      <div class="card-logo-wrap">
        ${o.imagem_url
          ? `<img src="${o.imagem_url}" style="width:42px;height:42px;border-radius:50%;object-fit:cover">`
          : `<span style="font-size:26px">${icon}</span>`}
      </div>
    </div>
    <div class="card-body">
      ${o.categoria ? `<div class="card-cat">${o.categoria.toUpperCase()}</div>` : ""}
      <div class="card-titulo">${o.titulo}</div>
      ${o.subtitulo ? `<div class="card-subtitulo">${o.subtitulo}</div>` : ""}
      ${o.descricao ? `<div class="card-desc">${o.descricao}</div>` : ""}
      <div class="card-meta">
        ${o.data_limite ? `<div class="card-meta-item">📅 ${o.data_limite}</div>` : ""}
        ${o.vagas       ? `<div class="card-meta-item">👥 ${o.vagas}</div>`       : ""}
      </div>
      ${o.status ? `<div class="card-status-tag" style="background:${st.bg};color:${st.cor}"><span style="color:${st.dot}">●</span> ${o.status}</div>` : ""}
      <button class="card-btn">Saiba mais →</button>
    </div>
  </div>`;
}

function renderizar(){
  const f    = filtradas();
  const grid = document.getElementById("oport-grid");
  const vw   = document.getElementById("ver-todas-wrap");
  if(!f.length){ grid.innerHTML=`<div class="loading-wrap" style="grid-column:1/-1">Nenhuma oportunidade encontrada.</div>`; vw.style.display="none"; return; }
  grid.innerHTML = (mostrarTodas?f:f.slice(0,LIMITE)).map(card).join("");
  vw.style.display = (!mostrarTodas&&f.length>LIMITE)?"":"none";
}

function filtrar(){ filtroBusca=document.getElementById("busca-input").value.toLowerCase(); mostrarTodas=false; renderizar(); }
function filtrarCat(btn,cat){ filtroCat=cat; mostrarTodas=false; document.querySelectorAll(".cat-pill").forEach(b=>b.classList.remove("ativa")); btn.classList.add("ativa"); renderizar(); }
function filtrarStatus(st){ filtroStatus=st; statusIdx=statusOpcoes.indexOf(st); if(statusIdx<0)statusIdx=0; document.getElementById("label-status").textContent=st||"Todos"; document.getElementById("btn-status").classList.toggle("ativo",!!st); mostrarTodas=false; renderizar(); }
function ciclarStatus(){ statusIdx=(statusIdx+1)%statusOpcoes.length; filtrarStatus(statusOpcoes[statusIdx]); }
function verTodas(){ mostrarTodas=true; renderizar(); }

function abrirModal(titulo){
  const o=todas.find(x=>x.titulo===titulo); if(!o)return;
  const cor=o.cor_card||"#1A3D2B", icon=o.icone||"🎯", st=statusInfo(o.status);
  const capa=o.imagem_url?`background-image:url('${o.imagem_url}');background-size:cover;background-position:center`:`background:${cor}`;
  document.getElementById("modal-content").innerHTML=`
    <div class="modal-capa" style="${capa};border-bottom:4px solid ${cor}">${o.imagem_url?"":icon}</div>
    <div class="modal-body">
      ${o.status?`<div class="modal-status" style="background:${st.bg};color:${st.cor}"><span style="color:${st.dot}">●</span> ${o.status}</div>`:""}
      <div class="modal-titulo">${o.titulo}</div>
      ${o.subtitulo?`<div class="modal-subtitulo">${o.subtitulo}</div>`:""}
      ${o.descricao?`<div class="modal-desc">${o.descricao}</div>`:""}
      <div class="modal-grid">
        ${o.data_limite?`<div class="modal-info"><div class="modal-info-label">Data limite</div><div class="modal-info-value">📅 ${o.data_limite}</div></div>`:""}
        ${o.vagas?`<div class="modal-info"><div class="modal-info-label">Vagas</div><div class="modal-info-value">👥 ${o.vagas}</div></div>`:""}
        ${o.categoria?`<div class="modal-info"><div class="modal-info-label">Categoria</div><div class="modal-info-value">${o.categoria}</div></div>`:""}
      </div>
      <div class="modal-acoes">
        ${o.link_saiba_mais?`<a class="modal-btn-p" href="${o.link_saiba_mais}" target="_blank">Saiba mais ↗</a>`:`<button class="modal-btn-p" style="opacity:.5;cursor:default">Sem link disponível</button>`}
        ${o.link_edital?`<a class="modal-btn-s" href="${o.link_edital}" target="_blank">Edital / Inscrição ↗</a>`:""}
      </div>
    </div>`;
  document.getElementById("modal-overlay").classList.add("open");
}
function fecharModal(){ document.getElementById("modal-overlay").classList.remove("open"); }
document.addEventListener("keydown",e=>{ if(e.key==="Escape")fecharModal(); });

carregar();
