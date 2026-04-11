const express = require('express');
const mysql = require('mysql2/promise');
const cors = require('cors');
const bodyParser = require('body-parser');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(bodyParser.json());

// Database connection pool
const dbConfig = {
    host: process.env.MYSQLHOST || process.env.DB_HOST || 'localhost',
    user: process.env.MYSQLUSER || process.env.DB_USER || 'root',
    password: process.env.MYSQLPASSWORD || process.env.DB_PASS || 'password',
    database: process.env.MYSQLDATABASE || process.env.DB_NAME || 'vacation_split',
    port: process.env.MYSQLPORT || 3306,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
};

const pool = process.env.MYSQL_URL 
    ? mysql.createPool(process.env.MYSQL_URL)
    : mysql.createPool(dbConfig);

// Helper for query execution
app.locals.pool = pool;

// Serve static files from the Angular app
const frontendPath = path.join(__dirname, '..', 'frontend', 'dist', 'frontend', 'browser');
if (fs.existsSync(frontendPath)) {
    app.use(express.static(frontendPath));
}

// Routes
const tripRoutes = require('./routes/trips');
const memberRoutes = require('./routes/members');
const expenseRoutes = require('./routes/expenses');
const activityRoutes = require('./routes/activity');
const balanceRoutes = require('./routes/balances');

app.use('/api/trips', tripRoutes);
app.use('/api/members', memberRoutes);
app.use('/api/expenses', expenseRoutes);
app.use('/api/activity', activityRoutes);
app.use('/api/balances', balanceRoutes);

// Catch-all for Angular routing
if (fs.existsSync(frontendPath)) {
    app.get('*', (req, res) => {
        if (!req.path.startsWith('/api')) {
            res.sendFile(path.join(frontendPath, 'index.html'));
        }
    });
}

app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', environment: process.env.NODE_ENV || 'development' });
});

app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});
