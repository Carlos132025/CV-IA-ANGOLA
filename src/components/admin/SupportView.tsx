import { Icon } from '../common/Icon';
import React, { useState } from 'react';
import { SupportTicket } from '../../types';

interface SupportViewProps {
  tickets: SupportTicket[];
  onReplyTicket: (id: string, replyText: string) => void;
}

export const SupportView: React.FC<SupportViewProps> = ({
  tickets,
  onReplyTicket,
}) => {
  const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null);
  const [replyInput, setReplyInput] = useState('');

  const handleSendReply = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTicket || !replyInput.trim()) return;
    onReplyTicket(selectedTicket.id, replyInput);
    setSelectedTicket({
      ...selectedTicket,
      status: 'Fechado',
      reply: replyInput,
    });
    setReplyInput('');
  };

  return (
    <div className="flex flex-col w-full max-w-[1240px] mx-auto p-0 sm:p-2 lg:p-4 gap-6 sm:gap-8">
      {/* Header */}
      <div>
        <h1 className="font-display text-3xl font-bold text-on-surface tracking-tight">
          Centro de Suporte & Atendimento
        </h1>
        <p className="text-on-surface-variant text-sm mt-1">
          Dúvidas de clientes sobre pagamentos Multicaixa Xpress, Transferência BAI e formatação de currículos.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Ticket list */}
        <div className="lg:col-span-2 space-y-4">
          {tickets.map((ticket) => (
            <div
              key={ticket.id}
              onClick={() => {
                setSelectedTicket(ticket);
                setReplyInput(ticket.reply || '');
              }}
              className={`p-5 rounded-2xl border transition-all cursor-pointer bg-surface-container-lowest shadow-sm ${
                selectedTicket?.id === ticket.id
                  ? 'border-primary ring-2 ring-primary/15'
                  : 'border-surface-border hover:border-surface-variant'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs font-bold text-primary">
                    {ticket.id}
                  </span>
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      ticket.priority === 'Alta'
                        ? 'bg-error-container text-on-error-container'
                        : 'bg-surface-container text-on-surface-variant'
                    }`}
                  >
                    Prioridade {ticket.priority}
                  </span>
                </div>
                <span className="text-xs text-on-surface-variant">
                  {ticket.createdAt}
                </span>
              </div>

              <h3 className="text-sm font-bold text-on-surface">
                {ticket.subject}
              </h3>
              <p className="text-xs text-on-surface-variant mt-1 line-clamp-2">
                {ticket.message}
              </p>

              <div className="flex items-center justify-between mt-4 pt-3 border-t border-surface-border/40 text-xs">
                <span className="font-medium text-on-surface">
                  {ticket.userName} ({ticket.userEmail})
                </span>
                <span
                  className={`px-2.5 py-0.5 rounded-full font-bold text-[11px] ${
                    ticket.status === 'Aberto'
                      ? 'bg-error-container text-on-error-container'
                      : ticket.status === 'Em Resolução'
                      ? 'bg-secondary/15 text-secondary'
                      : 'bg-success-green/15 text-success-green'
                  }`}
                >
                  {ticket.status}
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* Reply / Details panel */}
        <div className="bg-surface-container-lowest rounded-2xl shadow-sm border border-surface-border p-6 flex flex-col justify-between min-h-[400px]">
          {selectedTicket ? (
            <div className="space-y-4">
              <div className="pb-4 border-b border-surface-border">
                <span className="text-xs font-bold text-primary font-mono block">
                  {selectedTicket.id}
                </span>
                <h3 className="font-display text-base font-bold text-on-surface mt-1">
                  {selectedTicket.subject}
                </h3>
                <p className="text-xs text-on-surface-variant mt-0.5">
                  De: {selectedTicket.userName} &bull; {selectedTicket.userEmail}
                </p>
              </div>

              <div className="p-3 bg-surface-container-low rounded-xl text-xs text-on-surface leading-relaxed">
                {selectedTicket.message}
              </div>

              {selectedTicket.reply && (
                <div className="p-3 bg-primary/10 rounded-xl text-xs border border-primary/20">
                  <span className="font-bold text-primary block mb-1">
                    Resposta Enviada:
                  </span>
                  <p className="text-on-surface">{selectedTicket.reply}</p>
                </div>
              )}

              <form onSubmit={handleSendReply} className="pt-2 space-y-3">
                <label className="block text-xs font-semibold text-on-surface">
                  Enviar Resposta ao Candidato:
                </label>
                <textarea
                  rows={4}
                  value={replyInput}
                  onChange={(e) => setReplyInput(e.target.value)}
                  placeholder="Escreva a resposta que será enviada para o e-mail do utilizador..."
                  className="w-full bg-surface-container-low border-none rounded-xl p-3 text-xs outline-none focus:ring-2 focus:ring-primary/20 resize-none"
                ></textarea>
                <button
                  type="submit"
                  className="w-full bg-primary text-white py-2.5 rounded-xl text-xs font-semibold hover:bg-primary/90 transition-all flex items-center justify-center gap-2 shadow-sm"
                >
                  <Icon name="send" className="text-[16px]" />
                  Enviar Resposta & Fechar Ticket
                </button>
              </form>
            </div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-center text-on-surface-variant py-12">
              <Icon name="mark_chat_read" className="text-[48px] opacity-40 mb-2" />
              <p className="text-xs font-medium">
                Selecione um ticket ao lado para ver detalhes e responder.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
