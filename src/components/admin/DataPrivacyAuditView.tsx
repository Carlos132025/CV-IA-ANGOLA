import React, { useState } from 'react';
import { DataAuditLog, DataDeletionRequest } from '../../types';
import { getAuditLogs, getDeletionRequests, updateDeletionRequestStatus, recordAuditLog } from '../../utils/security';

interface DataPrivacyAuditViewProps {
  onToast: (msg: string) => void;
  currentUserEmail?: string;
  onDeleteUserAccount?: (userId: string) => void;
}

export const DataPrivacyAuditView: React.FC<DataPrivacyAuditViewProps> = ({
  onToast,
  currentUserEmail,
  onDeleteUserAccount,
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'audit_logs' | 'deletion_requests'>('audit_logs');
  const [auditLogs, setAuditLogs] = useState<DataAuditLog[]>(() => getAuditLogs());
  const [deletionRequests, setDeletionRequests] = useState<DataDeletionRequest[]>(() => getDeletionRequests());
  const [filterType, setFilterType] = useState<string>('all');

  const handleProcessDeletion = (req: DataDeletionRequest, approved: boolean) => {
    const status = approved ? 'Processado' : 'Recusado';
    const notes = approved
      ? 'Dados expurgados e eliminados com sucesso da base em conformidade com o Direito ao Esquecimento (Lei 22/11).'
      : 'Pedido recusado por pendência financeira ou obrigação fiscal de conservação.';

    updateDeletionRequestStatus(req.id, status, currentUserEmail || 'cv.ia.angola@gmail.com', notes);

    // Record Audit Log
    recordAuditLog({
      accessedBy: currentUserEmail || 'cv.ia.angola@gmail.com',
      actorRole: 'Administrador de Dados (DPO)',
      targetUserId: req.userId,
      targetUserName: req.userName,
      accessType: 'pedido_eliminacao',
      details: `${approved ? 'Eliminação definitiva de dados executada' : 'Pedido de eliminação recusado'} para o utilizador ${req.userName} (ID: ${req.userId}).`,
    });

    if (approved && onDeleteUserAccount) {
      onDeleteUserAccount(req.userId);
    }

    setDeletionRequests(getDeletionRequests());
    setAuditLogs(getAuditLogs());
    onToast(approved ? `Dados do utilizador ${req.userName} eliminados da base de dados!` : `Pedido de eliminação recusado.`);
  };

  const filteredLogs = auditLogs.filter((log) => {
    if (filterType === 'all') return true;
    return log.accessType === filterType;
  });

  const pendingDeletionCount = deletionRequests.filter((r) => r.status === 'Pendente').length;

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-bold mb-1">
            <span className="material-symbols-outlined text-[16px]">security</span>
            Conformidade com a Lei n.º 22/11 — Proteção de Dados de Angola
          </div>
          <h2 className="text-2xl font-bold text-on-surface font-display">
            Auditoria & Proteção de Dados Pessoais
          </h2>
          <p className="text-xs text-on-surface-variant">
            Acesso exclusivo à conta oficial <strong>cv.ia.angola@gmail.com</strong>. Registo de acessos a dados sensíveis e pedidos de eliminação.
          </p>
        </div>

        {/* Sub-tab Navigation */}
        <div className="flex items-center gap-2 p-1 bg-surface-container rounded-2xl border border-surface-border">
          <button
            type="button"
            onClick={() => setActiveSubTab('audit_logs')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
              activeSubTab === 'audit_logs'
                ? 'bg-surface-container-lowest text-primary shadow-xs'
                : 'text-on-surface-variant hover:text-on-surface'
            }`}
          >
            <span className="material-symbols-outlined text-[16px]">receipt_long</span>
            Logs de Auditoria ({auditLogs.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveSubTab('deletion_requests')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer relative ${
              activeSubTab === 'deletion_requests'
                ? 'bg-surface-container-lowest text-primary shadow-xs'
                : 'text-on-surface-variant hover:text-on-surface'
            }`}
          >
            <span className="material-symbols-outlined text-[16px]">person_remove</span>
            Pedidos de Eliminação
            {pendingDeletionCount > 0 && (
              <span className="w-5 h-5 rounded-full bg-error text-white text-[10px] flex items-center justify-center font-bold">
                {pendingDeletionCount}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Security Status Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-4 rounded-2xl bg-surface-container-low border border-surface-border flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
            <span className="material-symbols-outlined text-[22px]">https</span>
          </div>
          <div>
            <div className="text-xs font-bold text-on-surface">Protocolo HTTPS</div>
            <div className="text-[11px] text-on-surface-variant">Conexões TLS 1.3 encriptadas em trânsito</div>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-surface-container-low border border-surface-border flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
            <span className="material-symbols-outlined text-[22px]">lock</span>
          </div>
          <div>
            <div className="text-xs font-bold text-on-surface">Encriptação em Repouso</div>
            <div className="text-[11px] text-on-surface-variant">Fotos, contactos e comprovativos cifrados</div>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-surface-container-low border border-surface-border flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center">
            <span className="material-symbols-outlined text-[22px]">admin_panel_settings</span>
          </div>
          <div>
            <div className="text-xs font-bold text-on-surface">Acesso Restrito DPO</div>
            <div className="text-[11px] text-on-surface-variant font-mono">cv.ia.angola@gmail.com</div>
          </div>
        </div>
      </div>

      {/* SUB-TAB 1: AUDIT LOGS */}
      {activeSubTab === 'audit_logs' && (
        <div className="bg-surface-container-lowest rounded-3xl border border-surface-border shadow-xs overflow-hidden">
          {/* Controls */}
          <div className="p-4 border-b border-surface-border flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-on-surface">Filtrar por Ação:</span>
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="bg-surface-container border border-surface-border rounded-xl px-3 py-1.5 text-xs font-medium outline-none"
              >
                <option value="all">Todas as Ações</option>
                <option value="visualizacao_comprovativo">Visualização de Comprovativo</option>
                <option value="visualizacao_cv">Visualização de CV</option>
                <option value="pedido_eliminacao">Pedido de Eliminação</option>
                <option value="exportacao">Exportação de PDF</option>
              </select>
            </div>
            <span className="text-xs text-on-surface-variant">
              Apresentando <strong>{filteredLogs.length}</strong> registos de auditoria
            </span>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-surface-container-low border-b border-surface-border text-on-surface-variant font-semibold">
                <tr>
                  <th className="py-3 px-4">Data/Hora</th>
                  <th className="py-3 px-4">Acedido Por</th>
                  <th className="py-3 px-4">Tipo de Acesso</th>
                  <th className="py-3 px-4">Utilizador Alvo</th>
                  <th className="py-3 px-4">Detalhes do Acesso</th>
                  <th className="py-3 px-4">Origem / IP</th>
                  <th className="py-3 px-4">Segurança</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-border">
                {filteredLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-surface-container-low/50 transition-colors">
                    <td className="py-3 px-4 font-mono text-[11px] text-on-surface-variant whitespace-nowrap">
                      {log.timestamp}
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      <div className="font-bold text-on-surface">{log.accessedBy}</div>
                      <div className="text-[10px] text-on-surface-variant">{log.actorRole}</div>
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-primary/10 text-primary">
                        {log.accessType === 'visualizacao_comprovativo' && 'Comprovativo Pago'}
                        {log.accessType === 'visualizacao_cv' && 'Visualização CV'}
                        {log.accessType === 'pedido_eliminacao' && 'Pedido Eliminação'}
                        {log.accessType === 'exportacao' && 'Exportação PDF'}
                        {log.accessType === 'aprovacao_pagamento' && 'Aprovação'}
                        {log.accessType === 'edicao_dados' && 'Edição'}
                      </span>
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap font-medium text-on-surface">
                      {log.targetUserName}
                    </td>
                    <td className="py-3 px-4 text-on-surface-variant max-w-md">
                      {log.details}
                    </td>
                    <td className="py-3 px-4 font-mono text-[11px] text-on-surface-variant whitespace-nowrap">
                      {log.ip || 'TLS / HTTPS'}
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md">
                        <span className="material-symbols-outlined text-[13px]">lock</span>
                        Cifrado
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* SUB-TAB 2: DELETION REQUESTS */}
      {activeSubTab === 'deletion_requests' && (
        <div className="space-y-4">
          <div className="bg-surface-container-lowest rounded-3xl border border-surface-border shadow-xs overflow-hidden">
            <div className="p-4 border-b border-surface-border">
              <h3 className="font-bold text-sm text-on-surface">
                Solicitações de Eliminação de Dados Pessoais (Direito ao Esquecimento - Lei 22/11)
              </h3>
              <p className="text-xs text-on-surface-variant">
                Processamento oficial de pedidos de titulares dos dados para expurgação definitiva de contas, CVs e contactos.
              </p>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-surface-container-low border-b border-surface-border text-on-surface-variant font-semibold">
                  <tr>
                    <th className="py-3 px-4">Solicitado Em</th>
                    <th className="py-3 px-4">Utilizador</th>
                    <th className="py-3 px-4">Contacto</th>
                    <th className="py-3 px-4">Motivo Apresentado</th>
                    <th className="py-3 px-4">Estado</th>
                    <th className="py-3 px-4 text-right">Ação</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-surface-border">
                  {deletionRequests.map((req) => (
                    <tr key={req.id} className="hover:bg-surface-container-low/50 transition-colors">
                      <td className="py-3 px-4 font-mono text-[11px] text-on-surface-variant whitespace-nowrap">
                        {req.requestedAt}
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap font-bold text-on-surface">
                        {req.userName}
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap font-mono text-[11px] text-on-surface-variant">
                        {req.userEmail}<br />{req.userPhone}
                      </td>
                      <td className="py-3 px-4 text-on-surface-variant max-w-sm">
                        {req.reason || 'Solicitação nos termos da Lei 22/11'}
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                            req.status === 'Pendente'
                              ? 'bg-amber-100 text-amber-800'
                              : req.status === 'Processado'
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-error-container text-on-error-container'
                          }`}
                        >
                          {req.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right whitespace-nowrap">
                        {req.status === 'Pendente' ? (
                          <div className="flex items-center justify-end gap-2">
                            <button
                              type="button"
                              onClick={() => handleProcessDeletion(req, true)}
                              className="px-3 py-1.5 rounded-xl bg-error text-white text-[11px] font-bold hover:bg-error/90 transition-all shadow-xs cursor-pointer flex items-center gap-1"
                            >
                              <span className="material-symbols-outlined text-[14px]">delete_forever</span>
                              Eliminar Dados
                            </button>
                            <button
                              type="button"
                              onClick={() => handleProcessDeletion(req, false)}
                              className="px-3 py-1.5 rounded-xl border border-surface-border text-on-surface-variant hover:bg-surface-container text-[11px] font-bold transition-all cursor-pointer"
                            >
                              Recusar
                            </button>
                          </div>
                        ) : (
                          <span className="text-[11px] text-on-surface-variant font-mono">
                            Processado por {req.processedBy}
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
