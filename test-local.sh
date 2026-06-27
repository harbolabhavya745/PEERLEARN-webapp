npm run dev > dev2.log 2>&1 &
PID=$!
sleep 5
curl -v http://localhost:5173/api/notion/oauth
kill $PID
