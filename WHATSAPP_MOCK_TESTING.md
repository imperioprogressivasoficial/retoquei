# WhatsApp Mock Mode Testing Guide

## Current Configuration

**Environment File**: `.env.local`

```
WHATSAPP_MOCK_MODE=true ✓ (Enabled)
WHATSAPP_WEBHOOK_VERIFY_TOKEN=retoquei-webhook-secret
WHATSAPP_PHONE_NUMBER_ID= (Empty - using mock mode)
WHATSAPP_ACCESS_TOKEN= (Empty - using mock mode)
```

## Endpoints Ready for Testing

### 1. GET /api/whatsapp/qr
**Status**: ✅ READY (Fixed - Mock QR Code Support)

Returns a mock QR code for testing without Evolution API.

**What was fixed:**
- Added `WHATSAPP_MOCK_MODE` check to `whatsapp-qr.service.ts`
- Created `generateMockQRCode()` function that returns a valid PNG base64
- Updated `getQRCode()` to return mock QR when in mock mode
- Updated endpoint to skip Evolution API instance creation in mock mode

**Response Format** (when authenticated):
```json
{
  "base64": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==",
  "code": "mock-qr-<tenant_id>-<timestamp>"
}
```

**Test Command**:
```bash
curl -X GET http://localhost:3000/api/whatsapp/qr \
  -H "Cookie: <your-auth-cookie>"
```

**Expected Result**:
- Status 200 with QR code base64 data
- Can be displayed as an image in UI

---

### 2. GET /api/whatsapp/status
**Status**: ✅ READY (Fixed - Mock Status Support)

Returns WhatsApp connection status in mock mode.

**What was fixed:**
- Added early return for mock mode that bypasses Evolution API
- Returns `state: 'connecting'` to indicate testing state
- Includes `mockMode: true` flag to identify test responses

**Response Format** (when authenticated):
```json
{
  "state": "connecting",
  "instance": "retoquei-<tenant_id>",
  "configured": true,
  "mockMode": true
}
```

**Test Command**:
```bash
curl -X GET http://localhost:3000/api/whatsapp/status \
  -H "Cookie: <your-auth-cookie>"
```

**Expected Result**:
- Status 200
- `mockMode: true` indicates testing mode
- `state: "connecting"` shows simulated connecting state

---

### 3. POST /api/webhooks/whatsapp
**Status**: ✅ READY (Enhanced Logging)

Webhook endpoint for receiving WhatsApp messages and delivery status updates.

**What was fixed:**
- Added comprehensive logging for webhook verification
- Added logging for inbound webhook events
- Improved error handling with detailed console output

**Verification Flow** (GET with verification parameters):
```bash
curl -X GET "http://localhost:3000/api/webhooks/whatsapp?hub.mode=subscribe&hub.verify_token=retoquei-webhook-secret&hub.challenge=test-challenge"
```

**Expected Result**:
- Status 200
- Response body: `test-challenge` (echoed back)
- Console logs: `[WhatsApp Webhook] ✅ Verification successful`

**Webhook Event Reception** (POST with JSON payload):
```bash
curl -X POST http://localhost:3000/api/webhooks/whatsapp \
  -H "Content-Type: application/json" \
  -H "x-idempotency-key: test-event-1" \
  -d '{
    "object": "whatsapp_business_account",
    "entry": [
      {
        "id": "123456789",
        "changes": [
          {
            "value": {
              "messaging_product": "whatsapp",
              "metadata": {
                "display_phone_number": "5511999999999",
                "phone_number_id": "1234567890"
              },
              "messages": [
                {
                  "from": "5511988888888",
                  "id": "wamid.test123",
                  "timestamp": "1234567890",
                  "type": "text",
                  "text": { "body": "Test message" }
                }
              ]
            },
            "field": "messages"
          }
        ]
      }
    ]
  }'
```

**Expected Result**:
- Status 200: `{"status": "ok"}`
- Event stored in database (idempotency check)
- Console logs showing event processing

---

## Mock Mode Behavior

### Message Sending
When `WHATSAPP_MOCK_MODE=true`, the MockMessagingProvider is used:

```typescript
// Messages are logged to console instead of sent to Meta API
[MockWhatsApp] ✅ Message sent
  To: 5511999999999
  Body: Hello, this is a test message
  ID: mock_1234567890_abc123

// Delivery is simulated after 1 second
[MockWhatsApp] 📬 Delivered: mock_1234567890_abc123
```

### Templates
Template messages work in mock mode with variable substitution:

```typescript
[MockWhatsApp] ✅ Template message sent
  To: 5511999999999
  Template: birthday_message
  Vars: {"first_name":"João","salon_name":"Salon XYZ"}
  ID: mock_tpl_1234567890_abc123
```

---

## Testing Checklist

- [ ] `WHATSAPP_MOCK_MODE=true` is set in `.env.local`
- [ ] `/api/whatsapp/qr` returns 200 with mock QR code (authenticated)
- [ ] `/api/whatsapp/status` returns 200 with `mockMode: true` (authenticated)
- [ ] Webhook verification GET request returns 200 with challenge
- [ ] Webhook POST with test payload returns 200 with `{"status": "ok"}`
- [ ] Console logs show `[MockWhatsApp]` and `[WhatsApp Webhook]` messages
- [ ] Messages sent via app are logged to stdout, not sent to Meta API
- [ ] No Evolution API calls are made (check network tab)

---

## Production Configuration

When ready to use real WhatsApp:

1. Set `WHATSAPP_MOCK_MODE=false`
2. Configure Evolution API:
   ```
   EVOLUTION_API_URL=https://your-evolution-api.com
   EVOLUTION_API_KEY=your-global-api-key
   ```
   OR use Meta Cloud API:
   ```
   WHATSAPP_PHONE_NUMBER_ID=1234567890
   WHATSAPP_ACCESS_TOKEN=your-meta-token
   ```

The system will automatically switch providers based on env vars.

---

## Files Modified

1. **src/services/whatsapp-qr.service.ts**
   - Added `MOCK_MODE` constant
   - Added `generateMockQRCode()` function
   - Updated `getQRCode()` to return mock QR in mock mode
   - Updated `getConnectionStatus()` to return mock status in mock mode

2. **src/app/api/whatsapp/qr/route.ts**
   - Skip Evolution API instance creation in mock mode
   - Improved error message to mention mock mode option

3. **src/app/api/whatsapp/status/route.ts**
   - Early return for mock mode
   - Added `mockMode` flag to response

4. **src/app/api/webhooks/whatsapp/route.ts**
   - Added verification logging (GET)
   - Added inbound event logging (POST)
   - Improved error handling

---

## Troubleshooting

### Endpoint returns 401 (Unauthorized)
- Make sure you're authenticated with Supabase
- Pass auth cookies in requests

### Endpoint returns 400 (No workspace)
- Create or select a workspace in the app
- Ensure your user has at least one workspace

### Mock QR not displaying
- Check base64 is properly formatted
- Try opening the data URL in a new tab to test
- Verify the response includes `base64` field starting with `data:image/png;base64,`

### Webhook verification fails
- Verify `hub.verify_token` matches `WHATSAPP_WEBHOOK_VERIFY_TOKEN`
- Check that `hub.mode=subscribe` is included
- Verify `hub.challenge` is passed and returned

---

**Last Updated**: 2026-04-02
**Status**: All WhatsApp mock endpoints ready for testing
