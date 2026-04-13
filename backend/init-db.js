/**
 * VacationSplit — Database Initialization Script
 * Runs during deployment to ensure the schema is applied.
 */

const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

async function init() {
  console.log('🚀 Starting database initialization...');

  // Use Railway environment variables if they exist, otherwise fallback to .env
  const config = {
    host:     process.env.MYSQLHOST || process.env.DB_HOST || 'localhost',
    user:     process.env.MYSQLUSER || process.env.DB_USER || 'root',
    password: process.env.MYSQLPASSWORD || process.env.DB_PASS || '',
    database: process.env.MYSQLDATABASE || process.env.DB_NAME || 'vacation_split',
    port:     process.env.MYSQLPORT || 3306,
    multipleStatements: true
  };

  try {
    // 1. Create connection to server (without DB selected yet, in case it doesn't exist)
    const conn = await mysql.createConnection({
        host: config.host,
        user: config.user,
        password: config.password,
        port: config.port,
        multipleStatements: true
    });

    // 2. Create database if not exists
    console.log(`Checking for database: ${config.database}`);
    await conn.query(`CREATE DATABASE IF NOT EXISTS \`${config.database}\`;`);
    await conn.query(`USE \`${config.database}\`;`);

    // 3. Check if tables already exist (idempotency)
    const [tables] = await conn.query('SHOW TABLES LIKE "trips"');
    if (tables.length > 0) {
      console.log('✅ Database already initialized (found "trips" table). Skipping...');
      await conn.end();
      return;
    }

    // 4. Read and execute schema.sql
    console.log('📄 Reading schema.sql...');
    const schemaPath = path.join(__dirname, 'database', 'schema.sql');
    let schemaSql = fs.readFileSync(schemaPath, 'utf8');

    // Remove comments and split by semicolon to handle large schemas if needed, 
    // but multipleStatements: true handles it.
    console.log('⚒️ Applying schema...');
    await conn.query(schemaSql);

    console.log('🎉 Database initialized successfully!');
    await conn.end();
  } catch (err) {
    console.error('❌ Database initialization failed:', err);
    process.exit(1);
  }
}

init();
