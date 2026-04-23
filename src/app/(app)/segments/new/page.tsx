'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Loader2, Users, Zap, CheckCircle, Search, X } from 'lucide-react'

type SegmentType = 'MANUAL' | 'DYNAMIC'

interface Customer {
  id: string
  fullName: string
  phoneE164?: string
  email?: string
  lifecycleStage: string
}

export default function NewSegmentPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [selectedType, setSelectedType] = useState<SegmentType>('MANUAL')
  const [customers, setCustomers] = useState<Customer[]>([])
  const [selectedCustomers, setSelectedCustomers] = useState<Set<string>>(new Set())
  const [searchQuery, setSearchQuery] = useState('')
  const [customersLoading, setCustomersLoading] = useState(false)

  // Fetch customers when page loads or type changes
  useEffect(() => {
    if (selectedType === 'MANUAL') {
      fetchCustomers()
    }
  }, [selectedType])

  async function fetchCustomers() {
    try {
      setCustomersLoading(true)
      const res = await fetch('/api/customers?limit=1000')
      if (res.ok) {
        const data = await res.json()
        setCustomers(data.customers || [])
      }
    } catch (err) {
      console.error('Failed to load customers:', err)
    } finally {
      setCustomersLoading(false)
    }
  }

  const filteredCustomers = customers.filter(
    (c) =>
      c.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.phoneE164?.includes(searchQuery) ||
      c.email?.toLowerCase().includes(searchQuery.toLowerCase())
  )

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setError('')
    const form = e.currentTarget
    const name = (form.elements.namedItem('name') as HTMLInputElement).value
    const description = (form.elements.namedItem('description') as HTMLInputElement).value || undefined

    // Validate inputs
    if (!name.trim()) {
      setError('Nome do segmento é obrigatório')
      setLoading(false)
      return
    }

    if (selectedType === 'MANUAL' && selectedCustomers.size === 0) {
      setError('Selecione pelo menos um cliente para o segmento manual')
      setLoading(false)
      return
    }

    const data = {
      name,
      description,
      type: selectedType,
      customerIds: selectedType === 'MANUAL' ? Array.from(selectedCustomers) : undefined,
    }

    try {
      const res = await fetch('/api/segments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      if (!res.ok) {
        const json = await res.json()
        setError(json.error ?? 'Erro ao criar segmento')
        return
      }
      router.push('/segments')
    } catch {
      setError('Erro ao criar segmento. Tente novamente.')
    } finally {
      setLoading(false)
    }
  }

  function toggleCustomer(customerId: string) {
    const newSelected = new Set(selectedCustomers)
    if (newSelected.has(customerId)) {
      newSelected.delete(customerId)
    } else {
      newSelected.add(customerId)
    }
    setSelectedCustomers(newSelected)
  }

  function selectAll() {
    setSelectedCustomers(new Set(filteredCustomers.map((c) => c.id)))
  }

  function clearAll() {
    setSelectedCustomers(new Set())
  }

  return (
    <div className="max-w-2xl">
      {/* Header */}
      <div className="flex items-center gap-3 mb-8">
        <Link href="/segments" className="text-gray-400 hover:text-white transition-colors">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-white">Criar novo segmento</h1>
          <p className="text-sm text-gray-400 mt-1">Agrupe clientes por critérios</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {error && (
          <div className="rounded-lg bg-red-500/10 border border-red-500/30 px-4 py-3 text-sm text-red-400">
            {error}
          </div>
        )}

        {/* Tipo de Segmento - Visual Selection */}
        <div className="space-y-3">
          <label className="text-sm font-semibold text-white">Como você quer criar? *</label>
          <p className="text-xs text-gray-400">Escolha o método que faz sentido para você</p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {/* MANUAL Option */}
            <button
              type="button"
              onClick={() => setSelectedType('MANUAL')}
              className={`p-4 rounded-lg border-2 transition-all text-left ${
                selectedType === 'MANUAL'
                  ? 'border-[#C9A14A] bg-[#C9A14A]/10'
                  : 'border-white/[0.08] bg-white/[0.02] hover:border-white/[0.15]'
              }`}
            >
              <div className="flex items-start gap-3">
                <Users className={`h-5 w-5 mt-0.5 shrink-0 ${selectedType === 'MANUAL' ? 'text-[#C9A14A]' : 'text-gray-500'}`} />
                <div className="flex-1">
                  <p className="font-semibold text-white">Seleção Manual</p>
                  <p className="text-xs text-gray-400 mt-1">
                    Você escolhe quais clientes fazem parte do segmento
                  </p>
                  <div className="mt-2 space-y-1 text-xs text-gray-500">
                    <p>✓ Simples e rápido</p>
                    <p>✓ Controle total</p>
                  </div>
                </div>
              </div>
            </button>

            {/* DYNAMIC Option */}
            <button
              type="button"
              onClick={() => setSelectedType('DYNAMIC')}
              className={`p-4 rounded-lg border-2 transition-all text-left ${
                selectedType === 'DYNAMIC'
                  ? 'border-[#C9A14A] bg-[#C9A14A]/10'
                  : 'border-white/[0.08] bg-white/[0.02] hover:border-white/[0.15]'
              }`}
            >
              <div className="flex items-start gap-3">
                <Zap className={`h-5 w-5 mt-0.5 shrink-0 ${selectedType === 'DYNAMIC' ? 'text-[#C9A14A]' : 'text-gray-500'}`} />
                <div className="flex-1">
                  <p className="font-semibold text-white">Automático (Dinâmico)</p>
                  <p className="text-xs text-gray-400 mt-1">
                    Sistema agrupa automaticamente por critérios
                  </p>
                  <div className="mt-2 space-y-1 text-xs text-gray-500">
                    <p>✓ Atualiza automaticamente</p>
                    <p>✓ Baseado em regras (futuro)</p>
                  </div>
                </div>
              </div>
            </button>
          </div>
        </div>

        {/* Info Box */}
        <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4">
          <div className="flex gap-3">
            <CheckCircle className="h-5 w-5 text-blue-400 mt-0.5 shrink-0" />
            <div className="text-sm text-blue-300">
              <p className="font-medium mb-1">
                {selectedType === 'MANUAL' ? 'Seleção Manual' : 'Automático'}
              </p>
              <p className="text-xs">
                {selectedType === 'MANUAL'
                  ? 'Você escolhe os clientes. Ideal para pequenos grupos ou estratégias específicas.'
                  : 'O sistema encontra automaticamente clientes que combinam com critérios. Atualiza sempre que novos clientes chegam.'}
              </p>
            </div>
          </div>
        </div>

        {/* Nome */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-white">Nome do Segmento *</label>
          <input
            name="name"
            required
            placeholder={selectedType === 'MANUAL' ? 'Ex: VIPs preferidos' : 'Ex: Clientes em risco'}
            className="w-full bg-white/5 border border-white/10 text-white placeholder-gray-500 rounded-lg py-2.5 px-3 text-sm focus:outline-none focus:border-[#C9A14A]/50 transition-colors"
          />
        </div>

        {/* Descrição */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-white">Descrição (opcional)</label>
          <textarea
            name="description"
            placeholder={
              selectedType === 'MANUAL'
                ? 'Ex: Clientes que mais gastam, necessitam atendimento VIP'
                : 'Ex: Clientes que não visitam há mais de 90 dias'
            }
            rows={3}
            className="w-full bg-white/5 border border-white/10 text-white placeholder-gray-500 rounded-lg py-2.5 px-3 text-sm focus:outline-none focus:border-[#C9A14A]/50 transition-colors resize-none"
          />
        </div>

        {/* Customer Selection for MANUAL Segments */}
        {selectedType === 'MANUAL' && (
          <div className="space-y-3">
            <label className="text-sm font-medium text-white">Selecione os clientes *</label>

            {/* Search and Actions */}
            <div className="space-y-2">
              <div className="relative">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-500" />
                <input
                  type="text"
                  placeholder="Buscar por nome, telefone ou email..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 text-white placeholder-gray-500 rounded-lg py-2.5 pl-10 pr-3 text-sm focus:outline-none focus:border-[#C9A14A]/50 transition-colors"
                />
              </div>

              {/* Quick Actions */}
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={selectAll}
                  disabled={filteredCustomers.length === 0}
                  className="text-xs px-3 py-1.5 rounded bg-[#C9A14A]/20 text-[#C9A14A] hover:bg-[#C9A14A]/30 transition-colors disabled:opacity-50"
                >
                  Selecionar todos ({filteredCustomers.length})
                </button>
                <button
                  type="button"
                  onClick={clearAll}
                  disabled={selectedCustomers.size === 0}
                  className="text-xs px-3 py-1.5 rounded bg-red-500/20 text-red-400 hover:bg-red-500/30 transition-colors disabled:opacity-50"
                >
                  Limpar seleção ({selectedCustomers.size})
                </button>
              </div>
            </div>

            {/* Customer List */}
            {customersLoading ? (
              <div className="flex items-center justify-center py-8 text-gray-400">
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                Carregando clientes...
              </div>
            ) : filteredCustomers.length === 0 ? (
              <div className="border border-white/10 rounded-lg p-6 text-center text-gray-400">
                <Users className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">Nenhum cliente encontrado</p>
                <p className="text-xs mt-1">Importe clientes primeiro no conector</p>
              </div>
            ) : (
              <div className="border border-white/10 rounded-lg overflow-hidden max-h-96 overflow-y-auto">
                {filteredCustomers.map((customer) => (
                  <label
                    key={customer.id}
                    className="flex items-center gap-3 p-3 bg-white/[0.02] hover:bg-white/[0.05] cursor-pointer border-b border-white/10 last:border-b-0 transition-colors"
                  >
                    <input
                      type="checkbox"
                      checked={selectedCustomers.has(customer.id)}
                      onChange={() => toggleCustomer(customer.id)}
                      className="w-4 h-4 rounded cursor-pointer"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-white font-medium truncate">{customer.fullName}</p>
                      <p className="text-xs text-gray-400">
                        {customer.phoneE164 || customer.email || 'Sem contato'}
                      </p>
                    </div>
                    <span className="text-xs px-2 py-1 rounded bg-[#C9A14A]/10 text-[#C9A14A] shrink-0">
                      {customer.lifecycleStage}
                    </span>
                  </label>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Buttons */}
        <div className="flex gap-3 pt-4">
          <Link
            href="/segments"
            className="flex-1 text-center border border-white/10 text-gray-400 hover:text-white py-2.5 rounded-lg text-sm transition-colors font-medium"
          >
            Cancelar
          </Link>
          <button
            type="submit"
            disabled={loading}
            className="flex-1 bg-[#C9A14A] text-black font-semibold py-2.5 rounded-lg text-sm hover:bg-[#b8903e] transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Criando...
              </>
            ) : (
              'Criar segmento'
            )}
          </button>
        </div>
      </form>
    </div>
  )
}
