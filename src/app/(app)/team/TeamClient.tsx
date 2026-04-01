'use client'

import { useState } from 'react'
import { Users, Crown, UserCheck, UserCog, X, Loader2 } from 'lucide-react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'

const roleConfig: Record<string, { label: string; color: string }> = {
  OWNER:   { label: 'Proprietário', color: 'text-gold' },
  MANAGER: { label: 'Gerente',      color: 'text-blue-400' },
  STAFF:   { label: 'Equipe',       color: 'text-green-400' },
}

interface Member {
  id: string
  role: string
  joinedAt: string | null
  user: { fullName: string; email: string }
}

interface Props {
  initialMembers: Member[]
}

export function TeamClient({ initialMembers }: Props) {
  const [members, setMembers] = useState(initialMembers)
  const [showInvite, setShowInvite] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const [email, setEmail] = useState('')
  const [role, setRole] = useState<'MANAGER' | 'STAFF'>('STAFF')

  async function handleInvite() {
    if (!email.trim()) return
    setLoading(true)
    setError('')
    setSuccess('')
    try {
      const res = await fetch('/api/team', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, role }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setMembers((prev) => [...prev, data])
      setSuccess(`${data.user.fullName} adicionado à equipe!`)
      setEmail('')
      setTimeout(() => { setShowInvite(false); setSuccess('') }, 1500)
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <div className="flex justify-end">
        <button
          onClick={() => { setShowInvite(true); setEmail(''); setError(''); setSuccess('') }}
          className="flex items-center gap-1.5 rounded-lg bg-gold px-3 py-1.5 text-xs font-semibold text-[#0B0B0B] hover:bg-gold/90 transition-colors"
        >
          <Users className="h-3.5 w-3.5" /> Convidar Membro
        </button>
      </div>

      <div className="rounded-xl border border-border overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-[#161616]">
              <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Usuário</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Função</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Desde</th>
            </tr>
          </thead>
          <tbody>
            {members.length === 0 ? (
              <tr>
                <td colSpan={3} className="px-4 py-8 text-center text-sm text-muted-foreground">Nenhum membro na equipe</td>
              </tr>
            ) : (
              members.map((m) => {
                const cfg = roleConfig[m.role] ?? roleConfig.STAFF
                return (
                  <tr key={m.id} className="border-b border-border last:border-0 bg-[#1E1E1E]">
                    <td className="px-4 py-3">
                      <p className="font-medium text-white">{m.user.fullName}</p>
                      <p className="text-xs text-muted-foreground">{m.user.email}</p>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-xs font-medium ${cfg.color}`}>{cfg.label}</span>
                    </td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">
                      {m.joinedAt ? format(new Date(m.joinedAt), 'dd/MM/yyyy', { locale: ptBR }) : 'Pendente'}
                    </td>
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Invite modal */}
      {showInvite && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" onClick={() => setShowInvite(false)}>
          <div className="w-full max-w-md rounded-2xl border border-border bg-[#1E1E1E] p-6" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-base font-bold text-white">Convidar Membro</h2>
              <button onClick={() => setShowInvite(false)} className="text-muted-foreground hover:text-white"><X className="h-4 w-4" /></button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="text-xs text-muted-foreground">Email do usuário</label>
                <input
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="colaborador@email.com"
                  type="email"
                  className="mt-1.5 w-full rounded-lg border border-border bg-[#161616] px-3 py-2 text-sm text-white placeholder:text-muted-foreground focus:border-gold focus:outline-none"
                />
                <p className="mt-1 text-xs text-muted-foreground">O usuário precisa já ter uma conta no Retoquei.</p>
              </div>
              <div>
                <label className="text-xs text-muted-foreground">Função</label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value as 'MANAGER' | 'STAFF')}
                  className="mt-1.5 w-full rounded-lg border border-border bg-[#161616] px-3 py-2 text-sm text-white focus:border-gold focus:outline-none"
                >
                  <option value="MANAGER">Gerente — pode editar configurações</option>
                  <option value="STAFF">Equipe — acesso somente leitura</option>
                </select>
              </div>
              {error && <p className="text-xs text-red-400">{error}</p>}
              {success && <p className="text-xs text-green-400">{success}</p>}
              <button
                onClick={handleInvite}
                disabled={loading || !email.trim()}
                className="w-full flex items-center justify-center gap-2 rounded-lg bg-gold py-2.5 text-sm font-semibold text-[#0B0B0B] hover:bg-gold/90 disabled:opacity-50 transition-colors"
              >
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Adicionar à Equipe'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
