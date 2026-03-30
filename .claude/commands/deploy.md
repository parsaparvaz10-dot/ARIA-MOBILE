Full deploy checklist for the mobile app. Execute each step in order.

1. PRE-DEPLOY: Run `cd /Users/parsaparvaz/Downloads/app/artifacts/mobile && git log --oneline -3` to note current state
2. COMMIT: `cd /Users/parsaparvaz/Downloads/app/artifacts/mobile && git add . && git status` — show me what's being committed
3. Wait for my approval before pushing
4. PUSH: `cd /Users/parsaparvaz/Downloads/app/artifacts/mobile && git push`
5. VERIFY: Confirm push succeeded with `cd /Users/parsaparvaz/Downloads/app/artifacts/mobile && git log --oneline -1`
6. REMIND: Tell Parsa to run `git pull origin main` in Replit shell, then `npx expo start --tunnel`
7. Report: what changed, what to verify on the phone
