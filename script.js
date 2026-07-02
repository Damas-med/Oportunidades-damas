// ============================================
//  Edite apenas o CONFIG abaixo com o ID da sua
//  planilha. O modelo de colunas está no arquivo
//  "modelo-planilha-oportunidades.xlsx".
// ============================================

const CONFIG = {
  SHEET_ID:   "1TSOdfyqOQMhHXimB3Qm0nfOBRlwhVQOS5IV21T9Cmz0",
  SHEET_NAME: "Oportunidades",
};

const ICON_SVGS = {
  shield: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2 20 6v6c0 5-3.5 8.5-8 10-4.5-1.5-8-5-8-10V6z"/><path d="M9 12l2 2 4-4"/></svg>`,
  microscope: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 18h8"/><path d="M3 22h18"/><path d="M14 22a7 7 0 1 0-7-7"/><path d="M9 6h6l2 4H7z"/><path d="M12 6V3"/></svg>`,
  users: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="9" cy="7" r="4"/><path d="M2 21v-2a5 5 0 0 1 5-5h4a5 5 0 0 1 5 5v2"/><path d="M16 3.5a4 4 0 0 1 0 7.5"/><path d="M22 21v-2a5 5 0 0 0-3.5-4.8"/></svg>`,
  chalkboard: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="12" rx="1"/><path d="M9 20h6"/><path d="M12 16v4"/><path d="M7 9l3 2-3 2"/></svg>`,
  leaf: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 20A7 7 0 0 1 4 13V6a1 1 0 0 1 1-1h7a7 7 0 0 1 7 7 7 7 0 0 1-7 7z"/><path d="M4 13c4-1 8-3 12-8"/></svg>`,
  coin: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="M12 7v10"/><path d="M15 9.5c0-1.4-1.3-2.5-3-2.5s-3 1-3 2.3c0 3 6 1.5 6 4.5 0 1.4-1.3 2.5-3 2.5s-3-1.1-3-2.5"/></svg>`,
  calendar: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M16 3v4M8 3v4M3 10h18"/></svg>`,
  book: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 4.5A2.5 2.5 0 0 1 6.5 2H20v17H6.5A2.5 2.5 0 0 0 4 21.5z"/><path d="M4 4.5v17"/></svg>`,
};

function sl(s){ return (s||"").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g,""); }

// Categorias disponíveis (chip → ícone + cor da barra lateral do card)
const CATEGORIAS = [
  { chave: "pet",       nome: "PET",       icone: "shield",     cor: "#16A34A" },
  { chave: "pibic",     nome: "PIBIC",     icone: "microscope", cor: "#7C3AED" },
  { chave: "pesquisa",  nome: "Pesquisa",  icone: "microscope", cor: "#7C3AED" },
  { chave: "monitoria", nome: "Monitoria", icone: "chalkboard", cor: "#2563EB" },
  { chave: "ligas",     nome: "Ligas",     icone: "users",      cor: "#CA8A04" },
  { chave: "extensao",  nome: "Extensão",  icone: "leaf",       cor: "#0D9488" },
  { chave: "bolsa",     nome: "Bolsa",     icone: "coin",       cor: "#B45309" },
  { chave: "evento",    nome: "Evento",    icone: "calendar",   cor: "#DB2777" },
  { chave: "curso",     nome: "Curso",     icone: "book",       cor: "#1A3D2B" },
];

function categoriaInfo(chave){
  return CATEGORIAS.find(c => c.chave === sl(chave)) || { nome: chave, icone: "book", cor: "#1A3D2B" };
}

function statusInfo(status){
  const v = sl(status);
  if(v.includes("aberto"))     return { classe: "tag-aberto",     borda: "aberto",     texto: "Inscrições abertas" };
  if(v.includes("breve"))      return { classe: "tag-breve",      borda: "breve",      texto: "Em breve" };
  if(v.includes("andamento"))  return { classe: "tag-andamento",  borda: "andamento",  texto: "Em andamento" };
  return { classe: "tag-encerrado", borda: "encerrado", texto: "Encerrada" };
}

// ── DADOS (carregados da planilha Google) ──
let OPORTUNIDADES = [];

// Colunas da planilha, na ordem das colunas A→K.
// Veja "modelo-planilha-oportunidades.xlsx" para o modelo pronto.
const COLUNAS_PLANILHA = [
  "categoria",        // A – pet | pibic | pesquisa | monitoria | ligas | extensao | bolsa | evento | curso
  "titulo",           // B – Ex: PET Medicina
  "subtitulo",        // C – Ex: Programa de Educação Tutorial
  "descricao",        // D – texto curto (1-2 linhas)
  "status",           // E – Aberto | Em breve | Em andamento | Encerrado
  "prazoLabel",       // F – Ex: Inscrições até / Início das inscrições / Encerrado em
  "prazo",            // G – Ex: 20 de agosto
  "vagas",            // H – Ex: 06 vagas
  "link",             // I – URL do edital/formulário
  "botaoSecundario",  // J – texto do botão secundário. Ex: Inscrever-se
  "ativo",            // K – Sim/Não. Vazio = considerado ativo
];

