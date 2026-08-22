import React, { useState, useEffect } from 'react';
import {
  ViewTab,
  TaskItem,
  MacroPlan,
  UserProfile,
  StudySessionLog,
  SubjectKey,
  PaddockUserStatus,
  MacroTask,
  TodoItem,
} from './types';
import {
  getTodayDateStr,
  loadTasksForDate,
  saveTasksForDate,
  loadTodos,
  saveTodos,
  loadMacroPlan,
  saveMacroPlan,
  loadUserProfile,
  saveUserProfile,
  loadSessionLogs,
  appendSessionLog,
  saveSessionLogs,
  getMockPaddockDrivers,
  isOnboardingCompleted,
  setOnboardingCompleted,
  clearAllDataAndRestartOnboarding,
} from './services/storage';
import { GlobalNav } from './components/GlobalNav';
import { ClockCanvas } from './components/ClockCanvas';
import { Timers } from './components/Timers';
import { TimelineSection } from './components/TimelineSection';
import { TodoListSection } from './components/TodoListSection';
import { MilestonesAndMacro } from './components/MilestonesAndMacro';
import { AnalysisView } from './components/AnalysisView';
import { GarageView } from './components/GarageView';
import { FocusDeskOverlay } from './components/FocusDeskOverlay';
import { ProfileModal } from './components/ProfileModal';
import { OnboardingModal } from './components/OnboardingModal';
import { TextbookManagerModal } from './components/TextbookManagerModal';
import { User } from 'firebase/auth';
import {
  onUserAuthStateChanged,
  loginWithGoogle,
  logoutUser,
  saveTodosToCloud,
  subscribeToCloudTodos,
} from './services/firebase';
import { SUBJECT_METAS } from './constants/subjects';
import { audioSynth } from './services/audio';

