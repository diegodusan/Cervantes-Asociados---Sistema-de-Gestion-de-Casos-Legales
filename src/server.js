const express = require('express');
const path = require('path');
const authRoutes = require('./routes/authRoutes');
const clienteRoutes = require('./routes/clienteRoutes');
const casoRoutes = require('./routes/casoRoutes');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

// Servir frontend desde carpeta public
app.use(express.static(path.join(__dirname, '../public')));

// Rutas de API
app.use('/api/auth', authRoutes);
app.use('/api/clientes', clienteRoutes);
app.use('/api/casos', casoRoutes);

// Fallback al frontend (común en SPAs, o para evitar errores de ruteo)
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../public/index.html'));
});

// Evitar iniciar el servidor al ejecutar los tests de Jest
if (require.main === module) {
    app.listen(PORT, () => {
        console.log(`Servidor corriendo en el puerto ${PORT}`);
    });
}

module.exports = app;
