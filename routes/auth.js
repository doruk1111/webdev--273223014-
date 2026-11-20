const express = require('express');
const path = require('path');
const authService = require('../services/auth');

const router = express.Router();

router.get('/login', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/login.html'));
});

router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  const user = await authService.login(email, password);
  if (!user) {
    return res.status(401).json({ error: 'Wrong email or password' });
  }
  req.session.user = user;

  req.session.save((err) => {
  if (err) {
    return res.status(500).json({ error: 'Could not save session' });
    }

  return res.status(200).json(user);
  });
});

router.post('/logout', (req, res) => {
  req.session.destroy(() => {
    res.status(204).send();
  });
});

module.exports = router;
