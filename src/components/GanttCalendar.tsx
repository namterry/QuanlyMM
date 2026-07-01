import React from 'react';
import { Style, Stage } from '../types';
import { Calendar as CalendarIcon, BarChart2, ChevronLeft, ChevronRight, AlertCircle, RefreshCw } from 'lucide-react';

interface GanttCalendarProps {
  styles: Style[];
  onUpdateStageDeadline: (stageId: string, newDeadline: string) => void;
  onSelectStyle: (styleId: string) => void;
}

export default function GanttCalendar({ styles, onUpdateStageDeadline, onSelectStyle }: GanttCalendarProps) {
  const [viewMode, setViewMode] = React.useState<'calendar' | 'gantt'>('calendar');
  const [currentYear] = React.useState(2026);
  const [currentMonth] = React.useState(6); // 0-indexed, so 6 is July

  // July 2026 calendar data
  // July 1st, 2026 is a Wednesday. July has 31 days.
  const monthName = 'Tháng 7, 2026';
  const daysInJuly = 31;
  const startDayOffset = 3; // Wednesday is index 3 (Sunday=0, Mon=1, Tue=2, Wed=3)

  // Get all active stages that are not completed or cancelled
  const activeStages = styles.flatMap(s => 
    s.stages
      .filter(st => st.status !== 'Completed' && st.status !== 'Cancelled')
      .map(st => ({ ...st, styleCode: s.styleCode, styleId: s.id, customer: s.customer }))
  );

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

    // Convert day number to ISO String "2026-07-XX"
    const formattedDay = targetDayNum < 10 ? `0${targetDayNum}` : `${targetDayNum}`;
    const newDeadline = `2026-07-${formattedDay}`;
    onUpdateStageDeadline(stageId, newDeadline);
  };

  // Render Calendar View
  const renderCalendar = () => {
    const calendarCells = [];
    const totalCells = 42; // 6 rows of 7 days

    // Weekday headers in Vietnamese
    const weekdays = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];

    // Fill offset empty cells
    for (let i = 0; i < startDayOffset; i++) {
      calendarCells.push(<div key={`empty-${i}`} className="bg-slate-50 border-r border-b border-slate-100 min-h-[100px]" />);
    }

    // Fill days of the month
    for (let day = 1; day <= daysInJuly; day++) {
      const formattedDay = day < 10 ? `0${day}` : `${day}`;
      const cellDateString = `2026-07-${formattedDay}`;
      
      // Filter stages ending on this day
      const dayStages = activeStages.filter(st => st.deadline === cellDateString);

      calendarCells.push(
        <div
          key={`day-${day}`}
          id={`calendar-cell-day-${day}`}
          onDragOver={handleDragOver}
          onDrop={e => handleDrop(e, day)}
          className="bg-white border-r border-b border-slate-100 min-h-[110px] p-2 hover:bg-blue-50/20 transition-all flex flex-col justify-between"
        >
          {/* Day number */}
          <span className={`text-xs font-bold font-mono ${day === 1 ? 'bg-blue-600 text-white w-5 h-5 rounded-full flex items-center justify-center' : 'text-slate-600'}`}>
            {day}
          </span>

          {/* Draggable items stack */}
          <div className="space-y-1.5 mt-1 flex-1 overflow-y-auto max-h-24 scrollbar-none">
            {dayStages.map(st => (
              <div
                key={st.id}
                id={`draggable-stage-badge-${st.id}`}
                draggable
                onDragStart={e => handleDragStart(e, st.id)}
                onClick={() => onSelectStyle(st.styleId)}
                className="bg-slate-900 border border-slate-800 text-white rounded-lg p-1.5 cursor-grab active:cursor-grabbing text-[10px] shadow-sm transition-all hover:scale-[1.02] flex flex-col gap-0.5"
                title="Kéo thả sang ô ngày khác để thay đổi deadline"
              >
                <div className="flex items-center justify-between font-bold">
                  <span className="truncate text-slate-200 font-mono">{st.styleCode}</span>
                  <span className="text-[8px] bg-blue-500 text-white px-1 rounded uppercase shrink-0">
                    {st.customer}
                  </span>
                </div>
                <p className="truncate text-slate-300 text-[9px] font-sans font-semibold">
                  {st.stageType.replace(' Sample', '')}
                </p>
              </div>
            ))}
          </div>
        </div>
      );
    }

    // Fill remaining cells
    const remainingCells = totalCells - calendarCells.length;
    for (let i = 0; i < remainingCells; i++) {
      calendarCells.push(<div key={`empty-end-${i}`} className="bg-slate-50 border-r border-b border-slate-100 min-h-[100px]" />);
    }

    return (
      <div className="space-y-3">
        <div className="bg-slate-900 text-slate-100 rounded-2xl p-3 flex items-center justify-between text-xs font-sans">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>💡 <strong>Hướng dẫn</strong>: Bạn có thể <strong>kéo và thả (Drag & Drop)</strong> các thẻ công việc màu đen sang bất kỳ ô ngày nào khác để dời deadline lập tức!</span>
          </div>
        </div>

        <div className="border border-slate-200 rounded-2xl overflow-hidden shadow-sm bg-white">
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
    // Gantt columns of days: July 1 to July 15
    const ganttDays = Array.from({ length: 15 }, (_, i) => i + 1);

    return (
      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-5 overflow-x-auto space-y-4">
        <div className="min-w-[800px] space-y-4">
          
          {/* Gantt Header Timeline */}
          <div className="flex items-center border-b border-slate-100 pb-2">
            {/* Style name column placeholder */}
            <div className="w-1/4 text-xs font-bold text-slate-500 uppercase font-sans">
              Mã hàng & Giai đoạn
            </div>
            {/* 15 day slots */}
            <div className="w-3/4 flex">
              {ganttDays.map(day => (
                <div key={day} className="flex-1 text-center font-mono text-xs font-bold text-slate-400">
                  {day < 10 ? `0${day}` : day}/07
                </div>
              ))}
            </div>
          </div>

          {/* Rows */}
          <div className="space-y-4">
            {styles.map(style => {
              // Find active stages in July
              const styleJulyStages = style.stages.filter(st => {
                if (st.status === 'Completed' || st.status === 'Cancelled') return false;
                const deadlineDay = parseInt(st.deadline.split('-')[2]);
                const requestDay = parseInt(st.requestDate.split('-')[2]);
                // is within July
                return st.deadline.startsWith('2026-07') && st.requestDate.startsWith('2026-07');
              });

              if (styleJulyStages.length === 0) return null;

              return (
                <div key={style.id} className="space-y-2 border-b border-slate-100 pb-3 last:border-0 last:pb-0" id={`gantt-row-style-${style.id}`}>
                  <div className="flex items-center">
                    <div
                      onClick={() => onSelectStyle(style.id)}
                      className="w-1/4 pr-4 cursor-pointer hover:text-blue-600 transition-colors"
                    >
                      <h4 className="text-xs font-extrabold text-slate-800 font-sans">{style.styleCode}</h4>
                      <p className="text-[10px] text-slate-400 font-sans">{style.customer} • {style.season}</p>
                    </div>

                    {/* Timeline bar */}
                    <div className="w-3/4 flex relative h-10 items-center">
                      {/* Background divisions */}
                      <div className="absolute inset-0 flex pointer-events-none">
                        {ganttDays.map(day => (
                          <div key={day} className="flex-1 border-r border-dashed border-slate-100 h-full" />
                        ))}
                      </div>

                      {/* Timeline Blocks for individual stages */}
                      {styleJulyStages.map(st => {
                        const startDay = Math.max(1, parseInt(st.requestDate.split('-')[2]) || 1);
                        const endDay = Math.min(15, parseInt(st.deadline.split('-')[2]) || 15);
                        
                        // Calculate positions
                        const leftPercent = ((startDay - 1) / 15) * 100;
                        const widthPercent = ((endDay - startDay + 1) / 15) * 100;

                        return (
                          <div
                            key={st.id}
                            style={{ left: `${leftPercent}%`, width: `${widthPercent}%` }}
                            onClick={() => onSelectStyle(style.id)}
                            className="absolute h-7 rounded-lg text-[9px] font-sans font-bold flex items-center px-2 bg-blue-50 border border-blue-200 text-blue-700 hover:bg-blue-100 shadow-sm transition-all cursor-pointer truncate"
                            title={`${st.stageType}: ${st.requestDate} đến ${st.deadline}`}
                          >
                            <span className="truncate">{st.stageType}</span>
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
            Duyệt lịch biểu dòng thời gian, dời deadline mẫu nhanh qua lưới kéo thả.
          </p>
        </div>

        {/* View mode buttons */}
        <div className="flex items-center bg-slate-100 p-1 rounded-xl shrink-0">
          <button
            id="btn-toggle-view-calendar"
            onClick={() => setViewMode('calendar')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold font-sans transition-all ${
              viewMode === 'calendar' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <CalendarIcon className="w-3.5 h-3.5" />
            Lịch Tháng
          </button>
          <button
            id="btn-toggle-view-gantt"
            onClick={() => setViewMode('gantt')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold font-sans transition-all ${
              viewMode === 'gantt' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <BarChart2 className="w-3.5 h-3.5" />
            Sơ đồ Gantt
          </button>
        </div>
      </div>

      {/* Mode selectors */}
      <div className="flex items-center justify-between bg-white border border-slate-200 px-4 py-3 rounded-2xl shadow-sm">
        <div className="flex items-center gap-2">
          <button className="p-1.5 hover:bg-slate-50 rounded-lg border border-slate-100 text-slate-400">
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="font-sans font-bold text-slate-800 text-sm">
            {viewMode === 'calendar' ? monthName : 'Tiến Độ Dự án Tháng 7/2026'}
          </span>
          <button className="p-1.5 hover:bg-slate-50 rounded-lg border border-slate-100 text-slate-400">
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {viewMode === 'calendar' && (
          <span className="text-[10px] text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-lg font-mono font-bold animate-pulse">
            ● Realtime Drag-n-Drop Ready
          </span>
        )}
      </div>

      {/* Active screen */}
      {viewMode === 'calendar' ? renderCalendar() : renderGantt()}
    </div>
  );
}
