import React from 'react';
import { Style, StyleStatus, StageType, Attachment, FileType } from '../types';
import { Filter, Search, Plus, Calendar, Building, User, ChevronRight, Sparkles, Pencil, Trash2, AlertTriangle, ExternalLink, Scissors, Shirt, Layers } from 'lucide-react';

interface StyleListProps {
  styles: Style[];
  attachments?: Attachment[];
  onSelectStyle: (styleId: string) => void;
  onAddStyle: (newStyle: Omit<Style, 'id' | 'stages'> & { stages: { stageType: StageType; deadlineDays: number }[] }) => void;
  onUpdateStyle?: (styleId: string, updatedFields: Partial<Style>) => void;
  onDeleteStyle?: (styleId: string) => void;
  onAddAttachment?: (stageId: string, fileType: FileType, fileName: string, fileSize: string, fileUrl?: string) => void;
}

const DEFAULT_STAGES_CONFIG: { stageType: StageType; deadlineDays: number }[] = [
  { stageType: 'Proto Sample', deadlineDays: 5 },
  { stageType: 'Fit Sample', deadlineDays: 12 },
  { stageType: 'PP Sample', deadlineDays: 20 },
  { stageType: 'Size Set Sample', deadlineDays: 28 },
  { stageType: 'Sales Sample', deadlineDays: 35 },
  { stageType: 'Sale Samples', deadlineDays: 40 },
  { stageType: 'TOP Sample', deadlineDays: 45 },
  { stageType: 'Final Approval', deadlineDays: 50 },
  { stageType: 'Production Ready', deadlineDays: 55 },
  { stageType: 'Production', deadlineDays: 60 }
];

