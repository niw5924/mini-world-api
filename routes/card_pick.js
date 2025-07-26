const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const { cardPickRooms } = require('../card_pick_rooms');
const authenticate = require('../middlewares/authenticate');

router.post('/join', authenticate, async (req, res) => {
  try {
    let gameId;

    for (const [id, players] of cardPickRooms.entries()) {
      if (players.length < 2) {
        gameId = id;
        break;
      }
    }

    if (gameId === undefined) {
      gameId = uuidv4();
      cardPickRooms.set(gameId, []);
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
