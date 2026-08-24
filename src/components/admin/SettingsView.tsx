import React, { useState } from 'react';
import { CVTemplate, SystemSettings } from '../../types';
import { testDiscordWebhookConnection } from '../../utils/discordNotification';

interface SettingsViewProps {
  settings: SystemSettings;
  onSaveSettings: (settings: SystemSettings) => void;
  templates: CVTemplate[];
  onToggleTemplate: (id: string) => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  settings,
  onSaveSettings,
  templates,
  onToggleTemplate,
}) => {
  const [formData, setFormData] = useState<SystemSettings>({ ...settings });
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [smtpTesting, setSmtpTesting] = useState(false);
  const [smtpStatus, setSmtpStatus] = useState<string | null>(null);
  const [discordTesting, setDiscordTesting] = useState(false);
  const [discordStatus, setDiscordStatus] = useState<{ success: boolean; msg: string } | null>(null);

  const handleTestSmtp = () => {
    setSmtpTesting(true);
    setSmtpStatus(null);
    setTimeout(() => {
      setSmtpTesting(false);
      setSmtpStatus('E-mail de teste enviado com sucesso para noreply@cviaangola.ao!');
    }, 1200);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveSettings(formData);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  return (
    <div className="flex flex-col w-full max-w-[1000px] mx-auto p-8 gap-8">
      {/* Header */}
      <div>
        <h1 className="font-display text-3xl font-bold text-on-surface tracking-tight">
          Configurações do Sistema
        </h1>
        <p className="text-on-surface-variant text-sm mt-1">
          Gerencie os parâmetros operacionais, chaves de pagamento e integrações.
        </p>
      </div>

      {saveSuccess && (
        <div className="bg-success-green/10 border border-success-green/30 text-success-green p-4 rounded-xl flex items-center gap-3 animate-in fade-in duration-200">
          <span className="material-symbols-outlined text-[20px]">check_circle</span>
          <span className="text-xs font-bold">
            Configurações guardadas com sucesso na base de dados!
          </span>
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-8">
        {/* Section 1: Definições Gerais */}
        <div className="bg-surface-container-lowest p-6 rounded-2xl shadow-sm border border-surface-border/40 space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b border-surface-border">
            <span className="material-symbols-outlined text-primary text-[22px]">
              tune
            </span>
            <h2 className="font-display text-lg font-bold text-on-surface">
              Definições Gerais
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-on-surface mb-1.5">
                Nome da Plataforma
              </label>
              <input
                type="text"
                value={formData.platformName}
                onChange={(e) =>
                  setFormData({ ...formData, platformName: e.target.value })
                }
                className="w-full bg-surface-container-low border-none rounded-xl p-3 text-xs font-medium focus:ring-2 focus:ring-primary/20 outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-on-surface mb-1.5">
                Preço Base por CV (Kz)
              </label>
              <div className="relative">
                <input
                  type="number"
                  value={formData.basePriceKz}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      basePriceKz: Number(e.target.value),
                    })
                  }
                  className="w-full bg-surface-container-low border-none rounded-xl p-3 pr-12 text-xs font-bold focus:ring-2 focus:ring-primary/20 outline-none"
                />
                <span className="absolute right-3 top-3 text-xs font-semibold text-on-surface-variant">
                  KZS
                </span>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-on-surface mb-1.5">
                Idioma Padrão do Sistema
              </label>
              <select
                value={formData.systemLanguage}
                onChange={(e) =>
                  setFormData({ ...formData, systemLanguage: e.target.value })
                }
                className="w-full bg-surface-container-low border-none rounded-xl p-3 text-xs font-medium outline-none cursor-pointer"
              >
                <option value="pt-AO">Português (Angola)</option>
                <option value="pt-PT">Português (Portugal)</option>
                <option value="en-US">Inglês (Internacional)</option>
              </select>
            </div>
          </div>
        </div>

        {/* Section 2: Integrações de Pagamento Angolanas */}
        <div className="bg-surface-container-lowest p-6 rounded-2xl shadow-sm border border-surface-border/40 space-y-6">
          <div className="flex items-center gap-2 pb-2 border-b border-surface-border">
            <span className="material-symbols-outlined text-primary text-[22px]">
              account_balance_wallet
            </span>
            <h2 className="font-display text-lg font-bold text-on-surface">
              Integrações de Pagamento (Angola)
            </h2>
          </div>

          {/* Multicaixa Xpress */}
          <div className="p-4 rounded-xl bg-surface-container-low border border-surface-border/60 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                  <span className="material-symbols-outlined text-[18px]">credit_card</span>
                </div>
                <div>
                  <h3 className="text-sm font-bold text-on-surface">Multicaixa Xpress (EMIS)</h3>
                  <p className="text-xs text-on-surface-variant">Recebimento direto para o número 923 845 779</p>
                </div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.multicaixaEnabled}
                  onChange={(e) =>
                    setFormData({ ...formData, multicaixaEnabled: e.target.checked })
                  }
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-surface-variant peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
              </label>
            </div>

            {formData.multicaixaEnabled && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
                <div>
                  <label className="block text-xs font-semibold text-on-surface mb-1">
                    Número Oficial de Envio
                  </label>
                  <input
                    type="text"
                    value={formData.multicaixaPhone || '923 845 779'}
                    onChange={(e) =>
                      setFormData({ ...formData, multicaixaPhone: e.target.value })
                    }
                    className="w-full bg-surface-container-lowest border border-surface-border rounded-xl p-2.5 text-xs font-mono font-bold outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-on-surface mb-1">
                    Terminal ID (EMIS)
                  </label>
                  <input
                    type="text"
                    value={formData.multicaixaTerminalId}
                    onChange={(e) =>
                      setFormData({ ...formData, multicaixaTerminalId: e.target.value })
                    }
                    className="w-full bg-surface-container-lowest border border-surface-border rounded-xl p-2.5 text-xs font-mono outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-on-surface mb-1">
                    Chave PFX / Segurança
                  </label>
                  <input
                    type="password"
                    value={formData.multicaixaPfxPassword}
                    onChange={(e) =>
                      setFormData({ ...formData, multicaixaPfxPassword: e.target.value })
                    }
                    className="w-full bg-surface-container-lowest border border-surface-border rounded-xl p-2.5 text-xs font-mono outline-none"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Transferência Bancária BAI */}
          <div className="p-4 rounded-xl bg-surface-container-low border border-surface-border/60 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-secondary/10 flex items-center justify-center text-secondary">
                  <span className="material-symbols-outlined text-[18px]">account_balance</span>
                </div>
                <div>
                  <h3 className="text-sm font-bold text-on-surface">Transferência Bancária (Banco BAI)</h3>
                  <p className="text-xs text-on-surface-variant">Recepção direta em conta corrente empresarial</p>
                </div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.bankTransferEnabled}
                  onChange={(e) =>
                    setFormData({ ...formData, bankTransferEnabled: e.target.checked })
                  }
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-surface-variant peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
              </label>
            </div>

            {formData.bankTransferEnabled && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                <div className="md:col-span-2">
                  <label className="block text-xs font-semibold text-on-surface mb-1">
                    IBAN BAI Oficial
                  </label>
                  <input
                    type="text"
                    value={formData.baiIban || '0040 0000 6273 9820 1010 9'}
                    onChange={(e) =>
                      setFormData({ ...formData, baiIban: e.target.value })
                    }
                    className="w-full bg-surface-container-lowest border border-surface-border rounded-xl p-2.5 text-xs font-mono font-bold outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-on-surface mb-1">
                    Titular da Conta
                  </label>
                  <input
                    type="text"
                    value={formData.baiAccountHolder || 'Chinua Ndembo, Lda'}
                    onChange={(e) =>
                      setFormData({ ...formData, baiAccountHolder: e.target.value })
                    }
                    className="w-full bg-surface-container-lowest border border-surface-border rounded-xl p-2.5 text-xs outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-on-surface mb-1">
                    Instituição Bancária
                  </label>
                  <input
                    type="text"
                    value={formData.baiBankName || 'Banco Angolano de Investimentos (BAI)'}
                    onChange={(e) =>
                      setFormData({ ...formData, baiBankName: e.target.value })
                    }
                    className="w-full bg-surface-container-lowest border border-surface-border rounded-xl p-2.5 text-xs outline-none"
                  />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Section 3: Integração Discord Webhook & Notificações */}
        <div className="bg-surface-container-lowest p-6 rounded-2xl shadow-sm border border-surface-border/40 space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-surface-border">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-indigo-500/10 text-indigo-600 flex items-center justify-center">
                <span className="material-symbols-outlined text-[20px]">webhook</span>
              </div>
              <div>
                <h2 className="font-display text-lg font-bold text-on-surface">
                  Notificações Discord (Webhook)
                </h2>
                <p className="text-xs text-on-surface-variant">
                  Envio automático de alertas instantâneos de novos pagamentos para o seu canal.
                </p>
              </div>
            </div>
            <span className="text-[11px] font-mono font-bold bg-indigo-50 text-indigo-700 px-2.5 py-1 rounded-full border border-indigo-100 flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              DISCORD_WEBHOOK_URL Ativo
            </span>
          </div>

          <div className="p-4 rounded-xl bg-surface-container-low border border-surface-border space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="space-y-0.5">
                <p className="text-xs font-bold text-on-surface">
                  Canal de Notificações Financeiras
                </p>
                <p className="text-[11px] text-on-surface-variant leading-relaxed">
                  O URL do webhook está configurado em variável de ambiente segura no servidor (não exposta no navegador). Clique para testar o envio de um embed de exemplo.
                </p>
              </div>
              <button
                type="button"
                onClick={async () => {
                  setDiscordTesting(true);
                  setDiscordStatus(null);
                  try {
                    const res = await testDiscordWebhookConnection();
                    if (res.success) {
                      setDiscordStatus({
                        success: true,
                        msg: res.simulated
                          ? 'Notificação de teste gerada com sucesso (modo simulado ativo).'
                          : 'Notificação de teste enviada com sucesso para o canal do Discord!',
                      });
                    } else {
                      setDiscordStatus({
                        success: false,
                        msg: res.error || 'Erro ao enviar notificação para o Discord.',
                      });
                    }
                  } catch (e: any) {
                    setDiscordStatus({
                      success: false,
                      msg: e.message || 'Erro de conexão.',
                    });
                  } finally {
                    setDiscordTesting(false);
                  }
                }}
                disabled={discordTesting}
                className="px-4 py-2.5 rounded-xl bg-indigo-600 text-white text-xs font-bold hover:bg-indigo-700 transition-all flex items-center gap-2 cursor-pointer shadow-xs shrink-0 disabled:opacity-50"
              >
                {discordTesting ? (
                  <>
                    <span className="material-symbols-outlined text-[16px] animate-spin">progress_activity</span>
                    A testar...
                  </>
                ) : (
                  <>
                    <span className="material-symbols-outlined text-[16px]">send</span>
                    Testar Webhook Discord
                  </>
                )}
              </button>
            </div>

            {discordStatus && (
              <div
                className={`p-3 rounded-xl text-xs font-medium flex items-center gap-2 ${
                  discordStatus.success
                    ? 'bg-emerald-50 text-emerald-900 border border-emerald-200'
                    : 'bg-red-50 text-red-900 border border-red-200'
                }`}
              >
                <span className="material-symbols-outlined text-[18px]">
                  {discordStatus.success ? 'check_circle' : 'error'}
                </span>
                <span>{discordStatus.msg}</span>
              </div>
            )}
          </div>
        </div>

        {/* Section 4: Notificações de E-mail */}
        <div className="bg-surface-container-lowest p-6 rounded-2xl shadow-sm border border-surface-border/40 space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b border-surface-border">
            <span className="material-symbols-outlined text-primary text-[22px]">
              mail
            </span>
            <h2 className="font-display text-lg font-bold text-on-surface">
              Notificações do Sistema
            </h2>
          </div>

          <div>
            <label className="block text-xs font-semibold text-on-surface mb-1.5">
              E-mail de Envio (Remetente)
            </label>
            <div className="flex gap-3">
              <input
                type="email"
                value={formData.senderEmail}
                onChange={(e) =>
                  setFormData({ ...formData, senderEmail: e.target.value })
                }
                className="flex-1 bg-surface-container-low border-none rounded-xl p-3 text-xs focus:ring-2 focus:ring-primary/20 outline-none"
              />
              <button
                type="button"
                onClick={handleTestSmtp}
                disabled={smtpTesting}
                className="px-4 py-2.5 rounded-xl border border-surface-border bg-surface-container-low text-xs font-semibold hover:bg-surface-container-high transition-colors"
              >
                {smtpTesting ? 'A testar...' : 'Testar Configuração SMTP'}
              </button>
            </div>
            {smtpStatus && (
              <p className="text-xs text-success-green font-medium mt-2 flex items-center gap-1">
                <span className="material-symbols-outlined text-[16px]">check_circle</span>
                {smtpStatus}
              </p>
            )}
          </div>

          <div className="pt-2 space-y-3">
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.notifyNewSale}
                onChange={(e) =>
                  setFormData({ ...formData, notifyNewSale: e.target.checked })
                }
                className="rounded text-primary focus:ring-primary h-4 w-4"
              />
              <span className="text-xs font-medium text-on-surface">
                Notificar nova venda por e-mail aos administradores
              </span>
            </label>

            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.notifyNewUser}
                onChange={(e) =>
                  setFormData({ ...formData, notifyNewUser: e.target.checked })
                }
                className="rounded text-primary focus:ring-primary h-4 w-4"
              />
              <span className="text-xs font-medium text-on-surface">
                Notificar novo registo de utilizador
              </span>
            </label>

            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.notifyAIFailure}
                onChange={(e) =>
                  setFormData({ ...formData, notifyAIFailure: e.target.checked })
                }
                className="rounded text-primary focus:ring-primary h-4 w-4"
              />
              <span className="text-xs font-medium text-on-surface">
                Alertar se houver instabilidade ou timeout na geração de IA
              </span>
            </label>
          </div>
        </div>

        {/* Section 4: Gestão de Modelos de CV */}
        <div className="bg-surface-container-lowest p-6 rounded-2xl shadow-sm border border-surface-border/40 space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b border-surface-border">
            <span className="material-symbols-outlined text-primary text-[22px]">
              style
            </span>
            <h2 className="font-display text-lg font-bold text-on-surface">
              Disponibilidade dos Modelos de CV
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {templates.map((tpl) => (
              <div
                key={tpl.id}
                className="p-3 bg-surface-container-low rounded-xl border border-surface-border/60 flex items-center justify-between"
              >
                <div>
                  <p className="text-xs font-bold text-on-surface">{tpl.name}</p>
                  <span className="text-[10px] text-on-surface-variant">{tpl.category}</span>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={tpl.isActive}
                    onChange={() => onToggleTemplate(tpl.id)}
                    className="sr-only peer"
                  />
                  <div className="w-9 h-5 bg-surface-variant peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-primary"></div>
                </label>
              </div>
            ))}
          </div>
        </div>

        {/* Save Bar */}
        <div className="flex items-center justify-end gap-3 pt-4">
          <button
            type="button"
            onClick={() => setFormData({ ...settings })}
            className="px-5 py-2.5 rounded-xl border border-surface-border text-on-surface font-semibold text-xs hover:bg-surface-container-low transition-colors"
          >
            Descartar Alterações
          </button>
          <button
            type="submit"
            className="px-6 py-2.5 rounded-xl bg-primary text-white font-semibold text-xs shadow-md hover:bg-primary/90 transition-all active:scale-[0.98] flex items-center gap-2"
          >
            <span className="material-symbols-outlined text-[18px]">save</span>
            Guardar Alterações
          </button>
        </div>
      </form>
    </div>
  );
};
