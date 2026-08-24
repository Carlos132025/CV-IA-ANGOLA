export interface PaymentNotificationPayload {
  userName: string;
  userEmail: string;
  userPhone?: string;
  amount: number;
  method: 'Multicaixa' | 'Transferência';
  referenceCode?: string;
  senderLast4?: string;
  senderName?: string;
  receiptUrl?: string;
  receiptFileName?: string;
  receiptFileSize?: string;
  receiptMimeType?: string;
  txId: string;
  templateName?: string;
  customWebhookUrl?: string;
}

export interface DiscordNotificationResponse {
  success: boolean;
  simulated?: boolean;
  message?: string;
  error?: string;
}

/**
 * Sends real-time payment submission notification to Discord Webhook via secure server API.
 */
export async function sendPaymentDiscordNotification(
  payload: PaymentNotificationPayload
): Promise<DiscordNotificationResponse> {
  try {
    const response = await fetch('/api/notify-payment-discord', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      return {
        success: false,
        error: errData.error || `HTTP error ${response.status}`,
      };
    }

    return await response.json();
  } catch (error: any) {
    console.warn('Falha na requisição ao endpoint de Discord:', error);
    return {
      success: false,
      error: error.message || 'Erro de rede ao enviar notificação para o Discord.',
    };
  }
}

/**
 * Sends a test ping message to the Discord Webhook to verify integration.
 */
export async function testDiscordWebhookConnection(
  customWebhookUrl?: string
): Promise<DiscordNotificationResponse> {
  try {
    const response = await fetch('/api/test-discord-webhook', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ customWebhookUrl }),
    });

    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      return {
        success: false,
        error: data.error || `Erro ${response.status}`,
      };
    }

    return data;
  } catch (error: any) {
    return {
      success: false,
      error: error.message || 'Falha ao conectar com o serviço de webhook.',
    };
  }
}

/**
 * Sends an approval or rejection status update to Discord.
 */
export async function sendStatusUpdateDiscordNotification(params: {
  txId: string;
  userName: string;
  status: 'Aprovado' | 'Rejeitado';
  method: 'Multicaixa' | 'Transferência';
  amount?: number;
  rejectionReason?: string;
  customWebhookUrl?: string;
}): Promise<DiscordNotificationResponse> {
  try {
    const response = await fetch('/api/notify-status-discord', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    });

    return await response.json().catch(() => ({ success: true }));
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}
