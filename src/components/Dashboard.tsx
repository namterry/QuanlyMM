import React from 'react';
import { Style, Stage, User } from '../types';
import { USERS } from '../data/initialData';
import { AlertCircle, Calendar, CheckCircle2, Clock, Layers, TrendingUp, Users } from 'lucide-react';

interface DashboardProps {
  styles: Style[];
  onSelectStyle: (styleId: string) => void;
  onNavigate: (tab: string) => void;
}

export default function Dashboard({ styles, onSelectStyle, onNavigate }: DashboardProps) {
  const currentDate = new Date('2026-07-01');

  // Calculated Stats
  const totalStyles = styles.length;
  const activeStyles = styles.filter(s => s.status === 'Active').length;
  const completedStyles = styles.filter(s => s.status === 'Completed').length;

  // Overdue and upcoming stage check
  const allActiveStages: { stage: Stage; style: Style }[] = [];
  styles.forEach(s => {
    if (s.status !== 'Completed' && s.status !== 'Cancelled') {
      s.stages.forEach(st => {
        if (st.status !== 'Completed' && st.status !== 'Cancelled') {
          allActiveStages.push({ stage: st, style: s });
        }
      });
    }
  });

  const overdueStages = allActiveStages.filter(item => {
    const deadlineDate = new Date(item.stage.deadline);
    return deadlineDate < currentDate;
  });

  const upcomingStages = allActiveStages.filter(item => {
    const deadlineDate = new Date(item.stage.deadline);
    const diffTime = deadlineDate.getTime() - currentDate.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays >= 0 && diffDays <= 3; // within next 3 days
  });

  // KPI calculations
  // On-time completion rate: completed stages on or before deadline
  let totalCompletedStages = 0;
  let onTimeCompletedStages = 0;
  styles.forEach(s => {
    s.stages.forEach(st => {
      if (st.status === 'Completed') {
        totalCompletedStages++;
        if (st.actualCompletionDate) {
          const actual = new Date(st.actualCompletionDate);
          const deadline = new Date(st.deadline);
          if (actual <= deadline) {
            onTimeCompletedStages++;
          }
        }
      }
    });
  });

  const onTimeRate = totalCompletedStages > 0
    ? Math.round((onTimeCompletedStages / totalCompletedStages) * 100)
    : 100;

  // Workloads per user
  const userWorkloads = USERS.map(user => {
    const assignedActive = allActiveStages.filter(item => item.stage.assigneeId === user.id).length;
    const completed = styles.reduce((acc, s) => {
      return acc + s.stages.filter(st => st.assigneeId === user.id && st.status === 'Completed').length;
    }, 0);
    return {
      user,
      activeCount: assignedActive,
      completedCount: completed,
    };
  });

  // Style Stage Counts for visual steps summary
  const stageTypeDistribution: { [key: string]: number } = {};
  styles.forEach(s => {
    s.stages.forEach(st => {
      if (st.status === 'InProgress') {
        stageTypeDistribution[st.stageType] = (stageTypeDistribution[st.stageType] || 0) + 1;
      }
    });
  });

  return (
    <div className="space-y-6" id="dashboard-view-root">
      {/* Overview stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric Card 1 */}
        <div id="stat-card-total-styles" className="bg-white border border-slate-200 p-5 rounded-2xl flex items-center justify-between shadow-sm">
          <div className="space-y-1">
            <span className="text-xs text-slate-500 font-sans font-medium uppercase tracking-wider">Tổng mã hàng</span>
            <h3 className="text-2xl font-bold text-slate-900 font-sans">{totalStyles}</h3>
            <p className="text-[11px] text-emerald-600 font-sans flex items-center gap-1">
              <TrendingUp className="w-3 h-3" />
              <span>{activeStyles} đang phát triển</span>
            </p>
          </div>
          <div className="bg-blue-50 p-3 rounded-xl text-blue-600">
            <Layers className="w-6 h-6" />
          </div>
        </div>

        {/* Metric Card 2 */}
        <div id="stat-card-overdue" className="bg-white border border-slate-200 p-5 rounded-2xl flex items-center justify-between shadow-sm">
          <div className="space-y-1">
            <span className="text-xs text-slate-500 font-sans font-medium uppercase tracking-wider">Mẫu quá hạn (Delay)</span>
            <h3 className={`text-2xl font-bold font-sans ${overdueStages.length > 0 ? 'text-rose-600' : 'text-slate-900'}`}>
              {overdueStages.length}
            </h3>
            <p className="text-[11px] text-slate-500 font-sans">Cần tập trung đẩy nhanh</p>
          </div>
          <div className={`p-3 rounded-xl ${overdueStages.length > 0 ? 'bg-rose-50 text-rose-600' : 'bg-slate-100 text-slate-600'}`}>
            <AlertCircle className="w-6 h-6" />
          </div>
        </div>

        {/* Metric Card 3 */}
        <div id="stat-card-upcoming" className="bg-white border border-slate-200 p-5 rounded-2xl flex items-center justify-between shadow-sm">
          <div className="space-y-1">
            <span className="text-xs text-slate-500 font-sans font-medium uppercase tracking-wider">Sắp đến hạn (≤ 3 ngày)</span>
            <h3 className="text-2xl font-bold text-slate-900 font-sans">{upcomingStages.length}</h3>
            <p className="text-[11px] text-amber-600 font-sans">Cần rà soát tiến độ</p>
          </div>
          <div className="bg-amber-50 p-3 rounded-xl text-amber-600">
            <Clock className="w-6 h-6" />
          </div>
        </div>

        {/* Metric Card 4 */}
        <div id="stat-card-kpi" className="bg-white border border-slate-200 p-5 rounded-2xl flex items-center justify-between shadow-sm">
          <div className="space-y-1">
            <span className="text-xs text-slate-500 font-sans font-medium uppercase tracking-wider">Tỉ lệ đúng hạn (OTD)</span>
            <h3 className="text-2xl font-bold text-slate-900 font-sans">{onTimeRate}%</h3>
            <p className="text-[11px] text-slate-500 font-sans">Mục tiêu quý: &gt;90%</p>
          </div>
          <div className="bg-emerald-50 p-3 rounded-xl text-emerald-600">
            <CheckCircle2 className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Main Grid: Warning Lists and Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left column: Urgent Action Items (2/3 width on large screens) */}
        <div className="lg:col-span-2 space-y-6">
          {/* Overdue/Urgent Stage Card */}
          <div id="dashboard-critical-alerts" className="bg-white border border-slate-200 rounded-2xl shadow-sm p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="space-y-1">
                <h2 className="font-sans font-semibold text-slate-800 text-base flex items-center gap-2">
                  <AlertCircle className="w-5 h-5 text-rose-500" />
                  Cảnh báo tiến độ khẩn cấp
                </h2>
                <p className="text-xs text-slate-500 font-sans">Các Giai đoạn cần hành động ngay lập tức</p>
              </div>
              <span className="bg-rose-50 text-rose-700 text-[10px] font-mono px-2 py-1 rounded-md font-semibold">
                CURRENT DATE: 2026-07-01
              </span>
            </div>

            <div className="space-y-3">
              {overdueStages.length === 0 && upcomingStages.length === 0 ? (
                <div className="text-center py-8 text-slate-400 font-sans text-sm">
                  🎉 Tuyệt vời! Hiện tại không có Giai đoạn nào bị quá hạn hoặc sắp đến hạn.
                </div>
              ) : (
                <>
                  {/* Overdue Items list */}
                  {overdueStages.map(({ stage, style }) => {
                    const deadline = new Date(stage.deadline);
                    const diffDays = Math.ceil((currentDate.getTime() - deadline.getTime()) / (1000 * 60 * 60 * 24));
                    const assignee = USERS.find(u => u.id === stage.assigneeId);

                    return (
                      <div
                        key={stage.id}
                        id={`alert-overdue-${stage.id}`}
                        className="flex flex-col sm:flex-row sm:items-center justify-between p-3.5 bg-rose-50/50 hover:bg-rose-50 border border-rose-100 rounded-xl transition-all cursor-pointer gap-2"
                        onClick={() => onSelectStyle(style.id)}
                      >
                        <div className="space-y-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="bg-rose-600 text-white font-mono text-[9px] px-2 py-0.5 rounded font-bold uppercase">
                              Trễ {diffDays} ngày
                            </span>
                            <span className="font-sans font-bold text-slate-800 text-xs">
                              {style.styleCode} ({style.customer})
                            </span>
                            <span className="text-slate-400 text-xs">•</span>
                            <span className="font-sans text-slate-700 text-xs font-semibold">
                              {stage.stageType}
                            </span>
                          </div>
                          <p className="text-xs text-slate-500 font-sans line-clamp-1">
                            Ghi chú: {stage.note || 'Không có ghi chú.'}
                          </p>
                        </div>
                        <div className="flex items-center gap-3 self-end sm:self-center">
                          <div className="text-right">
                            <p className="text-[10px] text-slate-400 font-sans">Phụ trách</p>
                            <p className="text-xs text-slate-700 font-sans font-medium">
                              {assignee ? assignee.name.split(' (')[0] : 'Chưa phân công'}
                            </p>
                          </div>
                          {assignee && (
                            <img
                              src={assignee.avatar}
                              alt={assignee.name}
                              className="w-8 h-8 rounded-full border border-slate-200"
                              referrerPolicy="no-referrer"
                            />
                          )}
                        </div>
                      </div>
                    );
                  })}

                  {/* Upcoming Items list */}
                  {upcomingStages.map(({ stage, style }) => {
                    const deadline = new Date(stage.deadline);
                    const diffDays = Math.ceil((deadline.getTime() - currentDate.getTime()) / (1000 * 60 * 60 * 24));
                    const assignee = USERS.find(u => u.id === stage.assigneeId);

                    return (
                      <div
                        key={stage.id}
                        id={`alert-upcoming-${stage.id}`}
                        className="flex flex-col sm:flex-row sm:items-center justify-between p-3.5 bg-amber-50/40 hover:bg-amber-50 border border-amber-100 rounded-xl transition-all cursor-pointer gap-2"
                        onClick={() => onSelectStyle(style.id)}
                      >
                        <div className="space-y-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="bg-amber-500 text-white font-sans text-[9px] px-2 py-0.5 rounded font-bold">
                              {diffDays === 0 ? 'Hết hạn hôm nay' : `Còn ${diffDays} ngày`}
                            </span>
                            <span className="font-sans font-bold text-slate-800 text-xs">
                              {style.styleCode} ({style.customer})
                            </span>
                            <span className="text-slate-400 text-xs">•</span>
                            <span className="font-sans text-slate-700 text-xs font-semibold">
                              {stage.stageType}
                            </span>
                          </div>
                          <p className="text-xs text-slate-500 font-sans line-clamp-1">
                            Ghi chú: {stage.note || 'Không có ghi chú.'}
                          </p>
                        </div>
                        <div className="flex items-center gap-3 self-end sm:self-center">
                          <div className="text-right">
                            <p className="text-[10px] text-slate-400 font-sans">Phụ trách</p>
                            <p className="text-xs text-slate-700 font-sans font-medium">
                              {assignee ? assignee.name.split(' (')[0] : 'Chưa phân công'}
                            </p>
                          </div>
                          {assignee && (
                            <img
                              src={assignee.avatar}
                              alt={assignee.name}
                              className="w-8 h-8 rounded-full border border-slate-200"
                              referrerPolicy="no-referrer"
                            />
                          )}
                        </div>
                      </div>
                    );
                  })}
                </>
              )}
            </div>
          </div>

          {/* Department Load KPI Chart (Custom Visuals) */}
          <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-6 space-y-4">
            <h2 className="font-sans font-semibold text-slate-800 text-base flex items-center gap-2">
              <Users className="w-5 h-5 text-blue-600" />
              Năng lực xử lý theo Nhân sự (Workload)
            </h2>
            <p className="text-xs text-slate-500 font-sans">Số lượng Giai đoạn mẫu đang đảm nhiệm thực tế</p>

            <div className="space-y-4">
              {userWorkloads.map(({ user, activeCount, completedCount }) => {
                const totalAssigned = activeCount + completedCount;
                const percent = totalAssigned > 0 ? Math.round((completedCount / totalAssigned) * 100) : 0;
                
                return (
                  <div key={user.id} className="space-y-1.5" id={`workload-user-${user.id}`}>
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <img src={user.avatar} alt={user.name} className="w-5 h-5 rounded-full object-cover" referrerPolicy="no-referrer" />
                        <span className="font-medium text-slate-700 font-sans">{user.name}</span>
                        <span className="text-[10px] bg-slate-100 text-slate-500 font-mono px-1.5 py-0.5 rounded uppercase">
                          {user.role}
                        </span>
                      </div>
                      <div className="font-mono text-slate-600">
                        <span className="text-blue-600 font-bold">{activeCount} đang làm</span>
                        <span className="mx-1">/</span>
                        <span className="text-emerald-600">{completedCount} xong</span>
                      </div>
                    </div>
                    {/* Visual bar stacked */}
                    <div className="h-3 w-full bg-slate-100 rounded-full overflow-hidden flex">
                      <div
                        style={{ width: `${(activeCount / (totalAssigned || 1)) * 100}%` }}
                        className="bg-blue-500 h-full hover:opacity-90 transition-all duration-500"
                        title={`${activeCount} Giai đoạn đang triển khai`}
                      />
                      <div
                        style={{ width: `${(completedCount / (totalAssigned || 1)) * 100}%` }}
                        className="bg-emerald-500 h-full hover:opacity-90 transition-all duration-500"
                        title={`${completedCount} Giai đoạn hoàn thành`}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right column: System Stage Distribution and KPI */}
        <div className="space-y-6">
          {/* Style Status Breakdown Chart */}
          <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-6 space-y-4 flex flex-col justify-between">
            <div>
              <h2 className="font-sans font-semibold text-slate-800 text-base flex items-center gap-2">
                <Layers className="w-5 h-5 text-slate-700" />
                Tổng quan Giai đoạn mẫu
              </h2>
              <p className="text-xs text-slate-500 font-sans">Thống kê số lượng các Stage đang triển khai</p>
            </div>

            {/* Custom Interactive SVG Pie/Donut Chart */}
            <div className="py-6 flex flex-col items-center justify-center">
              <div className="relative w-44 h-44 flex items-center justify-center">
                <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                  {/* Outer circle track */}
                  <circle cx="50" cy="50" r="40" fill="transparent" stroke="#f1f5f9" strokeWidth="12" />
                  {/* Segment 1: InProgress (Blue) */}
                  <circle
                    cx="50"
                    cy="50"
                    r="40"
                    fill="transparent"
                    stroke="#3b82f6"
                    strokeWidth="12"
                    strokeDasharray={`${(allActiveStages.length / (totalStyles * 8 || 1)) * 251.2} 251.2`}
                  />
                </svg>
                <div className="absolute flex flex-col items-center justify-center text-center">
                  <span className="text-3xl font-extrabold text-slate-800 font-sans">
                    {allActiveStages.length}
                  </span>
                  <span className="text-[10px] text-slate-400 font-sans font-semibold uppercase tracking-wider">
                    Đang chạy
                  </span>
                </div>
              </div>

              {/* Chart Legend */}
              <div className="grid grid-cols-2 gap-4 w-full mt-6">
                <div className="border border-slate-100 p-2.5 rounded-xl text-center">
                  <div className="flex items-center gap-1.5 justify-center mb-0.5">
                    <span className="w-2.5 h-2.5 bg-blue-500 rounded-full inline-block" />
                    <span className="text-xs text-slate-500 font-sans font-medium">Đang may mẫu</span>
                  </div>
                  <p className="font-sans font-bold text-slate-800 text-sm">{allActiveStages.length}</p>
                </div>
                <div className="border border-slate-100 p-2.5 rounded-xl text-center">
                  <div className="flex items-center gap-1.5 justify-center mb-0.5">
                    <span className="w-2.5 h-2.5 bg-emerald-500 rounded-full inline-block" />
                    <span className="text-xs text-slate-500 font-sans font-medium">Đã ký duyệt</span>
                  </div>
                  <p className="font-sans font-bold text-slate-800 text-sm">{completedStyles}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Stats: Step Distribution */}
          <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-6 space-y-4">
            <h2 className="font-sans font-semibold text-slate-800 text-sm uppercase tracking-wider text-slate-400">
              Giai đoạn đang tắc nghẽn (Bottlenecks)
            </h2>
            <div className="space-y-3">
              {Object.keys(stageTypeDistribution).length === 0 ? (
                <p className="text-xs text-slate-400 text-center py-4 font-sans">Không ghi nhận tắc nghẽn.</p>
              ) : (
                Object.entries(stageTypeDistribution).map(([stageName, count]) => (
                  <div key={stageName} className="flex items-center justify-between border-b border-slate-100 pb-2.5 last:border-0 last:pb-0">
                    <div className="space-y-0.5">
                      <p className="text-xs font-semibold text-slate-800 font-sans">{stageName}</p>
                      <p className="text-[10px] text-slate-400 font-sans">Giai đoạn đang sản xuất mẫu</p>
                    </div>
                    <span className={`font-mono text-xs font-bold px-2.5 py-1 rounded-full ${
                      count >= 2 ? 'bg-rose-50 text-rose-600 border border-rose-100' : 'bg-slate-50 text-slate-600'
                    }`}>
                      {count} Style
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Link to production plans */}
          <div className="bg-gradient-to-br from-slate-900 to-slate-800 text-white rounded-2xl p-5 shadow-lg space-y-4 relative overflow-hidden">
            <div className="absolute right-[-20px] top-[-20px] w-32 h-32 bg-white/5 rounded-full" />
            <div className="space-y-1 relative z-10">
              <h3 className="font-sans font-semibold text-white text-base flex items-center gap-2">
                <Calendar className="w-5 h-5 text-emerald-400" />
                Lập kế hoạch dập mẫu
              </h3>
              <p className="text-xs text-slate-300 leading-relaxed font-sans">
                Xem lịch biểu dạng lưới thời gian (Gantt & Calendar) trực quan, dời deadline trực tiếp bằng kéo thả.
              </p>
            </div>
            <button
              id="btn-navigate-to-planner"
              onClick={() => onNavigate('planner')}
              className="w-full bg-white text-slate-900 font-sans font-semibold text-xs py-2.5 rounded-xl hover:bg-slate-100 transition-all text-center block"
            >
              Xem Lịch Gantt & Planner
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
