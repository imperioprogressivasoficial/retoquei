import type { IMessagingProvider } from './messaging.interface'
import { MockMessagingProvider } from './mock.provider'
import { WhatsAppCloudProvider } from './whatsapp-cloud.provider'

let _instance: IMessagingProvider | null = null

export function getMessagingProvider(): IMessagingProvider {
  if (_instance) return _instance

  const useMock =
    process.env.WHATSAPP_MOCK_MODE === 'true' ||
    !process.env.WHATSAPP_ACCESS_TOKEN ||
    !process.env.WHATSAPP_PHONE_NUMBER_ID

  _instance = useMock ? new MockMessagingProvider() : new WhatsAppCloudProvider()

  console.log(`[Messaging] Provider: ${_instance.name}`)
  return _instance
}

/** Force a new instance (useful for testing) */
export function resetMessagingProvider(): void {
  _instance = null
}
