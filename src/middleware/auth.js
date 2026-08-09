const jwt = require('jsonwebtoken');
const SECRET_KEY = process.env.JWT_SECRET || 'super_secret_jwt_key_for_development';

const verifyToken = (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ message: 'Token no proporcionado o inválido' });
    }

    const token = authHeader.split(' ')[1];
    jwt.verify(token, SECRET_KEY, (err, decoded) => {
        if (err) {
            return res.status(403).json({ message: 'Token expirado o inválido' });
        }
        req.user = decoded; // Contiene { id, email, rol }
        next();
    });
};

const requireRole = (role) => {
    return (req, res, next) => {
        if (!req.user || req.user.rol !== role) {
            return res.status(403).json({ message: `Acceso denegado: Se requiere rol de ${role}` });
        }
        next();
    };
};

module.exports = { verifyToken, requireRole, SECRET_KEY };
