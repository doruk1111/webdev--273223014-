const { test, before, after, afterEach } = require('node:test');
const assert = require('node:assert');
const { once } = require('node:events');
const app = require('../server');
const sessionsData = require('../data/sessions');

let server;
let baseUrl;
const created = [];

before(async () => {
  server = app.listen(0);
  await once(server, 'listening');
  baseUrl = `http://127.0.0.1:${server.address().port}`;
});

after(async () => {
  if (server.closeAllConnections) server.closeAllConnections();
  await new Promise((resolve) => server.close(resolve));
});

// Every row a test creates is removed afterwards, even when the test fails.
afterEach(async () => {
  for (const id of created.splice(0)) {
    await sessionsData.remove(id);
  }
});

async function login(email, password) {
  const res = await fetch(`${baseUrl}/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  assert.strictEqual(res.status, 200, `login as ${email} failed with ${res.status}`);
  const setCookie = res.headers.getSetCookie();
  assert.ok(setCookie.length > 0, 'login returned no session cookie');
  return setCookie[0].split(';')[0];
}

function loginUser1() {
  return login('student@example.com', 'student123');
}

function loginUser2() {
  return login('student2@example.com', 'student456');
}

async function schedule(cookie, groupId, startTime, endTime, place) {
  const headers = { 'Content-Type': 'application/json' };
  if (cookie) headers.Cookie = cookie;
  const res = await fetch(`${baseUrl}/api/groups/${groupId}/sessions`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ startTime, endTime, place }),
  });
  let body = null;
  try {
    body = await res.json();
  } catch (e) {
    body = null;
  }
  if (res.status === 201 && body && body.id) created.push(body.id);
  return { res, body };
}

async function cancel(cookie, sessionId) {
  const headers = {};
  if (cookie) headers.Cookie = cookie;
  return fetch(`${baseUrl}/api/sessions/${sessionId}`, { method: 'DELETE', headers });
}

async function list(cookie, groupId) {
  const res = await fetch(`${baseUrl}/api/groups/${groupId}/sessions`, {
    headers: { Cookie: cookie },
  });
  assert.strictEqual(res.status, 200);
  return res.json();
}

async function count(groupId) {
  return (await sessionsData.listByGroup(groupId)).length;
}

test('AC-13: end equal to start gets 422, and the group has no new row', async () => {
  const cookie = await loginUser1();
  const before = await count(3);
  const { res } = await schedule(cookie, 3, '2027-02-01T10:00:00Z', '2027-02-01T10:00:00Z', 'Room 2027-AC13');
  assert.strictEqual(res.status, 422);
  assert.strictEqual(await count(3), before);
});

test('AC-14: an overlapping session in the same group gets 409, and no row is added', async () => {
  const cookie = await loginUser1();
  const first = await schedule(cookie, 3, '2027-02-02T10:00:00Z', '2027-02-02T12:00:00Z', 'Room 2027-AC14-1');
  assert.strictEqual(first.res.status, 201);
  const before = await count(3);
  const second = await schedule(cookie, 3, '2027-02-02T11:00:00Z', '2027-02-02T13:00:00Z', 'Room 2027-AC14-2');
  assert.strictEqual(second.res.status, 409);
  assert.strictEqual(await count(3), before);
  const sessions = await list(cookie, 3);
  assert.strictEqual(sessions.filter((s) => s.place === 'Room 2027-AC14-2').length, 0);
});

test('AC-15: a session that starts exactly when another in the same group ends gets 201', async () => {
  const cookie = await loginUser1();
  const first = await schedule(cookie, 3, '2027-02-03T10:00:00Z', '2027-02-03T11:00:00Z', 'Room 2027-AC15-1');
  assert.strictEqual(first.res.status, 201);
  const second = await schedule(cookie, 3, '2027-02-03T11:00:00Z', '2027-02-03T12:00:00Z', 'Room 2027-AC15-2');
  assert.strictEqual(second.res.status, 201);
});

test('AC-16: the same time in a different group gets 201', async () => {
  const cookie = await loginUser1();
  const first = await schedule(cookie, 3, '2027-02-04T10:00:00Z', '2027-02-04T11:00:00Z', 'Room 2027-AC16-1');
  assert.strictEqual(first.res.status, 201);
  const second = await schedule(cookie, 2, '2027-02-04T10:00:00Z', '2027-02-04T11:00:00Z', 'Room 2027-AC16-2');
  assert.strictEqual(second.res.status, 201);
});

test('AC-17: the creator sends DELETE and gets 204, the row is gone from GET, and the same time can be scheduled again with 201', async () => {
  const cookie = await loginUser1();
  const first = await schedule(cookie, 3, '2027-02-05T10:00:00Z', '2027-02-05T11:00:00Z', 'Room 2027-AC17-1');
  assert.strictEqual(first.res.status, 201);
  const id = first.body.id;
  const delRes = await cancel(cookie, id);
  assert.strictEqual(delRes.status, 204);
  const sessions = await list(cookie, 3);
  assert.strictEqual(sessions.find((s) => s.id === id), undefined);
  const again = await schedule(cookie, 3, '2027-02-05T10:00:00Z', '2027-02-05T11:00:00Z', 'Room 2027-AC17-2');
  assert.strictEqual(again.res.status, 201);
});

test('AC-18: user 2 sends DELETE for a session of user 1 and gets 403, and the session is still in GET', async () => {
  const cookie1 = await loginUser1();
  const cookie2 = await loginUser2();
  const first = await schedule(cookie1, 3, '2027-02-06T10:00:00Z', '2027-02-06T11:00:00Z', 'Room 2027-AC18');
  assert.strictEqual(first.res.status, 201);
  const id = first.body.id;
  const delRes = await cancel(cookie2, id);
  assert.strictEqual(delRes.status, 403);
  const sessions = await list(cookie1, 3);
  assert.ok(sessions.find((s) => s.id === id));
});

test('AC-6: user 2 scheduling in group 1 gets 403, and no row is added', async () => {
  const cookie2 = await loginUser2();
  const before = await count(1);
  const { res } = await schedule(cookie2, 1, '2027-02-07T10:00:00Z', '2027-02-07T11:00:00Z', 'Room 2027-AC6');
  assert.strictEqual(res.status, 403);
  assert.strictEqual(await count(1), before);
});

test('AC-19: POST and DELETE with no cookie get 401, and the group session count is unchanged', async () => {
  const cookie = await loginUser1();
  const first = await schedule(cookie, 3, '2027-02-08T10:00:00Z', '2027-02-08T11:00:00Z', 'Room 2027-AC19-1');
  assert.strictEqual(first.res.status, 201);
  const before = await count(3);

  const post = await schedule(null, 3, '2027-02-08T14:00:00Z', '2027-02-08T15:00:00Z', 'Room 2027-AC19-2');
  assert.strictEqual(post.res.status, 401);

  const del = await cancel(null, first.body.id);
  assert.strictEqual(del.status, 401);

  assert.strictEqual(await count(3), before);
});

test('AC-20: 404 for POST to a group that does not exist', async () => {
  const cookie = await loginUser1();
  const { res } = await schedule(cookie, 999999, '2027-02-09T10:00:00Z', '2027-02-09T11:00:00Z', 'Room 2027-AC20');
  assert.strictEqual(res.status, 404);
});

test('AC-21: 404 for DELETE of a session that does not exist', async () => {
  const cookie = await loginUser1();
  const res = await cancel(cookie, 999999);
  assert.strictEqual(res.status, 404);
});

test('AC-5: group owner creates a session and it appears in the group list', async () => {
  const cookie = await loginUser1();
  const before = await count(1);

  const result = await schedule(
    cookie, 1,
    '2030-02-10T10:00:00Z',
    '2030-02-10T11:00:00Z',
    'Library AC5'
  );

  assert.strictEqual(result.res.status, 201);
  assert.strictEqual(result.body.place, 'Library AC5');
  assert.strictEqual(await count(1), before + 1);

  const sessions = await list(cookie, 1);
  assert.ok(sessions.some((s) => s.id === result.body.id));
});