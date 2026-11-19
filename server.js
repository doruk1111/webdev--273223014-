const express = require('express');
const session = require('express-session');
const pgConnect = require('connect-pg-simple');
const { Pool } = require('pg');
const path = require('path');

const app = express();
const pgSession = pgConnect(session);

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

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

app.use(require('./routes/auth'));
app.use(require('./routes/groups'));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});
