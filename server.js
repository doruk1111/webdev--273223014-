require("dotenv").config();
const express = require('express');
const session = require('express-session');
const pgSession = require('connect-pg-simple')(session);
const { Pool } = require('pg');

const app = express();
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));

app.use(
  session({
    store: new pgSession({
      pool: pool,
      createTableIfMissing: true,
    }),
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
  })
);

app.get('/', (req, res) => {
  res.redirect('/login');
});

app.use(require('./routes/auth'));
app.use(require('./routes/groups'));
app.use(require('./routes/sessions'));

const port = 3000;
if (require.main === module) {
  app.listen(port, () => {
    console.log(port);
  });
}

module.exports = app;
