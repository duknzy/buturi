import React, { useState } from 'react';
import { MacroPlan, DayTemplateConfig, SubjectKey } from '../types';
import { SUBJECT_METAS, STUDY_SUBJECT_KEYS } from '../constants/subjects';
import { exportDataToJSON, importDataFromJSON } from '../services/storage';
import { audioSynth } from '../services/audio';
import confetti from 'canvas-confetti';
import {
  Sliders,
  CheckCircle2,
  AlertTriangle,
  Save,
  Download,
  Upload,
  RotateCcw,
  Sparkles,
  BookOpen,
  Calendar,
  Layers,
} from 'lucide-react';

interface GarageViewProps {
  macroPlan: MacroPlan;
  onUpdateMacroPlan: (plan: MacroPlan) => void;
  onResetAllData: () => void;
}

export const GarageView: React.FC<GarageViewProps> = ({
  macroPlan,
  onUpdateMacroPlan,
  onResetAllData,
}) => {
  const [selectedPhase, setSelectedPhase] = useState<'phase1' | 'phase2'>('phase1');
  const [tempPlan, setTempPlan] = useState<MacroPlan>({ ...macroPlan });

  // Bulk Chapter Generator State
  const [genSubject, setGenSubject] = useState<SubjectKey>('physics');
  const [genCategory, setGenCategory] = useState<string>('良問の風 物理');
  const [genTotalChapters, setGenTotalChapters] = useState<number>(8);
  const [genChapterPrefix, setGenChapterPrefix] = useState<string>('第');

  // Compute total allocation minutes
  const activeTemplate = tempPlan.templates[selectedPhase];
  const templateKeys: (keyof DayTemplateConfig)[] = [
    'sleep',
    'life',
    'school',
    'math',
    'physics',
    'chem',
    'eng',
    'kobun',
    'jp',
    'soc',
    'info',
  ];

  const totalAllocatedMinutes = templateKeys.reduce((acc, key) => {
    return acc + (activeTemplate[key] || 0);
  }, 0);

  const isExact1440 = totalAllocatedMinutes === 1440;
  const diffMinutes = 1440 - totalAllocatedMinutes;

  const handleTemplateValueChange = (key: keyof DayTemplateConfig, val: number) => {
    const updated = {
      ...tempPlan,
      templates: {
        ...tempPlan.templates,
        [selectedPhase]: {
          ...tempPlan.templates[selectedPhase],
          [key]: Math.max(0, val),
        },
      },
    };
    setTempPlan(updated);
  };

  const handleSaveAll = () => {
    onUpdateMacroPlan(tempPlan);
    audioSynth.playTick();
    confetti({ particleCount: 40, spread: 50 });
  };

  // Bulk Generator Action
  const handleBulkGenerateChapters = (e: React.FormEvent) => {
    e.preventDefault();
    if (!genCategory.trim() || genTotalChapters <= 0) return;

    const newTasks = [];
    for (let i = 1; i <= genTotalChapters; i++) {
      newTasks.push({
        id: `bulk_${Date.now()}_${i}`,
        subject: genSubject,
        category: genCategory.trim(),
        goal: `${genChapterPrefix}${i}章 演習完了`,
        done: false,
      });
    }

    const updated = {
      ...tempPlan,
      macroTasks: [...tempPlan.macroTasks, ...newTasks],
    };
    setTempPlan(updated);
    onUpdateMacroPlan(updated);
    audioSynth.playChime();
    confetti({ particleCount: 50, spread: 60 });
  };

  // Backup Download
  const handleDownloadBackup = () => {
    const jsonStr = exportDataToJSON();
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `studyclock_backup_${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  // Restore Upload
  const handleRestoreFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (evt) => {
      const content = evt.target?.result as string;
      if (content && importDataFromJSON(content)) {
        alert('データを正常に復元しました。画面を再読み込みします。');
        window.location.reload();
      } else {
        alert('バックアップファイルの読み込みに失敗しました。');
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="max-w-[1720px] w-full mx-auto space-y-4 font-mono">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-900/60 border border-slate-800 rounded-xl p-4 sm:p-5 shadow-lg text-slate-200">
        <div>
          <h2 className="font-bold text-sm sm:text-base uppercase tracking-wider text-amber-400 flex items-center gap-2 font-mono">
            <Sliders className="w-4 h-4 sm:w-5 sm:h-5 text-amber-400" />
            GARAGE // 24H_ALLOCATION_TUNER
          </h2>
          <p className="text-xs text-slate-400 font-sans mt-0.5">
            1日1440分(24時間)完全整合型配分設計 ＆ シーズン大計画設定
          </p>
        </div>

        <button
          onClick={handleSaveAll}
          className="px-3.5 py-1.5 rounded-md bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs uppercase flex items-center gap-1.5 shadow-sm transition-all self-start sm:self-auto whitespace-nowrap"
        >
          <Save className="w-3.5 h-3.5" />
          <span>SAVE_CONFIGURATION</span>
        </button>
      </div>

      {/* 1. 24-Hour 1440min Template Tuner */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-3.5 shadow-lg text-slate-200 space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-2">
          <div>
            <h3 className="font-bold text-xs text-slate-100 uppercase tracking-wider flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-blue-400" />
              TEMPLATE_ALLOCATION (1440 MIN // 24.0 HRS)
            </h3>
            <p className="text-[10px] text-slate-500">
              1日の合計時間を1440分(24.0h)に精密キャリブレーション
            </p>
          </div>

          {/* Phase switch */}
          <div className="flex bg-slate-950 p-0.5 rounded border border-slate-800 self-start sm:self-auto">
            <button
              onClick={() => setSelectedPhase('phase1')}
              className={`px-2.5 py-0.5 rounded text-[10px] font-bold uppercase transition-all ${
                selectedPhase === 'phase1' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              ① WEEKDAY (PHASE 1)
            </button>
            <button
              onClick={() => setSelectedPhase('phase2')}
              className={`px-2.5 py-0.5 rounded text-[10px] font-bold uppercase transition-all ${
                selectedPhase === 'phase2' ? 'bg-amber-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              ② WEEKEND (PHASE 2)
            </button>
          </div>
        </div>

        {/* Validation Status Badge */}
        <div
          className={`p-2 rounded border flex items-center justify-between gap-2 text-[11px] font-bold transition-all ${
            isExact1440
              ? 'bg-emerald-950/40 border-emerald-500/50 text-emerald-300'
              : 'bg-red-950/40 border-red-500/50 text-red-300'
          }`}
        >
          <div className="flex items-center gap-1.5">
            {isExact1440 ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
            ) : (
              <AlertTriangle className="w-4 h-4 text-red-400 flex-shrink-0 animate-bounce" />
            )}
            <span>
              {isExact1440
                ? 'TOTAL 1440 MIN (24.0H) SYNCHRONIZED PERFECTLY.'
                : `ALLOCATION: ${totalAllocatedMinutes} MIN (${(totalAllocatedMinutes / 60).toFixed(
                    1
                  )}H) - ${Math.abs(diffMinutes)} MIN ${
                    diffMinutes > 0 ? 'DEFICIT' : 'SURPLUS'
                  }`}
            </span>
          </div>

          <span className="font-mono font-bold text-xs">
            {totalAllocatedMinutes} / 1440 MIN
          </span>
        </div>

        {/* Sliders Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
          {templateKeys.map((key) => {
            const meta = SUBJECT_METAS[key as SubjectKey] || SUBJECT_METAS.life;
            const currentVal = activeTemplate[key] || 0;
            const currentHours = (currentVal / 60).toFixed(1);

            return (
              <div
                key={key}
                className="bg-slate-950/70 border border-slate-800 rounded p-2 space-y-1.5 hover:border-slate-700 transition-colors"
              >
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-1.5">
                    <span
                      className="w-2.5 h-2.5 rounded-full"
                      style={{ backgroundColor: meta.color }}
                    />
                    <span className="font-bold text-slate-200 text-[11px] font-sans">{meta.name}</span>
                  </div>

                  <div className="flex items-center gap-1.5 font-mono text-[10px]">
                    <span className="text-slate-400">{currentHours}h</span>
                    <span className="text-blue-400 font-bold">{currentVal}m</span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="range"
                    min="0"
                    max="600"
                    step="15"
                    value={currentVal}
                    onChange={(e) => handleTemplateValueChange(key, Number(e.target.value))}
                    className="flex-1 accent-blue-500 h-1 bg-slate-800 rounded cursor-pointer"
                  />
                  <input
                    type="number"
                    min="0"
                    max="1440"
                    step="15"
                    value={currentVal}
                    onChange={(e) => handleTemplateValueChange(key, Number(e.target.value))}
                    className="w-14 bg-slate-900 border border-slate-700 rounded px-1.5 py-0.5 text-[10px] text-right text-slate-200 font-mono"
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 2. Season Macro Target Settings */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-3.5 shadow-lg text-slate-200 space-y-3">
        <div className="flex items-center justify-between border-b border-slate-800 pb-2">
          <h3 className="font-bold text-xs text-slate-100 uppercase tracking-wider flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5 text-purple-400" />
            SEASON_TARGET // MACRO_CALIBRATION
          </h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 text-xs">
          <div>
            <label className="text-slate-400 block mb-1 text-[10px] uppercase font-bold">MACRO_PLAN_TITLE</label>
            <input
              type="text"
              value={tempPlan.title}
              onChange={(e) => setTempPlan({ ...tempPlan, title: e.target.value })}
              className="w-full bg-slate-950 border border-slate-700 rounded p-1.5 text-slate-200 font-bold text-xs font-sans"
            />
          </div>

          <div>
            <label className="text-slate-400 block mb-1 text-[10px] uppercase font-bold">TOTAL_TARGET (HRS)</label>
            <input
              type="number"
              min="10"
              max="2000"
              value={tempPlan.totalTargetHours}
              onChange={(e) => setTempPlan({ ...tempPlan, totalTargetHours: Number(e.target.value) })}
              className="w-full bg-slate-950 border border-slate-700 rounded p-1.5 text-slate-200 font-mono text-xs"
            />
          </div>

          <div>
            <label className="text-slate-400 block mb-1 text-[10px] uppercase font-bold">COMPLETED (HRS)</label>
            <input
              type="number"
              step="0.5"
              value={tempPlan.completedHours}
              onChange={(e) => setTempPlan({ ...tempPlan, completedHours: Number(e.target.value) })}
              className="w-full bg-slate-950 border border-slate-700 rounded p-1.5 text-slate-200 font-mono text-blue-400 font-bold text-xs"
            />
          </div>

          <div>
            <label className="text-slate-400 block mb-1 text-[10px] uppercase font-bold">EXAM_TARGET_DATE</label>
            <input
              type="date"
              value={tempPlan.examDate || ''}
              onChange={(e) => setTempPlan({ ...tempPlan, examDate: e.target.value })}
              className="w-full bg-slate-950 border border-slate-700 rounded p-1.5 text-slate-200 font-mono text-xs"
            />
          </div>
        </div>
      </div>

      {/* 3. Bulk Chapter Task Generator */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-3.5 shadow-lg text-slate-200 space-y-3">
        <div className="flex items-center justify-between border-b border-slate-800 pb-2">
          <h3 className="font-bold text-xs text-slate-100 uppercase tracking-wider flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-blue-400" />
            BULK_CHAPTER_CREATOR
          </h3>
          <span className="text-[10px] text-slate-500 uppercase">BATCH GENERATOR</span>
        </div>

        <form onSubmit={handleBulkGenerateChapters} className="grid grid-cols-1 sm:grid-cols-4 gap-2 text-xs">
          <div>
            <label className="text-slate-400 block mb-1 text-[10px] uppercase font-bold">SUBJECT</label>
            <select
              value={genSubject}
              onChange={(e) => setGenSubject(e.target.value as SubjectKey)}
              className="w-full bg-slate-950 border border-slate-700 rounded p-1.5 text-slate-200 text-xs"
            >
              {STUDY_SUBJECT_KEYS.map((k) => (
                <option key={k} value={k}>
                  {SUBJECT_METAS[k].name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-slate-400 block mb-1 text-[10px] uppercase font-bold">TEXTBOOK_NAME</label>
            <input
              type="text"
              value={genCategory}
              onChange={(e) => setGenCategory(e.target.value)}
              placeholder="例: 良問の風 / 重要問題集"
              required
              className="w-full bg-slate-950 border border-slate-700 rounded p-1.5 text-slate-200 text-xs font-sans"
            />
          </div>

          <div>
            <label className="text-slate-400 block mb-1 text-[10px] uppercase font-bold">CHAPTER_COUNT</label>
            <input
              type="number"
              min="1"
              max="50"
              value={genTotalChapters}
              onChange={(e) => setGenTotalChapters(Number(e.target.value))}
              className="w-full bg-slate-950 border border-slate-700 rounded p-1.5 text-slate-200 font-mono text-xs"
            />
          </div>

          <div className="flex items-end">
            <button
              type="submit"
              className="w-full py-1.5 rounded bg-blue-600 hover:bg-blue-500 text-white font-bold text-[10px] uppercase flex items-center justify-center gap-1 shadow-sm transition-all"
            >
              <BookOpen className="w-3 h-3" />
              <span>GENERATE {genTotalChapters} CHAPTERS</span>
            </button>
          </div>
        </form>
      </div>

      {/* 4. Data Management: Backup / Restore / Reset */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-3.5 shadow-lg text-slate-200 space-y-3">
        <div className="flex items-center justify-between border-b border-slate-800 pb-2">
          <h3 className="font-bold text-xs text-slate-100 uppercase tracking-wider">
            STORAGE // BACKUP & RESTORE
          </h3>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={handleDownloadBackup}
            className="px-3 py-1.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 text-[10px] font-bold uppercase flex items-center gap-1.5 border border-slate-700 transition-all"
          >
            <Download className="w-3 h-3 text-blue-400" />
            <span>EXPORT_JSON_BACKUP</span>
          </button>

          <label className="px-3 py-1.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 text-[10px] font-bold uppercase flex items-center gap-1.5 border border-slate-700 cursor-pointer transition-all">
            <Upload className="w-3 h-3 text-emerald-400" />
            <span>IMPORT_JSON</span>
            <input
              type="file"
              accept=".json"
              onChange={handleRestoreFile}
              className="hidden"
            />
          </label>

          <button
            onClick={onResetAllData}
            className="px-3 py-1.5 rounded bg-red-950/40 hover:bg-red-950/80 text-red-400 text-[10px] font-bold uppercase flex items-center gap-1.5 border border-red-900/50 transition-all ml-auto"
          >
            <RotateCcw className="w-3 h-3 text-red-400" />
            <span>FACTORY_RESET</span>
          </button>
        </div>
      </div>
    </div>
  );
};
