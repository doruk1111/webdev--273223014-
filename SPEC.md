# Project : Studying Together

<!-- Exercise 2. Write the non-goals first. Every acceptance criterion must be checkable in under a minute.
     Keep these headings exactly as they are: the self-checks look for them by name.
     The full target is on the course site under Resources → The course project. -->

## Project option
<!-- One line: lab booking, study groups, club events, or the own project the lecturer approved. -->
Study groups

## Goals
- Student signs in, finds a group and join it.
- Student sees the available study lessons.
- An owner creates a group and schedules the time.

## Non-goals
- No fee: Every meeting is free
- No push notifications: Members can check the website
- No time restrcitions: Members can come and go whenever they want

## Constraints
- Node with Express, PostgreSQL, plain HTML and JavaScript in the UI.
- Passwords are stored only as a hash, never as readable text.
- No keys or secrets are committed to the repository; they live in Codespaces secrets.

## The model feature
<!-- Which model, which modality, and what it does for a user.
     Name three things or the check fails: the input it receives, the output it produces,
     and what happens when the model is slow, rate-limited or wrong. -->
- Model: Gemini 2.5 Flash, text only, called from `services/agenda.js` and nowhere else.
- Input: the course name and topic the owner types when creating a session, and nothing about any member.
- Output: a suggested session title and a short agenda of three points, shown in the form for the owner to edit.
- When it fails: no key, a timeout or a 429 all leave the suggestion box empty with a note saying to type the details in. Nothing is saved until the owner presses save.

## Auth
<!-- Local sign-in plus at least one provider. Say how an account signing in both ways stays one account. -->
- Local: e-mail and password, stored as a bcrypt hash.
- Provider: Sign in with Google, the authorization-code flow, on the server.
- Linking: matched on Google's account id. If Google reports a verified address that

## MCP tools
<!-- At least three tools your own MCP server exposes over this project's data.
     Each tool calls the same service functions the HTTP API calls, so the same rules apply.
     A description shorter than 20 characters is not a description. -->
| Tool | What it does | Who may call it |
| --- | --- | --- |
| `list_groups` | Lists the open study groups for a course, with how many members each has | anyone |
| `upcoming_sessions` | Lists the future study sessions of every group the signed-in member belongs to | the token's owner |
| `join_group` | Adds the signed-in member to a group, refusing if they are already in it | the token's owner |

## UI
<!-- Stack, and the three or more screens. The graded checklist lives in docs/UI.md. -->
Plain HTML and JavaScript with plain CSS. Four screens: sign in, the list of study groups, upcoming sessions, and one group with its sessions and the owner's "Add session" button. The checklist is in `docs/UI.md`.

## Architecture
<!-- Exercise 3. One request traced through every layer, naming the file for each one,
     plus one place where your own code does not match this layering. -->
One request, `POST /api/groups/:groupId/sessions`, through every layer:

1. `server.js` mounts the session store (connect-pg-simple, in PostgreSQL) and `routes/sessions.js`. It exports the app so the tests can start it.
2. `routes/sessions.js` is hit first. `requireApi` from `middleware/auth.js` answers 401 `{"error":"Sign in first"}` when there is no session, before any handler runs. The handler then reads the body and the group id, calls `scheduleSession`, and turns the error's `status` into the response: 201 with the new row, or the error's status with `{"error": message}`. It holds no rule.
3. `services/sessions.js` holds every rule in `scheduleSession`: the end must be after the start (422), the group must exist (404), the user must own the group (403), and no other session of the same group may overlap (409, with a message that names the clash). It throws errors that carry a name and a status, and knows nothing about HTTP.
4. `data/sessions.js` and `data/groups.js` are the only places with SQL, always with `$1` placeholders. `findOverlap` uses strict comparisons, so a session may start exactly when another ends.
5. `migrations/002_sessions.sql` creates the `sessions` table that the data layer reads and writes.
6. Back to the browser: `public/js/sessions.js` makes the REST calls with `fetch` (`/api/me`, `/api/groups` and `/api/groups/:id/sessions`). Its state is the signed-in user, the group and the sessions, held inside `loadSessions` and redrawn by calling it again after every change. The `errorText` helper turns a failed response into a readable sentence, and the page draws everything with `textContent`, with a loading, an empty and an error state.

