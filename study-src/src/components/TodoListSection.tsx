import React, { useState, useMemo } from 'react';
import { TodoItem, TodoPriority, SubjectKey } from '../types';
import { SUBJECT_METAS, STUDY_SUBJECT_KEYS } from '../constants/subjects';
import { audioSynth } from '../services/audio';
import { getTodayDateStr } from '../services/storage';
import confetti from 'canvas-confetti';
import { User } from 'firebase/auth';
import {
  ListTodo,
  Plus,
  Trash2,
  Edit2,
  CheckCircle2,
  Circle,
  Timer,
  CalendarPlus,
  Sparkles,
  Search,
  Filter,
  CheckCheck,
  Flame,
  AlertCircle,
  Clock,
  Save,
  X,
  Cloud,
  CloudCheck,
  LogIn,
  LogOut,
  RefreshCw,
} from 'lucide-react';

interface TodoListSectionProps {
  todos: TodoItem[];
  onUpdateTodos: (todos: TodoItem[]) => void;
  onSelectTodoForTimer?: (todo: TodoItem) => void;
  onAddTodoToTimeline?: (todo: TodoItem, startTime: string, durationMinutes: number) => void;
  currentUser?: User | null;
  onLoginWithGoogle?: () => void;
  onLogout?: () => void;
  isSyncing?: boolean;
}

