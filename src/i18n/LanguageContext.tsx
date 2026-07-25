import React, { createContext, useContext, useState, useEffect } from 'react';

export type Language = 'vi' | 'en';

export interface Translations {
  // Navigation & Header
  appTitle: string;
  appSubtitle: string;
  searchPlaceholder: string;
  tabDashboard: string;
  tabStyles: string;
  tabCalendar: string;
  tabReports: string;
  tabAi: string;
  
  // Header profile & Role
  roleLabel: string;
  editStaff: string;
  notifications: string;
  markAllRead: string;
  noNotifications: string;
  
  // Dashboard
  totalStyles: string;
  onTrack: string;
  atRisk: string;
  completed: string;
  delayRate: string;
  stageProgress: string;
  recentActivities: string;
  addNewStyle: string;
  quickStats: string;

  // Style List & Filters
  allSeasons: string;
  allStatuses: string;
  statusActive: string;
  statusCompleted: string;
  statusPending: string;
  statusOnHold: string;
  statusCancelled: string;
  filterByCustomer: string;
  styleCode: string;
  customer: string;
  buyer: string;
  factory: string;
  season: string;
  actions: string;
  viewDetails: string;
  editStyle: string;
  deleteStyle: string;
  driveLink: string;
  createdDate: string;
  
  // Style Detail & Stages
  backToList: string;
  stageWorkflow: string;
  requestDate: string;
  deadline: string;
  sentDate: string;
  productionDate: string;
  actualCompletion: string;
  assignee: string;
  unassigned: string;
  stageStatus: string;
  notStarted: string;
  inProgress: string;
  completedStage: string;
  overdueStage: string;
  stageLabel: string;
  commentsAndFeedback: string;
  addComment: string;
  typeCommentPlaceholder: string;
  attachments: string;
  uploadAttachment: string;
  historyLogs: string;
  saveChanges: string;
  cancel: string;
  deleteConfirm: string;
  
  // Personnel Manager Modal
  personnelManagerTitle: string;
  personnelManagerSubtitle: string;
  totalPersonnel: string;
  addNewPersonnel: string;
  fullName: string;
  rolePosition: string;
  department: string;
  email: string;
  avatar: string;
  uploadFromDevice: string;
  presetAvatars: string;
  defaultAvatar: string;
  savePersonnel: string;
  resetDefault: string;
  deletePersonnelConfirm: string;
  
  // Reports
  leadTimeAnalysis: string;
  avgLeadTime: string;
  employeePerformance: string;
  onTimeRate: string;
  exportExcel: string;
  exportPdf: string;
  
  // AI Assistant
  aiAssistantTitle: string;
  aiPlaceholder: string;
  aiSend: string;
  aiSuggestedPrompts: string;
  
  // Role Switcher
  roleSimulator: string;
  roleDescription: string;
  allAccess: string;
  deptLimit: string;

  // PWA & App Installation
  installApp: string;
  installAppTitle: string;
  installAppSubtitle: string;
  iosTab: string;
  androidTab: string;
  desktopTab: string;
  iosStep1: string;
  iosStep2: string;
  iosStep3: string;
  iosStep4: string;
  androidStep1: string;
  androidStep2: string;
  androidStep3: string;
  androidStep4: string;
  pwaDirectInstallBtn: string;
  installedSuccess: string;
  close: string;
}

