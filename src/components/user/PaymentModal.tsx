import { Icon } from '../common/Icon';
import React, { useState } from 'react';
import confetti from 'canvas-confetti';
import { sendPaymentDiscordNotification } from '../../utils/discordNotification';

export interface SubmittedPaymentData {
  method: 'Multicaixa' | 'Transferência';
  txId: string;
  userPhone?: string;
  referenceCode?: string;
  senderLast4?: string;
  senderName?: string;
  receiptFileName?: string;
  receiptFileSize?: string;
  receiptMimeType?: string;
  receiptUploadedAt?: string;
  receiptUrl?: string;
}

interface PaymentModalProps {
  amount: number;
  userName?: string;
  userEmail?: string;
  templateName?: string;
  onPaymentSuccess?: (method: 'Multicaixa' | 'Transferência', txId: string) => void;
  onPaymentSubmitted: (data: SubmittedPaymentData) => void;
  onClose: () => void;
}

export const PaymentModal: React.FC<PaymentModalProps> = ({
  amount,
  userName = 'Cliente Luanda',
  userEmail = 'cliente@email.ao',
  templateName = 'Lumina Modern',
  onPaymentSubmitted,
  onClose,
}) => {
  const [method, setMethod] = useState<'Multicaixa' | 'Transferência'>('Multicaixa');

  // Multicaixa Xpress Form State
  const [userPhone, setUserPhone] = useState('');
  const [mcxTxCode, setMcxTxCode] = useState('');
  const [mcxLast4, setMcxLast4] = useState('');

  // Transferência BAI Form State
  const [baiReference, setBaiReference] = useState('');
  const [baiSenderName, setBaiSenderName] = useState('');
  const [baiSenderLast4, setBaiSenderLast4] = useState('');
  const [receiptFileName, setReceiptFileName] = useState<string | null>(null);
  const [receiptFileSize, setReceiptFileSize] = useState<string | null>(null);
  const [receiptMimeType, setReceiptMimeType] = useState<string | null>(null);
  const [receiptUploadedAt, setReceiptUploadedAt] = useState<string | null>(null);
  const [receiptDataUrl, setReceiptDataUrl] = useState<string | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);

  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const [submittedTxId, setSubmittedTxId] = useState('');

  const copyToClipboard = (text: string, fieldId: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(fieldId);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFileError(null);
    const file = e.target.files?.[0];
    if (!file) return;

    // Strict validation: must be image (jpg, jpeg, png, webp)
    const validImageTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg'];
    if (!validImageTypes.includes(file.type.toLowerCase())) {
      setFileError('Formato inválido! Por favor, anexe uma imagem válida nos formatos JPG ou PNG.');
      setReceiptFileName(null);
      setReceiptDataUrl(null);
      setReceiptFileSize(null);
      setReceiptMimeType(null);
      return;
    }

    // Size limit: 10MB
    if (file.size > 10 * 1024 * 1024) {
      setFileError('O ficheiro excede o tamanho máximo de 10 MB.');
      return;
    }

    setReceiptFileName(file.name);
    setReceiptFileSize(formatFileSize(file.size));
    setReceiptMimeType(file.type);
    setReceiptUploadedAt(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));

    // Compress receipt image before saving to avoid large base64 payloads
    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result as string;
      if (!result) return;

      const img = new Image();
      img.onload = () => {
        const maxWidth = 900;
        const maxHeight = 900;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > maxWidth) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width = Math.round((width * maxHeight) / height);
            height = maxHeight;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.75);
          setReceiptDataUrl(compressedDataUrl);
        } else {
          setReceiptDataUrl(result);
        }
      };
      img.onerror = () => {
        setReceiptDataUrl(result);
      };
      img.src = result;
    };
    reader.readAsDataURL(file);
  };

  const handleProcessPayment = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate mandatory last 4 digits for cross-verification
    const effectiveLast4 =
      method === 'Multicaixa'
        ? mcxLast4.trim() || (userPhone.trim().replace(/\D/g, '').slice(-4))
        : baiSenderLast4.trim();

    if (!effectiveLast4 || effectiveLast4.length < 3) {
      alert('Por favor, insira os últimos 4 dígitos do número de telefone ou conta bancária usada para verificação.');
      return;
    }

    setIsProcessing(true);

    const generatedId =
      method === 'Multicaixa'
        ? `MCX-${Math.floor(1000 + Math.random() * 9000)}${String.fromCharCode(
            65 + Math.floor(Math.random() * 26)
          )}`
        : `BAI-${Math.floor(10000 + Math.random() * 90000)}`;

    setSubmittedTxId(generatedId);

    const refCode = method === 'Multicaixa' ? mcxTxCode.trim() || generatedId : baiReference.trim() || generatedId;
    const finalPhone = userPhone.trim() ? (userPhone.startsWith('+244') ? userPhone : `+244 ${userPhone}`) : undefined;

    const paymentData: SubmittedPaymentData = {
      method,
      txId: generatedId,
      userPhone: finalPhone,
      referenceCode: refCode,
      senderLast4: effectiveLast4,
      senderName: method === 'Transferência' ? baiSenderName.trim() : undefined,
      receiptFileName: receiptFileName || undefined,
      receiptFileSize: receiptFileSize || undefined,
      receiptMimeType: receiptMimeType || undefined,
      receiptUploadedAt: receiptUploadedAt || undefined,
      receiptUrl: receiptDataUrl || undefined,
    };

    // ACTION (a): Gravar IMEDIATAMENTE o registo do pagamento no estado 'pendente' na base de dados
    try {
      if (onPaymentSubmitted) {
        onPaymentSubmitted(paymentData);
      }
    } catch (dbErr) {
      console.error('Erro ao registar pagamento no sistema local/cloud:', dbErr);
      alert('Aviso: Ocorreu uma lentidão ao sincronizar com a base de dados, mas o seu pedido foi retido localmente.');
    }

    // ACTION (b): Enviar a notificação para o Discord Webhook
    try {
      await sendPaymentDiscordNotification({
        userName,
        userEmail,
        userPhone: finalPhone,
        amount,
        method,
        referenceCode: refCode,
        senderLast4: effectiveLast4,
        senderName: method === 'Transferência' ? baiSenderName.trim() : undefined,
        receiptFileName: receiptFileName || undefined,
        receiptFileSize: receiptFileSize || undefined,
        receiptMimeType: receiptMimeType || undefined,
        receiptUrl: receiptDataUrl || undefined,
        txId: generatedId,
        templateName,
      });
    } catch (err) {
      console.warn('Erro ao disparar webhook Discord:', err);
    }

    setIsProcessing(false);
    setPaymentSuccess(true);

    // Trigger subtle confetti
    confetti({
      particleCount: 60,
      spread: 60,
      origin: { y: 0.6 },
    });

    // Auto-close modal after user sees the confirmation screen
    setTimeout(() => {
      onClose();
    }, 2200);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-surface-container-lowest rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-surface-border animate-in fade-in zoom-in-95 duration-200 max-h-[92vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-surface-border pb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
              <Icon name="payments" className="text-[20px]" />
            </div>
            <div>
              <h3 className="font-display text-base font-bold text-on-surface">
                Submeter Comprovativo de Pagamento
              </h3>
              <p className="text-xs text-on-surface-variant">
                {amount.toLocaleString()} Kz &bull; Multicaixa Xpress ou Transferência BAI
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-on-surface-variant hover:text-on-surface p-1.5 rounded-lg hover:bg-surface-container-high transition-colors"
          >
            <Icon name="close" className="text-[20px]" />
          </button>
        </div>

        {paymentSuccess ? (
          <div className="py-8 text-center space-y-4 animate-in fade-in zoom-in-95 duration-200">
            <div className="w-16 h-16 rounded-full bg-amber-50 text-amber-600 flex items-center justify-center mx-auto shadow-inner ring-8 ring-amber-50">
              <Icon name="hourglass_top" className="text-[36px]" />
            </div>
            <div className="space-y-1">
              <h4 className="font-display text-lg font-bold text-on-surface">
                Comprovativo Submetido com Sucesso!
              </h4>
              <p className="text-xs text-on-surface-variant max-w-sm mx-auto leading-relaxed">
                O seu pedido está agora no estado <strong>"Pagamento em análise"</strong>.
                O administrador foi notificado automaticamente para validação.
              </p>
            </div>

            <div className="p-3.5 bg-surface-container-low rounded-xl text-xs space-y-1.5 border border-surface-border inline-block text-left w-full max-w-sm">
              <div className="flex justify-between">
                <span className="text-on-surface-variant">ID da Transação:</span>
                <span className="font-mono font-bold text-primary">{submittedTxId}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-on-surface-variant">Método:</span>
                <span className="font-bold text-on-surface">
                  {method === 'Multicaixa' ? 'Multicaixa Xpress' : 'Transferência BAI'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-on-surface-variant">Valor:</span>
                <span className="font-bold text-slate-900 font-display">{amount.toLocaleString()} Kz</span>
              </div>
              <div className="flex justify-between items-center pt-1 border-t border-surface-border/60">
                <span className="text-on-surface-variant">Notificação Discord:</span>
                <span className="text-[10.5px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full flex items-center gap-1">
                  <Icon name="check" className="text-[13px]" />
                  Enviada ao Admin
                </span>
              </div>
            </div>

            <div className="bg-amber-50 border border-amber-200 text-amber-900 text-xs p-3 rounded-xl max-w-sm mx-auto flex items-start gap-2 text-left">
              <Icon name="info" className="text-[16px] text-amber-700 shrink-0 mt-0.5" />
              <span>
                Assim que o administrador confirmar o recebimento no painel, o seu currículo será desbloqueado automaticamente para download em PDF.
              </span>
            </div>
          </div>
        ) : (
          <form onSubmit={handleProcessPayment} className="py-4 space-y-4">
            {/* Price Banner */}
            <div className="p-4 bg-primary/5 rounded-2xl border border-primary/20 flex items-center justify-between">
              <div>
                <span className="text-xs text-on-surface-variant font-medium">Valor do Desbloqueio</span>
                <p className="text-2xl font-black font-display text-primary">
                  {amount.toLocaleString()} <span className="text-sm font-semibold">Kz</span>
                </p>
              </div>
              <div className="text-right">
                <span className="inline-flex items-center gap-1 text-[11px] bg-emerald-100 text-emerald-800 px-3 py-1 rounded-full font-bold">
                  <Icon name="verified" className="text-[14px]" />
                  1 Download PDF
                </span>
                <p className="text-[10px] text-on-surface-variant mt-1">
                  Sem subscrições recorrentes
                </p>
              </div>
            </div>

            {/* Payment Method Selector */}
            <div>
              <label className="block text-xs font-bold text-on-surface mb-2">
                Selecione como efetuou o pagamento:
              </label>

              <div className="grid grid-cols-2 gap-3">
                {/* Method 1: Multicaixa Xpress */}
                <button
                  type="button"
                  onClick={() => setMethod('Multicaixa')}
                  className={`p-3.5 rounded-2xl border flex flex-col items-center gap-2 transition-all cursor-pointer ${
                    method === 'Multicaixa'
                      ? 'border-primary bg-primary/10 text-primary font-bold shadow-xs ring-2 ring-primary/20'
                      : 'border-surface-border bg-surface-container-low text-on-surface-variant hover:bg-surface-container'
                  }`}
                >
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                    <Icon name="credit_card" className="text-[24px]" />
                  </div>
                  <div className="text-center">
                    <span className="text-xs font-bold block">Multicaixa Xpress</span>
                    <span className="text-[10px] text-on-surface-variant font-medium">923 845 779</span>
                  </div>
                </button>

                {/* Method 2: Transferência BAI */}
                <button
                  type="button"
                  onClick={() => setMethod('Transferência')}
                  className={`p-3.5 rounded-2xl border flex flex-col items-center gap-2 transition-all cursor-pointer ${
                    method === 'Transferência'
                      ? 'border-primary bg-primary/10 text-primary font-bold shadow-xs ring-2 ring-primary/20'
                      : 'border-surface-border bg-surface-container-low text-on-surface-variant hover:bg-surface-container'
                  }`}
                >
                  <div className="w-10 h-10 rounded-xl bg-secondary/10 flex items-center justify-center text-secondary">
                    <Icon name="account_balance" className="text-[24px]" />
                  </div>
                  <div className="text-center">
                    <span className="text-xs font-bold block">Transferência BAI</span>
                    <span className="text-[10px] text-on-surface-variant font-medium">IBAN Directo</span>
                  </div>
                </button>
              </div>
            </div>

            {/* Method 1: Multicaixa Xpress Instructions & Form */}
            {method === 'Multicaixa' && (
              <div className="p-4 bg-surface-container-low rounded-2xl space-y-3.5 border border-surface-border">
                <div className="bg-surface-container-lowest p-3.5 rounded-xl border border-primary/20 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-semibold text-on-surface-variant uppercase tracking-wider">
                      Número Multicaixa Xpress de Destino:
                    </span>
                    <span className="text-[10px] bg-primary/10 text-primary font-bold px-2 py-0.5 rounded-full">
                      Empresa
                    </span>
                  </div>
                  <div className="flex items-center justify-between bg-surface-container-low px-3 py-2 rounded-lg border border-surface-border">
                    <span className="font-mono text-base font-black text-slate-900 tracking-wider">
                      923 845 779
                    </span>
                    <button
                      type="button"
                      onClick={() => copyToClipboard('923845779', 'mcx-num')}
                      className="px-2.5 py-1 text-[11px] font-bold bg-primary text-white rounded-md hover:bg-primary/90 transition-colors flex items-center gap-1 cursor-pointer"
                    >
                      <Icon name={copiedField === 'mcx-num' ? 'check' : 'content_copy'} className="text-[14px]" />
                      {copiedField === 'mcx-num' ? 'Copiado!' : 'Copiar'}
                    </button>
                  </div>
                  <p className="text-[11px] text-on-surface-variant">
                    Envie <strong>{amount.toLocaleString()} Kz</strong> através do Multicaixa Express e insira abaixo o seu contacto ou código para verificação imediata.
                  </p>
                </div>

                <div className="space-y-2.5 pt-1">
                  <div>
                    <label className="block text-xs font-semibold text-on-surface mb-1">
                      O seu Número de Telemóvel (+244) <span className="text-primary">*</span>
                    </label>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-on-surface-variant bg-surface px-2.5 py-2 rounded-lg border border-surface-border">
                        +244
                      </span>
                      <input
                        type="tel"
                        required
                        value={userPhone}
                        onChange={(e) => {
                          setUserPhone(e.target.value);
                          const digits = e.target.value.replace(/\D/g, '');
                          if (digits.length >= 4) {
                            setMcxLast4(digits.slice(-4));
                          }
                        }}
                        placeholder="Ex: 923 845 779"
                        className="flex-1 bg-surface-container-lowest border border-surface-border rounded-xl p-2.5 text-xs font-mono outline-none focus:ring-2 focus:ring-primary/20"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-xs font-semibold text-on-surface mb-1">
                        Últimos 4 Dígitos do Tel. <span className="text-primary">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        maxLength={4}
                        value={mcxLast4}
                        onChange={(e) => setMcxLast4(e.target.value.replace(/\D/g, '').slice(0, 4))}
                        placeholder="Ex: 5779"
                        className="w-full bg-surface-container-lowest border border-surface-border rounded-xl p-2.5 text-xs font-mono font-bold tracking-widest text-center outline-none focus:ring-2 focus:ring-primary/20"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-on-surface mb-1">
                        Cód. Mensagem / Ref. (Opcional)
                      </label>
                      <input
                        type="text"
                        value={mcxTxCode}
                        onChange={(e) => setMcxTxCode(e.target.value)}
                        placeholder="Ex: MCX-94821"
                        className="w-full bg-surface-container-lowest border border-surface-border rounded-xl p-2.5 text-xs font-mono outline-none focus:ring-2 focus:ring-primary/20"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Method 2: Transferência Bancária BAI Instructions & Form */}
            {method === 'Transferência' && (
              <div className="p-4 bg-surface-container-low rounded-2xl space-y-3.5 border border-surface-border">
                <div className="bg-surface-container-lowest p-3.5 rounded-xl border border-secondary/20 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-semibold text-on-surface-variant uppercase tracking-wider">
                      Coordenadas Bancárias Oficiais (BAI):
                    </span>
                    <span className="text-[10px] bg-secondary/10 text-secondary font-bold px-2 py-0.5 rounded-full">
                      Conta Empresa
                    </span>
                  </div>

                  <div className="space-y-1 font-sans text-xs bg-surface-container-low p-2.5 rounded-xl border border-surface-border">
                    <div className="flex justify-between">
                      <span className="text-on-surface-variant font-medium">Banco:</span>
                      <span className="font-bold text-slate-900">Banco Angolano de Investimentos (BAI)</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-on-surface-variant font-medium">Titular:</span>
                      <span className="font-bold text-slate-900">Chinua Ndembo, Lda</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between bg-surface-container-low px-3 py-2 rounded-lg border border-surface-border">
                    <div className="space-y-0.5">
                      <span className="text-[10px] text-on-surface-variant uppercase tracking-wider font-semibold block">IBAN BAI:</span>
                      <span className="font-mono text-xs font-bold text-slate-900 tracking-wide select-all">
                        0040 0000 6273 9820 1010 9
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => copyToClipboard('004000006273982010109', 'bai-iban')}
                      className="px-2.5 py-1 text-[11px] font-bold bg-secondary text-white rounded-md hover:bg-secondary/90 transition-colors flex items-center gap-1 cursor-pointer"
                    >
                      <Icon name={copiedField === 'bai-iban' ? 'check' : 'content_copy'} className="text-[14px]" />
                      {copiedField === 'bai-iban' ? 'Copiado!' : 'Copiar'}
                    </button>
                  </div>
                </div>

                <div className="space-y-2.5 pt-1">
                  <div>
                    <label className="block text-xs font-semibold text-on-surface mb-1">
                      Nº de Talão / Referência da Transferência BAI <span className="text-primary">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={baiReference}
                      onChange={(e) => setBaiReference(e.target.value)}
                      placeholder="Ex: TRX-BAI-892102 ou código impresso no talão"
                      className="w-full bg-surface-container-lowest border border-surface-border rounded-xl p-2.5 text-xs font-mono outline-none focus:ring-2 focus:ring-primary/20"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-xs font-semibold text-on-surface mb-1">
                        Últimos 4 Dígitos da Conta/Tel. <span className="text-primary">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        maxLength={4}
                        value={baiSenderLast4}
                        onChange={(e) => setBaiSenderLast4(e.target.value.replace(/\D/g, '').slice(0, 4))}
                        placeholder="Ex: 1010"
                        className="w-full bg-surface-container-lowest border border-surface-border rounded-xl p-2.5 text-xs font-mono font-bold tracking-widest text-center outline-none focus:ring-2 focus:ring-primary/20"
                      />
                      <span className="text-[10px] text-on-surface-variant block mt-0.5">
                        Para cruzamento com o extrato
                      </span>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-on-surface mb-1">
                        Nome do Titular de Origem
                      </label>
                      <input
                        type="text"
                        value={baiSenderName}
                        onChange={(e) => setBaiSenderName(e.target.value)}
                        placeholder="Nome no talão"
                        className="w-full bg-surface-container-lowest border border-surface-border rounded-xl p-2.5 text-xs outline-none focus:ring-2 focus:ring-primary/20"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-on-surface mb-1">
                      Anexar Imagem do Comprovativo (JPG / PNG)
                    </label>
                    <div className="relative">
                      <input
                        type="file"
                        accept="image/jpeg,image/png,image/webp,image/jpg"
                        onChange={handleFileUpload}
                        className="hidden"
                        id="receipt-upload"
                      />
                      <label
                        htmlFor="receipt-upload"
                        className={`flex items-center justify-center gap-2 w-full p-2.5 bg-surface-container-lowest border border-dashed rounded-xl text-xs cursor-pointer transition-colors ${
                          fileError
                            ? 'border-red-400 bg-red-50 text-red-700'
                            : receiptFileName
                            ? 'border-emerald-500 bg-emerald-50/40 text-emerald-800 font-medium'
                            : 'border-surface-border text-on-surface-variant hover:border-primary'
                        }`}
                      >
                        <Icon name={receiptFileName ? 'verified' : 'add_photo_alternate'} className="text-[18px]" />
                        <span className="truncate max-w-[280px]">
                          {receiptFileName ? `${receiptFileName} (${receiptFileSize || 'OK'})` : 'Carregar imagem do comprovativo (JPG / PNG)'}
                        </span>
                      </label>
                    </div>

                    {fileError && (
                      <p className="text-[11px] text-red-600 mt-1 flex items-center gap-1 font-medium">
                        <Icon name="error" className="text-[14px]" />
                        {fileError}
                      </p>
                    )}

                    {receiptFileName && !fileError && (
                      <div className="mt-1.5 p-2 bg-emerald-50 rounded-lg text-[10.5px] text-emerald-800 flex items-center justify-between">
                        <span>🛡️ Formato verificado ({receiptMimeType})</span>
                        <span className="font-mono font-semibold">{receiptFileSize}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Submit Button */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={isProcessing}
                className="w-full bg-primary text-white py-3.5 rounded-xl font-bold text-xs shadow-md hover:bg-primary/95 transition-all flex items-center justify-center gap-2 active:scale-[0.98] disabled:opacity-75 cursor-pointer"
              >
                {isProcessing ? (
                  <>
                    <Icon name="progress_activity" className="text-[18px] animate-spin" />
                    A enviar notificação para o Discord & a registar comprovativo...
                  </>
                ) : (
                  <>
                    <Icon name="send" className="text-[18px]" />
                    Submeter Comprovativo de {amount.toLocaleString()} Kz
                  </>
                )}
              </button>
              <p className="text-center text-[10.5px] text-on-surface-variant mt-2">
                O comprovativo ficará com estado <strong>"Pagamento em análise"</strong> até à aprovação do administrador.
              </p>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
