# 🃏 Truco Soldado (Edição Definitiva)

Uma implementação web completa, responsiva e independente (Vanilla HTML5, CSS3 e JavaScript ES6+) do **Truco Soldado** — modalidade tradicional do Paraná. O jogo roda em modo local (*hotseat*) em um único navegador, onde um jogador humano enfrenta duas Inteligências Artificiais com dinâmica de coalizão e mecânicas de estouro e "tapa na vaca".

---

## 📌 Sumário
- [Características Principais](#-características-principais)
- [Regras do Jogo](#-regras-do-jogo)
  - [1. Baralho e Força das Cartas](#1-baralho-e-força-das-cartas)
  - [2. Pontuação por Vaza e Estouro](#2-pontuação-por-vaza-e-estouro)
  - [3. A Regra da Escura](#3-a-regra-da-escura)
  - [4. Fim de Jogo e O Tapa na Vaca](#4-fim-de-jogo-e-o-tapa-na-vaca)
- [Inteligência Artificial & Coalizão](#-inteligência-artificial--coalizão)
- [Arquitetura e Estrutura do Código](#-arquitetura-e-estrutura-do-código)
- [Como Executar](#-como-executar)
- [Tecnologias Utilizadas](#-tecnologias-utilizadas)

---

## ✨ Características Principais

* **Zero Dependências:** Código puro (Sem React, Vue, jQuery ou bibliotecas de física/áudio).
* **Interface Temática:** Mesa de feltro verde circular, baralho espanhol estilizado, animações de cartas e efeitos visuais.
* **Web Audio API:** Sintetizador de áudio integrado para som de distribuição, jogadas de cartas, estouro e efeitos sonoros do jogo.
* **IAs Independentes:** Duas IAs capazes de tomar decisões táticas e formar alianças temporárias (coalizão) contra o líder.
* **Suporte Touch e Desktop:** Totalmente responsivo para telas móveis e desktop.

---

## 📜 Regras do Jogo

### 1. Baralho e Força das Cartas
* Utiliza um **baralho espanhol de 40 cartas** (sem 8, 9 e 10).
* **Força das cartas normais (da menor para a maior):**
  $$\text{4} < \text{5} < \text{6} < \text{7} < \text{Q (Sota)} < \text{J (Caballo)} < \text{K (Rey)} < \text{1 (As)} < \text{2} < \text{3}$$
* **A Vira e a Manilha:** Uma carta é virada no centro da mesa. A **Manilha** é a carta imediatamente superior à Vira na sequência circular de forças.
* **Desempate de Manilhas por Naipe (Menor para Maior):**
  $$\text{Ouros (♦)} < \text{Espadas (♠)} < \text{Copas (♥)} < \text{Paus (♣)}$$

---

### 2. Pontuação por Vaza e Estouro
Cada mão possui **3 vazas** disputadas sequencialmente:
* **1ª Vaza:** Vale **3 tentos**
* **2ª Vaza:** Vale **2 tentos**
* **3ª Vaza:** Vale **1 tento**

> ⚠️ **Aplicação Imediata dos Pontos:** A pontuação é somada **imediatamente** ao jogador que vence a vaza. Se houver empate na vaza (cartas de mesma força), ninguém pontua.

#### 💣 A Regra do Estouro e da Vitória:
* **Estouro (13 ou mais tentos):** Se ao ganhar uma vaza a pontuação do jogador for $\ge 13$, ele **estoura imediatamente**. Seus tentos voltam para **0**, incrementa-se $1$ no contador de Zeradas/Estouros, e a mão continua normalmente para os outros jogadores.
* **Vitória Exata (12 tentos):** Se o jogador **cravar exatamente 12 tentos**, ele se torna o vencedor da partida. O processamento da mão atual é concluído antes da exibição da tela de vitória.

---

### 3. A Regra da Escura
O jogador joga **às cegas** (cartas viradas para baixo) nas seguintes situações:
1. **Escura Global:** Quando os 3 jogadores estiverem empatados com a mesma quantidade de tentos $> 0$ (ex: 4/4/4 ou 7/7/7). *Nota: 0/0/0 não ativa escura global.*
2. **Escura Individual:** Quando qualquer jogador atinge **11 tentos**.

*Na escura, o jogador só descobre o valor de sua carta ao jogá-la na mesa.*

---

### 4. Fim de Jogo e O Tapa na Vaca
* **Objetivo Final:** Vencer a partida cravando 12 tentos e tentar deixar os adversários com **0 tentos**.
* **O Castigo (Tapa na Vaca):** Ao término da partida, o sistema verifica a pontuação final dos derrotados:
  * Se um perdedor terminou com **0 tentos**, ele recebe o overlay especial de **"Tapa na Vaca"** (Animação de castigo vermelho vibrante).
  * Se o perdedor terminou com **$\ge 1$ tento**, ele escapa do castigo.

---

## 🤖 Inteligência Artificial & Coalizão

As duas IAs (**Porco 2** e **Porco 3**) operam de forma autônoma:

1. **Estratégia Padrão:**
   * Tenta vencer a vaza jogando a menor carta possível que supere a carta mais forte da mesa.
   * Se for a primeira a jogar na vaza, guarda cartas fortes e joga a menor carta normal.
2. **Lógica de Coalizão ("A Treta"):**
   * Se a IA detectar que quem está liderando a vaza atual é um "alvo" (jogador com $\ge 8$ tentos, perto de fechar o jogo), ela muda seu comportamento.
   * Se for a **segunda a jogar**, ela "abre a mesa" de propósito jogando uma carta fraca para dar oportunidade para o **terceiro jogador** (seja você ou a outra IA) roubar a vaza e impedir que o líder pontue.

---

## 📐 Arquitetura e Estrutura do Código

Toda a aplicação foi desenhada em uma estrutura orientada a estados no padrão **Single-Page Application (SPA)** em arquivo único `index.html`, dividida em:

```text
truco-soldado/
│
└── index.html
    ├── <style>           # CSS3 Grid/Flexbox, animações 3D e temas
    ├── <body>            # Elementos do tabuleiro circular, placar e modais
    └── <script>          # Módulos de lógica em JS:
        ├── AUDIO_SYS     # Sintetizador Web Audio API para SFX
        ├── GAME_STATE    # Estado global, pontuação e baralho
        ├── IA_ENGINE     # Algoritmo de tomada de decisão e coalizão
        └── UI_CONTROLLER # Manipulação de DOM, renderização e eventos

        