import mysql from 'mysql2/promise';

const db = mysql.createPool({
  host: 'localhost',
  user: 'lakshay',
  password: 'apple@12345',
  database: 'twitter_data',
});

export default db;
