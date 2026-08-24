import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import dotenv from 'dotenv';

dotenv.config();

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: '20mb' }));
  app.use(express.urlencoded({ extended: true, limit: '20mb' }));

  // Health Check & Webhook Status
  app.get('/api/health', (req, res) => {
    res.json({
      status: 'ok',
      hasDiscordWebhook: !!process.env.DISCORD_WEBHOOK_URL,
      appName: 'CV IA Angola',
    });
  });

  // Discord Payment Notification API
  app.post('/api/notify-payment-discord', async (req, res) => {
    try {
      const {
        userName,
        userEmail,
        userPhone,
        amount = 2000,
        method,
        referenceCode,
        senderLast4,
        senderName,
        receiptUrl,
        receiptFileName,
        receiptFileSize,
        txId,
        templateName = 'Lumina Modern',
        customWebhookUrl,
      } = req.body;

      const webhookUrl = customWebhookUrl || process.env.DISCORD_WEBHOOK_URL;

      const appBaseUrl =
        process.env.APP_URL ||
        `${req.protocol}://${req.get('host') || 'localhost:3000'}`;

      const adminUrl = `${appBaseUrl}?adminTab=pending-payments&txId=${encodeURIComponent(
        txId || ''
      )}`;

      const isMulticaixa = method === 'Multicaixa';
      const methodName = isMulticaixa
        ? 'Multicaixa Xpress (923 845 779)'
        : 'Transferência IBAN / BAI (0040...1010 9)';

      const referenceDetails = isMulticaixa
        ? `• **Telemóvel do Cliente:** ${userPhone || 'Não informado'}\n• **Cód. Transação:** \`${referenceCode || txId}\`${senderLast4 ? `\n• **Últimos 4 Dígitos:** \`${senderLast4}\`` : ''}`
        : `• **Ref / Talão:** \`${referenceCode || txId}\`\n• **Titular:** ${senderName || 'Não informado'}${senderLast4 ? `\n• **Últimos 4 Dígitos (Conta/Tel):** \`${senderLast4}\`` : ''}${
            receiptFileName ? `\n• **Ficheiro:** ${receiptFileName}${receiptFileSize ? ` (${receiptFileSize})` : ''}` : ''
          }`;

      const embedColor = 0xf59e0b; // Gold / Amber for Pending

      const fields: Array<{ name: string; value: string; inline?: boolean }> = [
        {
          name: '👤 Cliente',
          value: `**${userName || 'Cliente Anónimo'}**\n📧 \`${userEmail || 'sem-email@cvia.ao'}\`${userPhone ? `\n📱 \`${userPhone}\`` : ''}`,
          inline: true,
        },
        {
          name: '💰 Valor',
          value: `**${Number(amount).toLocaleString()} Kz**`,
          inline: true,
        },
        {
          name: '🏦 Método de Pagamento',
          value: methodName,
          inline: false,
        },
        {
          name: '📄 Comprovativo & Dados de Verificação',
          value: referenceDetails,
          inline: false,
        },
        {
          name: '🎨 Modelo do CV',
          value: `${templateName}`,
          inline: true,
        },
        {
          name: '📊 Estado',
          value: '⏳ **Pendente de Aprovação**',
          inline: true,
        },
        {
          name: '⚡ Ação Rápida no Painel Admin',
          value: `[👉 **Clique aqui para Abrir Fila de Aprovação no Painel Admin**](${adminUrl})`,
          inline: false,
        },
      ];

      const discordPayload = {
        username: 'CV IA Angola - Validador de Pagamentos',
        avatar_url:
          'https://lh3.googleusercontent.com/aida-public/AB6AXuCQEQnUF_KpD1rxBc9aMtzktK8aF_9p0fN438Su3JEwFpZKJnafNmMHslw4R8xROUhnh3VZs_0hDOJ_y0TndVcoW1gwAd9Q0gpnSSJ4sgF5WQQMTDO2ZJDW_ef3FY3LWWjpssMVu64l9JiFVsFpbTXcFtJLLQJUhi4SRJkK8p7Gpw2Cu3SefBJZes10PJDarshVR3aF8hf6n_-tgISg2Sq0gUonFb5EslNZU0Vp3zLY6UTMG--xrWj7Nw',
        content: `@everyone 🚨 **Novo Comprovativo de Pagamento Aguarda Validação!**`,
        embeds: [
          {
            title: `💰 Novo Pagamento Pendente: ${txId || 'TRX-NOVO'}`,
            description: `Foi submetido um comprovativo de pagamento no valor de **${Number(
              amount
            ).toLocaleString()} Kz** para desbloqueio e download de currículo.`,
            color: embedColor,
            fields: fields,
            image: receiptUrl && receiptUrl.startsWith('http')
              ? { url: receiptUrl }
              : undefined,
            footer: {
              text: 'CV IA Angola • Fila de Pagamentos Pendentes',
            },
            timestamp: new Date().toISOString(),
          },
        ],
      };

      if (!webhookUrl) {
        console.warn(
          'DISCORD_WEBHOOK_URL não está configurada no ambiente. A notificação foi simulada localmente.'
        );
        return res.json({
          success: true,
          simulated: true,
          message:
            'Aviso: DISCORD_WEBHOOK_URL não configurada em .env. A notificação foi registada com sucesso na plataforma.',
          payload: discordPayload,
        });
      }

      // Send to Discord Webhook
      const response = await fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(discordPayload),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Erro ao enviar notificação para o Discord:', errorText);
        return res.status(response.status).json({
          success: false,
          error: `Discord Webhook retornou erro: ${response.status} - ${errorText}`,
        });
      }

      return res.json({
        success: true,
        message: 'Notificação enviada com sucesso para o canal do Discord!',
      });
    } catch (error: any) {
      console.error('Erro no endpoint de notificação do Discord:', error);
      return res.status(500).json({
        success: false,
        error: error.message || 'Erro interno no servidor ao contactar o Discord.',
      });
    }
  });

  // Discord Webhook Test Connection API
  app.post('/api/test-discord-webhook', async (req, res) => {
    try {
      const { customWebhookUrl } = req.body;
      const webhookUrl = customWebhookUrl || process.env.DISCORD_WEBHOOK_URL;

      if (!webhookUrl) {
        return res.status(400).json({
          success: false,
          error:
            'Nenhum URL de Webhook fornecido e a variável DISCORD_WEBHOOK_URL não está definida no ficheiro .env.',
        });
      }

      const testPayload = {
        username: 'CV IA Angola - Bot de Teste',
        avatar_url:
          'https://lh3.googleusercontent.com/aida-public/AB6AXuCQEQnUF_KpD1rxBc9aMtzktK8aF_9p0fN438Su3JEwFpZKJnafNmMHslw4R8xROUhnh3VZs_0hDOJ_y0TndVcoW1gwAd9Q0gpnSSJ4sgF5WQQMTDO2ZJDW_ef3FY3LWWjpssMVu64l9JiFVsFpbTXcFtJLLQJUhi4SRJkK8p7Gpw2Cu3SefBJZes10PJDarshVR3aF8hf6n_-tgISg2Sq0gUonFb5EslNZU0Vp3zLY6UTMG--xrWj7Nw',
        embeds: [
          {
            title: '✅ Conexão Webhook Discord Estabelecida!',
            description:
              'O canal do Discord está configurado e pronto para receber notificações automáticas de pagamentos **Multicaixa Xpress** e **Transferência BAI**.',
            color: 0x10b981,
            fields: [
              {
                name: '🕒 Data/Hora do Teste',
                value: new Date().toLocaleString('pt-AO'),
                inline: true,
              },
              {
                name: '🛡️ Estado',
                value: 'Conectado & Operacional',
                inline: true,
              },
            ],
            footer: {
              text: 'CV IA Angola • Configurações do Sistema',
            },
            timestamp: new Date().toISOString(),
          },
        ],
      };

      const response = await fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(testPayload),
      });

      if (!response.ok) {
        const errText = await response.text();
        return res.status(response.status).json({
          success: false,
          error: `Erro do Discord (${response.status}): ${errText}`,
        });
      }

      return res.json({
        success: true,
        message: 'Mensagem de teste enviada com sucesso para o seu Discord!',
      });
    } catch (error: any) {
      return res.status(500).json({
        success: false,
        error: error.message || 'Falha ao testar o Webhook do Discord.',
      });
    }
  });

  // Discord Approval / Rejection Update Notification API
  app.post('/api/notify-status-discord', async (req, res) => {
    try {
      const {
        txId,
        userName,
        status, // 'Aprovado' | 'Rejeitado'
        method,
        amount = 1500,
        rejectionReason,
        customWebhookUrl,
      } = req.body;

      const webhookUrl = customWebhookUrl || process.env.DISCORD_WEBHOOK_URL;
      if (!webhookUrl) {
        return res.json({ success: true, simulated: true });
      }

      const isApproved = status === 'Aprovado' || status === 'Concluído';
      const color = isApproved ? 0x10b981 : 0xef4444; // Green or Red

      const payload = {
        username: 'CV IA Angola - Notificações',
        embeds: [
          {
            title: isApproved
              ? `✅ Pagamento Aprovado: ${txId}`
              : `❌ Pagamento Rejeitado: ${txId}`,
            description: isApproved
              ? `O pagamento de **${userName}** (${Number(amount).toLocaleString()} Kz via ${method}) foi **APROVADO** pelo administrador. O download do CV foi liberado automaticamente!`
              : `O comprovativo de **${userName}** (${Number(amount).toLocaleString()} Kz via ${method}) foi **REJEITADO** pelo administrador.\n\n**Motivo:** ${rejectionReason || 'Comprovativo não validado.'}`,
            color: color,
            footer: {
              text: 'CV IA Angola • Atualização de Estado',
            },
            timestamp: new Date().toISOString(),
          },
        ],
      };

      await fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      return res.json({ success: true });
    } catch (e: any) {
      console.warn('Erro ao enviar status update para o Discord:', e.message);
      return res.json({ success: false, error: e.message });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`CV IA Angola Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
