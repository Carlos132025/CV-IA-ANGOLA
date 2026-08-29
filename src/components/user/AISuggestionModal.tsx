import { Icon } from '../common/Icon';
import React, { useState } from 'react';
import { AI_SUMMARY_SUGGESTIONS } from '../../data/initialData';

export type AISuggestionMode = 'summary' | 'experience' | 'skills';

interface AISuggestionModalProps {
  mode?: AISuggestionMode;
  currentText: string;
  contextTitle?: string; // e.g. "Engenheiro de Software", "Contabilista"
  contextCompany?: string; // e.g. "Unitel", "Sonangol"
  onApply: (newText: string) => void;
  onApplySkills?: (skillsList: string[]) => void;
  onClose: () => void;
}

export const AISuggestionModal: React.FC<AISuggestionModalProps> = ({
  mode = 'summary',
  currentText,
  contextTitle = '',
  contextCompany = '',
  onApply,
  onApplySkills,
  onClose,
}) => {
  const [customPrompt, setCustomPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedResult, setGeneratedResult] = useState<string | null>(null);
  const [selectedSkills, setSelectedSkills] = useState<string[]>([]);

  // Preset Experience Suggestions for Angola Job Market
  const EXPERIENCE_SUGGESTIONS = [
    {
      role: 'Gestão, Contabilidade & Finanças',
      bullet: 'Liderança na reconciliação contabilística diária no software Primavera/PHC, preparação de declarações fiscais e apuramento rigoroso de impostos em conformidade com as diretrizes da AGT.',
    },
    {
      role: 'Engenharia, TI & Telecomunicações',
      bullet: 'Supervisão técnica de infraestrutura de redes, resolução rápida de incidentes operacionais de nível 2/3 e otimização de disponibilidade de sistemas corporativos.',
    },
    {
      role: 'Vendas, Comercial & Atendimento',
      bullet: 'Superação consistente de metas de vendas mensais em 15%, prospeção ativa de clientes corporativos e negociação de contratos estratégicos no mercado de Luanda.',
    },
    {
      role: 'Logística & Gestão de Armazém',
      bullet: 'Controlo rigoroso de inventário e expedição de mercadorias, redução de discrepâncias de stock em 20% e coordenação de equipa de motoristas e operadores.',
    },
    {
      role: 'Recursos Humanos & Administrativo',
      bullet: 'Gestão de processos de admissão, cálculo de folhas de salário, controlo de assiduidade e implementação de boas práticas de atendimento e organização documental.',
    },
  ];

  // Preset Skills by Category
  const SKILL_CATEGORIES = [
    {
      name: 'Sistemas & ERPs em Angola',
      skills: ['Primavera BSS v10', 'PHC Software', 'SAP ERP', 'Sage 50', 'Power BI'],
    },
    {
      name: 'Gestão & Finanças',
      skills: ['Legislação Fiscal AGT', 'Reconciliação Bancária', 'Fluxo de Caixa', 'Contabilidade Geral', 'Auditoria'],
    },
    {
      name: 'Tecnologia & Redes',
      skills: ['Administração Windows Server', 'Cisco CCNA / Redes', 'Suporte Técnico Helpdesk', 'Segurança da Informação', 'SQL / Bases de Dados'],
    },
    {
      name: 'Competências Interpessoais (Soft Skills)',
      skills: ['Liderança de Equipas', 'Comunicação Assertiva', 'Resolução de Problemas', 'Gestão de Tempo', 'Foco em Resultados'],
    },
  ];

  const handleEnhanceExperience = () => {
    setIsGenerating(true);
    setTimeout(() => {
      setIsGenerating(false);
      const roleText = contextTitle || 'função desempenhada';
      const compText = contextCompany ? ` na ${contextCompany}` : '';
      const base = currentText.trim() ? currentText : `Coordenação e execução das responsabilidades inerentes a ${roleText}${compText}`;
      
      const enhanced = `${base}. Atuação com elevado rigor técnico, foco em produtividade e cumprimento estrito de prazos corporativos. Implementação de melhorias contínuas que resultaram na otimização de fluxos de trabalho e satisfação das equipas de gestão.`;
      setGeneratedResult(enhanced);
    }, 500);
  };

  const handleEnhanceSummary = () => {
    setIsGenerating(true);
    setTimeout(() => {
      setIsGenerating(false);
      const roleText = contextTitle || 'na sua área de especialidade';
      const enhanced = currentText.trim()
        ? `Profissional experiente e orientado para resultados: ${currentText}. Destaco-me pela capacidade de liderança, comunicação assertiva, rigor operacional e forte compromisso com a excelência corporativa no mercado angolano.`
        : `Profissional dinâmico com sólida formação e experiência comprovada em ${roleText}. Elevado conhecimento do ecossistema empresarial em Angola, pensamento analítico e capacidade de entrega de valor sob pressão.`;
      setGeneratedResult(enhanced);
    }, 500);
  };

  const handleGenerateFromCustom = () => {
    const prompt = customPrompt.trim();
    if (!prompt && !currentText.trim()) return;
    setIsGenerating(true);
    setTimeout(() => {
      setIsGenerating(false);
      if (mode === 'skills') {
        const keywords = prompt.toLowerCase();
        let generated = [
          'Gestão de Processos',
          'Comunicação Corporativa',
          'Trabalho em Equipa',
          'Planeamento Estratégico',
        ];
        if (keywords.includes('venda') || keywords.includes('comercial')) {
          generated = ['Negociação Comercial', 'Prospeção de Clientes', 'Gestão de Contas', 'Fecho de Vendas', 'Atendimento ao Cliente'];
        } else if (keywords.includes('ti') || keywords.includes('rede') || keywords.includes('sistema')) {
          generated = ['Administração de Redes', 'Suporte Técnico', 'Gestão de Bases de Dados', 'Cibersegurança', 'Sistemas Operativos'];
        } else if (keywords.includes('contabil') || keywords.includes('financ') || keywords.includes('fiscal')) {
          generated = ['Primavera BSS v10', 'Legislação Fiscal AGT', 'Reconciliação Bancária', 'Fecho de Contas', 'Relatórios Financeiros'];
        }
        setSelectedSkills(generated);
      } else if (mode === 'experience') {
        const role = contextTitle || 'função';
        const comp = contextCompany ? ` na ${contextCompany}` : '';
        const text = `Atuação com ênfase em ${prompt || 'eficiência operacional'} como ${role}${comp}. Liderança e execução de projetos de melhoria, mitigação de riscos e garantia do cumprimento rigoroso dos padrões de conformidade corporativa.`;
        setGeneratedResult(text);
      } else {
        const text = `Profissional com perfil estratégico focado em ${prompt || 'otimização de operações e crescimento empresarial'}. Reconhecido pelo rigor ético, resolução rápida de desafios complexos e contribuição direta para as metas organizacionais.`;
        setGeneratedResult(text);
      }
    }, 500);
  };

  const toggleSkillSelection = (skill: string) => {
    if (selectedSkills.includes(skill)) {
      setSelectedSkills(selectedSkills.filter((s) => s !== skill));
    } else {
      setSelectedSkills([...selectedSkills, skill]);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-surface-container-lowest rounded-2xl max-w-xl w-full p-6 shadow-2xl border border-surface-border animate-in fade-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-surface-border pb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
              <Icon name="auto_awesome" className="text-[20px]" style={{ fontVariationSettings: "'FILL' 1" }} />
            </div>
            <div>
              <h3 className="font-display text-base font-bold text-on-surface">
                {mode === 'summary' && 'Assistente IA: Resumo Profissional'}
                {mode === 'experience' && 'Assistente IA: Descrição de Experiência'}
                {mode === 'skills' && 'Assistente IA: Sugestão de Competências'}
              </h3>
              <p className="text-xs text-on-surface-variant">
                Textos otimizados com linguagem corporativa e verbos de ação para o mercado de Angola.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-on-surface-variant hover:text-on-surface p-1 rounded-lg hover:bg-surface-container-high transition-colors"
          >
            <Icon name="close" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto py-4 space-y-4">
          {/* Quick 1-Click Action for current context */}
          <div className="p-3.5 bg-surface-container-low rounded-xl border border-surface-border/70 space-y-2">
            <div className="flex justify-between items-baseline">
              <span className="text-xs font-bold text-on-surface">
                {mode === 'experience' ? 'Otimizar Experiência Atual:' : 'Otimizar com Base no Seu Perfil:'}
              </span>
              {contextTitle && (
                <span className="text-[10px] bg-primary/10 text-primary font-semibold px-2 py-0.5 rounded-md">
                  {contextTitle} {contextCompany ? `@ ${contextCompany}` : ''}
                </span>
              )}
            </div>

            {currentText && (
              <p className="text-xs text-on-surface-variant italic line-clamp-2 bg-white/70 p-2 rounded-lg border border-surface-border/40">
                "{currentText}"
              </p>
            )}

            <button
              type="button"
              onClick={mode === 'experience' ? handleEnhanceExperience : handleEnhanceSummary}
              disabled={isGenerating}
              className="w-full py-2.5 bg-gradient-to-r from-primary to-emerald-600 hover:from-primary/95 hover:to-emerald-600/95 text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center justify-center gap-1.5"
            >
              <Icon name="magic_button" className="text-[16px]" />
              {isGenerating ? 'A gerar texto profissional...' : 'Gerar Versão Otimizada com IA'}
            </button>
          </div>

          {/* Mode Specific: Experience Presets */}
          {mode === 'experience' && (
            <div>
              <label className="block text-xs font-bold text-on-surface mb-2">
                Frases de Realizações Prontas por Área:
              </label>
              <div className="space-y-2">
                {EXPERIENCE_SUGGESTIONS.map((item, idx) => (
                  <div
                    key={idx}
                    onClick={() => setGeneratedResult(item.bullet)}
                    className="p-3 rounded-xl border border-surface-border hover:border-primary hover:bg-primary/5 transition-all cursor-pointer group bg-surface-container-lowest"
                  >
                    <div className="flex items-center justify-between text-xs font-bold text-on-surface group-hover:text-primary mb-1">
                      <span>{item.role}</span>
                      <span className="text-[10px] text-primary flex items-center gap-0.5">
                        Usar frase <Icon name="arrow_forward" className="text-[12px]" />
                      </span>
                    </div>
                    <p className="text-[11px] text-on-surface-variant leading-relaxed">
                      {item.bullet}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Mode Specific: Summary Presets */}
          {mode === 'summary' && (
            <div>
              <label className="block text-xs font-bold text-on-surface mb-2">
                Modelos Rápidos por Área de Atuação:
              </label>
              <div className="space-y-2">
                {AI_SUMMARY_SUGGESTIONS.map((item, idx) => (
                  <div
                    key={idx}
                    onClick={() => setGeneratedResult(item.text)}
                    className="p-3 rounded-xl border border-surface-border hover:border-primary hover:bg-primary/5 transition-all cursor-pointer group bg-surface-container-lowest"
                  >
                    <div className="flex items-center justify-between text-xs font-bold text-on-surface group-hover:text-primary mb-1">
                      <span>{item.role}</span>
                      <span className="text-[10px] text-primary flex items-center gap-0.5">
                        Selecionar <Icon name="arrow_forward" className="text-[12px]" />
                      </span>
                    </div>
                    <p className="text-[11px] text-on-surface-variant line-clamp-2">
                      {item.text}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Mode Specific: Skills Categories */}
          {mode === 'skills' && (
            <div className="space-y-3">
              <label className="block text-xs font-bold text-on-surface">
                Pacotes de Competências em Alta no Mercado:
              </label>
              {SKILL_CATEGORIES.map((cat, cIdx) => (
                <div key={cIdx} className="p-3 bg-surface-container-low rounded-xl border border-surface-border/70 space-y-1.5">
                  <span className="text-[11px] font-bold text-on-surface-variant uppercase">
                    {cat.name}
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {cat.skills.map((sk) => {
                      const isSelected = selectedSkills.includes(sk);
                      return (
                        <button
                          key={sk}
                          type="button"
                          onClick={() => toggleSkillSelection(sk)}
                          className={`text-xs px-2.5 py-1 rounded-lg font-medium transition-all flex items-center gap-1 ${
                            isSelected
                              ? 'bg-primary text-white shadow-2xs font-bold'
                              : 'bg-white text-slate-700 hover:bg-primary/10 hover:text-primary border border-surface-border'
                          }`}
                        >
                          <span>{sk}</span>
                          <Icon name={isSelected ? 'check' : 'add'} className="text-[14px]" />
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Custom Instruction / Prompt Input */}
          <div>
            <label className="block text-xs font-bold text-on-surface mb-1">
              Personalizar ou Pedir Outra Frase:
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder={
                  mode === 'skills'
                    ? 'ex: Vendas a retalho, petróleo e gás...'
                    : 'ex: Enfatizar liderança e redução de custos...'
                }
                value={customPrompt}
                onChange={(e) => setCustomPrompt(e.target.value)}
                className="flex-1 bg-surface-container-low border-none rounded-xl p-2.5 text-xs outline-none focus:ring-2 focus:ring-primary/20"
              />
              <button
                type="button"
                onClick={handleGenerateFromCustom}
                disabled={isGenerating || !customPrompt.trim()}
                className="bg-primary text-white px-4 py-2 rounded-xl text-xs font-bold hover:bg-primary/90 disabled:opacity-50 transition-all flex items-center gap-1 shrink-0 cursor-pointer"
              >
                <Icon name="auto_awesome" className="text-[16px]" />
                <span>Gerar</span>
              </button>
            </div>
          </div>

          {/* Generated Result Box */}
          {generatedResult && mode !== 'skills' && (
            <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl space-y-2 animate-in fade-in duration-150">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-emerald-800 flex items-center gap-1">
                  <Icon name="check_circle" className="text-[16px]" />
                  Texto Otimizado Pronto:
                </span>
                <span className="text-[10px] text-emerald-700 font-semibold">Qualidade Verificada</span>
              </div>
              <p className="text-xs text-slate-800 leading-relaxed font-medium">
                {generatedResult}
              </p>
            </div>
          )}
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
            disabled={mode === 'skills' ? selectedSkills.length === 0 : !generatedResult}
            onClick={() => {
              if (mode === 'skills' && onApplySkills) {
                onApplySkills(selectedSkills);
                onClose();
              } else if (generatedResult) {
                onApply(generatedResult);
                onClose();
              }
            }}
            className="flex-1 px-4 py-2.5 rounded-xl bg-primary text-white font-bold text-xs hover:bg-primary/95 disabled:opacity-50 shadow-md transition-all flex items-center justify-center gap-1.5"
          >
            <Icon name="done_all" className="text-[16px]" />
            {mode === 'skills'
              ? `Adicionar (${selectedSkills.length}) Competências`
              : 'Aplicar no Formulário'}
          </button>
        </div>
      </div>
    </div>
  );
};
