import React, { useState, useEffect } from 'react';
import { TaskItem, AmbientSoundType, TodoItem } from '../types';
import { SUBJECT_METAS } from '../constants/subjects';
import { audioSynth } from '../services/audio';
import {
  Minimize2,
  CloudRain,
  Flame,
  Radio,
  Play,
  Pause,
  RotateCcw,
  Sparkles,
  CheckCircle2,
  Circle,
  ListTodo,
} from 'lucide-react';

interface FocusDeskOverlayProps {
  currentTime?: Date;
  tasks: TaskItem[];
  todos?: TodoItem[];
  onToggleTodo?: (id: string) => void;
  onClose: () => void;
}

export const FocusDeskOverlay: React.FC<FocusDeskOverlayProps> = ({
  currentTime = new Date(),
  tasks,
  todos = [],
  onToggleTodo,
  onClose,
}) => {
  const [ambientSound, setAmbientSound] = useState<AmbientSoundType>(audioSynth.getCurrentType());
  const [showDeskTodos, setShowDeskTodos] = useState<boolean>(true);
  
  // Embedded quick stopwatch on desk
  const [deskSwSeconds, setDeskSwSeconds] = useState<number>(0);
  const [deskSwRunning, setDeskSwRunning] = useState<boolean>(false);

  useEffect(() => {
    let interval: number | null = null;
    if (deskSwRunning) {
      interval = window.setInterval(() => {
        setDeskSwSeconds((prev) => prev + 1);
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [deskSwRunning]);

  // Keydown listener to close on ESC or F
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' || (e.key === 'f' && !e.target && !['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement)?.tagName))) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  const handleSoundChange = (type: AmbientSoundType) => {
    if (ambientSound === type) {
      audioSynth.stopAmbient();
      setAmbientSound('none');
    } else {
      audioSynth.playAmbient(type);
      setAmbientSound(type);
    }
  };

  // Find active task under current time
  const currentTotalMinutes = currentTime.getHours() * 60 + currentTime.getMinutes() + currentTime.getSeconds() / 60;
  const activeTask = tasks.find((t) => {
    const [h, m] = t.time.split(':').map(Number);
    const startMin = h * 60 + (m || 0);
    const endMin = startMin + t.duration;
    if (endMin <= 1440) {
      return currentTotalMinutes >= startMin && currentTotalMinutes < endMin;
    } else {
      return currentTotalMinutes >= startMin || currentTotalMinutes < (endMin - 1440);
    }
  });

  const pad = (n: number) => n.toString().padStart(2, '0');
  const timeStr = `${pad(currentTime.getHours())}:${pad(currentTime.getMinutes())}:${pad(currentTime.getSeconds())}`;
  
  const weekdays = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
  const dateStr = `${currentTime.getFullYear()}.${pad(currentTime.getMonth() + 1)}.${pad(currentTime.getDate())} [${weekdays[currentTime.getDay()]}]`;

  const swHour = pad(Math.floor(deskSwSeconds / 3600));
  const swMin = pad(Math.floor((deskSwSeconds % 3600) / 60));
  const swSec = pad(deskSwSeconds % 60);

  return (
    <div className="fixed inset-0 z-50 bg-[#020617] text-slate-100 flex flex-col justify-between p-6 sm:p-10 select-none animate-fade-in font-mono">
      {/* Top Header Bar */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
          <span className="text-xs font-mono tracking-widest text-slate-400 uppercase font-bold">
            DESK // FOCUS_TELEMETRY_HUD
          </span>
        </div>

        <div className="flex items-center gap-2">
          {/* Ambient quick toggles */}
          <div className="flex items-center gap-1 bg-slate-900 border border-slate-800 p-1 rounded">
            <button
              onClick={() => handleSoundChange('rain')}
              className={`p-1.5 rounded text-xs flex items-center gap-1 transition-all ${
                ambientSound === 'rain' ? 'bg-blue-950 text-blue-400 border border-blue-600' : 'text-slate-400 hover:text-slate-200'
              }`}
              title="RAIN"
            >
              <CloudRain className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => handleSoundChange('fire')}
              className={`p-1.5 rounded text-xs flex items-center gap-1 transition-all ${
                ambientSound === 'fire' ? 'bg-orange-950 text-orange-400 border border-orange-600' : 'text-slate-400 hover:text-slate-200'
              }`}
              title="FIRE"
            >
              <Flame className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => handleSoundChange('white')}
              className={`p-1.5 rounded text-xs flex items-center gap-1 transition-all ${
                ambientSound === 'white' ? 'bg-purple-950 text-purple-400 border border-purple-600' : 'text-slate-400 hover:text-slate-200'
              }`}
              title="WHITE NOISE"
            >
              <Radio className="w-3.5 h-3.5" />
            </button>
          </div>

          <button
            onClick={onClose}
            className="flex items-center gap-1 px-3 py-1.5 rounded bg-slate-900 border border-slate-700 hover:bg-slate-800 text-slate-300 text-[10px] uppercase font-bold transition-all shadow"
            title="EXIT DESK HUD (ESC)"
          >
            <Minimize2 className="w-3.5 h-3.5" />
            <span>EXIT_HUD [ESC]</span>
          </button>
        </div>
      </div>

      {/* Center Gigantic Clock Display */}
      <div className="flex flex-col items-center justify-center my-auto text-center space-y-3">
        <div className="text-slate-500 font-mono text-xs sm:text-sm tracking-widest uppercase">
          {dateStr}
        </div>

        <div className="text-6xl sm:text-8xl md:text-[128px] font-mono font-black tracking-tight text-slate-100 drop-shadow-2xl">
          {timeStr}
        </div>

        {/* Active Task Badge */}
        {activeTask ? (
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-slate-900/90 border border-blue-500/40 shadow-xl backdrop-blur-md">
            <span
              className="w-2.5 h-2.5 rounded-full"
              style={{ backgroundColor: SUBJECT_METAS[activeTask.subject]?.color || '#3b82f6' }}
            />
            <span className="font-bold text-xs sm:text-sm text-slate-100 font-sans">
              {activeTask.task}
            </span>
            <span className="text-[10px] font-mono text-blue-400 font-bold">
              [{activeTask.time} ~ {activeTask.duration}M]
            </span>
          </div>
        ) : (
          <div className="text-[10px] text-slate-500 font-mono uppercase tracking-widest">
            CURRENTLY_STANDBY // ALL_CLEAR
          </div>
        )}

        {/* Quick To-Do Checklist in Focus Desk Mode */}
        {todos.length > 0 && (
          <div className="w-full max-w-2xl bg-slate-900/80 border border-slate-800/90 rounded-xl p-3 sm:p-4 backdrop-blur-md shadow-2xl space-y-2 mt-2">
            <div className="flex items-center justify-between border-b border-slate-800 pb-1.5 text-xs font-mono">
              <div className="flex items-center gap-2 text-slate-300">
                <ListTodo className="w-4 h-4 text-emerald-400" />
                <span className="font-bold uppercase tracking-wider">FOCUS_TODO_CHECKLIST</span>
                <span className="text-[10px] text-slate-400">
                  ({todos.filter((t) => t.done).length}/{todos.length} 完了)
                </span>
              </div>
              <button
                onClick={() => setShowDeskTodos(!showDeskTodos)}
                className="text-[11px] text-slate-400 hover:text-slate-200"
              >
                {showDeskTodos ? '▲ 閉じる' : '▼ 展開'}
              </button>
            </div>

            {showDeskTodos && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-36 overflow-y-auto pr-1 text-left">
                {todos.map((todo) => {
                  const subjectMeta = todo.subject ? SUBJECT_METAS[todo.subject] : null;
                  return (
                    <div
                      key={todo.id}
                      onClick={() => onToggleTodo && onToggleTodo(todo.id)}
                      className={`flex items-center gap-2 p-2 rounded-lg border transition-all cursor-pointer ${
                        todo.done
                          ? 'bg-slate-950/40 border-slate-800 text-slate-500 line-through'
                          : 'bg-slate-950/80 border-slate-700/80 hover:border-emerald-500/50 text-slate-200 hover:bg-slate-900'
                      }`}
                    >
                      <button
                        type="button"
                        className="text-slate-500 hover:text-emerald-400 focus:outline-none flex-shrink-0"
                      >
                        {todo.done ? (
                          <CheckCircle2 className="w-4 h-4 text-emerald-400 fill-emerald-500/20" />
                        ) : (
                          <Circle className="w-4 h-4 hover:stroke-emerald-400" />
                        )}
                      </button>
                      <span className="text-xs font-sans truncate flex-1 font-medium">{todo.text}</span>
                      {subjectMeta && (
                        <span
                          className="text-[9px] font-mono px-1 py-0.2 rounded border flex-shrink-0"
                          style={{
                            borderColor: `${subjectMeta.color}40`,
                            color: subjectMeta.color,
                          }}
                        >
                          {subjectMeta.name}
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Bottom Floating Focus Stopwatch */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-slate-800/80 pt-3">
        <div className="flex items-center gap-2 text-[10px] text-slate-500 font-sans">
          <Sparkles className="w-3.5 h-3.5 text-blue-400" />
          <span>デスクに横置きして常時表示することで最適な集中ステーションとして機能します</span>
        </div>

        {/* Mini Stopwatch */}
        <div className="flex items-center gap-2 bg-slate-900/90 border border-slate-800 px-3 py-1.5 rounded">
          <span className="text-[10px] text-slate-400 uppercase font-bold">STOPWATCH:</span>
          <span className="font-mono font-black text-sm text-blue-400">
            {swHour}:{swMin}:{swSec}
          </span>
          <button
            onClick={() => setDeskSwRunning(!deskSwRunning)}
            className={`p-1 rounded text-white ${
              deskSwRunning ? 'bg-amber-600' : 'bg-blue-600'
            }`}
          >
            {deskSwRunning ? <Pause className="w-3 h-3" /> : <Play className="w-3 h-3" />}
          </button>
          <button
            onClick={() => {
              setDeskSwRunning(false);
              setDeskSwSeconds(0);
            }}
            className="p-1 rounded bg-slate-800 text-slate-300 hover:bg-slate-700"
          >
            <RotateCcw className="w-3 h-3" />
          </button>
        </div>
      </div>
    </div>
  );
};
