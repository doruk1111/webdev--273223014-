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