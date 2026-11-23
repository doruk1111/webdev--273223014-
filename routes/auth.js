
const express = require('express');
const path = require('path');
const authService = require('../services/auth');
const { requireApi } = require('../middleware/auth');

const router = express.Router();

router.get('/login', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/login.html'));
});

router.get('/google-client-config.js', (req, res) => {
  res.type('application/javascript').send(
    `window.GOOGLE_CLIENT_ID = ${JSON.stringify(
      process.env.GOOGLE_CLIENT_ID || ''
    )};`
  );
});

router.post('/login', async (req, res) => {
  try {
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
  } catch (err) {
    return res.status(500).json({ error: 'Login failed' });
  }
});

router.post('/auth/google', async (req, res) => {
  try {
    const user = await authService.googleLogin(req.body.credential);

    if (!user) {
      return res.status(401).json({
        error: 'Google account could not be matched to an existing account',
      });
    }

    req.session.user = user;

    req.session.save((err) => {
      if (err) {
        return res.status(500).json({ error: 'Could not save session' });
      }

      return res.status(200).json(user);
    });
  } catch (err) {
    const status = err.message === 'Google sign-in is not configured'
      ? 503
      : 401;

    return res.status(status).json({ error: 'Google sign-in failed' });
  }
});

router.post('/logout', (req, res) => {
  req.session.destroy(() => {
    res.status(204).send();
  });
});

router.get('/api/me', requireApi, (req, res) => {
  res.status(200).json(req.session.user);
});

module.exports = router;
