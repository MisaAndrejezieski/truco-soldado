// ============================================================================
// TRUCO SOLDADO - ARQUITETURA ORIENTADA A OBJETOS E INTELIGÊNCIA ARTIFICIAL
// ============================================================================

// --- 1. CONFIGURAÇÕES E CONSTANTES ---
const RANKS = ['4', '5', '6', '7', 'Q', 'J', 'K', '2', '3'];
const SUITS = [
    { name: 'Ouros', symbol: '♦', color: 'text-red-600', power: 1 },
    { name: 'Espadas', symbol: '♠', color: 'text-slate-900', power: 2 },
    { name: 'Copas', symbol: '♥', color: 'text-red-600', power: 3 },
    { name: 'Paus', symbol: '♣', color: 'text-slate-900', power: 4 }
];
const TRICK_POINTS = [3, 2, 1];
const PLAYER_NAMES = ['Porco 1 (Você)', 'Porco 2 (IA)', 'Porco 3 (IA)'];

// --- 2. CLASSES ---
class Card {
    constructor(rank, suit) {
        this.rank = rank;
        this.suit = suit;
    }
    get strength() { return RANKS.indexOf(this.rank); }
    get isManilha(manilhaRank) { return this.rank === manilhaRank; }
}

class Player {
    constructor(id, isAI) {
        this.id = id;
        this.name = PLAYER_NAMES[id];
        this.isAI = isAI;
        this.hand = [];
        this.score = 0;
        this.resets = 0; // Estouros
    }
    receiveCards(cards) { this.hand = cards; }
    clearHand() { this.hand = []; }
    addScore(points) {
        this.score += points;
        if (this.score > 12) {
            this.score = 0;
            this.resets++;
            return 'BUST'; // Estourou
        } else if (this.score === 12) {
            return 'WIN'; // Venceu a partida (mas a mão termina)
        }
        return 'OK';
    }
}

// --- 3. MOTOR DO JOGO (GameEngine) ---
class GameEngine {
    constructor() {
        this.players = [new Player(0, false), new Player(1, true), new Player(2, true)];
        this.deck = [];
        this.vira = null;
        this.manilhaRank = null;
        this.currentTrick = 0;
        this.trickCards = [];
        this.starter = 0;
        this.turn = 0;
        this.isProcessing = false;
        this.matchWinner = null;
        
        this.initUI();
        this.resetGame();
    }

    resetGame() {
        document.getElementById('victory-overlay').classList.add('hidden');
        document.getElementById('slap-overlay').classList.add('hidden');
        this.players.forEach(p => { p.score = 0; p.resets = 0; });
        this.matchWinner = null;
        this.starter = 0;
        this.updateUI();
        this.log("Partida reiniciada.");
        this.startNewHand();
    }

    createDeck() {
        const deck = [];
        for (let r of RANKS) {
            for (let s of SUITS) {
                deck.push(new Card(r, s));
            }
        }
        return this.shuffle(deck);
    }

    shuffle(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
        return array;
    }

    getManilhaRank(viraRank) {
        return RANKS[(RANKS.indexOf(viraRank) + 1) % RANKS.length];
    }

    getCardPower(card) {
        if (card.isManilha(this.manilhaRank)) {
            return 100 + card.suit.power;
        }
        return card.strength;
    }

    startNewHand() {
        if (this.isProcessing || this.matchWinner !== null) return;
        
        // Prepara baralho
        this.deck = this.createDeck();
        this.vira = this.deck.pop();
        this.manilhaRank = this.getManilhaRank(this.vira.rank);

        // Distribui
        this.players.forEach(p => p.clearHand());
        for (let i = 0; i < 3; i++) {
            this.players.forEach(p => p.hand.push(this.deck.pop()));
        }

        // Reseta estado da mão
        this.currentTrick = 0;
        this.trickCards = [];
        this.starter = (this.starter + 1) % 3;
        this.turn = this.starter;
        
        this.renderVira();
        this.clearBoard();
        this.updateUI();
        this.log(`--- Nova Mão --- Manilha: ${this.manilhaRank}`);

        document.getElementById('btn-next-hand').classList.add('opacity-50', 'pointer-events-none');

        if (this.players[this.turn].isAI) this.aiTurn();
    }

    playCard(playerId, cardIndex) {
        if (this.isProcessing || this.turn !== playerId) return;

        const player = this.players[playerId];
        const card = player.hand.splice(cardIndex, 1)[0];
        
        this.trickCards.push({ playerId, card });
        this.renderPlayedCard(playerId, card);
        this.renderHand(playerId);

        if (this.trickCards.length === 3) {
            this.isProcessing = true;
            setTimeout(() => this.resolveTrick(), 1000);
        } else {
            this.turn = (this.turn + 1) % 3;
            this.updateUI();
            if (this.players[this.turn].isAI) this.aiTurn();
        }
    }

