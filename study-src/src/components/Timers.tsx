import React, { useState, useEffect, useRef, useCallback } from 'react';
import { audioSynth } from '../services/audio';
import confetti from 'canvas-confetti';
import { Play, Pause, RotateCcw, ArrowDownToLine, Bell, Timer, Flame, Award } from 'lucide-react';
import { SubjectKey, MacroTask } from '../types';
import { STUDY_SUBJECT_KEYS, SUBJECT_METAS } from '../constants/subjects';

interface TimersProps {
  onCommitTimerResult: (subject: SubjectKey, durationMinutes: number, taskName: string, startTimeStr?: string) => void;
  macroTasks?: MacroTask[];
}

type PomodoroMode = 'work' | 'shortBreak' | 'longBreak';

export const Timers: React.FC<TimersProps> = ({ onCommitTimerResult, macroTasks = [] }) => {
  const [activeTab, setActiveTab] = useState<'pomo' | 'stopwatch' | 'countdown'>('pomo');

  // --- Pomodoro State ---
  const [pomoMode, setPomoMode] = useState<PomodoroMode>('work');
  const [pomoSecondsLeft, setPomoSecondsLeft] = useState<number>(25 * 60);
  const [pomoIsRunning, setPomoIsRunning] = useState<boolean>(false);
  const [pomoCycleCount, setPomoCycleCount] = useState<number>(1);
  const [selectedSubject, setSelectedSubject] = useState<SubjectKey>('math');
  const [pomoTaskTitle, setPomoTaskTitle] = useState<string>('');

  const pomoDurations = {
    work: 25 * 60,
    shortBreak: 5 * 60,
    longBreak: 15 * 60,
  };

  // --- Stopwatch State ---
  const [swSeconds, setSwSeconds] = useState<number>(0);
  const [swIsRunning, setSwIsRunning] = useState<boolean>(false);
  const [swStartTimeStr, setSwStartTimeStr] = useState<string>('');
  const [swTaskTitle, setSwTaskTitle] = useState<string>('');
  const [swSubject, setSwSubject] = useState<SubjectKey>('physics');

  // --- Countdown State ---
  const [cdInitialMinutes, setCdInitialMinutes] = useState<number>(60);
  const [cdSecondsLeft, setCdSecondsLeft] = useState<number>(60 * 60);
  const [cdIsRunning, setCdIsRunning] = useState<boolean>(false);
  const [cdTaskTitle, setCdTaskTitle] = useState<string>('');
  const [cdSubject, setCdSubject] = useState<SubjectKey>('chem');

  // Refs for intervals
  const pomoTimerRef = useRef<number | null>(null);
  const swTimerRef = useRef<number | null>(null);
  const cdTimerRef = useRef<number | null>(null);

  // Helper format MM:SS
  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  // Helper format HH:MM:SS
  const formatHourMinSec = (secs: number) => {
    const h = Math.floor(secs / 3600);
    const m = Math.floor((secs % 3600) / 60);
    const s = secs % 60;
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  // --- Pomodoro Tick ---
  const handlePomoComplete = useCallback(() => {
    audioSynth.playChime();
    if (pomoMode === 'work') {
      confetti({
        particleCount: 80,
        spread: 60,
        origin: { y: 0.7 },
      });
      if (pomoCycleCount % 4 === 0) {
        setPomoMode('longBreak');
        setPomoSecondsLeft(pomoDurations.longBreak);
      } else {
        setPomoMode('shortBreak');
        setPomoSecondsLeft(pomoDurations.shortBreak);
      }
      setPomoCycleCount((prev) => prev + 1);
    } else {
      setPomoMode('work');
      setPomoSecondsLeft(pomoDurations.work);
    }
  }, [pomoMode, pomoCycleCount, pomoDurations.longBreak, pomoDurations.shortBreak, pomoDurations.work]);

  useEffect(() => {
    if (pomoIsRunning) {
      pomoTimerRef.current = window.setInterval(() => {
        setPomoSecondsLeft((prev) => {
          if (prev <= 1) {
            handlePomoComplete();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else if (pomoTimerRef.current) {
      clearInterval(pomoTimerRef.current);
    }
    return () => {
      if (pomoTimerRef.current) clearInterval(pomoTimerRef.current);
    };
  }, [pomoIsRunning, handlePomoComplete]);

  // --- Stopwatch Tick ---
  useEffect(() => {
    if (swIsRunning) {
      swTimerRef.current = window.setInterval(() => {
        setSwSeconds((prev) => prev + 1);
      }, 1000);
    } else if (swTimerRef.current) {
      clearInterval(swTimerRef.current);
    }
    return () => {
      if (swTimerRef.current) clearInterval(swTimerRef.current);
    };
  }, [swIsRunning]);

  // --- Countdown Tick ---
  useEffect(() => {
    if (cdIsRunning) {
      cdTimerRef.current = window.setInterval(() => {
        setCdSecondsLeft((prev) => {
          if (prev <= 1) {
            audioSynth.playChime();
            setCdIsRunning(false);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else if (cdTimerRef.current) {
      clearInterval(cdTimerRef.current);
    }
    return () => {
      if (cdTimerRef.current) clearInterval(cdTimerRef.current);
    };
  }, [cdIsRunning]);

  const toggleStopwatch = () => {
    if (!swIsRunning) {
      if (swSeconds === 0) {
        const d = new Date();
        const startStr = `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`;
        setSwStartTimeStr(startStr);
      }
      setSwIsRunning(true);
    } else {
      setSwIsRunning(false);
    }
  };

  const resetStopwatch = () => {
    setSwIsRunning(false);
    setSwSeconds(0);
    setSwStartTimeStr('');
  };

  const commitStopwatch = () => {
    if (swSeconds < 60) return;
    const durMins = Math.round(swSeconds / 60);
    onCommitTimerResult(
      swSubject,
      durMins,
      swTaskTitle || `${SUBJECT_METAS[swSubject].name} 集中演習`,
      swStartTimeStr
    );
    resetStopwatch();
  };

  const commitPomodoro = () => {
    onCommitTimerResult(
      selectedSubject,
      25,
      pomoTaskTitle || `${SUBJECT_METAS[selectedSubject].name} 集中演習`
    );
    confetti({ particleCount: 50, spread: 50 });
  };

  const commitCountdown = () => {
    const durMins = cdInitialMinutes;
    onCommitTimerResult(
      cdSubject,
      durMins,
      cdTaskTitle || `${SUBJECT_METAS[cdSubject].name} 模試演習`
    );
    setCdIsRunning(false);
    setCdSecondsLeft(cdInitialMinutes * 60);
  };

  const currentPomoBooks = macroTasks.filter((t) => t.subject === selectedSubject);
  const currentSwBooks = macroTasks.filter((t) => t.subject === swSubject);
  const currentCdBooks = macroTasks.filter((t) => t.subject === cdSubject);

  return (
    <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4 shadow-lg text-slate-200">
      {/* Sub Tabs */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-2.5 mb-3.5">
        <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-lg border border-slate-800 font-mono">
          <button
            onClick={() => setActiveTab('pomo')}
            className={`px-3 py-1.5 rounded-md text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 transition-all whitespace-nowrap ${
              activeTab === 'pomo' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Flame className="w-3.5 h-3.5 text-amber-400" />
            <span>POMODORO</span>
          </button>

          <button
            onClick={() => setActiveTab('stopwatch')}
            className={`px-3 py-1.5 rounded-md text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 transition-all whitespace-nowrap ${
              activeTab === 'stopwatch' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Timer className="w-3.5 h-3.5 text-blue-300" />
            <span>STOPWATCH</span>
          </button>

          <button
            onClick={() => setActiveTab('countdown')}
            className={`px-3 py-1.5 rounded-md text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 transition-all whitespace-nowrap ${
              activeTab === 'countdown' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Bell className="w-3.5 h-3.5 text-indigo-300" />
            <span>EXAM_CD</span>
          </button>
        </div>

        <span className="text-xs font-mono text-blue-400 font-bold uppercase tracking-wider hidden sm:inline-block whitespace-nowrap">
          TELEMETRY_TIMERS
        </span>
      </div>

      {/* --- POMODORO VIEW --- */}
      {activeTab === 'pomo' && (
        <div className="space-y-3.5">
          <div className="flex items-center justify-between font-mono">
            <div className="flex gap-1.5">
              <button
                onClick={() => {
                  setPomoMode('work');
                  setPomoSecondsLeft(pomoDurations.work);
                  setPomoIsRunning(false);
                }}
                className={`px-2.5 py-1 rounded-md text-xs font-bold border transition-all whitespace-nowrap ${
                  pomoMode === 'work'
                    ? 'bg-blue-950 border-blue-500 text-blue-300'
                    : 'bg-slate-900 border-slate-800 text-slate-400'
                }`}
              >
                FOCUS_25M
              </button>
              <button
                onClick={() => {
                  setPomoMode('shortBreak');
                  setPomoSecondsLeft(pomoDurations.shortBreak);
                  setPomoIsRunning(false);
                }}
                className={`px-2.5 py-1 rounded-md text-xs font-bold border transition-all whitespace-nowrap ${
                  pomoMode === 'shortBreak'
                    ? 'bg-emerald-950 border-emerald-500 text-emerald-300'
                    : 'bg-slate-900 border-slate-800 text-slate-400'
                }`}
              >
                REST_5M
              </button>
              <button
                onClick={() => {
                  setPomoMode('longBreak');
                  setPomoSecondsLeft(pomoDurations.longBreak);
                  setPomoIsRunning(false);
                }}
                className={`px-2.5 py-1 rounded-md text-xs font-bold border transition-all whitespace-nowrap ${
                  pomoMode === 'longBreak'
                    ? 'bg-purple-950 border-purple-500 text-purple-300'
                    : 'bg-slate-900 border-slate-800 text-slate-400'
                }`}
              >
                REST_15M
              </button>
            </div>

            <div className="flex items-center gap-1.5 text-xs text-blue-400 font-bold uppercase tracking-wider whitespace-nowrap">
              <Award className="w-4 h-4" />
              <span>CYCLE #{pomoCycleCount}</span>
            </div>
          </div>

          {/* Big Digit Display */}
          <div className="text-center py-2.5 bg-slate-950/80 rounded-lg border border-slate-800/80">
            <div className="text-5xl sm:text-6xl font-mono font-black tracking-tight text-white drop-shadow-sm">
              {formatTime(pomoSecondsLeft)}
            </div>
            <div className="text-xs font-mono font-bold uppercase text-blue-400/80 tracking-widest mt-1">
              {pomoMode === 'work' ? 'FOCUS PHASE ACTIVE' : 'RECOVERY / COOL-DOWN'}
            </div>
          </div>

          {/* Subject & Task selection */}
          <div className="space-y-2">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <div className="sm:col-span-1">
                <select
                  value={selectedSubject}
                  onChange={(e) => setSelectedSubject(e.target.value as SubjectKey)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-md px-2.5 py-2 text-xs text-slate-200 focus:outline-none focus:border-blue-500 font-mono"
                >
                  {STUDY_SUBJECT_KEYS.map((k) => (
                    <option key={k} value={k}>
                      {SUBJECT_METAS[k].name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="sm:col-span-2">
                <input
                  type="text"
                  value={pomoTaskTitle}
                  onChange={(e) => setPomoTaskTitle(e.target.value)}
                  placeholder={`タスク・教材名 (例: ${currentPomoBooks[0]?.category || '例題演習'})`}
                  className="w-full bg-slate-950 border border-slate-700 rounded-md px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-blue-500 font-sans"
                />
              </div>
            </div>

            {/* Quick textbook buttons */}
            {currentPomoBooks.length > 0 && (
              <div className="flex items-center gap-1.5 flex-wrap pt-0.5">
                <span className="text-[11px] text-slate-500 font-mono whitespace-nowrap">登録教材:</span>
                {currentPomoBooks.map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => setPomoTaskTitle(t.category)}
                    className="px-2 py-1 rounded bg-slate-950 hover:bg-blue-950 border border-slate-800 hover:border-blue-500/50 text-xs text-slate-300 hover:text-blue-300 transition-all font-sans whitespace-nowrap"
                  >
                    {t.category}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Control Buttons */}
          <div className="flex items-center gap-2 pt-1">
            <button
              onClick={() => setPomoIsRunning(!pomoIsRunning)}
              className={`flex-1 py-2.5 rounded-md font-mono font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-sm transition-all uppercase tracking-wider whitespace-nowrap ${
                pomoIsRunning
                  ? 'bg-amber-600 hover:bg-amber-500 text-white'
                  : 'bg-blue-600 hover:bg-blue-500 text-white'
              }`}
            >
              {pomoIsRunning ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
              <span>{pomoIsRunning ? 'PAUSE' : 'START_FOCUS'}</span>
            </button>

            <button
              onClick={() => {
                setPomoIsRunning(false);
                setPomoSecondsLeft(pomoDurations[pomoMode]);
              }}
              title="タイマーリセット"
              className="p-2.5 rounded-md bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300"
            >
              <RotateCcw className="w-4 h-4" />
            </button>

            <button
              onClick={commitPomodoro}
              className="px-3.5 py-2.5 rounded-md bg-blue-950 border border-blue-500/50 text-blue-300 text-xs font-mono font-bold uppercase flex items-center gap-1.5 transition-all hover:bg-blue-900 whitespace-nowrap"
              title="この25分をタイムライン／ログに即記録"
            >
              <ArrowDownToLine className="w-4 h-4 text-blue-400" />
              <span>COMMIT_25M</span>
            </button>
          </div>
        </div>
      )}

      {/* --- STOPWATCH VIEW --- */}
      {activeTab === 'stopwatch' && (
        <div className="space-y-3.5">
          <div className="flex items-center justify-between text-xs font-mono text-slate-400">
            <span>START: <strong className="text-blue-400">{swStartTimeStr || '--:--'}</strong></span>
            <span className="uppercase text-slate-500">PRECISION_TIMER</span>
          </div>

          <div className="text-center py-2.5 bg-slate-950/80 rounded-lg border border-slate-800/80">
            <div className="text-5xl sm:text-6xl font-mono font-black tracking-tight text-white drop-shadow-sm">
              {formatHourMinSec(swSeconds)}
            </div>
            <div className="text-xs font-mono font-bold uppercase text-blue-400/80 tracking-widest mt-1">
              {swIsRunning ? '⚡ LOGGING_ACTIVE' : 'STANDBY'}
            </div>
          </div>

          {/* Form parameters */}
          <div className="space-y-2">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <div className="sm:col-span-1">
                <select
                  value={swSubject}
                  onChange={(e) => setSwSubject(e.target.value as SubjectKey)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-md px-2.5 py-2 text-xs text-slate-200 focus:outline-none focus:border-blue-500 font-mono"
                >
                  {STUDY_SUBJECT_KEYS.map((k) => (
                    <option key={k} value={k}>
                      {SUBJECT_METAS[k].name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="sm:col-span-2">
                <input
                  type="text"
                  value={swTaskTitle}
                  onChange={(e) => setSwTaskTitle(e.target.value)}
                  placeholder={`演習内容 (例: ${currentSwBooks[0]?.category || '問題演習'})`}
                  className="w-full bg-slate-950 border border-slate-700 rounded-md px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-blue-500 font-sans"
                />
              </div>
            </div>

            {/* Quick textbook buttons */}
            {currentSwBooks.length > 0 && (
              <div className="flex items-center gap-1.5 flex-wrap pt-0.5">
                <span className="text-[11px] text-slate-500 font-mono whitespace-nowrap">登録教材:</span>
                {currentSwBooks.map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => setSwTaskTitle(t.category)}
                    className="px-2 py-1 rounded bg-slate-950 hover:bg-blue-950 border border-slate-800 hover:border-blue-500/50 text-xs text-slate-300 hover:text-blue-300 transition-all font-sans whitespace-nowrap"
                  >
                    {t.category}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Controls */}
          <div className="flex items-center gap-2 pt-1">
            <button
              onClick={toggleStopwatch}
              className={`flex-1 py-2.5 rounded-md font-mono font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-sm transition-all uppercase tracking-wider whitespace-nowrap ${
                swIsRunning
                  ? 'bg-amber-600 hover:bg-amber-500 text-white'
                  : 'bg-blue-600 hover:bg-blue-500 text-white'
              }`}
            >
              {swIsRunning ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
              <span>{swIsRunning ? 'STOP' : 'START_STOPWATCH'}</span>
            </button>

            <button
              onClick={resetStopwatch}
              title="リセット"
              className="p-2.5 rounded-md bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300"
            >
              <RotateCcw className="w-4 h-4" />
            </button>

            <button
              onClick={commitStopwatch}
              disabled={swSeconds < 60}
              className={`px-3.5 py-2.5 rounded-md border text-xs font-mono font-bold uppercase flex items-center gap-1.5 transition-all whitespace-nowrap ${
                swSeconds >= 60
                  ? 'bg-blue-950 hover:bg-blue-900 border-blue-500/50 text-blue-300'
                  : 'bg-slate-900 border-slate-800 text-slate-600 cursor-not-allowed'
              }`}
              title="現在の計測結果を記録"
            >
              <ArrowDownToLine className="w-4 h-4" />
              <span>COMMIT_LOG</span>
            </button>
          </div>
        </div>
      )}

      {/* --- COUNTDOWN VIEW --- */}
      {activeTab === 'countdown' && (
        <div className="space-y-3.5">
          <div className="flex items-center justify-between text-xs font-mono text-slate-400">
            <div className="flex gap-1.5">
              {[15, 30, 60, 90, 120].map((m) => (
                <button
                  key={m}
                  onClick={() => {
                    setCdInitialMinutes(m);
                    setCdSecondsLeft(m * 60);
                    setCdIsRunning(false);
                  }}
                  className={`px-2 py-1 rounded-md text-xs font-mono font-bold border transition-all whitespace-nowrap ${
                    cdInitialMinutes === m
                      ? 'bg-blue-950 border-blue-400 text-blue-300'
                      : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {m}M
                </button>
              ))}
            </div>
            <span className="uppercase text-slate-500 whitespace-nowrap">EXAM_SIMULATION</span>
          </div>

          <div className="text-center py-2.5 bg-slate-950/80 rounded-lg border border-slate-800/80">
            <div className="text-5xl sm:text-6xl font-mono font-black tracking-tight text-white drop-shadow-sm">
              {formatTime(cdSecondsLeft)}
            </div>
            <div className="text-xs font-mono font-bold uppercase text-blue-400/80 tracking-widest mt-1">
              {cdIsRunning ? 'EXAM TIMER RUNNING' : 'STANDBY'}
            </div>
          </div>

          <div className="space-y-2">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <div className="sm:col-span-1">
                <select
                  value={cdSubject}
                  onChange={(e) => setCdSubject(e.target.value as SubjectKey)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-md px-2.5 py-2 text-xs text-slate-200 focus:outline-none focus:border-blue-500 font-mono"
                >
                  {STUDY_SUBJECT_KEYS.map((k) => (
                    <option key={k} value={k}>
                      {SUBJECT_METAS[k].name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="sm:col-span-2">
                <input
                  type="text"
                  value={cdTaskTitle}
                  onChange={(e) => setCdTaskTitle(e.target.value)}
                  placeholder={`演習名 (例: ${currentCdBooks[0]?.category || '共通テスト模試'})`}
                  className="w-full bg-slate-950 border border-slate-700 rounded-md px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-blue-500 font-sans"
                />
              </div>
            </div>

            {/* Quick textbook buttons */}
            {currentCdBooks.length > 0 && (
              <div className="flex items-center gap-1.5 flex-wrap pt-0.5">
                <span className="text-[11px] text-slate-500 font-mono whitespace-nowrap">登録教材:</span>
                {currentCdBooks.map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => setCdTaskTitle(t.category)}
                    className="px-2 py-1 rounded bg-slate-950 hover:bg-blue-950 border border-slate-800 hover:border-blue-500/50 text-xs text-slate-300 hover:text-blue-300 transition-all font-sans whitespace-nowrap"
                  >
                    {t.category}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="flex items-center gap-2 pt-1">
            <button
              onClick={() => setCdIsRunning(!cdIsRunning)}
              className={`flex-1 py-2.5 rounded-md font-mono font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-sm transition-all uppercase tracking-wider whitespace-nowrap ${
                cdIsRunning
                  ? 'bg-amber-600 hover:bg-amber-500 text-white'
                  : 'bg-blue-600 hover:bg-blue-500 text-white'
              }`}
            >
              {cdIsRunning ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
              <span>{cdIsRunning ? 'PAUSE' : 'START_EXAM'}</span>
            </button>

            <button
              onClick={() => {
                setCdIsRunning(false);
                setCdSecondsLeft(cdInitialMinutes * 60);
              }}
              title="リセット"
              className="p-2.5 rounded-md bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300"
            >
              <RotateCcw className="w-4 h-4" />
            </button>

            <button
              onClick={commitCountdown}
              className="px-3.5 py-2.5 rounded-md bg-blue-950 hover:bg-blue-900 border border-blue-500/50 text-blue-300 text-xs font-mono font-bold uppercase flex items-center gap-1.5 transition-all whitespace-nowrap"
            >
              <ArrowDownToLine className="w-4 h-4" />
              <span>COMMIT_{cdInitialMinutes}M</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
