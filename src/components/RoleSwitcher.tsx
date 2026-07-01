import React from 'react';
import { Role, User } from '../types';
import { USERS } from '../data/initialData';
import { Shield, User as UserIcon, CheckCircle } from 'lucide-react';

interface RoleSwitcherProps {
  currentRole: Role;
  currentUser: User;
  onUserChange: (user: User) => void;
}

export default function RoleSwitcher({ currentRole, currentUser, onUserChange }: RoleSwitcherProps) {
  const [isOpen, setIsOpen] = React.useState(false);

  return (
    <div className="fixed bottom-6 right-6 z-50">
      <button
        id="btn-role-switcher-toggle"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 bg-slate-900 text-white px-4 py-3 rounded-full shadow-2xl hover:bg-slate-800 transition-all border border-slate-700 font-sans text-sm font-medium"
      >
        <Shield className="w-4 h-4 text-emerald-400 animate-pulse" />
        <span>Vai trò: <strong className="text-emerald-400">{currentRole}</strong></span>
      </button>

      {isOpen && (
        <div
          id="role-switcher-dropdown"
          className="absolute bottom-16 right-0 w-80 bg-white border border-slate-200 rounded-2xl shadow-2xl p-4 animate-in fade-in slide-in-from-bottom-2 duration-200"
        >
          <h3 className="font-sans font-semibold text-slate-800 text-sm mb-3 flex items-center gap-2 border-b border-slate-100 pb-2">
            <UserIcon className="w-4 h-4 text-slate-500" />
            Giả lập Nhân sự (RBAC)
          </h3>
          <p className="text-xs text-slate-500 mb-4 font-sans leading-relaxed">
            Chọn một nhân sự dưới đây để thay đổi quyền hạn tương tác với các Giai đoạn (Stage) tương ứng theo Bộ phận.
          </p>

          <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
            {USERS.map((user) => {
              const isActive = user.id === currentUser.id;
              return (
                <button
                  key={user.id}
                  id={`btn-role-select-${user.id}`}
                  onClick={() => {
                    onUserChange(user);
                    setIsOpen(false);
                  }}
                  className={`w-full flex items-center justify-between text-left p-2.5 rounded-xl transition-all border font-sans ${
                    isActive
                      ? 'bg-blue-50/70 border-blue-200 hover:bg-blue-50'
                      : 'bg-slate-50 hover:bg-slate-100 border-transparent'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <img
                      src={user.avatar}
                      alt={user.name}
                      className="w-8 h-8 rounded-full object-cover border border-slate-200"
                      referrerPolicy="no-referrer"
                    />
                    <div>
                      <h4 className="text-xs font-semibold text-slate-800">{user.name}</h4>
                      <p className="text-[10px] text-slate-500 font-mono uppercase tracking-wider">
                        {user.role} ({user.id === 'user-admin' ? 'All Access' : 'Dept Limit'})
                      </p>
                    </div>
                  </div>
                  {isActive && <CheckCircle className="w-4 h-4 text-blue-600 shrink-0" />}
                </button>
              );
            })}
          </div>

          <div className="mt-3 pt-2.5 border-t border-slate-100 text-[11px] text-slate-400 font-sans">
            * <strong>Admin / Merchandising</strong>: Toàn quyền.
            <br />* <strong>Bộ phận khác</strong>: Chỉ sửa Stage được phân công.
          </div>
        </div>
      )}
    </div>
  );
}
