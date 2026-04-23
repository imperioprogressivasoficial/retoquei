import express from 'express'
import cors from 'cors'
import QRCode from 'qrcode'
import {
  default as makeWASocket,
  useMultiFileAuthState,
  DisconnectReason,
  proto,
} from '@whiskeysockets/baileys'
import pino from 'pino'
import fs from 'fs'
import path from 'path'

const app = express()
const PORT = process.env.PORT || 3001
const RETOQUEI_URL = process.env.RETOQUEI_URL || 'http://localhost:3000'

app.use(cors())
app.use(express.json())

const logger = pino({ level: 'info' })

// Store QR code and connection status
let qrCode: string | null = null
let isConnected = false
let socket: any = null

// Initialize WhatsApp connection
async function initializeWhatsApp() {
  try {
    logger.info('Initializing WhatsApp connection...')

    const { state, saveCreds } = await useMultiFileAuthState(
      path.join(process.cwd(), 'auth_info'),
    )

    socket = makeWASocket({
      auth: state,
      printQRInTerminal: false,
      logger: pino({ level: 'silent' }),
      browser: ['Retoquei CRM', 'Chrome', '120.0.0.0'],
      syncFullHistory: false,
    })

    // Handle QR Code
    socket.ev.on('connection.update', async (update: any) => {
      const { connection, lastDisconnect, qr } = update

      if (qr) {
        logger.info('QR Code generated, scan to connect')
        qrCode = await QRCode.toDataURL(qr)
      }

      if (connection === 'open') {
        logger.info('✅ WhatsApp connected successfully!')
        isConnected = true
        qrCode = null
      }

      if (connection === 'close') {
        isConnected = false
        const code = (lastDisconnect?.error as any)?.output?.statusCode
        if (code !== DisconnectReason.loggedOut && code !== 401) {
          logger.warn('Reconnecting...')
          setTimeout(initializeWhatsApp, 3000)
        } else {
          logger.info('User logged out')
        }
      }
    })

    // Handle incoming messages
    socket.ev.on('messages.upsert', async (m: any) => {
      const msg = m.messages[0]

      if (!msg.key.fromMe && msg.message) {
        logger.info(`Message from ${msg.key.remoteJid}: ${msg.message.conversation || ''}`)

        // Send to Retoquei webhook
        try {
          const phoneNumber = msg.key.remoteJid?.replace('@s.whatsapp.net', '') || ''
          const messageText =
            msg.message.conversation ||
            msg.message.extendedTextMessage?.text ||
            '[Media message]'

          await fetch(`${RETOQUEI_URL}/api/chats/baileys-webhook`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              type: 'message',
              from: phoneNumber,
              body: messageText,
              messageId: msg.key.id,
              timestamp: msg.messageTimestamp,
            }),
          })

          logger.info('Webhook sent to Retoquei')
        } catch (err) {
          logger.error('Error sending webhook:', err)
        }
      }
    })

    // Save credentials
    socket.ev.on('creds.update', saveCreds)
  } catch (err) {
    logger.error('Error initializing WhatsApp:', err)
    setTimeout(initializeWhatsApp, 5000)
  }
}

// API Endpoints

// Get QR Code
app.get('/api/qr', (req, res) => {
  if (isConnected) {
    return res.json({ status: 'connected', qr: null })
  }
  if (qrCode) {
    return res.json({ status: 'waiting', qr: qrCode })
  }
  res.json({ status: 'initializing', qr: null })
})

// Get connection status
app.get('/api/status', (req, res) => {
  res.json({
    connected: isConnected,
    status: isConnected ? 'connected' : 'disconnected',
  })
})

// Send message
app.post('/api/send', async (req, res) => {
  try {
    const { to, message } = req.body

    if (!isConnected) {
      return res.status(503).json({ error: 'WhatsApp not connected' })
    }

    if (!to || !message) {
      return res.status(400).json({ error: 'Missing phone or message' })
    }

    // Normalize phone number
    const phoneNumber = to.replace(/\D/g, '')
    const jid = `${phoneNumber}@s.whatsapp.net`

    const response = await socket.sendMessage(jid, { text: message })

    logger.info(`Message sent to ${to}`)

    res.json({
      success: true,
      messageId: response.key.id,
      to: phoneNumber,
    })
  } catch (err: any) {
    logger.error('Error sending message:', err)
    res.status(500).json({ error: err.message })
  }
})

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', connected: isConnected })
})

// Start server
app.listen(PORT, () => {
  logger.info(`✅ Baileys server running on port ${PORT}`)
  logger.info(`📱 Go to: ${RETOQUEI_URL}/chat to use WhatsApp`)

  // Initialize WhatsApp
  initializeWhatsApp()
})

// Graceful shutdown
process.on('SIGINT', () => {
  logger.info('Shutting down...')
  if (socket) {
    socket.end()
  }
  process.exit(0)
})
