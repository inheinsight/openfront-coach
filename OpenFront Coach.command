#!/bin/zsh
# Double-click in Finder to start the coach and open the dashboard.
cd "$(dirname "$0")" || exit 1
[ -d node_modules ] || npm run setup
[ -f web/dist/index.html ] || npm run build:web
PORT=$(grep -E '^PORT=' .env 2>/dev/null | cut -d= -f2)
PORT=${PORT:-5317}
(until curl -s "http://127.0.0.1:$PORT/api/health" >/dev/null; do sleep 1; done; open "http://localhost:$PORT") &
exec npm start
