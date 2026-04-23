# 📱 Baileys WhatsApp Server for Retoquei

WhatsApp messaging server for Retoquei CRM using Baileys library.

## 🚀 Quick Start

### Local Development
```bash
npm install
npm run dev
```

Server runs on `http://localhost:3001`

### Deployment

#### Railway
1. Push code to GitHub
2. Railway auto-deploys
3. Set `RETOQUEI_URL` environment variable
4. Done!

#### Render
1. Connect GitHub repo
2. Root directory: `baileys-server`
3. Deploy!

## 🔌 API Endpoints

### Get QR Code
```
GET /api/qr

Response:
{
  "status": "waiting|connected|initializing",
  "qr": "data:image/png;base64,..."
}
```

### Get Status
```
GET /api/status

Response:
{
  "connected": true,
  "status": "connected"
}
```

### Send Message
```
POST /api/send

Body:
{
  "to": "5571993357290",
  "message": "Hello!"
}

Response:
{
  "success": true,
  "messageId": "3EB0...",
  "to": "5571993357290"
}
```

### Health Check
```
GET /health

Response:
{
  "status": "ok",
  "connected": true
}
```

## 📝 Environment Variables

```
PORT=3001              # Server port
RETOQUEI_URL=...       # Retoquei API URL
NODE_ENV=production    # Environment
```

## 📂 Directory Structure

```
baileys-server/
├── src/
│   └── index.ts       # Main server
├── auth_info/         # WhatsApp session (auto-created)
├── package.json
├── tsconfig.json
├── Dockerfile
├── railway.json
└── README.md
```

## 🔄 How It Works

1. Connect phone via QR code scan
2. Baileys maintains WebSocket to WhatsApp Web
3. Incoming messages → webhook to Retoquei
4. Outgoing messages → sent via WhatsApp Web
5. All fully automated

## 🎯 Deployment Providers

### Railway (Recommended)
- Free tier: 500 hrs/month
- Always on: ✅
- Cost: R$ 0-20/month

### Render
- Free tier: auto-sleeps after 15 min inactivity
- Always on: Only paid tier
- Cost: R$ 50+/month

### Heroku
- Free tier: ❌ No longer available
- Cost: R$ 100+/month

## 📊 Performance

- Message latency: 1-5 seconds
- Concurrent connections: 100+
- Memory usage: ~150MB
- CPU: Minimal

## 🔐 Security Notes

- Auth tokens stored in `auth_info/` (not committed)
- Session persists across restarts
- Webhook validated via Retoquei auth

## 🚨 Troubleshooting

### QR Code Won't Load
- Check server is running
- Check RETOQUEI_URL is set
- Check firewall isn't blocking port

### Messages Not Sending
- Check phone has internet
- Check WhatsApp isn't logged out elsewhere
- Check phone number format (E.164)

### Server Crashes
- Check logs: `railway logs` or `render logs`
- Check phone was disconnected
- Restart and scan QR again

## 📞 Support

See `../BAILEYS_SETUP.md` for complete setup guide.
