const mysql = require('mysql2');

const pool = mysql.createPool({
  host: 'localhost',
  user: 'root',
  password: 'Apple@12345',
  database: 'twitter_scraper',
  waitForConnections: true,
  connectionLimit: 10,  // Adjust based on your needs
  queueLimit: 0
});

// Get a connection from the pool and check the connection
pool.getConnection((err, connection) => {
  if (err) {
    console.error('Error connecting to the database:', err);
    return;
  }

  console.log('Connected to the database');

  // Query to check if data exists in a specific table
  connection.query('SELECT * FROM tweets LIMIT 10', (queryErr, results) => {
    if (queryErr) {
      console.error('Error executing query:', queryErr);
      connection.release();  // Release connection in case of error
      return;
    }

    if (results.length === 0) {
      console.log('No data found in the table');
    } else {
      console.log('Data from table:', results);
    }

    // Always release the connection after use
    connection.release();
  });
});
