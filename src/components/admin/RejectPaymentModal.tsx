import { Icon } from '../common/Icon';
import React, { useState } from 'react';
import { Transaction } from '../../types';

interface RejectPaymentModalProps {
  transaction: Transaction;
  onConfirmReject: (txId: string, reason: string) => void;
  onClose: () => void;
}

const PRESET_REASONS = [
  'Comprovativo ilegível',
  'Valor incorreto',
  'Referência inválida',
  'Comprovativo já utilizado ou duplicado',
];

export const RejectPaymentModal: React.FC<RejectPaymentModalProps> = ({
  transaction,
  onConfirmReject,
  onClose,
}) => {
  const [selectedPreset, setSelectedPreset] = useState<string>(PRESET_REASONS[0]);
  const [customReason, setCustomReason] = useState<string>('');
  const [useCustom, setUseCustom] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const finalReason = useCustom
      ? customReason.trim() || PRESET_REASONS[0]
      : selectedPreset;

    setIsSubmitting(true);
    setTimeout(() => {
      onConfirmReject(transaction.id, finalReason);
      onClose();
    }, 400);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-surface-container-lowest rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-surface-border animate-in fade-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between border-b border-surface-border pb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-red-500/10 text-red-600 flex items-center justify-center">
              <Icon name="cancel" className="text-[24px]" />
            </div>
            <div>
              <h3 className="font-display text-base font-bold text-on-surface">
                Rejeitar Comprovativo de Pagamento
              </h3>
              <p className="text-xs text-on-surface-variant">
                O utilizador será notificado e poderá submeter um novo comprovativo.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-on-surface-variant hover:text-on-surface p-1.5 rounded-lg hover:bg-surface-container-high transition-colors"
          >
            <Icon name="close" className="text-[20px]" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="py-4 space-y-4">
          {/* Target Transaction Summary */}
          <div className="bg-surface-container-low p-3.5 rounded-xl text-xs space-y-1.5 border border-surface-border/60">
            <div className="flex justify-between">
              <span className="text-on-surface-variant">Transação:</span>
              <span className="font-mono font-bold text-primary">{transaction.id}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-on-surface-variant">Cliente:</span>
              <span className="font-bold text-on-surface">{transaction.userName} ({transaction.userEmail})</span>
            </div>
            <div className="flex justify-between">
              <span className="text-on-surface-variant">Método & Valor:</span>
              <span className="font-bold text-slate-800 font-mono">
                {transaction.method === 'Multicaixa' ? 'Multicaixa Xpress' : 'Transferência BAI'} &bull; {transaction.amount.toLocaleString()} Kz
              </span>
            </div>
          </div>

          {/* Reason Selection */}
          <div className="space-y-2">
            <label className="block text-xs font-bold text-on-surface">
              Selecione o motivo da não validação:
            </label>

            <div className="space-y-2">
              {PRESET_REASONS.map((reason, idx) => (
                <label
                  key={idx}
                  className={`flex items-start gap-2.5 p-2.5 rounded-xl border text-xs cursor-pointer transition-all ${
                    !useCustom && selectedPreset === reason
                      ? 'border-red-500 bg-red-500/5 text-red-950 font-semibold'
                      : 'border-surface-border bg-surface-container-lowest text-on-surface-variant hover:bg-surface-container-low'
                  }`}
                >
                  <input
                    type="radio"
                    name="rejectReason"
                    checked={!useCustom && selectedPreset === reason}
                    onChange={() => {
                      setSelectedPreset(reason);
                      setUseCustom(false);
                    }}
                    className="mt-0.5 text-red-600 focus:ring-red-500"
                  />
                  <span>{reason}</span>
                </label>
              ))}

              <label
                className={`flex items-start gap-2.5 p-2.5 rounded-xl border text-xs cursor-pointer transition-all ${
                  useCustom
                    ? 'border-red-500 bg-red-500/5 text-red-950 font-semibold'
                    : 'border-surface-border bg-surface-container-lowest text-on-surface-variant hover:bg-surface-container-low'
                }`}
              >
                <input
                  type="radio"
                  name="rejectReason"
                  checked={useCustom}
                  onChange={() => setUseCustom(true)}
                  className="mt-0.5 text-red-600 focus:ring-red-500"
                />
                <span>Outro motivo personalizado...</span>
              </label>
            </div>

            {useCustom && (
              <div className="pt-2 animate-in fade-in duration-150">
                <textarea
                  rows={3}
                  required={useCustom}
                  value={customReason}
                  onChange={(e) => setCustomReason(e.target.value)}
                  placeholder="Escreva detalhadamente a razão pela qual o pagamento não foi validado..."
                  className="w-full bg-surface-container-low border border-surface-border rounded-xl p-3 text-xs outline-none focus:ring-2 focus:ring-red-500/20"
                />
              </div>
            )}
          </div>

          <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-[11px] text-amber-900 flex items-start gap-2">
            <Icon name="info" className="text-[16px] text-amber-700 shrink-0" />
            <span>
              Ao rejeitar, o utilizador verá este motivo no criador de CV e o estado no Discord será atualizado. O utilizador terá a opção de reenviar um novo comprovativo de imediato.
            </span>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-3 border-t border-surface-border">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 rounded-xl border border-surface-border text-on-surface font-semibold text-xs hover:bg-surface-container-low transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 py-2.5 rounded-xl bg-red-600 text-white font-bold text-xs shadow-md hover:bg-red-700 transition-all flex items-center justify-center gap-1.5 active:scale-[0.98] disabled:opacity-70"
            >
              <Icon name="close" className="text-[18px]" />
              {isSubmitting ? 'A processar...' : 'Confirmar Rejeição'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