    resolveTrick() {
        let highestPower = -1;
        let winnerId = null;
        let isTie = false;

        this.trickCards.forEach(item => {
            const power = this.getCardPower(item.card);
            if (power > highestPower) {
                highestPower = power;
                winnerId = item.playerId;
                isTie = false;
            } else if (power === highestPower) {
                isTie = true;
            }
        });

        if (!isTie) {
            const points = TRICK_POINTS[this.currentTrick];
            const result = this.players[winnerId].addScore(points);
            
            if (result === 'BUST') {
                this.log(`💥 ${this.players[winnerId].name} ESTOUROU! Voltou para 0.`);
            } else if (result === 'WIN') {
                this.log(`🎯 ${this.players[winnerId].name} CRAVOU 12 TENTOS!`);
            } else {
                this.log(`Vaza ${this.currentTrick + 1} vencida por ${this.players[winnerId].name} (+${points})`);
            }
        } else {
            this.log(`Vaza ${this.currentTrick + 1} empatou.`);
        }

        this.currentTrick++;
        
        setTimeout(() => {
            this.clearBoard();
            
            if (this.currentTrick < 3) {
                this.isProcessing = false;
                if (!isTie) this.turn = winnerId;
                else this.turn = this.starter;
                
                this.updateUI();
                if (this.players[this.turn].isAI) this.aiTurn();
            } else {
                this.endHand();
            }
        }, 1500);
    }

    endHand() {
        this.isProcessing = false;
        
        // Verifica vitória
        const winner = this.players.find(p => p.score === 12);
        if (winner) {
            this.matchWinner = winner.id;
            this.handleVictory(winner);
        } else {
            document.getElementById('btn-next-hand').classList.remove('opacity-50', 'pointer-events-none');
            this.log("Mão encerrada. Clique em NOVA MÃO.");
        }
    }

    handleVictory(winner) {
        const punished = this.players.filter(p => p.id !== winner.id && p.score === 0);
        
        if (punished.length > 0) {
            document.getElementById('slap-target').innerText = `${punished.map(p=>p.name).join(' e ')} terminou com 0!`;
            document.getElementById('slap-overlay').classList.remove('hidden');
        } else {
            document.getElementById('victory-title').innerText = `${winner.name} VENCEU!`;
            document.getElementById('victory-overlay').classList.remove('hidden');
        }
    }

    closeSlap() {
        document.getElementById('slap-overlay').classList.add('hidden');
        document.getElementById('victory-title').innerText = `${this.players[this.matchWinner].name} VENCEU!`;
        document.getElementById('victory-overlay').classList.remove('hidden');
    }

    // --- INTELIGÊNCIA ARTIFICIAL AVANÇADA ---
    aiTurn() {
        setTimeout(() => {
            const ai = this.players[this.turn];
            
            // A MÁGICA DA ESCURA: A IA não vê a própria mão, escolhe aleatório pelo índice.
            if (this.isEscura(ai.id)) {
                const randomIndex = Math.floor(Math.random() * ai.hand.length);
                this.playCard(ai.id, randomIndex);
                return;
            }

            // Lógica de Coalizão e Heurística
            let chosenIndex = 0;
            const tableCards = this.trickCards;
            
            // 1. Se for o primeiro a jogar, joga a carta mais fraca.
            if (tableCards.length === 0) {
                chosenIndex = this.getWeakestCardIndex(ai.hand);
            } else {
                // 2. Analisa a mesa
                let highestTablePower = -1;
                let tableLeader = null;

                tableCards.forEach(tc => {
                    const p = this.getCardPower(tc.card);
                    if (p > highestTablePower) {
                        highestTablePower = p;
                        tableLeader = tc.playerId;
                    }
                });

                // 3. Lógica de Treta (Coalizão contra quem está perto de 11)
                const leaderScore = this.players[tableLeader].score;
                const isTarget = leaderScore >= 8 && leaderScore <= 11;

                if (tableCards.length === 1 && isTarget) {
                    // Se o alvo está ganhando, joga a mais fraca para o terceiro roubar a vaza.
                    chosenIndex = this.getWeakestCardIndex(ai.hand);
                } else {
                    // Tenta achar a menor carta que ganha da mesa
                    let winningIndex = -1;
                    let lowestWinningPower = Infinity;

                    ai.hand.forEach((card, idx) => {
                        const p = this.getCardPower(card);
                        if (p > highestTablePower && p < lowestWinningPower) {
                            lowestWinningPower = p;
                            winningIndex = idx;
                        }
                    });

                    if (winningIndex !== -1) {
                        chosenIndex = winningIndex; // Joga a menor que ganha
                    } else {
                        chosenIndex = this.getWeakestCardIndex(ai.hand); // Descarta a mais fraca
                    }
                }
            }

            this.playCard(ai.id, chosenIndex);
        }, 1000);
    }

