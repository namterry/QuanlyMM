import React from 'react';
import { Style, StyleStatus, StageType } from '../types';
import { Filter, Search, Plus, Calendar, Building, User, ChevronRight, Sparkles } from 'lucide-react';

interface StyleListProps {
  styles: Style[];
  onSelectStyle: (styleId: string) => void;
  onAddStyle: (newStyle: Omit<Style, 'id' | 'stages'> & { stages: { stageType: StageType; deadlineDays: number }[] }) => void;
}

const DEFAULT_STAGES_CONFIG: { stageType: StageType; deadlineDays: number }[] = [
  { stageType: 'Proto Sample', deadlineDays: 5 },
  { stageType: 'Fit Sample', deadlineDays: 12 },
  { stageType: 'PP Sample', deadlineDays: 20 },
  { stageType: 'Size Set Sample', deadlineDays: 28 },
  { stageType: 'Sales Sample', deadlineDays: 35 },
  { stageType: 'TOP Sample', deadlineDays: 42 },
  { stageType: 'Final Approval', deadlineDays: 48 },
  { stageType: 'Production Ready', deadlineDays: 55 }
];

export default function StyleList({ styles, onSelectStyle, onAddStyle }: StyleListProps) {
  // Search and Filter state
  const [searchTerm, setSearchTerm] = React.useState('');
  const [statusFilter, setStatusFilter] = React.useState<StyleStatus | 'All'>('All');
  const [customerFilter, setCustomerFilter] = React.useState('All');
  const [seasonFilter, setSeasonFilter] = React.useState('All');
  const [showAddModal, setShowAddModal] = React.useState(false);

  // New Style Form state
  const [newStyleCode, setNewStyleCode] = React.useState('');
  const [newCustomer, setNewCustomer] = React.useState('');
  const [newSeason, setNewSeason] = React.useState('Fall 2026');
  const [newBuyer, setNewBuyer] = React.useState('');
  const [newFactory, setNewFactory] = React.useState('');
  const [selectedStages, setSelectedStages] = React.useState<StageType[]>([
    'Proto Sample', 'Fit Sample', 'PP Sample', 'Size Set Sample', 'TOP Sample', 'Final Approval', 'Production Ready'
  ]); // pre-selected standard stages (omitted Sales by default to show configurability)

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
    const finalStagesConfig = DEFAULT_STAGES_CONFIG.filter(cfg => selectedStages.includes(cfg.stageType));

    onAddStyle({
      styleCode: newStyleCode,
      customer: newCustomer,
      season: newSeason,
      buyer: newBuyer || 'Chưa cập nhật',
      factory: newFactory || 'Tổ mẫu trung tâm',
      status: 'Active',
      createdBy: 'Nguyễn Văn Minh',
      createdAt: new Date().toISOString(),
      stages: finalStagesConfig,
    });

    // Reset and close
    setNewStyleCode('');
    setNewCustomer('');
    setNewBuyer('');
    setNewFactory('');
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
                      {/* Code and Customer */}
                      <td className="p-4">
                        <div className="space-y-0.5">
                          <p className="font-sans font-bold text-slate-800 text-sm hover:text-blue-600 transition-colors">
                            {style.styleCode}
                          </p>
                          <p className="text-xs text-slate-400 font-sans flex items-center gap-1.5">
                            <span className="font-semibold text-slate-500">{style.customer}</span>
                            <span>•</span>
                            <span>{style.season}</span>
                          </p>
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
                        <ChevronRight className="w-4 h-4 text-slate-400 ml-auto" />
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
    </div>
  );
}
