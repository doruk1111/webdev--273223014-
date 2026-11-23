
const db = require('../db');

async function listAll(course) {
  const { rows } = await db.query(
    `SELECT g.id, g.name, g.course, g.owner_id,
            COUNT(gm.user_id)::int AS member_count
     FROM groups g
     LEFT JOIN group_memberships gm ON gm.group_id = g.id
     WHERE ($1::text IS NULL OR g.course = $1)
     GROUP BY g.id
     ORDER BY g.id`,
    [course || null]
  );
  return rows;
}

async function listByMember(userId) {
  const { rows } = await db.query(
    `SELECT g.*
     FROM groups g
     JOIN group_memberships gm ON gm.group_id = g.id
     WHERE gm.user_id = $1
     ORDER BY g.id`,
    [userId]
  );
  return rows;
}

async function findById(id) {
  const { rows } = await db.query(
    'SELECT * FROM groups WHERE id = $1',
    [id]
  );
  return rows[0];
}

async function join(groupId, userId) {
  const { rows } = await db.query(
    `INSERT INTO group_memberships (group_id, user_id)
     VALUES ($1, $2)
     ON CONFLICT (group_id, user_id) DO NOTHING
     RETURNING *`,
    [groupId, userId]
  );
  return rows[0];
}

async function leave(groupId, userId) {
  const { rows } = await db.query(
    `DELETE FROM group_memberships
     WHERE group_id = $1 AND user_id = $2
     RETURNING *`,
    [groupId, userId]
  );
  return rows[0];
}

async function isMember(groupId, userId) {
  const { rows } = await db.query(
    `SELECT 1 FROM group_memberships
     WHERE group_id = $1 AND user_id = $2`,
    [groupId, userId]
  );
  return rows.length > 0;
}

module.exports = {
  findById,
  listAll,
  listByMember,
  join,
  leave,
  isMember,
};
