
const signature = require('cookie-signature');
const db = require('../db');

async function getMcpUser() {
  const token = process.env.MCP_TOKEN;
  const secret = process.env.SESSION_SECRET;

  if (!token || !secret) {
    throw new Error('MCP authentication is not configured');
  }

  // Express session cookies have the format: s:sessionId.signature
  if (!token.startsWith('s:')) {
    throw new Error('Invalid MCP token');
  }

  const sessionId = signature.unsign(token.slice(2), secret);

  if (!sessionId) {
    throw new Error('Invalid MCP token signature');
  }

  const { rows } = await db.query(
    `SELECT sess FROM "session"
     WHERE sid = $1 AND expire > NOW()`,
    [sessionId]
  );

  const user = rows[0]?.sess?.user;

  if (!user || !user.id) {
    throw new Error('MCP session is expired or has no signed-in user');
  }

  return user;
}

module.exports = { getMcpUser };
