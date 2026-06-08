#!/bin/sh
# Waits for the health endpoint to respond with HTTP 200.
# Usage: scripts/wait-for-health.sh [host] [port] [timeout_seconds]
HOST="${1:-localhost}"
PORT="${2:-3000}"
TIMEOUT="${3:-30}"

echo "Waiting for health check at http://${HOST}:${PORT}/health ..."
elapsed=0
while [ "$elapsed" -lt "$TIMEOUT" ]; do
	if curl -sf "http://${HOST}:${PORT}/health" > /dev/null 2>&1; then
		echo "Health check passed after ${elapsed}s."
		exit 0
	fi
	sleep 1
	elapsed=$((elapsed + 1))
done
echo "Health check failed after ${TIMEOUT}s."
exit 1