Where this codebase does not match its own layering: the `GET /api/groups/:groupId/sessions` handler in `routes/sessions.js` calls `groups.findById` and `sessionsData.listByGroup` directly, so the route reads the data layer and skips the service. I left it because listing has no rule yet; when it gets one, it moves into a service function.

Other known gaps: the session store creates its own table at runtime, outside the migrations; `/sessions.html` is served without signing in, but its data is protected by the API; and the overlap check and the insert are two separate steps, so two simultaneous requests could both pass the check, which a database constraint would close.


## Acceptance criteria
- [AC-1] A student signs in and lands on /groups, where they see the groups, each with its name and course.
- [AC-2] A student who is already in the group tries to join it again, and gets the message "You are already in this group". They still have only one row in `memberships`.
- [AC-3] A student leaves a group and it disappears from "My groups". Their row is removed from `memberships`.
- [AC-4] A student opens "Upcoming sessions" and sees only future sessions from the groups they belong to, each with its time and place. Sessions of other groups do not appear.
- [AC-5] A group owner creates a session by typing a time and a place, and it appears in the group's session list. One new row appears in the `sessions` table.
- [AC-6] A group member who is not the owner does not see the "Add session" button. If they try to add a session anyway, they get 403 and no row is added to `sessions`.
- [AC-7] Signing in with Google using an address that already has a password account signs into that same account, and no second row appears in `users`.
- [AC-8] With no model key set, the model suggestion box stays empty and shows a note, and the owner can still save the session by typing the details by hand.


### Slice 1: sign-in and <list screen>
- [AC-9] A visitor who opens /groups without signing in is sent to /login instead.
- [AC-10] After signing in with a seeded account, /groups shows the three seeded groups, each with its name and course.
- [AC-11] If one group row is deleted in the database and the page is reloaded, that group disappears from /groups.
- [AC-12] A visitor who opens `/` without signing in is sent to `/login`.

### Slice 2: schedule a session without clashes
- [AC-13] A session whose end is not after its start is refused with 422, and no row is added to `sessions`.
- [AC-14] A session that overlaps another session of the same group is refused with 409 and a message that names the session it clashes with, and no row is added to `sessions`.
- [AC-15] A session that starts exactly when another session of the same group ends is accepted with 201.
- [AC-16] A session at the same time in a different group is accepted with 201, because clashes are only checked inside one group.
- [AC-17] The creator of a session who cancels it gets 204, the row is removed from `sessions`, and the same time can be scheduled again.
- [AC-18] A signed-in user who did not create a session and tries to cancel it gets 403, and the row is still in `sessions`.
- [AC-19] A request to schedule or cancel a session with no signed-in user gets 401, and `sessions` is unchanged.
- [AC-20] A request to schedule a session in a group that does not exist gets 404, and `sessions` is unchanged.
- [AC-21] A request to cancel a session that does not exist gets 404.



## Traceability
<!-- Filled in from Exercise 3 onward: each AC id, and the test that names it. -->
| Criterion | Test |
| --- | --- |
| AC-1 |  |
| AC-13 | |
| AC-14 | |
| AC-15 | |
| AC-16 | |
| AC-17 | |
| AC-18 | |
| AC-19 | |
| AC-20 | |
| AC-21 | |

## Spec vs result
<!-- After the agent builds the slice: which criteria passed, which it missed or reinterpreted, and what you changed in this spec because of it. -->
- Passed: AC-9 (opening /groups without signing in sends me to /login, and curl on /groups returned 302 to /login), the 401 on /api/groups without a session, and AC-10 (after signing in with the seeded account I see the study groups from the database). AC-11: If one group row is deleted in the database and the page is reloaded, that group disappears from /groups.
- Missed: The agent's first migration used a description column instead of the course column my criteria needed, and it named the hash column password. It also said PostgreSQL was already running in the codespace, but psql did not exist, so I installed it myself. It also wrote server.js and the routes in a request that looked like it had failed, and they reached a commit before I had reviewed them. No criterion said what a visitor sees at /, so the app answers "Cannot GET /".
- Changed: I added AC-12 under Slice 1: a visitor who opens / is sent to /login. I also made AC-10 name the course explicitly.