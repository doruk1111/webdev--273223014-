function requirePage(req, res, next) {
  if (!req.session || !req.session.user) {
    return res.redirect('/login');
  }
  next();
}

function requireApi(req, res, next) {
  if (!req.session || !req.session.user) {
    return res.status(401).json({ error: 'Sign in first' });
  }
  next();
}

module.exports = {
  requirePage,
  requireApi,
};
