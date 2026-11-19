[33mcommit 71bc683c50888cd531551f970941f96c6f8621fc[m[33m ([m[1;36mHEAD[m[33m -> [m[1;32mmain[m[33m, [m[1;31morigin/main[m[33m, [m[1;31morigin/HEAD[m[33m)[m
Author: doruk1111 <dkarakash@tu-sofia.bg>
Date:   Thu Nov 19 03:33:06 2026 +0000

    Log: add slice 1 migration entry

[1mdiff --git a/AGENT_LOG.md b/AGENT_LOG.md[m
[1mindex e02e4e4..9ac3328 100644[m
[1m--- a/AGENT_LOG.md[m
[1m+++ b/AGENT_LOG.md[m
[36m@@ -9,9 +9,9 @@[m [mOne entry per agent session, newest at the bottom. Be honest: what went wrong is[m
 - Went wrong:[m
 - Changed by hand:[m
 [m
[31m-## 2026-11-09 · FIP Laboratory Exercise 2[m
[31m-- Goal: Have the plan and build slice 1 (sign-in and the list of study groups) from SPEC.md.[m
[31m-- Delegated: The plan for slice 1, then the build (database, sign-in, list screen).[m
[31m-- Checkpoints: Read the plan and checked it against the non-goals and the slice 1 criteria. No build checkpoints were reached.[m
[31m-- Went wrong: Gemini hung for several minutes on the plan, three times in a row, with the default model and with gemma-4-31b-it. It later produced a plan, but the plan did not require a sign-in on GET /api/groups, named no database, and did not say how the seeded passwords are hashed. The build then hung, so no files were created.[m
[31m-- Changed by hand: Nothing in the code yet. I switched the model to gemma-4-31b-it as suggested in the course channel.[m
[32m+[m[32m## 2026-11-09 · Slice 1 migration with Gemini CLI[m
[32m+[m[32m- Goal: Have the agent write the slice 1 migration (users and groups tables with seed data).[m
[32m+[m[32m- Delegated: The migration file only, one small step at a time.[m
[32m+[m[32m- Checkpoints: Read the plan and corrected it before approving. Read the migration with cat before committing.[m
[32m+[m[32m- Went wrong: Free-tier quota errors (16,000 input tokens per minute) stopped the earlier attempts. The first version of the migration used a description column instead of the course column the spec requires, named the hash column password, and contained a hash that was not generated.[m
[32m+[m[32m- Changed by hand: Switched to my own API key. Asked the agent to replace description with course, rename the column to password_hash and seed the hash with pgcrypto.[m
