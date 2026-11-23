const crypto = require('node:crypto');
const signature = require('cookie-signature');
const db = require('../db');

async function main() {
  const sessionId = crypto.randomBytes(24).toString('hex');

  const { rows } = await db.query(
    'SELECT id, email FROM users WHERE id = $1',
    [1]
  );

  if (!rows[0]) throw new Error('Test user not found');

  const sess = {
    cookie: { path: '/', httpOnly: true },
    user: rows[0]
  };

  await db.query(
    `INSERT INTO "session" (sid, sess, expire)
     VALUES ($1, $2, NOW() + INTERVAL '1 day')`,
    [sessionId, JSON.stringify(sess)]
  );

  const token = 's:' + signature.sign(
    sessionId,
    process.env.SESSION_SECRET
  );

  console.log(token);
  process.exit(0);
}

main().catch(err => {
  console.error(err.message);
  process.exit(1);
});