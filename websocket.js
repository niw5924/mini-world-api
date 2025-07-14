const { WebSocketServer } = require('ws');
const admin = require('firebase-admin');

module.exports = function initWebsocket(server) {
  const wss = new WebSocketServer({ server });

  const rooms = new Map(); // { gameId: [ { ws, uid, choice } ] }

  wss.on('connection', (ws, req) => {
    const gameId = req.url.split('/').pop();

    if (!rooms.has(gameId)) rooms.set(gameId, []);

    const players = () => rooms.get(gameId); // ✅ 항상 최신 상태 참조

    ws.on('message', async (raw) => {
      let message;
      try {
        message = JSON.parse(raw);
      } catch {
        ws.send(JSON.stringify({ type: 'error', message: 'Invalid JSON' }));
        return;
      }

      switch (message.type) {
        case 'auth':
          try {
            const decoded = await admin.auth().verifyIdToken(message.firebaseIdToken);
            const uid = decoded.uid;

            if (players().length >= 2) {
              ws.send(JSON.stringify({ type: 'error', message: 'Room full' }));
              ws.close(1008, 'Room full');
              console.log(`[${gameId}] ❌ 입장 거절 - 방 가득참 (uid: ${uid})`);
              return;
            }

            players().push({ ws, uid, choice: null });
            console.log(`[${gameId}] ✅ 입장 완료 (uid: ${uid}) (${players().length}/2)`);
          } catch {
            ws.send(JSON.stringify({ type: 'error', message: 'Invalid ID token' }));
            ws.close(1008, 'Unauthorized');
          }
          break;

        case 'choice':
          const player = players().find((p) => p.ws === ws);
          player.choice = message.data;
          console.log(`[${gameId}] 🎮 선택 수신: ${player.choice} (uid: ${player.uid})`);

          if (players().length === 2 && players().every((p) => p.choice !== null)) {
            const [p1, p2] = players();
            const result = judge(p1.choice, p2.choice);

            console.log(`[${gameId}] ✅ 결과 계산 완료 → ${p1.choice} vs ${p2.choice}`);

            p1.ws.send(
              JSON.stringify({
                type: 'result',
                myChoice: p1.choice,
                opponentChoice: p2.choice,
                outcome: result === 0 ? 'draw' : result === 1 ? 'win' : 'lose',
              })
            );

            p2.ws.send(
              JSON.stringify({
                type: 'result',
                myChoice: p2.choice,
                opponentChoice: p1.choice,
                outcome: result === 0 ? 'draw' : result === -1 ? 'win' : 'lose',
              })
            );
          }
          break;

        default:
          ws.send(JSON.stringify({ type: 'error', message: 'Unknown message type' }));
          break;
      }
    });

    ws.on('close', () => {
      const remaining = players().filter((p) => p.ws !== ws);
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
    if (
      (c1 === '가위' && c2 === '보') ||
      (c1 === '바위' && c2 === '가위') ||
      (c1 === '보' && c2 === '바위')
    )
      return 1;
    return -1;
  }

  console.log('✅ WebSocket server is running');
};
