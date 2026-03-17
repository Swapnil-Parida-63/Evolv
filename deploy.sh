#!/bin/bash
# ─────────────────────────────────────────────────────────────────────────────
# Evolv2 — Re-deploy Script (run after every code push to GitHub)
# Usage: bash deploy.sh
# ─────────────────────────────────────────────────────────────────────────────
set -e

APP_DIR="/home/ubuntu/evolv"
EC2_DNS="ec2-13-201-11-251.ap-south-1.compute.amazonaws.com"

echo "━━━ [1/4] Pull latest code ━━━"
cd "$APP_DIR"
git pull origin main

echo "━━━ [2/4] Install server deps ━━━"
cd "$APP_DIR/server"
npm install --production

echo "━━━ [3/4] Rebuild React client ━━━"
cd "$APP_DIR/client"
npm install
npm run build

echo "━━━ [4/4] Restart PM2 ━━━"
pm2 restart evolv

echo ""
echo "✅  Re-deploy complete! → http://$EC2_DNS:5000"
echo "   Logs: pm2 logs evolv"
