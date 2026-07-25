import React from 'react';
import { Role, User } from '../types';
import { USERS } from '../data/initialData';
import { Shield, User as UserIcon, CheckCircle, Settings, UserPlus } from 'lucide-react';
import { useLanguage } from '../i18n/LanguageContext';

interface RoleSwitcherProps {
  currentRole: Role;
  currentUser: User;
  users?: User[];
  onUserChange: (user: User) => void;
  onOpenPersonnelManager?: () => void;
}

export default function RoleSwitcher({ currentRole, currentUser, users = USERS, onUserChange, onOpenPersonnelManager }: RoleSwitcherProps) {
  const { t } = useLanguage();
  const [isOpen, setIsOpen] = React.useState(false);

  return (
    <div className="fixed bottom-6 right-6 z-40">
      <button
        id="btn-role-switcher-toggle"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 bg-slate-900 text-white px-4 py-3 rounded-full shadow-2xl hover:bg-slate-800 transition-all border border-slate-700 font-sans text-sm font-medium cursor-pointer"
      >
        <Shield className="w-4 h-4 text-emerald-400 animate-pulse" />
        <span>{t.roleLabel}: <strong className="text-emerald-400">{currentRole}</strong></span>
      </button>

      {isOpen && (
        <div
          id="role-switcher-dropdown"
          className="absolute bottom-16 right-0 w-80 bg-white border border-slate-200 rounded-2xl shadow-2xl p-4 animate-in fade-in slide-in-from-bottom-2 duration-200"
        >
          <div className="flex items-center justify-between border-b border-slate-100 pb-2 mb-3">
            <h3 className="font-sans font-semibold text-slate-800 text-sm flex items-center gap-2">
              <UserIcon className="w-4 h-4 text-slate-500" />
              {t.roleSimulator}
            </h3>
            {onOpenPersonnelManager && (
              <button
                onClick={() => {
                  setIsOpen(false);
                  onOpenPersonnelManager();
                }}
                title={t.editStaff}
                className="text-[11px] text-blue-600 hover:text-blue-800 font-bold font-sans flex items-center gap-1 hover:underline cursor-pointer"
              >
                <Settings className="w-3.5 h-3.5" />
                <span>{t.editStaff}</span>
              </button>
            )}
          </div>

          <p className="text-xs text-slate-500 mb-3 font-sans leading-relaxed">
            {t.roleDescription}
          </p>

          <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
            {users.map((user) => {
              const isActive = user.id === currentUser.id;
              return (
                <button
                  key={user.id}
                  id={`btn-role-select-${user.id}`}
                  onClick={() => {
                    onUserChange(user);
                    setIsOpen(false);
                  }}
                  className={`w-full flex items-center justify-between text-left p-2.5 rounded-xl transition-all border font-sans cursor-pointer ${
                    isActive
                      ? 'bg-blue-50/70 border-blue-200 hover:bg-blue-50'
                      : 'bg-slate-50 hover:bg-slate-100 border-transparent'
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <img
                      src={user.avatar}
                      alt={user.name}
                      className="w-8 h-8 rounded-full object-cover border border-slate-200 shrink-0"
                      referrerPolicy="no-referrer"
                    />
                    <div className="min-w-0">
                      <h4 className="text-xs font-semibold text-slate-800 truncate">{user.name}</h4>
                      <p className="text-[10px] text-slate-500 font-mono uppercase tracking-wider truncate">
                        {user.role} ({user.id === 'user-admin' ? t.allAccess : t.deptLimit})
                      </p>
                    </div>
                  </div>
                  {isActive && <CheckCircle className="w-4 h-4 text-blue-600 shrink-0 ml-1" />}
                </button>
              );
            })}
          </div>

          {onOpenPersonnelManager && (
            <button
              onClick={() => {
                setIsOpen(false);
                onOpenPersonnelManager();
              }}
              className="w-full mt-3 py-2 bg-blue-50 hover:bg-blue-100 border border-blue-200 text-blue-700 font-sans font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 transition-all cursor-pointer"
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>{t.editStaff}</span>
            </button>
          )}

          <div className="mt-2.5 pt-2 border-t border-slate-100 text-[11px] text-slate-400 font-sans">
            * <strong>Admin / Merchandising</strong>: {t.allAccess}.
            <br />* <strong>Others</strong>: {t.deptLimit}.
          </div>
        </div>
      )}
    </div>
  );
}