    getWeakestCardIndex(hand) {
        let weakest = Infinity;
        let idx = 0;
        hand.forEach((card, i) => {
            const p = this.getCardPower(card);
            if (p < weakest) {
                weakest = p;
                idx = i;
            }
        });
        return idx;
    }

    isEscura(playerId) {
        const s = this.players.map(p => p.score);
        const global = s[0] === s[1] && s[1] === s[2] && s[0] > 0;
        const individual = s[playerId] === 11;
        return global || individual;
    }

    // --- UI RENDERIZAÇÃO ---
    initUI() {
        this.els = {
            log: document.getElementById('game-log'),
            viraRank: document.getElementById('vira-rank'),
            viraSuit: document.getElementById('vira-suit'),
            trickBadge: document.getElementById('trick-badge'),
            escuraBadge: document.getElementById('escura-badge')
        };
    }

    updateUI() {
        this.players.forEach(p => {
            document.getElementById(`score-${p.id}`).innerText = p.score;
            if (p.id === 0) document.getElementById('resets-0').innerText = p.resets;
            this.renderHand(p.id);
        });

        this.els.trickBadge.innerText = `VAZA ${this.currentTrick + 1}: VALE ${TRICK_POINTS[this.currentTrick]} TENTOS`;
        
        const globalEscura = this.players.every(p => p.score === this.players[0].score) && this.players[0].score > 0;
        this.els.escuraBadge.classList.toggle('hidden', !globalEscura);
    }

    renderHand(playerId) {
        const container = document.getElementById(`hand-${playerId}`);
        if (!container) return;
        container.innerHTML = '';

        const player = this.players[playerId];
        const isEscura = this.isEscura(playerId);

        player.hand.forEach((card, index) => {
            const el = document.createElement('div');
            
            if (playerId === 0) {
                // Humano
                el.className = `card w-16 h-24 rounded-xl flex flex-col justify-between p-2 shadow-xl cursor-pointer ${isEscura ? 'card-back' : 'bg-slate-50'}`;
                if (isEscura) {
                    el.innerHTML = `<div class="text-3xl text-center mt-4">🐷</div>`;
                    el.onclick = () => this.playCard(0, index);
                } else {
                    el.className += ` border-2 ${card.rank === this.manilhaRank ? 'border-yellow-400' : 'border-slate-300'}`;
                    el.innerHTML = `
                        <span class="text-sm font-bold ${card.suit.color}">${card.rank}</span>
                        <span class="text-3xl text-center ${card.suit.color}">${card.suit.symbol}</span>
                        <span class="text-sm font-bold text-right ${card.suit.color}">${card.rank}</span>
                    `;
                    el.onclick = () => this.playCard(0, index);
                }
            } else {
                // IA
                el.className = `w-12 h-16 card-back rounded-lg border border-white/20 shadow-md transform -ml-2`;
                el.innerHTML = `<div class="text-lg text-center mt-3">🐷</div>`;
            }
            container.appendChild(el);
        });
    }

    renderPlayedCard(playerId, card) {
        const slot = document.getElementById(`played-${playerId}`);
        const isManilha = card.rank === this.manilhaRank;
        slot.innerHTML = `
            <div class="w-16 h-24 bg-slate-50 rounded-xl p-2 flex flex-col justify-between border-2 ${isManilha ? 'border-yellow-400' : 'border-slate-300'} shadow-2xl">
                <span class="text-sm font-bold ${card.suit.color}">${card.rank}</span>
                <span class="text-3xl text-center ${card.suit.color}">${card.suit.symbol}</span>
                <span class="text-sm font-bold text-right ${card.suit.color}">${card.rank}</span>
            </div>
        `;
    }

    renderVira() {
        this.els.viraRank.innerText = this.vira.rank;
        this.els.viraRank.className = `text-sm font-bold ${this.vira.suit.color}`;
        this.els.viraSuit.innerText = this.vira.suit.symbol;
        this.els.viraSuit.className = `text-3xl text-center ${this.vira.suit.color}`;
    }

    clearBoard() {
        [0, 1, 2].forEach(i => document.getElementById(`played-${i}`).innerHTML = '');
    }

    log(msg) {
        const div = document.createElement('div');
        div.className = 'py-0.5 border-b border-emerald-900/50 text-xs';
        div.innerText = msg;
        this.els.log.appendChild(div);
        this.els.log.scrollTop = this.els.log.scrollHeight;
    }
}

const engine = new GameEngine();