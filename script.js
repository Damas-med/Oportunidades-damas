// ============================================
//  OPORTUNIDADES – DAMAS
//  Edite apenas as variáveis abaixo
// ============================================

const CONFIG = {
  SHEET_ID:   "COLE_AQUI_O_ID_DA_PLANILHA",
  SHEET_NAME: "Oportunidades",
};

const LIMITE = 6;
let todas = [], filtroCat = "", filtroBusca = "", filtroStatus = "", mostrarTodas = false, ordemAtual = "recentes";

const statusOpcoes = ["", "Abertas", "Em breve", "Em andamento", "Encerrada"];
let statusIdx = 0;

function sl(s){ return (s||"").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g,""); }

function statusInfo(s){
  const v = sl(s);
  if(v.includes("aberta") || v === "abertas") return { cls:"st-aberta", bg:"#DCFCE7", cor:"#14532D", dot:"#16A34A" };
  if(v.includes("breve"))   return { cls:"st-breve",   bg:"#FEF9C3", cor:"#713F12", dot:"#CA8A04" };
  if(v.includes("andamento")) return { cls:"st-andamento", bg:"#DBEAFE", cor:"#1E3A8A", dot:"#2563EB" };
  return { cls:"st-enc", bg:"#F3F4F6", cor:"#6B7280", dot:"#9CA3AF" };
}

// ── CARREGAR ──
async function carregar(){
  try {
    const url  = `https://docs.google.com/spreadsheets/d/${CONFIG.SHEET_ID}/gviz/tq?tqx=out:json&sheet=${encodeURIComponent(CONFIG.SHEET_NAME)}`;
    const res  = await fetch(url);
    const text = await res.text();
    const json = JSON.parse(text.match(/google\.visualization\.Query\.setResponse\(([\s\S]*)\)/)[1]);
    const cols = json.table.cols.map(c => c.label.toLowerCase().trim().replace(/\s+/g,"_"));

    todas = (json.table.rows||[]).map(row => {
      const obj = {};
      cols.forEach((col,i) => { const cell=row.c[i]; obj[col]=cell?(cell.f||cell.v||""):""; });
      return obj;
    }).filter(o => o.titulo && o.titulo.toString().trim() !== "");

    atualizarContadores();
    renderizar();
  } catch(e) {
    document.getElementById("oport-lista").innerHTML =
      `<div class="loading-wrap">⚠️ Não foi possível carregar as oportunidades.<br><small>Verifique o SHEET_ID e se a planilha está compartilhada.</small></div>`;
  }
}

// ── CONTADORES ──
function atualizarContadores(){
  const abertas = todas.filter(o => sl(o.status||"").includes("aberta") || sl(o.status||"") === "abertas").length;
  const breve   = todas.filter(o => sl(o.status||"").includes("breve")).length;
  const cats    = new Set(todas.map(o => o.categoria).filter(Boolean)).size;
  document.getElementById("cnt-abertas").textContent = String(abertas).padStart(2,"0");
  document.getElementById("cnt-breve").textContent   = String(breve).padStart(2,"0");
  document.getElementById("cnt-total").textContent   = String(todas.length).padStart(2,"0");
  document.getElementById("cnt-cats").textContent    = String(cats).padStart(2,"0");
}

// ── FILTRAR ──
function filtradas(){
  let f = todas.filter(o => {
    if(filtroCat    && sl(o.categoria||"") !== sl(filtroCat))   return false;
    if(filtroBusca  && !sl(o.titulo).includes(filtroBusca)
                    && !sl(o.subtitulo||"").includes(filtroBusca)
                    && !sl(o.descricao||"").includes(filtroBusca)) return false;
    if(filtroStatus && sl(o.status||"") !== sl(filtroStatus))   return false;
    return true;
  });

  const ord = document.getElementById("select-ordem")?.value || "recentes";
  if(ord === "az")      f = [...f].sort((a,b) => a.titulo.localeCompare(b.titulo));
  if(ord === "abertas") f = [...f].sort((a,b) => {
    const pa = sl(a.status||"").includes("aberta") ? 0 : 1;
    const pb = sl(b.status||"").includes("aberta") ? 0 : 1;
    return pa - pb;
  });
  return f;
}

