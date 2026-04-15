'use client'

import { MessageCircle } from 'lucide-react'

export default function SupportButton() {
  return (
    <a
      href="https://wa.me/5511999999999?text=Oi%2C%20preciso%20de%20ajuda%20com%20o%20Retoquei"
      target="_blank"
      rel="noopener noreferrer"
      className="fixed bottom-6 right-6 z-40 flex items-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-white px-4 py-3 rounded-full shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-105 group"
      aria-label="Suporte via WhatsApp"
    >
      <MessageCircle className="h-5 w-5" />
      <span className="text-sm font-medium hidden sm:inline group-hover:inline">Suporte</span>
    </a>
  )
}
