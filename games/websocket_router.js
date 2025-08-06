const { WebSocketServer } = require('ws');
const handleRpsConnection = require('./rps/rps_ws_handler');
const handleCardPickConnection = require('./card_pick/card_pick_ws_handler');
const handleGreedyConnection = require('./greedy/greedy_ws_handler');

module.exports = function initWebSocketRouter(server) {
  const wss = new WebSocketServer({ server });

  wss.on('connection', (ws, req) => {
    const url = req.url;

    switch (true) {
      case url.startsWith('/rps/'):
        handleRpsConnection(ws, req);
        break;

      case url.startsWith('/card-pick/'):
        handleCardPickConnection(ws, req);
        break;

      case url.startsWith('/greedy/'):
        handleGreedyConnection(ws, req);
        break;

      default:
        ws.close(1008, 'Unknown game route');
        break;
    }
  });

  console.log('✅ WebSocket router initialized');
};
