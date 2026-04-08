import { getServerUser } from '@/lib/auth'

export const metadata = { title: 'Configurações' }

export default async function SettingsPage() {
  const user = await getServerUser()

  return (
    <div className="max-w-lg">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white">Configurações</h1>
        <p className="text-gray-400 mt-1">Gerencie sua conta</p>
      </div>

      <div className="bg-white/[0.03] border border-white/[0.08] rounded-xl p-6 space-y-4">
        <div>
          <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">E-mail da conta</p>
          <p className="text-white text-sm">{user?.email}</p>
        </div>
        <div>
          <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">ID do usuário</p>
          <p className="text-gray-400 text-xs font-mono">{user?.id}</p>
        </div>
      </div>

      <div className="mt-4 p-4 bg-white/[0.02] border border-white/[0.06] rounded-xl">
        <p className="text-sm text-gray-500">
          Para alterar e-mail ou senha, acesse as configurações da sua conta no painel de autenticação.
        </p>
      </div>
    </div>
  )
}
