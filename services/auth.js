
const bcrypt = require('bcrypt');
const { OAuth2Client } = require('google-auth-library');
const usersData = require('../data/users');

const googleClient = new OAuth2Client();

async function login(email, password) {
  const user = await usersData.findByEmail(email);
  if (!user) return null;

  const match = await bcrypt.compare(password, user.password_hash);
  if (!match) return null;

  const { password_hash, ...userWithoutHash } = user;
  return userWithoutHash;
}

async function verifyGoogleToken(credential) {
  const clientId = process.env.GOOGLE_CLIENT_ID;

  if (!clientId) {
    throw new Error('Google sign-in is not configured');
  }

  const ticket = await googleClient.verifyIdToken({
    idToken: credential,
    audience: clientId,
  });

  return ticket.getPayload();
}

async function googleLogin(credential, verifier = verifyGoogleToken) {
  if (!credential) return null;

  const payload = await verifier(credential);

  if (
    !payload ||
    !payload.sub ||
    !payload.email ||
    payload.email_verified !== true
  ) {
    return null;
  }

  const existingUser = await usersData.findByEmail(payload.email);
  if (!existingUser) return null;

  if (
    existingUser.google_id &&
    existingUser.google_id !== payload.sub
  ) {
    return null;
  }

  const linkedUser = await usersData.linkGoogleId(
    payload.email,
    payload.sub
  );

  if (!linkedUser) return null;

  const { password_hash, ...userWithoutHash } = linkedUser;
  return userWithoutHash;
}

module.exports = {
  login,
  googleLogin,
};
