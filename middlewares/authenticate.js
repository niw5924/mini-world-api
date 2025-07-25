const admin = require('firebase-admin');

const authenticate = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        const firebaseIdToken = authHeader.split(' ')[1];
        const decoded = await admin.auth().verifyIdToken(firebaseIdToken);
        req.uid = decoded.uid;
        req.name = decoded.name;
        req.email = decoded.email;
        req.photoUrl = decoded.picture;
        next();
    } catch (err) {
        res.status(401).json({ success: false, message: err.message });
    }
};

module.exports = authenticate;
