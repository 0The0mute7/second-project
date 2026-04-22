const jwt = require('jsonwebtoken');

const auth = (req, res, next) => {
    try {
        const token = req.headers.authorization?.split(' ')[1];
        
        if (!token) {
            return res.status(401).json({ error: 'No token provided' });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your_jwt_secret_key');
        req.userId = decoded.userId;
        req.username = decoded.username;
        next();
    } catch (err) {
        res.status(401).json({ error: 'Invalid token', message: err.message });
    }
};

module.exports = auth;
