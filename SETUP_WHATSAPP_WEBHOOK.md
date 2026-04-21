# 🔧 WhatsApp Cloud API Setup Guide

**Complete step-by-step guide to configure WhatsApp real-time messaging in Retoquei**

---

## Prerequisites

- ✅ Meta/Facebook Business Account
- ✅ Vercel deployment URL (or ngrok for local testing)
- ✅ Admin access to WhatsApp Business Account

---

## Step 1: Get WhatsApp Business Account & API Access

### 1.1 Create Meta Business Account
1. Go to https://business.facebook.com
2. Click "Create Account"
3. Fill in business details
4. Verify email

### 1.2 Create WhatsApp Business App
1. Go to https://developers.facebook.com/apps
2. Click "Create App"
3. Choose "Business"
4. App name: "Retoquei"
5. Select business account
6. Skip quick start

### 1.3 Add WhatsApp Product
1. In app dashboard → "Products"
2. Search for "WhatsApp"
3. Click "Set Up"
4. Choose "WhatsApp Business Platform"

---

## Step 2: Get Phone Number ID & Access Token

### 2.1 Create Phone Number
1. In WhatsApp admin panel → "Phone Numbers"
2. Click "Add Phone Number"
3. Choose "Get Started with a Test Number" (for development)
4. Confirm with 6-digit code via SMS
5. **Save the Phone Number ID** (you'll need this)

### 2.2 Generate Access Token
1. Dashboard → "Settings" → "Accounts"
2. Select your business account
3. Click "System User"
4. Create new system user named "retoquei-app"
5. Assign app to system user
6. Generate new token
7. **Save the Access Token** (only shown once!)

**Token Scope Required**: `whatsapp_business_messaging`

### 2.3 Configure Webhook
1. Dashboard → "Settings" → "Webhooks"
2. Under "WhatsApp Business Account", click "Edit"
3. Set Webhook URL to: `https://yourdomain.vercel.app/api/chats/webhook`
4. Set Verify Token to: `your-secure-random-string-here`
5. Subscribe to webhook fields: `messages`, `message_status`
6. Click "Save"

---

## Step 3: Configure Environment Variables

### 3.1 Update `.env.local` (Development)

```bash
# WhatsApp Configuration
WHATSAPP_PHONE_NUMBER_ID=1234567890123456
WHATSAPP_ACCESS_TOKEN=EAABs7CoZCxYwBAOZA...
WHATSAPP_API_VERSION=v19.0
WHATSAPP_WEBHOOK_VERIFY_TOKEN=my-super-secret-webhook-token-12345
```

Replace with your actual values:
- `WHATSAPP_PHONE_NUMBER_ID` → From Step 2.1
- `WHATSAPP_ACCESS_TOKEN` → From Step 2.2
- `WHATSAPP_WEBHOOK_VERIFY_TOKEN` → Create your own random string (32+ chars recommended)

### 3.2 Update Vercel Environment Variables (Production)

1. Go to Vercel dashboard
2. Select "retoquei" project
3. Settings → Environment Variables
4. Add these variables:
   - Name: `WHATSAPP_PHONE_NUMBER_ID` → Value: `1234567890123456`
   - Name: `WHATSAPP_ACCESS_TOKEN` → Value: `EAABs7CoZCxYwBAOZA...`
   - Name: `WHATSAPP_API_VERSION` → Value: `v19.0`
   - Name: `WHATSAPP_WEBHOOK_VERIFY_TOKEN` → Value: `my-super-secret-webhook-token-12345`
5. Click "Save"
6. Redeploy application

---

## Step 4: Verify Webhook Connection

### 4.1 Test Locally with ngrok

For development testing without deploying:

```bash
# Install ngrok
brew install ngrok

# Start ngrok tunnel
ngrok http 3000

# You'll see:
# Forwarding  https://abc123xyz.ngrok.io -> http://localhost:3000

# Use this URL in Meta Dashboard webhook
# https://abc123xyz.ngrok.io/api/chats/webhook
```

### 4.2 Verify Webhook in Meta Dashboard

1. Dashboard → Settings → Webhooks
2. Click "Test Webhook"
3. System sends GET request to verify token
4. Should respond with `HTTP 200` and your token

**If verification fails:**
- ✓ Check webhook URL is correct
- ✓ Check verify token matches exactly (case-sensitive)
- ✓ Check URL is publicly accessible (not localhost)
- ✓ Check network isn't blocking Meta's IP addresses

---

## Step 5: Test Message Flow

### 5.1 Send Test Message (Dashboard → Customer)

```bash
# 1. Get access token from Supabase
# (Login to dashboard, check browser console)
TOKEN="your-supabase-jwt-token"

# 2. Create chat (if not exists)
curl -X POST http://localhost:3000/api/chats \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "clientId": "550e8400-e29b-41d4-a716-446655440000"
  }'

# Response should include:
# "id": "chat-123"
# "isWhatsAppConnected": true
# "clientPhoneNumber": "+5511999999999"

# 3. Send message
curl -X POST http://localhost:3000/api/chats/chat-123/messages \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"content":"Teste: Olá! Essa é uma mensagem de teste."}'

# Response should show:
# "status": "sent"
# "whatsappMessageId": "wamid.HBEFxxx..."
```

### 5.2 Verify Message Sent

Check WhatsApp app on customer's phone:
- ✓ Message arrives instantly
- ✓ Shows your business number
- ✓ Customer can reply

### 5.3 Receive Inbound Message

1. Customer replies on WhatsApp
2. Meta webhook triggers
3. Check dashboard chat:
   - ✓ New message appears instantly
   - ✓ Direction shows as "inbound"
   - ✓ Status shows as "delivered"

### 5.4 Check Status Updates

As customer reads message:
1. Meta sends status webhook
2. Message in dashboard updates:
   - ✓ Status changes to "read"
   - ✓ Icon changes to blue check marks
   - ✓ Update happens in real-time via Supabase Realtime

---

## Step 6: Production Deployment

### 6.1 Deploy to Vercel

```bash
# Make sure all code is committed
git add -A
git commit -m "feat: add WhatsApp real-time integration"

# Push to main (auto-deploys)
git push origin main

# Wait for Vercel build to complete
# Check https://vercel.com/your-account/retoquei
```

### 6.2 Update Meta Webhook URL

1. Meta Dashboard → Settings → Webhooks
2. Update webhook URL from test to production:
   - Old: `https://abc123xyz.ngrok.io/api/chats/webhook`
   - New: `https://retoquei-tawny.vercel.app/api/chats/webhook`
3. Click "Test Webhook" to verify
4. Should respond with `HTTP 200`

### 6.3 Enable Test Messages (Optional)

For testing before going live:
1. Meta Dashboard → Phone Numbers
2. Select phone number
3. "Manage phone number settings"
4. Under "Test messages", click "Add" to add your phone number
5. You can test sending messages to yourself

---

## Step 7: Production Monitoring

### Monitor Webhook Health

```bash
# Check recent webhook deliveries in Meta Dashboard:
# Settings → Webhooks → WhatsApp Business Account
# Look for delivery status of recent requests
```

### Monitor in Retoquei Logs

Vercel logs visible at:
- https://vercel.com/your-account/retoquei → Logs

Look for entries like:
```
[WhatsApp Chat] Created chat abc-123 with inbound message
[WhatsApp Chat] Updated message status to delivered
```

### Monitor Database

Use Supabase dashboard:
1. SQL Editor
2. Query recent messages:
   ```sql
   SELECT * FROM chat_messages 
   ORDER BY created_at DESC 
   LIMIT 10;
   ```

---

## Step 8: Move to Production Phone Number

Once testing is complete:

### 8.1 Register Business Phone Number

1. WhatsApp Manager → "Phone numbers"
2. Click "Add number"
3. Enter your actual business phone number
4. Verify with code sent to phone
5. **Save new Phone Number ID**

### 8.2 Update Environment Variables

Update `WHATSAPP_PHONE_NUMBER_ID` in:
- `.env.local` (development)
- Vercel project settings (production)
- Redeploy if needed

### 8.3 Request Message Template Approval

For production, you should use approved templates:
1. WhatsApp Manager → Message Templates
2. Create templates for common responses
3. Meta reviews and approves (24-48 hours)
4. Use `sendTemplateMessage()` in code

---

## Troubleshooting

### ❌ "Webhook returning 403 Forbidden"

**Cause**: Verify token mismatch

**Solution**:
```bash
# Check in Meta Dashboard
# Settings → Webhooks → Verify Token
# Must match exactly with WHATSAPP_WEBHOOK_VERIFY_TOKEN

# Regenerate token:
# 1. Copy a new random string
# 2. Update both Meta dashboard and .env
# 3. Restart application
```

### ❌ "Messages not sending (HTTP 401)"

**Cause**: Invalid access token

**Solution**:
```bash
# Check token isn't expired
# Meta tokens expire after certain time

# Regenerate:
# 1. Dashboard → System User → Regenerate Token
# 2. Update WHATSAPP_ACCESS_TOKEN
# 3. Redeploy to Vercel
```

### ❌ "Webhook not receiving messages"

**Cause**: Webhook URL wrong or not publicly accessible

**Solution**:
```bash
# Test webhook URL manually:
curl -X GET "https://yourdomain.vercel.app/api/chats/webhook?hub.mode=subscribe&hub.challenge=test&hub.verify_token=your-token"

# Should respond with "test" if correct

# If 404:
# - Check URL is correct
# - Check DNS resolves properly
# - Check firewall isn't blocking

# If 403:
# - Check token matches
```

### ❌ "Chat shows 'Sem WhatsApp' status"

**Cause**: `isWhatsAppConnected` is false

**Solution**:
- Check `clientPhoneNumber` is set on Chat record
- Check it's in E.164 format: `+5511999999999`
- Check customer's phone in Retoquei matches WhatsApp number

### ❌ "Real-time updates not showing"

**Cause**: Supabase Realtime not enabled

**Solution**:
1. Supabase dashboard → Project → Replication
2. Enable replication for `chat_messages` table
3. Or check browser console for connection errors

---

## Security Checklist

- [ ] Access token stored only in environment variables
- [ ] Access token never logged or printed
- [ ] Webhook verify token is random 32+ characters
- [ ] Webhook endpoint validates tenant ownership
- [ ] Phone numbers normalized to E.164 format
- [ ] Message content sanitized before storage
- [ ] HTTPS only (no HTTP webhook endpoints)
- [ ] Rate limiting enabled on webhook endpoint
- [ ] Database backups configured

---

## Performance Tips

1. **Index optimization**: Already configured
   - Indexes on `chat_id`, `whatsappMessageId`
   - Allows fast webhook processing

2. **Batch operations**: If sending many messages
   - Use BullMQ job queue (optional)
   - Prevents rate limiting from Meta

3. **Caching**: Consider for frequently accessed chats
   - Supabase has query caching
   - ChatWindow uses Realtime (no polling)

---

## Next Steps

1. ✅ Configure environment variables
2. ✅ Test webhook locally with ngrok
3. ✅ Deploy to Vercel
4. ✅ Test with production phone number
5. ✅ Monitor logs for errors
6. ✅ (Optional) Create message templates for approval
7. ✅ (Optional) Set up monitoring/alerting

**You're ready to send real-time WhatsApp messages! 🚀**
