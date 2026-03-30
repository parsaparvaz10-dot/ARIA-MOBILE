STOP. Before I deploy this, audit your own work.

1. FAILURE MODES: What are the 3 most likely ways this code fails in production?
2. EDGE CASES: What inputs or scenarios did you NOT handle?
3. DATA INTEGRITY: Could this change break existing data or API calls?
4. AUTH CHECK: Did you touch any fetch calls? If yes, verify Authorization headers in BOTH lib/api.ts AND hooks/useNotifications.ts.
5. ROLLBACK: If this deploy breaks something, what's the git revert command?

Be brutally honest. I'd rather fix it now than debug it at 2 AM.
