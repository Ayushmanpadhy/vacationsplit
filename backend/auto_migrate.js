const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

async function migrate() {
    const config = {
        host: process.env.MYSQLHOST || process.env.DB_HOST || 'localhost',
        user: process.env.MYSQLUSER || process.env.DB_USER || 'root',
        password: process.env.MYSQLPASSWORD || process.env.DB_PASS || 'password',
        database: process.env.MYSQLDATABASE || process.env.DB_NAME || 'vacation_split',
        port: process.env.MYSQLPORT || 3306,
        multipleStatements: true
    };

    // If MYSQL_URL is provided, use it
    const connectionString = process.env.MYSQL_URL;
    
    console.log('Connecting to database for migration...');
    const connection = connectionString 
        ? await mysql.createConnection(connectionString + '?multipleStatements=true')
        : await mysql.createConnection(config);

    try {
        const schemaPath = path.join(__dirname, 'database', 'schema.sql');
        const schema = fs.readFileSync(schemaPath, 'utf8');
        
        console.log('Running schema.sql...');
        await connection.query(schema);
        console.log('Migration completed successfully! 🎉');
    } catch (err) {
        console.error('Migration failed:', err);
        process.exit(1);
    } finally {
        await connection.end();
    }
}

migrate();
