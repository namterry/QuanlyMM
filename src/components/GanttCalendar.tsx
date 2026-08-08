import React from 'react';
import { Style, Stage } from '../types';
import { Calendar as CalendarIcon, BarChart2, ChevronLeft, ChevronRight, AlertCircle, RefreshCw, CheckCircle2, Clock, AlertTriangle, XCircle } from 'lucide-react';

interface GanttCalendarProps {
  styles: Style[];
  onUpdateStageDeadline: (stageId: string, newDeadline: string) => void;
  onSelectStyle: (styleId: string) => void;
}

export default function GanttCalendar({ styles, onUpdateStageDeadline, onSelectStyle }: GanttCalendarProps) {
  const [viewMode, setViewMode] = React.useState<'calendar' | 'gantt'>('calendar');

  // Dynamic Month & Year Navigation (Default to current date or July 2026 if data centers around 2026)
  const today = React.useMemo(() => new Date(), []);
  const todayYear = today.getFullYear();
  const todayMonth = today.getMonth(); // 0-indexed
  const todayDateNum = today.getDate();

  // Initialize with July 2026 if styles data primarily sits in 2026, otherwise current real date
  const [currentYear, setCurrentYear] = React.useState<number>(2026);
  const [currentMonth, setCurrentMonth] = React.useState<number>(6); // 0-indexed: 6 = July
  const [statusFilter, setStatusFilter] = React.useState<'all' | 'active' | 'completed'>('all');

  // Navigation handlers
  const handlePrevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear(prev => prev - 1);
    } else {
      setCurrentMonth(prev => prev - 1);
    }
  };

  const handleNextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear(prev => prev + 1);
    } else {
      setCurrentMonth(prev => prev + 1);
    }
  };

  const handleToday = () => {
    // Jump to today or July 2026 if today is outside range
    setCurrentYear(2026);
    setCurrentMonth(6);
  };

  const handleRealToday = () => {
    setCurrentYear(todayYear);
    setCurrentMonth(todayMonth);
  };

  // Month calculations
  const monthNames = [
    'Tháng 1', 'Tháng 2', 'Tháng 3', 'Tháng 4', 'Tháng 5', 'Tháng 6',
    'Tháng 7', 'Tháng 8', 'Tháng 9', 'Tháng 10', 'Tháng 11', 'Tháng 12'
  ];
  const monthName = `${monthNames[currentMonth]}, ${currentYear}`;

  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const startDayOffset = new Date(currentYear, currentMonth, 1).getDay(); // Sunday=0, Monday=1...

  const formattedMonthStr = String(currentMonth + 1).padStart(2, '0');
  const currentMonthPrefix = `${currentYear}-${formattedMonthStr}`;

  // Get all stages across all styles
  const allStages = React.useMemo(() => {
    return styles.flatMap(s =>
      s.stages.map(st => ({
        ...st,
        styleCode: s.styleCode,
        styleId: s.id,
        customer: s.customer,
        season: s.season,
      }))
    );
  }, [styles]);

  // Filtered stages based on user filter preference
  const filteredStages = React.useMemo(() => {
    return allStages.filter(st => {
      if (statusFilter === 'active') return st.status !== 'Completed' && st.status !== 'Cancelled';
      if (statusFilter === 'completed') return st.status === 'Completed';
      return true; // 'all'
    });
  }, [allStages, statusFilter]);

  // Drag and Drop event handlers
  const handleDragStart = (e: React.DragEvent, stageId: string) => {
    e.dataTransfer.setData('text/plain', stageId);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent, targetDayNum: number) => {
    e.preventDefault();
    const stageId = e.dataTransfer.getData('text/plain');
    if (!stageId) return;

    // Convert target day number to ISO String "YYYY-MM-DD"
    const formattedDay = targetDayNum < 10 ? `0${targetDayNum}` : `${targetDayNum}`;
    const newDeadline = `${currentMonthPrefix}-${formattedDay}`;
    onUpdateStageDeadline(stageId, newDeadline);
  };

  // Helper for stage status color styling
  const getStageBadgeStyle = (status: string) => {
    switch (status) {
      case 'Completed':
        return 'bg-emerald-950 border-emerald-800 text-emerald-200';
      case 'InProgress':
      case 'In_Progress':
      case 'In Progress':
        return 'bg-blue-950 border-blue-800 text-blue-200';
      case 'Pending':
      case 'OnHold':
        return 'bg-amber-950 border-amber-800 text-amber-200';
      case 'Cancelled':
        return 'bg-slate-900 border-slate-800 text-slate-400 line-through';
      default:
        return 'bg-slate-900 border-slate-800 text-slate-200';
    }
  };

  // Render Calendar View
  const renderCalendar = () => {
    const calendarCells = [];
    const weekdays = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];

    // Fill offset empty cells for previous month
    for (let i = 0; i < startDayOffset; i++) {
      calendarCells.push(<div key={`empty-${i}`} className="bg-slate-50/60 border-r border-b border-slate-100 min-h-[100px]" />);
    }

    // Fill days of the selected month
    for (let day = 1; day <= daysInMonth; day++) {
      const formattedDay = day < 10 ? `0${day}` : `${day}`;
      const cellDateString = `${currentMonthPrefix}-${formattedDay}`;

      const isToday = currentYear === todayYear && currentMonth === todayMonth && day === todayDateNum;

      // Filter stages ending on or active during this day
      const dayStages = filteredStages.filter(st => st.deadline === cellDateString);

      calendarCells.push(
        <div
          key={`day-${day}`}
          id={`calendar-cell-day-${day}`}
          onDragOver={handleDragOver}
          onDrop={e => handleDrop(e, day)}
          className={`border-r border-b border-slate-100 min-h-[110px] p-2 transition-all flex flex-col justify-between ${
            isToday ? 'bg-blue-50/40 ring-2 ring-blue-500 ring-inset z-10' : 'bg-white hover:bg-blue-50/20'
          }`}
        >
          {/* Day number header */}
          <div className="flex items-center justify-between">
            <span
              className={`text-xs font-mono font-bold w-6 h-6 rounded-full flex items-center justify-center ${
                isToday
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'text-slate-700 hover:bg-slate-100'
              }`}
            >
              {day}
            </span>
            {isToday && (
              <span className="text-[9px] bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded-md font-bold uppercase">
                Hôm nay
              </span>
            )}
          </div>

          {/* Draggable items stack */}
          <div className="space-y-1.5 mt-1 flex-1 overflow-y-auto max-h-28 scrollbar-none">
            {dayStages.map(st => (
              <div
                key={st.id}
                id={`draggable-stage-badge-${st.id}`}
                draggable
                onDragStart={e => handleDragStart(e, st.id)}
                onClick={() => onSelectStyle(st.styleId)}
                className={`border text-white rounded-lg p-1.5 cursor-grab active:cursor-grabbing text-[10px] shadow-xs transition-all hover:scale-[1.02] flex flex-col gap-0.5 ${getStageBadgeStyle(st.status)}`}
                title={`Mã: ${st.styleCode} | Khách: ${st.customer} | Giai đoạn: ${st.stageType} | Trạng thái: ${st.status}`}
              >
                <div className="flex items-center justify-between font-bold">
                  <span className="truncate text-slate-100 font-mono">{st.styleCode}</span>
                  <span className="text-[8px] bg-blue-500/80 text-white px-1 rounded uppercase shrink-0 font-sans">
                    {st.customer}
                  </span>
                </div>
                <div className="flex items-center justify-between gap-1 text-[9px]">
                  <p className="truncate text-slate-300 font-sans font-semibold">
                    {st.stageType.replace(' Sample', '')}
                  </p>
                  {st.status === 'Completed' && <CheckCircle2 className="w-3 h-3 text-emerald-400 shrink-0" />}
                </div>
              </div>
            ))}
          </div>
        </div>
      );
    }

    // Calculate grid rows (42 cells max for 6x7 grid)
    const currentTotal = startDayOffset + daysInMonth;
    const targetTotal = currentTotal > 35 ? 42 : 35;
    const remainingCells = targetTotal - currentTotal;

    for (let i = 0; i < remainingCells; i++) {
      calendarCells.push(<div key={`empty-end-${i}`} className="bg-slate-50/60 border-r border-b border-slate-100 min-h-[100px]" />);
    }

    return (
      <div className="space-y-3">
        <div className="bg-slate-900 text-slate-100 rounded-2xl p-3 flex flex-wrap items-center justify-between gap-2 text-xs font-sans">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>💡 <strong>Hướng dẫn</strong>: Bạn có thể <strong>kéo và thả (Drag & Drop)</strong> thẻ công việc sang bất kỳ ô ngày nào trong tháng để dời deadline. Bấm nút <strong>Tháng trước / Tháng sau</strong> để xem lịch sử & kế hoạch.</span>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <span className="text-[10px] text-slate-400">Lọc trạng thái:</span>
            <select
              value={statusFilter}
              onChange={(e: any) => setStatusFilter(e.target.value)}
              className="bg-slate-800 text-slate-200 border border-slate-700 text-[11px] rounded-lg px-2 py-1 font-sans focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer"
            >
              <option value="all">Tất cả ({allStages.length})</option>
              <option value="active">Đang thực hiện</option>
              <option value="completed">Đã hoàn thành</option>
            </select>
          </div>
        </div>

        <div className="border border-slate-200 rounded-2xl overflow-hidden shadow-xs bg-white">
          <div className="grid grid-cols-7 bg-slate-50 border-b border-slate-200">
            {weekdays.map(day => (
              <div key={day} className="p-3 text-center text-xs font-bold text-slate-500 font-sans uppercase">
                {day}
              </div>
            ))}
          </div>
          <div className="grid grid-cols-7">
            {calendarCells}
          </div>
        </div>
      </div>
    );
  };

  // Render Gantt Chart View
  const renderGantt = () => {
    // Gantt columns for all days of the selected month (1 to daysInMonth)
    const ganttDays = Array.from({ length: daysInMonth }, (_, i) => i + 1);

    const monthStartStr = `${currentMonthPrefix}-01`;
    const monthEndStr = `${currentMonthPrefix}-${String(daysInMonth).padStart(2, '0')}`;

    return (
      <div className="bg-white border border-slate-200 rounded-2xl shadow-xs p-5 overflow-x-auto space-y-4">
        <div className="min-w-[1000px] space-y-4">
          
          {/* Gantt Header Timeline */}
          <div className="flex items-center border-b border-slate-200 pb-3">
            <div className="w-1/5 text-xs font-bold text-slate-600 uppercase font-sans pr-2">
              Mã hàng & Giai đoạn ({monthName})
            </div>
            <div className="w-4/5 flex">
              {ganttDays.map(day => {
                const isToday = currentYear === todayYear && currentMonth === todayMonth && day === todayDateNum;
                return (
                  <div
                    key={day}
                    className={`flex-1 text-center font-mono text-[11px] font-bold py-1 rounded-md ${
                      isToday ? 'bg-blue-600 text-white shadow-xs' : 'text-slate-400'
                    }`}
                  >
                    {day < 10 ? `0${day}` : day}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Style Rows */}
          <div className="space-y-4">
            {styles.map(style => {
              // Find stages overlapping with current selected month
              const monthStages = style.stages.filter(st => {
                if (statusFilter === 'active' && (st.status === 'Completed' || st.status === 'Cancelled')) return false;
                if (statusFilter === 'completed' && st.status !== 'Completed') return false;

                // Check overlap with selected month range
                const req = st.requestDate || '2000-01-01';
                const dl = st.deadline || '2099-12-31';

                return req <= monthEndStr && dl >= monthStartStr;
              });

              if (monthStages.length === 0) return null;

              return (
                <div key={style.id} className="space-y-2 border-b border-slate-100 pb-3.5 last:border-0 last:pb-0" id={`gantt-row-style-${style.id}`}>
                  <div className="flex items-center">
                    <div
                      onClick={() => onSelectStyle(style.id)}
                      className="w-1/5 pr-4 cursor-pointer hover:text-blue-600 transition-colors"
                    >
                      <h4 className="text-xs font-extrabold text-slate-800 font-sans">{style.styleCode}</h4>
                      <p className="text-[10px] text-slate-400 font-sans truncate">{style.customer} • {style.season}</p>
                    </div>

                    {/* Timeline bar for this style */}
                    <div className="w-4/5 flex relative h-10 items-center">
                      {/* Grid background lines */}
                      <div className="absolute inset-0 flex pointer-events-none">
                        {ganttDays.map(day => {
                          const isToday = currentYear === todayYear && currentMonth === todayMonth && day === todayDateNum;
                          return (
                            <div
                              key={day}
                              className={`flex-1 border-r border-dashed border-slate-100 h-full ${
                                isToday ? 'bg-blue-50/40 border-blue-200' : ''
                              }`}
                            />
                          );
                        })}
                      </div>

                      {/* Timeline Blocks for stages */}
                      {monthStages.map(st => {
                        const reqParts = st.requestDate.split('-');
                        const dlParts = st.deadline.split('-');

                        let startDay = 1;
                        if (reqParts[0] === String(currentYear) && parseInt(reqParts[1]) === currentMonth + 1) {
                          startDay = parseInt(reqParts[2]) || 1;
                        }

                        let endDay = daysInMonth;
                        if (dlParts[0] === String(currentYear) && parseInt(dlParts[1]) === currentMonth + 1) {
                          endDay = parseInt(dlParts[2]) || daysInMonth;
                        }

                        startDay = Math.max(1, Math.min(daysInMonth, startDay));
                        endDay = Math.max(startDay, Math.min(daysInMonth, endDay));

                        const leftPercent = ((startDay - 1) / daysInMonth) * 100;
                        const widthPercent = Math.max((1 / daysInMonth) * 100, ((endDay - startDay + 1) / daysInMonth) * 100);

                        let colorClasses = 'bg-blue-600 border-blue-700 text-white';
                        if (st.status === 'Completed') {
                          colorClasses = 'bg-emerald-600 border-emerald-700 text-white';
                        } else if (st.status === 'Pending' || st.status === 'OnHold') {
                          colorClasses = 'bg-amber-600 border-amber-700 text-white';
                        } else if (st.status === 'Cancelled') {
                          colorClasses = 'bg-slate-400 border-slate-500 text-white opacity-60';
                        }

                        return (
                          <div
                            key={st.id}
                            style={{ left: `${leftPercent}%`, width: `${widthPercent}%` }}
                            onClick={() => onSelectStyle(style.id)}
                            className={`absolute h-7 rounded-lg text-[9px] font-sans font-bold flex items-center justify-between px-2 border shadow-xs transition-all cursor-pointer truncate ${colorClasses} hover:brightness-110`}
                            title={`${st.stageType} (${st.status}): ${st.requestDate} ➔ ${st.deadline}`}
                          >
                            <span className="truncate">{st.stageType.replace(' Sample', '')}</span>
                            <span className="text-[8px] font-mono opacity-90 hidden sm:inline ml-1">
                              {startDay}/{currentMonth + 1}-{endDay}/{currentMonth + 1}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6" id="planner-view-root">
      {/* Header view toggle */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-sans font-bold text-slate-900 text-2xl">Lịch biểu & Gantt May mẫu (Sample Planner)</h1>
          <p className="text-xs text-slate-500 font-sans mt-0.5">
            Duyệt lịch biểu dòng thời gian theo từng tháng, theo dõi tiến độ quá khứ & tương lai linh hoạt.
          </p>
        </div>

        {/* View mode buttons */}
        <div className="flex items-center bg-slate-100 p-1 rounded-xl shrink-0">
          <button
            id="btn-toggle-view-calendar"
            onClick={() => setViewMode('calendar')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold font-sans transition-all cursor-pointer ${
              viewMode === 'calendar' ? 'bg-white text-slate-800 shadow-xs' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <CalendarIcon className="w-3.5 h-3.5" />
            Lịch Tháng
          </button>
          <button
            id="btn-toggle-view-gantt"
            onClick={() => setViewMode('gantt')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold font-sans transition-all cursor-pointer ${
              viewMode === 'gantt' ? 'bg-white text-slate-800 shadow-xs' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <BarChart2 className="w-3.5 h-3.5" />
            Sơ đồ Gantt
          </button>
        </div>
      </div>

      {/* Month & Year Navigation Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white border border-slate-200 px-4 py-3 rounded-2xl shadow-xs">
        <div className="flex items-center gap-2">
          <button
            onClick={handlePrevMonth}
            className="p-1.5 hover:bg-slate-100 rounded-lg border border-slate-200 text-slate-600 transition-all cursor-pointer"
            title="Tháng trước"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          <span className="font-sans font-extrabold text-slate-900 text-base min-w-[140px] text-center">
            {monthName}
          </span>

          <button
            onClick={handleNextMonth}
            className="p-1.5 hover:bg-slate-100 rounded-lg border border-slate-200 text-slate-600 transition-all cursor-pointer"
            title="Tháng sau"
          >
            <ChevronRight className="w-4 h-4" />
          </button>

          <button
            onClick={handleToday}
            className="ml-2 text-xs font-bold text-blue-600 hover:text-blue-800 bg-blue-50 hover:bg-blue-100 border border-blue-200 px-2.5 py-1 rounded-lg transition-all cursor-pointer"
          >
            Tháng 7/2026
          </button>

          <button
            onClick={handleRealToday}
            className="text-xs font-bold text-slate-600 hover:text-slate-800 bg-slate-100 hover:bg-slate-200 border border-slate-200 px-2.5 py-1 rounded-lg transition-all cursor-pointer"
          >
            Hiện tại
          </button>
        </div>

        {viewMode === 'calendar' ? (
          <span className="text-[10px] text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-lg font-mono font-bold animate-pulse">
            ● Realtime Drag-n-Drop Ready
          </span>
        ) : (
          <span className="text-[10px] text-slate-500 font-mono">
            {styles.length} mã hàng trong sơ đồ
          </span>
        )}
      </div>

      {/* Active view screen */}
      {viewMode === 'calendar' ? renderCalendar() : renderGantt()}
    </div>
  );
}

