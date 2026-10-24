// ============================================================
// TRUCO SOLDADO — protótipo hotseat
// Regras implementadas:
//  - 3 jogadores, 3 cartas cada
//  - Força: 4♦ (menor) ... Gato (maior)
//  - Rodadas valem 3 / 2 / 1 tento
//  - 12 tentos = vitória | 13 = estoura e volta a 0
//  - Escura global quando os TRÊS estão com o MESMO placar
//  - Escura individual quando o jogador está com 11
//    (em escura ele não vê as próprias cartas: clica às cegas)
//  - Registro manual de tapas (corte duplo / carta errada)
// ============================================================

// ---------- Baralho e força ----------
// Ajuste a ordem conforme o truco soldado de vocês.
// 4 de ouro é a MENOR, "Gato" é a MAIOR.
const NAIPES = ["ouro", "espada", "copas", "paus"];
const VALORES = ["4", "5", "6", "7", "Q", "J", "K", "A", "2", "3"];

// Ranking do truco soldado: índice maior = carta mais forte.
// Ordem base: 4 < 5 < 6 < 7 < Q < J < K < A < 2 < 3 < ... (ajuste conforme vocês)
// O "Gato" é representado pela carta especial "GATO".
function forcaDaCarta(carta) {
  if (carta.valor === "GATO") return 999; // maior de todas
  // 4 de ouro é a menor de todas
  if (carta.valor === "4" && carta.naipe === "ouro") return -1;
  const idx = VALORES.indexOf(carta.valor);
  const base = idx * 10;
  // desempate por naipe (ajuste se o truco soldado de vocês tiver ordem de naipe)
  const naipeIdx = NAIPES.indexOf(carta.naipe);
  return base + naipeIdx;
}

function criarBaralho() {
  const baralho = [];
  for (const naipe of NAIPES) {
    for (const valor of VALORES) {
      baralho.push({ valor, naipe });
    }
  }
  // Carta especial "Gato" (representação simbólica; ajuste conforme o baralho de vocês)
  baralho.push({ valor: "GATO", naipe: "especial" });
  return baralho;
}

