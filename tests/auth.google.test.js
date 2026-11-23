const { test } = require('node:test');
const assert = require('node:assert/strict');
const db = require('../db');
const authService = require('../services/auth');

test('AC-7: Google sign-in links an existing account without creating a duplicate', async () => {
  const email = 'ac7-google-test@example.com';
  const googleId = 'google-subject-ac7-test';

  await db.query('DELETE FROM users WHERE email = $1', [email]);

  const inserted = await db.query(
    `INSERT INTO users (email, password_hash)
     VALUES ($1, $2)
     RETURNING id`,
    [email, 'test-password-hash']
  );

  const originalUserId = inserted.rows[0].id;

  try {
    const before = await db.query(
      'SELECT COUNT(*)::int AS count FROM users'
    );

    const user = await authService.googleLogin(
      'fake-test-credential',
      async (credential) => {
        assert.equal(credential, 'fake-test-credential');

        return {
          sub: googleId,
          email,
          email_verified: true,
        };
      }
    );

    assert.ok(user);
    assert.equal(user.id, originalUserId);
    assert.equal(user.email, email);
    assert.equal(user.google_id, googleId);
    assert.equal(user.password_hash, undefined);

    const after = await db.query(
      'SELECT COUNT(*)::int AS count FROM users'
    );

    assert.equal(after.rows[0].count, before.rows[0].count);

    const linked = await db.query(
      'SELECT google_id FROM users WHERE id = $1',
      [originalUserId]
    );

    assert.equal(linked.rows[0].google_id, googleId);
  } finally {
    await db.query('DELETE FROM users WHERE id = $1', [originalUserId]);
  }
});
