import { Icon } from '../common/Icon';
import React, { useState, useRef, useEffect, useCallback } from 'react';

interface PassportPhotoModalProps {
  initialImage?: string;
  onApplyPhoto: (photoDataUrl: string) => void;
  onClose: () => void;
}

type BackgroundColorOption = 'white' | 'light-blue' | 'neutral-gray' | 'original';

export const PassportPhotoModal: React.FC<PassportPhotoModalProps> = ({
  initialImage,
  onApplyPhoto,
  onClose,
}) => {
  const [imageSrc, setImageSrc] = useState<string | null>(initialImage || null);
  const [zoom, setZoom] = useState<number>(1.2);
  const [panX, setPanX] = useState<number>(0);
  const [panY, setPanY] = useState<number>(0);
  const [brightness, setBrightness] = useState<number>(105);
  const [contrast, setContrast] = useState<number>(105);
  const [bgChoice, setBgChoice] = useState<BackgroundColorOption>('white');
  const [isProcessing, setIsProcessing] = useState(false);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imgRef = useRef<HTMLImageElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const renderCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    const img = imgRef.current;
    if (!canvas || !img) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = 360;
    const height = 480; // 3:4 passport aspect ratio (standard 35mm x 45mm proportion)
    canvas.width = width;
    canvas.height = height;

    // 1. Draw Background
    let bgColor = '#FFFFFF';
    if (bgChoice === 'light-blue') {
      bgColor = '#E0F2FE';
    } else if (bgChoice === 'neutral-gray') {
      bgColor = '#E2E8F0';
    }
    ctx.fillStyle = bgColor;
    ctx.fillRect(0, 0, width, height);

    // 2. Setup Filters (Brightness & Contrast)
    ctx.filter = `brightness(${brightness}%) contrast(${contrast}%)`;

    // 3. Calculate Draw Dimensions with Zoom and Pan
    const imgAspect = img.width / img.height;
    const canvasAspect = width / height;

    let drawWidth: number;
    let drawHeight: number;

    if (imgAspect > canvasAspect) {
      drawHeight = height * zoom;
      drawWidth = drawHeight * imgAspect;
    } else {
      drawWidth = width * zoom;
      drawHeight = drawWidth / imgAspect;
    }

    const offsetX = (width - drawWidth) / 2 + panX;
    const offsetY = (height - drawHeight) / 2 + panY;

    // Draw the image onto canvas
    ctx.drawImage(img, offsetX, offsetY, drawWidth, drawHeight);

    // 4. If a tinted studio background is chosen, apply a refined studio rim / color temperature balance
    if (bgChoice === 'light-blue') {
      ctx.save();
      ctx.globalCompositeOperation = 'soft-light';
      ctx.fillStyle = 'rgba(56, 189, 248, 0.25)';
      ctx.fillRect(0, 0, width, height);
      ctx.restore();
    } else if (bgChoice === 'neutral-gray') {
      ctx.save();
      ctx.globalCompositeOperation = 'soft-light';
      ctx.fillStyle = 'rgba(100, 116, 139, 0.18)';
      ctx.fillRect(0, 0, width, height);
      ctx.restore();
    }

    // Reset filter
    ctx.filter = 'none';
  }, [zoom, panX, panY, brightness, contrast, bgChoice]);

  // Load image object when imageSrc changes
  useEffect(() => {
    if (!imageSrc) return;
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      imgRef.current = img;
      renderCanvas();
    };
    img.src = imageSrc;
  }, [imageSrc, renderCanvas]);

  // Re-render canvas on adjustments
  useEffect(() => {
    renderCanvas();
  }, [renderCanvas]);

  // Handle local file selection
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImageSrc(reader.result as string);
        setZoom(1.2);
        setPanX(0);
        setPanY(0);
      };
      reader.readAsDataURL(file);
    }
  };

  // Auto-center & optimize preset
  const handleAutoFitPassport = () => {
    setZoom(1.35);
    setPanX(0);
    setPanY(15);
    setBrightness(108);
    setContrast(105);
    setBgChoice('white');
  };

  // Export finished passport photo
  const handleSaveAndApply = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    setIsProcessing(true);
    setTimeout(() => {
      const dataUrl = canvas.toDataURL('image/jpeg', 0.95);
      onApplyPhoto(dataUrl);
      setIsProcessing(false);
      onClose();
    }, 400);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-surface-container-lowest rounded-2xl max-w-2xl w-full p-6 shadow-2xl border border-surface-border animate-in fade-in zoom-in-95 duration-200 flex flex-col max-h-[92vh]">
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-surface-border pb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
              <Icon name="badge" className="text-[22px]" />
            </div>
            <div>
              <h3 className="font-display text-base font-bold text-on-surface">
                Editor de Foto Tipo Passe (Padrão Corporativo)
              </h3>
              <p className="text-xs text-on-surface-variant">
                Enquadramento 3:4 vertical com guia facial e fundo neutro para CVs em Angola.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-on-surface-variant hover:text-on-surface p-1.5 rounded-lg hover:bg-surface-container-high transition-colors"
          >
            <Icon name="close" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto py-4 grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
          {/* Left: Canvas Preview & Passport Guide */}
          <div className="md:col-span-5 flex flex-col items-center">
            <div className="relative w-[210px] h-[280px] rounded-2xl overflow-hidden shadow-md border-2 border-primary/40 bg-slate-100 flex items-center justify-center">
              {imageSrc ? (
                <>
                  <canvas
                    ref={canvasRef}
                    className="w-full h-full object-cover"
                  />
                  {/* Passport Biometric Overlay Guide */}
                  <div className="absolute inset-0 pointer-events-none border border-dashed border-primary/30 rounded-xl m-2 flex flex-col items-center justify-between p-2">
                    {/* Head Guide Oval */}
                    <div className="w-24 h-32 rounded-[50%] border border-primary/40 mt-3 relative">
                      {/* Eye Line Guide */}
                      <div className="absolute top-[45%] left-0 right-0 border-t border-dotted border-primary/50"></div>
                      {/* Center Axis */}
                      <div className="absolute top-0 bottom-0 left-1/2 border-l border-dotted border-primary/50"></div>
                    </div>
                    <span className="text-[9px] bg-slate-900/70 text-white font-mono px-2 py-0.5 rounded-full">
                      Guia de Enquadramento
                    </span>
                  </div>
                </>
              ) : (
                <div className="text-center p-4 text-on-surface-variant space-y-2">
                  <Icon name="add_a_photo" className="text-[40px] text-primary" />
                  <p className="text-xs font-semibold">Nenhuma foto carregada</p>
                  <p className="text-[10px]">Carregue uma selfie ou foto de rosto para começar.</p>
                </div>
              )}
            </div>

            {/* Upload or Change button */}
            <input
              type="file"
              ref={fileInputRef}
              accept="image/*"
              onChange={handleFileChange}
              className="hidden"
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="mt-3 w-[210px] py-2 bg-surface-container-high hover:bg-surface-container-highest text-on-surface text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 border border-surface-border"
            >
              <Icon name="upload_file" className="text-[16px]" />
              {imageSrc ? 'Carregar Outra Foto' : 'Selecionar Foto'}
            </button>

            {imageSrc && (
              <button
                type="button"
                onClick={handleAutoFitPassport}
                className="mt-2 w-[210px] py-1.5 bg-primary/10 hover:bg-primary/20 text-primary text-[11px] font-bold rounded-xl transition-all flex items-center justify-center gap-1"
              >
                <Icon name="auto_fix_high" className="text-[14px]" />
                Auto-Centrar & Otimizar
              </button>
            )}
          </div>

          {/* Right: Controls & Adjustments */}
          <div className="md:col-span-7 space-y-4">
            {/* Background Selector */}
            <div className="p-3 bg-surface-container-low rounded-xl border border-surface-border">
              <label className="block text-xs font-bold text-on-surface mb-2 flex items-center justify-between">
                <span>Fundo Neutro Tipo Passe:</span>
                <span className="text-[10px] text-primary font-normal">Recomendado para recrutamento</span>
              </label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setBgChoice('white')}
                  className={`p-2 rounded-xl text-xs font-bold border transition-all flex items-center gap-2 ${
                    bgChoice === 'white'
                      ? 'border-primary bg-primary/10 text-primary ring-1 ring-primary'
                      : 'border-surface-border bg-white text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <span className="w-3.5 h-3.5 rounded-full bg-white border border-slate-300 shadow-2xs"></span>
                  Branco Puro
                </button>

                <button
                  type="button"
                  onClick={() => setBgChoice('light-blue')}
                  className={`p-2 rounded-xl text-xs font-bold border transition-all flex items-center gap-2 ${
                    bgChoice === 'light-blue'
                      ? 'border-primary bg-primary/10 text-primary ring-1 ring-primary'
                      : 'border-surface-border bg-white text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <span className="w-3.5 h-3.5 rounded-full bg-sky-100 border border-sky-300 shadow-2xs"></span>
                  Azul Claro
                </button>

                <button
                  type="button"
                  onClick={() => setBgChoice('neutral-gray')}
                  className={`p-2 rounded-xl text-xs font-bold border transition-all flex items-center gap-2 ${
                    bgChoice === 'neutral-gray'
                      ? 'border-primary bg-primary/10 text-primary ring-1 ring-primary'
                      : 'border-surface-border bg-white text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <span className="w-3.5 h-3.5 rounded-full bg-slate-200 border border-slate-300 shadow-2xs"></span>
                  Cinza Estúdio
                </button>
              </div>
            </div>

            {/* Zoom & Positioning Sliders */}
            <div className="p-3 bg-surface-container-low rounded-xl border border-surface-border space-y-3">
              <h4 className="text-xs font-bold text-on-surface">Ajuste de Posição e Zoom</h4>

              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-on-surface-variant font-medium">Zoom / Escala</span>
                  <span className="font-mono text-primary font-bold">{zoom.toFixed(1)}x</span>
                </div>
                <input
                  type="range"
                  min="0.8"
                  max="2.5"
                  step="0.05"
                  value={zoom}
                  onChange={(e) => setZoom(parseFloat(e.target.value))}
                  className="w-full accent-primary h-1.5 bg-surface-container rounded-lg cursor-pointer"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <div className="flex justify-between text-[11px] mb-1">
                    <span className="text-on-surface-variant">Posição Vertical (Y)</span>
                    <span className="font-mono text-on-surface">{panY}px</span>
                  </div>
                  <input
                    type="range"
                    min="-100"
                    max="100"
                    step="2"
                    value={panY}
                    onChange={(e) => setPanY(parseInt(e.target.value, 10))}
                    className="w-full accent-primary h-1.5 bg-surface-container rounded-lg cursor-pointer"
                  />
                </div>

                <div>
                  <div className="flex justify-between text-[11px] mb-1">
                    <span className="text-on-surface-variant">Posição Horizontal (X)</span>
                    <span className="font-mono text-on-surface">{panX}px</span>
                  </div>
                  <input
                    type="range"
                    min="-100"
                    max="100"
                    step="2"
                    value={panX}
                    onChange={(e) => setPanX(parseInt(e.target.value, 10))}
                    className="w-full accent-primary h-1.5 bg-surface-container rounded-lg cursor-pointer"
                  />
                </div>
              </div>
            </div>

            {/* Brightness & Contrast */}
            <div className="p-3 bg-surface-container-low rounded-xl border border-surface-border space-y-3">
              <h4 className="text-xs font-bold text-on-surface">Iluminação e Nitidez Facial</h4>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <div className="flex justify-between text-[11px] mb-1">
                    <span className="text-on-surface-variant">Luminosidade</span>
                    <span className="font-mono text-on-surface">{brightness}%</span>
                  </div>
                  <input
                    type="range"
                    min="80"
                    max="140"
                    step="1"
                    value={brightness}
                    onChange={(e) => setBrightness(parseInt(e.target.value, 10))}
                    className="w-full accent-primary h-1.5 bg-surface-container rounded-lg cursor-pointer"
                  />
                </div>

                <div>
                  <div className="flex justify-between text-[11px] mb-1">
                    <span className="text-on-surface-variant">Contraste</span>
                    <span className="font-mono text-on-surface">{contrast}%</span>
                  </div>
                  <input
                    type="range"
                    min="80"
                    max="140"
                    step="1"
                    value={contrast}
                    onChange={(e) => setContrast(parseInt(e.target.value, 10))}
                    className="w-full accent-primary h-1.5 bg-surface-container rounded-lg cursor-pointer"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="flex gap-3 pt-4 border-t border-surface-border">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 px-4 py-2.5 rounded-xl border border-surface-border text-on-surface-variant font-semibold text-xs hover:bg-surface-container-low transition-colors"
          >
            Cancelar
          </button>
          <button
            type="button"
            disabled={!imageSrc || isProcessing}
            onClick={handleSaveAndApply}
            className="flex-1 px-4 py-2.5 rounded-xl bg-primary text-white font-bold text-xs hover:bg-primary/95 disabled:opacity-50 shadow-md transition-all flex items-center justify-center gap-1.5"
          >
            <Icon name="check_circle" className="text-[16px]" />
            {isProcessing ? 'A Processar...' : 'Aplicar Foto no Currículo'}
          </button>
        </div>
      </div>
    </div>
  );
};
