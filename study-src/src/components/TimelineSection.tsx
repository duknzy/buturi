import React, { useState } from 'react';
import { TaskItem, SubjectKey, DailyScheduleTemplate } from '../types';
import { SUBJECT_METAS } from '../constants/subjects';
import { audioSynth } from '../services/audio';
import {
  Plus,
  Trash2,
  Edit2,
  CheckCircle2,
  Circle,
  MoveUp,
  MoveDown,
  Layers,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  Calendar,
  Save,
  X,
} from 'lucide-react';

interface TimelineSectionProps {
  tasks: TaskItem[];
  onUpdateTasks: (tasks: TaskItem[]) => void;
  currentDateStr: string;
  onDateChange: (dateStr: string) => void;
  onDeployTemplate: (type: DailyScheduleTemplate) => void;
}

export const TimelineSection: React.FC<TimelineSectionProps> = ({
  tasks,
  onUpdateTasks,
  currentDateStr,
  onDateChange,
  onDeployTemplate,
}) => {
  const [showAddForm, setShowAddForm] = useState<boolean>(false);
  const [newTaskName, setNewTaskName] = useState<string>('');
  const [newStartTime, setNewStartTime] = useState<string>('09:00');
  const [newDuration, setNewDuration] = useState<number>(60);
  const [newSubject, setNewSubject] = useState<SubjectKey>('math');

  // Edit State
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  const [editTaskTitle, setEditTaskTitle] = useState<string>('');
  const [editTaskTime, setEditTaskTime] = useState<string>('');
  const [editTaskDuration, setEditTaskDuration] = useState<number>(60);
  const [editTaskSubject, setEditTaskSubject] = useState<SubjectKey>('math');

  // Date Navigation Handlers
  const handlePrevDay = () => {
    const d = new Date(currentDateStr);
    d.setDate(d.getDate() - 1);
    const y = d.getFullYear();
    const m = (d.getMonth() + 1).toString().padStart(2, '0');
    const day = d.getDate().toString().padStart(2, '0');
    onDateChange(`${y}-${m}-${day}`);
  };

  const handleNextDay = () => {
    const d = new Date(currentDateStr);
    d.setDate(d.getDate() + 1);
    const y = d.getFullYear();
    const m = (d.getMonth() + 1).toString().padStart(2, '0');
    const day = d.getDate().toString().padStart(2, '0');
    onDateChange(`${y}-${m}-${day}`);
  };

  const handleToday = () => {
    const d = new Date();
    const y = d.getFullYear();
    const m = (d.getMonth() + 1).toString().padStart(2, '0');
    const day = d.getDate().toString().padStart(2, '0');
    onDateChange(`${y}-${m}-${day}`);
  };

  // Toggle Done
  const toggleTaskDone = (taskId: string) => {
    const updated = tasks.map((t) => {
      if (t.id === taskId) {
        const nextDone = !t.done;
        if (nextDone) {
          audioSynth.playChime();
        } else {
          audioSynth.playTick();
        }
        return { ...t, done: nextDone };
      }
      return t;
    });
    onUpdateTasks(updated);
  };

  // Delete Task
  const deleteTask = (taskId: string) => {
    onUpdateTasks(tasks.filter((t) => t.id !== taskId));
    audioSynth.playTick();
  };

  // Move Task Up / Down
  const moveTask = (index: number, direction: 'up' | 'down') => {
    if (
      (direction === 'up' && index === 0) ||
      (direction === 'down' && index === tasks.length - 1)
    )
      return;

    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    const updated = [...tasks];
    const temp = updated[index];
    updated[index] = updated[targetIndex];
    updated[targetIndex] = temp;

    onUpdateTasks(updated);
    audioSynth.playTick();
  };

  // Start Edit
  const startEdit = (task: TaskItem) => {
    setEditingTaskId(task.id);
    setEditTaskTitle(task.task);
    setEditTaskTime(task.time);
    setEditTaskDuration(task.duration);
    setEditTaskSubject(task.subject);
  };

  // Save Edit
  const saveEdit = () => {
    if (!editingTaskId) return;
    const updated = tasks.map((t) => {
      if (t.id === editingTaskId) {
        return {
          ...t,
          task: editTaskTitle,
          duration: editTaskDuration,
          time: editTaskTime,
          subject: editTaskSubject,
        };
      }
      return t;
    });
    onUpdateTasks(updated);
    setEditingTaskId(null);
  };

  // Add Task submit
  const handleAddTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskName.trim()) return;

    const newTask: TaskItem = {
      id: `task_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
      time: newStartTime,
      duration: newDuration,
      subject: newSubject,
      task: newTaskName.trim(),
      done: false,
      order: tasks.length,
    };

    const updated = [...tasks, newTask].sort((a, b) => {
      const [h1, m1] = a.time.split(':').map(Number);
      const [h2, m2] = b.time.split(':').map(Number);
      return (h1 * 60 + m1) - (h2 * 60 + m2);
    });

    onUpdateTasks(updated);
    setNewTaskName('');
    setShowAddForm(false);
    audioSynth.playTick();
  };

  // Auto-calculate start time for new task based on last task
  const openAddFormWithSmartTime = () => {
    if (tasks.length > 0) {
      const sorted = [...tasks].sort((a, b) => {
        const [h1, m1] = a.time.split(':').map(Number);
        const [h2, m2] = b.time.split(':').map(Number);
        return (h1 * 60 + m1) - (h2 * 60 + m2);
      });
      const last = sorted[sorted.length - 1];
      const [lh, lm] = last.time.split(':').map(Number);
      const endTotalMin = (lh * 60 + lm + last.duration) % 1440;
      const eh = Math.floor(endTotalMin / 60);
      const em = endTotalMin % 60;
      setNewStartTime(`${eh.toString().padStart(2, '0')}:${em.toString().padStart(2, '0')}`);
    }
    setShowAddForm(true);
  };

  // Daily statistics
  const totalStudyMinutes = tasks
    .filter((t) => SUBJECT_METAS[t.subject]?.isStudy)
    .reduce((acc, t) => acc + t.duration, 0);

  const completedStudyMinutes = tasks
    .filter((t) => SUBJECT_METAS[t.subject]?.isStudy && t.done)
    .reduce((acc, t) => acc + t.duration, 0);

  const remainingStudyMinutes = Math.max(0, totalStudyMinutes - completedStudyMinutes);
  const completionRate = totalStudyMinutes > 0 ? Math.round((completedStudyMinutes / totalStudyMinutes) * 100) : 0;

  return (
    <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4 shadow-lg text-slate-200 space-y-3.5">
      {/* Top Controls: Date Navigator & Mode Switch */}
      <div className="flex flex-wrap items-center justify-between gap-2.5 border-b border-slate-800 pb-3">
        {/* Date Stepper */}
        <div className="flex items-center gap-1.5 font-mono">
          <button
            onClick={handlePrevDay}
            className="p-1.5 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-all flex-shrink-0"
            title="PREV_DAY"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          <div className="flex items-center gap-1.5 bg-slate-950 px-2.5 py-1.5 rounded-md border border-slate-700 text-xs font-bold whitespace-nowrap flex-shrink-0">
            <Calendar className="w-3.5 h-3.5 text-blue-400" />
            <input
              type="date"
              value={currentDateStr}
              onChange={(e) => e.target.value && onDateChange(e.target.value)}
              className="bg-transparent text-slate-200 border-none outline-none text-xs font-mono cursor-pointer"
            />
          </div>

          <button
            onClick={handleNextDay}
            className="p-1.5 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-all flex-shrink-0"
            title="NEXT_DAY"
          >
            <ChevronRight className="w-4 h-4" />
          </button>

          <button
            onClick={handleToday}
            className="px-2.5 py-1.5 rounded-md bg-slate-800 hover:bg-slate-700 text-xs font-bold text-blue-400 border border-slate-700 uppercase whitespace-nowrap flex-shrink-0"
          >
            TODAY
          </button>
        </div>

        {/* Template Deploy Hub */}
        <div className="flex items-center gap-2 font-mono flex-shrink-0">
          <span className="text-xs text-slate-500 uppercase font-bold hidden sm:inline whitespace-nowrap">TEMPLATE:</span>
          <button
            onClick={() => onDeployTemplate('phase1')}
            className="px-2.5 py-1.5 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 text-xs font-bold uppercase flex items-center gap-1.5 transition-all whitespace-nowrap"
            title="WEEKDAY_SCHEDULE"
          >
            <Layers className="w-3.5 h-3.5 text-blue-400" />
            <span>WEEKDAY</span>
          </button>

          <button
            onClick={() => onDeployTemplate('phase2')}
            className="px-2.5 py-1.5 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 text-xs font-bold uppercase flex items-center gap-1.5 transition-all whitespace-nowrap"
            title="HOLIDAY_SCHEDULE"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>HOLIDAY</span>
          </button>

          <button
            onClick={openAddFormWithSmartTime}
            className="px-3 py-1.5 rounded-md bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold uppercase flex items-center gap-1.5 shadow-sm transition-all ml-auto whitespace-nowrap"
          >
            <Plus className="w-4 h-4" />
            <span>ADD_EVENT</span>
          </button>
        </div>
      </div>

      {/* Daily Telemetry Mini Dashboard */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 font-mono">
        <div className="bg-slate-950/80 border border-slate-800 rounded-lg p-2.5 text-center">
          <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">TARGET_LOAD</span>
          <span className="text-base font-bold text-slate-200">
            {(totalStudyMinutes / 60).toFixed(1)} <span className="text-xs text-slate-500">HRS</span>
          </span>
        </div>

        <div className="bg-slate-950/80 border border-slate-800 rounded-lg p-2.5 text-center">
          <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">COMPLETED</span>
          <span className="text-base font-bold text-emerald-400">
            {(completedStudyMinutes / 60).toFixed(1)} <span className="text-xs text-slate-500">HRS</span>
          </span>
        </div>

        <div className="bg-slate-950/80 border border-slate-800 rounded-lg p-2.5 text-center">
          <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">REMAINING</span>
          <span className="text-base font-bold text-amber-400">
            {(remainingStudyMinutes / 60).toFixed(1)} <span className="text-xs text-slate-500">HRS</span>
          </span>
        </div>

        <div className="bg-slate-950/80 border border-slate-800 rounded-lg p-2.5 text-center">
          <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">COMPLETION_RATE</span>
          <div className="flex items-center justify-center gap-1">
            <span className="text-base font-bold text-blue-400">{completionRate}%</span>
          </div>
        </div>
      </div>

      {/* Add Task Pop-down Form */}
      {showAddForm && (
        <form
          onSubmit={handleAddTask}
          className="bg-slate-950 border border-blue-500/40 rounded-lg p-3 space-y-2.5 animate-fade-in font-mono"
        >
          <div className="flex items-center justify-between border-b border-slate-800 pb-1.5">
            <span className="text-xs font-bold text-blue-400 uppercase tracking-wider flex items-center gap-1.5">
              <Plus className="w-3.5 h-3.5" /> ADD_SCHEDULE_EVENT
            </span>
            <button
              type="button"
              onClick={() => setShowAddForm(false)}
              className="text-slate-400 hover:text-slate-200"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-4 gap-2">
            <div>
              <label className="text-[9px] text-slate-500 font-bold uppercase block mb-1">START_TIME</label>
              <input
                type="time"
                value={newStartTime}
                onChange={(e) => setNewStartTime(e.target.value)}
                required
                className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-xs text-slate-200 focus:outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label className="text-[9px] text-slate-500 font-bold uppercase block mb-1">DURATION (MIN)</label>
              <input
                type="number"
                min="5"
                max="720"
                step="5"
                value={newDuration}
                onChange={(e) => setNewDuration(Number(e.target.value))}
                required
                className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-xs text-slate-200 focus:outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label className="text-[9px] text-slate-500 font-bold uppercase block mb-1">SUBJECT_CATEGORY</label>
              <select
                value={newSubject}
                onChange={(e) => setNewSubject(e.target.value as SubjectKey)}
                className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-xs text-slate-200 focus:outline-none focus:border-blue-500"
              >
                {Object.keys(SUBJECT_METAS).map((k) => (
                  <option key={k} value={k}>
                    {SUBJECT_METAS[k as SubjectKey].name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-[9px] text-slate-500 font-bold uppercase block mb-1">EVENT_TITLE</label>
              <input
                type="text"
                value={newTaskName}
                onChange={(e) => setNewTaskName(e.target.value)}
                placeholder="例: 青チャート数B 10問"
                required
                className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-xs text-slate-200 font-sans focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>

          <div className="flex justify-end gap-1.5 pt-1">
            <button
              type="button"
              onClick={() => setShowAddForm(false)}
              className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-[10px] text-slate-300 uppercase font-bold"
            >
              CANCEL
            </button>
            <button
              type="submit"
              className="px-3 py-1 rounded bg-blue-600 hover:bg-blue-500 text-[10px] font-bold text-white uppercase shadow-sm"
            >
              SUBMIT_EVENT
            </button>
          </div>
        </form>
      )}

      {/* Task List */}
      <div className="space-y-1.5 max-h-[460px] overflow-y-auto pr-1">
        {tasks.length === 0 ? (
          <div className="text-center py-8 text-slate-500 text-xs border border-dashed border-slate-800 rounded font-mono">
            NO_EVENTS_REGISTERED // Click "WEEKDAY" or "ADD_EVENT" to populate timeline.
          </div>
        ) : (
          tasks.map((task, index) => {
            const meta = SUBJECT_METAS[task.subject] || SUBJECT_METAS.life;
            const isEditing = editingTaskId === task.id;

            if (isEditing) {
              return (
                <div
                  key={task.id}
                  className="p-2.5 rounded bg-slate-950 border border-blue-500/50 space-y-2 text-xs font-mono"
                >
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    <input
                      type="time"
                      value={editTaskTime}
                      onChange={(e) => setEditTaskTime(e.target.value)}
                      className="bg-slate-900 border border-slate-700 rounded px-2 py-1 text-slate-200"
                    />
                    <input
                      type="number"
                      value={editTaskDuration}
                      onChange={(e) => setEditTaskDuration(Number(e.target.value))}
                      className="bg-slate-900 border border-slate-700 rounded px-2 py-1 text-slate-200"
                    />
                    <select
                      value={editTaskSubject}
                      onChange={(e) => setEditTaskSubject(e.target.value as SubjectKey)}
                      className="bg-slate-900 border border-slate-700 rounded px-2 py-1 text-slate-200"
                    >
                      {Object.keys(SUBJECT_METAS).map((k) => (
                        <option key={k} value={k}>
                          {SUBJECT_METAS[k as SubjectKey].name}
                        </option>
                      ))}
                    </select>
                    <input
                      type="text"
                      value={editTaskTitle}
                      onChange={(e) => setEditTaskTitle(e.target.value)}
                      className="bg-slate-900 border border-slate-700 rounded px-2 py-1 text-slate-200 sm:col-span-1 font-sans"
                    />
                  </div>
                  <div className="flex justify-end gap-1.5">
                    <button
                      onClick={() => setEditingTaskId(null)}
                      className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 text-[10px] font-bold uppercase"
                    >
                      <X className="w-3 h-3 inline mr-1" /> CANCEL
                    </button>
                    <button
                      onClick={saveEdit}
                      className="px-2.5 py-0.5 rounded bg-blue-600 text-white font-bold text-[10px] uppercase"
                    >
                      <Save className="w-3 h-3 inline mr-1" /> SAVE
                    </button>
                  </div>
                </div>
              );
            }

            return (
              <div
                key={task.id}
                className={`group flex items-center justify-between p-2.5 rounded-lg border transition-all ${
                  task.done
                    ? 'bg-slate-950/40 border-slate-800/40 opacity-70'
                    : 'bg-slate-950/70 border-slate-800/70 hover:border-slate-700'
                }`}
              >
                {/* Left: Checkbox + Time Badge + Subject Badge + Title */}
                <div className="flex items-center gap-2.5 min-w-0 flex-1">
                  <button
                    onClick={() => toggleTaskDone(task.id)}
                    className="text-slate-400 hover:text-blue-400 transition-colors flex-shrink-0"
                    title={task.done ? '未完了に戻す' : '完了にする'}
                  >
                    {task.done ? (
                      <CheckCircle2 className="w-4.5 h-4.5 text-emerald-400" />
                    ) : (
                      <Circle className="w-4.5 h-4.5 text-slate-600 hover:text-blue-400" />
                    )}
                  </button>

                  <div className="flex items-center gap-1.5 font-mono flex-shrink-0 whitespace-nowrap">
                    <span className="font-bold text-xs text-slate-300 bg-slate-900 px-2 py-0.5 rounded border border-slate-800">
                      {task.time}
                    </span>
                    <span className="text-[11px] text-slate-500">
                      {task.duration}m
                    </span>
                  </div>

                  <span
                    className="px-2 py-0.5 rounded text-xs font-mono font-bold uppercase flex-shrink-0 whitespace-nowrap"
                    style={{
                      backgroundColor: `${meta.color}20`,
                      color: meta.color,
                      border: `1px solid ${meta.color}40`,
                    }}
                  >
                    {meta.name}
                  </span>

                  <span
                    className={`text-sm font-semibold truncate flex-1 font-sans ${
                      task.done ? 'line-through text-slate-500' : 'text-slate-200'
                    }`}
                  >
                    {task.task}
                  </span>
                </div>

                {/* Right: Order controls, Edit, Delete */}
                <div className="flex items-center gap-1 opacity-40 group-hover:opacity-100 transition-opacity ml-2 flex-shrink-0">
                  <button
                    onClick={() => moveTask(index, 'up')}
                    disabled={index === 0}
                    className="p-1 rounded hover:bg-slate-800 text-slate-400 hover:text-slate-200 disabled:opacity-20"
                    title="上へ移動"
                  >
                    <MoveUp className="w-3.5 h-3.5" />
                  </button>

                  <button
                    onClick={() => moveTask(index, 'down')}
                    disabled={index === tasks.length - 1}
                    className="p-1 rounded hover:bg-slate-800 text-slate-400 hover:text-slate-200 disabled:opacity-20"
                    title="下へ移動"
                  >
                    <MoveDown className="w-3.5 h-3.5" />
                  </button>

                  <button
                    onClick={() => startEdit(task)}
                    className="p-1 rounded hover:bg-slate-800 text-slate-400 hover:text-blue-400"
                    title="編集"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>

                  <button
                    onClick={() => deleteTask(task.id)}
                    className="p-1 rounded hover:bg-slate-800 text-slate-400 hover:text-red-400"
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
    </div>
  );
};
