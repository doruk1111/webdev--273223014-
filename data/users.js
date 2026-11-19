const db = require('../db');

async function findByEmail(email) {
  const { rows } = await db.query('SELECT * FROM users WHERE email = $1', [email]);
  return rows[0];
}

module.exports = {
  findByEmail,
};
