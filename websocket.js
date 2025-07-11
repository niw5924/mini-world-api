const { WebSocketServer } = require('ws');

module.exports = function initWebsocket(server) {
  const wss = new WebSocketServer({ server });

  const rooms = new Map(); // { gameId: [ { ws, choice } ] }

  wss.on('connection', (ws, req) => {
    const [, , gameId] = req.url.split('/');
    if (!gameId) {
      ws.close(1008, 'Missing gameId in URL');
      return;
    }

    if (!rooms.has(gameId)) rooms.set(gameId, []);
    const players = rooms.get(gameId);

    // ✅ 이미 2명이 있으면 거절
    if (players.length >= 2) {
      ws.send(JSON.stringify({ type: 'error', message: 'Room full' }));
      ws.close(1008, 'Room full');
      console.log(`[${gameId}] ❌ 새 연결 거절: 방이 가득 찼습니다`);
      return;
    }

    players.push({ ws, choice: null });
    console.log(`[${gameId}] ➕ 플레이어 입장 (${players.length}/2)`);

    ws.on('message', (raw) => {
      let message;
      try {
        message = JSON.parse(raw);
      } catch {
        ws.send(JSON.stringify({ type: 'error', message: 'Invalid JSON' }));
        return;
      }

      if (message.type === 'choice') {
        const player = players.find((p) => p.ws === ws);
        if (player) player.choice = message.data;

        console.log(`[${gameId}] 🎮 선택 수신: ${message.data}`);

        if (players.length === 2 && players.every((p) => p.choice !== null)) {
          const [p1, p2] = players;
          const result = judge(p1.choice, p2.choice);

          console.log(`[${gameId}] ✅ 결과 계산 완료 → ${p1.choice} vs ${p2.choice}`);

          p1.ws.send(JSON.stringify({
            type: 'result',
            myChoice: p1.choice,
            opponentChoice: p2.choice,
            outcome: result === 0 ? 'draw' : result === 1 ? 'win' : 'lose',
          }));

          p2.ws.send(JSON.stringify({
            type: 'result',
            myChoice: p2.choice,
            opponentChoice: p1.choice,
            outcome: result === 0 ? 'draw' : result === -1 ? 'win' : 'lose',
          }));

          rooms.delete(gameId); // 게임 끝났으면 방 제거
        }
      }
    });

    ws.on('close', () => {
      const remaining = (rooms.get(gameId) || []).filter((p) => p.ws !== ws);
      if (remaining.length === 0) {
        rooms.delete(gameId);
      } else {
        rooms.set(gameId, remaining);
      }
      console.log(`[${gameId}] ➖ 연결 종료, 남은 인원: ${remaining.length}`);
    });
  });

  function judge(c1, c2) {
    if (c1 === c2) return 0;
    if ((c1 === '가위' && c2 === '보') || (c1 === '바위' && c2 === '가위') || (c1 === '보' && c2 === '바위')) {
      return 1;
    }
    return -1;
  }

  console.log('✅ WebSocket server is running');
};
