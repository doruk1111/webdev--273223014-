const express = require('express');
const router = express.Router();
const { requireApi } = require('../middleware/auth');
const { scheduleSession, cancelSession } = require('../services/sessions');
const groups = require('../data/groups');
const sessionsData = require('../data/sessions');
const { createAgendaService } = require('../services/agenda');
const agendaService = createAgendaService();


router.post('/api/groups/:groupId/agenda-suggestion', requireApi, async (req, res) => {
  try {
    const groupId = Number(req.params.groupId);
    const userId = req.session.user.id;
    const group = await groups.findById(groupId);

    if (!group) {
      return res.status(404).json({ error: 'Group not found' });
    }

    if (group.owner_id !== userId) {
      return res.status(403).json({ error: 'Only the group owner can request suggestions' });
    }

    const { topic } = req.body;

    const suggestion = await agendaService.suggest({
      course: group.course,
      topic
    });

    return res.status(200).json(suggestion);
  } catch (err) {
    return res.status(500).json({
      error: 'Could not generate an agenda suggestion'
    });
  }
});


router.get('/api/groups/:groupId/sessions', requireApi, async (req, res) => {
  try {
    const groupId = Number(req.params.groupId);
    const group = await groups.findById(groupId);
    if (!group) {
      return res.status(404).json({ error: 'Group not found' });
    }
    const list = await sessionsData.listByGroup(groupId);
    return res.status(200).json(list);
  } catch (err) {
    return res.status(err.status || 500).json({ error: err.message });
  }
});

router.post('/api/groups/:groupId/sessions', requireApi, async (req, res) => {
  try {
    const groupId = Number(req.params.groupId);
    const userId = req.session.user.id;
    const { startTime, endTime, place } = req.body;
    const session = await scheduleSession({ groupId, userId, startTime, endTime, place });
    return res.status(201).json(session);
  } catch (err) {
    return res.status(err.status || 500).json({ error: err.message });
  }
});

router.delete('/api/sessions/:sessionId', requireApi, async (req, res) => {
  try {
    const sessionId = Number(req.params.sessionId);
    const userId = req.session.user.id;
    await cancelSession({ sessionId, userId });
    return res.status(204).send();
  } catch (err) {
    return res.status(err.status || 500).json({ error: err.message });
  }
});

module.exports = router;
