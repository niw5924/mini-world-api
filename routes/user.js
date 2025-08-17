const express = require('express');
const router = express.Router();
const pool = require('../db');
const authenticate = require('../middlewares/authenticate');

/**
 * @swagger
 * /api/user/init-info:
 *   post:
 *     summary: 사용자 정보 초기화
 *     tags: [User]
 *     description: Firebase 인증 토큰에서 UID를 추출하여 user_info 테이블에 저장합니다.
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: 사용자 정보 초기화 성공
 *       500:
 *         description: 서버 오류
 */
router.post('/init-info', authenticate, async (req, res) => {
  try {
    await pool.query(
      `
      INSERT INTO user_info (uid, name, email, photo_url)
      VALUES ($1, $2, $3, $4)
      ON CONFLICT (uid) DO NOTHING
      `,
      [req.uid, req.name, req.email, req.photoUrl]
    );

    res.status(200).json({ success: true, message: 'User info initialized' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

/**
 * @swagger
 * /api/user/init-stats:
 *   post:
 *     summary: 사용자 통계 초기화
 *     tags: [User]
 *     description: Firebase 인증 토큰에서 UID를 추출하여 user_stats 테이블에 저장합니다.
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: 사용자 통계 초기화 성공
 *       500:
 *         description: 서버 오류
 */
router.post('/init-stats', authenticate, async (req, res) => {
  try {
    await pool.query(
      `
      INSERT INTO user_stats (uid)
      VALUES ($1)
      ON CONFLICT (uid) DO NOTHING
      `,
      [req.uid]
    );

    res.status(200).json({ success: true, message: 'User stats initialized' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

/**
 * @swagger
 * /api/user/init-items:
 *   post:
 *     summary: 사용자 아이템 초기화
 *     tags: [User]
 *     description: Firebase 인증 토큰에서 UID를 추출하여 user_items 테이블에 저장합니다.
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: 사용자 아이템 초기화 성공
 *       500:
 *         description: 서버 오류
 */
router.post('/init-items', authenticate, async (req, res) => {
  try {
    await pool.query(
      `
      INSERT INTO user_items (uid)
      VALUES ($1)
      ON CONFLICT (uid) DO NOTHING
      `,
      [req.uid]
    );

    res.status(200).json({ success: true, message: 'User items initialized' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

/**
 * @swagger
 * /api/user/me:
 *   get:
 *     summary: 내 통계 조회
 *     tags: [User]
 *     description: Firebase 인증 토큰에서 UID를 추출하여 사용자 통계 정보를 반환합니다.
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: 사용자 정보 반환 성공
 *       404:
 *         description: 사용자를 찾을 수 없음
 *       500:
 *         description: 서버 오류
 */
router.get('/me', authenticate, async (req, res) => {
  try {
    const result = await pool.query(
      `
      SELECT uid, win_count, lose_count, win_streak, rank_point, updated_at
      FROM user_stats
      WHERE uid = $1
      `,
      [req.uid]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    res.json({ success: true, user: result.rows[0] });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

/**
 * @swagger
 * /api/user/delete:
 *   delete:
 *     summary: 내 사용자 데이터 삭제
 *     tags: [User]
 *     description: Firebase 인증 토큰을 통해 확인된 사용자의 user_info, user_stats, user_items, user_game_records 데이터를 모두 삭제합니다. 
 *                  purchase_history는 보존됩니다.
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: 사용자 데이터 삭제 성공
 *       500:
 *         description: 서버 오류
 */
router.delete('/delete', authenticate, async (req, res) => {
  try {
    await pool.query(`DELETE FROM user_info WHERE uid = $1`, [req.uid]);
    await pool.query(`DELETE FROM user_stats WHERE uid = $1`, [req.uid]);
    await pool.query(`DELETE FROM user_items WHERE uid = $1`, [req.uid]);
    await pool.query(`DELETE FROM user_game_records WHERE uid = $1`, [req.uid]);

    res.status(200).json({ success: true, message: `User data deleted for UID: ${req.uid}` });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

/**
 * @swagger
 * /api/user/ranking:
 *   get:
 *     summary: 전체 사용자 랭킹 조회
 *     tags: [User]
 *     description: 모든 사용자의 랭크 포인트를 기준으로 랭킹을 반환합니다.
 *     responses:
 *       200:
 *         description: 사용자 랭킹 반환 성공
 *       500:
 *         description: 서버 오류
 */
router.get('/ranking', async (req, res) => {
  try {
    const result = await pool.query(
      `
      SELECT
          us.uid,
          ui.name,
          ui.photo_url,
          us.rank_point,
          DENSE_RANK() OVER (ORDER BY us.rank_point DESC) AS rank
      FROM user_stats us
      JOIN user_info ui ON us.uid = ui.uid
      ORDER BY us.rank_point DESC
      `
    );

    res.status(200).json({ success: true, ranking: result.rows });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
