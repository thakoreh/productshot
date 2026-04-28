#!/bin/bash
# ProductShot startup script
# Starts both the screenshot server (sidecar) and Next.js app

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

echo "🚀 Starting ProductShot..."

# Start screenshot server
node screenshot-server.js &
SCREENSHOT_PID=$!
echo "📸 Screenshot server started (PID: $SCREENSHOT_PID)"

# Start Next.js
PORT="${PORT:-3007}"
npm run start -- -p $PORT &
NEXT_PID=$!
echo "🌐 Next.js started on port $PORT (PID: $NEXT_PID)"

# Wait for both
wait $SCREENSHOT_PID $NEXT_PID
