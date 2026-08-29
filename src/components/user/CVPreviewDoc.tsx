import { Icon } from '../common/Icon';
import React from 'react';
import { ResumeData, CVTemplate } from '../../types';

export interface CVPreviewDocProps {
  resume?: ResumeData;
  resumeData?: ResumeData;
  isWatermarked?: boolean;
  showWatermark?: boolean;
  selectedTemplateId?: string;
  templateId?: string;
  accentColor?: string;
  templates?: CVTemplate[];
}

export const CVPreviewDoc: React.FC<CVPreviewDocProps> = ({
  resume,
  resumeData,
  isWatermarked,
  showWatermark,
  selectedTemplateId,
  templateId: propTemplateId,
  accentColor: propAccentColor,
}) => {
  const currentResume: ResumeData = resume || resumeData || ({} as ResumeData);
  
  const personalInfo = currentResume.personalInfo || {
    fullName: '',
    professionalTitle: '',
    email: '',
    phone: '',
    location: '',
    professionalSummary: '',
    photoUrl: '',
    linkedinUrl: '',
    nationality: '',
    driverLicense: '',
  };
  
  const experiences = currentResume.experiences || [];
  const educations = currentResume.educations || [];
  const certifications = currentResume.certifications || [];
  const skills = currentResume.skills || [];
  const languages = currentResume.languages || [];
  const references = currentResume.references || [];
  
  const activeTemplateId = selectedTemplateId || propTemplateId || currentResume.templateId || 'lumina-modern';
  const activeColor = propAccentColor || currentResume.accentColor || '#004ac6';
  const watermarkActive = isWatermarked !== undefined ? isWatermarked : (showWatermark !== undefined ? showWatermark : false);

  // Mask contact info if watermarked (unpaid preview)
  const displayPhone = watermarkActive
    ? (personalInfo?.phone ? personalInfo.phone.slice(0, 7) + ' ••• ••• (🔒 Oculto)' : '+244 9•• ••• ••• (🔒 Oculto)')
    : personalInfo?.phone;
  const displayEmail = watermarkActive
    ? (personalInfo?.email ? personalInfo.email.slice(0, 4) + '••••@••••.com (🔒 Oculto)' : '••••@••••.com (🔒 Oculto)')
    : personalInfo?.email;

  // =========================================================================
  // 1. TEMPLATE: EXECUTIVE CLASSIC
  // =========================================================================
  if (activeTemplateId === 'executive-classic') {
    return (
      <div className="cv-document relative bg-white text-slate-800 p-8 sm:p-10 shadow-md rounded-2xl font-serif min-h-[960px] border border-slate-200 overflow-hidden print:border-none print:shadow-none print:p-0">
        {watermarkActive && <WatermarkOverlay />}
        {watermarkActive && <LockedHeaderBanner />}

        {/* Executive Header */}
        <div className="cv-header cv-section text-center pb-6 border-b-2 border-slate-900 mb-6">
          {personalInfo.photoUrl && (
            <div className="flex justify-center mb-4">
              <img
                src={personalInfo.photoUrl}
                alt={personalInfo.fullName || 'Foto de perfil'}
                referrerPolicy="no-referrer"
                className="w-24 h-24 rounded-full object-cover border-2 border-slate-900 shadow-sm"
              />
            </div>
          )}
          <h1 className="text-3xl font-bold uppercase tracking-wider text-slate-900 font-display">
            {personalInfo.fullName || 'Seu Nome Completo'}
          </h1>
          <p className="text-sm font-sans font-semibold text-slate-600 mt-1 uppercase tracking-widest">
            {personalInfo.professionalTitle || 'Título Profissional'}
          </p>
          <div className="flex items-center justify-center gap-4 text-xs font-sans text-slate-600 mt-3 flex-wrap">
            {displayPhone && (
              <span className="flex items-center gap-1 font-mono">
                <Icon name="call" className="text-[14px]" />
                {displayPhone}
              </span>
            )}
            {displayEmail && (
              <>
                <span>&bull;</span>
                <span className="flex items-center gap-1 font-mono">
                  <Icon name="mail" className="text-[14px]" />
                  {displayEmail}
                </span>
              </>
            )}
            {personalInfo.location && (
              <>
                <span>&bull;</span>
                <span className="flex items-center gap-1">
                  <Icon name="location_on" className="text-[14px]" />
                  {personalInfo.location}
                </span>
              </>
            )}
            {personalInfo.linkedinUrl && (
              <>
                <span>&bull;</span>
                <span className="flex items-center gap-1 font-mono">
                  <Icon name="link" className="text-[14px]" />
                  {personalInfo.linkedinUrl}
                </span>
              </>
            )}
            {personalInfo.nationality && (
              <>
                <span>&bull;</span>
                <span>Nacionalidade: {personalInfo.nationality}</span>
              </>
            )}
            {personalInfo.driverLicense && (
              <>
                <span>&bull;</span>
                <span>Carta: {personalInfo.driverLicense}</span>
              </>
            )}
          </div>
        </div>

        {/* Summary */}
        {personalInfo.professionalSummary && (
          <div className="cv-section mb-6">
            <h2 className="text-xs font-sans font-bold uppercase tracking-wider text-slate-900 border-b border-slate-300 pb-1 mb-2">
              Perfil Profissional
            </h2>
            <p className="text-xs leading-relaxed text-slate-700 font-sans text-justify">
              {personalInfo.professionalSummary}
            </p>
          </div>
        )}

        {/* Experience */}
        {experiences.length > 0 && (
          <div className="cv-section mb-6">
            <h2 className="text-xs font-sans font-bold uppercase tracking-wider text-slate-900 border-b border-slate-300 pb-1 mb-3">
              Experiência Profissional
            </h2>
            <div className="space-y-4">
              {experiences.map((exp) => (
                <div key={exp.id} className="cv-experience-item cv-item font-sans">
                  <div className="flex justify-between items-baseline">
                    <h3 className="text-xs font-bold text-slate-900">{exp.role}</h3>
                    <span className="text-[11px] text-slate-600 font-medium">
                      {exp.startDate} - {exp.isCurrent ? 'Presente' : exp.endDate}
                    </span>
                  </div>
                  <p className="text-[11px] font-semibold text-slate-700 italic">
                    {exp.company} {exp.location ? `• ${exp.location}` : ''}
                  </p>
                  {exp.description && (
                    <p className="text-xs text-slate-600 mt-1">{exp.description}</p>
                  )}
                  {exp.highlights && exp.highlights.filter(Boolean).length > 0 && (
                    <ul className="list-disc list-inside text-xs text-slate-600 mt-1.5 space-y-0.5">
                      {exp.highlights.filter(Boolean).map((h, i) => (
                        <li key={i}>{h}</li>
                      ))}
                    </ul>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Education & Certifications */}
        {(educations.length > 0 || certifications.length > 0) && (
          <div className="cv-section grid grid-cols-1 sm:grid-cols-2 gap-6 mb-6 font-sans">
            {educations.length > 0 && (
              <div className="cv-item">
                <h2 className="text-xs font-bold uppercase tracking-wider text-slate-900 border-b border-slate-300 pb-1 mb-2">
                  Formação Académica
                </h2>
                <div className="space-y-2.5">
                  {educations.map((edu) => (
                    <div key={edu.id} className="cv-education-item text-xs">
                      <p className="font-bold text-slate-900">{edu.degree}</p>
                      <p className="text-slate-600">
                        {edu.institution}{edu.location ? `, ${edu.location}` : ''} ({edu.completionYear})
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {certifications.length > 0 && (
              <div className="cv-item">
                <h2 className="text-xs font-bold uppercase tracking-wider text-slate-900 border-b border-slate-300 pb-1 mb-2">
                  Certificações & Cursos
                </h2>
                <div className="space-y-2.5">
                  {certifications.map((cert) => (
                    <div key={cert.id} className="text-xs">
                      <p className="font-bold text-slate-900">{cert.name}</p>
                      <p className="text-slate-600">{cert.institution} ({cert.year})</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Skills & Languages */}
        {(skills.length > 0 || languages.length > 0) && (
          <div className="cv-section grid grid-cols-1 sm:grid-cols-2 gap-6 font-sans border-t border-slate-300 pt-4 mb-6">
            {skills.length > 0 && (
              <div className="cv-item">
                <h2 className="text-xs font-bold uppercase tracking-wider text-slate-900 mb-2">
                  Competências
                </h2>
                <div className="flex flex-wrap gap-1.5">
                  {skills.map((s) => (
                    <span key={s.id} className="text-xs bg-slate-100 px-2 py-0.5 rounded text-slate-700 font-medium border border-slate-200">
                      {s.name}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {languages.length > 0 && (
              <div className="cv-item">
                <h2 className="text-xs font-bold uppercase tracking-wider text-slate-900 mb-2">
                  Idiomas
                </h2>
                <div className="space-y-1 text-xs text-slate-700">
                  {languages.map((l) => (
                    <div key={l.id} className="flex justify-between">
                      <span className="font-medium">{l.language}</span>
                      <span className="text-slate-500">{l.proficiency}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* References */}
        {references && references.length > 0 && (
          <div className="cv-section font-sans border-t border-slate-300 pt-4">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-900 mb-2">
              Referências Profissionais
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {references.map((ref) => (
                <div key={ref.id} className="cv-reference-item cv-item text-xs p-2.5 rounded bg-slate-50 border border-slate-200">
                  <p className="font-bold text-slate-900">{ref.name}</p>
                  <p className="text-slate-600">{ref.role} &bull; {ref.company}</p>
                  <p className="text-slate-500 font-mono text-[11px] mt-0.5">
                    {watermarkActive ? '+244 9•• ••• ••• (🔒)' : ref.phone}
                    {ref.relationship && ` (${ref.relationship})`}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }

  // =========================================================================
  // 2. TEMPLATE: CREATIVE TECH
  // =========================================================================
  if (activeTemplateId === 'creative-tech') {
    return (
      <div className="cv-document relative bg-slate-950 text-slate-100 p-8 sm:p-10 shadow-xl rounded-2xl font-sans min-h-[960px] border border-slate-800 overflow-hidden print:border-none print:shadow-none print:p-0">
        {watermarkActive && <WatermarkOverlay />}
        {watermarkActive && <LockedHeaderBanner dark />}

        {/* Header */}
        <div className="cv-header cv-section flex items-center gap-6 pb-6 border-b border-slate-800">
          {personalInfo.photoUrl && (
            <img
              src={personalInfo.photoUrl}
              alt={personalInfo.fullName || 'Foto de perfil'}
              referrerPolicy="no-referrer"
              className="w-20 h-20 rounded-2xl object-cover ring-2 ring-emerald-500/50 shadow-md flex-shrink-0"
            />
          )}
          <div className="flex-1 min-w-0">
            <h1 className="text-2xl font-bold tracking-tight text-white font-display">
              {personalInfo.fullName || 'Seu Nome Completo'}
            </h1>
            <p className="text-sm font-semibold text-emerald-400 mt-0.5">
              {personalInfo.professionalTitle || 'Título Profissional'}
            </p>
            <div className="flex items-center gap-4 text-xs text-slate-400 mt-2 flex-wrap font-mono">
              {displayPhone && <span className="flex items-center gap-1">{displayPhone}</span>}
              {displayEmail && (
                <>
                  <span>&bull;</span>
                  <span className="flex items-center gap-1">{displayEmail}</span>
                </>
              )}
              {personalInfo.location && (
                <>
                  <span>&bull;</span>
                  <span className="flex items-center gap-1">{personalInfo.location}</span>
                </>
              )}
              {personalInfo.linkedinUrl && (
                <>
                  <span>&bull;</span>
                  <span className="flex items-center gap-1">{personalInfo.linkedinUrl}</span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Two Columns */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
          {/* Main Area (2 cols) */}
          <div className="md:col-span-2 space-y-6">
            {personalInfo.professionalSummary && (
              <div className="cv-section">
                <h2 className="text-xs font-bold uppercase tracking-widest text-emerald-400 mb-2 font-mono">
                  // RESUMO PROFISSIONAL
                </h2>
                <p className="text-xs text-slate-300 leading-relaxed text-justify">
                  {personalInfo.professionalSummary}
                </p>
              </div>
            )}

            {experiences.length > 0 && (
              <div className="cv-section">
                <h2 className="text-xs font-bold uppercase tracking-widest text-emerald-400 mb-3 font-mono">
                  // EXPERIÊNCIA PROFISSIONAL
                </h2>
                <div className="space-y-4">
                  {experiences.map((exp) => (
                    <div key={exp.id} className="cv-experience-item cv-item border-l-2 border-emerald-500/60 pl-3">
                      <div className="flex justify-between text-xs">
                        <span className="font-bold text-white">{exp.role}</span>
                        <span className="text-slate-400 font-mono text-[11px]">
                          {exp.startDate} - {exp.isCurrent ? 'Act.' : exp.endDate}
                        </span>
                      </div>
                      <p className="text-[11px] text-emerald-300">{exp.company} {exp.location ? `• ${exp.location}` : ''}</p>
                      {exp.description && (
                        <p className="text-xs text-slate-300 mt-1">{exp.description}</p>
                      )}
                      {exp.highlights?.filter(Boolean).map((h, idx) => (
                        <p key={idx} className="text-xs text-slate-400 mt-0.5">&gt; {h}</p>
                      ))}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* References in Creative Tech */}
            {references && references.length > 0 && (
              <div className="cv-section">
                <h2 className="text-xs font-bold uppercase tracking-widest text-emerald-400 mb-3 font-mono">
                  // REFERÊNCIAS
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {references.map((ref) => (
                    <div key={ref.id} className="cv-reference-item cv-item bg-slate-900/60 p-2.5 rounded-lg border border-slate-800 text-xs">
                      <p className="font-bold text-white">{ref.name}</p>
                      <p className="text-slate-400 text-[11px]">{ref.role} &bull; {ref.company}</p>
                      <p className="text-emerald-400 font-mono text-[10.5px] mt-1">
                        {watermarkActive ? '+244 9•• ••• ••• (🔒)' : ref.phone}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Sidebar Area (1 col) */}
          <div className="space-y-6 md:border-l md:border-slate-800/80 md:pl-4">
            {skills.length > 0 && (
              <div className="cv-section cv-item">
                <h2 className="text-xs font-bold uppercase tracking-widest text-emerald-400 mb-2 font-mono">
                  // COMPETÊNCIAS
                </h2>
                <div className="flex flex-wrap gap-1.5">
                  {skills.map((s) => (
                    <span key={s.id} className="text-[11px] bg-slate-900 border border-slate-800 text-emerald-300 px-2 py-1 rounded-md">
                      {s.name}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {educations.length > 0 && (
              <div className="cv-section cv-item">
                <h2 className="text-xs font-bold uppercase tracking-widest text-emerald-400 mb-2 font-mono">
                  // FORMAÇÃO
                </h2>
                {educations.map((edu) => (
                  <div key={edu.id} className="cv-education-item text-xs mb-2">
                    <p className="font-bold text-white">{edu.degree}</p>
                    <p className="text-slate-400 text-[11px]">{edu.institution} ({edu.completionYear})</p>
                  </div>
                ))}
              </div>
            )}

            {certifications && certifications.length > 0 && (
              <div className="cv-section cv-item">
                <h2 className="text-xs font-bold uppercase tracking-widest text-emerald-400 mb-2 font-mono">
                  // CERTIFICAÇÕES
                </h2>
                {certifications.map((cert) => (
                  <div key={cert.id} className="text-xs mb-2">
                    <p className="font-bold text-white">{cert.name}</p>
                    <p className="text-slate-400 text-[11px]">{cert.institution} ({cert.year})</p>
                  </div>
                ))}
              </div>
            )}

            {languages.length > 0 && (
              <div className="cv-section cv-item">
                <h2 className="text-xs font-bold uppercase tracking-widest text-emerald-400 mb-2 font-mono">
                  // IDIOMAS
                </h2>
                {languages.map((l) => (
                  <div key={l.id} className="text-xs flex justify-between text-slate-300 mb-1">
                    <span>{l.language}</span>
                    <span className="text-slate-500 font-mono text-[11px]">{l.proficiency}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // =========================================================================
  // 3. TEMPLATE: CLASSIC SIMPLE (Column Clean)
  // =========================================================================
  if (activeTemplateId === 'classic-simple') {
    return (
      <div className="cv-document relative bg-white text-slate-900 p-8 sm:p-10 shadow-md rounded-2xl font-sans min-h-[960px] border border-slate-200 overflow-hidden print:border-none print:shadow-none print:p-0">
        {watermarkActive && <WatermarkOverlay />}
        {watermarkActive && <LockedHeaderBanner />}

        {/* Header */}
        <div className="cv-header cv-section pb-4 border-b-2 border-slate-800 mb-6">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 uppercase tracking-tight font-display">
                {personalInfo.fullName || 'Seu Nome Completo'}
              </h1>
              <p className="text-sm font-semibold text-slate-700 mt-0.5">
                {personalInfo.professionalTitle || 'Título Profissional'}
              </p>
            </div>
            {personalInfo.photoUrl && (
              <img
                src={personalInfo.photoUrl}
                alt={personalInfo.fullName || 'Foto de perfil'}
                referrerPolicy="no-referrer"
                className="w-20 h-20 rounded-xl object-cover border border-slate-300 shadow-xs"
              />
            )}
          </div>
          <div className="flex items-center gap-4 text-xs text-slate-600 mt-3 flex-wrap font-mono">
            {displayPhone && <span>{displayPhone}</span>}
            {displayEmail && (
              <>
                <span>&bull;</span>
                <span>{displayEmail}</span>
              </>
            )}
            {personalInfo.location && (
              <>
                <span>&bull;</span>
                <span>{personalInfo.location}</span>
              </>
            )}
            {personalInfo.linkedinUrl && (
              <>
                <span>&bull;</span>
                <span>{personalInfo.linkedinUrl}</span>
              </>
            )}
          </div>
        </div>

        {/* Profile */}
        {personalInfo.professionalSummary && (
          <div className="cv-section mb-6">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-900 border-b border-slate-200 pb-1 mb-2">
              Resumo Profissional
            </h2>
            <p className="text-xs text-slate-700 leading-relaxed text-justify">
              {personalInfo.professionalSummary}
            </p>
          </div>
        )}

        {/* Experience */}
        {experiences.length > 0 && (
          <div className="cv-section mb-6">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-900 border-b border-slate-200 pb-1 mb-3">
              Experiência Profissional
            </h2>
            <div className="space-y-4">
              {experiences.map((exp) => (
                <div key={exp.id} className="cv-experience-item cv-item">
                  <div className="flex justify-between items-baseline">
                    <h3 className="text-xs font-bold text-slate-900">{exp.role} — {exp.company}</h3>
                    <span className="text-[11px] text-slate-500 font-mono">
                      {exp.startDate} - {exp.isCurrent ? 'Presente' : exp.endDate}
                    </span>
                  </div>
                  {exp.location && <p className="text-[11px] text-slate-600 italic">{exp.location}</p>}
                  {exp.description && <p className="text-xs text-slate-700 mt-1">{exp.description}</p>}
                  {exp.highlights && exp.highlights.filter(Boolean).length > 0 && (
                    <div className="mt-1 space-y-0.5">
                      {exp.highlights.filter(Boolean).map((h, i) => (
                        <p key={i} className="text-xs text-slate-600 pl-2 border-l border-slate-300">&bull; {h}</p>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Education & Certifications */}
        {(educations.length > 0 || certifications.length > 0) && (
          <div className="cv-section grid grid-cols-1 sm:grid-cols-2 gap-6 mb-6">
            {educations.length > 0 && (
              <div className="cv-item">
                <h2 className="text-xs font-bold uppercase tracking-wider text-slate-900 border-b border-slate-200 pb-1 mb-2">
                  Formação Académica
                </h2>
                <div className="space-y-2">
                  {educations.map((edu) => (
                    <div key={edu.id} className="cv-education-item text-xs">
                      <p className="font-bold text-slate-900">{edu.degree}</p>
                      <p className="text-slate-600">{edu.institution}{edu.location ? `, ${edu.location}` : ''} ({edu.completionYear})</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {certifications && certifications.length > 0 && (
              <div className="cv-item">
                <h2 className="text-xs font-bold uppercase tracking-wider text-slate-900 border-b border-slate-200 pb-1 mb-2">
                  Certificações
                </h2>
                <div className="space-y-2">
                  {certifications.map((c) => (
                    <div key={c.id} className="text-xs">
                      <p className="font-bold text-slate-900">{c.name}</p>
                      <p className="text-slate-600">{c.institution} ({c.year})</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Skills & Languages */}
        {(skills.length > 0 || languages.length > 0) && (
          <div className="cv-section grid grid-cols-1 sm:grid-cols-2 gap-6 border-t border-slate-200 pt-4 mb-6">
            {skills.length > 0 && (
              <div className="cv-item">
                <h2 className="text-xs font-bold uppercase tracking-wider text-slate-900 mb-2">
                  Competências
                </h2>
                <div className="flex flex-wrap gap-1.5">
                  {skills.map((s) => (
                    <span key={s.id} className="text-[11px] bg-slate-100 text-slate-800 px-2 py-0.5 rounded font-medium border border-slate-200">
                      {s.name}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {languages.length > 0 && (
              <div className="cv-item">
                <h2 className="text-xs font-bold uppercase tracking-wider text-slate-900 mb-2">
                  Idiomas
                </h2>
                <div className="space-y-1 text-xs text-slate-700">
                  {languages.map((l) => (
                    <div key={l.id} className="flex justify-between">
                      <span className="font-medium">{l.language}</span>
                      <span className="text-slate-500 font-mono text-[11px]">{l.proficiency}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* References */}
        {references && references.length > 0 && (
          <div className="cv-section border-t border-slate-200 pt-4">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-900 mb-2">
              Referências Profissionais
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {references.map((ref) => (
                <div key={ref.id} className="cv-reference-item cv-item text-xs p-2 rounded bg-slate-50 border border-slate-200">
                  <p className="font-bold text-slate-900">{ref.name}</p>
                  <p className="text-slate-600">{ref.role} &bull; {ref.company}</p>
                  <p className="text-slate-500 font-mono text-[11px] mt-0.5">
                    {watermarkActive ? '+244 9•• ••• ••• (🔒)' : ref.phone}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }

  // =========================================================================
  // 4. DEFAULT: LUMINA MODERN TEMPLATE (2 Columns + Vibrant Brand Header)
  // =========================================================================
  return (
    <div className="cv-document relative bg-white text-slate-800 rounded-2xl shadow-xl font-sans min-h-[960px] overflow-hidden border border-slate-200 print:border-none print:shadow-none print:p-0">
      {watermarkActive && <WatermarkOverlay />}

      {/* Top Banner Header */}
      <div
        className="cv-header cv-section p-8 text-white flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 print:p-6"
        style={{ backgroundColor: activeColor }}
      >
        <div className="flex-1 min-w-0">
          <h1 className="text-2xl sm:text-3xl font-bold font-display tracking-tight text-white">
            {personalInfo.fullName || 'Seu Nome Completo'}
          </h1>
          <p className="text-sm font-medium text-white/90 mt-1">
            {personalInfo.professionalTitle || 'Título Profissional'}
          </p>

          <div className="flex items-center gap-4 text-xs text-white/85 mt-3 flex-wrap">
            {displayPhone && (
              <span className="flex items-center gap-1.5 font-mono">
                <Icon name="call" className="text-[16px]" />
                {displayPhone}
              </span>
            )}
            {displayEmail && (
              <span className="flex items-center gap-1.5 font-mono">
                <Icon name="mail" className="text-[16px]" />
                {displayEmail}
              </span>
            )}
            {personalInfo.location && (
              <span className="flex items-center gap-1.5">
                <Icon name="location_on" className="text-[16px]" />
                {personalInfo.location}
              </span>
            )}
            {personalInfo.linkedinUrl && (
              <span className="flex items-center gap-1.5 font-mono">
                <Icon name="link" className="text-[16px]" />
                {personalInfo.linkedinUrl}
              </span>
            )}
            {personalInfo.nationality && (
              <span className="flex items-center gap-1.5">
                <Icon name="flag" className="text-[16px]" />
                {personalInfo.nationality}
              </span>
            )}
          </div>
        </div>

        {personalInfo.photoUrl && (
          <div className="relative flex-shrink-0">
            <img
              src={personalInfo.photoUrl}
              alt={personalInfo.fullName || 'Foto de perfil'}
              referrerPolicy="no-referrer"
              className="w-24 h-24 rounded-2xl object-cover border-4 border-white/40 shadow-md"
            />
          </div>
        )}
      </div>

      {/* Lock Banner if watermarked */}
      {watermarkActive && <LockedHeaderBanner />}

      {/* Body: 2 Columns */}
      <div className="grid grid-cols-1 md:grid-cols-3 p-8 gap-8 print:p-6 print:gap-6">
        {/* Left Column (2 Cols) */}
        <div className="md:col-span-2 space-y-6">
          {/* Summary */}
          {personalInfo.professionalSummary && (
            <div className="cv-section">
              <div className="flex items-center gap-2 pb-1 mb-2 border-b-2" style={{ borderColor: activeColor }}>
                <Icon name="person" className="text-[18px]" style={{ color: activeColor }} />
                <h2 className="text-xs font-bold uppercase tracking-wider text-slate-900">
                  Resumo Profissional
                </h2>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed text-justify">
                {personalInfo.professionalSummary}
              </p>
            </div>
          )}

          {/* Experience */}
          {experiences.length > 0 && (
            <div className="cv-section">
              <div className="flex items-center gap-2 pb-1 mb-3 border-b-2" style={{ borderColor: activeColor }}>
                <Icon name="work" className="text-[18px]" style={{ color: activeColor }} />
                <h2 className="text-xs font-bold uppercase tracking-wider text-slate-900">
                  Experiência Profissional
                </h2>
              </div>

              <div className="space-y-4">
                {experiences.map((exp) => (
                  <div key={exp.id} className="cv-experience-item cv-item relative pl-4 border-l-2 border-slate-200">
                    <div
                      className="absolute -left-[5px] top-1.5 w-2 h-2 rounded-full"
                      style={{ backgroundColor: activeColor }}
                    ></div>
                    <div className="flex justify-between items-baseline">
                      <h3 className="text-xs font-bold text-slate-900">{exp.role}</h3>
                      <span className="text-[11px] font-medium text-slate-500">
                        {exp.startDate} - {exp.isCurrent ? 'Presente' : exp.endDate}
                      </span>
                    </div>
                    <p className="text-[11px] font-semibold" style={{ color: activeColor }}>
                      {exp.company} {exp.location ? `• ${exp.location}` : ''}
                    </p>
                    {exp.description && (
                      <p className="text-xs text-slate-600 mt-1">{exp.description}</p>
                    )}
                    {exp.highlights && exp.highlights.filter(Boolean).length > 0 && (
                      <ul className="list-disc list-inside text-xs text-slate-600 mt-1 space-y-0.5">
                        {exp.highlights.filter(Boolean).map((h, i) => (
                          <li key={i}>{h}</li>
                        ))}
                      </ul>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Education */}
          {educations.length > 0 && (
            <div className="cv-section">
              <div className="flex items-center gap-2 pb-1 mb-3 border-b-2" style={{ borderColor: activeColor }}>
                <Icon name="school" className="text-[18px]" style={{ color: activeColor }} />
                <h2 className="text-xs font-bold uppercase tracking-wider text-slate-900">
                  Formação Académica
                </h2>
              </div>
              <div className="space-y-3">
                {educations.map((edu) => (
                  <div key={edu.id} className="cv-education-item cv-item">
                    <p className="text-xs font-bold text-slate-900">{edu.degree}</p>
                    <p className="text-[11px] text-slate-600">
                      {edu.institution} {edu.location ? `• ${edu.location}` : ''} ({edu.completionYear})
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* References */}
          {references && references.length > 0 && (
            <div className="cv-section">
              <div className="flex items-center gap-2 pb-1 mb-3 border-b-2" style={{ borderColor: activeColor }}>
                <Icon name="badge" className="text-[18px]" style={{ color: activeColor }} />
                <h2 className="text-xs font-bold uppercase tracking-wider text-slate-900">
                  Referências Profissionais
                </h2>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {references.map((ref) => (
                  <div key={ref.id} className="cv-reference-item cv-item p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs">
                    <p className="font-bold text-slate-900">{ref.name}</p>
                    <p className="text-slate-600">{ref.role} &bull; {ref.company}</p>
                    <p className="font-mono text-[11px] text-primary mt-0.5">
                      {watermarkActive ? '+244 9•• ••• ••• (🔒)' : ref.phone}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right Column (1 Col) */}
        <div className="space-y-6 md:border-l md:border-slate-100 md:pl-6 print:pl-4">
          {/* Skills */}
          {skills.length > 0 && (
            <div className="cv-section cv-item">
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-900 pb-1 mb-2 border-b border-slate-200">
                Competências
              </h2>
              <div className="flex flex-wrap gap-1.5">
                {skills.map((s) => (
                  <span
                    key={s.id}
                    className="text-[11px] font-semibold px-2.5 py-1 rounded-md bg-slate-100 text-slate-700 border border-slate-200"
                  >
                    {s.name}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Languages */}
          {languages.length > 0 && (
            <div className="cv-section cv-item">
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-900 pb-1 mb-2 border-b border-slate-200">
                Idiomas
              </h2>
              <div className="space-y-2">
                {languages.map((l) => (
                  <div key={l.id} className="text-xs flex justify-between">
                    <span className="font-semibold text-slate-800">{l.language}</span>
                    <span className="text-slate-500 font-medium">{l.proficiency}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Certifications */}
          {certifications.length > 0 && (
            <div className="cv-section cv-item">
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-900 pb-1 mb-2 border-b border-slate-200">
                Certificações & Cursos
              </h2>
              <div className="space-y-2.5">
                {certifications.map((c) => (
                  <div key={c.id} className="text-xs">
                    <p className="font-bold text-slate-900">{c.name}</p>
                    <p className="text-slate-500 text-[11px]">{c.institution} ({c.year})</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Extra Info */}
          {personalInfo.driverLicense && (
            <div className="cv-section cv-item">
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-900 pb-1 mb-2 border-b border-slate-200">
                Carta de Condução
              </h2>
              <p className="text-xs text-slate-700">{personalInfo.driverLicense}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const LockedHeaderBanner: React.FC<{ dark?: boolean }> = ({ dark = false }) => {
  return (
    <div
      className={`py-2 px-4 text-center text-xs font-semibold flex items-center justify-center gap-2 border-y ${
        dark
          ? 'bg-amber-500/15 border-amber-500/30 text-amber-300'
          : 'bg-amber-50 border-amber-200 text-amber-800'
      }`}
    >
      <Icon name="lock" className="text-[16px] text-amber-600" />
      <span>
        <strong>Pré-visualização Parcial:</strong> Contactos omitidos e marca de água ativa até pagamento de 2.000 Kz.
      </span>
    </div>
  );
};

const WatermarkOverlay: React.FC = () => {
  return (
    <div className="absolute inset-0 pointer-events-none z-30 flex flex-col justify-around items-center opacity-[0.13] select-none rotate-[-26deg] overflow-hidden">
      <div className="space-y-16 text-center">
        <p className="text-3xl sm:text-4xl font-extrabold text-slate-900 uppercase tracking-widest">
          PRÉ-VISUALIZAÇÃO • PAGAMENTO PENDENTE
        </p>
        <p className="text-4xl sm:text-5xl font-black text-slate-900 uppercase tracking-widest">
          DESBLOQUEIE POR 2.000 KZ • CV IA ANGOLA
        </p>
        <p className="text-3xl sm:text-4xl font-extrabold text-slate-900 uppercase tracking-widest">
          MULTICAIXA XPRESS (923 845 779) • TRANSFERÊNCIA BAI
        </p>
        <p className="text-4xl sm:text-5xl font-black text-slate-900 uppercase tracking-widest">
          1 PAGAMENTO = 1 DOWNLOAD DE CV
        </p>
      </div>
    </div>
  );
};
