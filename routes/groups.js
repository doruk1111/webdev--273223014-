const express = require('express');
const path = require('path');
const { requirePage, requireApi } = require('../middleware/auth');
const groupsService = require('../services/groups');

const router = express.Router();

router.get('/groups', requirePage, (req, res) => {
  res.sendFile(path.join(__dirname, '../public/groups.html'));
});

router.get('/api/groups', requireApi, async (req, res) => {
  const groups = await groupsService.list();
  res.json(groups);
});

router.get('/api/upcoming-sessions', requireApi, async (req, res) => {
  try {
    const sessions = await groupsService.upcomingSessions(req.session.user.id);
    res.json(sessions);
  } catch (err) {
    res.status(err.status || 500).json({ error: err.message });
  }
});

router.post('/api/groups/:groupId/join', requireApi, async (req, res) => {
  try {
    const membership = await groupsService.join(
      req.params.groupId,
      req.session.user.id
    );
    res.status(201).json(membership);
  } catch (err) {
    res.status(err.status || 500).json({ error: err.message });
  }
});

router.delete('/api/groups/:groupId/leave', requireApi, async (req, res) => {
  try {
    await groupsService.leave(
      req.params.groupId,
      req.session.user.id
    );
    res.status(204).end();
  } catch (err) {
    res.status(err.status || 500).json({ error: err.message });
  }
});

module.exports = router;