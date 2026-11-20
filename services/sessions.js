const groups = require('../data/groups');
const sessions = require('../data/sessions');

async function scheduleSession({ groupId, userId, startTime, endTime, place }) {
  if (!startTime || !endTime || new Date(startTime) >= new Date(endTime)) {
    const err = new Error('End time must be after start time');
    err.name = 'InvalidTime';
    err.status = 422;
    throw err;
  }

  const group = await groups.findById(groupId);
  if (!group) {
    const err = new Error('Group not found');
    err.name = 'NotFound';
    err.status = 404;
    throw err;
  }

  if (group.owner_id !== userId) {
    const err = new Error('User is not the group owner');
    err.name = 'NotOwner';
    err.status = 403;
    throw err;
  }

  const overlap = await sessions.findOverlap(groupId, startTime, endTime);
  if (overlap) {
    const err = new Error(`Session conflicts with ${overlap.place} at ${overlap.start_time}`);
    err.name = 'SessionConflict';
    err.status = 409;
    throw err;
  }

  return await sessions.insert(groupId, userId, startTime, endTime, place);
}

async function cancelSession({ sessionId, userId }) {
  const session = await sessions.findById(sessionId);
  if (!session) {
    const err = new Error('Session not found');
    err.name = 'NotFound';
    err.status = 404;
    throw err;
  }

  if (session.creator_id !== userId) {
    const err = new Error('User is not the session creator');
    err.name = 'NotCreator';
    err.status = 403;
    throw err;
  }

  await sessions.remove(sessionId);
}

module.exports = { scheduleSession, cancelSession };
