#!/bin/bash
# ─────────────────────────────────────────────────────────────────────────────
# Evolv2 — EC2 First-Time Setup Script
# Run this ONCE on a fresh Ubuntu EC2 instance after SSH-ing in.
# Usage: bash ec2-setup.sh
# ─────────────────────────────────────────────────────────────────────────────
set -e

EC2_DNS="ec2-13-201-11-251.ap-south-1.compute.amazonaws.com"
REPO_URL="https://github.com/Swapnil-Parida-63/Evolv"
APP_DIR="/home/ubuntu/evolv"

echo "━━━ [1/8] System update ━━━"
sudo apt-get update -y && sudo apt-get upgrade -y

echo "━━━ [2/8] Install Node.js 20 ━━━"
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs
echo "Node: $(node -v) | npm: $(npm -v)"

echo "━━━ [3/8] Install PM2 & git ━━━"
sudo npm install -g pm2
sudo apt-get install -y git

echo "━━━ [4/8] Clone repository ━━━"
if [ -d "$APP_DIR" ]; then
  echo "Repo already cloned — pulling latest."
  cd "$APP_DIR" && git pull
else
  git clone "$REPO_URL" "$APP_DIR"
fi
cd "$APP_DIR"

echo "━━━ [5/8] Write server .env ━━━"
# NOTE: Fill in real secret values below before running this script.
# This file is NOT committed to git — you must create it manually on EC2.
cat > "$APP_DIR/server/.env" << 'ENVEOF'
MONGO_URI=<YOUR_MONGO_URI>
JWT_SECRET=<YOUR_JWT_SECRET>
GROQ_API_KEY=<YOUR_GROQ_API_KEY>
PORT=5000
NODE_ENV=production

# Google OAuth
GOOGLE_CLIENT_ID=<YOUR_GOOGLE_CLIENT_ID>
GOOGLE_CLIENT_SECRET=<YOUR_GOOGLE_CLIENT_SECRET>
GOOGLE_CALLBACK_URL=http://ec2-13-201-11-251.ap-south-1.compute.amazonaws.com:5000/api/auth/google/callback
CLIENT_URL=http://ec2-13-201-11-251.ap-south-1.compute.amazonaws.com:5000

# AWS S3
AWS_ACCESS_KEY_ID=<YOUR_AWS_ACCESS_KEY_ID>
AWS_SECRET_ACCESS_KEY=<YOUR_AWS_SECRET_ACCESS_KEY>
AWS_REGION=ap-south-1
AWS_BUCKET_NAME=evolv-user-assests-2026
ENVEOF

echo ""
echo "⚠️  IMPORTANT: Edit $APP_DIR/server/.env and replace all <PLACEHOLDER> values!"
echo "   Run: nano $APP_DIR/server/.env"
echo ""
read -p "Press ENTER once you have filled in the .env values..."

echo "━━━ [6/8] Install server dependencies ━━━"
cd "$APP_DIR/server"
npm install --production

echo "━━━ [7/8] Build React client ━━━"
cd "$APP_DIR/client"
npm install
npm run build

echo "━━━ [8/8] Start server with PM2 ━━━"
cd "$APP_DIR/server"
pm2 delete evolv 2>/dev/null || true
pm2 start server.js --name evolv
pm2 save

echo "━━━ Configuring PM2 auto-restart on reboot ━━━"
sudo env PATH=$PATH:/usr/bin pm2 startup systemd -u ubuntu --hp /home/ubuntu
pm2 save

echo ""
echo "✅  Setup complete!"
echo "   App running at: http://$EC2_DNS:5000"
echo "   View logs:      pm2 logs evolv"
