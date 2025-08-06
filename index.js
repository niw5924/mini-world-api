const http = require('http');
const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const admin = require('firebase-admin');
const serviceAccount = require('./serviceAccountKey.json');

// Routes
const userRoutes = require('./routes/user');
const recordRoutes = require('./routes/record');
const rpsRoutes = require('./routes/rps');
const cardPickRoutes = require('./routes/card_pick');
const greedyRoutes = require('./routes/greedy');

// WebSocket Router
const initWebSocketRouter = require('./games/websocket_router');

// Swagger
const swaggerUi = require('swagger-ui-express');
const swaggerSpec = require('./swagger');

// 환경 변수 불러오기
dotenv.config();

// Firebase Admin 초기화
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const app = express();

// 미들웨어 설정
app.use(cors());
app.use(express.json());

// Swagger API 문서
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// REST API 라우트
app.use('/api/user', userRoutes);
app.use('/api/record', recordRoutes);
app.use('/api/rps', rpsRoutes);
app.use('/api/card-pick', cardPickRoutes);
app.use('/api/greedy', greedyRoutes);

// HTTP + WebSocket 서버
const server = http.createServer(app);
initWebSocketRouter(server);

// 서버 시작
const PORT = process.env.PORT;
server.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 mini_world_api running on http://0.0.0.0:${PORT}`);
  console.log(`📚 Swagger UI available at http://0.0.0.0:${PORT}/api-docs`);
});
