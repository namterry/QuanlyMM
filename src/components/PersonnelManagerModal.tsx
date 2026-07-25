import React from 'react';
import { User, Role, Department } from '../types';
import { DEPARTMENTS } from '../data/initialData';
import { UserCheck, Shield, Plus, Pencil, Trash2, Camera, Upload, AlertTriangle, RefreshCw, Check, X, Image as ImageIcon } from 'lucide-react';
import { useLanguage } from '../i18n/LanguageContext';

interface PersonnelManagerModalProps {
  users: User[];
  currentUser: User;
  onClose: () => void;
  onUpdateUser: (userId: string, updatedFields: Partial<User>) => void;
  onAddUser: (newUser: Omit<User, 'id'>) => void;
  onDeleteUser: (userId: string) => void;
  onResetUsers?: () => void;
}

const PRESET_AVATARS = [
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=150&auto=format&fit=crop&q=80',
];

const PRESET_ROLES: { key: Role; label: string }[] = [
  { key: 'Admin', label: 'Admin (Quản trị viên)' },
  { key: 'Merchandising', label: 'Merchandising (Theo dõi đơn hàng)' },
  { key: 'Pattern', label: 'Pattern (Kỹ thuật Rập mẫu)' },
  { key: 'Sample Room', label: 'Sample Room (Tổ may mẫu)' },
  { key: 'CAD', label: 'CAD (Thiết kế sơ đồ CAD)' },
  { key: 'IE', label: 'IE (Kỹ thuật công nghệ)' },
  { key: 'QA', label: 'QA (Kiểm soát chất lượng)' },
];