// ── CARREGAR PLANILHA ──
async function carregarOportunidades(){
  try {
    const url = `https://docs.google.com/spreadsheets/d/${CONFIG.SHEET_ID}/gviz/tq?tqx=out:json&sheet=${encodeURIComponent(CONFIG.SHEET_NAME)}`;
    const res  = await fetch(url);
    const text = await res.text();
    const json = JSON.parse(text.match(/google\.visualization\.Query\.setResponse\(([\s\S]*)\)/)[1]);

    OPORTUNIDADES = (json.table.rows || [])
      .map(row => {
        const obj = {};
        COLUNAS_PLANILHA.forEach((col, i) => {
          const cell = row.c[i];
          obj[col] = cell ? (cell.f || cell.v || "") : "";
        });
        return obj;
      })
      .filter(o => o.titulo && sl(o.ativo || "sim") !== "não" && sl(o.ativo || "sim") !== "nao");

    montarChips();
    montarCategoriasGrid();
    atualizarEstatisticas();
    renderizarOportunidades();
  } catch(e) {
    document.getElementById("opp-lista").innerHTML =
      `<div class="loading-wrap">⚠️ Não foi possível carregar as oportunidades.<br><small>Verifique o SHEET_ID e se a planilha está publicada.</small></div>`;
  }
}

let filtroCategoria = "";
let filtroBusca = "";
let mostrarTodas = false;
const LIMITE = 4;

function ordemAtual(){ return document.getElementById("opp-ordenar").value; }

function filtradas(){
  let lista = OPORTUNIDADES.filter(o => {
    if(filtroCategoria && sl(o.categoria) !== filtroCategoria) return false;
    if(filtroBusca &&
       !sl(o.titulo).includes(filtroBusca) &&
       !sl(o.subtitulo).includes(filtroBusca) &&
       !sl(o.descricao).includes(filtroBusca)) return false;
    return true;
  });

  const ordem = ordemAtual();
  if(ordem === "az"){
    lista = [...lista].sort((a,b) => a.titulo.localeCompare(b.titulo));
  } else if(ordem === "prazo"){
    const peso = s => sl(s).includes("aberto") ? 0 : sl(s).includes("andamento") ? 1 : sl(s).includes("breve") ? 2 : 3;
    lista = [...lista].sort((a,b) => peso(a.status) - peso(b.status));
  }
  return lista;
}

function card(o){
  const cat = categoriaInfo(o.categoria);
  const st  = statusInfo(o.status);
  return `
  <div class="opp-card" style="border-left-color:${cat.cor}" onclick="abrirModalOpp('${o.titulo.replace(/'/g,"\\'")}')">
    <div class="opp-card-icone-col">
      <div class="opp-card-icone" style="color:${cat.cor}">${ICON_SVGS[cat.icone] || ICON_SVGS.book}</div>
      <span>${cat.nome}</span>
    </div>
    <div>
      <div class="opp-card-tag ${st.classe}">✓ ${st.texto}</div>
      <div class="opp-card-titulo">${o.titulo}</div>
      <div class="opp-card-subtitulo">${o.subtitulo}</div>
      <div class="opp-card-desc">${o.descricao}</div>
    </div>
    <div class="opp-card-info">
      <div class="opp-card-info-item">🗓️ <span><small>${o.prazoLabel}</small>${o.prazo}</span></div>
      <div class="opp-card-info-item">👤 <span>${o.vagas}</span></div>
    </div>
    <div class="opp-card-acoes" onclick="event.stopPropagation()">
      <button class="opp-btn-principal" onclick="abrirModalOpp('${o.titulo.replace(/'/g,"\\'")}')">Saiba mais</button>
      <button class="opp-btn-secundario" onclick="window.open('${o.link}','_blank')">${o.botaoSecundario}</button>
    </div>
    <div class="opp-card-seta">›</div>
  </div>`;
}

function renderizarOportunidades(){
  const f    = filtradas();
  const lista = document.getElementById("opp-lista");
  const vw   = document.getElementById("opp-ver-todas-wrap");

  if(!f.length){
    lista.innerHTML = `<div class="loading-wrap">Nenhuma oportunidade encontrada.</div>`;
    vw.style.display = "none";
    return;
  }

  const exibir = mostrarTodas ? f : f.slice(0, LIMITE);
  lista.innerHTML = exibir.map(card).join("");
  vw.style.display = (!mostrarTodas && f.length > LIMITE) ? "" : "none";
}

