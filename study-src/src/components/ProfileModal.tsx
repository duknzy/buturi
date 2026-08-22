import React, { useState } from 'react';
import { UserProfile } from '../types';
import { User, Target, Save, X } from 'lucide-react';
import { audioSynth } from '../services/audio';

interface ProfileModalProps {
  userProfile: UserProfile;
  onSaveProfile: (profile: UserProfile) => void;
  onClose: () => void;
  onRelaunchOnboarding?: () => void;
}

export const ProfileModal: React.FC<ProfileModalProps> = ({
  userProfile,
  onSaveProfile,
  onClose,
  onRelaunchOnboarding,
}) => {
  const [name, setName] = useState<string>(userProfile.name);
  const [target, setTarget] = useState<string>(userProfile.target);
  const [mathGoal, setMathGoal] = useState<string>(userProfile.goals?.math || '');
  const [physGoal, setPhysGoal] = useState<string>(userProfile.goals?.physics || '');
  const [chemGoal, setChemGoal] = useState<string>(userProfile.goals?.chem || '');
  const [engGoal, setEngGoal] = useState<string>(userProfile.goals?.eng || '');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveProfile({
      name: name.trim() || 'Driver',
      target: target.trim(),
      goals: {
        math: mathGoal.trim(),
        physics: physGoal.trim(),
        chem: chemGoal.trim(),
        eng: engGoal.trim(),
      },
    });
    audioSynth.playTick();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in font-mono">
      <div className="bg-slate-900 border border-slate-700 rounded-xl p-4 sm:p-5 w-full max-w-lg shadow-2xl space-y-3 text-slate-200">
        <div className="flex items-center justify-between border-b border-slate-800 pb-2">
          <h3 className="font-bold text-xs uppercase tracking-wider text-blue-400 flex items-center gap-1.5 font-mono">
            <User className="w-4 h-4" /> DRIVER_PROFILE // TARGET_CONFIGURATION
          </h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-200">
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3 text-xs">
          <div>
            <label className="text-slate-400 block mb-1 text-[10px] uppercase font-bold">DRIVER_NAME / CALLSIGN</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="例: Koki / 佐藤"
              required
              className="w-full bg-slate-950 border border-slate-700 rounded p-1.5 text-slate-200 font-sans text-xs"
            />
          </div>

          <div>
            <label className="text-slate-400 block mb-1 text-[10px] uppercase font-bold">TARGET_UNIVERSITY / MISSION_GOAL</label>
            <input
              type="text"
              value={target}
              onChange={(e) => setTarget(e.target.value)}
              placeholder="例: 東京大学 理科一類 現役合格"
              required
              className="w-full bg-slate-950 border border-slate-700 rounded p-1.5 text-slate-200 font-sans text-xs"
            />
          </div>

          <div className="space-y-1.5 border-t border-slate-800 pt-2.5">
            <span className="text-slate-400 text-[10px] uppercase font-bold flex items-center gap-1">
              <Target className="w-3 h-3 text-blue-400" /> SUBJECT_MILESTONE_TARGETS
            </span>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <div>
                <label className="text-blue-400 block mb-0.5 text-[10px] uppercase font-bold">MATH</label>
                <input
                  type="text"
                  value={mathGoal}
                  onChange={(e) => setMathGoal(e.target.value)}
                  placeholder="例: 青チャート数III完答"
                  className="w-full bg-slate-950 border border-slate-700 rounded p-1.5 text-slate-200 font-sans text-xs"
                />
              </div>

              <div>
                <label className="text-orange-400 block mb-0.5 text-[10px] uppercase font-bold">PHYSICS</label>
                <input
                  type="text"
                  value={physGoal}
                  onChange={(e) => setPhysGoal(e.target.value)}
                  placeholder="例: 名問の森 2周"
                  className="w-full bg-slate-950 border border-slate-700 rounded p-1.5 text-slate-200 font-sans text-xs"
                />
              </div>

              <div>
                <label className="text-emerald-400 block mb-0.5 text-[10px] uppercase font-bold">CHEMISTRY</label>
                <input
                  type="text"
                  value={chemGoal}
                  onChange={(e) => setChemGoal(e.target.value)}
                  placeholder="例: 重問 A/B完全制覇"
                  className="w-full bg-slate-950 border border-slate-700 rounded p-1.5 text-slate-200 font-sans text-xs"
                />
              </div>

              <div>
                <label className="text-purple-400 block mb-0.5 text-[10px] uppercase font-bold">ENGLISH</label>
                <input
                  type="text"
                  value={engGoal}
                  onChange={(e) => setEngGoal(e.target.value)}
                  placeholder="例: 鉄壁完全暗記"
                  className="w-full bg-slate-950 border border-slate-700 rounded p-1.5 text-slate-200 font-sans text-xs"
                />
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between pt-2 border-t border-slate-800">
            {onRelaunchOnboarding ? (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onRelaunchOnboarding();
                }}
                className="px-2 py-1 rounded bg-slate-950 hover:bg-slate-800 text-blue-400 text-[10px] font-bold border border-slate-800"
              >
                ⚙️ 初期設定ウィザードを開く
              </button>
            ) : <div />}

            <div className="flex gap-1.5">
              <button
                type="button"
                onClick={onClose}
                className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-[10px] uppercase font-bold"
              >
                CANCEL
              </button>
              <button
                type="submit"
                className="px-3 py-1 rounded bg-blue-600 hover:bg-blue-500 font-bold text-white text-[10px] uppercase shadow-sm flex items-center gap-1"
              >
                <Save className="w-3 h-3" />
                <span>SAVE_PROFILE</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
