import React, { useState } from 'react';
import { CVTemplate, ResumeData } from '../../types';
import { CVPreviewDoc } from '../user/CVPreviewDoc';
import {
  SAMPLE_LUMINA_MODERN,
  SAMPLE_EXECUTIVE_CLASSIC,
  SAMPLE_CREATIVE_TECH,
  SAMPLE_CLASSIC_SIMPLE,
} from '../../data/templateSampleData';

interface TemplatesViewProps {
  templates: CVTemplate[];
  onToggleTemplate: (id: string) => void;
  onPreviewTemplate?: (template: CVTemplate) => void;
}

const TEMPLATE_SAMPLES: Record<string, ResumeData> = {
  'lumina-modern': SAMPLE_LUMINA_MODERN,
  'executive-classic': SAMPLE_EXECUTIVE_CLASSIC,
  'creative-tech': SAMPLE_CREATIVE_TECH,
  'classic-simple': SAMPLE_CLASSIC_SIMPLE,
};

export const TemplatesView: React.FC<TemplatesViewProps> = ({
  templates,
  onToggleTemplate,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('Todos');
  const [previewingTemplate, setPreviewingTemplate] = useState<CVTemplate | null>(null);
  const [activeTabPreview, setActiveTabPreview] = useState<'preview' | 'details'>('preview');

  const filteredTemplates = templates.filter((tpl) => {
    if (selectedCategory === 'Todos') return true;
    return tpl.category === selectedCategory;
  });

  const getSampleForTemplate = (templateId: string): ResumeData => {
    return TEMPLATE_SAMPLES[templateId] || SAMPLE_LUMINA_MODERN;
  };

  return (
    <div className="flex flex-col w-full max-w-[1240px] mx-auto p-4 sm:p-6 lg:p-8 gap-6 sm:gap-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl sm:text-3xl font-bold text-on-surface tracking-tight">
            Catálogo de Modelos de CV
          </h1>
          <p className="text-on-surface-variant text-xs sm:text-sm mt-1">
            Gerencie os designs oficiais de currículos disponibilizados aos candidatos no mercado angolano.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
          {['Todos', 'Mais popular', 'Premium', 'Novo', 'Clássico'].map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 sm:px-3.5 py-1.5 sm:py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                selectedCategory === cat
                  ? 'bg-primary text-white shadow-xs'
                  : 'bg-surface-container-low text-on-surface-variant hover:bg-surface-container-high'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Grid of Templates */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {filteredTemplates.map((tpl) => {
          const sample = getSampleForTemplate(tpl.id);
          return (
            <div
              key={tpl.id}
              className="bg-surface-container-lowest rounded-2xl shadow-xs border border-surface-border/60 overflow-hidden flex flex-col group hover:shadow-lg transition-all duration-200"
            >
              {/* Visual Preview Container */}
              <div className="relative h-72 bg-slate-100 overflow-hidden border-b border-surface-border group">
                {tpl.thumbnailUrl ? (
                  <img
                    src={tpl.thumbnailUrl}
                    alt={tpl.name}
                    referrerPolicy="no-referrer"
                    loading="lazy"
                    className="w-full h-full object-cover object-top group-hover:scale-105 transition-transform duration-300"
                  />
                ) : (
                  <div className="w-full h-full p-2 bg-slate-50 overflow-hidden scale-[0.38] origin-top-left w-[263%] h-[263%] pointer-events-none select-none">
                    <CVPreviewDoc
                      resumeData={sample}
                      selectedTemplateId={tpl.id}
                      isWatermarked={false}
                    />
                  </div>
                )}

                {/* Overlay hover actions */}
                <div className="absolute inset-0 bg-slate-950/40 backdrop-blur-xs opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex flex-col items-center justify-center gap-2 p-4">
                  <button
                    type="button"
                    onClick={() => {
                      setPreviewingTemplate(tpl);
                      setActiveTabPreview('preview');
                    }}
                    className="w-full py-2 px-3 bg-white hover:bg-slate-100 text-slate-900 rounded-xl text-xs font-bold shadow-lg flex items-center justify-center gap-1.5 transition-all transform translate-y-2 group-hover:translate-y-0 cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-[16px] text-primary">visibility</span>
                    Pré-visualização Real
                  </button>
                  <button
                    type="button"
                    onClick={() => onToggleTemplate(tpl.id)}
                    className={`w-full py-2 px-3 rounded-xl text-xs font-bold text-white shadow-lg flex items-center justify-center gap-1.5 transition-all transform translate-y-2 group-hover:translate-y-0 cursor-pointer ${
                      tpl.isActive ? 'bg-red-600 hover:bg-red-700' : 'bg-emerald-600 hover:bg-emerald-700'
                    }`}
                  >
                    <span className="material-symbols-outlined text-[16px]">
                      {tpl.isActive ? 'visibility_off' : 'check_circle'}
                    </span>
                    {tpl.isActive ? 'Desativar Modelo' : 'Ativar no App'}
                  </button>
                </div>

                {/* Badges */}
                <span
                  className={`absolute top-3 left-3 px-2.5 py-0.5 rounded-md text-[10px] font-bold shadow-xs ${
                    tpl.category === 'Mais popular'
                      ? 'bg-blue-600 text-white'
                      : tpl.category === 'Premium'
                      ? 'bg-amber-600 text-white'
                      : tpl.category === 'Novo'
                      ? 'bg-emerald-600 text-white'
                      : 'bg-slate-800 text-white'
                  }`}
                >
                  {tpl.category}
                </span>
                <span
                  className={`absolute top-3 right-3 px-2 py-0.5 rounded-full text-[10px] font-bold shadow-xs ${
                    tpl.isActive
                      ? 'bg-emerald-500 text-white'
                      : 'bg-red-500 text-white'
                  }`}
                >
                  {tpl.isActive ? 'Ativo' : 'Desativado'}
                </span>
              </div>

              {/* Info & Admin Controls */}
              <div className="p-4 flex-1 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between">
                    <h3 className="font-display text-base font-bold text-on-surface">
                      {tpl.name}
                    </h3>
                    <span className="text-xs font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-full">
                      {tpl.popularityPercentage}% adesão
                    </span>
                  </div>
                  <p className="text-xs text-on-surface-variant mt-1.5 line-clamp-2">
                    {tpl.description}
                  </p>
                </div>

                <div className="pt-4 mt-4 border-t border-surface-border flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <span className={`w-2 h-2 rounded-full ${tpl.isActive ? 'bg-emerald-500' : 'bg-red-500'}`}></span>
                    <span className="text-xs font-medium text-on-surface">
                      {tpl.isActive ? 'Visível no Gerador' : 'Oculto aos Clientes'}
                    </span>
                  </div>

                  <label className="relative inline-flex items-center cursor-pointer" title="Alternar visibilidade">
                    <input
                      type="checkbox"
                      checked={tpl.isActive}
                      onChange={() => onToggleTemplate(tpl.id)}
                      className="sr-only peer"
                    />
                    <div className="w-9 h-5 bg-surface-variant peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-primary"></div>
                  </label>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Real Full CV Preview Modal */}
      {previewingTemplate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-xs overflow-y-auto">
          <div className="bg-surface-container-lowest rounded-3xl max-w-4xl w-full max-h-[92vh] flex flex-col shadow-2xl border border-surface-border animate-in fade-in zoom-in-95 duration-150 overflow-hidden my-auto">
            {/* Modal Header */}
            <div className="p-5 border-b border-surface-border flex items-center justify-between bg-surface-container-low/60">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-bold">
                  <span className="material-symbols-outlined text-[20px]">palette</span>
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-display text-lg font-bold text-on-surface">
                      {previewingTemplate.name}
                    </h3>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-primary/10 text-primary">
                      {previewingTemplate.category}
                    </span>
                  </div>
                  <p className="text-xs text-on-surface-variant">
                    Pré-visualização fiel com dados simulados em padrão profissional angolano
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => onToggleTemplate(previewingTemplate.id)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    previewingTemplate.isActive
                      ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                      : 'bg-red-100 text-red-800 hover:bg-red-200'
                  }`}
                >
                  {previewingTemplate.isActive ? '✅ Ativo no Gerador' : '❌ Desativado'}
                </button>
                <button
                  type="button"
                  onClick={() => setPreviewingTemplate(null)}
                  className="text-on-surface-variant hover:text-on-surface p-2 rounded-xl hover:bg-surface-container-high transition-all cursor-pointer"
                >
                  <span className="material-symbols-outlined">close</span>
                </button>
              </div>
            </div>

            {/* Modal Navigation Tabs */}
            <div className="flex items-center px-6 border-b border-surface-border bg-surface-container-lowest gap-4">
              <button
                type="button"
                onClick={() => setActiveTabPreview('preview')}
                className={`py-3 text-xs font-bold border-b-2 transition-all cursor-pointer flex items-center gap-1.5 ${
                  activeTabPreview === 'preview'
                    ? 'border-primary text-primary'
                    : 'border-transparent text-on-surface-variant hover:text-on-surface'
                }`}
              >
                <span className="material-symbols-outlined text-[16px]">description</span>
                Renderização Real do Documento
              </button>
              <button
                type="button"
                onClick={() => setActiveTabPreview('details')}
                className={`py-3 text-xs font-bold border-b-2 transition-all cursor-pointer flex items-center gap-1.5 ${
                  activeTabPreview === 'details'
                    ? 'border-primary text-primary'
                    : 'border-transparent text-on-surface-variant hover:text-on-surface'
                }`}
              >
                <span className="material-symbols-outlined text-[16px]">info</span>
                Especificações Técnicas
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto flex-1 bg-surface-container-low/30">
              {activeTabPreview === 'preview' ? (
                <div className="max-w-2xl mx-auto shadow-xl rounded-2xl overflow-hidden bg-white">
                  <CVPreviewDoc
                    resumeData={getSampleForTemplate(previewingTemplate.id)}
                    selectedTemplateId={previewingTemplate.id}
                    isWatermarked={false}
                  />
                </div>
              ) : (
                <div className="space-y-4 max-w-xl mx-auto text-xs">
                  <div className="p-4 bg-surface-container-lowest rounded-2xl border border-surface-border space-y-2">
                    <span className="text-[10px] uppercase font-bold text-on-surface-variant block">Descrição do Modelo</span>
                    <p className="text-on-surface leading-relaxed text-sm font-medium">
                      {previewingTemplate.description}
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 bg-surface-container-lowest rounded-2xl border border-surface-border">
                      <span className="text-[10px] uppercase font-bold text-on-surface-variant block">Adesão dos Utilizadores</span>
                      <span className="text-2xl font-bold font-display text-primary mt-1 block">
                        {previewingTemplate.popularityPercentage}%
                      </span>
                    </div>
                    <div className="p-4 bg-surface-container-lowest rounded-2xl border border-surface-border">
                      <span className="text-[10px] uppercase font-bold text-on-surface-variant block">Categoria</span>
                      <span className="text-base font-bold font-display text-on-surface mt-1 block">
                        {previewingTemplate.category}
                      </span>
                    </div>
                  </div>

                  <div className="p-4 bg-surface-container-lowest rounded-2xl border border-surface-border space-y-1">
                    <span className="text-[10px] uppercase font-bold text-on-surface-variant block">ID Técnico</span>
                    <code className="text-xs font-mono text-primary bg-primary/5 px-2 py-1 rounded block">
                      {previewingTemplate.id}
                    </code>
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-surface-border bg-surface-container-lowest flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setPreviewingTemplate(null)}
                className="px-5 py-2.5 rounded-xl bg-surface-container-high hover:bg-surface-container-highest text-on-surface font-semibold text-xs transition-all cursor-pointer"
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
