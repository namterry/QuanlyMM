import React from 'react';
import { Style, User } from '../types';
import { USERS } from '../data/initialData';
import { FileSpreadsheet, FileText, Clock, Award, Scissors, Shirt, Layers, CheckCircle2 } from 'lucide-react';

interface ReportsProps {
  styles: Style[];
  users?: User[];
}

export default function Reports({ styles, users = USERS }: ReportsProps) {
  const [exportState, setExportState] = React.useState<{ exporting: boolean; format: 'Excel' | 'PDF' | null }>({ exporting: false, format: null });

  // 1. Calculate Average Lead Times per stage type
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

  // 2. Employee Productivity Summary & Workload Breakdown (Rập & Mẫu)
  const userProductivity = users.map(user => {
    let completedInTime = 0;
    let completedLate = 0;
    let totalCompleted = 0;
    let patternAssigned = 0;
    let patternCompleted = 0;
    let sampleAssigned = 0;
    let sampleCompleted = 0;

    styles.forEach(style => {
      style.stages.forEach(stage => {
        if (stage.assigneeId === user.id) {
          const isPattern = user.role === 'Pattern' || user.role === 'CAD' || stage.stageType === 'Proto Sample' || stage.stageType === 'Fit Sample';
          const isSample = user.role === 'Sample Room' || stage.stageType === 'PP Sample' || stage.stageType === 'Size Set Sample' || stage.stageType === 'Sales Sample' || stage.stageType === 'TOP Sample';

          if (isPattern) {
            patternAssigned++;
            if (stage.status === 'Completed') patternCompleted++;
          }
          if (isSample) {
            sampleAssigned++;
            if (stage.status === 'Completed') sampleCompleted++;
          }

          if (stage.status === 'Completed') {
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
      patternAssigned,
      patternCompleted,
      sampleAssigned,
      sampleCompleted,
    };
  });

  // Filter specific groups for Pattern Makers & Sample Sewers
  const patternStaff = userProductivity.filter(p => p.user.role === 'Pattern' || p.user.role === 'CAD' || p.patternAssigned > 0);
  const sampleStaff = userProductivity.filter(p => p.user.role === 'Sample Room' || p.sampleAssigned > 0);

  const totalPatternAssignedSum = patternStaff.reduce((acc, p) => acc + p.patternAssigned, 0);
  const totalPatternCompletedSum = patternStaff.reduce((acc, p) => acc + p.patternCompleted, 0);
  const totalSampleAssignedSum = sampleStaff.reduce((acc, p) => acc + p.sampleAssigned, 0);
  const totalSampleCompletedSum = sampleStaff.reduce((acc, p) => acc + p.sampleCompleted, 0);

  // Export simulator
  const triggerExport = (format: 'Excel' | 'PDF') => {
    setExportState({ exporting: true, format });

    setTimeout(() => {
      setExportState({ exporting: false, format: null });
      
      // If Excel, let's trigger a real CSV download of style data
      if (format === 'Excel') {
        let csvContent = 'data:text/csv;charset=utf-8,';
        csvContent += 'Ma Hang (Style),Khach Hang,Mua Vu,Nguoi Mua (Buyer),Nha May,Trang Thai,Giai Doan,Nguoi Phu Trach,Ngay Yeu Cau,Deadline,Ngay Hoan Thanh,Trang Thai Giai Doan\n';
        
        styles.forEach(style => {
          style.stages.forEach(st => {
            const assignee = users.find(u => u.id === st.assigneeId);
            const assigneeName = assignee ? assignee.name.split(' (')[0] : 'Chưa phân công';
            const row = [
              style.styleCode,
              style.customer,
              style.season,
              style.buyer,
              style.factory,
              style.status,
              st.stageType,
              assigneeName,
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
            Phân tích năng suất lao động, theo dõi số lượng rập/mẫu chuyên sâu và xuất dữ liệu Excel/PDF.
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

      {/* DEDICATED SECTION: SỐ LƯỢNG RẬP VÀ SỐ LƯỢNG MẤY BÁO CÁO NHÂN SỰ */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 text-white shadow-md space-y-5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-slate-800 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="bg-blue-500/20 text-blue-400 p-1.5 rounded-lg border border-blue-500/30">
                <Scissors className="w-4 h-4" />
              </span>
              <h2 className="font-sans font-bold text-base text-white">Báo cáo Khối Kỹ Thuật Rập & Thợ May Mẫu</h2>
            </div>
            <p className="text-xs text-slate-400 font-sans mt-1">
              Thống kê trực quan số lượng bộ rập (Pattern) và số lượng sản phẩm may mẫu (Sample Garments) theo từng nhân sự đảm nhiệm
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="bg-slate-800 border border-slate-700/60 rounded-xl px-3 py-1.5 text-center">
              <p className="text-[10px] text-slate-400 uppercase font-sans font-medium">Tổng Rập</p>
              <p className="text-sm font-bold font-mono text-blue-400">{totalPatternCompletedSum} / {totalPatternAssignedSum} bộ</p>
            </div>
            <div className="bg-slate-800 border border-slate-700/60 rounded-xl px-3 py-1.5 text-center">
              <p className="text-[10px] text-slate-400 uppercase font-sans font-medium">Tổng Mẫu May</p>
              <p className="text-sm font-bold font-mono text-emerald-400">{totalSampleCompletedSum} / {totalSampleAssignedSum} chiếc</p>
            </div>
          </div>
        </div>

        {/* 2 Cards Grid for Pattern vs Sample Sewers */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {/* Card 1: Người Làm Rập (Pattern & CAD) */}
          <div className="bg-slate-800/80 border border-slate-700/80 rounded-xl p-4 space-y-3">
            <div className="flex items-center justify-between border-b border-slate-700/60 pb-2.5">
              <div className="flex items-center gap-2">
                <Scissors className="w-4 h-4 text-blue-400" />
                <h3 className="font-sans font-semibold text-sm text-slate-100">Báo cáo Kỹ thuật Rập (Pattern Makers)</h3>
              </div>
              <span className="text-[10px] bg-blue-500/20 text-blue-300 border border-blue-500/30 font-mono font-bold px-2 py-0.5 rounded-full">
                {patternStaff.length} nhân sự
              </span>
            </div>

            <div className="space-y-2.5">
              {patternStaff.length === 0 ? (
                <p className="text-xs text-slate-400 py-3 text-center">Chưa phân công bộ rập nào.</p>
              ) : (
                patternStaff.map(item => {
                  const inProgress = item.patternAssigned - item.patternCompleted;
                  const percent = item.patternAssigned > 0 ? Math.round((item.patternCompleted / item.patternAssigned) * 100) : 100;
                  return (
                    <div key={item.user.id} className="bg-slate-900/60 border border-slate-700/50 p-3 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="flex items-center gap-2.5">
                        <img src={item.user.avatar} alt={item.user.name} className="w-8 h-8 rounded-full border border-slate-700" referrerPolicy="no-referrer" />
                        <div>
                          <p className="font-sans font-bold text-xs text-slate-200">{item.user.name.split(' (')[0]}</p>
                          <span className="text-[10px] text-blue-400 font-mono uppercase tracking-wider">{item.user.role}</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 shrink-0">
                        <div className="text-right">
                          <div className="flex items-center gap-1.5 text-xs font-mono">
                            <span className="text-slate-400">Số Rập:</span>
                            <span className="font-bold text-blue-400 bg-blue-950/60 border border-blue-800/60 px-2 py-0.5 rounded text-[11px]">
                              {item.patternAssigned} rập
                            </span>
                          </div>
                          <p className="text-[10px] text-slate-400 mt-0.5 font-sans">
                            Đã xong: <span className="text-emerald-400 font-mono font-bold">{item.patternCompleted}</span> | Đang làm: <span className="text-amber-400 font-mono">{inProgress}</span>
                          </p>
                        </div>
                        <div className="w-12 text-center bg-slate-800 rounded px-1.5 py-1 border border-slate-700">
                          <p className="text-[9px] text-slate-400">Xong</p>
                          <p className="text-xs font-mono font-extrabold text-emerald-400">{percent}%</p>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Card 2: Thợ May Mẫu (Sample Sewers) */}
          <div className="bg-slate-800/80 border border-slate-700/80 rounded-xl p-4 space-y-3">
            <div className="flex items-center justify-between border-b border-slate-700/60 pb-2.5">
              <div className="flex items-center gap-2">
                <Shirt className="w-4 h-4 text-emerald-400" />
                <h3 className="font-sans font-semibold text-sm text-slate-100">Báo cáo Thợ may Mẫu (Sample Sewers)</h3>
              </div>
              <span className="text-[10px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-mono font-bold px-2 py-0.5 rounded-full">
                {sampleStaff.length} nhân sự
              </span>
            </div>

            <div className="space-y-2.5">
              {sampleStaff.length === 0 ? (
                <p className="text-xs text-slate-400 py-3 text-center">Chưa phân công may mẫu nào.</p>
              ) : (
                sampleStaff.map(item => {
                  const inProgress = item.sampleAssigned - item.sampleCompleted;
                  const percent = item.sampleAssigned > 0 ? Math.round((item.sampleCompleted / item.sampleAssigned) * 100) : 100;
                  return (
                    <div key={item.user.id} className="bg-slate-900/60 border border-slate-700/50 p-3 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="flex items-center gap-2.5">
                        <img src={item.user.avatar} alt={item.user.name} className="w-8 h-8 rounded-full border border-slate-700" referrerPolicy="no-referrer" />
                        <div>
                          <p className="font-sans font-bold text-xs text-slate-200">{item.user.name.split(' (')[0]}</p>
                          <span className="text-[10px] text-emerald-400 font-mono uppercase tracking-wider">{item.user.role}</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 shrink-0">
                        <div className="text-right">
                          <div className="flex items-center gap-1.5 text-xs font-mono">
                            <span className="text-slate-400">Số Mẫu:</span>
                            <span className="font-bold text-emerald-400 bg-emerald-950/60 border border-emerald-800/60 px-2 py-0.5 rounded text-[11px]">
                              {item.sampleAssigned} mẫu
                            </span>
                          </div>
                          <p className="text-[10px] text-slate-400 mt-0.5 font-sans">
                            Đã may: <span className="text-emerald-400 font-mono font-bold">{item.sampleCompleted}</span> | Đang may: <span className="text-amber-400 font-mono">{inProgress}</span>
                          </p>
                        </div>
                        <div className="w-12 text-center bg-slate-800 rounded px-1.5 py-1 border border-slate-700">
                          <p className="text-[9px] text-slate-400">Xong</p>
                          <p className="text-xs font-mono font-extrabold text-emerald-400">{percent}%</p>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Grid: Leadtimes and Overall Employee Productivity */}
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
            Bảng Đánh Giá Năng Suất Nhân Sự Toàn Bộ
          </h3>
          <p className="text-xs text-slate-500 font-sans leading-relaxed">
            Theo dõi tỉ lệ On-Time Delivery (OTD), số lượng rập và mẫu may đảm nhận của từng nhân viên.
          </p>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-100 text-slate-400">
                  <th className="pb-2 font-sans uppercase font-bold text-[10px]">Nhân sự / Bộ phận</th>
                  <th className="pb-2 font-sans uppercase font-bold text-[10px] text-center text-blue-600">SL Rập</th>
                  <th className="pb-2 font-sans uppercase font-bold text-[10px] text-center text-emerald-600">SL Mẫu</th>
                  <th className="pb-2 font-sans uppercase font-bold text-[10px] text-center">Đã xong</th>
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
                    <td className="py-2.5 text-center font-mono">
                      <span className="bg-blue-50 text-blue-700 font-bold px-1.5 py-0.5 rounded text-[10px]">
                        {item.patternAssigned}
                      </span>
                    </td>
                    <td className="py-2.5 text-center font-mono">
                      <span className="bg-emerald-50 text-emerald-700 font-bold px-1.5 py-0.5 rounded text-[10px]">
                        {item.sampleAssigned}
                      </span>
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

