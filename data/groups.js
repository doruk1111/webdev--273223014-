const db = require('../db');

async function listAll() {
  const { rows } = await db.query('SELECT name, course FROM groups');
  return rows;
}

module.exports = {
  listAll,
};
