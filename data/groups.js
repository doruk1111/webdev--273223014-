const db = require('../db');

async function listAll() {
  const { rows } = await db.query('SELECT name, course FROM groups');
  return rows;
}

async function findById(id) {
  const { rows } = await db.query('SELECT * FROM groups WHERE id = $1', [id]);
  return rows[0];
}

module.exports = {
  findById,
  listAll,
};
