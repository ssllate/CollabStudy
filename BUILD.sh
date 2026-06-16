#!/bin/bash
echo "=== CollabStudy Build ==="
npm install && npm run build:win
echo "Done! Check ./dist/"
