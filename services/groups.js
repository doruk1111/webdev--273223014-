
const groupsData = require('../data/groups');
const sessionsData = require('../data/sessions');

async function list(course) {
  return groupsData.listAll(course);
}

async function join(groupId, userId) {
  const group = await groupsData.findById(groupId);

  if (!group) {
    const err = new Error('Group not found');
    err.status = 404;
    throw err;
  }

  const membership = await groupsData.join(groupId, userId);

  if (!membership) {
    const err = new Error('You are already in this group');
    err.status = 409;
    throw err;
  }

  return membership;
}

async function leave(groupId, userId) {
  const membership = await groupsData.leave(groupId, userId);

  if (!membership) {
    const err = new Error('You are not a member of this group');
    err.status = 404;
    throw err;
  }

  return membership;
}

async function upcomingSessions(userId) {
  return sessionsData.listUpcomingByMember(userId);
}

module.exports = {
  list,
  join,
  leave,
  upcomingSessions,
};
