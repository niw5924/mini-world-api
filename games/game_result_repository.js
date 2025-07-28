const pool = require('../db');

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

async function updateUserStats({ uid, outcome, pointDelta }) {
  const query = `
    UPDATE user_stats
    SET
      rank_point = rank_point + $1,
      win_count = win_count + CASE WHEN $2 = 'win' THEN 1 ELSE 0 END,
      lose_count = lose_count + CASE WHEN $2 = 'lose' THEN 1 ELSE 0 END,
      win_streak = CASE
        WHEN $2 = 'win' THEN win_streak + 1
        WHEN $2 = 'lose' THEN 0
        ELSE win_streak
      END,
      updated_at = CURRENT_TIMESTAMP
    WHERE uid = $3
  `;

  const values = [pointDelta, outcome, uid];
  await pool.query(query, values);
}

module.exports = {
  saveGameResult,
  updateUserStats,
};
