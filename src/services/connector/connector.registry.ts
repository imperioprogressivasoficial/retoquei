import type { IConnector } from './connector.interface'
import { CSVConnector } from './csv.connector'
import { TrinksConnector } from './trinks.connector'
import type { ConnectorType } from '@/types/connector.types'

// ---------------------------------------------------------------------------
// Connector Registry — factory that returns the right connector by type
// ---------------------------------------------------------------------------

const registry = new Map<ConnectorType, () => IConnector>([
  ['CSV', () => new CSVConnector()],
  ['TRINKS', () => new TrinksConnector()],
])

export function getConnector(type: ConnectorType): IConnector {
  const factory = registry.get(type)
  if (!factory) {
    throw new Error(`Unknown connector type: ${type}`)
  }
  return factory()
}

export function getSupportedConnectorTypes(): ConnectorType[] {
  return Array.from(registry.keys())
}
