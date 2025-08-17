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
 *     description: Firebase 인증 토큰을 통해 확인된 사용자의 purchase_history와 user_item_ownerships 테이블에 구매 내역을 저장합니다.
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
      `
      INSERT INTO purchase_history (uid, product_id, purchase_time)
      VALUES ($1, $2, NOW())
      `,
      [req.uid, productId]
    );

    await pool.query(
      `
      INSERT INTO user_item_ownerships (uid, product_id, quantity, updated_at)
      VALUES ($1, $2, 3, NOW())
      ON CONFLICT (uid, product_id)
      DO UPDATE SET
        quantity = user_item_ownerships.quantity + 3,
        updated_at = NOW()
      `,
      [req.uid, productId]
    );

    res.status(200).json({ success: true, message: 'Purchase successful' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
