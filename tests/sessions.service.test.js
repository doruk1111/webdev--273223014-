const test = require('node:test');
const assert = require('node:assert');
const sessionsService = require('../services/sessions');
const sessionsData = require('../data/sessions');

test('AC-13 an end that is not after the start is refused with InvalidTime', async () => {
  const startTime = new Date('2026-12-01T10:00:00Z');
  const endTime = new Date('2026-12-01T10:00:00Z');
  await assert.rejects(
    async () => {
      await sessionsService.scheduleSession({
        groupId: 1,
        userId: 1,
        startTime,
        endTime,
        place: 'Room A'
      });
    },
    (err) => {
      assert.strictEqual(err.name, 'InvalidTime');
      assert.strictEqual(err.status, 422);
      return true;
    }
  );
});

test('AC-14 an overlapping session in the same group is refused with SessionConflict and no row is added', async () => {
  const startTime1 = new Date('2026-12-01T10:00:00Z');
  const endTime1 = new Date('2026-12-01T11:00:00Z');
  const session1 = await sessionsService.scheduleSession({
    groupId: 1,
    userId: 1,
    startTime: startTime1,
    endTime: endTime1,
    place: 'Room A'
  });

  try {
    const startTime2 = new Date('2026-12-01T10:30:00Z');
    const endTime2 = new Date('2026-12-01T11:30:00Z');
    await assert.rejects(
      async () => {
        await sessionsService.scheduleSession({
          groupId: 1,
          userId: 1,
          startTime: startTime2,
          endTime: endTime2,
          place: 'Room B'
        });
      },
      (err) => {
        assert.strictEqual(err.name, 'SessionConflict');
        assert.strictEqual(err.status, 409);
        return true;
      }
    );

    const list = await sessionsData.listByGroup(1);
    const overlappingRows = list.filter(s => s.place === 'Room B');
    assert.strictEqual(overlappingRows.length, 0);
  } finally {
    await sessionsData.remove(session1.id);
  }
});

test('AC-15 a session that starts exactly when another ends is accepted', async () => {
  const startTime1 = new Date('2026-12-01T10:00:00Z');
  const endTime1 = new Date('2026-12-01T11:00:00Z');
  const session1 = await sessionsService.scheduleSession({
    groupId: 1,
    userId: 1,
    startTime: startTime1,
    endTime: endTime1,
    place: 'Room A'
  });

  let session2;
  try {
    const startTime2 = new Date('2026-12-01T11:00:00Z');
    const endTime2 = new Date('2026-12-01T12:00:00Z');
    session2 = await sessionsService.scheduleSession({
      groupId: 1,
      userId: 1,
      startTime: startTime2,
      endTime: endTime2,
      place: 'Room B'
    });
    assert.ok(session2.id);
  } finally {
    if (session2) await sessionsData.remove(session2.id);
    await sessionsData.remove(session1.id);
  }
});

test('AC-16 the same time in a different group is accepted', async () => {
  const startTime = new Date('2026-12-01T14:00:00Z');
  const endTime = new Date('2026-12-01T15:00:00Z');
  const session1 = await sessionsService.scheduleSession({
    groupId: 1,
    userId: 1,
    startTime,
    endTime,
    place: 'Room A'
  });

  let session2;
  try {
    session2 = await sessionsService.scheduleSession({
      groupId: 2,
      userId: 1,
      startTime,
      endTime,
      place: 'Room B'
    });
    assert.ok(session2.id);
  } finally {
    if (session2) await sessionsData.remove(session2.id);
    await sessionsData.remove(session1.id);
  }
});

test('AC-17 the creator cancels a session and the same time can be scheduled again', async () => {
  const startTime = new Date('2026-12-01T16:00:00Z');
  const endTime = new Date('2026-12-01T17:00:00Z');
  const session1 = await sessionsService.scheduleSession({
    groupId: 1,
    userId: 1,
    startTime,
    endTime,
    place: 'Room A'
  });

  let session2;
  try {
    await sessionsService.cancelSession({
      sessionId: session1.id,
      userId: 1
    });

    const deleted = await sessionsData.findById(session1.id);
    assert.strictEqual(deleted, undefined);

    session2 = await sessionsService.scheduleSession({
      groupId: 1,
      userId: 1,
      startTime,
      endTime,
      place: 'Room A'
    });
    assert.ok(session2.id);
  } finally {
    if (session2) await sessionsData.remove(session2.id);
    await sessionsData.remove(session1.id);
  }
});

test('AC-18 a user who is not the creator gets NotCreator and the session is still there', async () => {
  const startTime = new Date('2026-12-01T18:00:00Z');
  const endTime = new Date('2026-12-01T19:00:00Z');
  const session1 = await sessionsService.scheduleSession({
    groupId: 1,
    userId: 1,
    startTime,
    endTime,
    place: 'Room A'
  });

  try {
    await assert.rejects(
      async () => {
        await sessionsService.cancelSession({
          sessionId: session1.id,
          userId: 2
        });
      },
      (err) => {
        assert.strictEqual(err.name, 'NotCreator');
        assert.strictEqual(err.status, 403);
        return true;
      }
    );

    const checkSession = await sessionsData.findById(session1.id);
    assert.ok(checkSession);
  } finally {
    await sessionsData.remove(session1.id);
  }
});

test('AC-6 a user who does not own the group is refused with NotOwner and no row is added', async () => {
  const startTime = new Date('2026-12-01T20:00:00Z');
  const endTime = new Date('2026-12-01T21:00:00Z');
  await assert.rejects(
    async () => {
      await sessionsService.scheduleSession({
        groupId: 1,
        userId: 2,
        startTime,
        endTime,
        place: 'Room A'
      });
    },
    (err) => {
      assert.strictEqual(err.name, 'NotOwner');
      assert.strictEqual(err.status, 403);
      return true;
    }
  );

  const list = await sessionsData.listByGroup(1);
  assert.strictEqual(list.filter((s) => s.creator_id === 2).length, 0);
});