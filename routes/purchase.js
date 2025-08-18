const express = require('express');
const router = express.Router();
const pool = require('../db');
const authenticate = require('../middlewares/authenticate');

/**
 * @swagger
 * /api/purchase:
 *   post:
 *     summary: 아이템 구매
 *     tags: [Purchase]
 *     description: Firebase 인증 토큰에서 UID를 추출하여 user_purchase_history와 user_items 테이블에 저장합니다.
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: 구매 성공
 *       500:
 *         description: 서버 오류
 */
router.post('/', authenticate, async (req, res) => {
  const { productId } = req.body;

  try {
    await pool.query(
      `INSERT INTO user_purchase_history (uid, product_id) VALUES ($1, $2)`,
      [req.uid, productId]
    );

    await pool.query(
      `UPDATE user_items SET ${productId} = ${productId} + 3 WHERE uid = $1`,
      [req.uid]
    );

    res.status(200).json({ success: true, message: 'Purchase successful' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