export const TodoListSection: React.FC<TodoListSectionProps> = ({
  todos,
  onUpdateTodos,
  onSelectTodoForTimer,
  onAddTodoToTimeline,
  currentUser = null,
  onLoginWithGoogle,
  onLogout,
  isSyncing = false,
}) => {
  // Input form state
  const [newText, setNewText] = useState<string>('');
  const [newPriority, setNewPriority] = useState<TodoPriority>('high');
  const [newSubject, setNewSubject] = useState<SubjectKey>('math');
  const [newEstimatedMinutes, setNewEstimatedMinutes] = useState<number>(45);
  const [newDueDate, setNewDueDate] = useState<string>(getTodayDateStr());
  const [showAdvancedInput, setShowAdvancedInput] = useState<boolean>(false);

  // Filter & Search state
  const [filterTab, setFilterTab] = useState<'all' | 'active' | 'completed'>('all');
  const [filterPriority, setFilterPriority] = useState<TodoPriority | 'all'>('all');
  const [filterSubject, setFilterSubject] = useState<SubjectKey | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Editing task state
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editText, setEditText] = useState<string>('');
  const [editPriority, setEditPriority] = useState<TodoPriority>('medium');
  const [editSubject, setEditSubject] = useState<SubjectKey>('math');
  const [editEstimatedMinutes, setEditEstimatedMinutes] = useState<number>(45);
  const [editDueDate, setEditDueDate] = useState<string>('');

  // Schedule modal / popover state
  const [schedulingTodo, setSchedulingTodo] = useState<TodoItem | null>(null);
  const [scheduleStartTime, setScheduleStartTime] = useState<string>('17:00');
  const [scheduleDuration, setScheduleDuration] = useState<number>(45);

  const todayStr = getTodayDateStr();

  // Add new todo
  const handleAddTodo = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!newText.trim()) return;

    const newTodo: TodoItem = {
      id: `todo_${Date.now()}`,
      text: newText.trim(),
      done: false,
      priority: newPriority,
      subject: newSubject,
      estimatedMinutes: newEstimatedMinutes,
      dueDate: newDueDate || todayStr,
      createdAt: new Date().toISOString(),
    };

    const updated = [newTodo, ...todos];
    onUpdateTodos(updated);
    audioSynth.playTick();
    setNewText('');
  };

  // Toggle todo done
  const handleToggleDone = (id: string) => {
    const target = todos.find((t) => t.id === id);
    const willBeDone = target ? !target.done : false;

    const updated = todos.map((t) => {
      if (t.id === id) {
        return { ...t, done: willBeDone };
      }
      return t;
    });

    onUpdateTodos(updated);

    if (willBeDone) {
      audioSynth.playChime();
      // Check if all remaining todos are now completed
      const remaining = updated.filter((t) => !t.done);
      if (remaining.length === 0 && updated.length > 0) {
        confetti({
          particleCount: 70,
          spread: 70,
          origin: { y: 0.6 },
        });
      }
    } else {
      audioSynth.playTick();
    }
  };

  // Delete single todo
  const handleDeleteTodo = (id: string) => {
    const updated = todos.filter((t) => t.id !== id);
    onUpdateTodos(updated);
    audioSynth.playTick();
  };

  // Clear all completed todos
  const handleClearCompleted = () => {
    if (window.confirm('完了済みのTo-Doタスクをすべて削除しますか？')) {
      const updated = todos.filter((t) => !t.done);
      onUpdateTodos(updated);
      audioSynth.playTick();
    }
  };

  // Start edit
  const handleStartEdit = (todo: TodoItem) => {
    setEditingId(todo.id);
    setEditText(todo.text);
    setEditPriority(todo.priority);
    setEditSubject(todo.subject || 'math');
    setEditEstimatedMinutes(todo.estimatedMinutes || 45);
    setEditDueDate(todo.dueDate || '');
  };

  // Save edit
  const handleSaveEdit = () => {
    if (!editingId || !editText.trim()) return;
    const updated = todos.map((t) => {
      if (t.id === editingId) {
        return {
          ...t,
          text: editText.trim(),
          priority: editPriority,
          subject: editSubject,
          estimatedMinutes: editEstimatedMinutes,
          dueDate: editDueDate || undefined,
        };
      }
      return t;
    });
    onUpdateTodos(updated);
    setEditingId(null);
    audioSynth.playTick();
  };

  // Open Schedule Dialog
  const handleOpenSchedule = (todo: TodoItem) => {
    setSchedulingTodo(todo);
    // Find sensible default start time based on current time
    const now = new Date();
    const nextHour = (now.getHours() + 1) % 24;
    const formatted = `${nextHour.toString().padStart(2, '0')}:00`;
    setScheduleStartTime(formatted);
    setScheduleDuration(todo.estimatedMinutes || 45);
  };

  // Commit Schedule to Timeline
  const handleCommitSchedule = () => {
    if (!schedulingTodo || !onAddTodoToTimeline) return;
    onAddTodoToTimeline(schedulingTodo, scheduleStartTime, scheduleDuration);
    setSchedulingTodo(null);
    audioSynth.playChime();
  };

  // Filtered todos
  const filteredTodos = useMemo(() => {
    return todos.filter((t) => {
      // Tab filter
      if (filterTab === 'active' && t.done) return false;
      if (filterTab === 'completed' && !t.done) return false;

      // Priority filter
      if (filterPriority !== 'all' && t.priority !== filterPriority) return false;

      // Subject filter
      if (filterSubject !== 'all' && t.subject !== filterSubject) return false;

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchText = t.text.toLowerCase().includes(q);
        const matchTag = t.tag?.toLowerCase().includes(q);
        const matchSubject = t.subject && SUBJECT_METAS[t.subject]?.name.toLowerCase().includes(q);
        if (!matchText && !matchTag && !matchSubject) return false;
      }

      return true;
    });
  }, [todos, filterTab, filterPriority, filterSubject, searchQuery]);

  // Statistics
  const totalCount = todos.length;
  const completedCount = todos.filter((t) => t.done).length;
  const activeCount = totalCount - completedCount;
  const progressPercent = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  // Add quick sample study todos
  const handleAddSampleStudyTodos = () => {
    const samples: TodoItem[] = [
      {
        id: `todo_${Date.now()}_1`,
        text: '数学：微積分 例題演習 3問解く',
        done: false,
        priority: 'high',
        subject: 'math',
        estimatedMinutes: 60,
        dueDate: todayStr,
        createdAt: new Date().toISOString(),
      },
      {
        id: `todo_${Date.now()}_2`,
        text: '物理：電磁気 コンデンサー回路 復習',
        done: false,
        priority: 'high',
        subject: 'physics',
        estimatedMinutes: 45,
        dueDate: todayStr,
        createdAt: new Date().toISOString(),
      },
      {
        id: `todo_${Date.now()}_3`,
        text: '化学：有機化学 構造決定 1題',
        done: false,
        priority: 'medium',
        subject: 'chem',
        estimatedMinutes: 40,
        dueDate: todayStr,
        createdAt: new Date().toISOString(),
      },
      {
        id: `todo_${Date.now()}_4`,
        text: '英語：単語ターゲット100語 暗記チェック',
        done: false,
        priority: 'medium',
        subject: 'eng',
        estimatedMinutes: 25,
        dueDate: todayStr,
        createdAt: new Date().toISOString(),
      },
    ];
    onUpdateTodos([...samples, ...todos]);
    audioSynth.playChime();
  };

  return (
    <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4 sm:p-5 shadow-lg space-y-4 font-sans text-slate-200">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="p-1.5 rounded-lg bg-blue-500/10 border border-blue-500/20 text-blue-400">
            <ListTodo className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-sm sm:text-base text-slate-100 uppercase tracking-wider font-mono">
                TODO_ACTION_MATRIX
              </h3>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-blue-950/70 border border-blue-800 text-blue-300 font-bold">
                {completedCount}/{totalCount} DONE ({progressPercent}%)
              </span>
            </div>
            <p className="text-xs text-slate-400">やる事・本日の課題リスト (タイマー・24h時間割と即時連携)</p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2 flex-wrap self-end sm:self-center">
          {/* Cloud Sync Status & Auth Controls */}
          {currentUser ? (
            <div className="flex items-center gap-1.5 bg-emerald-950/40 border border-emerald-600/40 px-2.5 py-1 rounded text-xs font-mono text-emerald-300">
              <Cloud className={`w-3.5 h-3.5 text-emerald-400 ${isSyncing ? 'animate-spin' : ''}`} />
              <span className="max-w-[130px] truncate hidden md:inline" title={currentUser.email || currentUser.displayName || ''}>
                {currentUser.displayName || currentUser.email?.split('@')[0] || 'Cloud'}
              </span>
              <span className="text-[10px] text-emerald-400 font-bold">☁️ クラウド同期中</span>
              {onLogout && (
                <button
                  onClick={onLogout}
                  className="ml-1 text-slate-400 hover:text-rose-400 transition-colors p-0.5"
                  title="ログアウト"
                >
                  <LogOut className="w-3 h-3" />
                </button>
              )}
            </div>
          ) : (
            onLoginWithGoogle && (
              <button
                onClick={onLoginWithGoogle}
                disabled={isSyncing}
                className="text-xs px-2.5 py-1 rounded bg-blue-600/20 hover:bg-blue-600/30 text-blue-300 border border-blue-500/40 hover:border-blue-400 transition-all flex items-center gap-1.5 font-mono shadow-sm"
                title="GoogleアカウントでログインしてFirebaseクラウドと同期"
              >
                <Cloud className="w-3.5 h-3.5 text-blue-400" />
                <span>Googleログインでクラウド同期</span>
              </button>
            )
          )}

          {completedCount > 0 && (
            <button
              onClick={handleClearCompleted}
              className="text-xs px-2.5 py-1 rounded bg-slate-800/80 hover:bg-rose-950/40 text-slate-400 hover:text-rose-400 border border-slate-700/50 hover:border-rose-700/50 transition-colors flex items-center gap-1 font-mono"
              title="完了済みタスクを削除"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>完了分削除</span>
            </button>
          )}
          {totalCount === 0 && (
            <button
              onClick={handleAddSampleStudyTodos}
              className="text-xs px-3 py-1 rounded bg-blue-600/20 hover:bg-blue-600/30 text-blue-300 border border-blue-500/30 transition-colors flex items-center gap-1.5 font-mono"
            >
              <Sparkles className="w-3.5 h-3.5 text-blue-400" />
              <span>おすすめタスク追加</span>
            </button>
          )}
        </div>
      </div>

      {/* Progress Bar */}
      {totalCount > 0 && (
        <div className="space-y-1">
          <div className="w-full bg-slate-800/80 h-2 rounded-full overflow-hidden border border-slate-700/50">
            <div
              className={`h-full transition-all duration-500 ${
                progressPercent === 100
                  ? 'bg-gradient-to-r from-emerald-500 to-teal-400 shadow-[0_0_10px_rgba(16,185,129,0.7)]'
                  : 'bg-gradient-to-r from-blue-500 to-cyan-400'
              }`}
              style={{ width: `${progressPercent}%` }}
            />
          </div>
          <div className="flex justify-between text-[11px] font-mono text-slate-400">
            <span>未完了: <b className="text-amber-400">{activeCount}件</b></span>
            <span>達成率: <b className="text-blue-400">{progressPercent}%</b></span>
          </div>
        </div>
      )}

      {/* Quick Add Bar */}
      <form onSubmit={handleAddTodo} className="space-y-2 bg-slate-950/50 p-3 rounded-lg border border-slate-800">
        <div className="flex flex-col sm:flex-row gap-2">
          <div className="relative flex-1">
            <input
              type="text"
              value={newText}
              onChange={(e) => setNewText(e.target.value)}
              placeholder="やる事・課題を入力... (例: 数学 例題演習 3問)"
              className="w-full bg-slate-900 border border-slate-700 rounded px-3 py-2 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors font-mono"
            />
          </div>

          <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
            {/* Subject Selector */}
            <select
              value={newSubject}
              onChange={(e) => setNewSubject(e.target.value as SubjectKey)}
              className="bg-slate-900 border border-slate-700 rounded px-2.5 py-2 text-xs text-slate-200 focus:outline-none focus:border-blue-500 font-mono"
            >
              {STUDY_SUBJECT_KEYS.map((k) => (
                <option key={k} value={k}>
                  {SUBJECT_METAS[k]?.name || k}
                </option>
              ))}
              <option value="life">生活・ピット</option>
              <option value="school">学校・課題</option>
              <option value="info">その他・自由枠</option>
            </select>

            {/* Priority Selector */}
            <select
              value={newPriority}
              onChange={(e) => setNewPriority(e.target.value as TodoPriority)}
              className={`bg-slate-900 border rounded px-2.5 py-2 text-xs font-mono font-bold focus:outline-none ${
                newPriority === 'high'
                  ? 'border-rose-500/50 text-rose-400'
                  : newPriority === 'medium'
                  ? 'border-amber-500/50 text-amber-400'
                  : 'border-blue-500/50 text-blue-400'
              }`}
            >
              <option value="high">⚡ 優先: 高</option>
              <option value="medium">🔶 優先: 中</option>
              <option value="low">🔹 優先: 低</option>
            </select>

            {/* Add Button */}
            <button
              type="submit"
              disabled={!newText.trim()}
              className="px-4 py-2 rounded bg-blue-600 hover:bg-blue-500 disabled:opacity-40 disabled:hover:bg-blue-600 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-md shadow-blue-900/30 transition-all font-mono whitespace-nowrap"
            >
              <Plus className="w-4 h-4" />
              <span>追加</span>
            </button>
          </div>
        </div>

        {/* Optional Extra Settings Toggle */}
        <div className="flex items-center justify-between text-xs pt-1">
          <button
            type="button"
            onClick={() => setShowAdvancedInput(!showAdvancedInput)}
            className="text-slate-400 hover:text-slate-300 flex items-center gap-1 text-[11px] font-mono"
          >
            <span>{showAdvancedInput ? '▲ 詳細設定を閉じる' : '▼ 目安時間・期日を設定'}</span>
          </button>
          {showAdvancedInput && (
            <div className="flex items-center gap-3 animate-fade-in">
              <div className="flex items-center gap-1.5 text-[11px] font-mono text-slate-300">
                <Clock className="w-3.5 h-3.5 text-blue-400" />
                <span>目安時間:</span>
                <select
                  value={newEstimatedMinutes}
                  onChange={(e) => setNewEstimatedMinutes(Number(e.target.value))}
                  className="bg-slate-900 border border-slate-700 rounded px-1.5 py-0.5 text-[11px] text-slate-200"
                >
                  <option value={15}>15分</option>
                  <option value={25}>25分 (ポモドーロ)</option>
                  <option value={30}>30分</option>
                  <option value={45}>45分</option>
                  <option value={60}>60分</option>
                  <option value={90}>90分</option>
                  <option value={120}>120分</option>
                </select>
              </div>

              <div className="flex items-center gap-1.5 text-[11px] font-mono text-slate-300">
                <span>期限:</span>
                <input
                  type="date"
                  value={newDueDate}
                  onChange={(e) => setNewDueDate(e.target.value)}
                  className="bg-slate-900 border border-slate-700 rounded px-1.5 py-0.5 text-[11px] text-slate-200"
                />
              </div>
            </div>
          )}
        </div>
      </form>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 text-xs font-mono pt-1">
        {/* Status Tabs */}
        <div className="flex items-center bg-slate-950/70 p-1 rounded-lg border border-slate-800">
          <button
            onClick={() => setFilterTab('all')}
            className={`px-3 py-1 rounded text-xs transition-all ${
              filterTab === 'all'
                ? 'bg-blue-600 text-white font-bold shadow'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            すべて ({totalCount})
          </button>
          <button
            onClick={() => setFilterTab('active')}
            className={`px-3 py-1 rounded text-xs transition-all ${
              filterTab === 'active'
                ? 'bg-amber-600 text-white font-bold shadow'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            未完了 ({activeCount})
          </button>
          <button
            onClick={() => setFilterTab('completed')}
            className={`px-3 py-1 rounded text-xs transition-all ${
              filterTab === 'completed'
                ? 'bg-emerald-600 text-white font-bold shadow'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            完了 ({completedCount})
          </button>
        </div>

        {/* Filters and Search */}
        <div className="flex items-center gap-2">
          {/* Priority filter */}
          <select
            value={filterPriority}
            onChange={(e) => setFilterPriority(e.target.value as TodoPriority | 'all')}
            className="bg-slate-950 border border-slate-800 rounded px-2 py-1 text-xs text-slate-300 focus:outline-none"
          >
            <option value="all">全優先度</option>
            <option value="high">⚡ 高優先</option>
            <option value="medium">🔶 中優先</option>
            <option value="low">🔹 低優先</option>
          </select>

          {/* Subject filter */}
          <select
            value={filterSubject}
            onChange={(e) => setFilterSubject(e.target.value as SubjectKey | 'all')}
            className="bg-slate-950 border border-slate-800 rounded px-2 py-1 text-xs text-slate-300 focus:outline-none"
          >
            <option value="all">全科目</option>
            {STUDY_SUBJECT_KEYS.map((k) => (
              <option key={k} value={k}>
                {SUBJECT_METAS[k]?.name || k}
              </option>
            ))}
          </select>

          {/* Search box */}
          <div className="relative flex-1 sm:w-40">
            <Search className="w-3.5 h-3.5 absolute left-2 top-2 text-slate-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="検索..."
              className="w-full bg-slate-950 border border-slate-800 rounded pl-7 pr-2 py-1 text-xs text-slate-200 placeholder-slate-600 focus:outline-none focus:border-blue-500"
            />
          </div>
        </div>
      </div>

      {/* Todo List Items */}
      <div className="space-y-2 max-h-[420px] overflow-y-auto pr-1">
        {filteredTodos.length === 0 ? (
          <div className="py-10 text-center border border-dashed border-slate-800 rounded-lg bg-slate-950/30">
            <ListTodo className="w-8 h-8 mx-auto text-slate-600 mb-2" />
            <p className="text-sm font-mono text-slate-400 font-bold">表示するTo-Doがありません</p>
            <p className="text-xs text-slate-600 mt-1">
              {totalCount === 0
                ? '上の入力フォームからやる事を追加してください'
                : 'フィルター条件に一致するタスクはありません'}
            </p>
            {totalCount === 0 && (
              <button
                onClick={handleAddSampleStudyTodos}
                className="mt-3 px-3 py-1.5 text-xs rounded bg-blue-600/20 hover:bg-blue-600/30 text-blue-300 border border-blue-500/30 transition-colors inline-flex items-center gap-1.5 font-mono"
              >
                <Sparkles className="w-3.5 h-3.5 text-blue-400" />
                <span>おすすめ学習タスクをワンクリック追加</span>
              </button>
            )}
          </div>
        ) : (
          filteredTodos.map((todo) => {
            const isEditing = editingId === todo.id;
            const subjectMeta = todo.subject ? SUBJECT_METAS[todo.subject] : null;
            const isDueToday = todo.dueDate === todayStr;
            const isOverdue = todo.dueDate && todo.dueDate < todayStr && !todo.done;

            if (isEditing) {
              return (
                <div
                  key={todo.id}
                  className="bg-slate-800/80 border border-blue-500/50 rounded-lg p-3 space-y-2.5 animate-fade-in"
                >
                  <input
                    type="text"
                    value={editText}
                    onChange={(e) => setEditText(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-600 rounded px-2.5 py-1.5 text-sm text-slate-100 font-mono"
                  />
                  <div className="flex flex-wrap items-center gap-2 text-xs">
                    <select
                      value={editSubject}
                      onChange={(e) => setEditSubject(e.target.value as SubjectKey)}
                      className="bg-slate-900 border border-slate-700 rounded px-2 py-1 text-slate-200"
                    >
                      {STUDY_SUBJECT_KEYS.map((k) => (
                        <option key={k} value={k}>
                          {SUBJECT_METAS[k]?.name || k}
                        </option>
                      ))}
                      <option value="life">生活・ピット</option>
                      <option value="school">学校・課題</option>
                      <option value="info">その他・自由枠</option>
                    </select>

                    <select
                      value={editPriority}
                      onChange={(e) => setEditPriority(e.target.value as TodoPriority)}
                      className="bg-slate-900 border border-slate-700 rounded px-2 py-1 text-slate-200"
                    >
                      <option value="high">⚡ 優先: 高</option>
                      <option value="medium">🔶 優先: 中</option>
                      <option value="low">🔹 優先: 低</option>
                    </select>

                    <select
                      value={editEstimatedMinutes}
                      onChange={(e) => setEditEstimatedMinutes(Number(e.target.value))}
                      className="bg-slate-900 border border-slate-700 rounded px-2 py-1 text-slate-200"
                    >
                      <option value={15}>15分</option>
                      <option value={25}>25分</option>
                      <option value={30}>30分</option>
                      <option value={45}>45分</option>
                      <option value={60}>60分</option>
                      <option value={90}>90分</option>
                    </select>

                    <input
                      type="date"
                      value={editDueDate}
                      onChange={(e) => setEditDueDate(e.target.value)}
                      className="bg-slate-900 border border-slate-700 rounded px-2 py-1 text-slate-200"
                    />

                    <div className="ml-auto flex items-center gap-1.5">
                      <button
                        onClick={handleSaveEdit}
                        className="px-3 py-1 bg-blue-600 hover:bg-blue-500 text-white rounded font-mono flex items-center gap-1 font-bold"
                      >
                        <Save className="w-3.5 h-3.5" />
                        <span>保存</span>
                      </button>
                      <button
                        onClick={() => setEditingId(null)}
                        className="px-2.5 py-1 bg-slate-700 hover:bg-slate-600 text-slate-300 rounded font-mono"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            }

            return (
              <div
                key={todo.id}
                className={`group flex items-center justify-between gap-3 p-3 rounded-lg border transition-all ${
                  todo.done
                    ? 'bg-slate-950/40 border-slate-800/60 opacity-60'
                    : 'bg-slate-950/70 border-slate-800 hover:border-slate-700 hover:bg-slate-900/60 shadow-sm'
                }`}
              >
                {/* Left: Checkbox & Content */}
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  {/* Glowing Toggle Button */}
                  <button
                    onClick={() => handleToggleDone(todo.id)}
                    className="flex-shrink-0 text-slate-500 hover:text-emerald-400 transition-colors focus:outline-none"
                    title={todo.done ? '未完了に戻す' : '完了にする'}
                  >
                    {todo.done ? (
                      <CheckCircle2 className="w-5 h-5 text-emerald-400 fill-emerald-500/20" />
                    ) : (
                      <Circle className="w-5 h-5 hover:stroke-emerald-400" />
                    )}
                  </button>

                  <div className="min-w-0 flex-1 space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      {/* Priority Tag */}
                      <span
                        className={`text-[10px] font-mono px-1.5 py-0.5 rounded font-bold uppercase tracking-wider ${
                          todo.priority === 'high'
                            ? 'bg-rose-500/10 text-rose-400 border border-rose-500/30'
                            : todo.priority === 'medium'
                            ? 'bg-amber-500/10 text-amber-400 border border-amber-500/30'
                            : 'bg-slate-500/10 text-slate-400 border border-slate-600/30'
                        }`}
                      >
                        {todo.priority === 'high' ? '⚡ HIGH' : todo.priority === 'medium' ? '🔶 MED' : '🔹 LOW'}
                      </span>

                      {/* Subject Tag */}
                      {subjectMeta && (
                        <span
                          className="text-[10px] font-mono px-1.5 py-0.5 rounded font-bold border"
                          style={{
                            borderColor: `${subjectMeta.color}40`,
                            color: subjectMeta.color,
                            backgroundColor: `${subjectMeta.color}15`,
                          }}
                        >
                          {subjectMeta.name}
                        </span>
                      )}

                      {/* Estimated time */}
                      {todo.estimatedMinutes && (
                        <span className="text-[10px] font-mono text-slate-400 flex items-center gap-0.5">
                          <Clock className="w-2.5 h-2.5" />
                          {todo.estimatedMinutes}分
                        </span>
                      )}

                      {/* Due Date Indicator */}
                      {todo.dueDate && (
                        <span
                          className={`text-[10px] font-mono px-1.5 py-0.2 rounded ${
                            isOverdue
                              ? 'bg-rose-950/80 text-rose-300 border border-rose-800 font-bold animate-pulse'
                              : isDueToday
                              ? 'bg-blue-950/60 text-blue-300 border border-blue-800'
                              : 'text-slate-500'
                          }`}
                        >
                          {isOverdue ? '⚠️ 期限超過: ' : isDueToday ? '本日締切: ' : '期日: '}
                          {todo.dueDate}
                        </span>
                      )}
                    </div>

                    {/* Todo Text */}
                    <div
                      onClick={() => handleToggleDone(todo.id)}
                      className={`text-sm font-medium cursor-pointer transition-colors ${
                        todo.done
                          ? 'line-through text-slate-500'
                          : 'text-slate-100 hover:text-blue-300'
                      }`}
                    >
                      {todo.text}
                    </div>
                  </div>
                </div>

                {/* Right: Quick Action Controls */}
                <div className="flex items-center gap-1 opacity-80 group-hover:opacity-100 transition-opacity">
                  {/* Timer Start Button */}
                  {!todo.done && onSelectTodoForTimer && (
                    <button
                      onClick={() => onSelectTodoForTimer(todo)}
                      className="p-1.5 rounded bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 border border-blue-500/30 hover:border-blue-500/60 transition-all font-mono text-xs flex items-center gap-1"
                      title="このタスクでタイマーを起動"
                    >
                      <Timer className="w-3.5 h-3.5" />
                      <span className="hidden md:inline text-[10px] font-bold">タイマー</span>
                    </button>
                  )}

                  {/* Add to Timeline Button */}
                  {!todo.done && onAddTodoToTimeline && (
                    <button
                      onClick={() => handleOpenSchedule(todo)}
                      className="p-1.5 rounded bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 hover:border-emerald-500/60 transition-all font-mono text-xs flex items-center gap-1"
                      title="今日の24h時間割・スケジュールに追加"
                    >
                      <CalendarPlus className="w-3.5 h-3.5" />
                      <span className="hidden md:inline text-[10px] font-bold">24h追加</span>
                    </button>
                  )}

                  {/* Edit */}
                  <button
                    onClick={() => handleStartEdit(todo)}
                    className="p-1.5 rounded text-slate-500 hover:text-slate-200 hover:bg-slate-800 transition-colors"
                    title="編集"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>

                  {/* Delete */}
                  <button
                    onClick={() => handleDeleteTodo(todo.id)}
                    className="p-1.5 rounded text-slate-500 hover:text-rose-400 hover:bg-slate-800 transition-colors"
                    title="削除"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Schedule To Timeline Dialog Modal */}
      {schedulingTodo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 max-w-md w-full space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <CalendarPlus className="w-5 h-5 text-emerald-400" />
                <h4 className="font-bold text-slate-100 font-mono text-sm">
                  24Hスケジュール・時間割に追加
                </h4>
              </div>
              <button
                onClick={() => setSchedulingTodo(null)}
                className="text-slate-400 hover:text-slate-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 space-y-1">
              <span className="text-[11px] font-mono text-slate-400">対象To-Doタスク:</span>
              <p className="text-sm font-bold text-slate-100">{schedulingTodo.text}</p>
              {schedulingTodo.subject && (
                <span
                  className="inline-block text-[10px] font-mono px-1.5 py-0.5 rounded font-bold border mt-1"
                  style={{
                    borderColor: `${SUBJECT_METAS[schedulingTodo.subject]?.color}40`,
                    color: SUBJECT_METAS[schedulingTodo.subject]?.color,
                    backgroundColor: `${SUBJECT_METAS[schedulingTodo.subject]?.color}15`,
                  }}
                >
                  {SUBJECT_METAS[schedulingTodo.subject]?.name}
                </span>
              )}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-xs font-mono text-slate-400">開始時刻 (HH:MM)</label>
                <input
                  type="time"
                  value={scheduleStartTime}
                  onChange={(e) => setScheduleStartTime(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded px-3 py-2 text-sm text-slate-100 font-mono focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-mono text-slate-400">予定時間 (分)</label>
                <input
                  type="number"
                  min={5}
                  max={480}
                  step={5}
                  value={scheduleDuration}
                  onChange={(e) => setScheduleDuration(Number(e.target.value))}
                  className="w-full bg-slate-950 border border-slate-700 rounded px-3 py-2 text-sm text-slate-100 font-mono focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setSchedulingTodo(null)}
                className="px-3 py-1.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-mono"
              >
                キャンセル
              </button>
              <button
                type="button"
                onClick={handleCommitSchedule}
                className="px-4 py-1.5 rounded bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs font-mono flex items-center gap-1.5 shadow-lg shadow-emerald-900/30"
              >
                <CalendarPlus className="w-4 h-4" />
                <span>時間割に配置</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
