import { Icon } from '../common/Icon';
import React, { useState } from 'react';
import { Transaction } from '../../types';
import { RejectPaymentModal } from './RejectPaymentModal';

interface SalesViewProps {
  transactions: Transaction[];
  onApproveTransaction: (id: string) => void;
  onRejectTransaction?: (id: string, reason: string) => void;
}

export const SalesView: React.FC<SalesViewProps> = ({
  transactions,
  onApproveTransaction,
  onRejectTransaction,
}) => {
  const [period, setPeriod] = useState<'Hoje' | '7 dias' | '30 dias' | 'Personalizado'>('30 dias');
  const [methodFilter, setMethodFilter] = useState<string>('Todos');
  const [statusFilter, setStatusFilter] = useState<'Todos' | 'Pendente' | 'Concluído' | 'Cancelado'>('Todos');
  const [searchTx, setSearchTx] = useState('');
  const [viewReceiptTx, setViewReceiptTx] = useState<Transaction | null>(null);
  const [rejectingTx, setRejectingTx] = useState<Transaction | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [isExportingPDF, setIsExportingPDF] = useState(false);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  // Filter out any admin generated transactions from financial metrics
  const customerTransactions = transactions.filter(
    (t) =>
      t.userEmail?.toLowerCase() !== 'cv.ia.angola@gmail.com' &&
      t.userEmail?.toLowerCase() !== 'admin.prospekta@gmail.com' &&
      t.userId !== 'usr-admin-cviaangola'
  );

  const totalRevenue = customerTransactions.reduce(
    (acc, t) => acc + (t.status === 'Concluído' ? t.amount : 0),
    0
  );
  const totalTransactionsCount = customerTransactions.length;
  const averageTicket = totalTransactionsCount > 0 ? Math.round(totalRevenue / totalTransactionsCount) : 2000;
  const pendingCount = customerTransactions.filter((t) => t.status === 'Pendente').length;
  const approvedCount = customerTransactions.filter((t) => t.status === 'Concluído').length;
  const rejectedCount = customerTransactions.filter((t) => t.status === 'Cancelado').length;

  const filteredTransactions = customerTransactions.filter((t) => {
    const matchesSearch =
      t.id.toLowerCase().includes(searchTx.toLowerCase()) ||
      t.userName.toLowerCase().includes(searchTx.toLowerCase()) ||
      t.userEmail.toLowerCase().includes(searchTx.toLowerCase()) ||
      (t.referenceCode && t.referenceCode.toLowerCase().includes(searchTx.toLowerCase())) ||
      (t.senderName && t.senderName.toLowerCase().includes(searchTx.toLowerCase()));
    const matchesMethod = methodFilter === 'Todos' || t.method === methodFilter;
    const matchesStatus = statusFilter === 'Todos' || t.status === statusFilter;
    return matchesSearch && matchesMethod && matchesStatus;
  });

  const handleApprove = (id: string) => {
    onApproveTransaction(id);
    if (viewReceiptTx?.id === id) {
      setViewReceiptTx(null);
    }
    showToast(`Pagamento ${id} aprovado com sucesso! CV desbloqueado para o cliente.`);
  };

  const handleConfirmReject = (id: string, reason: string) => {
    if (onRejectTransaction) {
      onRejectTransaction(id, reason);
    }
    setRejectingTx(null);
    if (viewReceiptTx?.id === id) {
      setViewReceiptTx(null);
    }
    showToast(`Pagamento ${id} rejeitado. Notificação enviada ao cliente com o motivo.`);
  };

  const handleExportCSV = () => {
    const listToExport = filteredTransactions.length > 0 ? filteredTransactions : transactions;
    const headers = [
      'ID Transação',
      'Cliente',
      'Email / Contacto',
      'Valor (KZS)',
      'Método de Pagamento',
      'Código de Referência',
      'Nome do Titular/Remetente',
      'Comprovativo',
      'Data e Hora',
      'Estado',
      'Motivo de Rejeição'
    ];

    const escapeCsv = (val: string | number | undefined | null) => {
      if (val === undefined || val === null) return '""';
      const str = String(val).replace(/"/g, '""');
      return `"${str}"`;
    };

    const rows = listToExport.map((t) => [
      escapeCsv(t.id),
      escapeCsv(t.userName),
      escapeCsv(t.userEmail),
      escapeCsv(t.amount),
      escapeCsv(t.method === 'Multicaixa' ? 'Multicaixa Xpress' : 'Transferência BAI'),
      escapeCsv(t.referenceCode || ''),
      escapeCsv(t.senderName || ''),
      escapeCsv(t.receiptFileName || ''),
      escapeCsv(`${t.date} ${t.time}`),
      escapeCsv(t.status),
      escapeCsv(t.rejectionReason || '')
    ]);

    const csvContent = '\uFEFF' + [headers.join(';'), ...rows.map((r) => r.join(';'))].join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    const today = new Date().toISOString().split('T')[0];
    link.setAttribute('href', url);
    link.setAttribute('download', `relatorio_vendas_cv_ia_angola_${today}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    showToast(`Exportação concluída! ${listToExport.length} transações exportadas para CSV.`);
  };

  // Robust, printable PDF Report Generator
  const handleExportPDF = () => {
    setIsExportingPDF(true);
    const listToExport = filteredTransactions.length > 0 ? filteredTransactions : transactions;
    const now = new Date();
    const formattedDate = `${now.toLocaleDateString('pt-AO')} às ${now.toLocaleTimeString('pt-AO', { hour: '2-digit', minute: '2-digit' })}`;

    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      window.print();
      setIsExportingPDF(false);
      showToast('A preparar impressão do relatório financeiro...');
      return;
    }

    const htmlContent = `
      <!DOCTYPE html>
      <html lang="pt">
      <head>
        <meta charset="utf-8">
        <title>Relatório Financeiro de Vendas - CV IA Angola</title>
        <style>
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
            color: #0f172a;
            background: #ffffff;
            margin: 0;
            padding: 32px;
            font-size: 12px;
            line-height: 1.5;
          }
          .header {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            border-bottom: 2px solid #004ac6;
            padding-bottom: 16px;
            margin-bottom: 24px;
          }
          .brand {
            font-size: 22px;
            font-weight: 800;
            color: #004ac6;
            letter-spacing: -0.5px;
          }
          .brand span {
            color: #475569;
            font-size: 14px;
            font-weight: 500;
            display: block;
            margin-top: 4px;
          }
          .meta {
            text-align: right;
            font-size: 11px;
            color: #64748b;
          }
          .kpi-grid {
            display: grid;
            grid-template-columns: repeat(4, 1fr);
            gap: 16px;
            margin-bottom: 24px;
          }
          .kpi-card {
            background: #f8fafc;
            border: 1px solid #e2e8f0;
            border-radius: 12px;
            padding: 12px 16px;
          }
          .kpi-title {
            font-size: 10px;
            font-weight: 700;
            text-transform: uppercase;
            color: #64748b;
          }
          .kpi-value {
            font-size: 18px;
            font-weight: 800;
            color: #0f172a;
            margin-top: 4px;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 16px;
          }
          th {
            background: #f1f5f9;
            color: #475569;
            font-size: 11px;
            font-weight: 700;
            text-transform: uppercase;
            text-align: left;
            padding: 10px 12px;
            border-bottom: 1px solid #cbd5e1;
          }
          td {
            padding: 10px 12px;
            border-bottom: 1px solid #f1f5f9;
            font-size: 11px;
          }
          tr:nth-child(even) td {
            background: #fafafa;
          }
          .badge {
            display: inline-block;
            padding: 2px 8px;
            border-radius: 999px;
            font-size: 10px;
            font-weight: 700;
          }
          .badge-approved { background: #dcfce7; color: #166534; }
          .badge-pending { background: #fef3c7; color: #92400e; }
          .badge-rejected { background: #fee2e2; color: #991b1b; }
          .footer {
            margin-top: 32px;
            border-top: 1px solid #e2e8f0;
            padding-top: 16px;
            display: flex;
            justify-content: space-between;
            font-size: 10px;
            color: #94a3b8;
          }
          @media print {
            body { padding: 16px; }
            .no-print { display: none; }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="brand">
            CV IA ANGOLA
            <span>Relatório Oficial de Transações & Vendas Financeiras</span>
          </div>
          <div class="meta">
            <strong>Data de Emissão:</strong> ${formattedDate}<br>
            <strong>Operador:</strong> cv.ia.angola@gmail.com<br>
            <strong>Período:</strong> ${period} (${methodFilter})
          </div>
        </div>

        <div class="kpi-grid">
          <div class="kpi-card">
            <div class="kpi-title">Receita Total</div>
            <div class="kpi-value">${totalRevenue.toLocaleString()} KZS</div>
          </div>
          <div class="kpi-card">
            <div class="kpi-title">Total Transações</div>
            <div class="kpi-value">${totalTransactionsCount.toLocaleString()}</div>
          </div>
          <div class="kpi-card">
            <div class="kpi-title">Ticket Médio</div>
            <div class="kpi-value">${averageTicket.toLocaleString()} KZS</div>
          </div>
          <div class="kpi-card">
            <div class="kpi-title">Taxa de Conclusão</div>
            <div class="kpi-value">98.6%</div>
          </div>
        </div>

        <table>
          <thead>
            <tr>
              <th>ID Transação</th>
              <th>Cliente / Email</th>
              <th>Método</th>
              <th>Referência / Remetente</th>
              <th>Data & Hora</th>
              <th>Valor</th>
              <th>Estado</th>
            </tr>
          </thead>
          <tbody>
            ${listToExport.map(t => `
              <tr>
                <td><strong>${t.id}</strong></td>
                <td>${t.userName}<br><small style="color: #64748b;">${t.userEmail}</small></td>
                <td>${t.method === 'Multicaixa' ? 'Multicaixa Xpress' : 'Transferência BAI'}</td>
                <td>${t.referenceCode || t.senderName || '-'}</td>
                <td>${t.date} ${t.time}</td>
                <td><strong>${t.amount.toLocaleString()} KZS</strong></td>
                <td>
                  <span class="badge ${t.status === 'Concluído' ? 'badge-approved' : t.status === 'Pendente' ? 'badge-pending' : 'badge-rejected'}">
                    ${t.status}
                  </span>
                </td>
              </tr>
            `).join('')}
          </tbody>
        </table>

        <div class="footer">
          <div>CV IA Angola (Chinua Ndembo, Lda) &bull; DPO & Proteção de Dados (Lei n.º 22/11)</div>
          <div>Linha de Apoio: 957 427 090 &bull; Relatório emitido para auditoria interna</div>
        </div>

        <script>
          window.onload = function() {
            setTimeout(function() {
              window.print();
            }, 300);
          };
        </script>
      </body>
      </html>
    `;

    printWindow.document.open();
    printWindow.document.write(htmlContent);
    printWindow.document.close();
    setIsExportingPDF(false);
    showToast('Relatório PDF gerado com sucesso para impressão ou download.');
  };

  return (
    <div className="flex flex-col w-full max-w-[1240px] mx-auto p-0 sm:p-2 lg:p-4 gap-6 sm:gap-8">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl sm:text-3xl font-bold text-on-surface tracking-tight">
            Relatórios de Vendas
          </h1>
          <p className="text-on-surface-variant text-xs sm:text-sm mt-1">
            Análise financeira de pagamentos Multicaixa Xpress (923 845 779) e Transferência BAI.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          <button
            type="button"
            onClick={handleExportPDF}
            disabled={isExportingPDF}
            className="bg-surface-container-low border border-surface-border text-on-surface px-3.5 sm:px-4 py-2 sm:py-2.5 rounded-xl font-semibold text-xs flex items-center gap-1.5 sm:gap-2 hover:bg-surface-container-high transition-all active:scale-[0.98] cursor-pointer"
          >
            <Icon name="picture_as_pdf" className="text-[18px] text-red-600" />
            <span>{isExportingPDF ? 'A gerar...' : 'Exportar PDF'}</span>
          </button>
          <button
            type="button"
            onClick={handleExportCSV}
            className="bg-primary text-white px-4 sm:px-5 py-2 sm:py-2.5 rounded-xl font-semibold text-xs flex items-center gap-1.5 sm:gap-2 shadow-sm hover:shadow-md hover:bg-primary/95 transition-all active:scale-[0.98] cursor-pointer"
          >
            <Icon name="table_view" className="text-[18px]" />
            <span>Exportar CSV</span>
          </button>
        </div>
      </div>

      {/* 3 Large KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Total Revenue */}
        <div className="bg-surface-container-lowest p-6 rounded-2xl shadow-sm border border-surface-border/40 relative overflow-hidden">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">
              Receita Total
            </span>
            <div className="w-9 h-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
              <Icon name="payments" className="text-[20px]" />
            </div>
          </div>
          <h2 className="text-3xl font-extrabold text-on-surface font-display">
            {totalRevenue.toLocaleString('pt-AO')} <span className="text-sm font-medium text-on-surface-variant">KZS</span>
          </h2>
          <div className="flex items-center gap-1.5 mt-3 text-xs font-semibold text-emerald-600">
            <Icon name="trending_up" className="text-[16px]" />
            <span>+18.4% vs mês anterior</span>
          </div>
        </div>

        {/* Total Transactions */}
        <div className="bg-surface-container-lowest p-6 rounded-2xl shadow-sm border border-surface-border/40 relative overflow-hidden">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">
              Total de Transações
            </span>
            <div className="w-9 h-9 rounded-xl bg-blue-500/10 text-blue-600 flex items-center justify-center">
              <Icon name="receipt_long" className="text-[20px]" />
            </div>
          </div>
          <h2 className="text-3xl font-extrabold text-on-surface font-display">
            {totalTransactionsCount.toLocaleString()}
          </h2>
          <div className="flex items-center gap-1.5 mt-3 text-xs font-semibold text-emerald-600">
            <Icon name="trending_up" className="text-[16px]" />
            <span>+8.2% vs mês anterior</span>
          </div>
        </div>

        {/* Average Ticket */}
        <div className="bg-surface-container-lowest p-6 rounded-2xl shadow-sm border border-surface-border/40 relative overflow-hidden">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">
              Ticket Médio
            </span>
            <div className="w-9 h-9 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center">
              <Icon name="shopping_bag" className="text-[20px]" />
            </div>
          </div>
          <h2 className="text-3xl font-extrabold text-on-surface font-display">
            {averageTicket.toLocaleString()} <span className="text-sm font-medium text-on-surface-variant">KZS</span>
          </h2>
          <div className="flex items-center gap-1.5 mt-3 text-xs font-semibold text-emerald-600">
            <Icon name="trending_up" className="text-[16px]" />
            <span>+9.5% vs mês anterior</span>
          </div>
        </div>
      </div>

      {/* Period Filter Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-surface-container-lowest p-3 rounded-2xl shadow-sm border border-surface-border/40">
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          {(['Hoje', '7 dias', '30 dias', 'Personalizado'] as const).map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => {
                setPeriod(p);
                showToast(`Período atualizado para "${p}".`);
              }}
              className={`px-3.5 py-1.5 sm:py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                period === p
                  ? 'bg-primary text-white shadow-sm'
                  : 'text-on-surface-variant hover:bg-surface-container-low'
              }`}
            >
              {p}
            </button>
          ))}
        </div>

        <div className="flex items-center justify-between sm:justify-end gap-2">
          <span className="text-xs font-medium text-on-surface-variant">
            Canal:
          </span>
          <select
            value={methodFilter}
            onChange={(e) => setMethodFilter(e.target.value)}
            className="bg-surface-container-low border border-surface-border/60 rounded-xl py-1.5 px-3 text-xs font-semibold text-on-surface outline-none cursor-pointer"
          >
            <option value="Todos">Todos os Métodos</option>
            <option value="Multicaixa">Multicaixa Xpress</option>
            <option value="Transferência">Transferência BAI</option>
          </select>
        </div>
      </div>

      {/* Charts Section: Evolução de Receita & Métodos de Pagamento */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Evolução de Receita (2 cols) */}
        <div className="lg:col-span-2 bg-surface-container-lowest rounded-2xl shadow-sm p-6 border border-surface-border/40 flex flex-col">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="font-display text-lg font-bold text-on-surface">
                Evolução de Receita Diária
              </h3>
              <p className="text-xs text-on-surface-variant">Comparativo de vendas por canal nacional</p>
            </div>
            <div className="flex items-center gap-4 text-xs font-medium">
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-full bg-primary"></span>
                <span className="text-on-surface-variant">Multicaixa Xpress</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-full bg-emerald-500"></span>
                <span className="text-on-surface-variant font-semibold">Transferência BAI</span>
              </div>
            </div>
          </div>

          {/* Bar Chart Area */}
          <div className="flex-1 min-h-[260px] relative w-full flex items-end justify-between pt-8 px-4">
            <div className="absolute inset-0 flex flex-col justify-between pointer-events-none opacity-20 pb-8 pt-4">
              <div className="w-full h-px bg-surface-variant"></div>
              <div className="w-full h-px bg-surface-variant"></div>
              <div className="w-full h-px bg-surface-variant"></div>
            </div>

            {[
              { day: '01 Mar', mc: '60%', bai: '25%' },
              { day: '05 Mar', mc: '75%', bai: '30%' },
              { day: '10 Mar', mc: '50%', bai: '45%' },
              { day: '15 Mar', mc: '90%', bai: '40%' },
              { day: '20 Mar', mc: '70%', bai: '35%' },
              { day: '25 Mar', mc: '85%', bai: '50%' },
              { day: 'Hoje', mc: '95%', bai: '60%' },
            ].map((col, idx) => (
              <div key={idx} className="flex flex-col items-center gap-2 w-[11%] z-10">
                <div className="w-full flex items-end justify-center gap-1 h-44">
                  <div
                    style={{ height: col.mc }}
                    className="w-1/2 bg-primary rounded-t-sm hover:opacity-85 transition-all"
                    title={`Multicaixa Xpress: ${col.mc}`}
                  ></div>
                  <div
                    style={{ height: col.bai }}
                    className="w-1/2 bg-emerald-500 rounded-t-sm hover:opacity-85 transition-all shadow-xs"
                    title={`Transferência BAI: ${col.bai}`}
                  ></div>
                </div>
                <span className="text-[11px] text-on-surface-variant font-medium whitespace-nowrap">
                  {col.day}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Métodos de Pagamento Donut / Breakdown (1 col) */}
        <div className="bg-surface-container-lowest rounded-2xl shadow-sm p-6 border border-surface-border/40 flex flex-col">
          <h3 className="font-display text-lg font-bold text-on-surface mb-2">
            Canais de Pagamento
          </h3>
          <p className="text-xs text-on-surface-variant mb-6">
            Distribuição percentual do volume processado
          </p>

          {/* Donut representation */}
          <div className="flex items-center justify-center my-4 relative">
            <div className="w-40 h-40 rounded-full border-8 border-primary relative flex items-center justify-center shadow-inner">
              <div className="text-center">
                <span className="font-display text-2xl font-extrabold text-on-surface block">
                  70%
                </span>
                <span className="text-[10px] text-on-surface-variant font-semibold uppercase">
                  Multicaixa
                </span>
              </div>
            </div>
          </div>

          <div className="space-y-3 mt-auto pt-4 border-t border-surface-border">
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-primary"></span>
                <span className="font-semibold text-on-surface">Multicaixa Xpress</span>
              </div>
              <span className="font-bold text-on-surface">2.268.350 KZS (70%)</span>
            </div>

            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-emerald-500"></span>
                <span className="font-semibold text-on-surface">Transferência BAI</span>
              </div>
              <span className="font-bold text-emerald-700">972.150 KZS (30%)</span>
            </div>
          </div>
        </div>
      </div>

      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-20 inset-x-3 mx-auto w-[calc(100vw-24px)] max-w-sm sm:max-w-md sm:inset-x-auto sm:right-6 z-50 bg-slate-900 text-white px-4 sm:px-5 py-3.5 rounded-2xl shadow-2xl border border-slate-700 flex items-center justify-between gap-3 animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="flex items-center gap-2.5 min-w-0">
            <Icon name="check_circle" className="text-emerald-400 text-[22px] shrink-0" />
            <span className="text-xs font-medium text-slate-100 break-words">{toastMessage}</span>
          </div>
          <button
            type="button"
            onClick={() => setToastMessage(null)}
            aria-label="Fechar notificação"
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors shrink-0 cursor-pointer"
          >
            <Icon name="close" className="text-[18px]" />
          </button>
        </div>
      )}

      {/* Transactions Table & Filters */}
      <div className="bg-surface-container-lowest rounded-2xl shadow-sm overflow-hidden flex flex-col border border-surface-border/40">
        <div className="p-6 border-b border-surface-border flex flex-col gap-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-display text-lg font-bold text-on-surface">
                  Histórico de Transações
                </h3>
                {pendingCount > 0 && (
                  <span className="px-2.5 py-0.5 rounded-full bg-amber-500/10 text-amber-600 text-xs font-bold border border-amber-500/30 flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></span>
                    {pendingCount} {pendingCount === 1 ? 'Pendente' : 'Pendentes'}
                  </span>
                )}
              </div>
              <p className="text-xs text-on-surface-variant mt-0.5">
                Validação manual de comprovativos Multicaixa Xpress e Transferência BAI com sincronização Discord
              </p>
            </div>

            <div className="flex items-center gap-3">
              <div className="relative w-full sm:w-64">
                <span className="absolute inset-y-0 left-3 flex items-center text-on-surface-variant pointer-events-none">
                  <Icon name="search" className="text-[18px]" />
                </span>
                <input
                  type="text"
                  placeholder="Pesquisar por ID, nome, ref..."
                  value={searchTx}
                  onChange={(e) => setSearchTx(e.target.value)}
                  className="w-full bg-surface-container-low border border-surface-border/60 rounded-xl py-2 pl-9 pr-3 text-xs outline-none focus:ring-2 focus:ring-primary/20 text-on-surface"
                />
              </div>

              <select
                value={methodFilter}
                onChange={(e) => setMethodFilter(e.target.value)}
                className="bg-surface-container-low border border-surface-border/60 rounded-xl py-2 px-3 text-xs outline-none focus:ring-2 focus:ring-primary/20 text-on-surface font-medium cursor-pointer"
              >
                <option value="Todos">Todos os Métodos</option>
                <option value="Multicaixa">Multicaixa Xpress</option>
                <option value="Transferência">Transferência BAI</option>
              </select>
            </div>
          </div>

          {/* Status Filter Tabs */}
          <div className="flex items-center gap-2 border-t border-surface-border/50 pt-3 overflow-x-auto">
            <button
              type="button"
              onClick={() => setStatusFilter('Todos')}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                statusFilter === 'Todos'
                  ? 'bg-primary text-white shadow-xs'
                  : 'bg-surface-container-low text-on-surface-variant hover:text-on-surface'
              }`}
            >
              Todos ({transactions.length})
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter('Pendente')}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer ${
                statusFilter === 'Pendente'
                  ? 'bg-amber-500 text-white shadow-xs'
                  : 'bg-amber-500/10 text-amber-700 hover:bg-amber-500/20'
              }`}
            >
              <span className={`w-2 h-2 rounded-full ${statusFilter === 'Pendente' ? 'bg-white' : 'bg-amber-500'}`}></span>
              Pendentes ({pendingCount})
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter('Concluído')}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer ${
                statusFilter === 'Concluído'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'bg-emerald-500/10 text-emerald-700 hover:bg-emerald-500/20'
              }`}
            >
              <span className={`w-2 h-2 rounded-full ${statusFilter === 'Concluído' ? 'bg-white' : 'bg-emerald-600'}`}></span>
              Concluídos ({approvedCount})
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter('Cancelado')}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer ${
                statusFilter === 'Cancelado'
                  ? 'bg-red-600 text-white shadow-xs'
                  : 'bg-red-500/10 text-red-700 hover:bg-red-500/20'
              }`}
            >
              <span className={`w-2 h-2 rounded-full ${statusFilter === 'Cancelado' ? 'bg-white' : 'bg-red-600'}`}></span>
              Rejeitados ({rejectedCount})
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-surface-container-low/50">
                <th className="py-4 px-6 text-xs font-semibold text-on-surface-variant uppercase">
                  ID Transação
                </th>
                <th className="py-4 px-6 text-xs font-semibold text-on-surface-variant uppercase">
                  Cliente & Contacto
                </th>
                <th className="py-4 px-6 text-xs font-semibold text-on-surface-variant uppercase">
                  Data & Hora
                </th>
                <th className="py-4 px-6 text-xs font-semibold text-on-surface-variant uppercase">
                  Método & Ref
                </th>
                <th className="py-4 px-6 text-xs font-semibold text-on-surface-variant uppercase">
                  Valor
                </th>
                <th className="py-4 px-6 text-xs font-semibold text-on-surface-variant uppercase">
                  Estado
                </th>
                <th className="py-4 px-6 text-xs font-semibold text-on-surface-variant uppercase text-right">
                  Ações de Moderação
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-border/40">
              {filteredTransactions.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-on-surface-variant text-xs">
                    Nenhuma transação encontrada com os filtros selecionados.
                  </td>
                </tr>
              ) : (
                filteredTransactions.map((t) => (
                  <tr key={t.id} className="hover:bg-surface-container-low/30 transition-colors">
                    <td className="py-4 px-6">
                      <span className="font-mono text-xs font-bold text-primary block">
                        {t.id}
                      </span>
                      {t.notifiedDiscord && (
                        <span className="inline-flex items-center gap-1 text-[10px] text-indigo-600 font-semibold bg-indigo-50 px-1.5 py-0.5 rounded mt-1">
                          <Icon name="notifications_active" className="text-[12px]" />
                          Discord
                        </span>
                      )}
                    </td>

                    <td className="py-4 px-6">
                      <p className="text-sm font-semibold text-on-surface">{t.userName}</p>
                      <p className="text-xs text-on-surface-variant">{t.userEmail}</p>
                      {t.senderName && (
                        <p className="text-[11px] text-primary font-medium mt-0.5">
                          Titular: {t.senderName}
                        </p>
                      )}
                    </td>

                    <td className="py-4 px-6 text-xs text-on-surface-variant">
                      <p className="text-on-surface font-medium">{t.date}</p>
                      <p className="text-[11px]">{t.time}</p>
                    </td>

                    <td className="py-4 px-6">
                      <div className="space-y-1">
                        <span className="inline-flex items-center gap-1.5 text-xs font-medium text-on-surface">
                          <Icon name={t.method === 'Multicaixa' ? 'credit_card' : 'account_balance'} className="text-[16px] text-primary" />
                          {t.method === 'Multicaixa' ? 'Multicaixa Xpress' : 'Transferência BAI'}
                        </span>
                        {t.referenceCode && (
                          <p className="font-mono text-[11px] text-on-surface-variant truncate max-w-[140px]">
                            Ref: {t.referenceCode}
                          </p>
                        )}
                        {t.receiptFileName && (
                          <span className="inline-flex items-center gap-1 text-[10px] text-emerald-700 bg-emerald-50 font-semibold px-1.5 py-0.5 rounded">
                            <Icon name="attach_file" className="text-[11px]" />
                            Comprovativo
                          </span>
                        )}
                      </div>
                    </td>

                    <td className="py-4 px-6 font-display font-bold text-sm text-on-surface">
                      {t.amount.toLocaleString()} KZS
                    </td>

                    <td className="py-4 px-6">
                      {t.status === 'Concluído' && (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-700 text-xs font-semibold">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-600"></span>
                          Aprovado
                        </span>
                      )}
                      {t.status === 'Pendente' && (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 text-amber-700 text-xs font-semibold border border-amber-300">
                          <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-ping"></span>
                          Pendente
                        </span>
                      )}
                      {t.status === 'Cancelado' && (
                        <div className="space-y-1">
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-500/10 text-red-700 text-xs font-semibold">
                            <span className="w-1.5 h-1.5 rounded-full bg-red-600"></span>
                            Rejeitado
                          </span>
                          {t.rejectionReason && (
                            <p className="text-[10px] text-red-600 truncate max-w-[140px]" title={t.rejectionReason}>
                              {t.rejectionReason}
                            </p>
                          )}
                        </div>
                      )}
                    </td>

                    <td className="py-4 px-6 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {t.status === 'Pendente' ? (
                          <>
                            <button
                              type="button"
                              onClick={() => handleApprove(t.id)}
                              className="bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-1.5 rounded-xl text-xs font-bold shadow-xs transition-colors flex items-center gap-1 cursor-pointer"
                              title="Aprovar e desbloquear CV do utilizador"
                            >
                              <Icon name="check" className="text-[16px]" />
                              Aprovar
                            </button>
                            <button
                              type="button"
                              onClick={() => setRejectingTx(t)}
                              className="bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 px-2.5 py-1.5 rounded-xl text-xs font-bold transition-colors flex items-center gap-1 cursor-pointer"
                              title="Rejeitar comprovativo e notificar cliente"
                            >
                              <Icon name="close" className="text-[16px]" />
                              Rejeitar
                            </button>
                            <button
                              type="button"
                              onClick={() => setViewReceiptTx(t)}
                              className="p-1.5 rounded-xl text-on-surface-variant hover:text-primary hover:bg-surface-container-high transition-all cursor-pointer"
                              title="Ver Comprovativo & Detalhes"
                            >
                              <Icon name="receipt_long" className="text-[18px]" />
                            </button>
                          </>
                        ) : (
                          <button
                            type="button"
                            onClick={() => setViewReceiptTx(t)}
                            className="px-3 py-1.5 rounded-xl text-xs font-semibold text-on-surface-variant hover:text-primary hover:bg-surface-container-high transition-all flex items-center gap-1 cursor-pointer"
                            title="Ver Detalhes do Pagamento"
                          >
                            <Icon name="visibility" className="text-[16px]" />
                            Detalhes
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* View Transaction Receipt & Full Detail Modal */}
      {viewReceiptTx && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-surface-container-lowest rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-surface-border space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-surface-border pb-3">
              <div>
                <span className="text-[10px] font-extrabold uppercase tracking-widest text-primary">
                  Auditoria de Pagamento
                </span>
                <h3 className="font-display text-lg font-bold text-on-surface">
                  Comprovativo de {viewReceiptTx.id}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setViewReceiptTx(null)}
                className="text-on-surface-variant hover:text-on-surface p-1 rounded-lg cursor-pointer"
              >
                <Icon name="close" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              {/* Status Header */}
              <div className="flex items-center justify-between p-3.5 bg-surface-container-low rounded-2xl">
                <div>
                  <span className="text-[10px] text-on-surface-variant uppercase font-bold block">
                    Estado Atual
                  </span>
                  <span className="font-bold text-sm text-on-surface">
                    {viewReceiptTx.status === 'Concluído'
                      ? '✅ Aprovado (CV Desbloqueado)'
                      : viewReceiptTx.status === 'Pendente'
                      ? '⏳ Pagamento em Análise'
                      : '❌ Rejeitado'}
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-[10px] text-on-surface-variant uppercase font-bold block">
                    Valor Pago
                  </span>
                  <span className="font-display font-extrabold text-base text-primary">
                    {viewReceiptTx.amount.toLocaleString()} KZS
                  </span>
                </div>
              </div>

              {/* Client & Bank Details */}
              <div className="p-4 bg-surface-container-low/70 rounded-2xl space-y-2.5 border border-surface-border/60">
                <div className="flex justify-between">
                  <span className="text-on-surface-variant font-medium">Nome do Utilizador:</span>
                  <span className="font-semibold text-on-surface">{viewReceiptTx.userName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-on-surface-variant font-medium">E-mail / Contacto:</span>
                  <span className="font-mono text-on-surface">{viewReceiptTx.userEmail}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-on-surface-variant font-medium">Método Escolhido:</span>
                  <span className="font-semibold text-on-surface">
                    {viewReceiptTx.method === 'Multicaixa' ? 'Multicaixa Xpress (923 845 779)' : 'Transferência BAI'}
                  </span>
                </div>
                {viewReceiptTx.senderName && (
                  <div className="flex justify-between">
                    <span className="text-on-surface-variant font-medium">Titular da Conta / Remetente:</span>
                    <span className="font-semibold text-primary">{viewReceiptTx.senderName}</span>
                  </div>
                )}
                {viewReceiptTx.referenceCode && (
                  <div className="flex justify-between">
                    <span className="text-on-surface-variant font-medium">Cód. Transação / Referência:</span>
                    <span className="font-mono font-bold text-on-surface">{viewReceiptTx.referenceCode}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-on-surface-variant font-medium">Data e Hora de Submissão:</span>
                  <span className="text-on-surface">{viewReceiptTx.date} às {viewReceiptTx.time}</span>
                </div>
              </div>

              {/* Receipt File / Attachment View */}
              {viewReceiptTx.receiptFileName ? (
                <div className="p-4 bg-emerald-500/5 border border-emerald-500/30 rounded-2xl space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-emerald-900 flex items-center gap-1.5">
                      <Icon name="image" className="text-[16px] text-emerald-700" />
                      Ficheiro de Comprovativo Anexado:
                    </span>
                    <span className="text-[10px] font-mono text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
                      {viewReceiptTx.receiptFileName}
                    </span>
                  </div>
                  <div className="bg-surface-container-lowest p-3 rounded-xl border border-emerald-200 text-center flex flex-col items-center justify-center py-6 text-xs text-on-surface-variant">
                    <Icon name="receipt_long" className="text-[36px] text-emerald-600 mb-1" />
                    <p className="font-medium text-on-surface">{viewReceiptTx.receiptFileName}</p>
                    <p className="text-[10px] text-on-surface-variant mt-0.5">Comprovativo arquivado no servidor seguro</p>
                  </div>
                </div>
              ) : (
                <div className="p-3 bg-surface-container-low rounded-xl text-center text-on-surface-variant text-xs">
                  Submetido via código de referência direto.
                </div>
              )}

              {/* If Rejected, show reason */}
              {viewReceiptTx.status === 'Cancelado' && viewReceiptTx.rejectionReason && (
                <div className="p-3.5 bg-red-500/10 border border-red-300 rounded-2xl space-y-1">
                  <span className="text-[10px] uppercase font-bold text-red-700 block">
                    Motivo da Rejeição:
                  </span>
                  <p className="text-xs text-red-950 font-medium">{viewReceiptTx.rejectionReason}</p>
                </div>
              )}
            </div>

            {/* Modal Actions */}
            <div className="pt-3 border-t border-surface-border flex flex-col sm:flex-row gap-2.5">
              {viewReceiptTx.status === 'Pendente' ? (
                <>
                  <button
                    type="button"
                    onClick={() => handleApprove(viewReceiptTx.id)}
                    className="flex-1 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-md cursor-pointer"
                  >
                    <Icon name="check_circle" className="text-[16px]" />
                    Aprovar & Desbloquear CV
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setRejectingTx(viewReceiptTx);
                    }}
                    className="flex-1 px-4 py-2.5 rounded-xl bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <Icon name="cancel" className="text-[16px]" />
                    Rejeitar Comprovativo
                  </button>
                </>
              ) : (
                <button
                  type="button"
                  onClick={() => setViewReceiptTx(null)}
                  className="w-full px-4 py-2.5 rounded-xl bg-surface-container-high hover:bg-surface-container-highest text-on-surface font-semibold text-xs cursor-pointer"
                >
                  Fechar
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Reject Payment Reason Modal */}
      {rejectingTx && (
        <RejectPaymentModal
          transaction={rejectingTx}
          onClose={() => setRejectingTx(null)}
          onConfirmReject={handleConfirmReject}
        />
      )}
    </div>
  );
};
