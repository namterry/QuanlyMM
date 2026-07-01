import React from 'react';
import { Style, Stage, StageStatus, User, Attachment, FileType, ActivityLog, Role } from '../types';
import { USERS } from '../data/initialData';
import {
  ArrowLeft, Calendar, UserCheck, CheckCircle2, Clock, AlertTriangle, FileText, Upload,
  Plus, History, ShieldAlert, Sparkles, AlertCircle, RefreshCw
} from 'lucide-react';

interface StyleDetailProps {
  style: Style;
  currentUser: User;
  onBack: () => void;
  onUpdateStage: (stageId: string, updatedFields: Partial<Stage>) => void;
  onAddAttachment: (stageId: string, fileType: FileType, fileName: string, fileSize: string) => void;
  onUpdateStyleStatus: (styleId: string, status: Style['status']) => void;
  attachments: Attachment[];
  logs: ActivityLog[];
}

export default function StyleDetail({
  style,
  currentUser,
  onBack,
  onUpdateStage,
  onAddAttachment,
  onUpdateStyleStatus,
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

  // Get logs related to this style
  const styleLogs = logs.filter(log => log.styleId === style.id);

  // Check role-based edit permission for the selected stage
  const hasEditPermission = (stage: Stage): { allowed: boolean; reason?: string } => {
    if (currentUser.role === 'Admin' || currentUser.role === 'Merchandising') {
      return { allowed: true };
    }

    // Role department limit
    // Admin, Merchandising have all access.
    // Others can only edit stages where they are the assignee or matches their department
    if (stage.assigneeId === currentUser.id) {
      return { allowed: true };
    }

    // Match departments
    // Pattern Role -> dept-pa
    // Sample Room -> dept-sr
    // CAD -> dept-cad
    // IE -> dept-ie
    // QA -> dept-qa
    const departmentMap: Record<Role, string> = {
      'Admin': 'dept-mr',
      'Merchandising': 'dept-mr',
      'Pattern': 'dept-pa',
      'Sample Room': 'dept-sr',
      'CAD': 'dept-cad',
      'IE': 'dept-ie',
      'QA': 'dept-qa'
    };

    const userDeptId = currentUser.departmentId;
    const assignee = USERS.find(u => u.id === stage.assigneeId);
    
    if (assignee && assignee.departmentId === userDeptId) {
      return { allowed: true };
    }

    // Fallback: If stage has no assignee, can they claim it if they are from the relevant department?
    // Let's say yes, if they match.
    return {
      allowed: false,
      reason: `Bạn ở bộ phận "${currentUser.role}". Chỉ Admin, Merchandising hoặc Nhân viên được phân công (${assignee ? assignee.name : 'Không rõ'}) mới được quyền sửa.`
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

  const handleUploadFile = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStage || !uploadFileName) return;

    const perm = hasEditPermission(selectedStage);
    if (!perm.allowed) {
      alert(perm.reason);
      return;
    }

    // Simulate S3 presigned URL upload & filesize
    const randomSize = `${(Math.random() * 5 + 1).toFixed(1)} MB`;
    onAddAttachment(selectedStage.id, uploadFileType, uploadFileName, randomSize);
    setUploadFileName('');
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
      {/* Navigation bar & Title */}
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
            </div>
            <p className="text-xs text-slate-400 font-sans mt-0.5">
              Cơ cấu nhà máy: <strong className="text-slate-600">{style.factory}</strong> | Buyer: <strong className="text-slate-600">{style.buyer}</strong>
            </p>
          </div>
        </div>

        {/* Change style state */}
        <div className="flex items-center gap-2 self-start sm:self-center">
          <span className="text-xs text-slate-400 font-sans font-medium shrink-0">Trạng thái mã:</span>
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

      {/* Visual Sequence of Configured Stages (Workflow progress bar) */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-4">
        <h3 className="font-sans font-semibold text-slate-800 text-sm">Vòng đời May mẫu (Configured Workflow Workflow)</h3>
        
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
                  {/* Line element (only on desktop) */}
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
        
        {/* Left column: Stage Configuration / Editing Form (7/12 width) */}
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

            {/* Configuration form parameters */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-600 font-sans">Ngày yêu cầu (Request Date)</label>
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
                <label className="text-xs font-semibold text-slate-600 font-sans">Hạn hoàn thành (Deadline)</label>
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
                    {USERS.map(u => (
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

            {/* Simulated S3 Presigned Document Uploader */}
            <div className="border border-slate-100 rounded-2xl p-4 bg-slate-50/50 space-y-3">
              <div className="flex items-center justify-between border-b border-slate-200/60 pb-2">
                <h4 className="text-xs font-bold text-slate-700 font-sans flex items-center gap-1.5">
                  <Upload className="w-3.5 h-3.5 text-blue-600" />
                  Tải lên tài liệu mẫu (AWS S3 Presigned URL)
                </h4>
                <span className="text-[10px] font-mono text-slate-400">Version Auto Increment</span>
              </div>

              <form onSubmit={handleUploadFile} className="flex flex-col sm:flex-row gap-2.5 items-stretch sm:items-end">
                <div className="space-y-1 flex-1">
                  <label className="text-[10px] text-slate-500 font-sans block">Loại file tài liệu</label>
                  <select
                    id="select-upload-file-type"
                    value={uploadFileType}
                    onChange={e => setUploadFileType(e.target.value as FileType)}
                    className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-700 font-sans"
                  >
                    <option value="Pattern">Rập giấy / Rập rải (Pattern)</option>
                    <option value="DXF">Định dạng CAD (DXF)</option>
                    <option value="TechPack">Tài liệu kỹ thuật (TechPack)</option>
                    <option value="BOM">Định mức vật tư (BOM)</option>
                    <option value="MeasurementSheet">Bảng thông số (MeasurementSheet)</option>
                    <option value="Photo">Hình ảnh Fitting (Photo)</option>
                    <option value="Email">Email phê duyệt (Email)</option>
                  </select>
                </div>

                <div className="space-y-1 flex-1">
                  <label className="text-[10px] text-slate-500 font-sans block">Tên file tài liệu</label>
                  <input
                    id="input-upload-file-name"
                    type="text"
                    required
                    placeholder="VD: Rap_SizeSet_V2.dxf"
                    value={uploadFileName}
                    onChange={e => setUploadFileName(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-700 placeholder-slate-400 font-sans"
                  />
                </div>

                <button
                  id="btn-trigger-upload-file"
                  type="submit"
                  className="bg-blue-600 text-white hover:bg-blue-700 px-4 py-2 rounded-lg text-xs font-semibold font-sans transition-all flex items-center justify-center gap-1.5 shrink-0 h-[30px]"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Tải lên
                </button>
              </form>
            </div>
          </div>
        ) : (
          <div className="lg:col-span-7 bg-white border border-slate-200 rounded-2xl p-12 shadow-sm text-center text-slate-400 font-sans">
            Hãy chọn một Giai đoạn ở hàng ngang phía trên để xem và cập nhật thông số.
          </div>
        )}

        {/* Right column: Document Archive & History audit trail (5/12 width) */}
        <div className="lg:col-span-5 space-y-6">
          
          {/* Documents Archive */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
            <h3 className="font-sans font-semibold text-slate-800 text-sm flex items-center gap-2">
              <FileText className="w-4 h-4 text-slate-600" />
              Kho lưu trữ tài liệu ({selectedStage ? selectedStage.stageType : 'Tổng quan'})
            </h3>

            <div className="space-y-2.5">
              {(() => {
                const stageAttachments = attachments.filter(a => a.stageId === selectedStageId);
                
                if (stageAttachments.length === 0) {
                  return (
                    <div className="text-center py-6 border border-dashed border-slate-200 rounded-xl text-slate-400 text-xs font-sans">
                      Không có tài liệu đính kèm cho giai đoạn này.
                    </div>
                  );
                }

                return stageAttachments.map(att => (
                  <div
                    key={att.id}
                    id={`attachment-card-${att.id}`}
                    className="flex items-center justify-between p-3 border border-slate-100 rounded-xl bg-slate-50/50 hover:bg-slate-50 transition-all"
                  >
                    <div className="flex items-start gap-2.5">
                      <div className="bg-blue-50 text-blue-600 p-2 rounded-lg shrink-0 mt-0.5">
                        <FileText className="w-4 h-4" />
                      </div>
                      <div className="space-y-0.5">
                        <p className="text-xs font-bold text-slate-800 font-sans line-clamp-1">{att.fileName}</p>
                        <p className="text-[10px] text-slate-400 font-sans flex items-center gap-1.5">
                          <span className="font-semibold text-blue-600">Loại: {att.fileType}</span>
                          <span>•</span>
                          <span>V{att.version}</span>
                          <span>•</span>
                          <span>{att.fileSize}</span>
                        </p>
                        <p className="text-[9px] text-slate-400 font-sans italic">
                          Tải lên bởi: {att.uploadedBy.split(' (')[0]} vào {new Date(att.uploadedAt).toLocaleDateString('vi-VN')}
                        </p>
                      </div>
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
    </div>
  );
}
