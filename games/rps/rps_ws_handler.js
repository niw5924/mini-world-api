const admin = require('firebase-admin');
const { rpsRooms } = require('./rps_rooms');
const pointMap = require('../game_point_map');
const { saveGameResult, updateUserStats } = require('../game_result_repository');

module.exports = function handleRpsConnection(ws, req) {
  const gameId = req.url.split('/').pop();

  const players = () => rpsRooms.get(gameId);

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
          const p1Outcome = result === 0 ? 'draw' : result === 1 ? 'win' : 'lose';
          const p2Outcome = result === 0 ? 'draw' : result === -1 ? 'win' : 'lose';

          const p1Base = pointMap[p1Outcome];
          const p2Base = pointMap[p2Outcome];

          let p1Delta, p2Delta;
          try {
            p1Delta = await useItem(p1.uid, p1Outcome, p1Base);
            p2Delta = await useItem(p2.uid, p2Outcome, p2Base);
          } catch (e) {
            console.error(`[${gameId}] ❌ 아이템 처리 실패:`, e);
            p1Delta = p1Base;
            p2Delta = p2Base;
          }

          p1.ws.send(JSON.stringify({
            type: 'result',
            myChoice: p1.choice,
            opponentChoice: p2.choice,
            outcome: p1Outcome,
            rankPointDelta: p1Delta,
          }));

          p2.ws.send(JSON.stringify({
            type: 'result',
            myChoice: p2.choice,
            opponentChoice: p1.choice,
            outcome: p2Outcome,
            rankPointDelta: p2Delta,
          }));

          try {
            await saveGameResult({
              uid: p1.uid,
              opponentUid: p2.uid,
              gameMode: 'rps',
              pointDelta: p1Delta,
              result: p1Outcome,
            });

            await saveGameResult({
              uid: p2.uid,
              opponentUid: p1.uid,
              gameMode: 'rps',
              pointDelta: p2Delta,
              result: p2Outcome,
            });

            await updateUserStats({
              uid: p1.uid,
              outcome: p1Outcome,
              pointDelta: p1Delta,
            });

            await updateUserStats({
              uid: p2.uid,
              outcome: p2Outcome,
              pointDelta: p2Delta,
            });

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
      rpsRooms.delete(gameId);
    } else {
      rpsRooms.set(gameId, remaining);
      broadcastUsers();
    }
    console.log(`[${gameId}] ➖ 연결 종료, 남은 인원: ${remaining.length}`);
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
};
