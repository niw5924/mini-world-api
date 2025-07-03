const express = require('express');
const router = express.Router();
const admin = require('firebase-admin');
const pool = require('../db');
const serviceAccount = require('../serviceAccountKey.json');

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
});

router.post('/login', async (req, res) => {
    const { idToken } = req.body;

    try {
        const decoded = await admin.auth().verifyIdToken(idToken);
        const { uid, email, name } = decoded;

        await pool.query(
            'INSERT INTO users (uid, email, name) VALUES ($1, $2, $3) ON CONFLICT (uid) DO NOTHING',
            [uid, email, name]
        );

        res.json({ uid, email, name });
    } catch (err) {
        res.status(401).json({ error: 'Invalid token' });
    }
});

module.exports = router;