// ── CARD ──
function card(o, idx){
  const cor  = o.cor_card || "#1A3D2B";
  const icon = o.icone || "🎯";
  const st   = statusInfo(o.status);
  const tituloEsc = (o.titulo||"").replace(/'/g,"\\'");

  const imgHtml = o.imagem_url
    ? `<img src="${o.imagem_url}" alt="${o.titulo}" onerror="this.parentElement.innerHTML='${icon}'">`
    : icon;

  return `
  <div class="oport-card" style="border-left-color:${cor}" onclick="abrirModal('${tituloEsc}')">
    <div class="card-img-wrap">${imgHtml}</div>
    <div class="card-info">
      ${o.status ? `<div class="card-status-tag" style="background:${st.bg};color:${st.cor}"><span style="color:${st.dot}">●</span> ${o.status}</div>` : ""}
      <div class="card-titulo">${o.titulo}</div>
      ${o.subtitulo ? `<div class="card-subtitulo">${o.subtitulo}</div>` : ""}
      ${o.descricao ? `<div class="card-desc">${o.descricao}</div>` : ""}
    </div>
    <div class="card-detalhes">
      ${o.data_limite ? `<div class="card-det-item">📅 ${o.data_limite}</div>` : ""}
      ${o.vagas       ? `<div class="card-det-item">👥 ${o.vagas}</div>` : ""}
    </div>
    <div class="card-acoes" onclick="event.stopPropagation()">
      ${o.link_saiba_mais
        ? `<a class="btn-saiba" href="${o.link_saiba_mais}" target="_blank">Saiba mais</a>`
        : `<button class="btn-saiba" onclick="abrirModal('${tituloEsc}')">Saiba mais</button>`}
      ${o.link_edital ? `<a class="btn-edital" href="${o.link_edital}" target="_blank">Edital / Inscrição</a>` : ""}
    </div>
    <div class="card-seta">›</div>
  </div>`;
}

// ── RENDERIZAR ──
function renderizar(){
  const f    = filtradas();
  const lista = document.getElementById("oport-lista");
  const vw   = document.getElementById("ver-todas-wrap");

  if(!f.length){
    lista.innerHTML = `<div class="loading-wrap">Nenhuma oportunidade encontrada.</div>`;
    vw.style.display = "none";
    return;
  }
  const ex = mostrarTodas ? f : f.slice(0, LIMITE);
  lista.innerHTML = ex.map((o,i) => card(o,i)).join("");
  vw.style.display = (!mostrarTodas && f.length > LIMITE) ? "" : "none";
}

// ── AÇÕES ──
function filtrar(){ filtroBusca=document.getElementById("busca-input").value.toLowerCase(); mostrarTodas=false; renderizar(); }
function filtrarCat(btn,cat){ filtroCat=cat; mostrarTodas=false; document.querySelectorAll(".cat-pill").forEach(b=>b.classList.remove("ativa")); btn.classList.add("ativa"); renderizar(); }
function filtrarStatus(st){ filtroStatus=st; statusIdx=statusOpcoes.indexOf(st); if(statusIdx<0)statusIdx=0; document.getElementById("label-status").textContent=st||"Todos"; document.getElementById("btn-status").classList.toggle("ativo",!!st); mostrarTodas=false; renderizar(); }
function ciclarStatus(){ statusIdx=(statusIdx+1)%statusOpcoes.length; filtrarStatus(statusOpcoes[statusIdx]); }
function verTodas(){ mostrarTodas=true; renderizar(); }

// ── MODAL ──
function abrirModal(titulo){
  const o = todas.find(x => x.titulo === titulo);
  if(!o) return;
  const cor  = o.cor_card || "#1A3D2B";
  const icon = o.icone || "🎯";
  const st   = statusInfo(o.status);
  const capaStyle = o.imagem_url
    ? `background-image:url('${o.imagem_url}');background-size:cover;background-position:center`
    : `background:#E8F0EB`;

  document.getElementById("modal-content").innerHTML = `
    <div class="modal-capa" style="${capaStyle};border-bottom:4px solid ${cor}">
      ${o.imagem_url ? "" : icon}
    </div>
    <div class="modal-body">
      ${o.status ? `<div class="modal-status" style="background:${st.bg};color:${st.cor}"><span style="color:${st.dot}">●</span> ${o.status}</div>` : ""}
      <div class="modal-titulo">${o.titulo}</div>
      ${o.subtitulo ? `<div class="modal-subtitulo">${o.subtitulo}</div>` : ""}
      ${o.descricao ? `<div class="modal-desc">${o.descricao}</div>` : ""}
      <div class="modal-grid">
        ${o.data_limite ? `<div class="modal-info"><div class="modal-info-label">Data limite</div><div class="modal-info-value">📅 ${o.data_limite}</div></div>` : ""}
        ${o.vagas       ? `<div class="modal-info"><div class="modal-info-label">Vagas</div><div class="modal-info-value">👥 ${o.vagas}</div></div>` : ""}
        ${o.categoria   ? `<div class="modal-info"><div class="modal-info-label">Categoria</div><div class="modal-info-value">${o.categoria}</div></div>` : ""}
      </div>
      <div class="modal-acoes">
        ${o.link_saiba_mais
          ? `<a class="modal-btn-p" href="${o.link_saiba_mais}" target="_blank">Saiba mais ↗</a>`
          : `<button class="modal-btn-p" style="opacity:.5;cursor:default">Sem link disponível</button>`}
        ${o.link_edital ? `<a class="modal-btn-s" href="${o.link_edital}" target="_blank">Edital / Inscrição ↗</a>` : ""}
      </div>
    </div>`;

  document.getElementById("modal-overlay").classList.add("open");
}
function fecharModal(){ document.getElementById("modal-overlay").classList.remove("open"); }
document.addEventListener("keydown", e => { if(e.key==="Escape") fecharModal(); });

carregar();
