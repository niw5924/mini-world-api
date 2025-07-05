const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const admin = require('firebase-admin');
const serviceAccount = require('./serviceAccountKey.json');
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/user');
const recordRoutes = require('./routes/record');

dotenv.config();

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
});

const app = express();

app.use(cors());
app.use(express.json());
app.use('/api/auth', authRoutes);
app.use('/api/user', userRoutes);
app.use('/api/record', recordRoutes);

app.listen(process.env.PORT, () => {
    console.log(`🚀 mini_world_api running on http://localhost:${process.env.PORT}`);
});
