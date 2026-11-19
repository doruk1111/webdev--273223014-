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

module.exports = router;
