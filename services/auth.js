const bcrypt = require('bcrypt');
const usersData = require('../data/users');

async function login(email, password) {
  const user = await usersData.findByEmail(email);
  if (!user) return null;

  const match = await bcrypt.compare(password, user.password_hash);
  if (!match) return null;

  const { password_hash, ...userWithoutHash } = user;
  return userWithoutHash;
}

module.exports = {
  login,
};
