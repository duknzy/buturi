import { SubjectKey, SubjectMeta } from '../types';

export const SUBJECT_METAS: Record<SubjectKey, SubjectMeta> = {
  sleep: {
    key: 'sleep',
    name: '睡眠・冷却',
    color: '#64748b', // slate
    bgColor: 'bg-slate-100 dark:bg-slate-800',
    textColor: 'text-slate-600 dark:text-slate-300',
    isStudy: false,
    iconName: 'Moon',
  },
  life: {
    key: 'life',
    name: '生活・ピット',
    color: '#94a3b8',
    bgColor: 'bg-zinc-100 dark:bg-zinc-800',
    textColor: 'text-zinc-600 dark:text-zinc-300',
    isStudy: false,
    iconName: 'Coffee',
  },
  school: {
    key: 'school',
    name: '学校・移動',
    color: '#cbd5e1',
    bgColor: 'bg-gray-100 dark:bg-gray-800',
    textColor: 'text-gray-600 dark:text-gray-300',
    isStudy: false,
    iconName: 'GraduationCap',
  },
  math: {
    key: 'math',
    name: '数学',
    color: '#3b82f6', // blue
    bgColor: 'bg-blue-50 dark:bg-blue-950/50',
    textColor: 'text-blue-600 dark:text-blue-400',
    isStudy: true,
    iconName: 'Calculator',
  },
  physics: {
    key: 'physics',
    name: '物理',
    color: '#f97316', // orange
    bgColor: 'bg-orange-50 dark:bg-orange-950/50',
    textColor: 'text-orange-600 dark:text-orange-400',
    isStudy: true,
    iconName: 'Atom',
  },
  chem: {
    key: 'chem',
    name: '化学',
    color: '#10b981', // emerald
    bgColor: 'bg-emerald-50 dark:bg-emerald-950/50',
    textColor: 'text-emerald-600 dark:text-emerald-400',
    isStudy: true,
    iconName: 'FlaskConical',
  },
  eng: {
    key: 'eng',
    name: '英語',
    color: '#a855f7', // purple
    bgColor: 'bg-purple-50 dark:bg-purple-950/50',
    textColor: 'text-purple-600 dark:text-purple-400',
    isStudy: true,
    iconName: 'Languages',
  },
  kobun: {
    key: 'kobun',
    name: '古文・漢文',
    color: '#e11d48', // rose
    bgColor: 'bg-rose-50 dark:bg-rose-950/50',
    textColor: 'text-rose-600 dark:text-rose-400',
    isStudy: true,
    iconName: 'Feather',
  },
  jp: {
    key: 'jp',
    name: '現代文',
    color: '#db2777', // pink
    bgColor: 'bg-pink-50 dark:bg-pink-950/50',
    textColor: 'text-pink-600 dark:text-pink-400',
    isStudy: true,
    iconName: 'BookOpen',
  },
  soc: {
    key: 'soc',
    name: '地歴・公民',
    color: '#eab308', // amber
    bgColor: 'bg-amber-50 dark:bg-amber-950/50',
    textColor: 'text-amber-600 dark:text-amber-400',
    isStudy: true,
    iconName: 'Globe',
  },
  info: {
    key: 'info',
    name: '自由枠・その他',
    color: '#edeaf2', // light violet
    bgColor: 'bg-indigo-50 dark:bg-indigo-950/50',
    textColor: 'text-indigo-600 dark:text-indigo-400',
    isStudy: false,
    iconName: 'Sparkles',
  },
};

export const STUDY_SUBJECT_KEYS: SubjectKey[] = [
  'math',
  'physics',
  'chem',
  'eng',
  'kobun',
  'jp',
  'soc',
];
