#!/bin/bash
# Usage: save-cron-output.sh <folder> <title> <content_file>
# Saves a cron output document to public/cron-data/ and pushes to GitHub

REPO_DIR="$HOME/Desktop/second-brain"
CRON_DIR="$REPO_DIR/public/cron-data"
INDEX="$CRON_DIR/index.json"

FOLDER="$1"
TITLE="$2"
CONTENT_FILE="$3"

if [ -z "$FOLDER" ] || [ -z "$TITLE" ] || [ -z "$CONTENT_FILE" ]; then
  echo "Usage: save-cron-output.sh <folder> <title> <content_file>"
  exit 1
fi

# Generate unique ID and timestamp
ID=$(uuidgen | tr '[:upper:]' '[:lower:]')
TIMESTAMP=$(date -u +"%Y-%m-%dT%H:%M:%S.000Z")

# Read content and escape for JSON
CONTENT=$(cat "$CONTENT_FILE" | python3 -c "import sys,json; print(json.dumps(sys.stdin.read()))")

# Create the document JSON file
DOC_FILE="$CRON_DIR/${ID}.json"
cat > "$DOC_FILE" << ENDJSON
{
  "id": "${ID}",
  "title": $(python3 -c "import json; print(json.dumps('$TITLE'))"),
  "content": ${CONTENT},
  "folder": "${FOLDER}",
  "created_at": "${TIMESTAMP}"
}
ENDJSON

# Update index — add new doc ID
cd "$REPO_DIR"
python3 -c "
import json, os
index_path = '$INDEX'
try:
    with open(index_path) as f:
        index = json.load(f)
except:
    index = []
index.append('${ID}')
# Keep last 200 entries
index = index[-200:]
with open(index_path, 'w') as f:
    json.dump(index, f, indent=2)
"

# Commit and push
cd "$REPO_DIR"
git add public/cron-data/
git commit -m "cron: ${FOLDER} — $(date '+%Y-%m-%d %H:%M')" --no-verify 2>/dev/null
git push origin main 2>/dev/null

echo "Saved: $DOC_FILE"
