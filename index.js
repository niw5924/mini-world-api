const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/user');

dotenv.config();
const app = express();

app.use(cors());
app.use(express.json());
app.use('/api/auth', authRoutes);
app.use('/api/user', userRoutes);

app.listen(process.env.PORT, () => {
    console.log(`🚀 mini_world_api running on http://localhost:${process.env.PORT}`);
});
