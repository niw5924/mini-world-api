const pool = require('../db');

async function useItem(uid, outcome, baseDelta) {
  if (outcome === 'win') {
    const updateResult = await pool.query(
      `UPDATE user_items
         SET win_bonus_3 = win_bonus_3 - 1
       WHERE uid = $1 AND win_bonus_3 > 0
       RETURNING 1`,
      [uid]
    );
    return updateResult.rowCount > 0 ? baseDelta * 2 : baseDelta;
  }

  if (outcome === 'lose') {
    const updateResult = await pool.query(
      `UPDATE user_items
         SET lose_protection_3 = lose_protection_3 - 1
       WHERE uid = $1 AND lose_protection_3 > 0
       RETURNING 1`,
      [uid]
    );
    return updateResult.rowCount > 0 ? 0 : baseDelta;
  }

  return baseDelta;
}

module.exports = { useItem };
