'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, Send, RefreshCw } from 'lucide-react';
import { toast, Toaster } from 'sonner';

const sendMessageSchema = z.object({
  toNumber: z.string().min(10, 'Número de telefone inválido'),
  bodyRendered: z.string().min(1, 'Mensagem não pode estar vazia'),
});

type SendMessageForm = z.infer<typeof sendMessageSchema>;

interface Message {
  id: string;
  toNumber: string;
  bodyRendered: string;
  status: string;
  createdAt: string;
}

export default function MessagesPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<SendMessageForm>({
    resolver: zodResolver(sendMessageSchema),
  });

  const fetchMessages = async () => {
    setIsLoadingMessages(true);
    try {
      const response = await fetch('/api/messages');
      if (!response.ok) {
        if (response.status === 401) {
          window.location.href = '/login';
          return;
        }
        throw new Error('Failed to fetch messages');
      }
      const data = await response.json();
      setMessages(data.messages || []);
    } catch (error) {
      toast.error('Erro ao carregar mensagens');
    } finally {
      setIsLoadingMessages(false);
    }
  };

  useEffect(() => {
    fetchMessages();
  }, []);

  const onSubmit = async (data: SendMessageForm) => {
    try {
      const response = await fetch('/api/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        if (response.status === 401) {
          window.location.href = '/login';
          return;
        }
        const error = await response.json();
        throw new Error(error.message || 'Failed to send message');
      }

      toast.success('Mensagem enviada com sucesso!');
      reset();
      await fetchMessages();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Erro ao enviar mensagem');
    }
  };

  return (
    <div className="space-y-8 p-6">
      <Toaster />

      {/* Send Message Form */}
      <div className="max-w-2xl">
        <h1 className="text-3xl font-bold mb-6">Enviar Mensagem WhatsApp</h1>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 border rounded-lg p-6 bg-slate-50">
          <div>
            <label htmlFor="toNumber" className="block text-sm font-medium mb-1">
              Número de Telefone (com código de país)
            </label>
            <Input
              id="toNumber"
              placeholder="+55 11 99999-9999"
              {...register('toNumber')}
              className="w-full"
            />
            {errors.toNumber && (
              <p className="text-red-500 text-sm mt-1">{errors.toNumber.message}</p>
            )}
          </div>

          <div>
            <label htmlFor="bodyRendered" className="block text-sm font-medium mb-1">
              Mensagem
            </label>
            <Textarea
              id="bodyRendered"
              placeholder="Digite sua mensagem aqui..."
              {...register('bodyRendered')}
              rows={4}
              className="w-full"
            />
            {errors.bodyRendered && (
              <p className="text-red-500 text-sm mt-1">{errors.bodyRendered.message}</p>
            )}
          </div>

          <div className="flex gap-2">
            <Button
              type="submit"
              disabled={isSubmitting}
              className="gap-2"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Enviando...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  Enviar Mensagem
                </>
              )}
            </Button>

            <Button
              type="button"
              variant="outline"
              onClick={fetchMessages}
              disabled={isLoadingMessages}
              className="gap-2"
            >
              <RefreshCw className={`w-4 h-4 ${isLoadingMessages ? 'animate-spin' : ''}`} />
              {isLoadingMessages ? 'Carregando...' : 'Atualizar'}
            </Button>
          </div>
        </form>
      </div>

      {/* Messages History */}
      <div className="max-w-4xl">
        <h2 className="text-2xl font-bold mb-4">Histórico de Mensagens</h2>

        {messages.length === 0 ? (
          <p className="text-gray-500">Nenhuma mensagem enviada ainda.</p>
        ) : (
          <div className="space-y-2">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className="border rounded-lg p-4 bg-white hover:bg-slate-50 transition"
              >
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <p className="font-medium text-gray-900">{msg.toNumber}</p>
                    <p className="text-sm text-gray-400">
                      {new Date(msg.createdAt).toLocaleString('pt-BR')}
                    </p>
                  </div>
                  <span className={`text-xs px-3 py-1 rounded-full font-medium ${
                    msg.status === 'SENT' ? 'bg-green-100 text-green-800' :
                    msg.status === 'DELIVERED' ? 'bg-blue-100 text-blue-800' :
                    msg.status === 'PENDING' ? 'bg-yellow-100 text-yellow-800' :
                    msg.status === 'FAILED' ? 'bg-red-100 text-red-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {msg.status}
                  </span>
                </div>
                <p className="text-gray-700">{msg.bodyRendered}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
