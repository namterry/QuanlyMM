import React from 'react';
import { Style, Stage, StageStatus, User, Attachment, FileType, ActivityLog, Role } from '../types';
import { USERS } from '../data/initialData';
import {
  ArrowLeft, Calendar, UserCheck, CheckCircle2, Clock, AlertTriangle, FileText, Upload,
  Plus, History, ShieldAlert, Sparkles, AlertCircle, RefreshCw, Pencil, Trash2, Download,
  FileSpreadsheet, Image, ExternalLink, FileCode, Scissors, Shirt, Package, Layers
} from 'lucide-react';

interface StyleDetailProps {
  style: Style;
  currentUser: User;
  users?: User[];
  onBack: () => void;
  onUpdateStage: (stageId: string, updatedFields: Partial<Stage>) => void;
  onAddAttachment: (stageId: string, fileType: FileType, fileName: string, fileSize: string, fileUrl?: string) => void;
  onDeleteAttachment?: (attachmentId: string) => void;
  onUpdateStyleStatus: (styleId: string, status: Style['status']) => void;
  onUpdateStyle: (styleId: string, updatedFields: Partial<Style>) => void;
  onDeleteStyle: (styleId: string) => void;
  attachments: Attachment[];
  logs: ActivityLog[];
}

export default function StyleDetail({
  style,
  currentUser,
  users = USERS,
  onBack,
  onUpdateStage,
  onAddAttachment,
  onDeleteAttachment,
  onUpdateStyleStatus,
  onUpdateStyle,
  onDeleteStyle,
  attachments,
  logs
}: StyleDetailProps) {
  const currentDate = new Date('2026-07-01');

  // Selected stage state (defaults to the first incomplete or active stage)
  const activeOrIncompleteStage = style.stages.find(s => s.status === 'InProgress') || style.stages.find(s => s.status === 'Pending') || style.stages[0];
  const [selectedStageId, setSelectedStageId] = React.useState<string>(activeOrIncompleteStage?.id || '');
  const selectedStage = style.stages.find(s => s.id === selectedStageId);

  // File Upload fields
  const [uploadFileType, setUploadFileType] = React.useState<FileType>('Pattern');
  const [uploadFileName, setUploadFileName] = React.useState('');
  const [selectedRealFile, setSelectedRealFile] = React.useState<File | null>(null);
  const fileInputRef = React.useRef<HTMLInputElement | null>(null);

  // Edit Style modal state
  const [showEditStyleModal, setShowEditStyleModal] = React.useState(false);
  const [editStyleCode, setEditStyleCode] = React.useState(style.styleCode);
  const [editCustomer, setEditCustomer] = React.useState(style.customer);
  const [editSeason, setEditSeason] = React.useState(style.season);
  const [editBuyer, setEditBuyer] = React.useState(style.buyer);
  const [editFactory, setEditFactory] = React.useState(style.factory);
  const [editDriveUrl, setEditDriveUrl] = React.useState(style.driveUrl || '');
  const [editPatternQuantity, setEditPatternQuantity] = React.useState<number>(style.patternQuantity ?? 1);
  const [editSampleQuantity, setEditSampleQuantity] = React.useState<number>(style.sampleQuantity ?? 1);
  const [editCreatedAt, setEditCreatedAt] = React.useState(style.createdAt ? style.createdAt.slice(0, 10) : '');
  const [editStatus, setEditStatus] = React.useState<Style['status']>(style.status);

  // Delete Style confirmation modal state
  const [showDeleteStyleConfirm, setShowDeleteStyleConfirm] = React.useState(false);

  // Keep edit state in sync with prop changes
  React.useEffect(() => {
    setEditStyleCode(style.styleCode);
    setEditCustomer(style.customer);
    setEditSeason(style.season);
    setEditBuyer(style.buyer);
    setEditFactory(style.factory);
    setEditDriveUrl(style.driveUrl || '');
    setEditPatternQuantity(style.patternQuantity ?? 1);
    setEditSampleQuantity(style.sampleQuantity ?? 1);
    setEditCreatedAt(style.createdAt ? style.createdAt.slice(0, 10) : '');
    setEditStatus(style.status);
  }, [style]);

  // Get logs related to this style
  const styleLogs = logs.filter(log => log.styleId === style.id);

  // Check role-based edit permission for the selected stage
  const hasEditPermission = (stage: Stage): { allowed: boolean; reason?: string } => {
    if (currentUser.role === 'Admin' || currentUser.role === 'Merchandising') {
      return { allowed: true };
    }

    if (stage.assigneeId === currentUser.id) {
      return { allowed: true };
    }

    const assignee = users.find(u => u.id === stage.assigneeId);
    if (assignee && assignee.departmentId === currentUser.departmentId) {
      return { allowed: true };
    }

    return {
      allowed: false,
      reason: `Bạn ở bộ phận "${currentUser.role}". Chỉ Admin, Merchandising hoặc Nhân viên được phân công mới được quyền sửa.`
    };
  };

  const handleUpdateStageStatus = (status: StageStatus) => {
    if (!selectedStage) return;
    const perm = hasEditPermission(selectedStage);
    if (!perm.allowed) {
      alert(perm.reason);
      return;
    }

    const updatedFields: Partial<Stage> = { status };
    if (status === 'Completed') {
      updatedFields.actualCompletionDate = currentDate.toISOString().split('T')[0];
      updatedFields.progressPercent = 100;
    } else if (status === 'InProgress') {
      updatedFields.progressPercent = 50;
    } else if (status === 'Pending') {
      updatedFields.progressPercent = 0;
    }

    onUpdateStage(selectedStage.id, updatedFields);
  };

  const handleUpdateAssignee = (userId: string) => {
    if (!selectedStage) return;
    const perm = hasEditPermission(selectedStage);
    if (!perm.allowed) {
      alert(perm.reason);
      return;
    }
    onUpdateStage(selectedStage.id, { assigneeId: userId || undefined });
  };

  const handleUpdateNotes = (note: string) => {
    if (!selectedStage) return;
    const perm = hasEditPermission(selectedStage);
    if (!perm.allowed) {
      alert(perm.reason);
      return;
    }
    onUpdateStage(selectedStage.id, { note });
  };

  // Auto-detect file type from extension
  const detectFileType = (fileName: string): FileType => {
    const ext = fileName.split('.').pop()?.toLowerCase() || '';
    if (['xlsx', 'xls', 'csv'].includes(ext)) return 'Excel';
    if (['pdf'].includes(ext)) return 'PDF';
    if (['dxf', 'pds', 'plt', 'pat', 'dwg', 'zip', 'rar'].includes(ext)) return 'Pattern';
    if (['png', 'jpg', 'jpeg', 'webp', 'svg'].includes(ext)) return 'Photo';
    if (['doc', 'docx'].includes(ext)) return 'TechPack';
    return uploadFileType;
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedRealFile(file);
      setUploadFileName(file.name);
      const autoType = detectFileType(file.name);
      setUploadFileType(autoType);
    }
  };

  const handleUploadFile = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStage || !uploadFileName) return;

    const perm = hasEditPermission(selectedStage);
    if (!perm.allowed) {
      alert(perm.reason);
      return;
    }

    let fileSize = `${(Math.random() * 5 + 1).toFixed(1)} MB`;
    let fileUrl = '#';

    if (selectedRealFile) {
      const sizeMB = (selectedRealFile.size / (1024 * 1024)).toFixed(2);
      fileSize = `${sizeMB} MB`;
      fileUrl = URL.createObjectURL(selectedRealFile);
    }

    onAddAttachment(selectedStage.id, uploadFileType, uploadFileName, fileSize, fileUrl);
    setUploadFileName('');
    setSelectedRealFile(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSaveStyleEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editStyleCode || !editCustomer) return;

    onUpdateStyle(style.id, {
      styleCode: editStyleCode,
      customer: editCustomer,
      season: editSeason,
      buyer: editBuyer,
      factory: editFactory,
      driveUrl: editDriveUrl,
      patternQuantity: editPatternQuantity,
      sampleQuantity: editSampleQuantity,
      createdAt: editCreatedAt ? new Date(editCreatedAt).toISOString() : style.createdAt,
      status: editStatus
    });

    setShowEditStyleModal(false);
  };

  const handleConfirmDeleteStyle = () => {
    onDeleteStyle(style.id);
    setShowDeleteStyleConfirm(false);
  };

  // Helper icon by file type
  const renderFileTypeIcon = (type: FileType) => {
    switch (type) {
      case 'Excel':
        return <FileSpreadsheet className="w-4 h-4 text-emerald-600" />;
      case 'PDF':
        return <FileText className="w-4 h-4 text-rose-600" />;
      case 'Pattern':
      case 'DXF':
        return <FileCode className="w-4 h-4 text-purple-600" />;
      case 'Photo':
        return <Image className="w-4 h-4 text-amber-600" />;
      default:
        return <FileText className="w-4 h-4 text-blue-600" />;
    }
  };

  // Helper to color stages
  const getStageColorClasses = (stage: Stage) => {
    if (stage.status === 'Completed') {
      return {
        bg: 'bg-emerald-500 text-white border-emerald-500',
        badge: 'bg-emerald-50 text-emerald-700 border-emerald-200',
        line: 'bg-emerald-500'
      };
    }
    
    const deadlineDate = new Date(stage.deadline);
    const isOverdue = deadlineDate < currentDate;

    if (isOverdue) {
      return {
        bg: 'bg-rose-500 text-white border-rose-500 animate-pulse',
        badge: 'bg-rose-50 text-rose-700 border-rose-200',
        line: 'bg-slate-200'
      };
    }

    if (stage.status === 'InProgress') {
      return {
        bg: 'bg-blue-600 text-white border-blue-600',
        badge: 'bg-blue-50 text-blue-700 border-blue-200',
        line: 'bg-slate-200'
      };
    }

    if (stage.status === 'OnHold') {
      return {
        bg: 'bg-amber-400 text-white border-amber-400',
        badge: 'bg-amber-50 text-amber-700 border-amber-200',
        line: 'bg-slate-200'
      };
    }

    return {
      bg: 'bg-slate-100 text-slate-500 border-slate-200',
      badge: 'bg-slate-50 text-slate-500 border-slate-200',
      line: 'bg-slate-200'
    };
  };

  return (
    <div className="space-y-6" id="style-detail-root">
      {/* Navigation bar & Title & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div className="flex items-center gap-3">
          <button
            id="btn-style-detail-back"
            onClick={onBack}
            className="p-2 border border-slate-200 rounded-xl hover:bg-slate-50 text-slate-600 transition-all cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="font-sans font-bold text-slate-900 text-xl">{style.styleCode}</h1>
              <span className="text-slate-400 font-sans text-sm">•</span>
              <span className="font-sans text-slate-500 text-sm font-medium">{style.customer} ({style.season})</span>
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-blue-50 text-blue-700 border border-blue-200 rounded-lg text-xs font-bold font-mono">
                <Scissors className="w-3.5 h-3.5 text-blue-600" />
                <span>{style.patternQuantity ?? 1} Bộ rập</span>
              </span>
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-lg text-xs font-bold font-mono">
                <Shirt className="w-3.5 h-3.5 text-emerald-600" />
                <span>{style.sampleQuantity ?? 1} Chiếc mẫu</span>
              </span>
            </div>
            <p className="text-xs text-slate-400 font-sans mt-0.5">
              Cơ cấu nhà máy: <strong className="text-slate-600">{style.factory}</strong> | Buyer: <strong className="text-slate-600">{style.buyer}</strong>
            </p>
          </div>
        </div>

        {/* Action controls: Google Drive link, Edit, Delete & Change style state */}
        <div className="flex flex-wrap items-center gap-2.5 self-start sm:self-center">
          {style.driveUrl ? (
            <a
              id="btn-open-google-drive"
              href={style.driveUrl.startsWith('http') ? style.driveUrl : `https://${style.driveUrl}`}
              target="_blank"
              rel="noopener noreferrer"
              title="Mở Google Drive xem thông tin, hình ảnh liên quan đến style"
              className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 border border-emerald-300 text-emerald-800 hover:bg-emerald-100 text-xs font-bold rounded-xl transition-all shadow-sm cursor-pointer"
            >
              <ExternalLink className="w-3.5 h-3.5 text-emerald-600" />
              <span>Google Drive</span>
            </a>
          ) : (
            <button
              id="btn-add-google-drive"
              onClick={() => setShowEditStyleModal(true)}
              title="Thêm link Google Drive"
              className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 border border-slate-200 text-slate-600 hover:bg-slate-100 text-xs font-semibold rounded-xl transition-all cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5 text-blue-600" />
              <span>+ Link Drive</span>
            </button>
          )}

          <button
            id="btn-edit-style-info"
            onClick={() => setShowEditStyleModal(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-semibold rounded-xl transition-all shadow-sm cursor-pointer"
          >
            <Pencil className="w-3.5 h-3.5 text-blue-600" />
            <span>Chỉnh sửa thông tin</span>
          </button>

          <button
            id="btn-delete-style-info"
            onClick={() => setShowDeleteStyleConfirm(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-rose-50 border border-rose-200 text-rose-700 hover:bg-rose-100 text-xs font-semibold rounded-xl transition-all shadow-sm cursor-pointer"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Xóa đơn hàng</span>
          </button>

          <div className="flex items-center gap-2 pl-2 border-l border-slate-200">
            <span className="text-xs text-slate-400 font-sans font-medium shrink-0">Trạng thái:</span>
            <select
              id="select-style-status-update"
              value={style.status}
              onChange={e => onUpdateStyleStatus(style.id, e.target.value as Style['status'])}
              className="bg-slate-50 border border-slate-200 text-slate-700 rounded-xl px-3 py-1.5 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="Active">Active (May Mẫu)</option>
              <option value="Completed">Completed (Hoàn Tất)</option>
              <option value="OnHold">OnHold (Tạm Hoãn)</option>
              <option value="Cancelled">Cancelled (Hủy Mẫu)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Visual Sequence of Configured Stages */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-4">
        <h3 className="font-sans font-semibold text-slate-800 text-sm">Vòng đời May mẫu (Configured Workflow)</h3>
        
        {/* Horizontal steps flow */}
        <div className="relative flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 md:gap-2">
          {style.stages.map((st, index) => {
            const isSelected = st.id === selectedStageId;
            const colors = getStageColorClasses(st);
            const isLast = index === style.stages.length - 1;

            return (
              <div
                key={st.id}
                id={`workflow-step-${st.id}`}
                onClick={() => setSelectedStageId(st.id)}
                className={`flex-1 flex md:flex-col items-center gap-3 md:gap-2 p-3 md:p-2 rounded-xl border transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-blue-50/50 border-blue-300 ring-2 ring-blue-100 shadow-sm'
                    : 'bg-white border-transparent hover:bg-slate-50'
                }`}
              >
                {/* Visual Circle & Connecting Line */}
                <div className="relative flex items-center justify-center shrink-0">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center font-mono text-xs font-bold border-2 transition-all ${colors.bg}`}>
                    {index + 1}
                  </div>
                  {!isLast && (
                    <div className="hidden md:block absolute left-8 top-1/2 w-[calc(100vw/12)] h-0.5 bg-slate-200 -z-10" />
                  )}
                </div>

                {/* Text */}
                <div className="text-left md:text-center space-y-0.5">
                  <p className="text-xs font-semibold text-slate-800 font-sans line-clamp-1">{st.stageType}</p>
                  <p className="text-[10px] text-slate-400 font-sans">Hạn: {st.deadline}</p>
                  <span className={`inline-block px-1.5 py-0.5 rounded text-[9px] font-bold border ${colors.badge}`}>
                    {st.status}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Detail Grid: Edit Form (Left), Document manager & History trail (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left column: Stage Configuration / Editing Form */}
        {selectedStage ? (
          <div className="lg:col-span-7 bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-6">
            
            {/* Stage title */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div className="space-y-1">
                <span className="text-[10px] bg-slate-100 text-slate-600 font-bold px-2 py-0.5 rounded font-mono uppercase tracking-wider">
                  Khảo sát Giai đoạn
                </span>
                <h2 className="font-sans font-bold text-slate-800 text-base">{selectedStage.stageType}</h2>
              </div>

              {/* Status Warning Signal */}
              {(() => {
                const colors = getStageColorClasses(selectedStage);
                const isOverdue = new Date(selectedStage.deadline) < currentDate && selectedStage.status !== 'Completed';
                return (
                  <div className="flex items-center gap-1">
                    {isOverdue ? (
                      <span className="flex items-center gap-1 text-xs font-bold text-rose-600 bg-rose-50 border border-rose-100 px-2 py-1 rounded-lg">
                        <AlertTriangle className="w-3.5 h-3.5 animate-bounce" />
                        Trễ hạn!
                      </span>
                    ) : selectedStage.status === 'Completed' ? (
                      <span className="flex items-center gap-1 text-xs font-bold text-emerald-600 bg-emerald-50 border border-emerald-100 px-2 py-1 rounded-lg">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        Đã đóng
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 text-xs font-bold text-blue-600 bg-blue-50 border border-blue-100 px-2 py-1 rounded-lg">
                        <Clock className="w-3.5 h-3.5" />
                        Đang làm
                      </span>
                    )}
                  </div>
                );
              })()}
            </div>

            {/* Quick action: Update Status Checklist */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-700 font-sans">Cập nhật nhanh Trạng thái (Workflow Checklist)</label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {(['Pending', 'InProgress', 'Completed', 'OnHold'] as StageStatus[]).map(status => {
                  const isActive = selectedStage.status === status;
                  return (
                    <button
                      key={status}
                      type="button"
                      id={`btn-update-stage-status-${status}`}
                      onClick={() => handleUpdateStageStatus(status)}
                      className={`py-2 px-3 rounded-xl border text-xs font-sans font-semibold transition-all ${
                        isActive
                          ? 'bg-slate-900 border-slate-900 text-white shadow-sm'
                          : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      {status}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Thanh Theo Dõi & Giao Việc 3 Bước (Rập | Nguyên Phụ Liệu | May Mẫu) */}
            <div className="bg-slate-50/70 border border-slate-200 rounded-2xl p-4 space-y-4 shadow-sm" id="three-step-tracking-bar">
              <div className="flex items-center justify-between border-b border-slate-200/60 pb-3">
                <div className="space-y-0.5">
                  <h3 className="text-xs font-bold text-slate-900 font-sans uppercase tracking-wider flex items-center gap-2">
                    <Layers className="w-4 h-4 text-blue-600" />
                    Thanh Theo Dõi & Phân Công Giao Việc (3 Bước)
                  </h3>
                  <p className="text-[11px] text-slate-500 font-sans">
                    Phân công người phụ trách và theo dõi tiến độ từng khâu: Làm Rập, Nguyên Phụ Liệu, May Mẫu
                  </p>
                </div>
                {/* Visual Step Counter */}
                <span className="text-[11px] font-mono font-bold bg-white px-2.5 py-1 border border-slate-200 rounded-lg text-slate-700 shrink-0">
                  {((selectedStage.patternStatus === 'Completed' ? 1 : 0) +
                    (selectedStage.materialStatus === 'Completed' ? 1 : 0) +
                    (selectedStage.sewingStatus === 'Completed' ? 1 : 0))}/3 Bước Hoàn Thành
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {/* Step 1: Pattern Maker */}
                <div className={`p-3 rounded-xl border transition-all space-y-2.5 ${
                  selectedStage.patternStatus === 'Completed'
                    ? 'bg-emerald-50/40 border-emerald-200'
                    : selectedStage.patternStatus === 'InProgress'
                    ? 'bg-blue-50/40 border-blue-200'
                    : 'bg-white border-slate-200'
                }`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center shrink-0">
                        <Scissors className="w-3.5 h-3.5" />
                      </div>
                      <span className="text-xs font-bold text-slate-800 font-sans">1. Thiết kế Rập / CAD</span>
                    </div>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                      selectedStage.patternStatus === 'Completed'
                        ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                        : selectedStage.patternStatus === 'InProgress'
                        ? 'bg-blue-100 text-blue-800 border-blue-300'
                        : 'bg-slate-100 text-slate-600 border-slate-200'
                    }`}>
                      {selectedStage.patternStatus === 'Completed' ? 'Đã xong Rập' : selectedStage.patternStatus === 'InProgress' ? 'Đang vẽ Rập' : 'Chờ làm Rập'}
                    </span>
                  </div>

                  {/* Assignee Selection */}
                  <div className="space-y-1">
                    <label className="text-[10px] font-semibold text-slate-500 font-sans uppercase">Phụ trách Rập</label>
                    <select
                      value={selectedStage.patternAssigneeId || ''}
                      onChange={e => {
                        const newPatternAssignee = e.target.value || undefined;
                        onUpdateStage(selectedStage.id, {
                          patternAssigneeId: newPatternAssignee,
                          patternStatus: newPatternAssignee && !selectedStage.patternStatus ? 'InProgress' : selectedStage.patternStatus
                        });
                      }}
                      className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-slate-800 focus:ring-2 focus:ring-blue-500 font-sans"
                    >
                      <option value="">-- Chọn bạn làm Rập --</option>
                      {users.map(u => (
                        <option key={u.id} value={u.id}>
                          {u.name} ({u.role})
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Quick status toggles */}
                  <div className="flex items-center gap-1 pt-1">
                    {(['Pending', 'InProgress', 'Completed'] as StageStatus[]).map(st => (
                      <button
                        key={st}
                        type="button"
                        onClick={() => {
                          const newStatus = st;
                          const isAllCompleted = newStatus === 'Completed' && selectedStage.materialStatus === 'Completed' && selectedStage.sewingStatus === 'Completed';
                          onUpdateStage(selectedStage.id, {
                            patternStatus: newStatus,
                            status: isAllCompleted ? 'Completed' : 'InProgress',
                            progressPercent: isAllCompleted ? 100 : Math.max(selectedStage.progressPercent, 33)
                          });
                        }}
                        className={`flex-1 py-1 rounded text-[10px] font-bold font-sans transition-all border ${
                          (selectedStage.patternStatus || 'Pending') === st
                            ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                            : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-100'
                        }`}
                      >
                        {st === 'Pending' ? 'Chờ' : st === 'InProgress' ? 'Đang làm' : 'Xong'}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Step 2: Material / Fabric Prep */}
                <div className={`p-3 rounded-xl border transition-all space-y-2.5 ${
                  selectedStage.materialStatus === 'Completed'
                    ? 'bg-emerald-50/40 border-emerald-200'
                    : selectedStage.materialStatus === 'InProgress'
                    ? 'bg-amber-50/40 border-amber-200'
                    : 'bg-white border-slate-200'
                }`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-lg bg-amber-100 text-amber-800 flex items-center justify-center shrink-0">
                        <Package className="w-3.5 h-3.5" />
                      </div>
                      <span className="text-xs font-bold text-slate-800 font-sans">2. Nguyên Phụ Liệu & Vải</span>
                    </div>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                      selectedStage.materialStatus === 'Completed'
                        ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                        : selectedStage.materialStatus === 'InProgress'
                        ? 'bg-amber-100 text-amber-800 border-amber-300'
                        : 'bg-slate-100 text-slate-600 border-slate-200'
                    }`}>
                      {selectedStage.materialStatus === 'Completed' ? 'Đã đủ NPL' : selectedStage.materialStatus === 'InProgress' ? 'Đang chuẩn bị' : 'Chờ NPL'}
                    </span>
                  </div>

                  {/* Assignee Selection */}
                  <div className="space-y-1">
                    <label className="text-[10px] font-semibold text-slate-500 font-sans uppercase">Phụ trách NPL & Vải</label>
                    <select
                      value={selectedStage.materialAssigneeId || ''}
                      onChange={e => {
                        const newMatAssignee = e.target.value || undefined;
                        onUpdateStage(selectedStage.id, {
                          materialAssigneeId: newMatAssignee,
                          materialStatus: newMatAssignee && !selectedStage.materialStatus ? 'InProgress' : selectedStage.materialStatus
                        });
                      }}
                      className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-slate-800 focus:ring-2 focus:ring-amber-500 font-sans"
                    >
                      <option value="">-- Chọn bạn chuẩn bị NPL --</option>
                      {users.map(u => (
                        <option key={u.id} value={u.id}>
                          {u.name} ({u.role})
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Quick status toggles */}
                  <div className="flex items-center gap-1 pt-1">
                    {(['Pending', 'InProgress', 'Completed'] as StageStatus[]).map(st => (
                      <button
                        key={st}
                        type="button"
                        onClick={() => {
                          const newStatus = st;
                          const isAllCompleted = selectedStage.patternStatus === 'Completed' && newStatus === 'Completed' && selectedStage.sewingStatus === 'Completed';
                          onUpdateStage(selectedStage.id, {
                            materialStatus: newStatus,
                            status: isAllCompleted ? 'Completed' : 'InProgress',
                            progressPercent: isAllCompleted ? 100 : Math.max(selectedStage.progressPercent, 66)
                          });
                        }}
                        className={`flex-1 py-1 rounded text-[10px] font-bold font-sans transition-all border ${
                          (selectedStage.materialStatus || 'Pending') === st
                            ? 'bg-amber-600 text-white border-amber-600 shadow-sm'
                            : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-100'
                        }`}
                      >
                        {st === 'Pending' ? 'Chờ' : st === 'InProgress' ? 'Đang làm' : 'Đủ NPL'}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Step 3: Sewing */}
                <div className={`p-3 rounded-xl border transition-all space-y-2.5 ${
                  selectedStage.sewingStatus === 'Completed'
                    ? 'bg-emerald-50/40 border-emerald-200'
                    : selectedStage.sewingStatus === 'InProgress'
                    ? 'bg-purple-50/40 border-purple-200'
                    : 'bg-white border-slate-200'
                }`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-lg bg-purple-100 text-purple-800 flex items-center justify-center shrink-0">
                        <Shirt className="w-3.5 h-3.5" />
                      </div>
                      <span className="text-xs font-bold text-slate-800 font-sans">3. Phụ trách May Mẫu</span>
                    </div>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                      selectedStage.sewingStatus === 'Completed'
                        ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                        : selectedStage.sewingStatus === 'InProgress'
                        ? 'bg-purple-100 text-purple-800 border-purple-300'
                        : 'bg-slate-100 text-slate-600 border-slate-200'
                    }`}>
                      {selectedStage.sewingStatus === 'Completed' ? 'Đã may xong' : selectedStage.sewingStatus === 'InProgress' ? 'Đang may mẫu' : 'Chờ may'}
                    </span>
                  </div>

                  {/* Assignee Selection */}
                  <div className="space-y-1">
                    <label className="text-[10px] font-semibold text-slate-500 font-sans uppercase">Phụ trách May mẫu</label>
                    <select
                      value={selectedStage.sewingAssigneeId || ''}
                      onChange={e => {
                        const newSewAssignee = e.target.value || undefined;
                        onUpdateStage(selectedStage.id, {
                          sewingAssigneeId: newSewAssignee,
                          sewingStatus: newSewAssignee && !selectedStage.sewingStatus ? 'InProgress' : selectedStage.sewingStatus
                        });
                      }}
                      className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-slate-800 focus:ring-2 focus:ring-purple-500 font-sans"
                    >
                      <option value="">-- Chọn bạn May mẫu --</option>
                      {users.map(u => (
                        <option key={u.id} value={u.id}>
                          {u.name} ({u.role})
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Quick status toggles */}
                  <div className="flex items-center gap-1 pt-1">
                    {(['Pending', 'InProgress', 'Completed'] as StageStatus[]).map(st => (
                      <button
                        key={st}
                        type="button"
                        onClick={() => {
                          const newStatus = st;
                          const isAllCompleted = selectedStage.patternStatus === 'Completed' && selectedStage.materialStatus === 'Completed' && newStatus === 'Completed';
                          onUpdateStage(selectedStage.id, {
                            sewingStatus: newStatus,
                            status: isAllCompleted ? 'Completed' : 'InProgress',
                            progressPercent: isAllCompleted ? 100 : Math.max(selectedStage.progressPercent, 80)
                          });
                        }}
                        className={`flex-1 py-1 rounded text-[10px] font-bold font-sans transition-all border ${
                          (selectedStage.sewingStatus || 'Pending') === st
                            ? 'bg-purple-600 text-white border-purple-600 shadow-sm'
                            : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-100'
                        }`}
                      >
                        {st === 'Pending' ? 'Chờ' : st === 'InProgress' ? 'Đang may' : 'May xong'}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Configuration form parameters */}
            <div className="space-y-4">
              {/* Stage Type Label Customizer */}
              <div className="space-y-1.5 bg-blue-50/40 p-3 rounded-xl border border-blue-100">
                <label className="text-xs font-bold text-slate-800 font-sans flex items-center gap-1.5">
                  <Pencil className="w-3.5 h-3.5 text-blue-600" />
                  Đổi tên Nhãn phân loại Giai đoạn (Stage Label)
                </label>
                <div className="flex gap-2">
                  <input
                    id="input-stage-type-custom"
                    type="text"
                    placeholder="VD: Sale Samples, Production, Mẫu Chào Hàng..."
                    value={selectedStage.stageType}
                    onChange={e => onUpdateStage(selectedStage.id, { stageType: e.target.value })}
                    className="flex-1 bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-xs text-slate-800 font-bold focus:outline-none focus:ring-2 focus:ring-blue-500 font-sans"
                  />
                  <select
                    id="select-stage-type-preset"
                    value={['Proto Sample', 'Fit Sample', 'PP Sample', 'Size Set Sample', 'Sales Sample', 'TOP Sample', 'Final Approval', 'Production Ready', 'Sale Samples', 'Production'].includes(selectedStage.stageType) ? selectedStage.stageType : 'Custom'}
                    onChange={e => {
                      if (e.target.value !== 'Custom') {
                        onUpdateStage(selectedStage.id, { stageType: e.target.value });
                      }
                    }}
                    className="bg-white border border-slate-200 text-slate-700 rounded-xl px-2.5 py-1.5 text-xs font-sans"
                  >
                    <option value="Proto Sample">Proto Sample</option>
                    <option value="Fit Sample">Fit Sample</option>
                    <option value="PP Sample">PP Sample</option>
                    <option value="Size Set Sample">Size Set Sample</option>
                    <option value="Sales Sample">Sales Sample</option>
                    <option value="Sale Samples">Sale Samples</option>
                    <option value="TOP Sample">TOP Sample</option>
                    <option value="Final Approval">Final Approval</option>
                    <option value="Production Ready">Production Ready</option>
                    <option value="Production">Production</option>
                    <option value="Custom">-- Tùy chỉnh --</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-600 font-sans">Ngày tạo / Yêu cầu mẫu (Request Date)</label>
                  <div className="relative">
                    <Calendar className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      id="input-stage-request-date"
                      type="date"
                      value={selectedStage.requestDate}
                      onChange={e => onUpdateStage(selectedStage.id, { requestDate: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-700 font-sans focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-600 font-sans">Hạn chót hoàn thành (Deadline)</label>
                  <div className="relative">
                    <Calendar className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      id="input-stage-deadline"
                      type="date"
                      value={selectedStage.deadline}
                      onChange={e => onUpdateStage(selectedStage.id, { deadline: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-700 font-sans focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-600 font-sans">Ngày gửi Sample cho Buyer (Sent Date)</label>
                  <div className="relative">
                    <Calendar className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      id="input-stage-sent-date"
                      type="date"
                      value={selectedStage.sentDate || ''}
                      onChange={e => onUpdateStage(selectedStage.id, { sentDate: e.target.value || undefined })}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-700 font-sans focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-600 font-sans">Ngày vào sản xuất đại trà (Production Date)</label>
                  <div className="relative">
                    <Calendar className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      id="input-stage-production-date"
                      type="date"
                      value={selectedStage.productionDate || ''}
                      onChange={e => onUpdateStage(selectedStage.id, { productionDate: e.target.value || undefined })}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-700 font-sans focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-600 font-sans">Nhân viên Phụ trách (Assignee)</label>
                  <div className="relative">
                    <UserCheck className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <select
                      id="select-stage-assignee"
                      value={selectedStage.assigneeId || ''}
                      onChange={e => handleUpdateAssignee(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-700 font-sans focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Chưa phân công nhân viên</option>
                      {users.map(u => (
                        <option key={u.id} value={u.id}>
                          {u.name} ({u.role})
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-600 font-sans">Ngày hoàn thành thực tế</label>
                  <div className="relative">
                    <Calendar className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      id="input-stage-actual-completion"
                      type="date"
                      value={selectedStage.actualCompletionDate || ''}
                      onChange={e => onUpdateStage(selectedStage.id, { actualCompletionDate: e.target.value || undefined })}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-700 font-sans focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Note area */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-600 font-sans">Nhật ký kỹ thuật / Ghi chú</label>
              <textarea
                id="textarea-stage-notes"
                rows={3}
                placeholder="Nhập hướng dẫn kỹ thuật, kết quả fitting hoặc lý do trì hoãn..."
                value={selectedStage.note}
                onChange={e => handleUpdateNotes(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 font-sans"
              />
            </div>

            {/* Real Document & Pattern File Uploader */}
            <div className="border border-slate-200 rounded-2xl p-4 bg-slate-50/70 space-y-3">
              <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                <h4 className="text-xs font-bold text-slate-800 font-sans flex items-center gap-1.5">
                  <Upload className="w-3.5 h-3.5 text-blue-600" />
                  Tải lên File Tài liệu (Excel, PDF) & File Rập (CAD/Pattern)
                </h4>
                <span className="text-[10px] font-mono text-slate-500 bg-white border border-slate-200 px-2 py-0.5 rounded">
                  Hỗ trợ: .xlsx, .pdf, .dxf, .pds, .zip
                </span>
              </div>

              {/* File Drop/Selector area */}
              <div className="border-2 border-dashed border-slate-300 hover:border-blue-500 bg-white rounded-xl p-3 text-center cursor-pointer transition-all">
                <input
                  ref={fileInputRef}
                  type="file"
                  id="file-input-upload"
                  onChange={handleFileSelect}
                  accept=".xlsx,.xls,.csv,.pdf,.dxf,.pds,.plt,.pat,.zip,.rar,.dwg,.doc,.docx,image/*"
                  className="hidden"
                />
                <label htmlFor="file-input-upload" className="cursor-pointer block space-y-1">
                  <div className="flex items-center justify-center gap-2 text-blue-600 font-semibold text-xs font-sans">
                    <Upload className="w-4 h-4" />
                    <span>{selectedRealFile ? `Đã chọn: ${selectedRealFile.name}` : 'Bấm vào đây để chọn File từ máy tính (Excel, PDF, Rập...)'}</span>
                  </div>
                  <p className="text-[10px] text-slate-400">
                    Tự động nhận diện định dạng file.
                  </p>
                </label>
              </div>

              <form onSubmit={handleUploadFile} className="flex flex-col sm:flex-row gap-2.5 items-stretch sm:items-end pt-1">
                <div className="space-y-1 flex-1">
                  <label className="text-[10px] text-slate-500 font-sans block">Phân loại tài liệu</label>
                  <select
                    id="select-upload-file-type"
                    value={uploadFileType}
                    onChange={e => setUploadFileType(e.target.value as FileType)}
                    className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-700 font-sans"
                  >
                    <option value="Excel">📊 Bảng tính Excel (.xlsx, .xls, .csv)</option>
                    <option value="PDF">📄 Tài liệu PDF (.pdf)</option>
                    <option value="Pattern">📐 File Rập thiết kế (.dxf, .pds, .plt, .zip)</option>
                    <option value="DXF">📐 File CAD may mẫu (.dxf)</option>
                    <option value="TechPack">📘 TechPack / Hướng dẫn kỹ thuật</option>
                    <option value="BOM">📋 Định mức nguyên phụ liệu (BOM)</option>
                    <option value="MeasurementSheet">📏 Bảng thông số kích thước</option>
                    <option value="Photo">🖼️ Hình ảnh mẫu / Fitting (Photo)</option>
                    <option value="Email">✉️ Email phê duyệt</option>
                  </select>
                </div>

                <div className="space-y-1 flex-1">
                  <label className="text-[10px] text-slate-500 font-sans block">Tên hiển thị tài liệu</label>
                  <input
                    id="input-upload-file-name"
                    type="text"
                    required
                    placeholder="VD: Bang_Thong_So_Garment_2026.xlsx"
                    value={uploadFileName}
                    onChange={e => setUploadFileName(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-700 placeholder-slate-400 font-sans"
                  />
                </div>

                <button
                  id="btn-trigger-upload-file"
                  type="submit"
                  className="bg-blue-600 text-white hover:bg-blue-700 px-4 py-2 rounded-lg text-xs font-semibold font-sans transition-all flex items-center justify-center gap-1.5 shrink-0 h-[34px] cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Xác nhận Tải lên</span>
                </button>
              </form>
            </div>
          </div>
        ) : (
          <div className="lg:col-span-7 bg-white border border-slate-200 rounded-2xl p-12 shadow-sm text-center text-slate-400 font-sans">
            Hãy chọn một Giai đoạn ở hàng ngang phía trên để xem và cập nhật thông số.
          </div>
        )}

        {/* Right column: Document Archive & History audit trail */}
        <div className="lg:col-span-5 space-y-6">
          
          {/* Documents Archive */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-sans font-semibold text-slate-800 text-sm flex items-center gap-2">
                <FileText className="w-4 h-4 text-slate-600" />
                Kho lưu trữ tài liệu ({selectedStage ? selectedStage.stageType : 'Tổng quan'})
              </h3>
              <span className="text-[10px] bg-slate-100 text-slate-600 font-mono font-bold px-2 py-0.5 rounded">
                {attachments.filter(a => a.stageId === selectedStageId).length} file
              </span>
            </div>

            <div className="space-y-2.5">
              {(() => {
                const stageAttachments = attachments.filter(a => a.stageId === selectedStageId);
                
                if (stageAttachments.length === 0) {
                  return (
                    <div className="text-center py-6 border border-dashed border-slate-200 rounded-xl text-slate-400 text-xs font-sans">
                      Chưa có tài liệu đính kèm cho giai đoạn này. Hãy tải lên ở khung bên trái.
                    </div>
                  );
                }

                return stageAttachments.map(att => (
                  <div
                    key={att.id}
                    id={`attachment-card-${att.id}`}
                    className="flex items-center justify-between p-3 border border-slate-200 rounded-xl bg-slate-50/50 hover:bg-slate-50 transition-all gap-2"
                  >
                    <div className="flex items-start gap-2.5 overflow-hidden">
                      <div className="bg-white border border-slate-200 p-2 rounded-lg shrink-0 mt-0.5 shadow-2xs">
                        {renderFileTypeIcon(att.fileType)}
                      </div>
                      <div className="space-y-0.5 min-w-0">
                        <p className="text-xs font-bold text-slate-800 font-sans truncate">{att.fileName}</p>
                        <p className="text-[10px] text-slate-400 font-sans flex items-center gap-1.5 flex-wrap">
                          <span className="font-semibold text-blue-600">Loại: {att.fileType}</span>
                          <span>•</span>
                          <span>V{att.version}</span>
                          <span>•</span>
                          <span>{att.fileSize}</span>
                        </p>
                        <p className="text-[9px] text-slate-400 font-sans italic truncate">
                          Tải lên bởi: {att.uploadedBy.split(' (')[0]}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      {att.fileUrl && att.fileUrl !== '#' && (
                        <a
                          href={att.fileUrl}
                          download={att.fileName}
                          target="_blank"
                          rel="noreferrer"
                          title="Tải về file"
                          className="p-1.5 bg-white border border-slate-200 text-blue-600 hover:bg-blue-50 rounded-lg text-xs font-sans transition-all"
                        >
                          <Download className="w-3.5 h-3.5" />
                        </a>
                      )}
                      {onDeleteAttachment && (
                        <button
                          onClick={() => onDeleteAttachment(att.id)}
                          title="Xóa tài liệu"
                          className="p-1.5 bg-white border border-slate-200 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg text-xs font-sans transition-all cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                ));
              })()}
            </div>
          </div>

          {/* Activity Log / Audit Trail */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
            <h3 className="font-sans font-semibold text-slate-800 text-sm flex items-center gap-2">
              <History className="w-4 h-4 text-slate-600" />
              Nhật ký thay đổi (Audit Trail)
            </h3>

            <div className="space-y-3.5 max-h-72 overflow-y-auto pr-1">
              {styleLogs.length === 0 ? (
                <div className="text-center py-6 text-slate-400 text-xs font-sans">
                  Chưa ghi nhận lịch sử thay đổi nào.
                </div>
              ) : (
                styleLogs.map(log => (
                  <div key={log.id} className="flex gap-2.5 text-xs" id={`audit-log-item-${log.id}`}>
                    <div className="relative flex flex-col items-center shrink-0">
                      <div className="w-2.5 h-2.5 rounded-full bg-slate-400 border border-white ring-2 ring-slate-100 mt-1" />
                      <div className="w-0.5 h-full bg-slate-100" />
                    </div>
                    <div className="space-y-1">
                      <p className="text-slate-700 font-sans font-medium">{log.action}</p>
                      {log.oldValue !== undefined && log.newValue !== undefined && (
                        <div className="bg-slate-50 border border-slate-100 p-1.5 rounded-lg text-[10px] font-mono text-slate-500">
                          <span className="line-through text-rose-500">{log.oldValue}</span>
                          <span className="mx-1">→</span>
                          <span className="text-emerald-600 font-bold">{log.newValue}</span>
                        </div>
                      )}
                      <p className="text-[10px] text-slate-400 font-sans">
                        Bởi {log.changedByName} ({log.changedByRole}) • {new Date(log.changedAt).toLocaleTimeString('vi-VN')}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

        </div>

      </div>

      {/* Edit Style Modal */}
      {showEditStyleModal && (
        <div className="fixed inset-0 bg-slate-900/65 flex items-center justify-center p-4 z-50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full p-6 space-y-5 border border-slate-100">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-sans font-bold text-slate-900 text-base flex items-center gap-2">
                <Pencil className="w-4 h-4 text-blue-600" />
                Chỉnh sửa thông tin Mã hàng ({style.styleCode})
              </h3>
              <button
                onClick={() => setShowEditStyleModal(false)}
                className="text-slate-400 hover:text-slate-600 font-sans font-bold p-1 rounded-lg"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveStyleEdit} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700 font-sans">Mã hàng (Style Code) *</label>
                <input
                  type="text"
                  required
                  value={editStyleCode}
                  onChange={e => setEditStyleCode(e.target.value)}
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
                    onChange={e => setEditStatus(e.target.value as Style['status'])}
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
                    Số lượng Rập (Bộ rập)
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
                    Số lượng Mẫu (Chiếc may)
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
                  <ExternalLink className="w-3 h-3 text-emerald-600" />
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
                  Khách hàng bấm vào nút "Google Drive" sẽ chuyển đến link này để xem/tải tài liệu, hình ảnh.
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
                  onClick={() => setShowEditStyleModal(false)}
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
      {showDeleteStyleConfirm && (
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
              Bạn có chắc chắn muốn xóa mã hàng <strong className="text-slate-900 font-bold">{style.styleCode}</strong> ({style.customer}) cùng toàn bộ dữ liệu giai đoạn và file đính kèm?
            </p>

            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowDeleteStyleConfirm(false)}
                className="px-4 py-2 border border-slate-200 rounded-xl text-xs font-semibold text-slate-600 font-sans hover:bg-slate-50"
              >
                Hủy
              </button>
              <button
                type="button"
                onClick={handleConfirmDeleteStyle}
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
