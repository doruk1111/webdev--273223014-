# Agent log

One entry per agent session, newest at the bottom. Be honest: what went wrong is the useful part.

## 2026/10/27 · FIP Laboratory Exercise 1
- Goal: Understand each step of Exercise 1 and  build the MCP Server
- Delegated: To run the server and improve it by adding commands on tasks 2 to 6.
- Checkpoints: Ran checks after each update and got the results 3/12, 6/12, 9/12 and finally 12/12. After the final updates, we had all the checks passed.
- Went wrong:
- Changed by hand:

## 2026-11-09 · FIP Laboratory Exercise 2
- Goal: Have the plan and build slice 1 (sign-in and the list of study groups) from SPEC.md.
- Delegated: The plan for slice 1, then the build (database, sign-in, list screen).
- Checkpoints: Read the plan and checked it against the non-goals and the slice 1 criteria. No build checkpoints were reached.
- Went wrong: Gemini hung for several minutes on the plan, three times in a row, with the default model and with gemma-4-31b-it. It later produced a plan, but the plan did not require a sign-in on GET /api/groups, named no database, and did not say how the seeded passwords are hashed. The build then hung, so no files were created.
- Changed by hand: Nothing in the code yet. I switched the model to gemma-4-31b-it as suggested in the course channel.

## 2026-11-19 · Slice 1 migration with Gemini CLI
- Goal: Have the agent write the slice 1 migration (users and groups tables with seed data).
- Delegated: The migration file only, one small step at a time.
- Checkpoints: Read the plan and corrected it before approving. Read the migration with cat before committing.
- Went wrong: Free-tier quota errors (16,000 input tokens per minute) stopped the earlier attempts. The first version of the migration used a description column instead of the course column the spec requires, named the hash column password, and contained a hash that was not generated.
- Changed by hand: Switched to my own API key. Asked the agent to replace description with course, rename the column to password_hash and seed the hash with pgcrypto.

## 2026-11-20 · Exercise 3 plan: schedule sessions without clashes
- Goal: A written plan for the session feature (a sessions table, a no-overlap rule in the service, endpoints with status codes, an authorization check, the UI and tests), with no code yet.
- Autonomy: The agent works alone inside one step of the plan at a time. I read every diff before each commit, and I decide what the failure tests must prove.
- Checkpoints: Plan review before any code. npm test green before each commit. A permission prompt for everything on the always-ask list, always answered with allow once. One small request per step, with no file exploring.
- Went wrong:
- Changed by hand:
- Changed in review: The plan raised 401 in the service; I moved it before the service and left only 403 there. It seeded a memberships table that does not exist; I limited the seed to a second user. It added title and agenda columns, an AI suggestion, an MCP tool and AC-12, none of which I asked for; removed. It put tests in checks/; moved to tests/. It had no endpoint to list a group's sessions; added one. The revision still left the owner check ambiguous between route and service, and had no UI states; I fixed both in the step prompts.

## 2026-11-21 · Build slice 2 with Gemini CLI: sessions without clashes
- Goal: Build the session feature from the reviewed plan: a migration, the data layer, a service with the no-overlap rule, endpoints with authorization, and the UI, with tests.
- Autonomy: The agent worked alone inside one step at a time. I read every diff before each commit and decided what the tests must prove.
- Checkpoints: Plan review before any code. Tests written before the service and before the routes, shown failing. npm test green before each commit. Permission prompts answered with allow once. I commented out the overlap rule and the overlap tests failed, then I restored it with git restore. I checked the status codes by hand with curl: <write the statuses you really got>.
- Went wrong: The first service the agent wrote did not await its data calls and passed objects to functions that take positional arguments, so every request was refused with NotOwner; the tests I wrote first caught it. Its API tests called the list endpoint without a session, and one of them passed only because the route did not exist yet. It invented two criterion ids (AC-20, AC-21), which I added to the spec. It edited two files without reading them (a SQLite-style call on a PostgreSQL project and a wrong import), which broke the app at load time; the tests caught it and I fixed both by hand. PostgreSQL stopped after the codespace restarted and made good tests look broken. My two test files shared one table and failed at random when they ran in parallel:We changed the login code to save the user session before sending the response. The rule-off experiment left a stray row that failed two later tests until I cleared it. Gemini's free quota stopped many requests, so I split the work into one file per prompt.
- Changed by hand: I installed PostgreSQL and the npm packages myself, and added the start and test scripts. I added a PostgreSQL service and a migrations step to the CI test job because my tests need a database. I corrected two of the agent's tests (the NotOwner test became AC-6 with a table check, and AC-17 got try/finally). A chat assistant supplied a corrected replacement for the whole API test file from my criteria, and I reviewed it before running it.