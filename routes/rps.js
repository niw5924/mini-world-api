const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const { rpsRooms } = require('../games/rps/rps_rooms');
const authenticate = require('../middlewares/authenticate');

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
