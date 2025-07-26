const http = require('http');
const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const admin = require('firebase-admin');
const serviceAccount = require('./serviceAccountKey.json');

const userRoutes = require('./routes/user');
const recordRoutes = require('./routes/record');
const rpsRoutes = require('./routes/rps');
const cardPickRoutes = require('./routes/card_pick');

const initWebSocketRouter = require('./websocket_router');

dotenv.config();

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const app = express();

app.use(cors());
app.use(express.json());

app.use('/api/user', userRoutes);
app.use('/api/record', recordRoutes);
app.use('/api/rps', rpsRoutes);
app.use('/api/card-pick', cardPickRoutes);

const server = http.createServer(app);

initWebSocketRouter(server);

const PORT = process.env.PORT;
server.listen(PORT, () => {
  console.log(`🚀 mini_world_api running on http://localhost:${PORT}`);
});
