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

## Traceability
<!-- Filled in from Exercise 3 onward: each AC id, and the test that names it. -->
| Criterion | Test |
| --- | --- |
| AC-1 |  |

## Spec vs result
<!-- After the agent builds the slice: which criteria passed, which it missed or reinterpreted, and what you changed in this spec because of it. -->
