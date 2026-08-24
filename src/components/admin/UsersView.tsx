import React, { useState } from 'react';
import { AppUser } from '../../types';

interface UsersViewProps {
  users: AppUser[];
  onToggleUserStatus: (id: string) => void;
  onAddUser: (user: Omit<AppUser, 'id'>) => void;
}

export const UsersView: React.FC<UsersViewProps> = ({
  users,
  onToggleUserStatus,
  onAddUser,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'Todos' | 'Ativo' | 'Suspenso'>('Todos');
  const [dateFilter, setDateFilter] = useState('Todos');
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<AppUser | null>(null);

  // New user form state
  const [newName, setNewName] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newPhone, setNewPhone] = useState('+244 9');

  const filteredUsers = users.filter((u) => {
    const matchesSearch =
      u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.phone.includes(searchTerm);
    const matchesStatus = statusFilter === 'Todos' || u.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleCreateUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim() || !newEmail.trim()) return;

    const initials = newName
      .split(' ')
      .map((n) => n[0])
      .join('')
      .slice(0, 2)
      .toUpperCase();

    onAddUser({
      name: newName,
      email: newEmail,
      phone: newPhone,
      initials: initials || 'US',
      registrationDate: 'Hoje',
      cvsGenerated: 0,
      status: 'Ativo',
    });

    setNewName('');
    setNewEmail('');
    setNewPhone('+244 9');
    setShowAddModal(false);
  };

  return (
    <div className="flex flex-col w-full max-w-[1240px] mx-auto p-8 gap-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-bold text-on-surface tracking-tight">
            Gestão de Utilizadores
          </h1>
          <p className="text-on-surface-variant text-sm mt-1">
            Total de {users.length} utilizadores registados na plataforma.
          </p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="bg-primary text-white px-5 py-2.5 rounded-xl font-semibold text-xs flex items-center gap-2 shadow-sm hover:shadow-md hover:bg-primary/95 transition-all self-start md:self-auto"
        >
          <span className="material-symbols-outlined text-[18px]">person_add</span>
          Adicionar Utilizador
        </button>
      </div>

      {/* Filters Bar */}
      <div className="bg-surface-container-lowest p-4 rounded-2xl shadow-sm border border-surface-border/40 flex flex-col md:flex-row gap-4 items-stretch md:items-center justify-between">
        {/* Search */}
        <div className="relative flex-1 min-w-[240px]">
          <span className="absolute inset-y-0 left-3 flex items-center text-on-surface-variant">
            <span className="material-symbols-outlined text-[20px]">search</span>
          </span>
          <input
            type="text"
            placeholder="Buscar por nome, e-mail ou telefone..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-surface-container-low border-none rounded-xl py-2 pl-10 pr-4 text-xs focus:ring-2 focus:ring-primary/20 outline-none"
          />
        </div>

        {/* Date Filter */}
        <div className="flex items-center gap-3">
          <select
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
            className="bg-surface-container-low border-none rounded-xl py-2 px-3 text-xs font-semibold text-on-surface outline-none cursor-pointer"
          >
            <option value="Todos">Data de Registo: Todos</option>
            <option value="Hoje">Hoje</option>
            <option value="7d">Últimos 7 dias</option>
            <option value="30d">Este Mês</option>
          </select>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="bg-surface-container-low border-none rounded-xl py-2 px-3 text-xs font-semibold text-on-surface outline-none cursor-pointer"
          >
            <option value="Todos">Todos os Estados</option>
            <option value="Ativo">Apenas Ativos</option>
            <option value="Suspenso">Apenas Suspensos</option>
          </select>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-surface-container-lowest rounded-2xl shadow-sm overflow-hidden flex flex-col border border-surface-border/40">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-surface-container-low/50">
                <th className="py-4 px-6 text-xs font-semibold text-on-surface-variant uppercase tracking-wider">
                  Utilizador
                </th>
                <th className="py-4 px-6 text-xs font-semibold text-on-surface-variant uppercase tracking-wider">
                  Contacto
                </th>
                <th className="py-4 px-6 text-xs font-semibold text-on-surface-variant uppercase tracking-wider">
                  Data de Registo
                </th>
                <th className="py-4 px-6 text-xs font-semibold text-on-surface-variant uppercase tracking-wider text-center">
                  CVs Gerados
                </th>
                <th className="py-4 px-6 text-xs font-semibold text-on-surface-variant uppercase tracking-wider">
                  Estado
                </th>
                <th className="py-4 px-6 text-xs font-semibold text-on-surface-variant uppercase tracking-wider text-right">
                  Ações
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-border/40">
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-on-surface-variant text-sm">
                    Nenhum utilizador encontrado para os filtros selecionados.
                  </td>
                </tr>
              ) : (
                filteredUsers.map((u) => (
                  <tr
                    key={u.id}
                    className="hover:bg-surface-container-low/30 transition-colors group cursor-pointer"
                  >
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-3">
                        {u.avatarUrl ? (
                          <img
                            src={u.avatarUrl}
                            alt={u.name}
                            className="w-10 h-10 rounded-full object-cover border border-surface-border"
                          />
                        ) : (
                          <div className="w-10 h-10 rounded-full bg-primary-container text-white flex items-center justify-center font-bold text-xs shadow-xs">
                            {u.initials}
                          </div>
                        )}
                        <div>
                          <p className="text-sm font-semibold text-on-surface">
                            {u.name}
                          </p>
                          <p className="text-xs text-on-surface-variant">
                            {u.email}
                          </p>
                        </div>
                      </div>
                    </td>

                    <td className="py-4 px-6 text-xs text-on-surface font-medium">
                      {u.phone}
                    </td>

                    <td className="py-4 px-6 text-xs text-on-surface-variant">
                      {u.registrationDate}
                    </td>

                    <td className="py-4 px-6 text-center">
                      <span className="inline-flex items-center justify-center px-2.5 py-1 rounded-full bg-surface-container text-xs font-bold text-on-surface">
                        {u.cvsGenerated}
                      </span>
                    </td>

                    <td className="py-4 px-6">
                      {u.status === 'Ativo' ? (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-success-green/10 text-success-green text-xs font-semibold">
                          <span className="w-1.5 h-1.5 rounded-full bg-success-green"></span>
                          Ativo
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-error-container text-on-error-container text-xs font-semibold">
                          <span className="w-1.5 h-1.5 rounded-full bg-error"></span>
                          Suspenso
                        </span>
                      )}
                    </td>

                    <td className="py-4 px-6 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => setSelectedUser(u)}
                          className="p-1.5 rounded-lg text-on-surface-variant hover:text-primary hover:bg-surface-container-high transition-all"
                          title="Ver detalhes"
                        >
                          <span className="material-symbols-outlined text-[18px]">
                            visibility
                          </span>
                        </button>
                        <button
                          onClick={() => onToggleUserStatus(u.id)}
                          className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                            u.status === 'Ativo'
                              ? 'text-error hover:bg-error/10'
                              : 'text-success-green hover:bg-success-green/10'
                          }`}
                        >
                          {u.status === 'Ativo' ? 'Suspender' : 'Ativar'}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="p-4 border-t border-surface-border flex items-center justify-between text-xs text-on-surface-variant">
          <span>Mostrando {filteredUsers.length} de {users.length} utilizadores</span>
          <div className="flex items-center gap-1">
            <button className="px-3 py-1.5 rounded-lg border border-surface-border hover:bg-surface-container-low font-semibold">
              Anterior
            </button>
            <button className="px-3 py-1.5 rounded-lg bg-primary text-white font-semibold">
              1
            </button>
            <button className="px-3 py-1.5 rounded-lg border border-surface-border hover:bg-surface-container-low">
              2
            </button>
            <button className="px-3 py-1.5 rounded-lg border border-surface-border hover:bg-surface-container-low font-semibold">
              Seguinte
            </button>
          </div>
        </div>
      </div>

      {/* Add User Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-on-surface/50 backdrop-blur-xs">
          <div className="bg-surface-container-lowest rounded-2xl max-w-md w-full p-6 shadow-2xl border border-surface-border animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-surface-border pb-4">
              <h3 className="font-display text-lg font-bold text-on-surface">
                Adicionar Novo Utilizador
              </h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-on-surface-variant hover:text-on-surface p-1 rounded-lg"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <form onSubmit={handleCreateUser} className="py-4 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-on-surface mb-1">
                  Nome Completo
                </label>
                <input
                  type="text"
                  required
                  placeholder="ex: Manuel António Gonçalves"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="w-full bg-surface-container-low border-none rounded-xl p-3 text-xs focus:ring-2 focus:ring-primary/20 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-on-surface mb-1">
                  E-mail Profissional
                </label>
                <input
                  type="email"
                  required
                  placeholder="ex: manuel.goncalves@email.com"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  className="w-full bg-surface-container-low border-none rounded-xl p-3 text-xs focus:ring-2 focus:ring-primary/20 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-on-surface mb-1">
                  Telefone Angola (+244)
                </label>
                <input
                  type="text"
                  placeholder="+244 923 000 000"
                  value={newPhone}
                  onChange={(e) => setNewPhone(e.target.value)}
                  className="w-full bg-surface-container-low border-none rounded-xl p-3 text-xs focus:ring-2 focus:ring-primary/20 outline-none"
                />
              </div>

              <div className="flex gap-3 pt-4 border-t border-surface-border">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 px-4 py-2.5 rounded-xl border border-surface-border text-on-surface-variant font-semibold text-xs hover:bg-surface-container-low"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2.5 rounded-xl bg-primary text-white font-semibold text-xs hover:bg-primary/90 shadow-md"
                >
                  Criar Utilizador
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* User Details Modal */}
      {selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-on-surface/50 backdrop-blur-xs">
          <div className="bg-surface-container-lowest rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-surface-border">
            <div className="flex items-center justify-between border-b border-surface-border pb-4">
              <div className="flex items-center gap-3">
                {selectedUser.avatarUrl ? (
                  <img
                    src={selectedUser.avatarUrl}
                    alt={selectedUser.name}
                    className="w-12 h-12 rounded-full object-cover border border-surface-border"
                  />
                ) : (
                  <div className="w-12 h-12 rounded-full bg-primary text-white flex items-center justify-center font-bold text-sm">
                    {selectedUser.initials}
                  </div>
                )}
                <div>
                  <h3 className="font-display text-lg font-bold text-on-surface">
                    {selectedUser.name}
                  </h3>
                  <p className="text-xs text-on-surface-variant">
                    {selectedUser.email}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedUser(null)}
                className="text-on-surface-variant hover:text-on-surface p-1 rounded-lg"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <div className="py-4 space-y-3 text-xs">
              <div className="flex justify-between py-2 border-b border-surface-border/40">
                <span className="text-on-surface-variant">Telefone:</span>
                <span className="font-semibold text-on-surface">{selectedUser.phone}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-surface-border/40">
                <span className="text-on-surface-variant">Data de Criação da Conta:</span>
                <span className="font-semibold text-on-surface">{selectedUser.registrationDate}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-surface-border/40">
                <span className="text-on-surface-variant">Total de CVs Criados:</span>
                <span className="font-semibold text-primary">{selectedUser.cvsGenerated} currículos</span>
              </div>
              <div className="flex justify-between py-2 border-b border-surface-border/40">
                <span className="text-on-surface-variant">Estado da Conta:</span>
                <span className={`font-bold ${selectedUser.status === 'Ativo' ? 'text-success-green' : 'text-error'}`}>
                  {selectedUser.status}
                </span>
              </div>
            </div>

            <div className="flex gap-3 pt-4 border-t border-surface-border">
              <button
                onClick={() => setSelectedUser(null)}
                className="w-full px-4 py-2.5 rounded-xl bg-surface-container-high text-on-surface font-semibold text-xs hover:bg-surface-container"
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
