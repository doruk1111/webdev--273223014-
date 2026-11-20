const test = require('node:test');
const assert = require('node:assert');
const app = require('../server');
const sessionsData = require('../data/sessions');

let server;
let baseUrl;

test.before(async () => {
  await new Promise((resolve) => {
    server = app.listen(0, resolve);
  });
  baseUrl = `http://127.0.0.1:${server.address().port}`;
});

test.after(async () => {
  await new Promise((resolve) => {
    server.close(resolve);
  });
});

async function login(email, password) {
  const res = await fetch(`${baseUrl}/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  const setCookie = res.headers.get('set-cookie');
  if (!setCookie) return '';
  return setCookie.split(';')[0];
}

test('AC-13: end equal to start gets 422, and the group has no new row', async () => {
  const cookie = await login('student@example.com', 'student123');
  const groupId = 1;

  const getResBefore = await fetch(`${baseUrl}/api/groups/${groupId}/sessions`);
  const sessionsBefore = await getResBefore.json();
  const countBefore = sessionsBefore.length;

  const res = await fetch(`${baseUrl}/api/groups/${groupId}/sessions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Cookie: cookie,
    },
    body: JSON.stringify({
      startTime: '2027-01-01T10:00:00Z',
      endTime: '2027-01-01T10:00:00Z',
      place: 'Room 2027-AC13',
    }),
  });

  assert.strictEqual(res.status, 422);

  const getResAfter = await fetch(`${baseUrl}/api/groups/${groupId}/sessions`);
  const sessionsAfter = await getResAfter.json();
  assert.strictEqual(sessionsAfter.length, countBefore);
});

test('AC-14: an overlapping session in the same group gets 409, and no row is added', async () => {
  const cookie = await login('student@example.com', 'student123');
  const groupId = 1;

  const res1 = await fetch(`${baseUrl}/api/groups/${groupId}/sessions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Cookie: cookie,
    },
    body: JSON.stringify({
      startTime: '2027-02-01T10:00:00Z',
      endTime: '2027-02-01T12:00:00Z',
      place: 'Room 2027-AC14-1',
    }),
  });
  const created1 = await res1.json();
  const createdId = created1.id;

  try {
    const res2 = await fetch(`${baseUrl}/api/groups/${groupId}/sessions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Cookie: cookie,
      },
      body: JSON.stringify({
        startTime: '2027-02-01T11:00:00Z',
        endTime: '2027-02-01T13:00:00Z',
        place: 'Room 2027-AC14-2',
      }),
    });

    assert.strictEqual(res2.status, 409);

    const getRes = await fetch(`${baseUrl}/api/groups/${groupId}/sessions`);
    const sessionsList = await getRes.json();
    const overlappingCreated = sessionsList.filter((s) => s.place === 'Room 2027-AC14-2');
    assert.strictEqual(overlappingCreated.length, 0);
  } finally {
    if (createdId) {
      await sessionsData.remove(createdId);
    }
  }
});

test('AC-6: user 2 scheduling in group 1 gets 403, and no row is added', async () => {
  const cookie2 = await login('student2@example.com', 'student456');
  const groupId = 1;

  const getResBefore = await fetch(`${baseUrl}/api/groups/${groupId}/sessions`);
  const sessionsBefore = await getResBefore.json();
  const countBefore = sessionsBefore.length;

  const res = await fetch(`${baseUrl}/api/groups/${groupId}/sessions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Cookie: cookie2,
    },
    body: JSON.stringify({
      startTime: '2027-03-01T10:00:00Z',
      endTime: '2027-03-01T11:00:00Z',
      place: 'Room 2027-AC6',
    }),
  });

  assert.strictEqual(res.status, 403);

  const getResAfter = await fetch(`${baseUrl}/api/groups/${groupId}/sessions`);
  const sessionsAfter = await getResAfter.json();
  assert.strictEqual(sessionsAfter.length, countBefore);
});

test('AC-19: POST and DELETE with no cookie get 401, and the group session count is unchanged', async () => {
  const cookie = await login('student@example.com', 'student123');
  const groupId = 1;

  const createRes = await fetch(`${baseUrl}/api/groups/${groupId}/sessions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Cookie: cookie,
    },
    body: JSON.stringify({
      startTime: '2027-04-01T10:00:00Z',
      endTime: '2027-04-01T11:00:00Z',
      place: 'Room 2027-AC19',
    }),
  });
  const session = await createRes.json();
  const sessionId = session.id;

  try {
    const postRes = await fetch(`${baseUrl}/api/groups/${groupId}/sessions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        startTime: '2027-04-02T10:00:00Z',
        endTime: '2027-04-02T11:00:00Z',
        place: 'Room 2027-AC19-nocookie',
      }),
    });
    assert.strictEqual(postRes.status, 401);

    const deleteRes = await fetch(`${baseUrl}/api/sessions/${sessionId}`, {
      method: 'DELETE',
    });
    assert.strictEqual(deleteRes.status, 401);
  } finally {
    if (sessionId) {
      await sessionsData.remove(sessionId);
    }
  }
});

test('AC-20: 404 for POST to a group that does not exist', async () => {
  const cookie = await login('student@example.com', 'student123');
  const nonExistentGroupId = 999999;

  const res = await fetch(`${baseUrl}/api/groups/${nonExistentGroupId}/sessions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Cookie: cookie,
    },
    body: JSON.stringify({
      startTime: '2027-05-01T10:00:00Z',
      endTime: '2027-05-01T11:00:00Z',
      place: 'Room 2027-404-group',
    }),
  });

  assert.strictEqual(res.status, 404);
});

