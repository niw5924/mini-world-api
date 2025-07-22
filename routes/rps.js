const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const { rpsOpenRooms } = require('../rps_open_rooms_store');
const authenticate = require('../middlewares/authenticate');

router.post('/join', authenticate, async (req, res) => {
  try {
    let gameId = null;

    for (const [id, uids] of rpsOpenRooms.entries()) {
      if (uids.length < 2) {
        gameId = id;
        uids.push(req.uid);
        break;
      }
    }

    if (!gameId) {
      gameId = uuidv4();
      rpsOpenRooms.set(gameId, [req.uid]);
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
