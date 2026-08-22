import React, { useState, useEffect, useRef } from 'react';
import { StudySessionLog, SubjectKey } from '../types';
import { SUBJECT_METAS, STUDY_SUBJECT_KEYS } from '../constants/subjects';
import { exportSessionLogsToCSV } from '../services/storage';
import {
  BarChart3,
  Download,
  Calendar,
  Flame,
  Clock,
  PieChart,
  Star,
  Plus,
  Trash2,
  Table,
} from 'lucide-react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  PointElement,
  LineElement,
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  PointElement,
  LineElement
);

interface AnalysisViewProps {
  logs: StudySessionLog[];
  onAddManualLog: (log: StudySessionLog) => void;
  onDeleteLog: (id: string) => void;
}

export const AnalysisView: React.FC<AnalysisViewProps> = ({ logs, onAddManualLog, onDeleteLog }) => {
  const [periodDays, setPeriodDays] = useState<number>(7);
  const [showAddLogModal, setShowAddLogModal] = useState<boolean>(false);

  // Manual Log Form State
  const [manualDate, setManualDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [manualSubject, setManualSubject] = useState<SubjectKey>('math');
  const [manualTitle, setManualTitle] = useState<string>('');
  const [manualMinutes, setManualMinutes] = useState<number>(60);
  const [manualQuality, setManualQuality] = useState<number>(5);
  const [manualNote, setManualNote] = useState<string>('');

  // Canvas Refs for Chart.js
  const trendCanvasRef = useRef<HTMLCanvasElement>(null);
  const doughnutCanvasRef = useRef<HTMLCanvasElement>(null);
  const trendChartInstance = useRef<ChartJS | null>(null);
  const doughnutChartInstance = useRef<ChartJS | null>(null);

  // Filter logs within selected period
  const cutoffTime = Date.now() - periodDays * 86400000;
  const filteredLogs = logs.filter((l) => new Date(l.dateStr).getTime() >= cutoffTime - 86400000);

  // Summary Metrics
  const totalMinutes = filteredLogs.reduce((acc, l) => acc + l.durationMinutes, 0);
  const totalHours = (totalMinutes / 60).toFixed(1);
  const avgDailyHours = (totalMinutes / 60 / periodDays).toFixed(1);
  
  const ratedLogs = filteredLogs.filter((l) => l.quality);
  const avgQuality = ratedLogs.length > 0 ? (ratedLogs.reduce((a, b) => a + (b.quality || 5), 0) / ratedLogs.length).toFixed(1) : '5.0';

  const uniqueDays = new Set(filteredLogs.map((l) => l.dateStr)).size;

  // Render Charts with Chart.js
  useEffect(() => {
    // 1. Trend Bar Chart (Last N days)
    if (trendCanvasRef.current) {
      if (trendChartInstance.current) {
        trendChartInstance.current.destroy();
      }

      // Generate date labels
      const labels: string[] = [];
      const dataHours: number[] = [];
      const now = new Date();

      for (let i = periodDays - 1; i >= 0; i--) {
        const d = new Date(now.getTime() - i * 86400000);
        const dStr = d.toISOString().split('T')[0];
        const monthDay = `${d.getMonth() + 1}/${d.getDate()}`;
        labels.push(monthDay);

        const dayLogs = logs.filter((l) => l.dateStr === dStr);
        const dayMinutes = dayLogs.reduce((acc, l) => acc + l.durationMinutes, 0);
        dataHours.push(Number((dayMinutes / 60).toFixed(1)));
      }

      trendChartInstance.current = new ChartJS(trendCanvasRef.current, {
        type: 'bar',
        data: {
          labels,
          datasets: [
            {
              label: '学習時間 (時間)',
              data: dataHours,
              backgroundColor: 'rgba(59, 130, 246, 0.8)',
              borderColor: '#3b82f6',
              borderWidth: 1,
              borderRadius: 3,
            },
          ],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { display: false },
            tooltip: {
              callbacks: {
                label: (ctx) => `学習: ${ctx.parsed.y} 時間`,
              },
            },
          },
          scales: {
            x: {
              grid: { color: '#1e293b' },
              ticks: { color: '#94a3b8', font: { family: "'JetBrains Mono', monospace", size: 10 } },
            },
            y: {
              beginAtZero: true,
              grid: { color: '#1e293b' },
              ticks: { color: '#94a3b8', font: { family: "'JetBrains Mono', monospace", size: 10 } },
            },
          },
        },
      });
    }

    // 2. Subject Doughnut Chart
    if (doughnutCanvasRef.current) {
      if (doughnutChartInstance.current) {
        doughnutChartInstance.current.destroy();
      }

      const subjectMinutes: Record<string, number> = {};
      STUDY_SUBJECT_KEYS.forEach((k) => (subjectMinutes[k] = 0));

      filteredLogs.forEach((l) => {
        if (subjectMinutes[l.subject] !== undefined) {
          subjectMinutes[l.subject] += l.durationMinutes;
        } else {
          subjectMinutes[l.subject] = (subjectMinutes[l.subject] || 0) + l.durationMinutes;
        }
      });

      const activeSubjectKeys = Object.keys(subjectMinutes).filter((k) => subjectMinutes[k] > 0);
      const doughnutLabels = activeSubjectKeys.map((k) => SUBJECT_METAS[k as SubjectKey]?.name || k);
      const doughnutData = activeSubjectKeys.map((k) => Number((subjectMinutes[k] / 60).toFixed(1)));
      const doughnutColors = activeSubjectKeys.map((k) => SUBJECT_METAS[k as SubjectKey]?.color || '#94a3b8');

      doughnutChartInstance.current = new ChartJS(doughnutCanvasRef.current, {
        type: 'doughnut',
        data: {
          labels: doughnutLabels.length > 0 ? doughnutLabels : ['データなし'],
          datasets: [
            {
              data: doughnutData.length > 0 ? doughnutData : [1],
              backgroundColor: doughnutColors.length > 0 ? doughnutColors : ['#334155'],
              borderColor: '#020617',
              borderWidth: 2,
            },
          ],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              position: 'bottom',
              labels: { color: '#cbd5e1', font: { family: "'JetBrains Mono', monospace", size: 10 }, boxWidth: 10 },
            },
          },
          cutout: '65%',
        },
      });
    }

    return () => {
      if (trendChartInstance.current) trendChartInstance.current.destroy();
      if (doughnutChartInstance.current) doughnutChartInstance.current.destroy();
    };
  }, [periodDays, logs, filteredLogs]);

  // Submit Manual Log
  const handleAddManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualTitle.trim()) return;

    const newLog: StudySessionLog = {
      id: `manual_${Date.now()}`,
      timestamp: new Date().toISOString(),
      dateStr: manualDate,
      subject: manualSubject,
      taskTitle: manualTitle.trim(),
      durationMinutes: manualMinutes,
      quality: manualQuality,
      note: manualNote.trim(),
    };

    onAddManualLog(newLog);
    setManualTitle('');
    setManualNote('');
    setShowAddLogModal(false);
  };

  // Weekday Matrix Calculation (月〜日 × 各教科)
  const weekdays = ['月', '火', '水', '木', '金', '土', '日'];
  const weekdaySubjectTotals: Record<number, Record<SubjectKey, number>> = {
    0: {} as Record<SubjectKey, number>,
    1: {} as Record<SubjectKey, number>,
    2: {} as Record<SubjectKey, number>,
    3: {} as Record<SubjectKey, number>,
    4: {} as Record<SubjectKey, number>,
    5: {} as Record<SubjectKey, number>,
    6: {} as Record<SubjectKey, number>,
  };

  logs.forEach((log) => {
    const d = new Date(log.dateStr);
    const dayOfWeek = (d.getDay() + 6) % 7; // 0=Mon, 6=Sun
    if (!weekdaySubjectTotals[dayOfWeek][log.subject]) {
      weekdaySubjectTotals[dayOfWeek][log.subject] = 0;
    }
    weekdaySubjectTotals[dayOfWeek][log.subject] += log.durationMinutes;
  });

  return (
    <div className="max-w-[1720px] w-full mx-auto space-y-4 font-mono">
      {/* Top Header & Period Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-900/60 border border-slate-800 rounded-xl p-4 sm:p-5 shadow-lg text-slate-200">
        <div>
          <h2 className="font-bold text-sm sm:text-base uppercase tracking-wider text-blue-400 flex items-center gap-2 font-mono">
            <BarChart3 className="w-4 h-4 sm:w-5 sm:h-5 text-blue-400" />
            STUDY_TELEMETRY // STATISTICAL_ANALYSIS
          </h2>
          <p className="text-xs text-slate-400 font-sans mt-0.5">
            日次・週間・教科別アロケーションの精密トラッキング
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Period selector */}
          <div className="flex bg-slate-950 p-1 rounded-md border border-slate-800">
            {[7, 14, 30].map((d) => (
              <button
                key={d}
                onClick={() => setPeriodDays(d)}
                className={`px-2.5 py-1 rounded text-xs font-bold uppercase transition-all whitespace-nowrap cursor-pointer ${
                  periodDays === d ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {d}D
              </button>
            ))}
          </div>

          <button
            onClick={() => exportSessionLogsToCSV(logs)}
            className="px-3 py-1.5 rounded-md bg-slate-800 hover:bg-slate-700 text-blue-400 text-xs font-bold uppercase flex items-center gap-1.5 border border-slate-700 transition-all whitespace-nowrap cursor-pointer"
            title="CSV形式で全ログをエクスポート"
          >
            <Download className="w-3.5 h-3.5" />
            <span>EXPORT_CSV</span>
          </button>

          <button
            onClick={() => setShowAddLogModal(true)}
            className="px-3.5 py-1.5 rounded-md bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold uppercase flex items-center gap-1.5 shadow-sm transition-all whitespace-nowrap cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>ADD_MANUAL_LOG</span>
          </button>
        </div>
      </div>

      {/* Zero logs informative banner */}
      {logs.length === 0 && (
        <div className="bg-blue-950/30 border border-blue-800/40 rounded-xl p-4 text-center space-y-1">
          <p className="text-sm font-bold text-blue-300 font-sans">
            📊 まだ学習セッションログが記録されていません
          </p>
          <p className="text-xs text-slate-400 font-sans">
            COCKPIT画面のタイマーで学習を完了するか、右上の「ADD_MANUAL_LOG」ボタンから手動で学習時間を追加すると、グラフや週間マトリクスに即座に反映されます。
          </p>
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4 shadow-lg">
          <div className="flex items-center justify-between text-slate-500 text-xs uppercase font-bold mb-1.5">
            <span>PERIOD_TOTAL</span>
            <Clock className="w-4 h-4 text-blue-400" />
          </div>
          <div className="text-2xl sm:text-3xl font-black font-mono text-blue-400">
            {totalHours} <span className="text-xs font-normal text-slate-400">HRS</span>
          </div>
          <span className="text-[10px] sm:text-xs text-slate-500 font-mono mt-1 block">
            {totalMinutes} MIN TELEMETRY
          </span>
        </div>

        <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4 shadow-lg">
          <div className="flex items-center justify-between text-slate-500 text-xs uppercase font-bold mb-1.5">
            <span>DAILY_AVERAGE</span>
            <Flame className="w-4 h-4 text-orange-400" />
          </div>
          <div className="text-2xl sm:text-3xl font-black font-mono text-orange-400">
            {avgDailyHours} <span className="text-xs font-normal text-slate-400">HRS/DAY</span>
          </div>
          <span className="text-[10px] sm:text-xs text-slate-500 font-mono mt-1 block">
            LAST {periodDays} DAYS BASIS
          </span>
        </div>

        <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4 shadow-lg">
          <div className="flex items-center justify-between text-slate-500 text-xs uppercase font-bold mb-1.5">
            <span>FOCUS_QUALITY</span>
            <Star className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl sm:text-3xl font-black font-mono text-amber-400">
            ★ {avgQuality} <span className="text-xs font-normal text-slate-400">/ 5.0</span>
          </div>
          <span className="text-[10px] sm:text-xs text-slate-500 font-mono mt-1 block">
            {ratedLogs.length} RATED SESSIONS
          </span>
        </div>

        <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4 shadow-lg">
          <div className="flex items-center justify-between text-slate-500 text-xs uppercase font-bold mb-1.5">
            <span>ACTIVE_DAYS</span>
            <Calendar className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl sm:text-3xl font-black font-mono text-emerald-400">
            {uniqueDays} <span className="text-xs font-normal text-slate-400">DAYS</span>
          </div>
          <span className="text-[10px] sm:text-xs text-slate-500 font-mono mt-1 block">
            ACTIVE STREAK
          </span>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
        {/* Daily Trend Chart (2 cols) */}
        <div className="lg:col-span-2 bg-slate-900/60 border border-slate-800 rounded-xl p-3.5 shadow-lg space-y-2">
          <div className="flex items-center justify-between border-b border-slate-800 pb-1.5">
            <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
              <BarChart3 className="w-3.5 h-3.5 text-blue-400" />
              DAILY_TREND ({periodDays} DAYS)
            </h3>
            <span className="text-[10px] text-slate-400 font-mono">HOURS</span>
          </div>
          <div className="h-56 w-full">
            <canvas ref={trendCanvasRef} />
          </div>
        </div>

        {/* Subject Ratio Doughnut (1 col) */}
        <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-3.5 shadow-lg space-y-2">
          <div className="flex items-center justify-between border-b border-slate-800 pb-1.5">
            <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
              <PieChart className="w-3.5 h-3.5 text-purple-400" />
              SUBJECT_RATIO
            </h3>
          </div>
          <div className="h-56 w-full flex items-center justify-center">
            <canvas ref={doughnutCanvasRef} />
          </div>
        </div>
      </div>

      {/* Weekday × Subject Matrix Table */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-3.5 shadow-lg space-y-2">
        <div className="flex items-center justify-between border-b border-slate-800 pb-1.5">
          <div className="flex items-center gap-1.5">
            <Table className="w-3.5 h-3.5 text-blue-400" />
            <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider">
              WEEKDAY × SUBJECT ALLOCATION MATRIX
            </h3>
          </div>
          <span className="text-[10px] text-slate-500 uppercase">CUMULATIVE_HOURS</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-[11px] border-collapse font-mono">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400 bg-slate-950/60">
                <th className="p-2">DAY</th>
                {STUDY_SUBJECT_KEYS.map((k) => (
                  <th key={k} className="p-2 text-center font-bold">
                    <span style={{ color: SUBJECT_METAS[k].color }}>{SUBJECT_METAS[k].name}</span>
                  </th>
                ))}
                <th className="p-2 text-right font-bold text-blue-400">TOTAL</th>
              </tr>
            </thead>
            <tbody>
              {weekdays.map((w, idx) => {
                const rowTotals = weekdaySubjectTotals[idx] || {};
                let rowSum = 0;
                return (
                  <tr key={w} className="border-b border-slate-800/60 hover:bg-slate-800/30">
                    <td className="p-2 font-bold text-slate-200">{w}曜日</td>
                    {STUDY_SUBJECT_KEYS.map((k) => {
                      const mins = rowTotals[k] || 0;
                      rowSum += mins;
                      return (
                        <td key={k} className="p-2 text-center text-slate-300">
                          {mins > 0 ? (
                            <span className="px-1 py-0.5 rounded bg-slate-800 font-bold">
                              {(mins / 60).toFixed(1)}h
                            </span>
                          ) : (
                            <span className="text-slate-600">-</span>
                          )}
                        </td>
                      );
                    })}
                    <td className="p-2 text-right font-bold text-blue-400">
                      {(rowSum / 60).toFixed(1)}h
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Detailed Logs History Table */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-3.5 shadow-lg space-y-2">
        <div className="flex items-center justify-between border-b border-slate-800 pb-1.5">
          <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-blue-400" />
            SESSION_LOGS_HISTORY ({logs.length} RECORDS)
          </h3>
        </div>

        <div className="overflow-x-auto max-h-80">
          <table className="w-full text-left text-[11px] border-collapse font-mono">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400 bg-slate-950/60">
                <th className="p-2">DATE</th>
                <th className="p-2">SUBJECT</th>
                <th className="p-2">TASK_TITLE</th>
                <th className="p-2 text-center">DUR</th>
                <th className="p-2 text-center">QUALITY</th>
                <th className="p-2">NOTE</th>
                <th className="p-2 text-right">ACTION</th>
              </tr>
            </thead>
            <tbody>
              {logs.map((log) => {
                const meta = SUBJECT_METAS[log.subject] || SUBJECT_METAS.math;
                return (
                  <tr key={log.id} className="border-b border-slate-800/60 hover:bg-slate-800/30 transition-colors">
                    <td className="p-2 text-slate-400">{log.dateStr}</td>
                    <td className="p-2">
                      <span
                        className="px-1.5 py-0.5 rounded text-[10px] font-bold uppercase"
                        style={{
                          backgroundColor: `${meta.color}20`,
                          color: meta.color,
                          border: `1px solid ${meta.color}40`,
                        }}
                      >
                        {meta.name}
                      </span>
                    </td>
                    <td className="p-2 font-bold text-slate-200 font-sans">{log.taskTitle}</td>
                    <td className="p-2 text-center font-bold text-blue-400">
                      {log.durationMinutes}m
                    </td>
                    <td className="p-2 text-center text-amber-400">
                      {'★'.repeat(log.quality || 5)}
                    </td>
                    <td className="p-2 text-slate-400 text-[10px] truncate max-w-xs font-sans">{log.note || '-'}</td>
                    <td className="p-2 text-right">
                      <button
                        onClick={() => onDeleteLog(log.id)}
                        className="p-1 hover:bg-red-950/40 text-slate-500 hover:text-red-400 rounded transition-colors"
                        title="Delete record"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Manual Add Log Modal */}
      {showAddLogModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in font-mono">
          <div className="bg-slate-900 border border-slate-700 rounded-xl p-4 w-full max-w-md shadow-2xl space-y-3 text-slate-200">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <h3 className="font-bold text-xs text-blue-400 uppercase tracking-wider flex items-center gap-1.5">
                <Plus className="w-3.5 h-3.5" /> ADD_MANUAL_LOG
              </h3>
              <button
                onClick={() => setShowAddLogModal(false)}
                className="text-slate-400 hover:text-slate-200"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAddManualSubmit} className="space-y-2.5 text-xs">
              <div>
                <label className="text-slate-400 block mb-1 text-[10px] uppercase font-bold">DATE</label>
                <input
                  type="date"
                  value={manualDate}
                  onChange={(e) => setManualDate(e.target.value)}
                  required
                  className="w-full bg-slate-950 border border-slate-700 rounded p-1.5 text-slate-200 font-mono"
                />
              </div>

              <div>
                <label className="text-slate-400 block mb-1 text-[10px] uppercase font-bold">SUBJECT</label>
                <select
                  value={manualSubject}
                  onChange={(e) => setManualSubject(e.target.value as SubjectKey)}
                  className="w-full bg-slate-950 border border-slate-700 rounded p-1.5 text-slate-200"
                >
                  {STUDY_SUBJECT_KEYS.map((k) => (
                    <option key={k} value={k}>
                      {SUBJECT_METAS[k].name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-slate-400 block mb-1 text-[10px] uppercase font-bold">EVENT_TITLE</label>
                <input
                  type="text"
                  value={manualTitle}
                  onChange={(e) => setManualTitle(e.target.value)}
                  placeholder="例: 青チャート数III 例題演習"
                  required
                  className="w-full bg-slate-950 border border-slate-700 rounded p-1.5 text-slate-200 font-sans"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-slate-400 block mb-1 text-[10px] uppercase font-bold">DURATION (MIN)</label>
                  <input
                    type="number"
                    min="5"
                    step="5"
                    value={manualMinutes}
                    onChange={(e) => setManualMinutes(Number(e.target.value))}
                    required
                    className="w-full bg-slate-950 border border-slate-700 rounded p-1.5 text-slate-200 font-mono"
                  />
                </div>

                <div>
                  <label className="text-slate-400 block mb-1 text-[10px] uppercase font-bold">QUALITY</label>
                  <select
                    value={manualQuality}
                    onChange={(e) => setManualQuality(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-700 rounded p-1.5 text-slate-200"
                  >
                    <option value="5">★★★★★ (5/5)</option>
                    <option value="4">★★★★☆ (4/5)</option>
                    <option value="3">★★★☆☆ (3/5)</option>
                    <option value="2">★★☆☆☆ (2/5)</option>
                    <option value="1">★☆☆☆☆ (1/5)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-slate-400 block mb-1 text-[10px] uppercase font-bold">NOTE (OPTIONAL)</label>
                <textarea
                  value={manualNote}
                  onChange={(e) => setManualNote(e.target.value)}
                  placeholder="気づき、間違えた問題の番号、次回への教訓など"
                  rows={2}
                  className="w-full bg-slate-950 border border-slate-700 rounded p-1.5 text-slate-200 font-sans"
                />
              </div>

              <div className="flex justify-end gap-1.5 pt-1 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowAddLogModal(false)}
                  className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-[10px] uppercase font-bold"
                >
                  CANCEL
                </button>
                <button
                  type="submit"
                  className="px-3 py-1 rounded bg-blue-600 hover:bg-blue-500 font-bold text-white text-[10px] uppercase shadow-sm"
                >
                  SAVE_LOG
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
