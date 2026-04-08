import type { IMessagingProvider } from './messaging.interface'
import { MockMessagingProvider } from './mock.provider'
import { WhatsAppCloudProvider } from './whatsapp-cloud.provider'
import { EvolutionApiProvider } from './evolution.provider'

let _instance: IMessagingProvider | null = null

export function getMessagingProvider(): IMessagingProvider {
  if (_instance) return _instance

  // Priority: Evolution API > WhatsApp Cloud > Mock
  if (process.env.EVOLUTION_API_URL && process.env.EVOLUTION_API_KEY) {
    _instance = new EvolutionApiProvider()
  } else if (process.env.WHATSAPP_ACCESS_TOKEN && process.env.WHATSAPP_PHONE_NUMBER_ID) {
    _instance = new WhatsAppCloudProvider()
  } else {
    _instance = new MockMessagingProvider()
  }

  console.log(`[Messaging] Provider: ${_instance.name}`)
  return _instance
}

/** Force a new instance (useful for testing) */
export function resetMessagingProvider(): void {
  _instance = null
}
