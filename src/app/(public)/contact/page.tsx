export default function ContactPage() {
  return (
    <div className="min-h-screen bg-[#0B0B0B] py-20 px-4">
      <div className="max-w-lg mx-auto">
        <h1 className="text-3xl font-bold text-white text-center">Fale conosco</h1>
        <p className="text-muted-foreground text-center mt-2">Agende uma demonstração ou tire suas dúvidas</p>
        <div className="mt-10 rounded-2xl border border-border bg-[#1E1E1E] p-8 space-y-4">
          <div>
            <label className="text-xs text-muted-foreground">Nome</label>
            <input className="mt-1.5 w-full rounded-lg border border-border bg-[#161616] px-3 py-2.5 text-sm text-white focus:border-gold focus:outline-none" placeholder="Seu nome" />
          </div>
          <div>
            <label className="text-xs text-muted-foreground">Email</label>
            <input className="mt-1.5 w-full rounded-lg border border-border bg-[#161616] px-3 py-2.5 text-sm text-white focus:border-gold focus:outline-none" placeholder="voce@salao.com" />
          </div>
          <div>
            <label className="text-xs text-muted-foreground">Mensagem</label>
            <textarea rows={4} className="mt-1.5 w-full rounded-lg border border-border bg-[#161616] px-3 py-2.5 text-sm text-white focus:border-gold focus:outline-none resize-none" placeholder="Como podemos ajudar?" />
          </div>
          <button className="w-full rounded-xl bg-gold py-2.5 text-sm font-semibold text-[#0B0B0B] hover:bg-gold/90 transition-colors">
            Enviar mensagem
          </button>
        </div>
      </div>
    </div>
  )
}
