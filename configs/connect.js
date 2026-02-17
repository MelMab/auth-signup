const mysql = require('mysql2');
require('dotenv').config(); // Ensure variables are loaded

const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASS,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
   ssl: {
    rejectUnauthorized: false // Required for Aiven free tier connections
  }
});

module.exports = pool.promise();