export default function App() {
  // Navigation tab
  const [currentTab, setCurrentTab] = useState<ViewTab>('cockpit');

  // Real-time clock
  const [currentTime, setCurrentTime] = useState<Date>(new Date());

  // Date and Task State
  const [currentDateStr, setCurrentDateStr] = useState<string>(getTodayDateStr());
  const [tasks, setTasks] = useState<TaskItem[]>(() => loadTasksForDate(getTodayDateStr()));

  // To-Do State & Active selection for Timer
  const [todos, setTodos] = useState<TodoItem[]>(() => loadTodos());
  const [selectedTodoForTimer, setSelectedTodoForTimer] = useState<TodoItem | null>(null);

  // Firebase Auth & Cloud Sync State
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);

  // Macro Plan, Profile, Logs, Paddock
  const [macroPlan, setMacroPlan] = useState<MacroPlan>(() => loadMacroPlan());
  const [userProfile, setUserProfile] = useState<UserProfile>(() => loadUserProfile());
  const [sessionLogs, setSessionLogs] = useState<StudySessionLog[]>(() => loadSessionLogs());
  const [paddockDrivers] = useState<PaddockUserStatus[]>(() => getMockPaddockDrivers());

  // Overlay Modals
  const [showDeskOverlay, setShowDeskOverlay] = useState<boolean>(false);
  const [showProfileModal, setShowProfileModal] = useState<boolean>(false);
  const [showTextbookModal, setShowTextbookModal] = useState<boolean>(false);
  const [showOnboarding, setShowOnboarding] = useState<boolean>(() => !isOnboardingCompleted());

  // Clock interval (every second)
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Firebase Auth & Realtime Cloud Todo Listener
  useEffect(() => {
    let unsubscribeTodos: (() => void) | null = null;

    const unsubscribeAuth = onUserAuthStateChanged((user) => {
      setCurrentUser(user);
      if (user) {
        setIsSyncing(true);
        // Subscribe to real-time todos from Firebase Cloud
        unsubscribeTodos = subscribeToCloudTodos(user.uid, (cloudTodos) => {
          setIsSyncing(false);
          if (cloudTodos && cloudTodos.length > 0) {
            setTodos(cloudTodos);
            saveTodos(cloudTodos);
          } else {
            // If cloud is empty, upload local todos if any exist
            const localTodos = loadTodos();
            if (localTodos && localTodos.length > 0) {
              saveTodosToCloud(user.uid, localTodos);
            }
          }
        });
      } else {
        if (unsubscribeTodos) {
          unsubscribeTodos();
          unsubscribeTodos = null;
        }
        setIsSyncing(false);
      }
    });

    return () => {
      unsubscribeAuth();
      if (unsubscribeTodos) unsubscribeTodos();
    };
  }, []);

  // Keyboard shortcut listener ('F' for desk mode, 'Esc' for closing overlay)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes(target?.tagName)) return;

      if (e.key === 'f' || e.key === 'F') {
        setShowDeskOverlay((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Sync tasks when date changes
  const handleDateChange = (newDateStr: string) => {
    setCurrentDateStr(newDateStr);
    const loaded = loadTasksForDate(newDateStr);
    setTasks(loaded);
  };

  // Update tasks and persist
  const handleUpdateTasks = (updatedTasks: TaskItem[]) => {
    setTasks(updatedTasks);
    saveTasksForDate(currentDateStr, updatedTasks);

    // Live update macro completed hours calculation
    const totalTodayDoneStudyMinutes = updatedTasks
      .filter((t) => SUBJECT_METAS[t.subject]?.isStudy && t.done)
      .reduce((acc, t) => acc + t.duration, 0);

    // calculate diff or update
  };

  // Update To-Do items and persist (LocalStorage + Firebase Cloud)
  const handleUpdateTodos = (updatedTodos: TodoItem[]) => {
    setTodos(updatedTodos);
    saveTodos(updatedTodos);
    if (currentUser) {
      setIsSyncing(true);
      saveTodosToCloud(currentUser.uid, updatedTodos)
        .catch((err) => console.error('Cloud save failed:', err))
        .finally(() => setIsSyncing(false));
    }
  };

  // Google Login / Logout Handlers
  const handleLoginWithGoogle = async () => {
    try {
      setIsSyncing(true);
      const user = await loginWithGoogle();
      if (user) {
        audioSynth.playChime();
      }
    } catch (err) {
      alert('Googleログインに失敗しました: ' + (err as Error).message);
    } finally {
      setIsSyncing(false);
    }
  };

  const handleLogout = async () => {
    if (window.confirm('ログアウトしますか？')) {
      await logoutUser();
      audioSynth.playTick();
    }
  };

  // Select To-Do to focus in Timer
  const handleSelectTodoForTimer = (todo: TodoItem) => {
    setSelectedTodoForTimer(todo);
    const timerElem = document.getElementById('telemetry-timers-card');
    if (timerElem) {
      timerElem.scrollIntoView({ behavior: 'smooth' });
    }
  };

  // Add To-Do item directly to today's 24h schedule
  const handleAddTodoToTimeline = (todo: TodoItem, startTime: string, durationMinutes: number) => {
    const newTask: TaskItem = {
      id: `task_from_todo_${Date.now()}`,
      time: startTime,
      duration: durationMinutes,
      subject: todo.subject || 'math',
      task: todo.text,
      done: false,
      order: tasks.length,
    };

    const updatedTasks = [...tasks, newTask].sort((a, b) => {
      const [h1, m1] = a.time.split(':').map(Number);
      const [h2, m2] = b.time.split(':').map(Number);
      return h1 * 60 + m1 - (h2 * 60 + m2);
    });

    handleUpdateTasks(updatedTasks);
  };

  // Update Macro Plan
  const handleUpdateMacroPlan = (newPlan: MacroPlan) => {
    setMacroPlan(newPlan);
    saveMacroPlan(newPlan);
  };

  // Update User Profile
  const handleSaveProfile = (newProfile: UserProfile) => {
    setUserProfile(newProfile);
    saveUserProfile(newProfile);
  };

  // Commit timer result into tasks & session logs
  const handleCommitTimerResult = (
    subject: SubjectKey,
    durationMinutes: number,
    taskTitle: string,
    startTimeStr?: string
  ) => {
    const d = new Date();
    const nowTimeStr = startTimeStr || `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`;

    const newTask: TaskItem = {
      id: `timer_${Date.now()}`,
      time: nowTimeStr,
      duration: durationMinutes,
      subject,
      task: taskTitle || `${SUBJECT_METAS[subject].name} 集中演習`,
      done: true,
      order: tasks.length,
      quality: 5,
    };

    const updatedTasks = [...tasks, newTask].sort((a, b) => {
      const [h1, m1] = a.time.split(':').map(Number);
      const [h2, m2] = b.time.split(':').map(Number);
      return h1 * 60 + m1 - (h2 * 60 + m2);
    });

    handleUpdateTasks(updatedTasks);

    // Also record into session logs
    const newLog: StudySessionLog = {
      id: `log_${Date.now()}`,
      timestamp: d.toISOString(),
      dateStr: currentDateStr,
      subject,
      taskTitle: taskTitle || `${SUBJECT_METAS[subject].name} 集中演習`,
      durationMinutes,
      quality: 5,
      note: 'タイマー記録から自動同期完了',
    };

    appendSessionLog(newLog);
    setSessionLogs((prev) => [newLog, ...prev]);

    // Update Macro completed hours
    const addedHours = Number((durationMinutes / 60).toFixed(2));
    const updatedPlan = {
      ...macroPlan,
      completedHours: Number((macroPlan.completedHours + addedHours).toFixed(2)),
    };
    handleUpdateMacroPlan(updatedPlan);
    audioSynth.playTick();
  };

  // Deploy Template (Phase 1 or Phase 2)
  const handleDeployTemplate = (templateType: 'phase1' | 'phase2') => {
    const template = macroPlan.templates[templateType];
    const newTasks: TaskItem[] = [];

    if (templateType === 'phase1') {
      // Weekday schedule
      newTasks.push(
        { id: 't_p1_1', time: '00:00', duration: template.sleep || 420, subject: 'sleep', task: '夜間睡眠・完全冷却', done: false, order: 0 },
        { id: 't_p1_2', time: '07:00', duration: template.life ? Math.floor(template.life / 3) : 60, subject: 'life', task: '起床・朝食・通学準備', done: false, order: 1 },
        { id: 't_p1_3', time: '08:00', duration: template.school || 480, subject: 'school', task: '学校授業・部活動', done: false, order: 2 },
        { id: 't_p1_4', time: '16:00', duration: template.life ? Math.floor(template.life / 3) : 60, subject: 'life', task: '帰宅・軽食ピットイン', done: false, order: 3 },
        { id: 't_p1_5', time: '17:00', duration: template.math || 120, subject: 'math', task: '数学 例題演習', done: false, order: 4 },
        { id: 't_p1_6', time: '19:00', duration: template.life ? Math.floor(template.life / 3) : 60, subject: 'life', task: '夕食・入浴', done: false, order: 5 },
        { id: 't_p1_7', time: '20:00', duration: template.physics || 90, subject: 'physics', task: '物理 問題演習', done: false, order: 6 },
        { id: 't_p1_8', time: '21:30', duration: template.chem || 90, subject: 'chem', task: '化学 要点特訓', done: false, order: 7 },
        { id: 't_p1_9', time: '23:00', duration: template.eng || 60, subject: 'eng', task: '英語 単語・長文チェック', done: false, order: 8 }
      );
    } else {
      // Weekend / Holiday schedule
      newTasks.push(
        { id: 't_p2_1', time: '00:00', duration: template.sleep || 450, subject: 'sleep', task: '夜間睡眠 (7.5h)', done: false, order: 0 },
        { id: 't_p2_2', time: '07:30', duration: 60, subject: 'life', task: '起床・朝食・ウォーミングアップ', done: false, order: 1 },
        { id: 't_p2_3', time: '08:30', duration: template.math || 180, subject: 'math', task: '数学 微積分・過去問演習', done: false, order: 2 },
        { id: 't_p2_4', time: '11:30', duration: 60, subject: 'life', task: '昼食・仮眠ピットイン', done: false, order: 3 },
        { id: 't_p2_5', time: '12:30', duration: template.physics || 180, subject: 'physics', task: '物理 名問・電磁気演習', done: false, order: 4 },
        { id: 't_p2_6', time: '15:30', duration: template.chem || 180, subject: 'chem', task: '化学 有機構造決定演習', done: false, order: 5 },
        { id: 't_p2_7', time: '18:30', duration: 60, subject: 'life', task: '夕食・入浴', done: false, order: 6 },
        { id: 't_p2_8', time: '19:30', duration: template.eng || 150, subject: 'eng', task: '英語 長文読解・リスニング', done: false, order: 7 },
        { id: 't_p2_9', time: '22:00', duration: template.kobun || 60, subject: 'kobun', task: '古文・漢文 句法チェック', done: false, order: 8 },
        { id: 't_p2_10', time: '23:00', duration: 60, subject: 'life', task: '振り返り・就寝準備', done: false, order: 9 }
      );
    }

    handleUpdateTasks(newTasks);
    audioSynth.playChime();
  };

  // Add manual log
  const handleAddManualLog = (newLog: StudySessionLog) => {
    appendSessionLog(newLog);
    setSessionLogs((prev) => [newLog, ...prev]);

    const addedHours = Number((newLog.durationMinutes / 60).toFixed(2));
    const updatedPlan = {
      ...macroPlan,
      completedHours: Number((macroPlan.completedHours + addedHours).toFixed(2)),
    };
    handleUpdateMacroPlan(updatedPlan);
  };

  // Delete session log
  const handleDeleteLog = (id: string) => {
    const updated = sessionLogs.filter((l) => l.id !== id);
    setSessionLogs(updated);
    saveSessionLogs(updated);
  };

  // Complete Onboarding
  const handleCompleteOnboarding = (newProfile: UserProfile, newPlan: MacroPlan) => {
    setUserProfile(newProfile);
    saveUserProfile(newProfile);
    setMacroPlan(newPlan);
    saveMacroPlan(newPlan);
    setOnboardingCompleted(true);
    setShowOnboarding(false);
  };

  // Update Macro Tasks from Textbook modal
  const handleUpdateMacroTasks = (newTasks: MacroTask[]) => {
    const updatedPlan = { ...macroPlan, macroTasks: newTasks };
    handleUpdateMacroPlan(updatedPlan);
  };

  // Reset all data & Restart Onboarding
  const handleResetAllData = () => {
    if (window.confirm('すべての記録と設定を初期化して、初期設定を最初からやり直しますか？')) {
      clearAllDataAndRestartOnboarding();
      window.location.reload();
    }
  };

  return (
    <div className="min-h-screen bg-[#020617] text-slate-200 flex flex-col font-sans selection:bg-blue-600 selection:text-white">
      {/* Global HUD Nav */}
      <GlobalNav
        currentTab={currentTab}
        onTabChange={setCurrentTab}
        onOpenDeskMode={() => setShowDeskOverlay(true)}
        onOpenProfile={() => setShowProfileModal(true)}
        userProfile={userProfile}
        macroPlan={macroPlan}
        currentTime={currentTime}
        todos={todos}
        currentUser={currentUser}
        isSyncing={isSyncing}
        onLoginWithGoogle={handleLoginWithGoogle}
        onLogout={handleLogout}
      />

      {/* Main View Container */}
      <main className="flex-1 max-w-[1720px] w-full mx-auto p-3 sm:p-5 space-y-4">
        {/* --- 1. COCKPIT VIEW --- */}
        {currentTab === 'cockpit' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-5 items-start">
            {/* Left Column: 24h Clock Telemetry & Timers (5 cols) */}
            <div className="lg:col-span-5 space-y-4">
              {/* 24-Hour Dial Card */}
              <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4 shadow-lg">
                <div className="flex items-center justify-between border-b border-slate-800 pb-2.5 mb-2.5 font-mono">
                  <div className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
                    <h3 className="font-bold text-xs sm:text-sm text-slate-100 uppercase tracking-wider">
                      24H_TRUE_CLOCK_TELEMETRY
                    </h3>
                  </div>
                  <span className="text-xs font-mono text-blue-400 font-bold">
                    DIAL: 00:00 - 24:00
                  </span>
                </div>

                <ClockCanvas
                  tasks={tasks}
                  currentTime={currentTime}
                  onTaskClick={() => {
                    audioSynth.playTick();
                  }}
                />
              </div>

              {/* Multi-Timer Suite (Pomodoro, Stopwatch, Countdown) */}
              <div id="telemetry-timers-card">
                <Timers
                  onCommitTimerResult={handleCommitTimerResult}
                  macroTasks={macroPlan.macroTasks}
                  todos={todos}
                  selectedTodoForTimer={selectedTodoForTimer}
                />
              </div>
            </div>

            {/* Right Column: Timeline Schedule & To-Do Action Matrix & Milestones (7 cols) */}
            <div className="lg:col-span-7 space-y-4">
              <TimelineSection
                currentDateStr={currentDateStr}
                tasks={tasks}
                onDateChange={handleDateChange}
                onUpdateTasks={handleUpdateTasks}
                onDeployTemplate={handleDeployTemplate}
                phase1Config={macroPlan.templates.phase1}
                phase2Config={macroPlan.templates.phase2}
              />

              {/* To-Do Action Matrix (with Firebase Cloud Sync) */}
              <TodoListSection
                todos={todos}
                onUpdateTodos={handleUpdateTodos}
                onSelectTodoForTimer={handleSelectTodoForTimer}
                onAddTodoToTimeline={handleAddTodoToTimeline}
                currentUser={currentUser}
                isSyncing={isSyncing}
                onLoginWithGoogle={handleLoginWithGoogle}
                onLogout={handleLogout}
              />

              <MilestonesAndMacro
                macroPlan={macroPlan}
                onUpdateMacroPlan={handleUpdateMacroPlan}
                paddockDrivers={paddockDrivers}
                onOpenTextbookManager={() => setShowTextbookModal(true)}
              />
            </div>
          </div>
        )}

        {/* --- 2. ANALYSIS VIEW --- */}
        {currentTab === 'analysis' && (
          <AnalysisView
            logs={sessionLogs}
            onAddManualLog={handleAddManualLog}
            onDeleteLog={handleDeleteLog}
          />
        )}

        {/* --- 3. GARAGE VIEW --- */}
        {currentTab === 'garage' && (
          <GarageView
            macroPlan={macroPlan}
            onUpdateMacroPlan={handleUpdateMacroPlan}
            onResetAllData={handleResetAllData}
          />
        )}
      </main>

      {/* Focus Desk Mode Overlay */}
      {showDeskOverlay && (
        <FocusDeskOverlay
          currentTime={currentTime}
          tasks={tasks}
          todos={todos}
          onToggleTodo={(id) => {
            const updated = todos.map((t) => {
              if (t.id === id) {
                const nextDone = !t.done;
                if (nextDone) audioSynth.playChime();
                else audioSynth.playTick();
                return { ...t, done: nextDone };
              }
              return t;
            });
            handleUpdateTodos(updated);
          }}
          onClose={() => setShowDeskOverlay(false)}
        />
      )}

      {/* Driver Profile Modal */}
      {showProfileModal && (
        <ProfileModal
          userProfile={userProfile}
          onSaveProfile={handleSaveProfile}
          onClose={() => setShowProfileModal(false)}
          onRelaunchOnboarding={() => {
            setShowProfileModal(false);
            setShowOnboarding(true);
          }}
          currentUser={currentUser}
          onLoginWithGoogle={handleLoginWithGoogle}
          onLogout={handleLogout}
        />
      )}

      {/* Textbook Manager Modal */}
      {showTextbookModal && (
        <TextbookManagerModal
          macroTasks={macroPlan.macroTasks}
          onUpdateMacroTasks={handleUpdateMacroTasks}
          onClose={() => setShowTextbookModal(false)}
        />
      )}

      {/* Initial Onboarding Wizard Modal */}
      {showOnboarding && (
        <OnboardingModal
          initialProfile={userProfile}
          initialMacroPlan={macroPlan}
          onComplete={handleCompleteOnboarding}
        />
      )}
    </div>
  );
}
