/**
 * WhatsApp QR Code Connection Service
 * Supports Evolution API (open-source, QR code based) popular in Brazil.
 * Docs: https://doc.evolution-api.com
 *
 * Env vars needed:
 *   EVOLUTION_API_URL=https://your-evolution-api.com
 *   EVOLUTION_API_KEY=your-global-api-key
 *
 * Mock Mode:
 * When WHATSAPP_MOCK_MODE=true, returns fake QR codes for testing.
 */

const BASE_URL = process.env.EVOLUTION_API_URL ?? ''
const API_KEY = process.env.EVOLUTION_API_KEY ?? ''
const MOCK_MODE = process.env.WHATSAPP_MOCK_MODE === 'true'

function headers() {
  return {
    'Content-Type': 'application/json',
    apikey: API_KEY,
  }
}

/**
 * Generate a mock QR code for testing in mock mode.
 * Returns a small 1x1 PNG in base64 format with mock data.
 */
function generateMockQRCode(tenantId: string): QRCodeResponse {
  // A minimal valid PNG (1x1 transparent pixel) in base64
  const minimalPNG = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg=='

  // Generate a mock code string based on tenant
  const mockCode = `mock-qr-${tenantId.slice(0, 8)}-${Date.now()}`

  return {
    base64: `data:image/png;base64,${minimalPNG}`,
    code: mockCode,
  }
}

export interface QRCodeResponse {
  base64: string // data:image/png;base64,...
  code: string   // raw QR code string
}

export interface ConnectionStatus {
  state: 'open' | 'close' | 'connecting'
  instance: string
  number?: string
}

/**
 * Create (or re-use) an Evolution API instance for a tenant.
 * Instance name is derived from tenantId to ensure uniqueness.
 */
export async function createInstance(tenantId: string): Promise<void> {
  if (!BASE_URL || !API_KEY) return

  const instanceName = `retoquei-${tenantId.slice(0, 8)}`
  await fetch(`${BASE_URL}/instance/create`, {
    method: 'POST',
    headers: headers(),
    body: JSON.stringify({
      instanceName,
      qrcode: true,
      integration: 'WHATSAPP-BAILEYS',
    }),
  })
}

/**
 * Get the current QR code for an instance.
 * Returns base64 image and raw code string.
 * In mock mode, returns a fake QR code for testing.
 */
export async function getQRCode(tenantId: string): Promise<QRCodeResponse | null> {
  // In mock mode, return a mock QR code
  if (MOCK_MODE) {
    return generateMockQRCode(tenantId)
  }

  if (!BASE_URL || !API_KEY) return null

  const instanceName = `retoquei-${tenantId.slice(0, 8)}`
  try {
    const res = await fetch(`${BASE_URL}/instance/connect/${instanceName}`, {
      method: 'GET',
      headers: headers(),
    })
    if (!res.ok) return null
    const data = await res.json() as { base64?: string; code?: string }
    if (!data.base64) return null
    return {
      base64: data.base64.startsWith('data:') ? data.base64 : `data:image/png;base64,${data.base64}`,
      code: data.code ?? '',
    }
  } catch {
    return null
  }
}

/**
 * Get the connection status of an instance.
 * In mock mode, returns a connecting status.
 */
export async function getConnectionStatus(tenantId: string): Promise<ConnectionStatus> {
  const instanceName = `retoquei-${tenantId.slice(0, 8)}`

  // In mock mode, return a mock connecting status
  if (MOCK_MODE) {
    return {
      state: 'connecting',
      instance: instanceName,
    }
  }

  if (!BASE_URL || !API_KEY) {
    return { state: 'close', instance: instanceName }
  }

  try {
    const res = await fetch(`${BASE_URL}/instance/connectionState/${instanceName}`, {
      method: 'GET',
      headers: headers(),
    })
    if (!res.ok) return { state: 'close', instance: instanceName }
    const data = await res.json() as { instance?: { state?: string }; number?: string }
    return {
      state: (data.instance?.state as ConnectionStatus['state']) ?? 'close',
      instance: instanceName,
      number: data.number,
    }
  } catch {
    return { state: 'close', instance: instanceName }
  }
}

/**
 * Disconnect and delete an instance.
 */
export async function disconnectInstance(tenantId: string): Promise<void> {
  if (!BASE_URL || !API_KEY) return
  const instanceName = `retoquei-${tenantId.slice(0, 8)}`
  await fetch(`${BASE_URL}/instance/delete/${instanceName}`, {
    method: 'DELETE',
    headers: headers(),
  }).catch(() => {})
}

/**
 * Send a text message via Evolution API.
 * Used as an alternative to Meta WhatsApp Cloud API.
 */
export async function sendMessage(tenantId: string, to: string, text: string): Promise<boolean> {
  if (!BASE_URL || !API_KEY) return false
  const instanceName = `retoquei-${tenantId.slice(0, 8)}`
  try {
    const res = await fetch(`${BASE_URL}/message/sendText/${instanceName}`, {
      method: 'POST',
      headers: headers(),
      body: JSON.stringify({
        number: to.replace('+', '').replace(/\D/g, ''),
        text,
      }),
    })
    return res.ok
  } catch {
    return false
  }
}

export function isEvolutionApiConfigured(): boolean {
  return Boolean(BASE_URL && API_KEY)
}
