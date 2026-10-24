# Truco Soldado 🐄

Protótipo hotseat (um dispositivo no centro da mesa) do truco soldado com regras
customizadas do grupo.

## Rodar
Abrir `index.html` no navegador (duplo clique). Sem build, sem dependências.

## Regras implementadas
- 3 jogadores, 3 cartas cada.
- Força: 4♦ (menor) → Gato (maior). Ajustar `forcaDaCarta()` se a ordem do grupo for diferente.
- Rodadas valem 3 / 2 / 1 tento.
- 12 = vitória. 13 = estoura e volta a 0 (conta no "Ranking da Vaca").
- Escura global quando os três estão com o mesmo placar.
- Escura individual quando o jogador está com 11 tentos.
- Em escura, as cartas do jogador aparecem viradas; ele clica numa para virar (às cegas).
- Registro manual de tapas: corte duplo / carta errada.

## Pendências / próximos passos
- Ajustar a ordem de força real das cartas do grupo (naipes inclusos).
- Definir o que acontece em empate de rodada (hoje: ninguém pontua).
- Bordões sorteados nos eventos (zerou, tapa, 12 tentos).
- Multiplayer real (Firebase) se quiserem cada um no seu celular.