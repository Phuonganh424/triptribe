// back/db.js
const mysql = require('mysql');

const connection = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: 'payeu7749Federico###',  // ← Ghi đúng mật khẩu ở đây!
  database: 'triptribe'
});


connection.connect((err) => {
  if (err) {
    console.error('❌ Failed to connect to DB:', err.message);
    return;
  }
  console.log('✅ Connected to MySQL database');
});

module.exports = connection;