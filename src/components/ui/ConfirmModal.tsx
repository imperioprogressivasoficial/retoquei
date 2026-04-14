'use client'

import * as Dialog from '@radix-ui/react-dialog'
import { Loader2 } from 'lucide-react'

interface ConfirmModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  description: string
  confirmLabel?: string
  cancelLabel?: string
  variant?: 'danger' | 'default'
  loading?: boolean
  onConfirm: () => void
  onCancel?: () => void
}

export default function ConfirmModal({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel = 'Confirmar',
  cancelLabel = 'Cancelar',
  variant = 'default',
  loading = false,
  onConfirm,
  onCancel,
}: ConfirmModalProps) {
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm animate-in fade-in-0" />
        <Dialog.Content className="fixed left-1/2 top-1/2 z-50 -translate-x-1/2 -translate-y-1/2 w-[calc(100%-2rem)] max-w-md bg-[#1A1A1A] border border-white/10 rounded-2xl shadow-2xl p-6 animate-in fade-in-0 zoom-in-95">
          <Dialog.Title className="text-lg font-semibold text-white">
            {title}
          </Dialog.Title>
          <Dialog.Description className="text-sm text-gray-400 mt-2 leading-relaxed">
            {description}
          </Dialog.Description>

          <div className="flex items-center justify-end gap-3 mt-6">
            <button
              onClick={() => {
                onCancel?.()
                onOpenChange(false)
              }}
              disabled={loading}
              className="px-4 py-2 text-sm font-medium text-gray-400 border border-white/10 rounded-lg hover:text-white hover:border-white/20 transition-colors disabled:opacity-50"
            >
              {cancelLabel}
            </button>
            <button
              onClick={onConfirm}
              disabled={loading}
              className={`px-4 py-2 text-sm font-semibold rounded-lg transition-colors disabled:opacity-50 flex items-center gap-2 ${
                variant === 'danger'
                  ? 'bg-red-500 text-white hover:bg-red-600'
                  : 'bg-[#C9A14A] text-black hover:bg-[#b8903e]'
              }`}
            >
              {loading && <Loader2 className="h-4 w-4 animate-spin" />}
              {confirmLabel}
            </button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
