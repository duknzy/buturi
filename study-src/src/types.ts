export type SubjectKey =
  | 'sleep'
  | 'life'
  | 'school'
  | 'math'
  | 'physics'
  | 'chem'
  | 'eng'
  | 'kobun'
  | 'jp'
  | 'soc'
  | 'info';

export interface SubjectMeta {
  key: SubjectKey;
  name: string;
  color: string;
  bgColor: string;
  textColor: string;
  isStudy: boolean;
  iconName: string;
}

export interface TaskItem {
  id: string;
  time: string; // "HH:MM"
  duration: number; // minutes
  subject: SubjectKey;
  task: string;
  done: boolean;
  order: number;
  quality?: number; // 1-5
  note?: string;
}

export interface MacroTask {
  id: string;
  subject: SubjectKey;
  category: string;
  goal: string;
  done: boolean;
  targetDate?: string;
}

export interface Milestone {
  id: string;
  title: string;
  date: string; // "YYYY-MM-DD"
  content: string;
  done: boolean;
  subject?: SubjectKey;
}

export interface DayTemplateConfig {
  sleep: number;
  life: number;
  school: number;
  math: number;
  physics: number;
  chem: number;
  eng: number;
  kobun?: number;
  jp?: number;
  soc?: number;
  info: number;
}

export interface MacroPlan {
  title: string;
  totalTargetHours: number;
  completedHours: number;
  startDate: string;
  endDate: string;
  examDate?: string;
  templates: {
    phase1: DayTemplateConfig; // Weekday (School day)
    phase2: DayTemplateConfig; // Weekend / Holiday
  };
  milestones: Milestone[];
  macroTasks: MacroTask[];
}

export interface UserProfile {
  name: string;
  target: string;
  goals: {
    math?: string;
    physics?: string;
    chem?: string;
    eng?: string;
    other?: string;
  };
}

export interface StudySessionLog {
  id: string;
  timestamp: string; // ISO
  dateStr: string; // YYYY-MM-DD
  subject: SubjectKey;
  taskTitle: string;
  durationMinutes: number;
  quality: number; // 1 to 5
  note: string;
}

export interface PaddockUserStatus {
  id: string;
  name: string;
  date: string;
  progress: number; // 0-100%
  remainingHours: number;
  currentSubject?: string;
  updatedAt: number;
}

export type ViewTab = 'cockpit' | 'analysis' | 'garage';
export type AmbientSoundType = 'none' | 'rain' | 'fire' | 'white';
export type DailyScheduleTemplate = 'phase1' | 'phase2';

export type TodoPriority = 'high' | 'medium' | 'low';

export interface TodoItem {
  id: string;
  text: string;
  done: boolean;
  priority: TodoPriority;
  subject?: SubjectKey;
  tag?: string; // e.g. '数学', '生活', 'その他'
  createdAt: string; // ISO timestamp
  dueDate?: string; // YYYY-MM-DD
  estimatedMinutes?: number;
}

