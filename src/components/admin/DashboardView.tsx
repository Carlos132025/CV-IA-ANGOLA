import { Icon } from '../common/Icon';
import React, { useState } from 'react';
import { Transaction } from '../../types';
import { RejectPaymentModal } from './RejectPaymentModal';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
} from 'recharts';

interface DashboardViewProps {
  transactions: Transaction[];
  usersCount?: number;
  onApproveTransaction: (id: string) => void;
  onRejectTransaction?: (id: string, reason: string) => void;
  onNavigateToSales: () => void;
  onNavigateToUsers: () => void;
}

const TEMPLATE_DISTRIBUTION = [
  { name: 'Lumina Modern', value: 38, count: 542, color: '#2563eb' },
  { name: 'Executive Classic', value: 32, count: 456, color: '#0d9488' },
  { name: 'Creative Tech', value: 18, count: 256, color: '#8b5cf6' },
  { name: 'Classic Simple', value: 12, count: 173, color: '#f59e0b' },
];

export const DashboardView: React.FC<DashboardViewProps> = ({
  transactions,
  usersCount = 1,
  onApproveTransaction,
  onRejectTransaction,
  onNavigateToSales,
  onNavigateToUsers: _onNavigateToUsers,
}) => {
  const [timeFilter, setTimeFilter] = useState<'Hoje' | 'Semana' | 'Mês'>('Semana');
  const [selectedReceiptTx, setSelectedReceiptTx] = useState<Transaction | null>(null);
  const [rejectingTx, setRejectingTx] = useState<Transaction | null>(null);
  const [activeMenuTxId, setActiveMenuTxId] = useState<string | null>(null);

  // Filter out any admin generated transactions from financial metrics
  const customerTransactions = transactions.filter(
    (t) =>
      t.userEmail?.toLowerCase() !== 'cv.ia.angola@gmail.com' &&
      t.userEmail?.toLowerCase() !== 'admin.prospekta@gmail.com' &&
      t.userId !== 'usr-admin-cviaangola'
  );

  const pendingTransactions = customerTransactions.filter((t) => {
    const s = (t.status || '').toLowerCase();
    return s === 'pendente' || s === 'pending';
  });

  const totalRevenue = customerTransactions.reduce(
    (acc, t) => acc + (t.status === 'Concluído' ? t.amount : 0),
    0
  );
  const totalApproved = customerTransactions.filter((t) => t.status === 'Concluído').length;
  const totalRejected = customerTransactions.filter((t) => t.status === 'Cancelado').length;
  const approvalRate =
    totalApproved + totalRejected > 0
      ? ((totalApproved / (totalApproved + totalRejected)) * 100).toFixed(1) + '%'
      : '100%';

  const chartDataByPeriod = {
    Hoje: [
      { label: '08:00', multicaixa: 8000, bai: 4000, total: 12000 },
      { label: '10:00', multicaixa: 14000, bai: 6000, total: 20000 },
      { label: '12:00', multicaixa: 22000, bai: 10000, total: 32000 },
      { label: '14:00', multicaixa: 18000, bai: 8000, total: 26000 },
      { label: '16:00', multicaixa: 30000, bai: 14000, total: 44000 },
      { label: '18:00', multicaixa: 38000, bai: 16000, total: 54000 },
      { label: '20:00', multicaixa: 26000, bai: 12000, total: 38000 },
    ],
    Semana: [
      { label: 'Seg', multicaixa: 32000, bai: 13000, total: 45000 },
      { label: 'Ter', multicaixa: 48000, bai: 24000, total: 72000 },
      { label: 'Qua', multicaixa: 40000, bai: 20000, total: 60000 },
      { label: 'Qui', multicaixa: 66000, bai: 32000, total: 98000 },
      { label: 'Sex', multicaixa: 34000, bai: 16000, total: 50000 },
      { label: 'Sáb', multicaixa: 16000, bai: 6000, total: 22000 },
      { label: 'Dom', multicaixa: 12000, bai: 6000, total: 18000 },
    ],
    Mês: [
      { label: 'Sem 1', multicaixa: 180000, bai: 90000, total: 270000 },
      { label: 'Sem 2', multicaixa: 240000, bai: 110000, total: 350000 },
      { label: 'Sem 3', multicaixa: 310000, bai: 150000, total: 460000 },
      { label: 'Sem 4', multicaixa: 420000, bai: 210000, total: 630000 },
    ],
  };

  const currentChartData = chartDataByPeriod[timeFilter];

  const handleExport = () => {
    const headers = ['ID Transacao', 'Cliente', 'Email', 'Valor KZS', 'Metodo', 'Data e Hora', 'Estado'];
    const rows = transactions.map((t) => [
      t.id,
      `"${t.userName}"`,
      `"${t.userEmail}"`,
      t.amount,
      `"${t.method}"`,
      `"${t.date} ${t.time}"`,
      `"${t.status}"`,
    ]);

    const csvContent = '\uFEFF' + [headers.join(';'), ...rows.map((r) => r.join(';'))].join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `relatorio_geral_dashboard_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex flex-col w-full max-w-[1240px] mx-auto p-0 sm:p-2 lg:p-4 gap-6 sm:gap-8">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl sm:text-3xl font-bold text-on-surface tracking-tight">
            Visão Geral
          </h1>
          <p className="text-on-surface-variant text-xs sm:text-sm mt-1">
            Acompanhe em tempo real as vendas, métricas de adesão e distribuição de modelos.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          {/* Time Filter Pills */}
          <div className="flex items-center bg-surface-container-low p-1 rounded-xl gap-1 border border-surface-border">
            {(['Hoje', 'Semana', 'Mês'] as const).map((period) => (
              <button
                key={period}
                onClick={() => setTimeFilter(period)}
                className={`px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  timeFilter === period
                    ? 'bg-primary text-white shadow-xs'
                    : 'text-on-surface-variant hover:bg-surface-container-high'
                }`}
              >
                {period}
              </button>
            ))}
          </div>

          {/* Export Report */}
          <button
            onClick={handleExport}
            className="bg-primary text-white px-4 sm:px-5 py-2 sm:py-2.5 rounded-xl font-semibold text-xs flex items-center gap-1.5 sm:gap-2 shadow-xs hover:shadow-md hover:bg-primary/95 transition-all active:scale-[0.98] cursor-pointer"
          >
            <Icon name="download" className="text-[18px]" />
            <span>Exportar Relatório</span>
          </button>
        </div>
      </div>

      {/* 4 Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Card 1 */}
        <div className="bg-surface-container-lowest p-6 rounded-2xl shadow-xs hover:-translate-y-1 transition-transform cursor-default relative overflow-hidden group border border-surface-border/40">
          <div className="absolute -right-4 -top-4 w-24 h-24 bg-primary/5 rounded-full group-hover:scale-150 transition-transform duration-500 pointer-events-none"></div>
          <div className="flex items-center gap-4 mb-4 relative z-10">
            <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
              <Icon name="payments" className="text-[24px]" />
            </div>
            <div>
              <p className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider">
                Total de Vendas
              </p>
              <h2 className="text-2xl font-bold text-on-surface mt-0.5 font-display">
                {totalRevenue.toLocaleString('pt-AO')} <span className="text-xs font-normal text-on-surface-variant">KZS</span>
              </h2>
            </div>
          </div>
          <div className="flex items-center gap-1.5 relative z-10">
            <Icon name="trending_up" className="text-success-green text-[16px]" />
            <span className="text-xs font-semibold text-success-green">{customerTransactions.length} transações</span>
          </div>
        </div>

        {/* Card 2 */}
        <div className="bg-surface-container-lowest p-6 rounded-2xl shadow-xs hover:-translate-y-1 transition-transform cursor-default relative overflow-hidden group border border-surface-border/40">
          <div className="absolute -right-4 -top-4 w-24 h-24 bg-secondary/5 rounded-full group-hover:scale-150 transition-transform duration-500 pointer-events-none"></div>
          <div className="flex items-center gap-4 mb-4 relative z-10">
            <div className="w-12 h-12 rounded-xl bg-secondary/10 flex items-center justify-center text-secondary">
              <Icon name="group" className="text-[24px]" />
            </div>
            <div>
              <p className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider">
                Utilizadores Ativos
              </p>
              <h2 className="text-2xl font-bold text-on-surface mt-0.5 font-display">
                {usersCount}
              </h2>
            </div>
          </div>
          <div className="flex items-center gap-1.5 relative z-10">
            <Icon name="verified_user" className="text-success-green text-[16px]" />
            <span className="text-xs font-semibold text-success-green">Contas registadas</span>
          </div>
        </div>

        {/* Card 3 */}
        <div className="bg-surface-container-lowest p-6 rounded-2xl shadow-xs hover:-translate-y-1 transition-transform cursor-default relative overflow-hidden group border border-surface-border/40">
          <div className="absolute -right-4 -top-4 w-24 h-24 bg-indigo-500/10 rounded-full group-hover:scale-150 transition-transform duration-500 pointer-events-none"></div>
          <div className="flex items-center gap-4 mb-4 relative z-10">
            <div className="w-12 h-12 rounded-xl bg-indigo-500/10 flex items-center justify-center text-indigo-600">
              <Icon name="auto_awesome" className="text-[24px]" />
            </div>
            <div>
              <p className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider">
                CVs Emitidos
              </p>
              <h2 className="text-2xl font-bold text-on-surface mt-0.5 font-display">
                {totalApproved}
              </h2>
            </div>
          </div>
          <div className="flex items-center gap-1.5 relative z-10">
            <Icon name="check_circle" className="text-success-green text-[16px]" />
            <span className="text-xs font-semibold text-success-green">Downloads pagos</span>
          </div>
        </div>

        {/* Card 4 */}
        <div className="bg-surface-container-lowest p-6 rounded-2xl shadow-xs hover:-translate-y-1 transition-transform cursor-default relative overflow-hidden group border border-surface-border/40">
          <div className="absolute -right-4 -top-4 w-24 h-24 bg-emerald-500/10 rounded-full group-hover:scale-150 transition-transform duration-500 pointer-events-none"></div>
          <div className="flex items-center gap-4 mb-4 relative z-10">
            <div className="w-12 h-12 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-600">
              <Icon name="price_check" className="text-[24px]" />
            </div>
            <div>
              <p className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider">
                Taxa de Aprovação
              </p>
              <h2 className="text-2xl font-bold text-on-surface mt-0.5 font-display">
                {approvalRate}
              </h2>
            </div>
          </div>
          <div className="flex items-center gap-1.5 relative z-10">
            <Icon name="trending_up" className="text-success-green text-[16px]" />
            <span className="text-xs font-semibold text-success-green">Validação de compras</span>
          </div>
        </div>
      </div>

      {/* Pending Manual Confirmation Alert Banner */}
      {pendingTransactions.length > 0 && (
        <div className="bg-error-container/30 border border-error/20 rounded-2xl p-6 shadow-xs flex flex-col sm:flex-row items-start gap-4">
          <div className="w-11 h-11 rounded-full bg-error flex items-center justify-center flex-shrink-0 text-white mt-0.5 shadow-xs">
            <Icon name="warning" className="text-[22px]" />
          </div>
          <div className="flex-1">
            <h3 className="font-display text-lg font-bold text-on-error-container">
              {pendingTransactions.length} Pagamentos Pendentes de Confirmação Manual
            </h3>
            <p className="text-sm text-on-surface-variant mt-1 leading-relaxed">
              Identificámos transferências bancárias que requerem validação do comprovativo para libertar o acesso aos CVs aos utilizadores.
            </p>
            <div className="flex items-center gap-3 mt-4 flex-wrap">
              <button
                onClick={() => setSelectedReceiptTx(pendingTransactions[0])}
                className="bg-error text-white px-4 py-2 rounded-xl font-semibold text-xs hover:bg-error/90 transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
              >
                <Icon name="receipt_long" className="text-[16px]" />
                Rever Comprovativos ({pendingTransactions.length})
              </button>
              <button
                onClick={onNavigateToSales}
                className="text-error font-semibold text-xs hover:underline inline-flex items-center gap-1 px-3 py-2 rounded-lg hover:bg-error/5 cursor-pointer"
              >
                Ver Todas Transações
                <Icon name="arrow_forward" className="text-[16px]" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Interactive Charts Section: Recharts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Sales Evolution Chart (2 cols) */}
        <div className="lg:col-span-2 bg-surface-container-lowest rounded-2xl shadow-xs p-6 flex flex-col border border-surface-border/40">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <div>
              <h2 className="font-display text-lg font-bold text-on-surface">
                Evolução de Vendas ({timeFilter})
              </h2>
              <p className="text-xs text-on-surface-variant">
                Comparativo por canal: Multicaixa Xpress vs Transferência BAI
              </p>
            </div>
            <div className="flex items-center gap-4 text-xs font-semibold">
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-full bg-blue-600"></span>
                <span className="text-on-surface-variant">Multicaixa Xpress</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-full bg-emerald-500"></span>
                <span className="text-on-surface-variant font-semibold">Transferência BAI</span>
              </div>
            </div>
          </div>

          {/* Recharts Bar Chart */}
          <div className="w-full h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={currentChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(148, 163, 184, 0.2)" />
                <XAxis
                  dataKey="label"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 12, fill: '#64748b' }}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 11, fill: '#64748b' }}
                  tickFormatter={(val) => `${val >= 1000 ? `${Math.round(val / 1000)}k` : val}`}
                />
                <Tooltip
                  formatter={(val: number, name: string) => [
                    `${val.toLocaleString()} KZS`,
                    name === 'multicaixa' ? 'Multicaixa Xpress' : 'Transferência BAI',
                  ]}
                  contentStyle={{
                    backgroundColor: '#0f172a',
                    borderRadius: '12px',
                    border: 'none',
                    color: '#fff',
                    fontSize: '12px',
                    padding: '8px 12px',
                  }}
                  itemStyle={{ color: '#fff' }}
                  labelStyle={{ fontWeight: 'bold', color: '#94a3b8', marginBottom: '4px' }}
                />
                <Bar dataKey="multicaixa" name="multicaixa" fill="#2563eb" radius={[6, 6, 0, 0]} />
                <Bar dataKey="bai" name="bai" fill="#10b981" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Template Distribution Donut Chart (1 col) */}
        <div className="bg-surface-container-lowest rounded-2xl shadow-xs p-6 flex flex-col border border-surface-border/40">
          <div className="mb-4">
            <h2 className="font-display text-lg font-bold text-on-surface">
              Popularidade de Modelos
            </h2>
            <p className="text-xs text-on-surface-variant">Distribuição percentual de escolhas dos utilizadores</p>
          </div>

          <div className="w-full h-[200px] relative">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={TEMPLATE_DISTRIBUTION}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={80}
                  paddingAngle={4}
                  dataKey="value"
                >
                  {TEMPLATE_DISTRIBUTION.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value: number, name: string) => [`${value}% das escolhas`, name]}
                  contentStyle={{
                    backgroundColor: '#0f172a',
                    borderRadius: '10px',
                    border: 'none',
                    color: '#fff',
                    fontSize: '12px',
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="text-xl font-bold font-display text-on-surface">4 Modelos</span>
              <span className="text-[11px] text-on-surface-variant">Profissionais</span>
            </div>
          </div>

          {/* Model Breakdown List */}
          <div className="space-y-2.5 mt-2">
            {TEMPLATE_DISTRIBUTION.map((item) => (
              <div key={item.name} className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <span
                    className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                    style={{ backgroundColor: item.color }}
                  ></span>
                  <span className="font-semibold text-on-surface">{item.name}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-on-surface-variant">{item.count} CVs</span>
                  <span className="font-bold text-on-surface">{item.value}%</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Atividades Recentes Table */}
      <div className="bg-surface-container-lowest rounded-2xl shadow-xs overflow-hidden flex flex-col border border-surface-border/40">
        <div className="p-6 border-b border-surface-border flex items-center justify-between">
          <div>
            <h2 className="font-display text-lg font-bold text-on-surface">
              Atividades Recentes
            </h2>
            <p className="text-xs text-on-surface-variant">
              Últimas transações e emissões de currículos
            </p>
          </div>
          <button
            onClick={onNavigateToSales}
            className="text-xs font-bold text-primary hover:underline cursor-pointer"
          >
            Ver todas
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-surface-container-low/50">
                <th className="py-4 px-6 text-xs font-semibold text-on-surface-variant uppercase tracking-wider">
                  Utilizador
                </th>
                <th className="py-4 px-6 text-xs font-semibold text-on-surface-variant uppercase tracking-wider">
                  Data / Hora
                </th>
                <th className="py-4 px-6 text-xs font-semibold text-on-surface-variant uppercase tracking-wider">
                  Plano / Método
                </th>
                <th className="py-4 px-6 text-xs font-semibold text-on-surface-variant uppercase tracking-wider">
                  Estado
                </th>
                <th className="py-4 px-6 text-xs font-semibold text-on-surface-variant uppercase tracking-wider text-right">
                  Ação
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-border/40">
              {customerTransactions.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-10 text-center text-on-surface-variant text-sm">
                    <Icon name="receipt_long" className="text-on-surface-variant/40 text-[32px] mb-2 block mx-auto" />
                    Nenhuma venda ou transação registada até ao momento.
                  </td>
                </tr>
              ) : (
                customerTransactions.slice(0, 5).map((t) => (
                  <tr
                    key={t.id}
                    className="hover:bg-surface-container-low/30 transition-colors group cursor-pointer"
                  >
                  <td className="py-4 px-6">
                    <div className="flex items-center gap-3">
                      {t.userAvatar ? (
                        <img
                          src={t.userAvatar}
                          alt={t.userName}
                          className="w-10 h-10 rounded-full object-cover border border-surface-border"
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-primary-container text-white flex items-center justify-center font-bold text-xs shadow-xs">
                          {t.userInitials}
                        </div>
                      )}
                      <div>
                        <p className="text-sm font-semibold text-on-surface">
                          {t.userName}
                        </p>
                        <p className="text-xs text-on-surface-variant">
                          {t.userEmail}
                        </p>
                      </div>
                    </div>
                  </td>

                  <td className="py-4 px-6 text-sm text-on-surface-variant">
                    {t.date}, {t.time}
                  </td>

                  <td className="py-4 px-6">
                    <p className="text-sm font-semibold text-on-surface">
                      {t.amount.toLocaleString()} KZS
                    </p>
                    <p className="text-xs text-on-surface-variant flex items-center gap-1 mt-0.5">
                      <Icon name={t.method === 'Multicaixa' ? 'credit_card' : 'account_balance'} className="text-[14px]" />
                      {t.method === 'Multicaixa' ? 'Multicaixa Xpress' : 'Transferência BAI'}
                    </p>
                  </td>

                  <td className="py-4 px-6">
                    {t.status === 'Concluído' ? (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-success-green/10 text-success-green text-xs font-semibold">
                        <span className="w-1.5 h-1.5 rounded-full bg-success-green"></span>
                        Concluído
                      </span>
                    ) : t.status === 'Pendente' ? (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-error-container text-on-error-container text-xs font-semibold">
                        <span className="w-1.5 h-1.5 rounded-full bg-error"></span>
                        Pendente
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-surface-variant text-on-surface-variant text-xs font-semibold">
                        Cancelado
                      </span>
                    )}
                  </td>

                  <td className="py-4 px-6 text-right relative">
                    {t.status === 'Pendente' && (
                      <button
                        onClick={() => setSelectedReceiptTx(t)}
                        className="bg-primary/10 text-primary hover:bg-primary hover:text-white px-3 py-1.5 rounded-lg text-xs font-semibold transition-all mr-2 cursor-pointer"
                      >
                        Rever
                      </button>
                    )}
                    <button
                      onClick={() =>
                        setActiveMenuTxId(activeMenuTxId === t.id ? null : t.id)
                      }
                      className="text-on-surface-variant hover:text-primary p-1.5 rounded-lg hover:bg-surface-container-high transition-all cursor-pointer"
                    >
                      <Icon name="more_vert" className="text-[20px]" />
                    </button>

                    {/* Quick action popup */}
                    {activeMenuTxId === t.id && (
                      <div className="absolute right-6 top-12 bg-surface-container-lowest border border-surface-border rounded-xl shadow-lg py-2 w-44 z-30 text-left">
                        {t.status === 'Pendente' && (
                          <button
                            onClick={() => {
                              onApproveTransaction(t.id);
                              setActiveMenuTxId(null);
                            }}
                            className="w-full px-4 py-2 text-xs font-semibold text-success-green hover:bg-success-green/10 flex items-center gap-2 cursor-pointer"
                          >
                            <Icon name="check_circle" className="text-[16px]" />
                            Aprovar Pagamento
                          </button>
                        )}
                        <button
                          onClick={() => {
                            setSelectedReceiptTx(t);
                            setActiveMenuTxId(null);
                          }}
                          className="w-full px-4 py-2 text-xs text-on-surface hover:bg-surface-container-low flex items-center gap-2 cursor-pointer"
                        >
                          <Icon name="visibility" className="text-[16px]" />
                          Ver Detalhes
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              )))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Review Receipt Modal */}
      {selectedReceiptTx && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-on-surface/50 backdrop-blur-xs">
          <div className="bg-surface-container-lowest rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-surface-border animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-surface-border pb-4">
              <div className="flex items-center gap-2">
                <Icon name="receipt_long" className="text-primary text-[24px]" />
                <h3 className="font-display text-lg font-bold text-on-surface">
                  Validar Comprovativo Bancário
                </h3>
              </div>
              <button
                onClick={() => setSelectedReceiptTx(null)}
                className="text-on-surface-variant hover:text-on-surface p-1 rounded-lg cursor-pointer"
              >
                <Icon name="close" />
              </button>
            </div>

            <div className="py-4 space-y-4">
              <div className="bg-surface-container-low p-4 rounded-xl flex justify-between items-center">
                <div>
                  <p className="text-xs text-on-surface-variant font-medium">Utilizador</p>
                  <p className="text-sm font-bold text-on-surface">{selectedReceiptTx.userName}</p>
                  <p className="text-xs text-on-surface-variant">{selectedReceiptTx.userEmail}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-on-surface-variant font-medium">Valor a Validar</p>
                  <p className="text-base font-bold text-primary font-display">
                    {selectedReceiptTx.amount.toLocaleString()} KZS
                  </p>
                  <span className="text-[11px] bg-secondary/10 text-secondary px-2 py-0.5 rounded-full font-semibold">
                    {selectedReceiptTx.method}
                  </span>
                </div>
              </div>

              {/* Receipt image */}
              <div className="border border-surface-border rounded-xl p-3 bg-surface text-center">
                <p className="text-xs text-on-surface-variant mb-2 font-medium">
                  Comprovativo de Transferência Multicaixa / EMIS:
                </p>
                <img
                  src={
                    selectedReceiptTx.receiptUrl ||
                    'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=600&auto=format&fit=crop&q=60'
                  }
                  alt="Comprovativo"
                  className="w-full h-48 object-cover rounded-lg border border-surface-border"
                />
              </div>
            </div>

            <div className="flex gap-3 pt-4 border-t border-surface-border">
              <button
                onClick={() => setSelectedReceiptTx(null)}
                className="px-4 py-2.5 rounded-xl border border-surface-border text-on-surface-variant font-semibold text-xs hover:bg-surface-container-low cursor-pointer"
              >
                Fechar
              </button>
              {selectedReceiptTx.status === 'Pendente' && (
                <>
                  <button
                    onClick={() => {
                      setRejectingTx(selectedReceiptTx);
                      setSelectedReceiptTx(null);
                    }}
                    className="px-4 py-2.5 rounded-xl bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 font-semibold text-xs transition-colors flex items-center justify-center gap-1 cursor-pointer"
                  >
                    <Icon name="cancel" className="text-[16px]" />
                    Rejeitar
                  </button>
                  <button
                    onClick={() => {
                      onApproveTransaction(selectedReceiptTx.id);
                      setSelectedReceiptTx(null);
                    }}
                    className="flex-1 px-4 py-2.5 rounded-xl bg-success-green text-white font-semibold text-xs hover:bg-success-green/90 shadow-md flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <Icon name="check_circle" className="text-[18px]" />
                    Aprovar & Libertar CV
                  </button>
                </>
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
          onConfirmReject={(txId, reason) => {
            if (onRejectTransaction) {
              onRejectTransaction(txId, reason);
            }
            setRejectingTx(null);
          }}
        />
      )}
    </div>
  );
};
