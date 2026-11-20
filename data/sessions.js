const db = require('../db');

async function insert(groupId, creatorId, startTime, endTime, place) {
  const result = await db.query(
    `INSERT INTO sessions (group_id, creator_id, start_time, end_time, place)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING *`,
    [groupId, creatorId, startTime, endTime, place]
  );
  return result.rows[0];
}

async function listByGroup(groupId) {
  const result = await db.query(
    `SELECT * FROM sessions WHERE group_id = $1 ORDER BY start_time`,
    [groupId]
  );
  return result.rows;
}

async function findById(id) {
  const result = await db.query(
    `SELECT * FROM sessions WHERE id = $1`,
    [id]
  );
  return result.rows[0];
}

async function remove(id) {
  await db.query(
    `DELETE FROM sessions WHERE id = $1`,
    [id]
  );
}

async function findOverlap(groupId, startTime, endTime) {
  const result = await db.query(
    `SELECT * FROM sessions
     WHERE group_id = $1 AND start_time < $3 AND end_time > $2
     LIMIT 1`,
    [groupId, startTime, endTime]
  );
  return result.rows[0];
}

module.exports = {
  insert,
  listByGroup,
  findById,
  remove,
  findOverlap,
};
