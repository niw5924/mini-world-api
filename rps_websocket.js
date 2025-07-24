const { WebSocketServer } = require('ws');
const admin = require('firebase-admin');
const { saveGameResult, updateUserStats } = require('./game_result_repository');
const { rpsOpenRooms } = require('./rps_open_rooms_store');

module.exports = function initWebsocket(server) {
  const wss = new WebSocketServer({ server });

  wss.on('connection', (ws, req) => {
    const gameId = req.url.split('/').pop();

    const players = () => rpsOpenRooms.get(gameId);

    const broadcastUsers = () => {
      const list = players().map(p => ({
        uid: p.uid,
        name: p.name,
        photoUrl: p.photoUrl,
      }));
      players().forEach(p =>
        p.ws.send(JSON.stringify({ type: 'joinedUsers', users: list }))
      );
    };

    ws.on('message', async raw => {
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
            const name = decoded.name;
            const photoUrl = decoded.picture;

            if (players().length >= 2) {
              ws.send(JSON.stringify({ type: 'error', message: 'Room full' }));
              ws.close(1008, 'Room full');
              return;
            }

            players().push({ ws, uid, name, photoUrl, choice: null });
            broadcastUsers();
            console.log(`[${gameId}] ✅ 입장 완료 (uid: ${uid}) (${players().length}/2)`);
          } catch {
            ws.send(JSON.stringify({ type: 'error', message: 'Invalid ID token' }));
            ws.close(1008, 'Unauthorized');
          }
          break;

        case 'choice':
          const player = players().find(p => p.ws === ws);
          player.choice = message.data;
          console.log(`[${gameId}] 🎮 선택 수신: ${player.choice} (uid: ${player.uid})`);

          if (players().length === 2 && players().every(p => p.choice !== null)) {
            const [p1, p2] = players();
            const result = judge(p1.choice, p2.choice);
            console.log(`[${gameId}] ✅ 결과 계산 완료 → ${p1.choice} vs ${p2.choice}`);

            const pointMap = { win: 20, lose: -20, draw: 0 };
            const p1Outcome = result === 0 ? 'draw' : result === 1 ? 'win' : 'lose';
            const p2Outcome = result === 0 ? 'draw' : result === -1 ? 'win' : 'lose';

            p1.ws.send(JSON.stringify({
              type: 'result',
              myChoice: p1.choice,
              opponentChoice: p2.choice,
              outcome: p1Outcome,
              rankPointDelta: pointMap[p1Outcome],
            }));

            p2.ws.send(JSON.stringify({
              type: 'result',
              myChoice: p2.choice,
              opponentChoice: p1.choice,
              outcome: p2Outcome,
              rankPointDelta: pointMap[p2Outcome],
            }));

            try {
              await saveGameResult({
                uid: p1.uid,
                opponentUid: p2.uid,
                gameMode: 'rps',
                pointDelta: pointMap[p1Outcome],
                result: p1Outcome,
              });

              await saveGameResult({
                uid: p2.uid,
                opponentUid: p1.uid,
                gameMode: 'rps',
                pointDelta: pointMap[p2Outcome],
                result: p2Outcome,
              });

              await updateUserStats(p1.uid, p1Outcome, pointMap[p1Outcome]);
              await updateUserStats(p2.uid, p2Outcome, pointMap[p2Outcome]);

              console.log(`[${gameId}] 📝 게임 결과 및 스탯 저장 완료`);
            } catch (err) {
              console.error(`[${gameId}] ❌ 게임 결과 저장 실패:`, err);
            }
          }
          break;

        default:
          ws.send(JSON.stringify({ type: 'error', message: 'Unknown message type' }));
          break;
      }
    });

    ws.on('close', () => {
      const remaining = players().filter(p => p.ws !== ws);
      if (remaining.length === 0) {
        rpsOpenRooms.delete(gameId);
      } else {
        rpsOpenRooms.set(gameId, remaining);
        broadcastUsers();
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
    ) return 1;
    return -1;
  }

  console.log('✅ WebSocket server is running');
};
