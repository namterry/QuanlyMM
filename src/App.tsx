import React from 'react';
import { Style, Stage, User, Attachment, FileType, ActivityLog, Notification, StageType, StyleStatus } from './types';
import { DEPARTMENTS, USERS, INITIAL_STYLES, INITIAL_ATTACHMENTS, INITIAL_LOGS, INITIAL_NOTIFICATIONS } from './data/initialData';

// Modular Screen imports
import Dashboard from './components/Dashboard';
import StyleList from './components/StyleList';
import StyleDetail from './components/StyleDetail';
import GanttCalendar from './components/GanttCalendar';
import Reports from './components/Reports';
import NotificationsCenter from './components/NotificationsCenter';
import RoleSwitcher from './components/RoleSwitcher';

// Icons
import { Layers, Kanban, Calendar, TrendingUp, History, Shield, Menu, X, Bell, Plus, Search } from 'lucide-react';

export default function App() {
  // Navigation
  const [activeTab, setActiveTab] = React.useState<string>('dashboard');
  const [selectedStyleId, setSelectedStyleId] = React.useState<string | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);
  const [headerSearch, setHeaderSearch] = React.useState('');

  // Simulation parameters
  const [currentUser, setCurrentUser] = React.useState<User>(USERS[0]); // Nguyễn Văn Minh (Admin)
  
  // App state
  const [styles, setStyles] = React.useState<Style[]>(() => {
    const saved = localStorage.getItem('s_styles');
    return saved ? JSON.parse(saved) : INITIAL_STYLES;
  });

  const [attachments, setAttachments] = React.useState<Attachment[]>(() => {
    const saved = localStorage.getItem('s_attachments');
    return saved ? JSON.parse(saved) : INITIAL_ATTACHMENTS;
  });

  const [logs, setLogs] = React.useState<ActivityLog[]>(() => {
    const saved = localStorage.getItem('s_logs');
    return saved ? JSON.parse(saved) : INITIAL_LOGS;
  });

  const [notifications, setNotifications] = React.useState<Notification[]>(() => {
    const saved = localStorage.getItem('s_notifications');
    return saved ? JSON.parse(saved) : INITIAL_NOTIFICATIONS;
  });

  // Sync to local storage
  React.useEffect(() => {
    localStorage.setItem('s_styles', JSON.stringify(styles));
  }, [styles]);

  React.useEffect(() => {
    localStorage.setItem('s_attachments', JSON.stringify(attachments));
  }, [attachments]);

  React.setItem = (key: string, value: string) => {}; // safe override if any library acts up
  
  React.useEffect(() => {
    localStorage.setItem('s_logs', JSON.stringify(logs));
  }, [logs]);

  React.useEffect(() => {
    localStorage.setItem('s_notifications', JSON.stringify(notifications));
  }, [notifications]);

  // Actions

  // 1. Create new style with customized workflow configuration
  const handleAddStyle = (newStyleData: Omit<Style, 'id' | 'stages'> & { stages: { stageType: StageType; deadlineDays: number }[] }) => {
    const newStyleId = `style-${Date.now()}`;
    const baseRequestDate = new Date().toISOString().split('T')[0];

    // Compute stages based on deadlineOffsets
    const computedStages: Stage[] = newStyleData.stages.map((cfg, index) => {
      const reqDate = new Date();
      reqDate.setDate(reqDate.getDate() + (index > 0 ? newStyleData.stages[index - 1].deadlineDays : 0));
      
      const deadDate = new Date();
      deadDate.setDate(deadDate.getDate() + cfg.deadlineDays);

      return {
        id: `stage-${newStyleId}-${index}`,
        styleId: newStyleId,
        stageType: cfg.stageType,
        requestDate: reqDate.toISOString().split('T')[0],
        deadline: deadDate.toISOString().split('T')[0],
        status: index === 0 ? 'InProgress' : 'Pending', // First stage starts in progress automatically
        note: index === 0 ? 'Giai đoạn khởi đầu' : 'Chờ bắt đầu',
        progressPercent: index === 0 ? 10 : 0,
      };
    });

    const newStyle: Style = {
      id: newStyleId,
      styleCode: newStyleData.styleCode,
      customer: newStyleData.customer,
      season: newStyleData.season,
      buyer: newStyleData.buyer,
      factory: newStyleData.factory,
      status: 'Active',
      createdBy: currentUser.name,
      createdAt: new Date().toISOString(),
      stages: computedStages,
    };

    setStyles([newStyle, ...styles]);

    // Log the creation
    const newLog: ActivityLog = {
      id: `log-${Date.now()}`,
      styleId: newStyleId,
      styleCode: newStyle.styleCode,
      entityType: 'Style',
      entityId: newStyleId,
      action: `Khởi tạo mã hàng mới: ${newStyle.styleCode} (${newStyle.customer})`,
      changedBy: currentUser.id,
      changedByName: currentUser.name,
      changedByRole: currentUser.role,
      changedAt: new Date().toISOString(),
    };
    setLogs([newLog, ...logs]);

    // Navigate to details
    setSelectedStyleId(newStyleId);
    setActiveTab('styles');
  };

  // 2. Update properties of a stage (status, dates, notes, assignee)
  const handleUpdateStage = (stageId: string, updatedFields: Partial<Stage>) => {
    let oldVal = '';
    let newVal = '';
    let logAction = '';
    let targetStyleCode = '';
    let targetStyleId = '';

    const updatedStyles = styles.map(style => {
      const hasStage = style.stages.some(st => st.id === stageId);
      if (!hasStage) return style;

      targetStyleCode = style.styleCode;
      targetStyleId = style.id;

      const updatedStages = style.stages.map(st => {
        if (st.id !== stageId) return st;

        // Trace changes for activity log
        if (updatedFields.status !== undefined && updatedFields.status !== st.status) {
          oldVal = st.status;
          newVal = updatedFields.status;
          logAction = `Cập nhật Trạng thái giai đoạn "${st.stageType}"`;
        } else if (updatedFields.assigneeId !== undefined && updatedFields.assigneeId !== st.assigneeId) {
          const oldUser = USERS.find(u => u.id === st.assigneeId);
          const newUser = USERS.find(u => u.id === updatedFields.assigneeId);
          oldVal = oldUser ? oldUser.name : 'Chưa có';
          newVal = newUser ? newUser.name : 'Không gán';
          logAction = `Phân công phụ trách giai đoạn "${st.stageType}"`;
        } else if (updatedFields.note !== undefined && updatedFields.note !== st.note) {
          oldVal = st.note ? (st.note.length > 20 ? `${st.note.slice(0, 20)}...` : st.note) : 'Trống';
          newVal = updatedFields.note.length > 20 ? `${updatedFields.note.slice(0, 20)}...` : updatedFields.note;
          logAction = `Ghi chú ghi nhận ở giai đoạn "${st.stageType}"`;
        } else {
          logAction = `Cấu hình thông số giai đoạn "${st.stageType}"`;
        }

        return { ...st, ...updatedFields };
      });

      return { ...style, stages: updatedStages };
    });

    setStyles(updatedStyles);

    // Save Log
    const newLog: ActivityLog = {
      id: `log-${Date.now()}`,
      styleId: targetStyleId,
      styleCode: targetStyleCode,
      entityType: 'Stage',
      entityId: stageId,
      action: logAction,
      changedBy: currentUser.id,
      changedByName: currentUser.name,
      changedByRole: currentUser.role,
      changedAt: new Date().toISOString(),
      oldValue: oldVal || undefined,
      newValue: newVal || undefined,
    };
    setLogs([newLog, ...logs]);

    // Check if we should trigger warning triggers (like overdue alerts)
    if (updatedFields.status === 'Completed') {
      // Find completed stage deadline
      const theStyle = styles.find(s => s.id === targetStyleId);
      const theStage = theStyle?.stages.find(st => st.id === stageId);
      if (theStage) {
        const deadline = new Date(theStage.deadline);
        const actual = new Date();
        if (actual > deadline) {
          // completed late alert
          const diffDays = Math.ceil((actual.getTime() - deadline.getTime()) / (1000 * 60 * 60 * 24));
          const newNotif: Notification = {
            id: `notif-${Date.now()}`,
            userId: currentUser.id,
            message: `May Mẫu muộn: Giai đoạn "${theStage.stageType}" của mã hàng ${targetStyleCode} hoàn thành muộn ${diffDays} ngày so với deadline.`,
            isRead: false,
            relatedStyleId: targetStyleId,
            relatedStageId: stageId,
            createdAt: new Date().toISOString(),
          };
          setNotifications([newNotif, ...notifications]);
        }
      }
    }
  };

  // 3. Shift stage deadline in planner (Calendar drag and drop)
  const handleUpdateStageDeadline = (stageId: string, newDeadline: string) => {
    let targetStyleCode = '';
    let targetStyleId = '';
    let stageName = '';
    let oldDeadline = '';

    const updatedStyles = styles.map(style => {
      const hasStage = style.stages.some(st => st.id === stageId);
      if (!hasStage) return style;

      targetStyleId = style.id;
      targetStyleCode = style.styleCode;

      const updatedStages = style.stages.map(st => {
        if (st.id === stageId) {
          stageName = st.stageType;
          oldDeadline = st.deadline;
          return { ...st, deadline: newDeadline };
        }
        return st;
      });

      return { ...style, stages: updatedStages };
    });

    setStyles(updatedStyles);

    // Save Log for planning change
    const newLog: ActivityLog = {
      id: `log-${Date.now()}`,
      styleId: targetStyleId,
      styleCode: targetStyleCode,
      entityType: 'Stage',
      entityId: stageId,
      action: `Dời lịch hoàn thành giai đoạn "${stageName}" (Drag & Drop)`,
      changedBy: currentUser.id,
      changedByName: currentUser.name,
      changedByRole: currentUser.role,
      changedAt: new Date().toISOString(),
      oldValue: oldDeadline,
      newValue: newDeadline,
    };
    setLogs([newLog, ...logs]);

    // Notify of timeline adjustment
    const newNotif: Notification = {
      id: `notif-${Date.now()}`,
      userId: currentUser.id,
      message: `Điều chỉnh lịch trình: Mã hàng ${targetStyleCode} dời hạn hoàn thành "${stageName}" sang ${newDeadline}.`,
      isRead: false,
      relatedStyleId: targetStyleId,
      relatedStageId: stageId,
      createdAt: new Date().toISOString(),
    };
    setNotifications([newNotif, ...notifications]);
  };

  // 4. File uploads with auto incrementing versions
  const handleAddAttachment = (stageId: string, fileType: FileType, fileName: string, fileSize: string) => {
    // Find if a file with same type already exists for this stage to bump version
    const existingSameType = attachments.filter(a => a.stageId === stageId && a.fileType === fileType);
    const nextVersion = existingSameType.length + 1;

    const newAttachment: Attachment = {
      id: `att-${Date.now()}`,
      stageId,
      fileType,
      fileName: nextVersion > 1 ? `${fileName.split('.')[0]}_V${nextVersion}.${fileName.split('.')[1] || 'pdf'}` : fileName,
      fileUrl: '#',
      fileSize,
      version: nextVersion,
      uploadedBy: `${currentUser.name} (${currentUser.role})`,
      uploadedAt: new Date().toISOString(),
    };

    setAttachments([newAttachment, ...attachments]);

    // Find style info for logging
    const targetStyle = styles.find(style => style.stages.some(st => st.id === stageId));
    const targetStage = targetStyle?.stages.find(st => st.id === stageId);

    // Write Log
    const newLog: ActivityLog = {
      id: `log-${Date.now()}`,
      styleId: targetStyle?.id,
      styleCode: targetStyle?.styleCode,
      entityType: 'Attachment',
      entityId: newAttachment.id,
      action: `Tải lên tài liệu kỹ thuật loại "${fileType}" (phiên bản V${nextVersion})`,
      changedBy: currentUser.id,
      changedByName: currentUser.name,
      changedByRole: currentUser.role,
      changedAt: new Date().toISOString(),
      newValue: newAttachment.fileName,
    };
    setLogs([newLog, ...logs]);
  };

  // 5. Update parent Style status
  const handleUpdateStyleStatus = (styleId: string, status: StyleStatus) => {
    let targetStyleCode = '';
    const updatedStyles = styles.map(style => {
      if (style.id === styleId) {
        targetStyleCode = style.styleCode;
        return { ...style, status };
      }
      return style;
    });

    setStyles(updatedStyles);

    // Save Log
    const newLog: ActivityLog = {
      id: `log-${Date.now()}`,
      styleId,
      styleCode: targetStyleCode,
      entityType: 'Style',
      entityId: styleId,
      action: `Cập nhật Trạng thái Mã hàng thành "${status}"`,
      changedBy: currentUser.id,
      changedByName: currentUser.name,
      changedByRole: currentUser.role,
      changedAt: new Date().toISOString(),
      newValue: status,
    };
    setLogs([newLog, ...logs]);
  };

  // 6. Read notifications
  const handleMarkNotifRead = (id: string) => {
    setNotifications(notifications.map(n => n.id === id ? { ...n, isRead: true } : n));
  };

  const handleClearNotifications = () => {
    setNotifications(notifications.map(n => ({ ...n, isRead: true })));
  };

  const handleSelectStyleFromWidget = (styleId: string) => {
    setSelectedStyleId(styleId);
    setActiveTab('styles');
  };

  return (
    <div className="flex h-screen w-screen bg-[#F8FAFC] text-slate-800 font-sans overflow-hidden" id="application-root">
      
      {/* Sidebar Navigation: Desktop View */}
      <aside className="w-60 h-full bg-[#0F172A] text-slate-300 flex flex-col border-r border-slate-800 shrink-0 hidden md:flex" id="desktop-sidebar">
        {/* Brand header */}
        <div className="p-4 flex items-center gap-2 border-b border-slate-800 bg-[#1E293B]">
          <div className="w-8 h-8 bg-blue-600 rounded flex items-center justify-center shadow-md shrink-0">
            <span className="text-white font-extrabold text-sm font-display">GD</span>
          </div>
          <div className="overflow-hidden">
            <h2 className="font-display font-extrabold text-white text-xs tracking-tight uppercase leading-none truncate">GarmentFlow Pro</h2>
            <span className="text-[9px] text-slate-500 font-mono tracking-widest uppercase block mt-1 truncate">Sample Lifecycle</span>
          </div>
        </div>

        {/* Navigation list */}
        <nav className="flex-1 py-4 px-2.5 space-y-1 overflow-y-auto">
          <div className="text-[9px] uppercase font-bold text-slate-500 px-3 py-1.5 tracking-wider font-sans">MANAGEMENT</div>
          <button
            id="nav-tab-dashboard"
            onClick={() => { setActiveTab('dashboard'); setSelectedStyleId(null); }}
            className={`w-full flex items-center gap-3 px-3 py-2 rounded font-medium text-xs border-l-2 transition-all cursor-pointer ${
              activeTab === 'dashboard'
                ? 'bg-blue-600/10 text-blue-400 border-blue-500 font-semibold'
                : 'text-slate-400 hover:bg-slate-800/50 hover:text-slate-200 border-transparent'
            }`}
          >
            <TrendingUp className="w-4 h-4 shrink-0 text-slate-400 group-hover:text-slate-200" />
            <span>Tổng Quan (Dashboard)</span>
          </button>

          <button
            id="nav-tab-styles"
            onClick={() => { setActiveTab('styles'); }}
            className={`w-full flex items-center gap-3 px-3 py-2 rounded font-medium text-xs border-l-2 transition-all cursor-pointer ${
              activeTab === 'styles'
                ? 'bg-blue-600/10 text-blue-400 border-blue-500 font-semibold'
                : 'text-slate-400 hover:bg-slate-800/50 hover:text-slate-200 border-transparent'
            }`}
          >
            <Layers className="w-4 h-4 shrink-0 text-slate-400" />
            <span>Mã hàng & Workflow</span>
          </button>

          <div className="text-[9px] uppercase font-bold text-slate-500 px-3 py-1.5 tracking-wider font-sans pt-4">LOGISTICS</div>
          <button
            id="nav-tab-planner"
            onClick={() => { setActiveTab('planner'); setSelectedStyleId(null); }}
            className={`w-full flex items-center gap-3 px-3 py-2 rounded font-medium text-xs border-l-2 transition-all cursor-pointer ${
              activeTab === 'planner'
                ? 'bg-blue-600/10 text-blue-400 border-blue-500 font-semibold'
                : 'text-slate-400 hover:bg-slate-800/50 hover:text-slate-200 border-transparent'
            }`}
          >
            <Calendar className="w-4 h-4 shrink-0 text-slate-400" />
            <span>Kế hoạch mẫu (Planner)</span>
          </button>

          <button
            id="nav-tab-reports"
            onClick={() => { setActiveTab('reports'); setSelectedStyleId(null); }}
            className={`w-full flex items-center gap-3 px-3 py-2 rounded font-medium text-xs border-l-2 transition-all cursor-pointer ${
              activeTab === 'reports'
                ? 'bg-blue-600/10 text-blue-400 border-blue-500 font-semibold'
                : 'text-slate-400 hover:bg-slate-800/50 hover:text-slate-200 border-transparent'
            }`}
          >
            <History className="w-4 h-4 shrink-0 text-slate-400" />
            <span>Báo cáo & KPI</span>
          </button>
        </nav>

        {/* User profile at bottom */}
        <div className="p-4 border-t border-slate-800 flex items-center gap-3 bg-slate-950/40 shrink-0">
          <img
            src={currentUser.avatar}
            alt={currentUser.name}
            className="w-8 h-8 rounded-full border border-slate-700 object-cover shrink-0"
            referrerPolicy="no-referrer"
          />
          <div className="overflow-hidden text-left leading-none">
            <div className="text-xs font-bold text-white truncate">{currentUser.name.split(' (')[0]}</div>
            <div className="text-[9px] text-slate-500 truncate uppercase font-semibold tracking-wider mt-1">{currentUser.role}</div>
          </div>
        </div>
      </aside>

      {/* Mobile Drawer Menu Sidebar Overlay */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 md:hidden flex" id="mobile-menu-panel">
          {/* Backdrop blur overlay */}
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity" onClick={() => setMobileMenuOpen(false)}></div>
          {/* Sidebar drawer body */}
          <aside className="relative w-64 h-full bg-[#0F172A] text-slate-300 flex flex-col z-50 animate-in slide-in-from-left duration-200">
            <div className="p-4 flex items-center justify-between border-b border-slate-800 bg-[#1E293B]">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-blue-600 rounded flex items-center justify-center">
                  <span className="text-white font-extrabold text-xs font-display">GD</span>
                </div>
                <div>
                  <h2 className="font-display font-extrabold text-white text-xs tracking-tight uppercase leading-none">GarmentFlow</h2>
                  <span className="text-[9px] text-slate-500 font-mono tracking-widest uppercase block mt-1">Sample Lifecycle</span>
                </div>
              </div>
              <button onClick={() => setMobileMenuOpen(false)} className="text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-slate-800/80">
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Links */}
            <nav className="flex-1 py-4 px-2.5 space-y-1 overflow-y-auto">
              <button
                onClick={() => { setActiveTab('dashboard'); setSelectedStyleId(null); setMobileMenuOpen(false); }}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded font-medium text-xs border-l-2 transition-all ${
                  activeTab === 'dashboard' ? 'bg-blue-600/10 text-blue-400 border-blue-500 font-semibold' : 'text-slate-400 hover:bg-slate-800'
                }`}
              >
                <TrendingUp className="w-4 h-4 shrink-0" />
                <span>Tổng Quan (Dashboard)</span>
              </button>
              <button
                onClick={() => { setActiveTab('styles'); setMobileMenuOpen(false); }}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded font-medium text-xs border-l-2 transition-all ${
                  activeTab === 'styles' ? 'bg-blue-600/10 text-blue-400 border-blue-500 font-semibold' : 'text-slate-400 hover:bg-slate-800'
                }`}
              >
                <Layers className="w-4 h-4 shrink-0" />
                <span>Mã hàng & Workflow</span>
              </button>
              <button
                onClick={() => { setActiveTab('planner'); setSelectedStyleId(null); setMobileMenuOpen(false); }}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded font-medium text-xs border-l-2 transition-all ${
                  activeTab === 'planner' ? 'bg-blue-600/10 text-blue-400 border-blue-500 font-semibold' : 'text-slate-400 hover:bg-slate-800'
                }`}
              >
                <Calendar className="w-4 h-4 shrink-0" />
                <span>Kế hoạch mẫu (Planner)</span>
              </button>
              <button
                onClick={() => { setActiveTab('reports'); setSelectedStyleId(null); setMobileMenuOpen(false); }}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded font-medium text-xs border-l-2 transition-all ${
                  activeTab === 'reports' ? 'bg-blue-600/10 text-blue-400 border-blue-500 font-semibold' : 'text-slate-400 hover:bg-slate-800'
                }`}
              >
                <History className="w-4 h-4 shrink-0" />
                <span>Báo cáo & KPI</span>
              </button>
            </nav>

            {/* Profile */}
            <div className="p-4 border-t border-slate-800 flex items-center gap-3 bg-slate-950/40 shrink-0 mt-auto">
              <img
                src={currentUser.avatar}
                alt={currentUser.name}
                className="w-8 h-8 rounded-full border border-slate-700 object-cover"
                referrerPolicy="no-referrer"
              />
              <div className="overflow-hidden text-left leading-none">
                <div className="text-xs font-bold text-white truncate">{currentUser.name.split(' (')[0]}</div>
                <div className="text-[9px] text-slate-500 truncate uppercase font-semibold mt-1">{currentUser.role}</div>
              </div>
            </div>
          </aside>
        </div>
      )}

      {/* Main Content Pane */}
      <div className="flex-1 flex flex-col h-full overflow-hidden">
        {/* Top Sticky High Density Header */}
        <header className="h-14 bg-white border-b border-slate-200 flex items-center justify-between px-4 md:px-6 shrink-0 sticky top-0 z-20" id="main-header">
          {/* Left search & title combo */}
          <div className="flex items-center gap-4 flex-1">
            <h1 className="text-xs font-black text-slate-800 font-display uppercase tracking-widest hidden lg:block">
              {activeTab === 'dashboard' ? 'Project Overview' : activeTab === 'styles' ? 'Style Library' : activeTab === 'planner' ? 'Gantt Scheduler' : 'KPI Reports'}
            </h1>

            {/* Mobile Brand indicator */}
            <div className="flex items-center gap-2 md:hidden">
              <div className="bg-blue-600 text-white p-1 rounded font-extrabold text-xs">GD</div>
            </div>

            {/* Global Search Tool with results popover */}
            <div className="relative w-full max-w-xs ml-2 md:ml-0">
              <input
                type="text"
                placeholder="Tìm nhanh mã hàng..."
                value={headerSearch}
                onChange={(e) => setHeaderSearch(e.target.value)}
                className="w-full pl-8 pr-4 py-1.5 text-xs bg-slate-100 border-none rounded-md focus:ring-1 focus:ring-blue-500 font-sans focus:outline-none placeholder-slate-400"
              />
              <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-slate-400" />
              
              {headerSearch && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-slate-200 rounded-lg shadow-xl max-h-60 overflow-y-auto z-50 p-1">
                  {styles.filter(s => s.styleCode.toLowerCase().includes(headerSearch.toLowerCase())).length === 0 ? (
                    <div className="text-center py-3 text-xs text-slate-400 font-sans">Không tìm thấy mã hàng</div>
                  ) : (
                    styles.filter(s => s.styleCode.toLowerCase().includes(headerSearch.toLowerCase())).map(style => (
                      <button
                        key={style.id}
                        onClick={() => {
                          setSelectedStyleId(style.id);
                          setActiveTab('styles');
                          setHeaderSearch('');
                        }}
                        className="w-full text-left px-3 py-2 text-xs hover:bg-slate-50 rounded-md flex items-center justify-between transition-colors font-sans"
                      >
                        <div>
                          <span className="font-bold text-slate-900">{style.styleCode}</span>
                          <span className="text-[10px] text-slate-400 ml-2">({style.customer})</span>
                        </div>
                        <span className={`text-[9px] px-1.5 py-0.5 rounded uppercase font-bold ${
                          style.status === 'Active' ? 'bg-blue-50 text-blue-600' : 'bg-green-50 text-green-600'
                        }`}>{style.status}</span>
                      </button>
                    ))
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Right quick actions */}
          <div className="flex items-center gap-3">
            {/* Quick add style shortcut if in Styles list view */}
            {activeTab === 'styles' && !selectedStyleId && (
              <button
                onClick={() => {
                  const addStyleBtn = document.getElementById('btn-open-add-style-modal');
                  if (addStyleBtn) addStyleBtn.click();
                }}
                className="flex items-center gap-1.5 bg-blue-600 text-white text-xs font-bold px-3 py-1.5 rounded-md hover:bg-blue-700 transition-colors shrink-0 font-sans"
              >
                <Plus className="w-3 h-3" />
                <span>NEW STYLE</span>
              </button>
            )}

            <div className="w-px h-5 bg-slate-200 hidden sm:block"></div>

            {/* Alerts Notifications Center Widget */}
            <NotificationsCenter
              notifications={notifications}
              onMarkAsRead={handleMarkNotifRead}
              onClearAll={handleClearNotifications}
              onSelectStyle={handleSelectStyleFromWidget}
            />

            <div className="w-px h-5 bg-slate-200 hidden md:block"></div>

            {/* Profile display info inside header */}
            <div className="hidden sm:flex items-center gap-2 pl-1">
              <img
                src={currentUser.avatar}
                alt={currentUser.name}
                className="w-7 h-7 rounded-full border border-slate-200 object-cover shrink-0"
                referrerPolicy="no-referrer"
              />
              <div className="text-left leading-none hidden md:block">
                <p className="text-[10px] font-bold text-slate-800 font-sans">{currentUser.name.split(' (')[0]}</p>
                <span className="text-[8px] text-blue-600 font-bold uppercase tracking-wider font-sans mt-0.5 block">{currentUser.role}</span>
              </div>
            </div>

            {/* Mobile menu toggle */}
            <button
              id="btn-mobile-menu-toggle"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-1.5 text-slate-500 hover:bg-slate-100 rounded-lg shrink-0"
            >
              {mobileMenuOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
            </button>
          </div>
        </header>

        {/* Dynamic Workspace Container */}
        <main className="flex-1 overflow-y-auto p-4 md:p-6 bg-[#F8FAFC]">
          {(() => {
            if (activeTab === 'dashboard') {
              return (
                <Dashboard
                  styles={styles}
                  onSelectStyle={handleSelectStyleFromWidget}
                  onNavigate={setActiveTab}
                />
              );
            }

            if (activeTab === 'styles') {
              if (selectedStyleId) {
                const selectedStyle = styles.find(s => s.id === selectedStyleId);
                if (selectedStyle) {
                  return (
                    <StyleDetail
                      style={selectedStyle}
                      currentUser={currentUser}
                      onBack={() => setSelectedStyleId(null)}
                      onUpdateStage={handleUpdateStage}
                      onAddAttachment={handleAddAttachment}
                      onUpdateStyleStatus={handleUpdateStyleStatus}
                      attachments={attachments}
                      logs={logs}
                    />
                  );
                }
              }

              return (
                <StyleList
                  styles={styles}
                  onSelectStyle={setSelectedStyleId}
                  onAddStyle={handleAddStyle}
                />
              );
            }

            if (activeTab === 'planner') {
              return (
                <GanttCalendar
                  styles={styles}
                  onUpdateStageDeadline={handleUpdateStageDeadline}
                  onSelectStyle={handleSelectStyleFromWidget}
                />
              );
            }

            if (activeTab === 'reports') {
              return <Reports styles={styles} />;
            }

            return null;
          })()}
        </main>

        {/* Small Sticky Footer info */}
        <footer className="bg-white border-t border-slate-200 py-2.5 px-6 text-left text-[10px] text-slate-400 font-sans shrink-0 flex items-center justify-between">
          <p>© 2026 GarmentFlow. Designed with High Density precision workspace.</p>
          <div className="flex gap-4 font-mono text-[9px] uppercase tracking-wider text-slate-400">
            <span>Server: OK</span>
            <span>Locale: VN</span>
          </div>
        </footer>
      </div>

      {/* Floating RBAC Switcher Simulation Widget */}
      <RoleSwitcher
        currentRole={currentUser.role}
        currentUser={currentUser}
        onUserChange={setCurrentUser}
      />
    </div>
  );
}
