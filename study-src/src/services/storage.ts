import {
  DayTemplateConfig,
  MacroPlan,
  MacroTask,
  Milestone,
  PaddockUserStatus,
  StudySessionLog,
  TaskItem,
  TodoItem,
  UserProfile,
} from '../types';

const STORAGE_KEYS = {
  DAILY_TASKS_PREFIX: 'studyclock_tasks_',
  MACRO_PLAN: 'studyclock_macro_plan',
  USER_PROFILE: 'studyclock_user_profile',
  SESSION_LOGS: 'studyclock_session_logs',
  PADDOCK_STATUSES: 'studyclock_paddock_statuses',
  TODOS: 'studyclock_todos',
};

export const DEFAULT_PHASE1_TEMPLATE: DayTemplateConfig = {
  sleep: 420, // 7.0h (420 min)
  life: 180,  // 3.0h (180 min)
  school: 480, // 8.0h (480 min)
  math: 120,  // 2.0h (120 min)
  physics: 90, // 1.5h (90 min)
  chem: 90,    // 1.5h (90 min)
  eng: 60,     // 1.0h (60 min)
  info: 0,
};

export const DEFAULT_PHASE2_TEMPLATE: DayTemplateConfig = {
  sleep: 450,  // 7.5h
  life: 150,   // 2.5h
  school: 0,   // 0h (Holiday)
  math: 240,   // 4.0h
  physics: 180, // 3.0h
  chem: 180,   // 3.0h
  eng: 180,    // 3.0h
  kobun: 30,
  jp: 30,
  info: 0,
};

export const DEFAULT_MACRO_TASKS: MacroTask[] = [];

export const DEFAULT_MILESTONES: Milestone[] = [];

export const DEFAULT_MACRO_PLAN: MacroPlan = {
  title: '志望校合格大計画',
  totalTargetHours: 300,
  completedHours: 0,
  startDate: getTodayDateStr(),
  endDate: new Date(Date.now() + 180 * 86400000).toISOString().split('T')[0],
  examDate: '',
  templates: {
    phase1: DEFAULT_PHASE1_TEMPLATE,
    phase2: DEFAULT_PHASE2_TEMPLATE,
  },
  milestones: [],
  macroTasks: [],
};

export const DEFAULT_USER_PROFILE: UserProfile = {
  name: 'Flora',
  target: '',
  goals: {},
};

export function getTodayDateStr(): string {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function generateDefaultTasksForDate(dateStr: string, isHoliday: boolean = false): TaskItem[] {
  if (isHoliday) {
    return [
      { id: 't_h1', time: '00:00', duration: 450, subject: 'sleep', task: '夜間睡眠', done: false, order: 0 },
      { id: 't_h2', time: '07:30', duration: 60, subject: 'life', task: '起床・朝食・準備', done: false, order: 1 },
      { id: 't_h3', time: '08:30', duration: 180, subject: 'math', task: '数学 演習', done: false, order: 2 },
      { id: 't_h4', time: '11:30', duration: 60, subject: 'life', task: '昼食・休憩', done: false, order: 3 },
      { id: 't_h5', time: '12:30', duration: 180, subject: 'physics', task: '理科 演習', done: false, order: 4 },
      { id: 't_h6', time: '15:30', duration: 180, subject: 'chem', task: '理科 演習', done: false, order: 5 },
      { id: 't_h7', time: '18:30', duration: 60, subject: 'life', task: '夕食・入浴', done: false, order: 6 },
      { id: 't_h8', time: '19:30', duration: 150, subject: 'eng', task: '英語 演習', done: false, order: 7 },
      { id: 't_h9', time: '22:00', duration: 60, subject: 'kobun', task: '復習・暗記', done: false, order: 8 },
      { id: 't_h10', time: '23:00', duration: 60, subject: 'life', task: '明日の計画・就寝準備', done: false, order: 9 },
    ];
  }

  // Weekday School schedule
  return [
    { id: 't_w1', time: '00:00', duration: 420, subject: 'sleep', task: '夜間睡眠', done: false, order: 0 },
    { id: 't_w2', time: '07:00', duration: 60, subject: 'life', task: '起床・朝食・通学準備', done: false, order: 1 },
    { id: 't_w3', time: '08:00', duration: 480, subject: 'school', task: '学校・授業', done: false, order: 2 },
    { id: 't_w4', time: '16:00', duration: 60, subject: 'life', task: '帰宅・軽食', done: false, order: 3 },
    { id: 't_w5', time: '17:00', duration: 120, subject: 'math', task: '数学 演習', done: false, order: 4 },
    { id: 't_w6', time: '19:00', duration: 60, subject: 'life', task: '夕食・入浴', done: false, order: 5 },
    { id: 't_w7', time: '20:00', duration: 90, subject: 'physics', task: '理科 演習', done: false, order: 6 },
    { id: 't_w8', time: '21:30', duration: 90, subject: 'chem', task: '理科 演習', done: false, order: 7 },
    { id: 't_w9', time: '23:00', duration: 60, subject: 'eng', task: '英語 演習', done: false, order: 8 },
  ];
}

const ONBOARDING_KEY = 'studyclock_onboarding_completed';

export function isOnboardingCompleted(): boolean {
  try {
    const val = localStorage.getItem(ONBOARDING_KEY);
    const profile = loadUserProfile();
    return val === 'true' && Boolean(profile.name && profile.name.trim().length > 0 && profile.name !== 'Telemetry Driver');
  } catch {
    return false;
  }
}

export function setOnboardingCompleted(completed: boolean): void {
  try {
    localStorage.setItem(ONBOARDING_KEY, completed ? 'true' : 'false');
  } catch (e) {
    console.error('Failed to set onboarding state', e);
  }
}

export function clearAllDataAndRestartOnboarding(): void {
  try {
    localStorage.clear();
  } catch (e) {
    console.error('Failed to clear storage', e);
  }
}

// Storage helpers
export function loadTasksForDate(dateStr: string): TaskItem[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.DAILY_TASKS_PREFIX + dateStr);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch (e) {
    console.error('Failed to load tasks from localStorage', e);
  }
  const isWeekend = new Date(dateStr).getDay() === 0 || new Date(dateStr).getDay() === 6;
  const defaultTasks = generateDefaultTasksForDate(dateStr, isWeekend);
  saveTasksForDate(dateStr, defaultTasks);
  return defaultTasks;
}