test('AC-21: 404 for DELETE of a session that does not exist', async () => {
  const cookie = await login('student@example.com', 'student123');
  const nonExistentSessionId = 999999;

  const res = await fetch(`${baseUrl}/api/sessions/${nonExistentSessionId}`, {
    method: 'DELETE',
    headers: {
      Cookie: cookie,
    },
  });

  assert.strictEqual(res.status, 404);
});

test('AC-15: a session that starts exactly when another in the same group ends gets 201', async () => {
  const cookie = await login('student@example.com', 'student123');
  const groupId = 1;

  const res1 = await fetch(`${baseUrl}/api/groups/${groupId}/sessions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Cookie: cookie,
    },
    body: JSON.stringify({
      startTime: '2027-06-01T10:00:00Z',
      endTime: '2027-06-01T11:00:00Z',
      place: 'Room 2027-AC15-1',
    }),
  });
  const created1 = await res1.json();
  const id1 = created1.id;

  let id2;
  try {
    const res2 = await fetch(`${baseUrl}/api/groups/${groupId}/sessions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Cookie: cookie,
      },
      body: JSON.stringify({
        startTime: '2027-06-01T11:00:00Z',
        endTime: '2027-06-01T12:00:00Z',
        place: 'Room 2027-AC15-2',
      }),
    });
    assert.strictEqual(res2.status, 201);
    const created2 = await res2.json();
    id2 = created2.id;
  } finally {
    if (id1) await sessionsData.remove(id1).catch(() => {});
    if (id2) await sessionsData.remove(id2).catch(() => {});
  }
});

test('AC-16: the same time in a different group gets 201', async () => {
  const cookie = await login('student@example.com', 'student123');
  const groupId1 = 1;
  const groupId2 = 2;

  const res1 = await fetch(`${baseUrl}/api/groups/${groupId1}/sessions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Cookie: cookie,
    },
    body: JSON.stringify({
      startTime: '2027-07-01T10:00:00Z',
      endTime: '2027-07-01T11:00:00Z',
      place: 'Room 2027-AC16-1',
    }),
  });
  const created1 = await res1.json();
  const id1 = created1.id;

  let id2;
  try {
    const res2 = await fetch(`${baseUrl}/api/groups/${groupId2}/sessions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Cookie: cookie,
      },
      body: JSON.stringify({
        startTime: '2027-07-01T10:00:00Z',
        endTime: '2027-07-01T11:00:00Z',
        place: 'Room 2027-AC16-2',
      }),
    });
    assert.strictEqual(res2.status, 201);
    const created2 = await res2.json();
    id2 = created2.id;
  } finally {
    if (id1) await sessionsData.remove(id1).catch(() => {});
    if (id2) await sessionsData.remove(id2).catch(() => {});
  }
});

test('AC-17: the creator sends DELETE and gets 204, the row is gone from GET, and the same time can be scheduled again with 201', async () => {
  const cookie = await login('student@example.com', 'student123');
  const groupId = 1;

  const res1 = await fetch(`${baseUrl}/api/groups/${groupId}/sessions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Cookie: cookie,
    },
    body: JSON.stringify({
      startTime: '2027-08-01T10:00:00Z',
      endTime: '2027-08-01T11:00:00Z',
      place: 'Room 2027-AC17',
    }),
  });
  const created1 = await res1.json();
  const id1 = created1.id;

  let id2;
  try {
    const delRes = await fetch(`${baseUrl}/api/sessions/${id1}`, {
      method: 'DELETE',
      headers: {
        Cookie: cookie,
      },
    });
    assert.strictEqual(delRes.status, 204);

    const getRes = await fetch(`${baseUrl}/api/groups/${groupId}/sessions`);
    const sessionsList = await getRes.json();
    const found = sessionsList.find((s) => s.id === id1);
    assert.strictEqual(found, undefined);

    const res2 = await fetch(`${baseUrl}/api/groups/${groupId}/sessions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Cookie: cookie,
      },
      body: JSON.stringify({
        startTime: '2027-08-01T10:00:00Z',
        endTime: '2027-08-01T11:00:00Z',
        place: 'Room 2027-AC17-again',
      }),
    });
    assert.strictEqual(res2.status, 201);
    const created2 = await res2.json();
    id2 = created2.id;
  } finally {
    if (id1) await sessionsData.remove(id1).catch(() => {});
    if (id2) await sessionsData.remove(id2).catch(() => {});
  }
});

test('AC-18: user 2 sends DELETE for a session of user 1 and gets 403, and the session is still in GET', async () => {
  const cookie1 = await login('student@example.com', 'student123');
  const cookie2 = await login('student2@example.com', 'student456');
  const groupId = 1;

  const res1 = await fetch(`${baseUrl}/api/groups/${groupId}/sessions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Cookie: cookie1,
    },
    body: JSON.stringify({
      startTime: '2027-09-01T10:00:00Z',
      endTime: '2027-09-01T11:00:00Z',
      place: 'Room 2027-AC18',
    }),
  });
  const created1 = await res1.json();
  const id1 = created1.id;

  try {
    const delRes = await fetch(`${baseUrl}/api/sessions/${id1}`, {
      method: 'DELETE',
      headers: {
        Cookie: cookie2,
      },
    });
    assert.strictEqual(delRes.status, 403);

    const getRes = await fetch(`${baseUrl}/api/groups/${groupId}/sessions`);
    const sessionsList = await getRes.json();
    const found = sessionsList.find((s) => s.id === id1);
    assert.ok(found);
  } finally {
    if (id1) await sessionsData.remove(id1).catch(() => {});
  }
});
