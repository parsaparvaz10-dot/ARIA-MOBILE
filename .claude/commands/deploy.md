Prepare this change for deployment:
1. Run: git status (show what changed)
2. Run: git diff --stat (confirm scope)
3. If more than 3 files changed, STOP and ask if this should be split into smaller deploys
4. Run: git add -A && git commit -m "[descriptive message based on changes]"
5. Run: git push origin main
6. Tell Parsa: "Push is ready. In Replit shell run: git pull && npx expo start --tunnel"
7. List what to verify in Expo Go on the phone
