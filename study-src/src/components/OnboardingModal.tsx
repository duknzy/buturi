import React, { useState } from 'react';
import { UserProfile, MacroPlan, MacroTask, SubjectKey } from '../types';
import { SUBJECT_METAS, STUDY_SUBJECT_KEYS } from '../constants/subjects';
import { POPULAR_TEXTBOOKS } from './TextbookManagerModal';
import { audioSynth } from '../services/audio';
import confetti from 'canvas-confetti';
import {
  User,
  Target,
  Calendar,
  BookOpen,
  ChevronRight,
  ChevronLeft,
  Sparkles,
  CheckCircle2,
  Plus,
  Trash2,
  Tag,
  Clock,
  Award,
} from 'lucide-react';

interface OnboardingModalProps {
  initialProfile: UserProfile;
  initialMacroPlan: MacroPlan;
  onComplete: (profile: UserProfile, macroPlan: MacroPlan) => void;
}

export const OnboardingModal: React.FC<OnboardingModalProps> = ({
  initialProfile,
  initialMacroPlan,
  onComplete,
}) => {
  const [step, setStep] = useState<number>(1);

  // Step 1: User Profile
  const [name, setName] = useState<string>(initialProfile.name || 'Flora');
  const [targetUniversity, setTargetUniversity] = useState<string>(initialProfile.target || '');

  // Step 2: Season Macro Goals
  const [planTitle, setPlanTitle] = useState<string>(initialMacroPlan.title || '志望校合格大計画');
  const [examDate, setExamDate] = useState<string>(initialMacroPlan.examDate || '');
  const [totalTargetHours, setTotalTargetHours] = useState<number>(initialMacroPlan.totalTargetHours || 350);

  // Step 3: Registered Textbooks
  const [macroTasks, setMacroTasks] = useState<MacroTask[]>(initialMacroPlan.macroTasks || []);
  const [activeSubject, setActiveSubject] = useState<SubjectKey>('math');
  const [customBookName, setCustomBookName] = useState<string>('');
  const [customGoalScope, setCustomGoalScope] = useState<string>('');

  const handleNextStep = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (step === 1 && !name.trim()) return;
    audioSynth.playTick();
    setStep((prev) => Math.min(3, prev + 1));
  };

  const handlePrevStep = () => {
    audioSynth.playTick();
    setStep((prev) => Math.max(1, prev - 1));
  };

  const handleAddTextbook = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!customBookName.trim()) return;

    const newTask: MacroTask = {
      id: `init_book_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
      subject: activeSubject,
      category: customBookName.trim(),
      goal: customGoalScope.trim() || '1周完了・要点マスター',
      done: false,
    };

    setMacroTasks((prev) => [...prev, newTask]);
    setCustomBookName('');
    setCustomGoalScope('');
    audioSynth.playTick();
  };

  const handleQuickAdd = (bookTitle: string) => {
    const isAlreadyAdded = macroTasks.some(
      (t) => t.subject === activeSubject && t.category === bookTitle
    );
    if (isAlreadyAdded) return;

    const newTask: MacroTask = {
      id: `init_book_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
      subject: activeSubject,
      category: bookTitle,
      goal: '例題・重要問題 1周完了',
      done: false,
    };

    setMacroTasks((prev) => [...prev, newTask]);
    audioSynth.playTick();
  };

  const handleDeleteTask = (id: string) => {
    setMacroTasks((prev) => prev.filter((t) => t.id !== id));
  };

  const handleFinish = () => {
    const finalProfile: UserProfile = {
      name: name.trim() || 'Flora',
      target: targetUniversity.trim() || '志望校現役合格',
      goals: {},
    };

    const finalPlan: MacroPlan = {
      ...initialMacroPlan,
      title: planTitle.trim() || `${finalProfile.name}の合格計画`,
      totalTargetHours: Number(totalTargetHours) || 300,
      completedHours: 0,
      examDate: examDate || '',
      macroTasks,
      milestones: examDate
        ? [
            {
              id: `mile_init_1`,
              title: '本番試験 // 最終決戦',
              date: examDate,
              content: `${finalProfile.target} 突破`,
              done: false,
            },
          ]
        : [],
    };

    audioSynth.playChime();
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 },
    });
    onComplete(finalProfile, finalPlan);
  };

  const currentSubjectTasks = macroTasks.filter((t) => t.subject === activeSubject);
  const meta = SUBJECT_METAS[activeSubject] || SUBJECT_METAS.math;
  const suggestions = POPULAR_TEXTBOOKS[activeSubject] || [];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/90 backdrop-blur-lg animate-fade-in font-mono">
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl w-full max-w-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh] text-slate-200">
        {/* Top Branding Banner */}
        <div className="px-5 py-4 bg-gradient-to-r from-blue-950 via-slate-900 to-indigo-950 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-3 h-3 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.8)]" />
            <div>
              <h2 className="font-black text-sm sm:text-base tracking-wider text-blue-400 font-mono">
                STUDYCLOCK // INITIAL SYSTEM SETUP
              </h2>
              <p className="text-xs text-slate-400 font-sans mt-0.5">
                テレメトリ初期設定ウィザード（後からいつでも変更できます）
              </p>
            </div>
          </div>
          <span className="text-xs font-bold text-slate-300 bg-slate-950 px-2.5 py-1 rounded-md border border-slate-800">
            STEP {step} / 3
          </span>
        </div>

        {/* Step Indicator Bar */}
        <div className="grid grid-cols-3 border-b border-slate-800 text-center font-sans text-xs">
          <div
            className={`py-2 px-1 border-b-2 font-bold transition-all flex items-center justify-center gap-1.5 ${
              step === 1
                ? 'border-blue-500 text-blue-400 bg-blue-950/20'
                : step > 1
                ? 'border-emerald-500 text-emerald-400'
                : 'border-transparent text-slate-500'
            }`}
          >
            <span>1. プロフィール</span>
          </div>

          <div
            className={`py-2 px-1 border-b-2 font-bold transition-all flex items-center justify-center gap-1.5 ${
              step === 2
                ? 'border-blue-500 text-blue-400 bg-blue-950/20'
                : step > 2
                ? 'border-emerald-500 text-emerald-400'
                : 'border-transparent text-slate-500'
            }`}
          >
            <span>2. 目標・受験日</span>
          </div>

          <div
            className={`py-2 px-1 border-b-2 font-bold transition-all flex items-center justify-center gap-1.5 ${
              step === 3
                ? 'border-blue-500 text-blue-400 bg-blue-950/20'
                : 'border-transparent text-slate-500'
            }`}
          >
            <span>3. 教材・参考書</span>
          </div>
        </div>

        {/* Wizard Step Content */}
        <div className="p-5 sm:p-6 overflow-y-auto flex-1 space-y-4 font-sans text-xs">
          {/* STEP 1: Profile */}
          {step === 1 && (
            <div className="space-y-4 animate-fade-in">
              <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-3.5 space-y-1">
                <h3 className="font-bold text-sm text-slate-100 flex items-center gap-1.5 font-mono">
                  <User className="w-4 h-4 text-blue-400" /> あなたのお名前と志望校
                </h3>
                <p className="text-slate-400 text-xs">
                  StudyClock のテレメトリ画面やヘッダーに表示されるコールサインを設定します。
                </p>
              </div>

              <div className="space-y-3 font-mono">
                <div>
                  <label className="text-slate-300 font-bold block mb-1 text-xs font-sans">
                    お名前 / ニックネーム <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="例: Koki / 佐藤"
                    autoFocus
                    required
                    className="w-full bg-slate-950 border border-slate-700 focus:border-blue-500 rounded-lg px-3.5 py-2.5 text-sm text-slate-100 font-sans focus:outline-none shadow-inner"
                  />
                </div>

                <div>
                  <label className="text-slate-300 font-bold block mb-1 text-xs font-sans">
                    志望校 / ターゲット目標
                  </label>
                  <input
                    type="text"
                    value={targetUniversity}
                    onChange={(e) => setTargetUniversity(e.target.value)}
                    placeholder="例: 東京大学 理科一類 現役合格 / 国公立医学部 / 早慶理工"
                    className="w-full bg-slate-950 border border-slate-700 focus:border-blue-500 rounded-lg px-3.5 py-2.5 text-sm text-slate-100 font-sans focus:outline-none shadow-inner"
                  />
                </div>
              </div>
            </div>
          )}

          {/* STEP 2: Target & Exam Date */}
          {step === 2 && (
            <div className="space-y-4 animate-fade-in">
              <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-3.5 space-y-1">
                <h3 className="font-bold text-sm text-slate-100 flex items-center gap-1.5 font-mono">
                  <Target className="w-4 h-4 text-purple-400" /> 目標期日と総学習時間
                </h3>
                <p className="text-slate-400 text-xs">
                  本番までのカウントダウンや、シーズン進捗バーの計算基準になります。
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 font-mono">
                <div>
                  <label className="text-slate-300 font-bold block mb-1 text-xs font-sans">
                    本番試験日 / 目標達成期日
                  </label>
                  <div className="relative">
                    <input
                      type="date"
                      value={examDate}
                      onChange={(e) => setExamDate(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-700 focus:border-blue-500 rounded-lg px-3.5 py-2.5 text-sm text-slate-100 font-mono focus:outline-none shadow-inner"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-slate-300 font-bold block mb-1 text-xs font-sans">
                    総目標学習時間 (時間)
                  </label>
                  <input
                    type="number"
                    min="10"
                    max="3000"
                    step="10"
                    value={totalTargetHours}
                    onChange={(e) => setTotalTargetHours(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-700 focus:border-blue-500 rounded-lg px-3.5 py-2.5 text-sm text-slate-100 font-mono focus:outline-none shadow-inner"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="text-slate-300 font-bold block mb-1 text-xs font-sans">
                    大計画タイトル
                  </label>
                  <input
                    type="text"
                    value={planTitle}
                    onChange={(e) => setPlanTitle(e.target.value)}
                    placeholder="例: 2026年 志望校現役合格大計画"
                    className="w-full bg-slate-950 border border-slate-700 focus:border-blue-500 rounded-lg px-3.5 py-2 text-sm text-slate-100 font-sans focus:outline-none"
                  />
                </div>
              </div>
            </div>
          )}

          {/* STEP 3: Reference Books & Textbooks */}
          {step === 3 && (
            <div className="space-y-3.5 animate-fade-in">
              <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-3 space-y-1">
                <h3 className="font-bold text-xs sm:text-sm text-slate-100 flex items-center gap-1.5 font-mono">
                  <BookOpen className="w-4 h-4 text-blue-400" /> 使用する教材・参考書の登録
                </h3>
                <p className="text-slate-400 text-xs">
                  使っている参考書を選んでワンタップで登録できます。後から追加・編集も可能です。
                </p>
              </div>

              {/* Subject Tabs */}
              <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1">
                {STUDY_SUBJECT_KEYS.map((k) => {
                  const sm = SUBJECT_METAS[k];
                  const isSelected = activeSubject === k;
                  const count = macroTasks.filter((t) => t.subject === k).length;

                  return (
                    <button
                      key={k}
                      type="button"
                      onClick={() => setActiveSubject(k)}
                      className={`px-3 py-1 rounded-lg text-xs font-bold whitespace-nowrap transition-all flex items-center gap-1.5 ${
                        isSelected
                          ? 'bg-blue-600 text-white shadow-md'
                          : 'bg-slate-950 border border-slate-800 text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      <span>{sm.name}</span>
                      {count > 0 && (
                        <span className="px-1.5 py-0.2 rounded-full text-[9px] bg-slate-800 text-slate-200 font-mono">
                          {count}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Quick Suggestion Tags */}
              {suggestions.length > 0 && (
                <div className="bg-slate-950/80 border border-slate-800/80 rounded-xl p-2.5 space-y-1.5">
                  <span className="text-[10px] text-blue-400 font-bold uppercase flex items-center gap-1 font-mono">
                    <Sparkles className="w-3 h-3" /> 定番教材（タップで簡単追加）:
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {suggestions.map((s) => {
                      const isAdded = macroTasks.some(
                        (t) => t.subject === activeSubject && t.category === s
                      );
                      return (
                        <button
                          key={s}
                          type="button"
                          onClick={() => handleQuickAdd(s)}
                          disabled={isAdded}
                          className={`px-2.5 py-1 rounded-md text-xs transition-all flex items-center gap-1 border ${
                            isAdded
                              ? 'bg-emerald-950/60 border-emerald-500/40 text-emerald-300 opacity-60 cursor-default'
                              : 'bg-slate-900 hover:bg-blue-950 border-slate-700 hover:border-blue-500 text-slate-200'
                          }`}
                        >
                          {isAdded ? (
                            <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                          ) : (
                            <Plus className="w-3 h-3 text-blue-400" />
                          )}
                          <span>{s}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Custom Input */}
              <div className="bg-slate-950 border border-slate-800 rounded-xl p-3 space-y-2">
                <span className="text-[11px] font-bold text-slate-300 font-mono">
                  ＋ その他・自由入力で教材を追加:
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <input
                    type="text"
                    value={customBookName}
                    onChange={(e) => setCustomBookName(e.target.value)}
                    placeholder="教材名 (例: 難関大過去問)"
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-100 focus:outline-none focus:border-blue-500"
                  />
                  <input
                    type="text"
                    value={customGoalScope}
                    onChange={(e) => setCustomGoalScope(e.target.value)}
                    placeholder="目標 (例: 1周完了)"
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-100 focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={handleAddTextbook}
                    className="px-3 py-1 bg-slate-800 hover:bg-slate-700 text-blue-300 rounded-lg text-xs font-bold uppercase transition-all flex items-center gap-1"
                  >
                    <Plus className="w-3 h-3" />
                    <span>登録リストに追加</span>
                  </button>
                </div>
              </div>

              {/* Current registered tasks for active subject */}
              {currentSubjectTasks.length > 0 && (
                <div className="space-y-1.5">
                  <span className="text-[10px] text-slate-400 font-mono font-bold uppercase">
                    登録済み教材 ({currentSubjectTasks.length}冊):
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                    {currentSubjectTasks.map((t) => (
                      <div
                        key={t.id}
                        className="p-2 rounded-lg bg-slate-950 border border-slate-800 flex items-center justify-between gap-2"
                      >
                        <div className="truncate">
                          <span className="font-bold text-xs text-slate-200 block truncate">
                            {t.category}
                          </span>
                          <span className="text-[10px] text-slate-400 truncate block">
                            {t.goal}
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleDeleteTask(t.id)}
                          className="text-slate-500 hover:text-red-400 p-1"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Wizard Navigation Footer */}
        <div className="px-5 py-3.5 border-t border-slate-800 bg-slate-950 flex items-center justify-between font-mono">
          {step > 1 ? (
            <button
              onClick={handlePrevStep}
              className="px-3.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold uppercase flex items-center gap-1 transition-all"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
              <span>戻る (BACK)</span>
            </button>
          ) : (
            <div />
          )}

          {step < 3 ? (
            <button
              onClick={handleNextStep}
              disabled={step === 1 && !name.trim()}
              className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 disabled:opacity-40 disabled:cursor-not-allowed text-white text-xs font-bold uppercase flex items-center gap-1.5 shadow-md transition-all font-sans"
            >
              <span>次へ進む</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              onClick={handleFinish}
              className="px-5 py-2 rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-xs font-bold uppercase flex items-center gap-2 shadow-lg transition-all font-sans"
            >
              <Award className="w-4 h-4 text-amber-300" />
              <span>設定を完了して開始する</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