function embaralhar(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// ---------- Estado ----------
const JOGADORES = ["Jogador 1", "Jogador 2", "Jogador 3"];

const state = {
  tentos: [0, 0, 0],
  zeradas: [0, 0, 0], // Ranking da Vaca
  tapas: [0, 0, 0],
  maos: [[], [], []],       // cartas na mão de cada jogador
  mesa: [null, null, null], // carta jogada na rodada atual (ou null)
  rodada: 0,                // 0, 1, 2
  jogadorInicial: 0,        // quem começa a mão (rotaciona)
  tapaLog: [],
  vencedorMao: null,        // índice do jogador que ganhou a mão (null = em andamento)
};

// ---------- Escura ----------
function recalcularEscura() {
  const [a, b, c] = state.tentos;
  const escuraGlobal = a === b && b === c;
  const escuraIndividual = state.tentos.map(t => t === 11);
  return { escuraGlobal, escuraIndividual };
}

function emEscura(i) {
  const { escuraGlobal, escuraIndividual } = recalcularEscura();
  return escuraGlobal || escuraIndividual[i];
}

// ---------- Fluxo de jogo ----------
function novaMao() {
  const baralho = embaralhar(criarBaralho());
  state.maos = [[], [], []];
  for (let i = 0; i < 3; i++) {
    for (let j = 0; j < 3; j++) {
      state.maos[j].push(baralho.pop());
    }
  }
  state.mesa = [null, null, null];
  state.rodada = 0;
  state.vencedorMao = null;
  render();
}

function jogarCarta(jogador, indiceCarta) {
  if (state.vencedorMao !== null) return;
  if (state.mesa[jogador] !== null) return; // já jogou nesta rodada
  if (state.maos[jogador].length === 0) return;

  const carta = state.maos[jogador].splice(indiceCarta, 1)[0];
  state.mesa[jogador] = carta;

  render();

  // Se todos jogaram, resolve a rodada
  if (state.mesa.every(c => c !== null)) {
    setTimeout(resolverRodada, 600);
  }
}

function resolverRodada() {
  // Compara as 3 cartas jogadas
  const forcas = state.mesa.map(c => forcaDaCarta(c));
  const maxForca = Math.max(...forcas);
  const vencedores = forcas
    .map((f, i) => (f === maxForca ? i : -1))
    .filter(i => i !== -1);

  // Empate na rodada: por enquanto, ninguém pontua (ajuste se quiserem regra própria)
  if (vencedores.length > 1) {
    state.tapaLog.unshift(`Rodada ${state.rodada + 1}: empate entre ${vencedores.map(i => JOGADORES[i]).join(", ")}`);
    state.rodada++;
    state.mesa = [null, null, null];
    if (state.rodada >= 3) finalizarMao(null);
    else render();
    return;
  }

  const vencedor = vencedores[0];
  const pontos = [3, 2, 1][state.rodada];
  aplicarTentos(vencedor, pontos);

  state.tapaLog.unshift(`Rodada ${state.rodada + 1}: ${JOGADORES[vencedor]} levou ${pontos} tento(s)`);
  state.rodada++;
  state.mesa = [null, null, null];

  if (state.rodada >= 3) finalizarMao(vencedor);
  else render();
}

function aplicarTentos(jogador, pontos) {
  state.tentos[jogador] += pontos;
  if (state.tentos[jogador] >= 13) {
    state.tentos[jogador] = 0;
    state.zeradas[jogador]++;
    state.tapaLog.unshift(`💥 ${JOGADORES[jogador]} estourou (13 → 0) e foi zerado! Castigo na vaca 🐄👋`);
  } else if (state.tentos[jogador] === 12) {
    state.tapaLog.unshift(`🏆 ${JOGADORES[jogador]} fez 12 tentos — vitória da partida!`);
  }
}

function finalizarMao(vencedor) {
  state.vencedorMao = vencedor;
  render();
}

// ---------- Tapas ----------
function registrarTapa(jogador, motivo) {
  state.tapas[jogador]++;
  const label = motivo === "corte-duplo" ? "cortou duas cartas" : "deu carta errada";
  state.tapaLog.unshift(`🐄👋 Tapa: ${JOGADORES[jogador]} ${label}`);
  render();
}

// ---------- Render ----------
function render() {
  renderStatus();
  renderPlacar();
  renderMesa();
  renderMaos();
  renderTapaLog();
  renderTapaSelect();
}

function renderStatus() {
  const { escuraGlobal } = recalcularEscura();
  const el = document.getElementById("status-escura");
  if (escuraGlobal) {
    el.textContent = "🌑 ESCURA GLOBAL — todos com o mesmo placar!";
  } else {
    const individuais = state.tentos
      .map((t, i) => (t === 11 ? JOGADORES[i] : null))
      .filter(Boolean);
    el.textContent = individuais.length
      ? `🌑 Escura individual: ${individuais.join(", ")} (11 tentos)`
      : "";
  }
}

function renderPlacar() {
  const el = document.getElementById("placar");
  el.innerHTML = "";
  JOGADORES.forEach((nome, i) => {
    const div = document.createElement("div");
    div.className = "jogador";
    if (emEscura(i)) div.classList.add("escura");
    div.innerHTML = `
      <div class="nome">${nome}</div>
      <div class="tentos">${state.tentos[i]}</div>
      <div class="extras">Zeradas: ${state.zeradas[i]} | Tapas: ${state.tapas[i]}</div>
    `;
    el.appendChild(div);
  });
}

function renderMesa() {
  const el = document.getElementById("mesa");
  el.innerHTML = "";
  JOGADORES.forEach((nome, i) => {
    const slot = document.createElement("div");
    slot.className = "slot";
    const label = document.createElement("div");
    label.className = "label";
    label.textContent = nome;
    slot.appendChild(label);
    const carta = state.mesa[i];
    if (carta) {
      slot.appendChild(criarCartaEl(carta, { jogada: true }));
    } else {
      const vazio = document.createElement("div");
      vazio.className = "carta";
      vazio.style.visibility = "hidden";
      slot.appendChild(vazio);
    }
    el.appendChild(slot);
  });
}

function renderMaos() {
  const el = document.getElementById("maos");
  el.innerHTML = "";
  JOGADORES.forEach((nome, i) => {
    const wrap = document.createElement("div");
    wrap.className = "mao";
    const escura = emEscura(i);
    state.maos[i].forEach((carta, idx) => {
      const elCarta = criarCartaEl(carta, {
        virada: escura,
        onClick: () => jogarCarta(i, idx),
      });
      wrap.appendChild(elCarta);
    });
    el.appendChild(wrap);
  });
}

function criarCartaEl(carta, { virada = false, jogada = false, onClick = null } = {}) {
  const div = document.createElement("div");
  div.className = "carta";
  if (virada) div.classList.add("virada");
  if (jogada) div.classList.add("jogada");
  if (!virada) div.textContent = rotuloCarta(carta);
  if (onClick && !jogada) div.addEventListener("click", onClick);
  return div;
}

function rotuloCarta(carta) {
  if (carta.valor === "GATO") return "🐱";
  const simbolos = { ouro: "♦", espada: "♠", copas: "♥", paus: "♣" };
  return `${carta.valor}${simbolos[carta.naipe] || ""}`;
}

function renderTapaLog() {
  const el = document.getElementById("tapa-log");
  el.innerHTML = state.tapaLog.map(l => `<div>${l}</div>`).join("");
}

function renderTapaSelect() {
  const sel = document.getElementById("tapa-quem");
  if (sel.options.length === JOGADORES.length) return;
  sel.innerHTML = JOGADORES.map((n, i) => `<option value="${i}">${n}</option>`).join("");
}

// ---------- Eventos ----------
document.getElementById("btn-nova-mao").addEventListener("click", novaMao);
document.getElementById("btn-reset").addEventListener("click", () => {
  state.tentos = [0, 0, 0];
  state.zeradas = [0, 0, 0];
  state.tapas = [0, 0, 0];
  state.tapaLog = [];
  novaMao();
});
document.getElementById("btn-tapa").addEventListener("click", () => {
  const quem = Number(document.getElementById("tapa-quem").value);
  const motivo = document.getElementById("tapa-motivo").value;
  registrarTapa(quem, motivo);
});

// ---------- Init ----------
novaMao();