export default function PersonnelManagerModal({
  users,
  currentUser,
  onClose,
  onUpdateUser,
  onAddUser,
  onDeleteUser,
  onResetUsers,
}: PersonnelManagerModalProps) {
  const { t } = useLanguage();
  const [editingUser, setEditingUser] = React.useState<User | null>(null);
  const [deletingUser, setDeletingUser] = React.useState<User | null>(null);
  const [showAddForm, setShowAddForm] = React.useState(false);

  // Edit form state
  const [editName, setEditName] = React.useState('');
  const [editRole, setEditRole] = React.useState<Role>('Merchandising');
  const [editDeptId, setEditDeptId] = React.useState('dept-mr');
  const [editEmail, setEditEmail] = React.useState('');
  const [editAvatar, setEditAvatar] = React.useState('');

  // Add form state
  const [newName, setNewName] = React.useState('');
  const [newRole, setNewRole] = React.useState<Role>('Merchandising');
  const [newDeptId, setNewDeptId] = React.useState('dept-mr');
  const [newEmail, setNewEmail] = React.useState('');
  const [newAvatar, setNewAvatar] = React.useState(PRESET_AVATARS[0]);

  // Open Edit User
  const handleStartEdit = (user: User) => {
    setEditingUser(user);
    setEditName(user.name);
    setEditRole(user.role);
    setEditDeptId(user.departmentId || 'dept-mr');
    setEditEmail(user.email || '');
    setEditAvatar(user.avatar || PRESET_AVATARS[0]);
  };

  // Save Edit
  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;

    onUpdateUser(editingUser.id, {
      name: editName.trim(),
      role: editRole,
      departmentId: editDeptId,
      email: editEmail.trim(),
      avatar: editAvatar.trim() || PRESET_AVATARS[0],
    });

    setEditingUser(null);
  };

  // Handle image upload from file system (data URL)
  const handleImageFileUpload = (e: React.ChangeEvent<HTMLInputElement>, isEditMode: boolean) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result as string;
      if (result) {
        if (isEditMode) {
          setEditAvatar(result);
        } else {
          setNewAvatar(result);
        }
      }
    };
    reader.readAsDataURL(file);
  };

  // Add New User Submit
  const handleSaveNew = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;

    onAddUser({
      name: newName.trim(),
      role: newRole,
      departmentId: newDeptId,
      email: newEmail.trim() || `${newName.toLowerCase().replace(/\s+/g, '.')}@garment.com`,
      avatar: newAvatar || PRESET_AVATARS[0],
    });

    setNewName('');
    setNewEmail('');
    setShowAddForm(false);
  };

  return (
    <div className="fixed inset-0 bg-slate-900/70 flex items-center justify-center p-4 z-50 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] flex flex-col border border-slate-100 overflow-hidden">
        {/* Modal Header */}
        <div className="p-5 border-b border-slate-100 bg-slate-50/70 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center font-bold">
              <UserCheck className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-sans font-bold text-slate-900 text-lg">{t.personnelManagerTitle}</h2>
              <p className="text-xs text-slate-500 font-sans">
                {t.personnelManagerSubtitle}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 font-bold p-1 rounded-lg hover:bg-slate-200/60 transition-all cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          {/* Action Toolbar */}
          <div className="flex items-center justify-between gap-3 bg-blue-50/50 p-3.5 rounded-xl border border-blue-100">
            <div className="text-xs text-slate-700 font-sans font-medium">
              {t.totalPersonnel}: <strong className="text-blue-700">{users.length}</strong>
            </div>
            <div className="flex items-center gap-2">
              {onResetUsers && (
                <button
                  onClick={onResetUsers}
                  title={t.resetDefault}
                  className="px-3 py-1.5 border border-slate-200 text-slate-600 hover:bg-white text-xs font-semibold rounded-lg font-sans flex items-center gap-1.5 transition-all cursor-pointer"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>{t.resetDefault}</span>
                </button>
              )}
              <button
                onClick={() => setShowAddForm(!showAddForm)}
                className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg font-sans flex items-center gap-1.5 transition-all shadow-sm cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>+ {t.addNewPersonnel}</span>
              </button>
            </div>
          </div>

          {/* Add New Personnel Form */}
          {showAddForm && (
            <form onSubmit={handleSaveNew} className="bg-slate-50 border border-slate-200 rounded-2xl p-5 space-y-4 animate-in slide-in-from-top-2 duration-200">
              <h3 className="font-sans font-bold text-slate-900 text-sm flex items-center gap-2 border-b border-slate-200 pb-2">
                <Plus className="w-4 h-4 text-blue-600" />
                Tạo hồ sơ nhân sự mới
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700 font-sans">Họ và Tên *</label>
                  <input
                    type="text"
                    required
                    placeholder="VD: Nguyễn Thị Lan"
                    value={newName}
                    onChange={e => setNewName(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 font-sans focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700 font-sans">Vị trí / Chức danh (Role) *</label>
                  <select
                    value={newRole}
                    onChange={e => setNewRole(e.target.value as Role)}
                    className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 font-sans focus:ring-2 focus:ring-blue-500"
                  >
                    {PRESET_ROLES.map(r => (
                      <option key={r.key} value={r.key}>{r.label}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700 font-sans">Phòng ban</label>
                  <select
                    value={newDeptId}
                    onChange={e => setNewDeptId(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 font-sans focus:ring-2 focus:ring-blue-500"
                  >
                    {DEPARTMENTS.map(d => (
                      <option key={d.id} value={d.id}>{d.name}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700 font-sans">Email liên hệ</label>
                  <input
                    type="email"
                    placeholder="lan.nguyen@garment.com"
                    value={newEmail}
                    onChange={e => setNewEmail(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 font-sans focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              {/* Avatar selection for new user */}
              <div className="space-y-2 pt-2 border-t border-slate-200">
                <label className="text-xs font-bold text-slate-800 font-sans flex items-center justify-between">
                  <span>Ảnh đại diện mặc định</span>
                  <label className="text-[11px] text-blue-600 hover:underline cursor-pointer flex items-center gap-1">
                    <Upload className="w-3 h-3" />
                    <span>Tải ảnh từ máy</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={e => handleImageFileUpload(e, false)}
                      className="hidden"
                    />
                  </label>
                </label>

                <div className="flex items-center gap-3">
                  <img
                    src={newAvatar}
                    alt="Preview"
                    className="w-12 h-12 rounded-full object-cover border-2 border-blue-500 shadow-sm shrink-0"
                  />
                  <div className="flex-1 space-y-1">
                    <p className="text-[10px] text-slate-500 font-sans">Chọn mẫu ảnh sẵn có bên dưới hoặc dán URL ảnh:</p>
                    <input
                      type="text"
                      placeholder="https://..."
                      value={newAvatar}
                      onChange={e => setNewAvatar(e.target.value)}
                      className="w-full bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-xs text-slate-800 font-sans"
                    />
                  </div>
                </div>

                <div className="flex flex-wrap gap-2 pt-1">
                  {PRESET_AVATARS.map((url, idx) => (
                    <button
                      type="button"
                      key={idx}
                      onClick={() => setNewAvatar(url)}
                      className={`w-8 h-8 rounded-full overflow-hidden border-2 transition-all cursor-pointer ${
                        newAvatar === url ? 'border-blue-600 ring-2 ring-blue-200 scale-110' : 'border-transparent opacity-70 hover:opacity-100'
                      }`}
                    >
                      <img src={url} alt={`Avatar ${idx}`} className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddForm(false)}
                  className="px-3.5 py-1.5 border border-slate-200 rounded-xl text-xs font-semibold text-slate-600 font-sans hover:bg-white"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-blue-600 text-white rounded-xl text-xs font-bold font-sans hover:bg-blue-700 transition-all shadow-sm"
                >
                  Thêm Nhân sự
                </button>
              </div>
            </form>
          )}

          {/* User List */}
          <div className="space-y-3">
            <h3 className="font-sans font-bold text-slate-800 text-xs uppercase tracking-wider text-slate-400">
              Danh sách Nhân sự Công ty
            </h3>

            <div className="grid grid-cols-1 divide-y divide-slate-100 border border-slate-200 rounded-2xl overflow-hidden bg-white">
              {users.map(u => {
                const isCurrent = u.id === currentUser.id;
                const dept = DEPARTMENTS.find(d => d.id === u.departmentId);

                return (
                  <div
                    key={u.id}
                    className={`p-4 flex items-center justify-between hover:bg-slate-50 transition-all ${
                      isCurrent ? 'bg-blue-50/30' : ''
                    }`}
                  >
                    <div className="flex items-center gap-3.5 min-w-0">
                      <div className="relative shrink-0">
                        <img
                          src={u.avatar}
                          alt={u.name}
                          className="w-11 h-11 rounded-full object-cover border-2 border-slate-200 shadow-sm"
                          referrerPolicy="no-referrer"
                        />
                        {isCurrent && (
                          <span className="absolute -top-1 -right-1 bg-emerald-500 text-white text-[9px] font-bold px-1.5 py-0.2 rounded-full border border-white">
                            Bạn
                          </span>
                        )}
                      </div>

                      <div className="min-w-0 space-y-0.5">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h4 className="font-sans font-bold text-slate-900 text-sm truncate">{u.name}</h4>
                          <span className="bg-slate-100 text-slate-700 font-mono text-[10px] font-semibold px-2 py-0.5 rounded-md border border-slate-200">
                            {u.role}
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 font-sans truncate">
                          {dept?.name || 'Chưa xếp phòng ban'} • <span className="text-slate-400">{u.email}</span>
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        onClick={() => handleStartEdit(u)}
                        title="Chỉnh sửa Tên, Vị trí & Ảnh đại diện"
                        className="p-2 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all font-sans text-xs font-semibold flex items-center gap-1 cursor-pointer"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                        <span className="hidden sm:inline">Chỉnh sửa</span>
                      </button>

                      {users.length > 1 && (
                        <button
                          onClick={() => setDeletingUser(u)}
                          title="Xóa nhân viên"
                          className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Edit Personnel Modal Sub-Dialog */}
      {editingUser && (
        <div className="fixed inset-0 bg-slate-900/60 flex items-center justify-center p-4 z-50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full p-6 space-y-5 border border-slate-100">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-sans font-bold text-slate-900 text-base flex items-center gap-2">
                <Pencil className="w-4 h-4 text-blue-600" />
                Chỉnh sửa Hồ sơ Nhân sự
              </h3>
              <button
                onClick={() => setEditingUser(null)}
                className="text-slate-400 hover:text-slate-600 font-bold p-1 rounded-lg"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="space-y-4">
              {/* Avatar Edit with upload capability */}
              <div className="flex items-center gap-4 bg-slate-50 p-3.5 rounded-2xl border border-slate-200">
                <div className="relative group shrink-0">
                  <img
                    src={editAvatar}
                    alt="Current Avatar"
                    className="w-16 h-16 rounded-full object-cover border-2 border-blue-500 shadow-md"
                    referrerPolicy="no-referrer"
                  />
                  <label className="absolute inset-0 bg-slate-900/50 rounded-full flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-all cursor-pointer">
                    <Camera className="w-5 h-5" />
                    <input
                      type="file"
                      accept="image/*"
                      onChange={e => handleImageFileUpload(e, true)}
                      className="hidden"
                    />
                  </label>
                </div>

                <div className="flex-1 space-y-1.5 min-w-0">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-slate-800 font-sans">Ảnh đại diện (Avatar)</label>
                    <label className="text-[11px] font-bold text-blue-600 hover:underline cursor-pointer flex items-center gap-1">
                      <Upload className="w-3 h-3" />
                      <span>Tải ảnh từ máy</span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={e => handleImageFileUpload(e, true)}
                        className="hidden"
                      />
                    </label>
                  </div>
                  <input
                    type="text"
                    placeholder="Dán URL ảnh hoặc chọn từ máy..."
                    value={editAvatar}
                    onChange={e => setEditAvatar(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-xs text-slate-800 font-sans focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              {/* Preset Avatars Quick Choice */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-semibold text-slate-500 font-sans">Chọn mẫu ảnh avatar có sẵn:</label>
                <div className="flex flex-wrap gap-2">
                  {PRESET_AVATARS.map((url, idx) => (
                    <button
                      type="button"
                      key={idx}
                      onClick={() => setEditAvatar(url)}
                      className={`w-8 h-8 rounded-full overflow-hidden border-2 transition-all cursor-pointer ${
                        editAvatar === url ? 'border-blue-600 ring-2 ring-blue-200 scale-110' : 'border-transparent opacity-70 hover:opacity-100'
                      }`}
                    >
                      <img src={url} alt={`Preset ${idx}`} className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              </div>

              {/* Name field */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700 font-sans">Họ và Tên Nhân viên *</label>
                <input
                  type="text"
                  required
                  value={editName}
                  onChange={e => setEditName(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-sm text-slate-800 font-sans focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Role / Position */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700 font-sans">Vị trí / Vai trò (Role) *</label>
                <select
                  value={editRole}
                  onChange={e => setEditRole(e.target.value as Role)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-sm text-slate-800 font-sans focus:ring-2 focus:ring-blue-500"
                >
                  {PRESET_ROLES.map(r => (
                    <option key={r.key} value={r.key}>{r.label}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700 font-sans">Phòng ban</label>
                  <select
                    value={editDeptId}
                    onChange={e => setEditDeptId(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 font-sans focus:ring-2 focus:ring-blue-500"
                  >
                    {DEPARTMENTS.map(d => (
                      <option key={d.id} value={d.id}>{d.name}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700 font-sans">Email</label>
                  <input
                    type="email"
                    value={editEmail}
                    onChange={e => setEditEmail(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 font-sans focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setEditingUser(null)}
                  className="px-4 py-2 border border-slate-200 rounded-xl text-xs font-semibold text-slate-600 font-sans hover:bg-slate-50"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-blue-600 text-white rounded-xl text-xs font-bold font-sans hover:bg-blue-700 transition-all shadow-sm"
                >
                  Lưu thay đổi
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete User Confirmation Modal */}
      {deletingUser && (
        <div className="fixed inset-0 bg-slate-900/60 flex items-center justify-center p-4 z-50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 space-y-4 border border-rose-100">
            <div className="flex items-center gap-3 text-rose-600">
              <div className="w-10 h-10 rounded-full bg-rose-100 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-sans font-bold text-slate-900 text-base">Xác nhận xóa Nhân sự</h3>
                <p className="text-xs text-slate-500 font-sans">Hành động này sẽ gỡ nhân sự khỏi danh sách</p>
              </div>
            </div>

            <p className="text-xs text-slate-600 font-sans leading-relaxed">
              Bạn có chắc chắn muốn xóa nhân sự <strong className="text-slate-900 font-bold">{deletingUser.name}</strong> ({deletingUser.role})?
            </p>

            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setDeletingUser(null)}
                className="px-4 py-2 border border-slate-200 rounded-xl text-xs font-semibold text-slate-600 font-sans hover:bg-slate-50"
              >
                Hủy
              </button>
              <button
                type="button"
                onClick={() => {
                  onDeleteUser(deletingUser.id);
                  setDeletingUser(null);
                }}
                className="px-5 py-2 bg-rose-600 text-white rounded-xl text-xs font-semibold font-sans hover:bg-rose-700 transition-all shadow-sm"
              >
                Xóa nhân viên
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
