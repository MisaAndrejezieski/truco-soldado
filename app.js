const NAIPES = ["ouro", "espada", "copas", "paus"]; 
const VALORES = ["4", "5", "6", "7", "Q", "J", "K", "A", "2", "3"];
const FORCA_NORMAL = ["3", "2", "A", "K", "J", "Q", "7", "6", "5", "4"];
const SIMBOLOS = { ouro: "♦", espada: "♠", copas: "♥", paus: "♣" };

const PONTOS_POR_VAZA = [3, 2, 1];
const NOMES = ["Porco Verde", "Porco Mulato", "Porco Anjo"];
const HUMANO = 0;

function criarBaralho() {
  const b = [];
  for (const naipe of NAIPES) for (const valor of VALORES) b.push({ valor, naipe });
  return b;
}

function embaralhar(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function valorDaManilha(vira) {
  const idx = VALORES.indexOf(vira.valor);
  return VALORES[(idx + 1) % VALORES.length];
}

function forcaDaCarta(carta, manilhaValor) {
  if (carta.valor === manilhaValor) return 1000 + NAIPES.indexOf(carta.naipe);
  const idx = FORCA_NORMAL.indexOf(carta.valor);
  return 100 + (9 - idx);
}

function rotuloCarta(carta) {
  return `${carta.valor}${SIMBOLOS[carta.naipe] || ""}`;
}

const state = {
  tentos: [0, 0, 0],
  zeradas: [0, 0, 0],
  baralho: [],
  vira: null,
  manilhaValor: null,
  maos: [[], [], []],
  mesa: [null, null, null],
  quemJogou: [false, false, false],
  vazaAtual: 0,
  vazasGanhas: [0, 0, 0],
  jogadorInicial: -1,
  fase: "jogando",
  mensagem: "",
  castigadosFinais: [],
};

function recalcularEscura() {
  const [a, b, c] = state.tentos;
  const escuraGlobal = a === b && b === c && a !== 0; 
  const escuraIndividual = state.tentos.map(t => t === 11);
  return { escuraGlobal, escuraIndividual };
}

function emEscura(i) {
  const { escuraGlobal, escuraIndividual } = recalcularEscura();
  return escuraGlobal || escuraIndividual[i];
}

function novaMao() {
  if (state.fase === "fimPartida" || state.fase === "castigo") {
    state.tentos = [0, 0, 0];
    state.zeradas = [0, 0, 0];
    state.jogadorInicial = -1;
    state.fase = "jogando";
  }

  state.baralho = embaralhar(criarBaralho());
  state.maos = [[], [], []];
  for (let i = 0; i < 3; i++)
    for (let j = 0; j < 3; j++)
      state.maos[j].push(state.baralho.pop());

  state.vira = state.baralho.pop();
  state.manilhaValor = valorDaManilha(state.vira);

  state.mesa = [null, null, null];
  state.quemJogou = [false, false, false];
  state.vazaAtual = 0;
  state.vazasGanhas = [0, 0, 0];
  state.fase = "jogando";
  state.mensagem = "";

  state.jogadorInicial = (state.jogadorInicial + 1) % 3;
  render();
  setTimeout(talvezIAsJoguem, 600);
}

function jogarCarta(jogador, indiceCarta) {
  if (state.fase !== "jogando") return;
  if (state.quemJogou[jogador]) return;
  if (state.maos[jogador].length === 0) return;

  const carta = state.maos[jogador].splice(indiceCarta, 1)[0];
  state.mesa[jogador] = carta;
  state.quemJogou[jogador] = true;

  render();

  if (state.fase !== "jogando") return;

  if (state.quemJogou.every(Boolean)) {
    setTimeout(resolverVaza, 800);
  } else {
    setTimeout(talvezIAsJoguem, 400);
  }
}

function talvezIAsJoguem() {
  if (state.fase !== "jogando") return;
  for (let i = 1; i <= 2; i++) {
    if (!state.quemJogou[i]) {
      setTimeout(() => jogadaIA(i), 400 + i * 200);
    }
  }
}

function jogadaIA(jogador) {
  if (state.fase !== "jogando") return;
  if (state.quemJogou[jogador]) return;
  if (state.maos[jogador].length === 0) return;

  const mao = state.maos[jogador];
  const escura = emEscura(jogador);
  let indice;

  if (escura) {
    indice = Math.floor(Math.random() * mao.length);
  } else {
    const cartasNaMesa = state.mesa
      .map((c, idx) => (c && idx !== jogador ? c : null))
      .filter(Boolean);
    const forcas = cartasNaMesa.map(c => forcaDaCarta(c, state.manilhaValor));
    const maiorNaMesa = forcas.length ? Math.max(...forcas) : -1;

    const ordenadas = mao
      .map((c, idx) => ({ idx, forca: forcaDaCarta(c, state.manilhaValor) }))
      .sort((a, b) => a.forca - b.forca);

    if (maiorNaMesa < 0) {
      indice = ordenadas[0].idx;
    } else {
      const vencedora = ordenadas.find(o => o.forca > maiorNaMesa);
      indice = vencedora ? vencedora.idx : ordenadas[0].idx;
    }
  }

  jogarCarta(jogador, indice);
}

function resolverVaza() {
  const forcas = state.mesa.map(c => forcaDaCarta(c, state.manilhaValor));
  const maxForca = Math.max(...forcas);
  const vencedores = forcas.map((f, i) => (f === maxForca ? i : -1)).filter(i => i !== -1);

  let vencedor = null;
  
  if (vencedores.length === 1) {
    vencedor = vencedores[0];
    state.vazasGanhas[vencedor]++;
    const pontos = PONTOS_POR_VAZA[state.vazaAtual] ?? 0;
    
    if (pontos > 0) state.tentos[vencedor] += pontos;
    
    state.mensagem = `${NOMES[vencedor]} ganhou a ${state.vazaAtual + 1}ª vaza (+${pontos})`;
  } else {
    state.mensagem = `Empate na ${state.vazaAtual + 1}ª vaza (ninguém pontua)`;
  }

  state.vazaAtual++;

  if (state.vazaAtual >= 3) {
    resolverMao();
    return;
  }

  if (vencedor !== null) {
    state.jogadorInicial = vencedor;
  }
  
  state.mesa = [null, null, null];
  state.quemJogou = [false, false, false];

  render();
  setTimeout(talvezIAsJoguem, vencedor === null ? 1800 : 800);
}

function resolverMao() {
  const [g1, g2, g3] = state.vazasGanhas;
  let vencedor = null;
  if (g1 > g2 && g1 > g3) vencedor = 0;
  else if (g2 > g1 && g2 > g3) vencedor = 1;
  else if (g3 > g1 && g3 > g2) vencedor = 2;

  state.fase = "fimMao";
  state.mensagem = vencedor !== null
    ? `${NOMES[vencedor]} ganhou a mão`
    : "Mão empatada — ninguém ganhou";

  verificarFimDeJogo();
  render();
}

function verificarFimDeJogo() {
  for (let i = 0; i < 3; i++) {
    if (state.tentos[i] >= 13) {
      state.tentos[i] = 0;
      state.zeradas[i]++;
      state.mensagem = `${NOMES[i]} estourou (13) e voltou pro ZERO!`;
    }
  }

  for (let i = 0; i < 3; i++) {
    if (state.tentos[i] >= 12) {
      state.fase = "fimPartida";
      state.mensagem = `${NOMES[i]} fez 12 tentos e VENCEU A PARTIDA!`;
      
      state.castigadosFinais = [];
      for (let j = 0; j < 3; j++) {
        if (j !== i && state.tentos[j] === 0) {
          state.castigadosFinais.push(j);
        }
      }

      if (state.castigadosFinais.length > 0) {
        state.fase = "castigo";
      }
      return;
    }
  }
}

function mostrarTapa(jogadores) {
  const overlay = document.getElementById("tapa-overlay");
  const texto = document.getElementById("tapa-quem");
  
  const nomes = jogadores.map(j => `<strong>${NOMES[j]}</strong>`).join(" e ");
  texto.innerHTML = `A partida acabou!<br>${nomes} terminaram com ZERO.<br>Devem pagar o castigo na vaca!`;
  
  overlay.classList.remove("escondido");
}

document.getElementById("btn-fechar-tapa").addEventListener("click", () => {
  document.getElementById("tapa-overlay").classList.add("escondido");
  const idxVencedor = state.tentos.findIndex(t => t >= 12);
  state.fase = "fimPartida"; 
  state.mensagem = `O castigo foi aplicado. Vitória do ${NOMES[idxVencedor]}!`;
  render();
});

function render() {
  renderStatus();
  renderBaralhoVira();
  renderAssentos();
  renderCartasJogadas();
  renderPlacar();
  
  if (state.fase === "castigo") {
    if (document.getElementById("tapa-overlay").classList.contains("escondido")) {
      mostrarTapa(state.castigadosFinais);
    }
  }
}

function renderStatus() {
  const el = document.getElementById("status-escura");
  
  if (state.fase === "fimPartida" || state.fase === "castigo") {
    el.textContent = state.mensagem;
    el.style.color = "var(--ok)";
    return;
  }

  el.style.color = "var(--accent)";
  const { escuraGlobal } = recalcularEscura();
  
  if (escuraGlobal) {
    el.textContent = "ESCURA GLOBAL — empate dos três!";
  } else {
    const ind = state.tentos.map((t, i) => (t === 11 ? NOMES[i] : null)).filter(Boolean);
    el.textContent = ind.length
      ? `Escura individual: ${ind.join(", ")} (11 tentos)`
      : (state.mensagem || "");
  }
}

function renderBaralhoVira() {
  const el = document.getElementById("baralho-vira");
  el.innerHTML = "";
  if (!state.vira) return;

  const baralhoEl = document.createElement("div");
  baralhoEl.className = "baralho";
  baralhoEl.style.transform = "translate(-4px, -4px)";
  baralhoEl.style.position = "absolute";
  
  const viraEl = document.createElement("div");
  viraEl.className = "vira-card";
  if (state.vira.naipe === "copas" || state.vira.naipe === "ouro") viraEl.classList.add("vermelha");
  else viraEl.classList.add("preta");
  
  viraEl.textContent = rotuloCarta(state.vira);
  viraEl.style.position = "absolute";
  viraEl.style.transform = "translate(8px, 8px) rotate(10deg)";

  el.appendChild(baralhoEl);
  el.appendChild(viraEl);
}

function renderAssentos() {
  NOMES.forEach((nome, i) => {
    const el = document.getElementById(`assento-${i}`);
    if (!el) return;
    el.innerHTML = "";

    if (emEscura(i)) el.classList.add("escura");
    else el.classList.remove("escura");

    const nomeEl = document.createElement("div");
    nomeEl.className = "nome";
    nomeEl.textContent = nome;

    const tentoEl = document.createElement("div");
    tentoEl.className = "tentos";
    tentoEl.textContent = `${state.tentos[i]} tentos`;

    const extraEl = document.createElement("div");
    extraEl.className = "extras";
    extraEl.textContent = `Zeradas: ${state.zeradas[i]}`;

    el.appendChild(nomeEl);
    el.appendChild(tentoEl);
    el.appendChild(extraEl);

    const maoEl = document.createElement("div");
    maoEl.className = "mao";
    const escura = emEscura(i);
    const podeClicar = i === HUMANO && state.fase === "jogando" && !state.quemJogou[HUMANO];

    state.maos[i].forEach((carta, idx) => {
      const virada = i !== HUMANO || escura;
      const elCarta = criarCartaEl(carta, {
        virada,
        onClick: podeClicar ? () => jogarCarta(HUMANO, idx) : null,
      });
      maoEl.appendChild(elCarta);
    });
    el.appendChild(maoEl);
  });
}

function renderCartasJogadas() {
  NOMES.forEach((_, i) => {
    const el = document.getElementById(`carta-jogada-${i}`);
    if (!el) return;
    el.innerHTML = "";
    
    const carta = state.mesa[i];
    if (carta) {
      el.appendChild(criarCartaEl(carta, { jogada: true }));
    } else {
      const vazio = document.createElement("div");
      vazio.className = "carta";
      vazio.style.visibility = "hidden";
      el.appendChild(vazio);
    }
  });
}

function renderPlacar() {
  const el = document.getElementById("placar");
  el.innerHTML = "";
  NOMES.forEach((nome, i) => {
    const div = document.createElement("div");
    div.className = "jogador";
    if (emEscura(i)) div.classList.add("escura");
    div.innerHTML = `
      <div class="nome">${nome}</div>
      <div class="tentos">${state.tentos[i]}</div>
    `;
    el.appendChild(div);
  });
}

function criarCartaEl(carta, { virada = false, jogada = false, onClick = null } = {}) {
  const div = document.createElement("div");
  div.className = "carta";
  
  if (virada) {
    div.classList.add("virada");
  } else {
    if (carta.naipe === "copas" || carta.naipe === "ouro") div.classList.add("vermelha");
    else div.classList.add("preta");
    div.textContent = rotuloCarta(carta);
  }

  if (jogada) div.classList.add("jogada");
  if (onClick && !jogada) div.addEventListener("click", onClick);
  
  return div;
}

document.getElementById("btn-nova-mao").addEventListener("click", () => {
  if (state.fase === "castigo" || state.fase === "fimPartida") return; 
  novaMao();
});

document.getElementById("btn-reset").addEventListener("click", () => {
  state.tentos = [0, 0, 0];
  state.zeradas = [0, 0, 0];
  state.jogadorInicial = -1;
  state.fase = "jogando";
  document.getElementById("tapa-overlay").classList.add("escondido");
  novaMao();
});

state.jogadorInicial = -1;
novaMao();