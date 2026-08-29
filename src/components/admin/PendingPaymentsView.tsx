import { Icon } from '../common/Icon';
import React, { useState } from 'react';
import { Transaction } from '../../types';
import { testDiscordWebhookConnection } from '../../utils/discordNotification';
import { recordAuditLog } from '../../utils/security';

interface PendingPaymentsViewProps {
  transactions: Transaction[];
  onApproveTransaction: (txId: string) => void;
  onRejectTransaction: (txId: string) => void;
  onOpenSales?: () => void;
}

export const PendingPaymentsView: React.FC<PendingPaymentsViewProps> = ({
  transactions,
  onApproveTransaction,
  onRejectTransaction,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMethodFilter, setSelectedMethodFilter] = useState<'all' | 'Multicaixa' | 'Transferência'>('all');
  const [inspectingTx, setInspectingTx] = useState<Transaction | null>(null);
  const [viewingReceiptImage, setViewingReceiptImage] = useState<{ url: string; title: string } | null>(null);

  // Test webhook state
  const [isTestingWebhook, setIsTestingWebhook] = useState(false);
  const [webhookTestResult, setWebhookTestResult] = useState<{ success: boolean; message: string } | null>(null);

  // Filter pending transactions and sort them FIFO: oldest to newest
  const pendingTransactions = transactions
    .filter((t) => {
      const s = (t.status || '').toLowerCase();
      return s === 'pendente' || s === 'pending';
    })
    .filter((t) => {
      if (selectedMethodFilter !== 'all' && t.method !== selectedMethodFilter) return false;
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      return (
        t.id.toLowerCase().includes(q) ||
        t.userName.toLowerCase().includes(q) ||
        t.userEmail.toLowerCase().includes(q) ||
        (t.userPhone && t.userPhone.includes(q)) ||
        (t.referenceCode && t.referenceCode.toLowerCase().includes(q)) ||
        (t.senderLast4 && t.senderLast4.includes(q))
      );
    })
    .sort((a, b) => {
      // Oldest first (FIFO queue)
      const timeA = a.timestamp || (a.date === 'Ontem' ? 1 : 2);
      const timeB = b.timestamp || (b.date === 'Ontem' ? 1 : 2);
      return timeA - timeB;
    });

  const suspiciousCount = transactions.filter(
    (t) => t.isSuspicious || (t.rejectedAttemptsCount && t.rejectedAttemptsCount >= 3)
  ).length;

  const handleTestWebhook = async () => {
    setIsTestingWebhook(true);
    setWebhookTestResult(null);
    try {
      const res = await testDiscordWebhookConnection();
      if (res.success) {
        setWebhookTestResult({
          success: true,
          message: res.simulated
            ? 'Webhook configurado (modo de simulação local ativo).'
            : 'Notificação de teste enviada com sucesso para o canal do Discord!',
        });
      } else {
        setWebhookTestResult({
          success: false,
          message: res.error || 'Falha ao conectar com o Discord Webhook.',
        });
      }
    } catch (e: any) {
      setWebhookTestResult({
        success: false,
        message: e.message || 'Erro inesperado.',
      });
    } finally {
      setIsTestingWebhook(false);
      setTimeout(() => setWebhookTestResult(null), 5000);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header & Quick Action */}
      <div className="bg-surface-container-lowest p-6 rounded-3xl border border-surface-border shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/10 text-amber-600 flex items-center justify-center">
              <Icon name="pending_actions" className="text-[24px]" />
            </div>
            <div>
              <h2 className="font-display font-black text-xl text-on-surface flex items-center gap-2">
                Fila de Pagamentos Pendentes
                <span className="text-xs bg-amber-100 text-amber-800 font-bold px-2.5 py-0.5 rounded-full">
                  {pendingTransactions.length} {pendingTransactions.length === 1 ? 'pedido' : 'pedidos'}
                </span>
              </h2>
              <p className="text-xs text-on-surface-variant">
                Ordens listadas do <strong>mais antigo para o mais recente (FIFO)</strong> para validação prioritária.
              </p>
            </div>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-3">
          <button
            onClick={handleTestWebhook}
            disabled={isTestingWebhook}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-50 border border-indigo-200 text-indigo-700 hover:bg-indigo-100 transition-all text-xs font-bold shadow-xs cursor-pointer active:scale-95 disabled:opacity-50"
            title="Enviar mensagem de teste para o Webhook do Discord"
          >
            {isTestingWebhook ? (
              <>
                <Icon name="progress_activity" className="text-[18px] animate-spin" />
                A testar Discord...
              </>
            ) : (
              <>
                <Icon name="webhook" className="text-[18px]" />
                Testar Webhook Discord
              </>
            )}
          </button>
        </div>
      </div>

      {/* Webhook Feedback Notification */}
      {webhookTestResult && (
        <div
          className={`p-4 rounded-2xl border flex items-center justify-between gap-3 text-xs font-medium animate-in slide-in-from-top-2 duration-150 ${
            webhookTestResult.success
              ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
              : 'bg-red-50 border-red-200 text-red-900'
          }`}
        >
          <div className="flex items-center gap-2">
            <Icon name={webhookTestResult.success ? 'check_circle' : 'error'} className="text-[20px]" />
            <span>{webhookTestResult.message}</span>
          </div>
          <button
            onClick={() => setWebhookTestResult(null)}
            className="p-1 hover:bg-black/5 rounded-lg"
          >
            <Icon name="close" className="text-[16px]" />
          </button>
        </div>
      )}

      {/* Suspicious Warning Banner */}
      {suspiciousCount > 0 && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-2xl flex items-start gap-3 text-red-900">
          <div className="w-8 h-8 rounded-xl bg-red-100 text-red-700 flex items-center justify-center shrink-0">
            <Icon name="warning" className="text-[20px]" />
          </div>
          <div className="space-y-0.5 text-xs">
            <p className="font-bold text-red-950">
              🚨 Alerta de Segurança e Prevenção de Fraude: {suspiciousCount} conta(s) assinalada(s)
            </p>
            <p className="text-red-800 leading-relaxed">
              Existem utilizadores com 3 ou mais comprovativos previamente rejeitados. Verifique atentamente o extrato bancário BAI ou a mensagem Multicaixa Xpress antes de aprovar.
            </p>
          </div>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-surface-container-lowest p-4 rounded-2xl border border-surface-border">
        <div className="relative w-full sm:w-80">
          <span className="absolute inset-y-0 left-3 flex items-center text-on-surface-variant pointer-events-none">
            <Icon name="search" className="text-[18px]" />
          </span>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Pesquisar por nome, tel, ref, ID..."
            className="w-full bg-surface-container-low border border-surface-border rounded-xl pl-9 pr-3 py-2 text-xs outline-none focus:ring-2 focus:ring-primary/20"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <span className="text-xs text-on-surface-variant font-semibold shrink-0">Método:</span>
          <div className="flex items-center gap-1 bg-surface-container-low p-1 rounded-xl border border-surface-border w-full sm:w-auto">
            <button
              onClick={() => setSelectedMethodFilter('all')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                selectedMethodFilter === 'all'
                  ? 'bg-surface-container-lowest text-primary shadow-xs font-bold'
                  : 'text-on-surface-variant hover:text-on-surface'
              }`}
            >
              Todos ({transactions.filter((t) => t.status === 'Pendente').length})
            </button>
            <button
              onClick={() => setSelectedMethodFilter('Multicaixa')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                selectedMethodFilter === 'Multicaixa'
                  ? 'bg-surface-container-lowest text-primary shadow-xs font-bold'
                  : 'text-on-surface-variant hover:text-on-surface'
              }`}
            >
              Multicaixa Xpress
            </button>
            <button
              onClick={() => setSelectedMethodFilter('Transferência')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                selectedMethodFilter === 'Transferência'
                  ? 'bg-surface-container-lowest text-primary shadow-xs font-bold'
                  : 'text-on-surface-variant hover:text-on-surface'
              }`}
            >
              Transferência BAI
            </button>
          </div>
        </div>
      </div>

      {/* Main Queue List */}
      {pendingTransactions.length === 0 ? (
        <div className="bg-surface-container-lowest rounded-3xl p-12 text-center border border-surface-border space-y-3">
          <div className="w-16 h-16 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto ring-8 ring-emerald-50/50">
            <Icon name="task_alt" className="text-[32px]" />
          </div>
          <h3 className="font-display text-lg font-bold text-on-surface">
            Todos os comprovativos foram validados!
          </h3>
          <p className="text-xs text-on-surface-variant max-w-md mx-auto">
            Não existem pagamentos pendentes na fila neste momento. Assim que um cliente submeter um novo comprovativo, ele aparecerá aqui e será notificado no Discord.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {pendingTransactions.map((tx, index) => {
            const isSuspicious = tx.isSuspicious || (tx.rejectedAttemptsCount && tx.rejectedAttemptsCount >= 3);
            const isMulticaixa = tx.method === 'Multicaixa';

            return (
              <div
                key={tx.id}
                className={`bg-surface-container-lowest rounded-2xl p-5 border transition-all hover:shadow-md ${
                  isSuspicious
                    ? 'border-red-300 ring-1 ring-red-200 bg-red-50/10'
                    : 'border-surface-border'
                }`}
              >
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                  {/* Left Column: Priority Tag & User Info */}
                  <div className="flex items-start gap-3.5 min-w-[260px]">
                    <div className="w-10 h-10 rounded-full bg-surface-container-high flex items-center justify-center font-bold text-on-surface shrink-0 text-xs overflow-hidden border border-surface-border">
                      {tx.userAvatar ? (
                        <img src={tx.userAvatar} alt={tx.userName} className="w-full h-full object-cover" />
                      ) : (
                        tx.userInitials
                      )}
                    </div>

                    <div className="space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-sm text-on-surface">{tx.userName}</span>
                        <span className="text-[10px] font-mono font-bold bg-primary/10 text-primary px-2 py-0.5 rounded-md">
                          {tx.id}
                        </span>
                        {index === 0 && (
                          <span className="text-[10px] font-bold bg-amber-100 text-amber-900 px-2 py-0.5 rounded-full flex items-center gap-0.5">
                            <Icon name="priority_high" className="text-[12px]" />
                            Mais Antigo (FIFO)
                          </span>
                        )}
                        {isSuspicious && (
                          <span className="text-[10px] font-bold bg-red-100 text-red-800 px-2 py-0.5 rounded-full flex items-center gap-1">
                            <Icon name="gpp_maybe" className="text-[12px]" />
                            🚨 Suspeito ({tx.rejectedAttemptsCount || 3} Rejeições)
                          </span>
                        )}
                      </div>

                      <p className="text-xs text-on-surface-variant flex items-center gap-2 flex-wrap">
                        <span>📧 {tx.userEmail}</span>
                        {tx.userPhone && <span>📱 {tx.userPhone}</span>}
                        <span className="text-on-surface-variant/60">&bull;</span>
                        <span className="text-[11px] font-mono text-on-surface-variant">
                          🕒 {tx.date} às {tx.time}
                        </span>
                      </p>
                    </div>
                  </div>

                  {/* Middle Column: Method, Amount & Proof Details */}
                  <div className="flex-1 bg-surface-container-low p-3.5 rounded-xl border border-surface-border/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span
                          className={`text-[10.5px] font-bold px-2 py-0.5 rounded-md flex items-center gap-1 ${
                            isMulticaixa
                              ? 'bg-sky-100 text-sky-800'
                              : 'bg-emerald-100 text-emerald-800'
                          }`}
                        >
                          <Icon name={isMulticaixa ? 'credit_card' : 'account_balance'} className="text-[13px]" />
                          {isMulticaixa ? 'Multicaixa Xpress' : 'Transferência BAI'}
                        </span>
                        <span className="font-display font-black text-sm text-slate-900">
                          {tx.amount.toLocaleString()} Kz
                        </span>
                      </div>

                      <div className="text-xs space-y-0.5 text-on-surface-variant">
                        {tx.referenceCode && (
                          <p>
                            Ref / Talão: <strong className="font-mono text-slate-800">{tx.referenceCode}</strong>
                          </p>
                        )}
                        {tx.senderLast4 && (
                          <p>
                            Últimos 4 Dígitos (Extrato):{' '}
                            <span className="font-mono font-bold bg-amber-100 text-amber-900 px-1.5 py-0.2 rounded">
                              **** {tx.senderLast4}
                            </span>
                          </p>
                        )}
                        {tx.senderName && <p>Titular no Talão: <strong>{tx.senderName}</strong></p>}
                      </div>
                    </div>

                    {/* Receipt Image Thumbnail (if present) */}
                    {tx.receiptUrl ? (
                      <button
                        type="button"
                        onClick={() => {
                          recordAuditLog({
                            accessedBy: 'cv.ia.angola@gmail.com',
                            actorRole: 'Administrador de Dados (DPO)',
                            targetUserId: tx.userId || tx.userEmail,
                            targetUserName: tx.userName,
                            accessType: 'visualizacao_comprovativo',
                            details: `Acedido e visualizado comprovativo de pagamento da transação ${tx.id} (${tx.method} - ${(tx.amount || 0).toLocaleString()} Kz).`,
                          });
                          setViewingReceiptImage({
                            url: tx.receiptUrl!,
                            title: `Comprovativo: ${tx.id} - ${tx.userName}`,
                          });
                        }}
                        className="group relative flex items-center gap-2 p-1.5 pr-3 bg-surface-container-lowest rounded-xl border border-surface-border hover:border-primary transition-all cursor-pointer text-left shrink-0"
                      >
                        <div className="w-12 h-12 rounded-lg bg-surface-container-high overflow-hidden relative">
                          <img
                            src={tx.receiptUrl}
                            alt="Comprovativo"
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                          />
                          <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white">
                            <Icon name="zoom_in" className="text-[18px]" />
                          </div>
                        </div>
                        <div className="text-[11px] leading-tight">
                          <span className="font-bold text-primary block group-hover:underline">
                            Ver Imagem
                          </span>
                          <span className="text-[10px] text-on-surface-variant block truncate max-w-[120px]">
                            {tx.receiptFileName || 'talão.jpg'}
                          </span>
                          {tx.receiptFileSize && (
                            <span className="text-[9.5px] font-mono text-on-surface-variant/80">
                              {tx.receiptFileSize}
                            </span>
                          )}
                        </div>
                      </button>
                    ) : (
                      <div className="text-[11px] text-on-surface-variant italic shrink-0">
                        Sem ficheiro de imagem anexado
                      </div>
                    )}
                  </div>

                  {/* Right Column: Action Buttons */}
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={() => setInspectingTx(tx)}
                      className="p-2.5 rounded-xl border border-surface-border hover:bg-surface-container-high text-on-surface-variant transition-colors cursor-pointer"
                      title="Ver Auditoria e Detalhes Completos"
                    >
                      <Icon name="history" className="text-[20px]" />
                    </button>

                    <button
                      type="button"
                      onClick={() => onRejectTransaction(tx.id)}
                      className="px-3.5 py-2.5 rounded-xl border border-red-200 bg-red-50 text-red-700 hover:bg-red-100 transition-colors font-bold text-xs flex items-center gap-1.5 cursor-pointer active:scale-95"
                    >
                      <Icon name="close" className="text-[16px]" />
                      Rejeitar
                    </button>

                    <button
                      type="button"
                      onClick={() => onApproveTransaction(tx.id)}
                      className="px-4 py-2.5 rounded-xl bg-emerald-600 text-white hover:bg-emerald-700 transition-colors font-bold text-xs flex items-center gap-1.5 shadow-sm cursor-pointer active:scale-95"
                    >
                      <Icon name="check_circle" className="text-[16px]" />
                      Aprovar & Liberar CV
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal: Full Receipt Image Viewer */}
      {viewingReceiptImage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-surface-container-lowest rounded-2xl max-w-2xl w-full p-5 shadow-2xl border border-surface-border space-y-4">
            <div className="flex items-center justify-between border-b border-surface-border pb-3">
              <h3 className="font-bold text-sm text-on-surface flex items-center gap-2">
                <Icon name="receipt_long" className="text-primary text-[20px]" />
                {viewingReceiptImage.title}
              </h3>
              <button
                onClick={() => setViewingReceiptImage(null)}
                className="p-1.5 rounded-lg hover:bg-surface-container-high text-on-surface-variant"
              >
                <Icon name="close" className="text-[20px]" />
              </button>
            </div>

            <div className="max-h-[70vh] overflow-auto rounded-xl bg-slate-950 flex items-center justify-center p-2">
              <img
                src={viewingReceiptImage.url}
                alt="Comprovativo ampliado"
                className="max-h-[65vh] w-auto object-contain rounded-lg shadow-md"
              />
            </div>

            <div className="flex items-center justify-between pt-1 text-xs">
              <span className="text-on-surface-variant">
                Cruze a data, valor (2.000 Kz) e os 4 dígitos com o extrato.
              </span>
              <button
                onClick={() => setViewingReceiptImage(null)}
                className="px-4 py-2 bg-surface-container-high rounded-xl font-bold hover:bg-surface-container-highest transition-colors"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Audit Logs & Inspection */}
      {inspectingTx && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-surface-container-lowest rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-surface-border space-y-4">
            <div className="flex items-center justify-between border-b border-surface-border pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                  <Icon name="verified_user" className="text-[20px]" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-on-surface">
                    Detalhes e Trilha de Auditoria
                  </h3>
                  <span className="text-xs font-mono text-primary font-bold">{inspectingTx.id}</span>
                </div>
              </div>
              <button
                onClick={() => setInspectingTx(null)}
                className="p-1.5 rounded-lg hover:bg-surface-container-high text-on-surface-variant"
              >
                <Icon name="close" className="text-[20px]" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="bg-surface-container-low p-3.5 rounded-xl space-y-2 border border-surface-border">
                <div className="flex justify-between">
                  <span className="text-on-surface-variant">Cliente:</span>
                  <span className="font-bold text-on-surface">{inspectingTx.userName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-on-surface-variant">E-mail:</span>
                  <span className="font-mono text-on-surface">{inspectingTx.userEmail}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-on-surface-variant">Telemóvel:</span>
                  <span className="font-mono text-on-surface">{inspectingTx.userPhone || 'Não informado'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-on-surface-variant">Valor:</span>
                  <span className="font-bold text-slate-900 font-display">{inspectingTx.amount.toLocaleString()} Kz</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-on-surface-variant">Últimos 4 Dígitos:</span>
                  <span className="font-mono font-bold text-amber-900 bg-amber-100 px-1.5 rounded">
                    **** {inspectingTx.senderLast4 || 'N/A'}
                  </span>
                </div>
              </div>

              {/* Audit History */}
              <div className="space-y-2">
                <h4 className="font-bold text-xs text-on-surface uppercase tracking-wider">
                  Histórico de Eventos & Auditoria
                </h4>
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  <div className="p-2.5 bg-surface-container-low rounded-xl border border-surface-border flex items-start gap-2">
                    <Icon name="arrow_upward" className="text-[16px] text-primary shrink-0 mt-0.5" />
                    <div className="space-y-0.5 flex-1">
                      <div className="flex justify-between items-center">
                        <span className="font-bold text-on-surface">Submissão do Comprovativo</span>
                        <span className="text-[10px] text-on-surface-variant">{inspectingTx.date} às {inspectingTx.time}</span>
                      </div>
                      <p className="text-on-surface-variant text-[11px]">
                        Comprovativo submetido pelo utilizador via {inspectingTx.method}.
                      </p>
                    </div>
                  </div>

                  {inspectingTx.auditLogs?.map((log, i) => (
                    <div
                      key={i}
                      className={`p-2.5 rounded-xl border flex items-start gap-2 ${
                        log.action === 'aprovado'
                          ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                          : 'bg-red-50 border-red-200 text-red-900'
                      }`}
                    >
                      <Icon name={log.action === 'aprovado' ? 'check_circle' : 'cancel'} className="text-[16px] shrink-0 mt-0.5" />
                      <div className="space-y-0.5 flex-1 text-[11px]">
                        <div className="flex justify-between items-center font-bold">
                          <span>Ação: {log.action.toUpperCase()}</span>
                          <span className="text-[10px] font-normal">{log.timestamp}</span>
                        </div>
                        <p>Por: {log.by} ({log.role})</p>
                        {log.note && <p className="font-semibold mt-1">Motivo: {log.note}</p>}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setInspectingTx(null)}
                className="px-4 py-2 rounded-xl bg-primary text-white text-xs font-bold hover:bg-primary/95"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
