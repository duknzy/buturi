import React, { useState } from 'react';
import { MacroTask, SubjectKey } from '../types';
import { SUBJECT_METAS, STUDY_SUBJECT_KEYS } from '../constants/subjects';
import { BookOpen, Plus, Trash2, CheckCircle2, Circle, X, Sparkles, BookmarkPlus, Tag } from 'lucide-react';
import { audioSynth } from '../services/audio';

export const POPULAR_TEXTBOOKS: Record<string, string[]> = {
  math: ['青チャート', 'Focus Gold', '1対1対応の演習', '基礎問題精講', '標準問題精講', 'やさしい理系数学', '合格る計算'],
  physics: ['物理のエッセンス', '良問の風', '名問の森', '重要問題集 物理', '体系物理', '難問題の系統とその解き方'],
  chem: ['重要問題集 化学', '宇宙一わかりやすい化学', 'Doシリーズ(無機/有機)', '化学の新演習', '基礎問題精講 化学'],
  eng: ['システム英単語', 'ターゲット1900', '鉄緑会 鉄壁', 'ポラリス 英語長文', 'やっておきたい英語長文', 'Next Stage', 'Vintage', '英文熟考'],
  kobun: ['古文単語315', 'マドンナ古文', '古文上達 基礎編', 'ステップアップノート30'],
  jp: ['現代文ポラリス', '入試現代文へのアクセス', '漢文早覚え速答法', '漢文ヤマのヤマ'],
  soc: ['共通テスト 蔭山の政治・経済', '時代と流れで覚える日本史', '山川 詳説世界史', '共通テスト 地理B集中講義'],
  info: ['情報I 一問一答', '高校情報Iをひとつひとつわかりやすく'],
};

interface TextbookManagerModalProps {
  macroTasks: MacroTask[];
  onUpdateMacroTasks: (tasks: MacroTask[]) => void;
  onClose: () => void;
}

