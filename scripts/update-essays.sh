#!/bin/bash

# Simple script to update essay content
# Just copy the markdown files from texts/ to frontend/public/essays/

echo "Updating essay content..."

cp texts/Epi-Logos-Essay-Rewrite.md frontend/public/essays/epi-logos.md
cp texts/QL-Essay-Rewrite.md frontend/public/essays/ql.md
cp texts/MEF-flagship-Essay-Rewrite.md frontend/public/essays/mef.md

echo "✅ Essays updated! Changes will be live on next page load."
echo ""
echo "Files updated:"
echo "  - frontend/public/essays/epi-logos.md"
echo "  - frontend/public/essays/ql.md"
echo "  - frontend/public/essays/mef.md"