export function saveTasksForDate(dateStr: string, tasks: TaskItem[]): void {
  try {
    localStorage.setItem(STORAGE_KEYS.DAILY_TASKS_PREFIX + dateStr, JSON.stringify(tasks));
  } catch (e) {
    console.error('Failed to save tasks', e);
  }
}

export function loadMacroPlan(): MacroPlan {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.MACRO_PLAN);
    if (raw) {
      const parsed = JSON.parse(raw);
      // Clean legacy mock macroTasks if they match the old seed IDs
      if (Array.isArray(parsed.macroTasks)) {
        parsed.macroTasks = parsed.macroTasks.filter((t: MacroTask) => !t.id?.match(/^m[1-9]$/));
      }
      if (Array.isArray(parsed.milestones)) {
        parsed.milestones = parsed.milestones.filter((m: Milestone) => !m.id?.match(/^mile-[1-3]$/));
      }
      return { ...DEFAULT_MACRO_PLAN, ...parsed };
    }
  } catch (e) {
    console.error('Failed to load macro plan', e);
  }
  return DEFAULT_MACRO_PLAN;
}

export function saveMacroPlan(plan: MacroPlan): void {
  try {
    localStorage.setItem(STORAGE_KEYS.MACRO_PLAN, JSON.stringify(plan));
  } catch (e) {
    console.error('Failed to save macro plan', e);
  }
}

export function loadUserProfile(): UserProfile {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.USER_PROFILE);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (!parsed.name || parsed.name === 'Telemetry Driver' || parsed.name === 'Driver') {
        parsed.name = 'Flora';
      }
      return parsed;
    }
  } catch (e) {
    console.error('Failed to load user profile', e);
  }
  return DEFAULT_USER_PROFILE;
}

export function saveUserProfile(profile: UserProfile): void {
  try {
    localStorage.setItem(STORAGE_KEYS.USER_PROFILE, JSON.stringify(profile));
  } catch (e) {
    console.error('Failed to save user profile', e);
  }
}

export function loadSessionLogs(): StudySessionLog[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.SESSION_LOGS);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        // Strip out any legacy preview seeds
        return parsed.filter((l: StudySessionLog) => !l.id?.startsWith('seed_'));
      }
    }
  } catch (e) {
    console.error('Failed to load session logs', e);
  }
  return [];
}

export function saveSessionLogs(logs: StudySessionLog[]): void {
  try {
    localStorage.setItem(STORAGE_KEYS.SESSION_LOGS, JSON.stringify(logs));
  } catch (e) {
    console.error('Failed to save session logs', e);
  }
}

export function appendSessionLog(log: StudySessionLog): void {
  const current = loadSessionLogs();
  current.unshift(log);
  saveSessionLogs(current);
}

export function exportDataToJSON(): string {
  const allData: Record<string, unknown> = {};
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && key.startsWith('studyclock_')) {
      try {
        allData[key] = JSON.parse(localStorage.getItem(key) || '{}');
      } catch {
        allData[key] = localStorage.getItem(key);
      }
    }
  }
  return JSON.stringify(allData, null, 2);
}

export function importDataFromJSON(jsonStr: string): boolean {
  try {
    const parsed = JSON.parse(jsonStr);
    Object.keys(parsed).forEach((key) => {
      if (typeof parsed[key] === 'object') {
        localStorage.setItem(key, JSON.stringify(parsed[key]));
      } else {
        localStorage.setItem(key, String(parsed[key]));
      }
    });
    return true;
  } catch (e) {
    console.error('Failed to import JSON', e);
    return false;
  }
}

export function exportSessionLogsToCSV(logs: StudySessionLog[]): void {
  const headers = ['日時', '日付', '科目', '学習タスク名', '学習時間(分)', '学習時間(時間)', '集中評価(1-5)', 'メモ'];
  const rows = logs.map((log) => [
    `"${log.timestamp}"`,
    `"${log.dateStr}"`,
    `"${log.subject}"`,
    `"${(log.taskTitle || '').replace(/"/g, '""')}"`,
    log.durationMinutes,
    (log.durationMinutes / 60).toFixed(2),
    log.quality || 5,
    `"${(log.note || '').replace(/"/g, '""')}"`,
  ]);

  const csvContent = '\uFEFF' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `studyclock_logs_${getTodayDateStr()}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export function getMockPaddockDrivers(): PaddockUserStatus[] {
  return [];
}

export function loadTodos(): TodoItem[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.TODOS);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch (e) {
    console.error('Failed to load todos', e);
  }
  return [];
}

export function saveTodos(todos: TodoItem[]): void {
  try {
    localStorage.setItem(STORAGE_KEYS.TODOS, JSON.stringify(todos));
  } catch (e) {
    console.error('Failed to save todos', e);
  }
}
