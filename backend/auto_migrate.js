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
    let connection;
    try {
        if (connectionString) {
            // Robustly append multipleStatements=true
            const separator = connectionString.includes('?') ? '&' : '?';
            const urlWithParams = connectionString.includes('multipleStatements=true') 
                ? connectionString 
                : `${connectionString}${separator}multipleStatements=true`;
            
            connection = await mysql.createConnection(urlWithParams);
        } else {
            connection = await mysql.createConnection(config);
        }
    } catch (err) {
        console.error('Failed to connect to database:', err.message);
        process.exit(1);
    }

    try {
        const schemaPath = path.join(__dirname, 'database', 'schema.sql');
        if (!fs.existsSync(schemaPath)) {
            throw new Error(`Schema file not found at ${schemaPath}`);
        }
        const schema = fs.readFileSync(schemaPath, 'utf8');
        
        console.log('Running schema.sql migration...');
        await connection.query(schema);
        console.log('Migration completed successfully! 🎉');
    } catch (err) {
        console.error('Migration execution failed:', err.message);
        process.exit(1);
    } finally {
        if (connection) await connection.end();
    }
}

migrate();