function atualizarEstatisticas(){
  document.getElementById("stat-abertas").textContent =
    String(OPORTUNIDADES.filter(o => sl(o.status).includes("aberto")).length).padStart(2,"0");
  document.getElementById("stat-semana").textContent = "03";
  document.getElementById("stat-total").textContent = String(OPORTUNIDADES.length).padStart(2,"0");
  document.getElementById("stat-categorias").textContent = String(CATEGORIAS.length).padStart(2,"0");
}

function montarChips(){
  const wrap = document.getElementById("opp-chips");
  const todosBtn = `<button class="opp-chip ativa" data-chave="" onclick="filtrarCategoria('',this)">Todos</button>`;
  const chips = CATEGORIAS.map(c =>
    `<button class="opp-chip" data-chave="${c.chave}" onclick="filtrarCategoria('${c.chave}',this)">${c.nome}</button>`
  ).join("");
  wrap.innerHTML = todosBtn + chips;
}

function montarCategoriasGrid(){
  const grid = document.getElementById("opp-categorias-grid");
  grid.innerHTML = CATEGORIAS.map(c => `
    <div class="opp-categoria-card" onclick="irParaCategoria('${c.chave}')">
      <div class="opp-categoria-icon" style="color:${c.cor}">${ICON_SVGS[c.icone] || ICON_SVGS.book}</div>
      <div class="opp-categoria-nome">${c.nome}</div>
    </div>
  `).join("");
}

function filtrarCategoria(chave, btn){
  filtroCategoria = chave;
  mostrarTodas = false;
  document.querySelectorAll(".opp-chip").forEach(b => b.classList.remove("ativa"));
  btn.classList.add("ativa");
  renderizarOportunidades();
}

function irParaCategoria(chave){
  const btn = document.querySelector(`.opp-chip[data-chave="${chave}"]`);
  if(btn) filtrarCategoria(chave, btn);
  document.getElementById("opp-lista").scrollIntoView({ behavior: "smooth", block: "start" });
}

function filtrarStatusChip(){
  document.getElementById("opp-busca-input").focus();
  document.getElementById("opp-lista").scrollIntoView({ behavior: "smooth", block: "start" });
}

function limparFiltros(){
  filtroCategoria = "";
  filtroBusca = "";
  mostrarTodas = false;
  document.getElementById("opp-busca-input").value = "";
  document.querySelectorAll(".opp-chip").forEach(b => b.classList.remove("ativa"));
  document.querySelector('.opp-chip[data-chave=""]').classList.add("ativa");
  renderizarOportunidades();
}

function filtrarOportunidades(){
  filtroBusca = sl(document.getElementById("opp-busca-input").value);
  mostrarTodas = false;
  renderizarOportunidades();
}

function alternarFiltrosAvancados(){
  document.getElementById("opp-btn-filtros").classList.toggle("ativo");
}

function verTodasOportunidades(){
  mostrarTodas = true;
  renderizarOportunidades();
}

// ── MODAL ──
function abrirModalOpp(titulo){
  const o = OPORTUNIDADES.find(x => x.titulo === titulo);
  if(!o) return;
  const cat = categoriaInfo(o.categoria);
  const st  = statusInfo(o.status);

  document.getElementById("opp-modal-content").innerHTML = `
    <div class="opp-modal-header">
      <div class="opp-modal-icone" style="color:${cat.cor}">${ICON_SVGS[cat.icone] || ICON_SVGS.book}</div>
      <div>
        <div class="opp-card-tag ${st.classe}">✓ ${st.texto}</div>
        <div class="modal-sigla" style="font-size:19px">${o.titulo}</div>
      </div>
    </div>
    <div class="modal-body">
      <div class="modal-nome">${o.subtitulo}</div>
      <div class="modal-desc">${o.descricao}</div>
      <div class="modal-grid">
        <div class="modal-info-item"><div class="modal-info-label">Categoria</div><div class="modal-info-value">${cat.nome}</div></div>
        <div class="modal-info-item"><div class="modal-info-label">${o.prazoLabel}</div><div class="modal-info-value">${o.prazo}</div></div>
        <div class="modal-info-item"><div class="modal-info-label">Vagas</div><div class="modal-info-value">${o.vagas}</div></div>
        <div class="modal-info-item"><div class="modal-info-label">Status</div><div class="modal-info-value">${o.status}</div></div>
      </div>
      <div class="modal-acoes">
        <a class="modal-btn-principal" href="${o.link}" target="_blank">Saiba mais ↗</a>
        <button class="modal-btn-sec" onclick="window.open('${o.link}','_blank')">${o.botaoSecundario}</button>
      </div>
    </div>`;

  document.getElementById("opp-modal-overlay").classList.add("open");
}

function fecharModalOpp(){
  document.getElementById("opp-modal-overlay").classList.remove("open");
}

document.addEventListener("keydown", e => { if(e.key === "Escape") fecharModalOpp(); });

// ── INICIAR ──
montarChips();
montarCategoriasGrid();
carregarOportunidades();
