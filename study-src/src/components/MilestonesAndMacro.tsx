import React, { useState } from 'react';
import { MacroPlan, Milestone, MacroTask, SubjectKey, PaddockUserStatus } from '../types';
import { SUBJECT_METAS, STUDY_SUBJECT_KEYS } from '../constants/subjects';
import { audioSynth } from '../services/audio';
import confetti from 'canvas-confetti';
import {
  Flag,
  Target,
  CheckCircle2,
  Circle,
  Plus,
  Trash2,
  Users,
  Award,
  BookMarked,
} from 'lucide-react';

interface MilestonesAndMacroProps {
  macroPlan: MacroPlan;
  onUpdateMacroPlan: (plan: MacroPlan) => void;
  paddockDrivers: PaddockUserStatus[];
  onOpenTextbookManager?: () => void;
}

export const MilestonesAndMacro: React.FC<MilestonesAndMacroProps> = ({
  macroPlan,
  onUpdateMacroPlan,
  paddockDrivers,
  onOpenTextbookManager,
}) => {
  const [newMileTitle, setNewMileTitle] = useState<string>('');
  const [newMileDate, setNewMileDate] = useState<string>('');
  const [newMileContent, setNewMileContent] = useState<string>('');
  const [showAddMilestone, setShowAddMilestone] = useState<boolean>(false);

  const [selectedMacroSubject, setSelectedMacroSubject] = useState<SubjectKey>('math');
  const [newMacroCategory, setNewMacroCategory] = useState<string>('');
  const [newMacroGoal, setNewMacroGoal] = useState<string>('');
  const [showAddMacroTask, setShowAddMacroTask] = useState<boolean>(false);

  // Toggle Milestone
  const toggleMilestone = (id: string) => {
    const updated = macroPlan.milestones.map((m) => {
      if (m.id === id) {
        const nextDone = !m.done;
        if (nextDone) {
          audioSynth.playChime();
          confetti({ particleCount: 60, spread: 60 });
        }
        return { ...m, done: nextDone };
      }
      return m;
    });
    onUpdateMacroPlan({ ...macroPlan, milestones: updated });
  };

  const deleteMilestone = (id: string) => {
    const updated = macroPlan.milestones.filter((m) => m.id !== id);
    onUpdateMacroPlan({ ...macroPlan, milestones: updated });
  };

  const handleAddMilestone = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMileTitle.trim() || !newMileDate) return;

    const newM: Milestone = {
      id: `mile_${Date.now()}`,
      title: newMileTitle.trim(),
      date: newMileDate,
      content: newMileContent.trim(),
      done: false,
    };

    const updated = [...macroPlan.milestones, newM].sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
    );
    onUpdateMacroPlan({ ...macroPlan, milestones: updated });
    setNewMileTitle('');
    setNewMileDate('');
    setNewMileContent('');
    setShowAddMilestone(false);
  };

  // Toggle Macro Task
  const toggleMacroTask = (id: string) => {
    const updated = macroPlan.macroTasks.map((t) => {
      if (t.id === id) {
        const nextDone = !t.done;
        if (nextDone) {
          audioSynth.playTick();
          confetti({ particleCount: 30, spread: 45 });
        }
        return { ...t, done: nextDone };
      }
      return t;
    });
    onUpdateMacroPlan({ ...macroPlan, macroTasks: updated });
  };

  const deleteMacroTask = (id: string) => {
    const updated = macroPlan.macroTasks.filter((t) => t.id !== id);
    onUpdateMacroPlan({ ...macroPlan, macroTasks: updated });
  };

  const handleAddMacroTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMacroCategory.trim()) return;

    const newT: MacroTask = {
      id: `macro_${Date.now()}`,
      subject: selectedMacroSubject,
      category: newMacroCategory.trim(),
      goal: newMacroGoal.trim() || '1周完了',
      done: false,
    };

    onUpdateMacroPlan({ ...macroPlan, macroTasks: [...macroPlan.macroTasks, newT] });
    setNewMacroGoal('');
    setNewMacroCategory('');
    setShowAddMacroTask(false);
  };

  const completedMacroTasks = macroPlan.macroTasks.filter((t) => t.done).length;
  const totalMacroTasks = macroPlan.macroTasks.length;
  const macroTaskPercent = totalMacroTasks > 0 ? Math.round((completedMacroTasks / totalMacroTasks) * 100) : 0;

  const seasonProgressRate = macroPlan.totalTargetHours > 0
    ? Math.min(100, Math.round((macroPlan.completedHours / macroPlan.totalTargetHours) * 100))
    : 0;

  return (
    <div className="space-y-4 font-mono">
      {/* 1. Macro Season Progress Banner */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4 shadow-lg text-slate-200">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5 mb-3">
          <div>
            <div className="flex items-center gap-2">
              <Award className="w-4 h-4 text-amber-400" />
              <h3 className="font-bold text-xs sm:text-sm uppercase tracking-wider text-slate-100 font-sans">
                {macroPlan.title || '志望校合格大計画'}
              </h3>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              TARGET_HOURS: <strong className="text-blue-400">{macroPlan.totalTargetHours}H</strong> | COMPLETED:{' '}
              <strong className="text-emerald-400">{macroPlan.completedHours.toFixed(1)}H</strong> | REMAINING:{' '}
              <strong className="text-slate-300">
                {Math.max(0, macroPlan.totalTargetHours - macroPlan.completedHours).toFixed(1)}H
              </strong>
            </p>
          </div>

          <div className="text-right">
            <span className="text-2xl font-black text-blue-400">{seasonProgressRate}%</span>
            <span className="text-xs text-slate-500 block">
              {macroPlan.completedHours.toFixed(1)} / {macroPlan.totalTargetHours}H COMPLETE
            </span>
          </div>
        </div>

        {/* Progress bar */}
        <div className="w-full h-2.5 bg-slate-950 rounded-full overflow-hidden p-0.5 border border-slate-800">
          <div
            style={{ width: `${seasonProgressRate}%` }}
            className="h-full bg-blue-500 rounded-full transition-all duration-500 shadow-sm"
          />
        </div>
      </div>

      {/* 2. Milestones Checkpoints */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4 shadow-lg text-slate-200 space-y-3">
        <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
          <div className="flex items-center gap-2">
            <Flag className="w-4 h-4 text-red-400" />
            <h4 className="font-bold text-xs sm:text-sm text-slate-200 uppercase tracking-wider whitespace-nowrap">
              EXAM_CHECKPOINTS // MILESTONES
            </h4>
          </div>

          <button
            onClick={() => setShowAddMilestone(!showAddMilestone)}
            className="px-2.5 py-1.5 rounded-md bg-slate-800 hover:bg-slate-700 text-blue-400 text-xs font-bold uppercase flex items-center gap-1.5 border border-slate-700 transition-all whitespace-nowrap"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>ADD_MILESTONE</span>
          </button>
        </div>

        {showAddMilestone && (
          <form
            onSubmit={handleAddMilestone}
            className="bg-slate-950 border border-blue-500/40 rounded-lg p-3 space-y-2.5 text-xs animate-fade-in"
          >
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              <div>
                <label className="text-[10px] text-slate-500 font-bold uppercase block mb-1">TARGET_DATE</label>
                <input
                  type="date"
                  value={newMileDate}
                  onChange={(e) => setNewMileDate(e.target.value)}
                  required
                  className="w-full bg-slate-900 border border-slate-700 rounded px-2.5 py-1.5 text-slate-200 text-xs"
                />
              </div>
              <div className="sm:col-span-2">
                <label className="text-[10px] text-slate-500 font-bold uppercase block mb-1">MILESTONE_NAME</label>
                <input
                  type="text"
                  value={newMileTitle}
                  onChange={(e) => setNewMileTitle(e.target.value)}
                  placeholder="例: 第1回 駿台・ベネッセマーク模試"
                  required
                  className="w-full bg-slate-900 border border-slate-700 rounded px-2.5 py-1.5 text-slate-200 text-xs font-sans"
                />
              </div>
            </div>

            <div>
              <label className="text-[10px] text-slate-500 font-bold uppercase block mb-1">TARGET_SCORE / DESCRIPTION</label>
              <input
                type="text"
                value={newMileContent}
                onChange={(e) => setNewMileContent(e.target.value)}
                placeholder="例: 数学80点以上、理科7割目標"
                className="w-full bg-slate-900 border border-slate-700 rounded px-2.5 py-1.5 text-slate-200 text-xs font-sans"
              />
            </div>

            <div className="flex justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={() => setShowAddMilestone(false)}
                className="px-2.5 py-1 rounded bg-slate-800 text-slate-300 text-xs uppercase font-bold"
              >
                CANCEL
              </button>
              <button type="submit" className="px-3 py-1 rounded bg-blue-600 font-bold text-white text-xs uppercase">
                SUBMIT
              </button>
            </div>
          </form>
        )}

        <div className="space-y-2">
          {macroPlan.milestones.length === 0 ? (
            <div className="text-center py-5 text-slate-500 text-xs sm:text-sm border border-dashed border-slate-800/80 rounded-lg font-sans">
              まだチェックポイントはありません。「ADD_MILESTONE」から模試や本番日程を登録できます。
            </div>
          ) : (
            macroPlan.milestones.map((mile) => (
              <div
                key={mile.id}
                className={`flex items-center justify-between p-2.5 rounded-lg border transition-all ${
                  mile.done ? 'bg-slate-950/40 border-slate-800/40 opacity-70' : 'bg-slate-950/70 border-slate-800/70'
                }`}
              >
                <div className="flex items-center gap-2.5 min-w-0 flex-1">
                  <button
                    onClick={() => toggleMilestone(mile.id)}
                    className="text-slate-400 hover:text-emerald-400 transition-colors flex-shrink-0"
                  >
                    {mile.done ? (
                      <CheckCircle2 className="w-4.5 h-4.5 text-emerald-400" />
                    ) : (
                      <Circle className="w-4.5 h-4.5 text-slate-600" />
                    )}
                  </button>

                  <div className="text-xs text-red-400 bg-red-950/40 px-2 py-0.5 rounded border border-red-900/50 font-bold whitespace-nowrap flex-shrink-0">
                    {mile.date}
                  </div>

                  <div className="truncate flex-1">
                    <span className={`text-sm font-bold block font-sans ${mile.done ? 'line-through text-slate-500' : 'text-slate-200'}`}>
                      {mile.title}
                    </span>
                    {mile.content && (
                      <span className="text-xs text-slate-400 block truncate font-sans mt-0.5">{mile.content}</span>
                    )}
                  </div>
                </div>

                <button
                  onClick={() => deleteMilestone(mile.id)}
                  className="p-1 text-slate-500 hover:text-red-400 transition-colors ml-2 flex-shrink-0"
                  title="削除"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))
          )}
        </div>
      </div>

      {/* 3. Macro Subject Strategy Board */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4 shadow-lg text-slate-200 space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-2.5">
          <div className="flex items-center gap-2">
            <BookMarked className="w-4 h-4 text-blue-400" />
            <h4 className="font-bold text-xs sm:text-sm text-slate-200 uppercase tracking-wider whitespace-nowrap">
              TEXTBOOKS & STRATEGY ({completedMacroTasks}/{totalMacroTasks} - {macroTaskPercent}%)
            </h4>
          </div>

          <div className="flex items-center gap-2 flex-shrink-0">
            {onOpenTextbookManager && (
              <button
                onClick={onOpenTextbookManager}
                className="px-2.5 py-1.5 rounded-md bg-blue-950 hover:bg-blue-900 border border-blue-500/50 text-blue-300 text-xs font-bold uppercase flex items-center gap-1.5 transition-all whitespace-nowrap"
                title="教材管理マネージャーを開く"
              >
                <span>📚 教材マネージャー</span>
              </button>
            )}

            <button
              onClick={() => setShowAddMacroTask(!showAddMacroTask)}
              className="px-2.5 py-1.5 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold uppercase flex items-center gap-1.5 border border-slate-700 transition-all whitespace-nowrap"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>ADD</span>
            </button>
          </div>
        </div>

        {showAddMacroTask && (
          <form
            onSubmit={handleAddMacroTask}
            className="bg-slate-950 border border-blue-500/40 rounded-lg p-3 space-y-2.5 text-xs animate-fade-in"
          >
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              <div>
                <label className="text-[10px] text-slate-500 font-bold uppercase block mb-1">SUBJECT</label>
                <select
                  value={selectedMacroSubject}
                  onChange={(e) => setSelectedMacroSubject(e.target.value as SubjectKey)}
                  className="w-full bg-slate-900 border border-slate-700 rounded px-2.5 py-1.5 text-slate-200 text-xs"
                >
                  {STUDY_SUBJECT_KEYS.map((k) => (
                    <option key={k} value={k}>
                      {SUBJECT_METAS[k].name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-[10px] text-slate-500 font-bold uppercase block mb-1">CATEGORY / MATERIAL</label>
                <input
                  type="text"
                  value={newMacroCategory}
                  onChange={(e) => setNewMacroCategory(e.target.value)}
                  placeholder="例: 青チャート / 名問の森"
                  required
                  className="w-full bg-slate-900 border border-slate-700 rounded px-2.5 py-1.5 text-slate-200 text-xs font-sans"
                />
              </div>

              <div>
                <label className="text-[10px] text-slate-500 font-bold uppercase block mb-1">GOAL_SCOPE</label>
                <input
                  type="text"
                  value={newMacroGoal}
                  onChange={(e) => setNewMacroGoal(e.target.value)}
                  placeholder="例: 例題1周 (1〜150問)"
                  className="w-full bg-slate-900 border border-slate-700 rounded px-2.5 py-1.5 text-slate-200 text-xs font-sans"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={() => setShowAddMacroTask(false)}
                className="px-2.5 py-1 rounded bg-slate-800 text-slate-300 text-xs uppercase font-bold"
              >
                CANCEL
              </button>
              <button type="submit" className="px-3 py-1 rounded bg-blue-600 font-bold text-white text-xs uppercase">
                SUBMIT
              </button>
            </div>
          </form>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-[300px] overflow-y-auto pr-1">
          {macroPlan.macroTasks.length === 0 ? (
            <div className="col-span-2 text-center py-6 text-slate-500 text-xs sm:text-sm border border-dashed border-slate-800/80 rounded-lg font-sans">
              登録された教材・目標はありません。「📚 教材マネージャー」から参考書を登録してください。
            </div>
          ) : (
            macroPlan.macroTasks.map((t) => {
              const meta = SUBJECT_METAS[t.subject] || SUBJECT_METAS.math;
              return (
                <div
                  key={t.id}
                  className={`p-2.5 rounded-lg border flex items-center justify-between gap-2 transition-all ${
                    t.done ? 'bg-slate-950/40 border-slate-800/40 opacity-70' : 'bg-slate-950/70 border-slate-800/70'
                  }`}
                >
                  <div className="flex items-center gap-2 min-w-0 flex-1">
                    <button
                      onClick={() => toggleMacroTask(t.id)}
                      className="text-slate-400 hover:text-emerald-400 transition-colors flex-shrink-0"
                    >
                      {t.done ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                      ) : (
                        <Circle className="w-4 h-4 text-slate-600" />
                      )}
                    </button>

                    <span
                      className="px-2 py-0.5 rounded text-xs font-bold uppercase flex-shrink-0 font-sans whitespace-nowrap"
                      style={{
                        backgroundColor: `${meta.color}20`,
                        color: meta.color,
                        border: `1px solid ${meta.color}40`,
                      }}
                    >
                      {meta.name}
                    </span>

                    <div className="truncate flex-1">
                      <span className="text-xs font-semibold text-slate-200 block truncate font-sans">
                        {t.category ? `[${t.category}] ` : ''}
                        {t.goal}
                      </span>
                    </div>
                  </div>

                  <button
                    onClick={() => deleteMacroTask(t.id)}
                    className="p-1 text-slate-500 hover:text-red-400 transition-colors flex-shrink-0"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};

