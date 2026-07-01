import React from 'react';
import { Style } from '../types';
import { USERS } from '../data/initialData';
import { FileSpreadsheet, FileText, BarChart, Clock, CheckSquare, Award, ArrowUpRight } from 'lucide-react';

interface ReportsProps {
  styles: Style[];
}

export default function Reports({ styles }: ReportsProps) {
  const [exportState, setExportState] = React.useState<{ exporting: boolean; format: 'Excel' | 'PDF' | null }>({ exporting: false, format: null });

  // 1. Calculate Average Lead Times per stage type
  // Difference between request date and actual completion date
  const stageLeadTimes: { [key: string]: { totalDays: number; count: number } } = {};
  
  styles.forEach(style => {
    style.stages.forEach(stage => {
      if (stage.status === 'Completed' && stage.actualCompletionDate) {
        const start = new Date(stage.requestDate);
        const end = new Date(stage.actualCompletionDate);
        const diffTime = end.getTime() - start.getTime();
        const diffDays = Math.max(1, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));
        
        if (!stageLeadTimes[stage.stageType]) {
          stageLeadTimes[stage.stageType] = { totalDays: 0, count: 0 };
        }
        stageLeadTimes[stage.stageType].totalDays += diffDays;
        stageLeadTimes[stage.stageType].count += 1;
      }
    });
  });

  const averageLeadTimes = Object.entries(stageLeadTimes).map(([stageName, data]) => ({
    stageName,
    avgDays: Math.round(data.totalDays / data.count),
    completedCount: data.count,
  }));

  // 2. Employee Productivity Summary
  const userProductivity = USERS.map(user => {
    let completedInTime = 0;
    let completedLate = 0;
    let totalCompleted = 0;

    styles.forEach(style => {
      style.stages.forEach(stage => {
        if (stage.assigneeId === user.id && stage.status === 'Completed') {
          totalCompleted++;
          if (stage.actualCompletionDate) {
            const actual = new Date(stage.actualCompletionDate);
            const deadline = new Date(stage.deadline);
            if (actual <= deadline) {
              completedInTime++;
            } else {
              completedLate++;
            }
          }
        }
      });
    });

    const otdRate = totalCompleted > 0 ? Math.round((completedInTime / totalCompleted) * 100) : 100;

    return {
      user,
      totalCompleted,
      completedInTime,
      completedLate,
      otdRate,
    };
  });

  // Export simulator
  const triggerExport = (format: 'Excel' | 'PDF') => {
    setExportState({ exporting: true, format });

    setTimeout(() => {
      setExportState({ exporting: false, format: null });
      
      // If Excel, let's trigger a real CSV download of style data
      if (format === 'Excel') {
        let csvContent = 'data:text/csv;charset=utf-8,';
        csvContent += 'Ma Hang (Style),Khach Hang,Mua Vu,Nguoi Mua (Buyer),Nha May,Trang Thai,Giai Doan,Ngay Yeu Cau,Deadline,Ngay Hoan Thanh,Trang Thai Giai Doan\n';
        
        styles.forEach(style => {
          style.stages.forEach(st => {
            const row = [
              style.styleCode,
              style.customer,
              style.season,
              style.buyer,
              style.factory,
              style.status,
              st.stageType,
              st.requestDate,
              st.deadline,
              st.actualCompletionDate || '',
              st.status
            ].map(val => `"${val.replace(/"/g, '""')}"`).join(',');
            csvContent += row + '\n';
          });
        });

        const encodedUri = encodeURI(csvContent);
        const link = document.createElement('a');
        link.setAttribute('href', encodedUri);
        link.setAttribute('download', `Bao_Cao_Tien_Do_May_Mau_${new Date().toISOString().split('T')[0]}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      } else {
        // If PDF, trigger standard browser printing layout
        window.print();
      }
    }, 1500);
  };

  return (
    <div className="space-y-6" id="reports-view-root">
      {/* Header and exports */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-sans font-bold text-slate-900 text-2xl">Báo cáo & Thống kê May mẫu (Insights)</h1>
          <p className="text-xs text-slate-500 font-sans mt-0.5">
            Phân tích năng suất lao động, thời gian phát triển và tải xuất dữ liệu Excel/PDF.
          </p>
        </div>

        {/* Export buttons */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            id="btn-export-excel"
            onClick={() => triggerExport('Excel')}
            disabled={exportState.exporting}
            className="flex items-center gap-2 bg-emerald-600 text-white font-sans text-xs font-semibold px-4 py-2.5 rounded-xl hover:bg-emerald-700 transition-all disabled:opacity-50 cursor-pointer"
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>{exportState.exporting && exportState.format === 'Excel' ? 'Đang trích xuất...' : 'Xuất File Excel'}</span>
          </button>
          <button
            id="btn-export-pdf"
            onClick={() => triggerExport('PDF')}
            disabled={exportState.exporting}
            className="flex items-center gap-2 bg-slate-900 text-white font-sans text-xs font-semibold px-4 py-2.5 rounded-xl hover:bg-slate-800 transition-all disabled:opacity-50 cursor-pointer"
          >
            <FileText className="w-4 h-4" />
            <span>{exportState.exporting && exportState.format === 'PDF' ? 'Đang căn chỉnh...' : 'In / Xuất PDF'}</span>
          </button>
        </div>
      </div>

      {/* Grid: Leadtimes and Productivity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Lead times average chart block */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
          <h3 className="font-sans font-semibold text-slate-800 text-sm flex items-center gap-2 border-b border-slate-100 pb-3">
            <Clock className="w-4 h-4 text-slate-500" />
            Thời gian phát triển trung bình (Average Lead-Time)
          </h3>
          <p className="text-xs text-slate-500 font-sans leading-relaxed">
            Thống kê số ngày trung bình để một bộ phận hoàn tất may mẫu kể từ ngày nhận yêu cầu vải/rập.
          </p>

          <div className="space-y-4 pt-2">
            {averageLeadTimes.length === 0 ? (
              <p className="text-xs text-slate-400 text-center py-6 font-sans">Chưa có đủ dữ liệu mẫu hoàn thành để lập biểu đồ.</p>
            ) : (
              averageLeadTimes.map(item => (
                <div key={item.stageName} className="space-y-1.5" id={`avg-leadtime-item-${item.stageName.replace(/\s+/g, '-')}`}>
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-slate-700 font-sans">{item.stageName}</span>
                    <span className="font-mono font-bold text-blue-600">{item.avgDays} ngày ({item.completedCount} mẫu)</span>
                  </div>
                  {/* Custom progress visual bar */}
                  <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                    <div
                      style={{ width: `${Math.min(100, (item.avgDays / 15) * 100)}%` }}
                      className={`h-full rounded-full transition-all duration-500 ${
                        item.avgDays > 10 ? 'bg-amber-400' : 'bg-emerald-500'
                      }`}
                    />
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Productivity grid table */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
          <h3 className="font-sans font-semibold text-slate-800 text-sm flex items-center gap-2 border-b border-slate-100 pb-3">
            <Award className="w-4 h-4 text-slate-500" />
            Bảng Đánh Giá Năng Suất Nhân Sự
          </h3>
          <p className="text-xs text-slate-500 font-sans leading-relaxed">
            Theo dõi tỉ lệ On-Time Delivery (OTD) hoàn thành đúng hạn của các nhân viên được phân rã nhiệm vụ.
          </p>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-100 text-slate-400">
                  <th className="pb-2 font-sans uppercase font-bold text-[10px]">Nhân sự / Bộ phận</th>
                  <th className="pb-2 font-sans uppercase font-bold text-[10px] text-center">Hoàn thành</th>
                  <th className="pb-2 font-sans uppercase font-bold text-[10px] text-center text-emerald-600">Đúng hạn</th>
                  <th className="pb-2 font-sans uppercase font-bold text-[10px] text-center text-rose-500">Trễ hạn</th>
                  <th className="pb-2 font-sans uppercase font-bold text-[10px] text-right">Tỉ lệ OTD</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {userProductivity.map(item => (
                  <tr key={item.user.id} className="hover:bg-slate-50/50" id={`productivity-row-user-${item.user.id}`}>
                    <td className="py-2.5 flex items-center gap-2">
                      <img src={item.user.avatar} alt={item.user.name} className="w-6 h-6 rounded-full" referrerPolicy="no-referrer" />
                      <div className="space-y-0.5">
                        <p className="font-sans font-semibold text-slate-800">{item.user.name.split(' (')[0]}</p>
                        <p className="text-[9px] text-slate-400 uppercase font-mono tracking-wider">{item.user.role}</p>
                      </div>
                    </td>
                    <td className="py-2.5 text-center font-mono font-medium text-slate-700">{item.totalCompleted}</td>
                    <td className="py-2.5 text-center font-mono font-bold text-emerald-600">{item.completedInTime}</td>
                    <td className="py-2.5 text-center font-mono text-rose-500">{item.completedLate}</td>
                    <td className="py-2.5 text-right font-mono font-extrabold text-slate-800 text-[13px]">
                      {item.otdRate}%
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

      </div>

      {/* Progress reports summary */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
        <h3 className="font-sans font-semibold text-slate-800 text-sm">Báo cáo tóm tắt tiến độ mã hàng tổng quát</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-slate-500 font-sans uppercase font-bold text-[10px]">
                <th className="p-3">Mã hàng</th>
                <th className="p-3">Khách hàng</th>
                <th className="p-3">Mùa vụ</th>
                <th className="p-3">Tổng số giai đoạn</th>
                <th className="p-3 text-center">Hoàn thành</th>
                <th className="p-3 text-center">Đang làm</th>
                <th className="p-3 text-center">Pending</th>
                <th className="p-3 text-right">Hiệu suất ròng</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {styles.map(s => {
                const total = s.stages.length;
                const comp = s.stages.filter(st => st.status === 'Completed').length;
                const act = s.stages.filter(st => st.status === 'InProgress').length;
                const pend = s.stages.filter(st => st.status === 'Pending').length;
                const yieldPercent = total > 0 ? Math.round((comp / total) * 100) : 100;

                return (
                  <tr key={s.id} className="hover:bg-slate-50/50" id={`progress-summary-row-${s.id}`}>
                    <td className="p-3 font-sans font-extrabold text-slate-800">{s.styleCode}</td>
                    <td className="p-3 font-sans text-slate-600">{s.customer}</td>
                    <td className="p-3 font-sans text-slate-500">{s.season}</td>
                    <td className="p-3 font-mono font-medium text-slate-500 text-center">{total}</td>
                    <td className="p-3 font-mono font-bold text-emerald-600 text-center">{comp}</td>
                    <td className="p-3 font-mono text-blue-600 text-center">{act}</td>
                    <td className="p-3 font-mono text-slate-400 text-center">{pend}</td>
                    <td className="p-3 text-right font-mono font-bold">
                      <span className={`px-2 py-0.5 rounded ${
                        yieldPercent === 100
                          ? 'bg-emerald-50 text-emerald-700'
                          : yieldPercent > 50
                          ? 'bg-blue-50 text-blue-700'
                          : 'bg-slate-50 text-slate-500'
                      }`}>
                        {yieldPercent}%
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
