Health check on the mobile app's backend connection.

1. curl https://aria-auto-sales.fly.dev/health — expect 200
2. curl -H "Authorization: Basic $(echo -n 'john.martinez:PorscheRO-2026!xK9m' | base64)" https://aria-auto-sales.fly.dev/api/leads — expect 200
3. curl -H "Authorization: Basic $(echo -n 'john.martinez:PorscheRO-2026!xK9m' | base64)" https://aria-auto-sales.fly.dev/api/clients — expect 200
4. curl -H "Authorization: Basic $(echo -n 'john.martinez:PorscheRO-2026!xK9m' | base64)" https://aria-auto-sales.fly.dev/api/calls — expect 200
5. Check git status: `cd /Users/parsaparvaz/Downloads/app/artifacts/mobile && git status && git log --oneline -5`

Report with checkmark/x for each endpoint and current git state.