const translations: Record<Language, Translations> = {
  vi: {
    // Navigation & Header
    appTitle: 'Garment Sample Tracker',
    appSubtitle: 'Quản lý Tiến độ Mẫu & Quy trình Garment',
    searchPlaceholder: 'Tìm mã style, khách hàng, buyer...',
    tabDashboard: 'Tổng quan',
    tabStyles: 'Danh sách Style',
    tabCalendar: 'Tiến độ (Gantt)',
    tabReports: 'Báo cáo & Năng suất',
    tabAi: 'Trợ lý AI Garment',
    
    // Header profile & Role
    roleLabel: 'Vai trò',
    editStaff: 'Sửa nhân sự',
    notifications: 'Thông báo',
    markAllRead: 'Đánh dấu đã đọc',
    noNotifications: 'Không có thông báo mới',
    
    // Dashboard
    totalStyles: 'Tổng số Style',
    onTrack: 'Đúng tiến độ',
    atRisk: 'Có nguy cơ trễ',
    completed: 'Đã hoàn thành',
    delayRate: 'Tỷ lệ chậm trễ',
    stageProgress: 'Tiến độ theo Giai đoạn',
    recentActivities: 'Nhật ký Hoạt động Mới nhất',
    addNewStyle: 'Thêm Style mới',
    quickStats: 'Thống kê nhanh',

    // Style List & Filters
    allSeasons: 'Tất cả Mùa hàng',
    allStatuses: 'Tất cả Trạng thái',
    statusActive: 'Đang thực hiện',
    statusCompleted: 'Đã hoàn thành',
    statusPending: 'Tạm dừng / Chờ',
    statusOnHold: 'Tạm hoãn',
    statusCancelled: 'Đã hủy',
    filterByCustomer: 'Lọc theo Khách hàng',
    styleCode: 'Mã Style',
    customer: 'Khách hàng',
    buyer: 'Nhãn hàng / Buyer',
    factory: 'Tổ / Xưởng sản xuất',
    season: 'Mùa hàng',
    actions: 'Thao tác',
    viewDetails: 'Xem chi tiết',
    editStyle: 'Chỉnh sửa Style',
    deleteStyle: 'Xóa Style',
    driveLink: 'Link Google Drive',
    createdDate: 'Ngày khởi tạo',
    
    // Style Detail & Stages
    backToList: 'Trở lại Danh sách',
    stageWorkflow: 'Quy trình các Giai đoạn Mẫu',
    requestDate: 'Ngày tạo / Yêu cầu',
    deadline: 'Hạn chót (Deadline)',
    sentDate: 'Ngày gửi Buyer',
    productionDate: 'Ngày vào Sản xuất',
    actualCompletion: 'Ngày hoàn thành thực tế',
    assignee: 'Người phụ trách',
    unassigned: 'Chưa phân công',
    stageStatus: 'Trạng thái Stage',
    notStarted: 'Chưa bắt đầu',
    inProgress: 'Đang xử lý',
    completedStage: 'Hoàn thành',
    overdueStage: 'Quá hạn',
    stageLabel: 'Nhãn phân loại Giai đoạn',
    commentsAndFeedback: 'Bình luận & Phản hồi (Feedback)',
    addComment: 'Thêm bình luận / Ghi chú...',
    typeCommentPlaceholder: 'Nhập ý kiến chỉ đạo, phản hồi của Buyer hoặc ghi chú kỹ thuật...',
    attachments: 'Tài liệu & Hình ảnh đính kèm',
    uploadAttachment: 'Tải tài liệu đính kèm',
    historyLogs: 'Lịch sử cập nhật',
    saveChanges: 'Lưu thay đổi',
    cancel: 'Hủy bỏ',
    deleteConfirm: 'Bạn có chắc chắn muốn xóa không?',
    
    // Personnel Manager Modal
    personnelManagerTitle: 'Quản lý Nhân sự & Vị trí',
    personnelManagerSubtitle: 'Chỉnh sửa tên, chức danh/vị trí công tác và ảnh đại diện của từng nhân viên',
    totalPersonnel: 'Tổng số nhân sự',
    addNewPersonnel: 'Thêm Nhân sự mới',
    fullName: 'Họ và Tên',
    rolePosition: 'Vị trí / Vai trò (Role)',
    department: 'Phòng ban',
    email: 'Email',
    avatar: 'Ảnh đại diện (Avatar)',
    uploadFromDevice: 'Tải ảnh từ máy',
    presetAvatars: 'Chọn mẫu ảnh sẵn có',
    defaultAvatar: 'Ảnh đại diện mặc định',
    savePersonnel: 'Lưu Nhân sự',
    resetDefault: 'Khôi phục Mặc định',
    deletePersonnelConfirm: 'Xác nhận xóa Nhân sự',
    
    // Reports
    leadTimeAnalysis: 'Phân tích Lead Time theo Stage',
    avgLeadTime: 'Lead Time Trung bình',
    employeePerformance: 'Báo cáo Năng suất Nhân sự',
    onTimeRate: 'Tỷ lệ đúng hạn',
    exportExcel: 'Xuất Excel',
    exportPdf: 'Xuất PDF',
    
    // AI Assistant
    aiAssistantTitle: 'Trợ lý Thông minh Garment AI',
    aiPlaceholder: 'Hỏi về tiến độ style, cảnh báo trễ hạn, tư vấn quy trình garment...',
    aiSend: 'Gửi',
    aiSuggestedPrompts: 'Gợi ý câu hỏi nhanh',
    
    // Role Switcher
    roleSimulator: 'Giả lập Nhân sự (RBAC)',
    roleDescription: 'Chọn một nhân sự dưới đây để đóng vai tương tác với các Stage:',
    allAccess: 'Toàn quyền',
    deptLimit: 'Giới hạn Phòng ban',

    // PWA & App Installation
    installApp: 'Cài đặt App',
    installAppTitle: 'Cài đặt Ứng dụng Garment Tracker',
    installAppSubtitle: 'Cài ứng dụng lên điện thoại iPhone (iOS) hoặc Android để sử dụng mượt mà như app cài từ App Store / Google Play.',
    iosTab: 'iPhone (iOS)',
    androidTab: 'Điện thoại Android',
    desktopTab: 'Máy tính (PC/Mac)',
    iosStep1: 'Mở trang web này bằng trình duyệt Safari trên iPhone/iPad.',
    iosStep2: 'Bấm vào nút Chia sẻ (Share 📤) ở thanh công cụ phía dưới màn hình Safari.',
    iosStep3: 'Cuộn xuống danh sách tính năng và chọn "Thêm vào Màn hình chính" ("Add to Home Screen" ➕).',
    iosStep4: 'Bấm "Thêm" (Add) ở góc trên bên phải màn hình để hoàn tất cài đặt.',
    androidStep1: 'Mở trang web này bằng trình duyệt Google Chrome trên thiết bị Android.',
    androidStep2: 'Bấm vào biểu tượng Menu 3 chấm (⋮) ở góc trên bên phải trình duyệt.',
    androidStep3: 'Chọn "Cài đặt ứng dụng" ("Install app") hoặc "Thêm vào màn hình chính".',
    androidStep4: 'Xác nhận "Cài đặt" để hiển thị icon ứng dụng trực tiếp trên màn hình chính.',
    pwaDirectInstallBtn: 'Tải & Cài đặt ngay (1-Click)',
    installedSuccess: 'Ứng dụng đã sẵn sàng trên màn hình chính!',
    close: 'Đóng',
  },
  en: {
    // Navigation & Header
    appTitle: 'Garment Sample Tracker',
    appSubtitle: 'Sample Development & Workflow Management',
    searchPlaceholder: 'Search style code, customer, buyer...',
    tabDashboard: 'Overview',
    tabStyles: 'Style List',
    tabCalendar: 'Gantt Timeline',
    tabReports: 'Reports & Productivity',
    tabAi: 'Garment AI Assistant',
    
    // Header profile & Role
    roleLabel: 'Role',
    editStaff: 'Manage Staff',
    notifications: 'Notifications',
    markAllRead: 'Mark all as read',
    noNotifications: 'No new notifications',
    
    // Dashboard
    totalStyles: 'Total Styles',
    onTrack: 'On Track',
    atRisk: 'At Risk',
    completed: 'Completed',
    delayRate: 'Delay Rate',
    stageProgress: 'Stage Breakdown',
    recentActivities: 'Recent Activity Log',
    addNewStyle: 'Add New Style',
    quickStats: 'Quick Stats',

    // Style List & Filters
    allSeasons: 'All Seasons',
    allStatuses: 'All Statuses',
    statusActive: 'Active',
    statusCompleted: 'Completed',
    statusPending: 'Pending / On Hold',
    statusOnHold: 'On Hold',
    statusCancelled: 'Cancelled',
    filterByCustomer: 'Filter by Customer',
    styleCode: 'Style Code',
    customer: 'Customer',
    buyer: 'Buyer / Brand',
    factory: 'Factory / Line',
    season: 'Season',
    actions: 'Actions',
    viewDetails: 'View Details',
    editStyle: 'Edit Style',
    deleteStyle: 'Delete Style',
    driveLink: 'Google Drive Link',
    createdDate: 'Created Date',
    
    // Style Detail & Stages
    backToList: 'Back to List',
    stageWorkflow: 'Sample Workflow Stages',
    requestDate: 'Request Date',
    deadline: 'Deadline',
    sentDate: 'Buyer Sent Date',
    productionDate: 'Production Date',
    actualCompletion: 'Actual Complete Date',
    assignee: 'Assignee',
    unassigned: 'Unassigned',
    stageStatus: 'Stage Status',
    notStarted: 'Not Started',
    inProgress: 'In Progress',
    completedStage: 'Completed',
    overdueStage: 'Overdue',
    stageLabel: 'Stage Classification Label',
    commentsAndFeedback: 'Comments & Buyer Feedback',
    addComment: 'Add comment / technical notes...',
    typeCommentPlaceholder: 'Type feedback, buyer comments, or technical notes...',
    attachments: 'Attachments & Tech Packs',
    uploadAttachment: 'Upload File',
    historyLogs: 'Update History',
    saveChanges: 'Save Changes',
    cancel: 'Cancel',
    deleteConfirm: 'Are you sure you want to delete this?',
    
    // Personnel Manager Modal
    personnelManagerTitle: 'Staff & Role Manager',
    personnelManagerSubtitle: 'Manage employee names, job roles/positions, and profile avatars',
    totalPersonnel: 'Total Personnel',
    addNewPersonnel: 'Add New Staff',
    fullName: 'Full Name',
    rolePosition: 'Position / Role',
    department: 'Department',
    email: 'Email',
    avatar: 'Avatar Image',
    uploadFromDevice: 'Upload from device',
    presetAvatars: 'Preset Avatars',
    defaultAvatar: 'Default Avatar',
    savePersonnel: 'Save Staff',
    resetDefault: 'Reset to Default',
    deletePersonnelConfirm: 'Confirm Staff Deletion',
    
    // Reports
    leadTimeAnalysis: 'Lead Time Analysis by Stage',
    avgLeadTime: 'Avg Lead Time',
    employeePerformance: 'Employee Productivity Report',
    onTimeRate: 'On-Time Rate',
    exportExcel: 'Export Excel',
    exportPdf: 'Export PDF',
    
    // AI Assistant
    aiAssistantTitle: 'Garment AI Assistant',
    aiPlaceholder: 'Ask about style status, delay alerts, or garment workflow guidance...',
    aiSend: 'Send',
    aiSuggestedPrompts: 'Suggested Prompts',
    
    // Role Switcher
    roleSimulator: 'Role Simulator (RBAC)',
    roleDescription: 'Select a user below to switch operational role & stage permissions:',
    allAccess: 'Full Access',
    deptLimit: 'Dept Restricted',

    // PWA & App Installation
    installApp: 'Install App',
    installAppTitle: 'Install Garment Tracker App',
    installAppSubtitle: 'Install on your iPhone (iOS) or Android device for 1-tap home screen access and smooth native performance.',
    iosTab: 'iPhone (iOS)',
    androidTab: 'Android Device',
    desktopTab: 'Desktop (PC/Mac)',
    iosStep1: 'Open this website using the Safari browser on your iPhone/iPad.',
    iosStep2: 'Tap the Share button (📤) in Safari\'s bottom toolbar.',
    iosStep3: 'Scroll down and select "Add to Home Screen" (➕).',
    iosStep4: 'Tap "Add" in the top right corner to complete installation.',
    androidStep1: 'Open this website using Google Chrome on Android.',
    androidStep2: 'Tap the 3 dots Menu icon (⋮) in the top right corner.',
    androidStep3: 'Select "Install app" or "Add to Home screen".',
    androidStep4: 'Confirm "Install" to place the icon on your home screen.',
    pwaDirectInstallBtn: 'Install Now (1-Click)',
    installedSuccess: 'App is ready on your Home Screen!',
    close: 'Close',
  }
};

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: Translations;
}

const LanguageContext = createContext<LanguageContextType>({
  language: 'vi',
  setLanguage: () => {},
  t: translations.vi,
});

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<Language>(() => {
    const saved = localStorage.getItem('garment_app_lang');
    return (saved === 'en' || saved === 'vi') ? saved : 'vi';
  });

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem('garment_app_lang', lang);
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t: translations[language] }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => useContext(LanguageContext);
