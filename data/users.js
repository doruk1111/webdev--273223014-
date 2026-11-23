
const db = require('../db');

async function findByEmail(email) {
  const { rows } = await db.query(
    'SELECT * FROM users WHERE LOWER(email) = LOWER($1)',
    [email]
  );
  return rows[0];
}

async function linkGoogleId(email, googleId) {
  const { rows } = await db.query(
    `UPDATE users
     SET google_id = $2
     WHERE LOWER(email) = LOWER($1)
       AND (google_id IS NULL OR google_id = $2)
     RETURNING *`,
    [email, googleId]
  );

  return rows[0] || null;
}

module.exports = {
  findByEmail,
  linkGoogleId,
};
