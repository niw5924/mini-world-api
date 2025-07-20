const pool = require('./db');

async function saveGameResult({ uid, opponentUid, gameMode, pointDelta, result }) {
  const query = `
    INSERT INTO user_game_records (
      uid,
      opponent_uid,
      game_mode,
      rank_point_delta,
      result
    ) VALUES ($1, $2, $3, $4, $5)
  `;

  const values = [uid, opponentUid, gameMode, pointDelta, result];
  await pool.query(query, values);
}

module.exports = {
  saveGameResult,
};
