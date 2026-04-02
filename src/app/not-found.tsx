import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-[#0B0B0B] to-[#1E1E1E]">
      <div className="text-center">
        <h1 className="text-6xl font-bold text-[#C9A14A] mb-4">404</h1>
        <p className="text-2xl text-white mb-8">Página não encontrada</p>
        <p className="text-[#A1A1AA] mb-8 max-w-md">
          Desculpe, a página que você está procurando não existe ou foi movida.
        </p>
        <Link
          href="/"
          className="inline-block px-8 py-3 bg-[#C9A14A] text-[#0B0B0B] font-semibold rounded-lg hover:bg-[#8B6E2F] transition-colors"
        >
          Voltar para Home
        </Link>
      </div>
    </div>
  )
}
