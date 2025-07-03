const express = require('express');
const router = express.Router();
const admin = require('firebase-admin');
const pool = require('../db');
const serviceAccount = require('../serviceAccountKey.json');

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
});

router.post('/login', async (req, res) => {
    const { firebaseIdToken } = req.body;

    try {
        const decoded = await admin.auth().verifyIdToken(firebaseIdToken);
        const { uid, email, name } = decoded;

        await pool.query(
            'INSERT INTO users (uid, email, name) VALUES ($1, $2, $3) ON CONFLICT (uid) DO NOTHING',
            [uid, email, name]
        );

        res.status(200).json({
            success: true,
            message: 'Login success'
        });
    } catch (err) {
        res.status(401).json({
            success: false,
            message: err.message
        });
    }
});

module.exports = router;