export default function StyleList({ styles, onSelectStyle, onAddStyle, onUpdateStyle, onDeleteStyle }: StyleListProps) {
  // Search and Filter state
  const [searchTerm, setSearchTerm] = React.useState('');
  const [statusFilter, setStatusFilter] = React.useState<StyleStatus | 'All'>('All');
  const [customerFilter, setCustomerFilter] = React.useState('All');
  const [seasonFilter, setSeasonFilter] = React.useState('All');
  const [showAddModal, setShowAddModal] = React.useState(false);

  // Edit / Delete modal states
  const [editingStyle, setEditingStyle] = React.useState<Style | null>(null);
  const [deletingStyle, setDeletingStyle] = React.useState<Style | null>(null);

  // Edit Form state
  const [editCode, setEditCode] = React.useState('');
  const [editCustomer, setEditCustomer] = React.useState('');
  const [editSeason, setEditSeason] = React.useState('');
  const [editBuyer, setEditBuyer] = React.useState('');
  const [editFactory, setEditFactory] = React.useState('');
  const [editDriveUrl, setEditDriveUrl] = React.useState('');
  const [editPatternQuantity, setEditPatternQuantity] = React.useState<number>(1);
  const [editSampleQuantity, setEditSampleQuantity] = React.useState<number>(1);
  const [editCreatedAt, setEditCreatedAt] = React.useState('');
  const [editStatus, setEditStatus] = React.useState<StyleStatus>('Active');

  // New Style Form state
  const [newStyleCode, setNewStyleCode] = React.useState('');
  const [newCustomer, setNewCustomer] = React.useState('');
  const [newSeason, setNewSeason] = React.useState('Fall 2026');
  const [newBuyer, setNewBuyer] = React.useState('');
  const [newFactory, setNewFactory] = React.useState('');
  const [newDriveUrl, setNewDriveUrl] = React.useState('');
  const [newPatternQuantity, setNewPatternQuantity] = React.useState<number>(1);
  const [newSampleQuantity, setNewSampleQuantity] = React.useState<number>(1);
  const [newCreatedAt, setNewCreatedAt] = React.useState('');
  const [customStageName, setCustomStageName] = React.useState('');
  const [selectedStages, setSelectedStages] = React.useState<StageType[]>([
    'Proto Sample', 'Fit Sample', 'PP Sample', 'Size Set Sample', 'TOP Sample', 'Final Approval', 'Production Ready'
  ]);

  // Open edit modal
  const handleOpenEdit = (e: React.MouseEvent, style: Style) => {
    e.stopPropagation();
    setEditingStyle(style);
    setEditCode(style.styleCode);
    setEditCustomer(style.customer);
    setEditSeason(style.season);
    setEditBuyer(style.buyer);
    setEditFactory(style.factory);
    setEditDriveUrl(style.driveUrl || '');
    setEditPatternQuantity(style.patternQuantity ?? 1);
    setEditSampleQuantity(style.sampleQuantity ?? 1);
    setEditCreatedAt(style.createdAt ? style.createdAt.slice(0, 10) : '');
    setEditStatus(style.status);
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingStyle || !onUpdateStyle) return;

    onUpdateStyle(editingStyle.id, {
      styleCode: editCode,
      customer: editCustomer,
      season: editSeason,
      buyer: editBuyer,
      factory: editFactory,
      driveUrl: editDriveUrl,
      patternQuantity: editPatternQuantity,
      sampleQuantity: editSampleQuantity,
      createdAt: editCreatedAt ? new Date(editCreatedAt).toISOString() : editingStyle.createdAt,
      status: editStatus
    });

    setEditingStyle(null);
  };

  // Open delete confirm modal
  const handleOpenDelete = (e: React.MouseEvent, style: Style) => {
    e.stopPropagation();
    setDeletingStyle(style);
  };

  const handleConfirmDelete = () => {
    if (!deletingStyle || !onDeleteStyle) return;
    onDeleteStyle(deletingStyle.id);
    setDeletingStyle(null);
  };

  // Get unique filter values
  const customers = Array.from(new Set(styles.map(s => s.customer)));
  const seasons = Array.from(new Set(styles.map(s => s.season)));

  // Filter logic
  const filteredStyles = styles.filter(style => {
    const matchesSearch =
      style.styleCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
      style.customer.toLowerCase().includes(searchTerm.toLowerCase()) ||
      style.buyer.toLowerCase().includes(searchTerm.toLowerCase()) ||
      style.factory.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = statusFilter === 'All' || style.status === statusFilter;
    const matchesCustomer = customerFilter === 'All' || style.customer === customerFilter;
    const matchesSeason = seasonFilter === 'All' || style.season === seasonFilter;

    return matchesSearch && matchesStatus && matchesCustomer && matchesSeason;
  });

  const handleCreateStyle = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStyleCode || !newCustomer) return;

    // Filter stage configuration to only checked stages
    let finalStagesConfig = DEFAULT_STAGES_CONFIG.filter(cfg => selectedStages.includes(cfg.stageType));

    // If customStageName is provided and selected, add it
    if (customStageName.trim() && selectedStages.includes(customStageName.trim())) {
      finalStagesConfig.push({ stageType: customStageName.trim(), deadlineDays: 30 });
    }

    onAddStyle({
      styleCode: newStyleCode,
      customer: newCustomer,
      season: newSeason,
      buyer: newBuyer || 'Chưa cập nhật',
      factory: newFactory || 'Tổ mẫu trung tâm',
      driveUrl: newDriveUrl || undefined,
      patternQuantity: newPatternQuantity,
      sampleQuantity: newSampleQuantity,
      status: 'Active',
      createdBy: 'Nguyễn Văn Minh',
      createdAt: newCreatedAt ? new Date(newCreatedAt).toISOString() : new Date().toISOString(),
      stages: finalStagesConfig,
    });

    // Reset and close
    setNewStyleCode('');
    setNewCustomer('');
    setNewBuyer('');
    setNewFactory('');
    setNewDriveUrl('');
    setNewPatternQuantity(1);
    setNewSampleQuantity(1);
    setNewCreatedAt('');
    setCustomStageName('');
    setShowAddModal(false);
  };

  const toggleStageSelection = (stage: StageType) => {
    if (selectedStages.includes(stage)) {
      setSelectedStages(selectedStages.filter(s => s !== stage));
    } else {
      setSelectedStages([...selectedStages, stage]);
    }
  };

  return (
    <div className="space-y-6" id="style-list-view-root">
      {/* Header and Add button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-sans font-bold text-slate-900 text-2xl">Quản lý Mã hàng (Styles)</h1>
          <p className="text-xs text-slate-500 font-sans mt-0.5">
            Xem danh mục, tiến độ tổng quan và cấu hình vòng đời cho từng mã thiết kế.
          </p>
        </div>
        <button
          id="btn-open-add-style-modal"
          onClick={() => setShowAddModal(true)}
          className="flex items-center justify-center gap-2 bg-blue-600 text-white font-sans text-sm font-semibold px-4 py-2.5 rounded-xl hover:bg-blue-700 transition-all shadow-sm shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Tạo mã hàng mới</span>
        </button>
      </div>

      {/* Filter panel */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm space-y-4">
        <div className="flex flex-col lg:flex-row gap-4 items-stretch lg:items-center justify-between">
          
          {/* Left search */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              id="search-styles-input"
              type="text"
              placeholder="Tìm kiếm theo mã, khách hàng, buyer, nhà máy..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-4 py-2 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 font-sans transition-all"
            />
          </div>

          {/* Quick status selector */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 lg:pb-0 scrollbar-none shrink-0">
            {(['All', 'Active', 'Completed', 'OnHold', 'Cancelled'] as const).map(status => (
              <button
                key={status}
                id={`btn-filter-status-${status}`}
                onClick={() => setStatusFilter(status)}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-medium font-sans transition-all whitespace-nowrap border ${
                  statusFilter === status
                    ? 'bg-slate-900 text-white border-slate-900 shadow-sm'
                    : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                }`}
              >
                {status === 'All' ? 'Tất cả' : status}
              </button>
            ))}
          </div>
        </div>

        {/* Dropdown selectors for Advanced Grouping */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 pt-3 border-t border-slate-100">
          <div className="space-y-1">
            <label className="text-[10px] text-slate-400 font-sans font-semibold uppercase tracking-wider block">Khách hàng</label>
            <div className="relative">
              <Filter className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <select
                id="select-filter-customer"
                value={customerFilter}
                onChange={e => setCustomerFilter(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-9 pr-3 py-1.5 text-xs text-slate-700 font-sans focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="All">Tất cả khách hàng</option>
                {customers.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-[10px] text-slate-400 font-sans font-semibold uppercase tracking-wider block">Mùa vụ (Season)</label>
            <div className="relative">
              <Calendar className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <select
                id="select-filter-season"
                value={seasonFilter}
                onChange={e => setSeasonFilter(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-9 pr-3 py-1.5 text-xs text-slate-700 font-sans focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="All">Tất cả mùa vụ</option>
                {seasons.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Styles Grid List */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden" id="styles-table-container">
        {filteredStyles.length === 0 ? (
          <div className="text-center py-12 text-slate-400 font-sans">
            Không tìm thấy mã hàng nào khớp với bộ lọc hiện tại.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/50">
                  <th className="p-4 text-xs font-semibold text-slate-500 font-sans uppercase tracking-wider">Mã hàng / Khách</th>
                  <th className="p-4 text-xs font-semibold text-slate-500 font-sans uppercase tracking-wider">Thông tin sản xuất</th>
                  <th className="p-4 text-xs font-semibold text-slate-500 font-sans uppercase tracking-wider">Tiến độ Giai đoạn</th>
                  <th className="p-4 text-xs font-semibold text-slate-500 font-sans uppercase tracking-wider">Trạng thái</th>
                  <th className="p-4 text-right"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredStyles.map(style => {
                  // Calculate stage completion percentage
                  const completedStages = style.stages.filter(s => s.status === 'Completed').length;
                  const totalStages = style.stages.length;
                  const percent = totalStages > 0 ? Math.round((completedStages / totalStages) * 100) : 0;

                  // Find current stage (the first in-progress or pending stage)
                  const currentStage = style.stages.find(s => s.status === 'InProgress') || style.stages.find(s => s.status === 'Pending');

                  return (
                    <tr
                      key={style.id}
                      id={`style-row-${style.id}`}
                      className="hover:bg-slate-50/60 transition-all cursor-pointer"
                      onClick={() => onSelectStyle(style.id)}
                    >
                      {/* Code, Customer & Quantities */}
                      <td className="p-4">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <p className="font-sans font-bold text-slate-800 text-sm hover:text-blue-600 transition-colors">
                              {style.styleCode}
                            </p>
                            {style.driveUrl && (
                              <a
                                href={style.driveUrl.startsWith('http') ? style.driveUrl : `https://${style.driveUrl}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                onClick={e => e.stopPropagation()}
                                title="Xem Google Drive sản phẩm"
                                className="inline-flex items-center gap-1 px-2 py-0.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 rounded-md text-[10px] font-bold font-sans transition-all"
                              >
                                <ExternalLink className="w-3 h-3 text-emerald-600" />
                                <span>Drive</span>
                              </a>
                            )}
                          </div>
                          <p className="text-xs text-slate-400 font-sans flex items-center gap-1.5">
                            <span className="font-semibold text-slate-500">{style.customer}</span>
                            <span>•</span>
                            <span>{style.season}</span>
                          </p>
                          {/* Badges for Pattern and Sample Quantities */}
                          <div className="flex items-center gap-1.5 pt-0.5">
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-blue-50 text-blue-700 border border-blue-200/80 rounded-md text-[10px] font-bold font-mono">
                              <Scissors className="w-3 h-3 text-blue-600" />
                              <span>{style.patternQuantity ?? 1} Rập</span>
                            </span>
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200/80 rounded-md text-[10px] font-bold font-mono">
                              <Shirt className="w-3 h-3 text-emerald-600" />
                              <span>{style.sampleQuantity ?? 1} Mẫu</span>
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Buyer and Factory */}
                      <td className="p-4">
                        <div className="space-y-1">
                          <p className="text-xs text-slate-600 font-sans flex items-center gap-1">
                            <User className="w-3 h-3 text-slate-400 shrink-0" />
                            <span>Buyer: {style.buyer}</span>
                          </p>
                          <p className="text-xs text-slate-500 font-sans flex items-center gap-1">
                            <Building className="w-3 h-3 text-slate-400 shrink-0" />
                            <span>{style.factory}</span>
                          </p>
                        </div>
                      </td>

                      {/* Work flow progress bar */}
                      <td className="p-4 min-w-[200px]">
                        <div className="space-y-1.5">
                          <div className="flex items-center justify-between text-xs font-sans">
                            <span className="text-slate-500 font-medium text-[11px]">
                              {currentStage ? `Đang ở: ${currentStage.stageType}` : 'Hoàn thành 100%'}
                            </span>
                            <span className="font-bold font-mono text-slate-700">{completedStages}/{totalStages} mẫu</span>
                          </div>
                          {/* Progress track */}
                          <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden flex">
                            <div
                              className={`h-full transition-all duration-500 ${
                                style.status === 'Completed'
                                  ? 'bg-emerald-500'
                                  : style.status === 'OnHold'
                                  ? 'bg-amber-400'
                                  : 'bg-blue-600'
                              }`}
                              style={{ width: `${percent}%` }}
                            />
                          </div>
                        </div>
                      </td>

                      {/* Status */}
                      <td className="p-4">
                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold font-sans ${
                          style.status === 'Active'
                            ? 'bg-blue-50 text-blue-700'
                            : style.status === 'Completed'
                            ? 'bg-emerald-50 text-emerald-700'
                            : style.status === 'OnHold'
                            ? 'bg-amber-50 text-amber-700'
                            : 'bg-rose-50 text-rose-700'
                        }`}>
                          {style.status}
                        </span>
                      </td>

                      {/* Action trigger */}
                      <td className="p-4 text-right">
                        <div className="flex items-center justify-end gap-1.5" onClick={e => e.stopPropagation()}>
                          <button
                            onClick={(e) => handleOpenEdit(e, style)}
                            title="Chỉnh sửa mã hàng"
                            className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-500 hover:text-blue-600 transition-all cursor-pointer"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={(e) => handleOpenDelete(e, style)}
                            title="Xóa mã hàng"
                            className="p-1.5 hover:bg-rose-50 rounded-lg text-slate-400 hover:text-rose-600 transition-all cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => onSelectStyle(style.id)}
                            title="Xem chi tiết"
                            className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-slate-700 transition-all cursor-pointer"
                          >
                            <ChevronRight className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add Style Modal (Dynamic Configurable Workflow) */}
      {showAddModal && (
        <div className="fixed inset-0 bg-slate-900/65 flex items-center justify-center p-4 z-50 backdrop-blur-sm animate-in fade-in duration-200">
          <div
            id="add-style-modal-content"
            className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-slate-100 p-6 space-y-6 animate-in zoom-in-95 duration-200"
          >
            {/* Modal Header */}
            <div className="flex items-start justify-between border-b border-slate-100 pb-4">
              <div className="space-y-1">
                <h2 className="font-sans font-bold text-slate-900 text-lg flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-blue-500 animate-pulse" />
                  Khởi tạo Mã hàng & Vòng đời May mẫu
                </h2>
                <p className="text-xs text-slate-500 font-sans">
                  Thiết kế, định hình các Giai đoạn cần may mẫu cụ thể cho Style này (Cấu hình linh hoạt).
                </p>
              </div>
              <button
                id="btn-close-add-style-modal"
                onClick={() => setShowAddModal(false)}
                className="text-slate-400 hover:text-slate-600 font-sans font-bold text-lg p-1.5 hover:bg-slate-100 rounded-lg"
              >
                ✕
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleCreateStyle} className="space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700 font-sans">Mã hàng (Style Code) *</label>
                  <input
                    id="input-new-style-code"
                    type="text"
                    required
                    placeholder="VD: NK-JKT-098"
                    value={newStyleCode}
                    onChange={e => setNewStyleCode(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 font-sans"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700 font-sans">Khách hàng (Brand) *</label>
                  <input
                    id="input-new-style-customer"
                    type="text"
                    required
                    placeholder="VD: Nike, Adidas, Puma..."
                    value={newCustomer}
                    onChange={e => setNewCustomer(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 font-sans"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700 font-sans">Mùa vụ (Season)</label>
                  <select
                    id="select-new-style-season"
                    value={newSeason}
                    onChange={e => setNewSeason(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 font-sans"
                  >
                    <option value="Summer 2026">Summer 2026</option>
                    <option value="Fall 2026">Fall 2026</option>
                    <option value="Winter 2026">Winter 2026</option>
                    <option value="Spring 2027">Spring 2027</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700 font-sans">Người mua đại diện (Buyer)</label>
                  <input
                    id="input-new-style-buyer"
                    type="text"
                    placeholder="VD: David Lee"
                    value={newBuyer}
                    onChange={e => setNewBuyer(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 font-sans"
                  />
                </div>

                {/* Số lượng rập & Số lượng mẫu */}
                <div className="space-y-1.5 bg-blue-50/50 p-3 rounded-xl border border-blue-100/80">
                  <label className="text-xs font-bold text-blue-900 font-sans flex items-center gap-1.5">
                    <Scissors className="w-3.5 h-3.5 text-blue-600" />
                    Số lượng Rập (Bộ rập) *
                  </label>
                  <input
                    id="input-new-style-pattern-qty"
                    type="number"
                    min={0}
                    required
                    placeholder="VD: 1, 2, 3..."
                    value={newPatternQuantity}
                    onChange={e => setNewPatternQuantity(parseInt(e.target.value) || 0)}
                    className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2 text-sm text-slate-800 font-bold focus:outline-none focus:ring-2 focus:ring-blue-500 font-sans"
                  />
                </div>

                <div className="space-y-1.5 bg-emerald-50/50 p-3 rounded-xl border border-emerald-100/80">
                  <label className="text-xs font-bold text-emerald-900 font-sans flex items-center gap-1.5">
                    <Shirt className="w-3.5 h-3.5 text-emerald-600" />
                    Số lượng Mẫu (Chiếc may) *
                  </label>
                  <input
                    id="input-new-style-sample-qty"
                    type="number"
                    min={0}
                    required
                    placeholder="VD: 1, 3, 5..."
                    value={newSampleQuantity}
                    onChange={e => setNewSampleQuantity(parseInt(e.target.value) || 0)}
                    className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2 text-sm text-slate-800 font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500 font-sans"
                  />
                </div>

                <div className="space-y-1.5 sm:col-span-2">
                  <label className="text-xs font-semibold text-slate-700 font-sans">Nhà xưởng may mẫu (Factory)</label>
                  <input
                    id="input-new-style-factory"
                    type="text"
                    placeholder="VD: Tổ Mẫu Trung Tâm Bình Dương"
                    value={newFactory}
                    onChange={e => setNewFactory(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 font-sans"
                  />
                </div>

                <div className="space-y-1.5 sm:col-span-2">
                  <label className="text-xs font-bold text-slate-800 font-sans flex items-center gap-1.5">
                    <ExternalLink className="w-3.5 h-3.5 text-emerald-600" />
                    Đường dẫn Google Drive (Link Drive thông tin & hình ảnh style)
                  </label>
                  <input
                    id="input-new-style-drive"
                    type="url"
                    placeholder="https://drive.google.com/drive/folders/..."
                    value={newDriveUrl}
                    onChange={e => setNewDriveUrl(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 font-sans"
                  />
                  <p className="text-[10px] text-slate-400 font-sans">
                    Nhập link chứa thư mục/file Google Drive. Khách hàng/Buyer có thể bấm vào link để xem trực tiếp.
                  </p>
                </div>

                <div className="space-y-1.5 sm:col-span-2">
                  <label className="text-xs font-semibold text-slate-700 font-sans flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5 text-slate-400" />
                    Ngày tạo / Khởi tạo đơn hàng (Created Date)
                  </label>
                  <input
                    id="input-new-style-created-at"
                    type="date"
                    value={newCreatedAt}
                    onChange={e => setNewCreatedAt(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 font-sans"
                  />
                </div>
              </div>

              {/* Dynamic workflow selector */}
              <div className="border border-slate-200 rounded-2xl p-4 bg-slate-50/50 space-y-3">
                <div className="space-y-0.5">
                  <label className="text-xs font-bold text-slate-800 font-sans">
                    Cấu hình Giai đoạn phát triển (Workflow Engine)
                  </label>
                  <p className="text-[11px] text-slate-400 font-sans">
                    Tích chọn các giai đoạn may mẫu áp dụng cho Style này. Các giai đoạn không tích sẽ bị bỏ qua.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {DEFAULT_STAGES_CONFIG.map(cfg => {
                    const isChecked = selectedStages.includes(cfg.stageType);
                    return (
                      <div
                        key={cfg.stageType}
                        className={`flex items-center justify-between p-2.5 border rounded-xl bg-white select-none transition-all ${
                          isChecked ? 'border-blue-200 bg-blue-50/30' : 'border-slate-200'
                        }`}
                      >
                        <div className="flex items-center gap-2.5">
                          <input
                            id={`checkbox-stage-toggle-${cfg.stageType.replace(/\s+/g, '-')}`}
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => toggleStageSelection(cfg.stageType)}
                            className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                          />
                          <span className="text-xs font-medium text-slate-700 font-sans">{cfg.stageType}</span>
                        </div>
                        <span className="text-[10px] font-mono text-slate-400">
                          +{cfg.deadlineDays} ngày
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Action buttons */}
              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  id="btn-cancel-add-style"
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 border border-slate-200 rounded-xl text-xs font-semibold text-slate-600 font-sans hover:bg-slate-50"
                >
                  Hủy bỏ
                </button>
                <button
                  id="btn-submit-add-style"
                  type="submit"
                  className="px-5 py-2 bg-blue-600 text-white rounded-xl text-xs font-semibold font-sans hover:bg-blue-700 transition-all shadow-sm"
                >
                  Tạo mã & áp dụng workflow
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* Edit Style Modal */}
      {editingStyle && (
        <div className="fixed inset-0 bg-slate-900/65 flex items-center justify-center p-4 z-50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full p-6 space-y-5 border border-slate-100">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-sans font-bold text-slate-900 text-base flex items-center gap-2">
                <Pencil className="w-4 h-4 text-blue-600" />
                Chỉnh sửa Mã hàng ({editingStyle.styleCode})
              </h3>
              <button
                onClick={() => setEditingStyle(null)}
                className="text-slate-400 hover:text-slate-600 font-sans font-bold p-1 rounded-lg"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700 font-sans">Mã hàng (Style Code) *</label>
                <input
                  type="text"
                  required
                  value={editCode}
                  onChange={e => setEditCode(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-sm text-slate-800 font-sans focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700 font-sans">Khách hàng (Brand) *</label>
                  <input
                    type="text"
                    required
                    value={editCustomer}
                    onChange={e => setEditCustomer(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-sm text-slate-800 font-sans focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700 font-sans">Mùa vụ (Season)</label>
                  <input
                    type="text"
                    value={editSeason}
                    onChange={e => setEditSeason(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-sm text-slate-800 font-sans focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700 font-sans">Buyer đại diện</label>
                  <input
                    type="text"
                    value={editBuyer}
                    onChange={e => setEditBuyer(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-sm text-slate-800 font-sans focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700 font-sans">Trạng thái mã hàng</label>
                  <select
                    value={editStatus}
                    onChange={e => setEditStatus(e.target.value as StyleStatus)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-sm text-slate-800 font-sans focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="Active">Active (May mẫu)</option>
                    <option value="Completed">Completed (Hoàn tất)</option>
                    <option value="OnHold">OnHold (Tạm hoãn)</option>
                    <option value="Cancelled">Cancelled (Đã hủy)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5 bg-blue-50/50 p-2.5 rounded-xl border border-blue-100">
                  <label className="text-xs font-bold text-blue-900 font-sans flex items-center gap-1">
                    <Scissors className="w-3.5 h-3.5 text-blue-600" />
                    Số lượng Rập
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={editPatternQuantity}
                    onChange={e => setEditPatternQuantity(parseInt(e.target.value) || 0)}
                    className="w-full bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-xs text-slate-800 font-bold focus:ring-2 focus:ring-blue-500 font-sans"
                  />
                </div>

                <div className="space-y-1.5 bg-emerald-50/50 p-2.5 rounded-xl border border-emerald-100">
                  <label className="text-xs font-bold text-emerald-900 font-sans flex items-center gap-1">
                    <Shirt className="w-3.5 h-3.5 text-emerald-600" />
                    Số lượng Mẫu
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={editSampleQuantity}
                    onChange={e => setEditSampleQuantity(parseInt(e.target.value) || 0)}
                    className="w-full bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-xs text-slate-800 font-bold focus:ring-2 focus:ring-emerald-500 font-sans"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700 font-sans">Nhà máy sản xuất (Factory)</label>
                <input
                  type="text"
                  value={editFactory}
                  onChange={e => setEditFactory(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-sm text-slate-800 font-sans focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-800 font-sans flex items-center gap-1.5">
                  <ExternalLink className="w-3.5 h-3.5 text-emerald-600" />
                  Đường dẫn Google Drive (Link Drive)
                </label>
                <input
                  type="url"
                  placeholder="https://drive.google.com/drive/folders/..."
                  value={editDriveUrl}
                  onChange={e => setEditDriveUrl(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-sm text-slate-800 font-sans focus:ring-2 focus:ring-blue-500"
                />
                <p className="text-[10px] text-slate-400 font-sans">
                  Khách hàng bấm vào link Drive sẽ xem/tải tài liệu, hình ảnh liên quan đến style.
                </p>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700 font-sans flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5 text-slate-400" />
                  Ngày khởi tạo đơn hàng (Created Date)
                </label>
                <input
                  type="date"
                  value={editCreatedAt}
                  onChange={e => setEditCreatedAt(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-sm text-slate-800 font-sans focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setEditingStyle(null)}
                  className="px-4 py-2 border border-slate-200 rounded-xl text-xs font-semibold text-slate-600 font-sans hover:bg-slate-50"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-blue-600 text-white rounded-xl text-xs font-semibold font-sans hover:bg-blue-700 transition-all shadow-sm"
                >
                  Lưu thay đổi
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Style Confirmation Modal */}
      {deletingStyle && (
        <div className="fixed inset-0 bg-slate-900/65 flex items-center justify-center p-4 z-50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 space-y-4 border border-rose-100">
            <div className="flex items-center gap-3 text-rose-600">
              <div className="w-10 h-10 rounded-full bg-rose-100 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-sans font-bold text-slate-900 text-base">Xác nhận xóa Mã hàng</h3>
                <p className="text-xs text-slate-500 font-sans">Hành động này không thể hoàn tác!</p>
              </div>
            </div>

            <p className="text-xs text-slate-600 font-sans leading-relaxed">
              Bạn có chắc chắn muốn xóa mã hàng <strong className="text-slate-900 font-bold">{deletingStyle.styleCode}</strong> ({deletingStyle.customer}) cùng toàn bộ dữ liệu giai đoạn?
            </p>

            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setDeletingStyle(null)}
                className="px-4 py-2 border border-slate-200 rounded-xl text-xs font-semibold text-slate-600 font-sans hover:bg-slate-50"
              >
                Hủy
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                className="px-5 py-2 bg-rose-600 text-white rounded-xl text-xs font-semibold font-sans hover:bg-rose-700 transition-all shadow-sm"
              >
                Xóa vĩnh viễn
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
