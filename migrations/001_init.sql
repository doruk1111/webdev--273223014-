CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE groups (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    course TEXT NOT NULL,
    owner_id INTEGER REFERENCES users(id),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

INSERT INTO users (email, password_hash) VALUES ('student@example.com', crypt('student123', gen_salt('bf')));

INSERT INTO groups (name, course, owner_id) VALUES 
('CS 101 Study Group', 'CS101', 1),
('Math Advanced', 'MATH201', 1),
('English Lit Circle', 'ENG105', 1);