export const TextbookManagerModal: React.FC<TextbookManagerModalProps> = ({
  macroTasks,
  onUpdateMacroTasks,
  onClose,
}) => {
  const [selectedSubject, setSelectedSubject] = useState<SubjectKey>('math');
  const [bookName, setBookName] = useState<string>('');
  const [goalScope, setGoalScope] = useState<string>('');

  const currentSubjectTasks = macroTasks.filter((t) => t.subject === selectedSubject);

  const handleAdd = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!bookName.trim()) return;

    const newTask: MacroTask = {
      id: `textbook_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
      subject: selectedSubject,
      category: bookName.trim(),
      goal: goalScope.trim() || '1周完了・要点マスター',
      done: false,
    };

    onUpdateMacroTasks([...macroTasks, newTask]);
    setBookName('');
    setGoalScope('');
    audioSynth.playTick();
  };

  const handleQuickAdd = (suggestedName: string) => {
    setBookName(suggestedName);
    if (!goalScope) {
      setGoalScope('例題・重要問題 1周完了');
    }
  };

  const toggleDone = (id: string) => {
    const updated = macroTasks.map((t) => {
      if (t.id === id) {
        const nextDone = !t.done;
        if (nextDone) audioSynth.playChime();
        return { ...t, done: nextDone };
      }
      return t;
    });
    onUpdateMacroTasks(updated);
  };

  const handleDelete = (id: string) => {
    onUpdateMacroTasks(macroTasks.filter((t) => t.id !== id));
    audioSynth.playTick();
  };

  const meta = SUBJECT_METAS[selectedSubject] || SUBJECT_METAS.math;
  const suggestions = POPULAR_TEXTBOOKS[selectedSubject] || [];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in font-mono">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] text-slate-200">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-800 bg-slate-950/60">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-500/20 border border-blue-500/40 flex items-center justify-center text-blue-400">
              <BookOpen className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-sm sm:text-base text-slate-100 uppercase tracking-wider font-mono whitespace-nowrap">
                TEXTBOOK_REGISTRATION // 教材・参考書マネージャー
              </h3>
              <p className="text-xs text-slate-400 font-sans mt-0.5">
                科目ごとに使用する参考書や問題集を登録し、目標を設定します
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-slate-200 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Subject Filter Tabs */}
        <div className="flex items-center gap-2 px-5 py-2.5 bg-slate-950 border-b border-slate-800 overflow-x-auto no-scrollbar">
          {STUDY_SUBJECT_KEYS.map((k) => {
            const sm = SUBJECT_METAS[k];
            const isSelected = selectedSubject === k;
            const count = macroTasks.filter((t) => t.subject === k).length;

            return (
              <button
                key={k}
                onClick={() => setSelectedSubject(k)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold uppercase whitespace-nowrap transition-all flex items-center gap-1.5 font-sans ${
                  isSelected
                    ? 'bg-blue-600 text-white shadow-md'
                    : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-800/80'
                }`}
              >
                <span>{sm.name}</span>
                {count > 0 && (
                  <span
                    className={`px-1.5 py-0.5 rounded-full text-[10px] font-mono ${
                      isSelected ? 'bg-blue-800 text-blue-100' : 'bg-slate-800 text-slate-400'
                    }`}
                  >
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Body Content */}
        <div className="p-5 overflow-y-auto space-y-4 flex-1">
          {/* Quick Suggestions for Selected Subject */}
          {suggestions.length > 0 && (
            <div className="bg-slate-950/70 border border-slate-800/80 rounded-xl p-3 space-y-2">
              <div className="flex items-center gap-1 text-[10px] text-blue-400 font-bold uppercase tracking-wide">
                <Sparkles className="w-3 h-3" />
                <span>定番の{meta.name}教材クイック候補（タップで入力）:</span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {suggestions.map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => handleQuickAdd(s)}
                    className="px-2.5 py-1 rounded-md bg-slate-900 hover:bg-blue-950/70 border border-slate-800 hover:border-blue-500/50 text-[11px] font-sans text-slate-300 hover:text-blue-300 transition-all flex items-center gap-1"
                  >
                    <Tag className="w-2.5 h-2.5 text-slate-500" />
                    <span>{s}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Add Textbook Form */}
          <form
            onSubmit={handleAdd}
            className="bg-slate-950 border border-blue-500/30 rounded-xl p-3 sm:p-4 space-y-3 shadow-inner"
          >
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-blue-400 uppercase flex items-center gap-1.5 font-mono">
                <BookmarkPlus className="w-3.5 h-3.5" /> 新しい{meta.name}の教材を追加
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-[10px] text-slate-400 font-bold uppercase block mb-1">
                  教材・問題集名 <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  value={bookName}
                  onChange={(e) => setBookName(e.target.value)}
                  placeholder={`例: ${suggestions[0] || '青チャート'}`}
                  required
                  className="w-full bg-slate-900 border border-slate-700 focus:border-blue-500 rounded-lg px-3 py-2 text-xs text-slate-100 font-sans focus:outline-none"
                />
              </div>

              <div>
                <label className="text-[10px] text-slate-400 font-bold uppercase block mb-1">
                  達成目標・範囲（例: 周回数、問題数）
                </label>
                <input
                  type="text"
                  value={goalScope}
                  onChange={(e) => setGoalScope(e.target.value)}
                  placeholder="例: 例題1周完了 (1〜180問)"
                  className="w-full bg-slate-900 border border-slate-700 focus:border-blue-500 rounded-lg px-3 py-2 text-xs text-slate-100 font-sans focus:outline-none"
                />
              </div>
            </div>

            <div className="flex justify-end pt-1">
              <button
                type="submit"
                className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-bold font-mono uppercase flex items-center gap-1.5 shadow-md transition-all"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>教材を登録する</span>
              </button>
            </div>
          </form>

          {/* Registered Textbooks List for Current Subject */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs text-slate-400 font-mono">
              <span className="font-bold uppercase">
                {meta.name}の登録教材一覧 ({currentSubjectTasks.length}冊)
              </span>
            </div>

            {currentSubjectTasks.length === 0 ? (
              <div className="text-center py-6 border border-dashed border-slate-800 rounded-xl text-slate-500 text-xs font-sans">
                まだ{meta.name}の教材は登録されていません。上のフォームから登録してください。
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-2">
                {currentSubjectTasks.map((t) => (
                  <div
                    key={t.id}
                    className={`p-3 rounded-xl border flex items-center justify-between gap-3 transition-all ${
                      t.done
                        ? 'bg-slate-950/40 border-slate-800/40 opacity-70'
                        : 'bg-slate-950/80 border-slate-800 hover:border-slate-700 shadow-sm'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <button
                        onClick={() => toggleDone(t.id)}
                        className="text-slate-400 hover:text-emerald-400 transition-colors flex-shrink-0"
                        title={t.done ? '未完了に戻す' : '完了済みにする'}
                      >
                        {t.done ? (
                          <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                        ) : (
                          <Circle className="w-5 h-5 text-slate-600 hover:text-blue-400" />
                        )}
                      </button>

                      <div className="truncate flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-xs sm:text-sm text-slate-100 font-sans truncate">
                            {t.category}
                          </span>
                          {t.done && (
                            <span className="px-1.5 py-0.5 rounded text-[9px] bg-emerald-950 border border-emerald-500/50 text-emerald-300 font-bold font-mono">
                              COMPLETE
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-slate-400 font-sans truncate mt-0.5">
                          目標: {t.goal}
                        </p>
                      </div>
                    </div>

                    <button
                      onClick={() => handleDelete(t.id)}
                      className="p-1.5 text-slate-500 hover:text-red-400 rounded-lg hover:bg-red-950/30 transition-colors flex-shrink-0"
                      title="削除"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-4 sm:px-5 py-3 border-t border-slate-800 bg-slate-950 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-bold font-mono uppercase shadow-md transition-all"
          >
            完了 (CLOSE)
          </button>
        </div>
      </div>
    </div>
  );
};
