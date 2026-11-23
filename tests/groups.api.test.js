const db = require('../db');
const usersData = require('../data/users');
const { test, before, after } = require('node:test');
const assert = require('node:assert');
const { once } = require('node:events');
const app = require('../server');
const groupsData = require('../data/groups');
const sessionsData = require('../data/sessions');



let server;
let baseUrl;

before(async () => {
  server = app.listen(0);
  await once(server, 'listening');
  baseUrl = `http://127.0.0.1:${server.address().port}`;
});

after(async () => {

  if (server.closeAllConnections) {
    server.closeAllConnections();
  }

  await new Promise((resolve) => server.close(resolve));
});

async function login() {
  const res = await fetch(`${baseUrl}/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: 'student2@example.com',
      password: 'student456',
    }),
  });

  assert.strictEqual(res.status, 200);

  return res.headers.getSetCookie()[0].split(';')[0];
}

test('AC-3: leaving a group removes the membership record', async () => {
  await groupsData.join(1, 2);

  const cookie = await login();

  const res = await fetch(`${baseUrl}/api/groups/1/leave`, {
    method: 'DELETE',
    headers: { Cookie: cookie },
  });

  assert.strictEqual(res.status, 204);

  const isMember = await groupsData.isMember(1, 2);
  assert.strictEqual(isMember, false);
});

test('AC-2: joining a group twice is refused', async () => {
  await groupsData.leave(1, 2);

  const cookie = await login();

  const first = await fetch(`${baseUrl}/api/groups/1/join`, {
    method: 'POST',
    headers: { Cookie: cookie },
  });

  assert.strictEqual(first.status, 201);

  const second = await fetch(`${baseUrl}/api/groups/1/join`, {
    method: 'POST',
    headers: { Cookie: cookie },
  });

  assert.strictEqual(second.status, 409);

  assert.strictEqual(await groupsData.isMember(1, 2), true);
});

test('AC-4: upcoming sessions show only future sessions from joined groups, including their time and place', async () => {
  const cookie = await login();
  const user = await usersData.findByEmail('student2@example.com');

  const wasMember1 = await groupsData.isMember(1, user.id);
  const wasMember2 = await groupsData.isMember(2, user.id);

  const now = Date.now();
  const futureStart = new Date(now + 86400000).toISOString();
  const futureEnd = new Date(now + 90000000).toISOString();
  const pastStart = new Date(now - 172800000).toISOString();
  const pastEnd = new Date(now - 169200000).toISOString();

  const created = [];

  try {
    await groupsData.join(1, user.id);
    await groupsData.leave(2, user.id);

    const joinedFuture = await sessionsData.insert(
      1, user.id, futureStart, futureEnd, 'AC4 Joined Library'
    );
    created.push(joinedFuture.id);

    const joinedPast = await sessionsData.insert(
      1, user.id, pastStart, pastEnd, 'AC4 Past Library'
    );
    created.push(joinedPast.id);

    const otherGroup = await sessionsData.insert(
      2, user.id, futureStart, futureEnd, 'AC4 Other Group Library'
    );
    created.push(otherGroup.id);

    const res = await fetch(`${baseUrl}/api/upcoming-sessions`, {
      headers: { Cookie: cookie },
    });

    assert.strictEqual(res.status, 200);

    const sessions = await res.json();

    assert.ok(sessions.some(s => s.id === joinedFuture.id));

    assert.ok(!sessions.some(s => s.id === joinedPast.id));
    assert.ok(!sessions.some(s => s.id === otherGroup.id));

    const result = sessions.find(s => s.id === joinedFuture.id);

    assert.ok(new Date(result.start_time) > new Date());
    assert.strictEqual(result.place, 'AC4 Joined Library');
    assert.ok(result.group_id === 1);
  } finally {
    for (const id of created) {
      await sessionsData.remove(id);
    }

    if (wasMember1) {
      await groupsData.join(1, user.id);
    } else {
      await groupsData.leave(1, user.id);
    }

    if (wasMember2) {
      await groupsData.join(2, user.id);
    } else {
      await groupsData.leave(2, user.id);
    }
  }
});

test('AC-9: unauthenticated visitor is redirected from groups to login', async () => {
  const res = await fetch(`${baseUrl}/groups`, { redirect: 'manual' });
  assert.strictEqual(res.status, 302);
  assert.strictEqual(res.headers.get('location'), '/login');
});

test('AC-10: signed-in student can see the seeded groups and their courses', async () => {
  const cookie = await login();

  const res = await fetch(`${baseUrl}/api/groups`, {
    headers: { Cookie: cookie },
  });

  assert.strictEqual(res.status, 200);
  const groups = await res.json();

  assert.ok(groups.length >= 3);
  for (const group of groups) {
    assert.ok(group.name);
    assert.ok(group.course);
  }
});

test('AC-11: deleting a group from the database removes it from the group list', async () => {
  const user = await usersData.findByEmail('student@example.com');

  const inserted = await db.query(
    `INSERT INTO groups (name, course, owner_id)
     VALUES ($1, $2, $3) RETURNING id`,
    ['Temporary AC11 Group', 'AC11', user.id]
  );

  const groupId = inserted.rows[0].id;

  try {
    await db.query('DELETE FROM groups WHERE id = $1', [groupId]);

    const groups = await (require('../data/groups')).listAll();
    assert.strictEqual(groups.some((group) => group.id === groupId), false);
  } finally {
    await db.query('DELETE FROM groups WHERE id = $1', [groupId]);
  }
});

test('AC-12: unauthenticated visitor is redirected from homepage to login', async () => {
  const res = await fetch(`${baseUrl}/`, { redirect: 'manual' });
  assert.strictEqual(res.status, 302);
  assert.strictEqual(res.headers.get('location'), '/login');
});