import React, { useState } from 'react';
import { AppUser, ReviewItem, Transaction } from '../../types';
import { sanitizeInput } from '../../utils/sanitize';

interface ReviewsViewProps {
  reviews: ReviewItem[];
  onAddReview: (review: ReviewItem) => void;
  currentUser: AppUser | null;
  transactions: Transaction[];
  onOpenAuth: () => void;
  onOpenBuilder: () => void;
  onToast: (msg: string) => void;
}

export const ReviewsView: React.FC<ReviewsViewProps> = ({
  reviews,
  onAddReview,
  currentUser,
  transactions,
  onOpenAuth,
  onOpenBuilder,
  onToast,
}) => {
  const [rating, setRating] = useState<number>(5);
  const [comment, setComment] = useState<string>('');
  const [userRole, setUserRole] = useState<string>('');
  const [selectedTemplate, setSelectedTemplate] = useState<string>('Lumina Modern');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [showSuccessBadge, setShowSuccessBadge] = useState<boolean>(false);

  // Check if current user has an approved transaction (verified buyer)
  const isVerifiedBuyer = Boolean(
    currentUser &&
      transactions.some(
        (t) =>
          (t.userId === currentUser.id ||
            t.userEmail?.toLowerCase() === currentUser.email?.toLowerCase()) &&
          (t.status === 'Concluído' || (t.status as any) === 'Aprovado')
      )
  );

  // Calculate average rating
  const averageRating =
    reviews.length > 0
      ? (reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length).toFixed(1)
      : '5.0';

  const handleSubmitReview = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) {
      onOpenAuth();
      return;
    }

    if (!isVerifiedBuyer) {
      onToast('Apenas clientes com pagamento validado podem publicar avaliações.');
      return;
    }

    const cleanComment = sanitizeInput(comment.trim());
    if (!cleanComment) {
      onToast('Por favor, escreva um pequeno comentário sobre a sua experiência.');
      return;
    }

    setIsSubmitting(true);

    const newReview: ReviewItem = {
      id: `rev-${Date.now()}`,
      userId: currentUser.id,
      userName: currentUser.name,
      userRole: sanitizeInput(userRole.trim()) || 'Profissional em Angola',
      userAvatar: currentUser.avatarUrl,
      rating,
      comment: cleanComment,
      date: 'Agora mesmo',
      isVerifiedBuyer: true,
      templateName: selectedTemplate,
    };

    setTimeout(() => {
      onAddReview(newReview);
      setComment('');
      setUserRole('');
      setIsSubmitting(false);
      setShowSuccessBadge(true);
      onToast('Avaliação publicada com sucesso! Obrigado pelo seu feedback.');
      setTimeout(() => setShowSuccessBadge(false), 4000);
    }, 600);
  };

  return (
    <div className="w-full max-w-6xl mx-auto px-4 sm:px-6 py-8 sm:py-12 space-y-12">
      {/* Header Banner */}
      <div className="text-center space-y-4 max-w-2xl mx-auto">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-800 text-xs font-bold">
          <span className="material-symbols-outlined text-[16px] text-amber-600" style={{ fontVariationSettings: "'FILL' 1" }}>
            grade
          </span>
          Opiniões Verificadas de Candidatos em Angola
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-on-surface tracking-tight font-display">
          Avaliações & Experiências Reais
        </h1>
        <p className="text-sm sm:text-base text-on-surface-variant leading-relaxed">
          Veja como milhares de profissionais conseguiram entrevistas e empregos em Luanda e em todo o país com o CV IA Angola.
        </p>

        {/* Global Rating Stats Card */}
        <div className="inline-flex flex-wrap items-center justify-center gap-6 p-4 sm:p-6 rounded-2xl bg-surface-container-lowest border border-surface-border shadow-xs mt-4">
          <div className="flex items-center gap-3">
            <span className="text-4xl font-black text-on-surface">{averageRating}</span>
            <div className="flex flex-col items-start">
              <div className="flex text-amber-500">
                {[1, 2, 3, 4, 5].map((star) => (
                  <span
                    key={star}
                    className="material-symbols-outlined text-[20px]"
                    style={{ fontVariationSettings: "'FILL' 1" }}
                  >
                    star
                  </span>
                ))}
              </div>
              <span className="text-xs text-on-surface-variant font-medium">
                Média Geral ({reviews.length} avaliações)
              </span>
            </div>
          </div>
          <div className="h-8 w-px bg-surface-border hidden sm:block"></div>
          <div className="flex items-center gap-2 text-emerald-700 text-xs font-semibold">
            <span className="material-symbols-outlined text-[18px]">verified</span>
            100% Clientes com Pagamento Confirmado
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Form to leave review */}
        <div className="lg:col-span-5 bg-surface-container-lowest p-6 sm:p-8 rounded-2xl border border-surface-border shadow-sm space-y-6">
          <div className="border-b border-surface-border pb-4">
            <h2 className="text-lg font-bold text-on-surface flex items-center gap-2">
              <span className="material-symbols-outlined text-primary text-[20px]">rate_review</span>
              Deixar uma Avaliação
            </h2>
            <p className="text-xs text-on-surface-variant mt-1">
              Partilhe a sua experiência com a criação do currículo e o processo de download.
            </p>
          </div>

          {!currentUser ? (
            <div className="p-5 rounded-xl bg-surface border border-surface-border text-center space-y-3">
              <span className="material-symbols-outlined text-3xl text-on-surface-variant">lock</span>
              <p className="text-xs text-on-surface-variant">
                Inicie sessão na sua conta para avaliar a plataforma após a aprovação do seu currículo.
              </p>
              <button
                type="button"
                onClick={onOpenAuth}
                className="w-full py-2.5 px-4 rounded-xl bg-primary text-white text-xs font-bold hover:bg-primary-hover transition-colors"
              >
                Entrar na Conta
              </button>
            </div>
          ) : !isVerifiedBuyer ? (
            <div className="p-5 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 space-y-3 text-center">
              <span className="material-symbols-outlined text-3xl text-amber-600">verified_user</span>
              <div className="space-y-1">
                <p className="text-xs font-bold">Apenas Compradores Verificados</p>
                <p className="text-[11px] text-amber-800 leading-relaxed">
                  Para garantir a máxima autenticidade, apenas utilizadores que completaram o download de um currículo (2.000 Kz) podem submeter uma avaliação pública.
                </p>
              </div>
              <button
                type="button"
                onClick={onOpenBuilder}
                className="w-full py-2.5 px-4 rounded-xl bg-amber-600 text-white text-xs font-bold hover:bg-amber-700 transition-colors"
              >
                Criar e Desbloquear o Meu CV (2.000 Kz)
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmitReview} className="space-y-4">
              {showSuccessBadge && (
                <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-medium flex items-center gap-2">
                  <span className="material-symbols-outlined text-emerald-600 text-[18px]">check_circle</span>
                  Avaliação registada com sucesso!
                </div>
              )}

              {/* Star Rating Selector */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-on-surface">Classificação Geral</label>
                <div className="flex items-center gap-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setRating(star)}
                      className="p-1 text-amber-400 hover:text-amber-500 transition-colors focus:outline-none"
                    >
                      <span
                        className="material-symbols-outlined text-[28px]"
                        style={{ fontVariationSettings: star <= rating ? "'FILL' 1" : "'FILL' 0" }}
                      >
                        star
                      </span>
                    </button>
                  ))}
                  <span className="text-xs font-bold text-on-surface ml-2">
                    {rating === 5 ? 'Excelente (5/5)' : `${rating}/5 Estrelas`}
                  </span>
                </div>
              </div>

              {/* Profession / Role */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-on-surface">
                  A sua Profissão / Área de Atuação
                </label>
                <input
                  type="text"
                  value={userRole}
                  onChange={(e) => setUserRole(e.target.value)}
                  placeholder="Ex: Engenheiro Informático, Contabilista, Enfermeira..."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-surface-border bg-surface text-on-surface text-xs focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
                />
              </div>

              {/* Template Used */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-on-surface">Modelo de CV Escolhido</label>
                <select
                  value={selectedTemplate}
                  onChange={(e) => setSelectedTemplate(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-surface-border bg-surface text-on-surface text-xs focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
                >
                  <option value="Classic Simple">Classic Simple</option>
                  <option value="Creative Tech">Creative Tech</option>
                  <option value="Executive Classic">Executive Classic</option>
                  <option value="Lumina Modern">Lumina Modern</option>
                </select>
              </div>

              {/* Comment */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-on-surface">O seu Comentário</label>
                <textarea
                  rows={4}
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="Conte o que achou da rapidez do download, das sugestões da IA e da qualidade visual do PDF..."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-surface-border bg-surface text-on-surface text-xs focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none resize-none"
                />
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3 px-4 rounded-xl bg-primary text-white text-xs font-bold hover:bg-primary-hover transition-colors shadow-xs flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {isSubmitting ? (
                  <>
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                    A publicar...
                  </>
                ) : (
                  <>
                    <span className="material-symbols-outlined text-[18px]">send</span>
                    Publicar Avaliação Verificada
                  </>
                )}
              </button>
            </form>
          )}
        </div>

        {/* Right Column: List of Reviews */}
        <div className="lg:col-span-7 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-on-surface">
              Avaliações Recentes ({reviews.length})
            </h3>
            <span className="text-xs text-on-surface-variant">Ordenadas por data</span>
          </div>

          <div className="grid grid-cols-1 gap-4">
            {reviews.map((rev) => (
              <div
                key={rev.id}
                className="bg-surface-container-lowest p-5 rounded-2xl border border-surface-border shadow-xs hover:border-primary/30 transition-all space-y-3"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    {rev.userAvatar ? (
                      <img
                        src={rev.userAvatar}
                        alt={rev.userName}
                        className="w-10 h-10 rounded-full object-cover border border-surface-border"
                        loading="lazy"
                        decoding="async"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-primary/10 text-primary font-bold text-sm flex items-center justify-center">
                        {rev.userName.slice(0, 2).toUpperCase()}
                      </div>
                    )}
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-bold text-on-surface">{rev.userName}</span>
                        {rev.isVerifiedBuyer && (
                          <span
                            className="material-symbols-outlined text-[16px] text-emerald-600"
                            title="Comprador Verificado"
                          >
                            verified
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-on-surface-variant">
                        {rev.userRole || 'Profissional'} • {rev.templateName || 'Modelo Oficial'}
                      </p>
                    </div>
                  </div>
                  <span className="text-[11px] text-on-surface-variant whitespace-nowrap">{rev.date}</span>
                </div>

                {/* Stars */}
                <div className="flex items-center gap-1 text-amber-500">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <span
                      key={star}
                      className="material-symbols-outlined text-[16px]"
                      style={{ fontVariationSettings: star <= rev.rating ? "'FILL' 1" : "'FILL' 0" }}
                    >
                      star
                    </span>
                  ))}
                </div>

                {/* Comment Text */}
                <p className="text-xs text-on-surface leading-relaxed text-balance">
                  "{rev.comment}"
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
