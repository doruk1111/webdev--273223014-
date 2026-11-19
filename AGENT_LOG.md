# Agent log

One entry per agent session, newest at the bottom. Be honest: what went wrong is the useful part.

## 2026/10/27 · FIP Laboratory Exercise 1
- Goal: Understand each step of Exercise 1 and  build the MCP Server
- Delegated: To run the server and improve it by adding commands on tasks 2 to 6.
- Checkpoints: Ran checks after each update and got the results 3/12, 6/12, 9/12 and finally 12/12. After the final updates, we had all the checks passed.
- Went wrong:
- Changed by hand:

## 2026-11-09 · Slice 1 migration with Gemini CLI
- Goal: Have the agent write the slice 1 migration (users and groups tables with seed data).
- Delegated: The migration file only, one small step at a time.
- Checkpoints: Read the plan and corrected it before approving. Read the migration with cat before committing.
- Went wrong: Free-tier quota errors (16,000 input tokens per minute) stopped the earlier attempts. The first version of the migration used a description column instead of the course column the spec requires, named the hash column password, and contained a hash that was not generated.
- Changed by hand: Switched to my own API key. Asked the agent to replace description with course, rename the column to password_hash and seed the hash with pgcrypto.
