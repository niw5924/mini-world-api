const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const { rpsRooms } = require('../games/rps/rps_rooms');
const authenticate = require('../middlewares/authenticate');

/**
 * @swagger
 * /api/rps/join:
 *   post:
 *     summary: RPS 게임 방 참가
 *     tags: [RPS]
 *     description: Firebase 인증 토큰을 이용해 RPS 게임 방에 참가합니다. 빈 방이 없으면 새로 생성합니다.
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: 참가 성공 및 gameId 반환
 *       500:
 *         description: 서버 오류
 */
router.post('/join', authenticate, async (req, res) => {
  try {
    let gameId;

    for (const [id, players] of rpsRooms.entries()) {
      if (players.length < 2) {
        gameId = id;
        break;
      }
    }

    if (gameId === undefined) {
      gameId = uuidv4();
      rpsRooms.set(gameId, []);
    }

    return res.json({
      success: true,
      gameId: gameId,
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: err.message,
    });
  }
});

module.exports = router;
