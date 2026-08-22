import React, { useState } from 'react';
import { ViewTab, AmbientSoundType, UserProfile, MacroPlan } from '../types';
import { audioSynth } from '../services/audio';
import {
  Activity,
  BarChart3,
  Flame,
  Maximize2,
  Sliders,
  User,
  Volume2,
  VolumeX,
  CloudRain,
  Radio,
  Target,
  Sparkles,
} from 'lucide-react';

interface GlobalNavProps {
  currentTab: ViewTab;
  onTabChange: (tab: ViewTab) => void;
  onOpenDeskMode: () => void;
  onOpenProfile: () => void;
  userProfile: UserProfile;
  macroPlan: MacroPlan;
  currentTime?: Date;
}

export const GlobalNav: React.FC<GlobalNavProps> = ({
  currentTab,
  onTabChange,
  onOpenDeskMode,
  onOpenProfile,
  userProfile,
  macroPlan,
  currentTime = new Date(),
}) => {
  const [ambientSound, setAmbientSound] = useState<AmbientSoundType>('none');
  const [volume, setVolume] = useState<number>(0.5);
  const [showAudioMenu, setShowAudioMenu] = useState<boolean>(false);

  const handleSoundSelect = (type: AmbientSoundType) => {
    if (ambientSound === type) {
      audioSynth.stopAmbient();
      setAmbientSound('none');
    } else {
      audioSynth.playAmbient(type);
      setAmbientSound(type);
    }
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    setVolume(val);
    audioSynth.setVolume(val);
  };

  // Calculate days remaining to exam
  const getExamCountdown = () => {
    if (!macroPlan.examDate) return null;
    const target = new Date(macroPlan.examDate).getTime();
    const today = new Date().getTime();
    const diffDays = Math.ceil((target - today) / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const examDays = getExamCountdown();

  const pad = (n: number) => n.toString().padStart(2, '0');
  const timeStr = `${pad(currentTime.getHours())}:${pad(currentTime.getMinutes())}:${pad(currentTime.getSeconds())}`;
  const driverDisplayName = userProfile.name?.trim() ? userProfile.name.trim() : 'Flora';

  return (
    <header className="sticky top-0 z-40 w-full bg-[#0f172a]/95 border-b border-slate-800 backdrop-blur-md text-slate-300 px-3 sm:px-6 py-2.5 transition-all">
      <div className="max-w-[1720px] mx-auto flex flex-col lg:flex-row items-center justify-between gap-3">
        {/* Brand & Driver info */}
        <div className="flex items-center justify-between w-full lg:w-auto gap-4 flex-shrink-0">
          <div className="flex items-center gap-3.5 flex-shrink-0">
            <div className="flex items-center gap-2 flex-shrink-0">
              <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.7)] flex-shrink-0" />
              <h1 className="font-black text-sm sm:text-base tracking-wider text-blue-400 font-mono whitespace-nowrap">
                Flora
              </h1>
            </div>
            
            <div className="hidden sm:block h-4 w-[1px] bg-slate-800 flex-shrink-0" />
            
            <div className="hidden sm:flex items-center text-xs font-bold text-slate-400 uppercase tracking-tight whitespace-nowrap flex-shrink-0 gap-1.5">
              <span className="text-slate-500">DRIVER:</span>
              <button 
                onClick={onOpenProfile}
                className="text-slate-100 hover:text-blue-400 transition-colors font-mono font-bold"
              >
                {driverDisplayName.toUpperCase().replace(/\s+/g, '_')}
              </button>
              {userProfile.target && (
                <>
                  <span className="text-slate-600">|</span>
                  <span className="text-slate-500">TARGET:</span>
                  <span className="text-blue-400 font-mono max-w-[160px] xl:max-w-[280px] truncate" title={userProfile.target}>
                    {userProfile.target}
                  </span>
                </>
              )}
            </div>
          </div>

          {/* Mobile quick icons */}
          <div className="flex items-center gap-1.5 lg:hidden flex-shrink-0">
            <button
              onClick={onOpenDeskMode}
              title="DESK_MODE (F)"
              className="px-2.5 py-1 bg-blue-600 rounded text-xs font-bold text-white uppercase tracking-wider font-mono whitespace-nowrap"
            >
              DESK_MODE
            </button>
            <button
              onClick={onOpenProfile}
              className="p-1.5 rounded bg-slate-900 border border-slate-700 text-slate-300"
            >
              <User className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Tab Navigation Hub */}
        <nav className="flex items-center gap-1.5 p-1 bg-slate-900/90 rounded-lg border border-slate-800 shadow-inner w-full sm:w-auto justify-center flex-shrink-0">
          <button
            onClick={() => {
              audioSynth.playTick();
              onTabChange('cockpit');
            }}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-md text-xs font-bold tracking-wider uppercase font-mono transition-all whitespace-nowrap cursor-pointer ${
              currentTab === 'cockpit'
                ? 'bg-blue-600 text-white shadow-sm shadow-blue-500/30'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <Activity className="w-3.5 h-3.5" />
            <span>COCKPIT</span>
          </button>

          <button
            onClick={() => {
              audioSynth.playTick();
              onTabChange('analysis');
            }}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-md text-xs font-bold tracking-wider uppercase font-mono transition-all whitespace-nowrap cursor-pointer ${
              currentTab === 'analysis'
                ? 'bg-blue-600 text-white shadow-sm shadow-blue-500/30'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <BarChart3 className="w-3.5 h-3.5" />
            <span>ANALYSIS</span>
          </button>

          <button
            onClick={() => {
              audioSynth.playTick();
              onTabChange('garage');
            }}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-md text-xs font-bold tracking-wider uppercase font-mono transition-all whitespace-nowrap cursor-pointer ${
              currentTab === 'garage'
                ? 'bg-blue-600 text-white shadow-sm shadow-blue-500/30'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <Sliders className="w-3.5 h-3.5" />
            <span>GARAGE_24H</span>
          </button>
        </nav>

        {/* Right Tools HUD: SYSTEM_TIME, Exam, Ambient BGM, Desk Mode */}
        <div className="hidden lg:flex items-center gap-2.5 flex-shrink-0">
          {/* Live System Time */}
          <div className="flex items-center gap-1.5 bg-slate-900 px-3 py-1.5 rounded-md border border-slate-700 text-xs whitespace-nowrap flex-shrink-0">
            <span className="font-bold text-slate-500 uppercase font-mono">SYSTEM_TIME:</span>
            <span className="font-mono text-xs font-bold text-blue-400 tracking-wider">{timeStr}</span>
          </div>

          {/* Exam Countdown */}
          {examDays !== null && (
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-red-950/40 border border-red-900/60 text-red-300 text-xs font-mono font-bold whitespace-nowrap flex-shrink-0">
              <Target className="w-3.5 h-3.5 text-red-400" />
              <span>EXAM:</span>
              <span className="text-red-400">{examDays}D</span>
            </div>
          )}

          {/* Ambient BGM Button & Popover */}
          <div className="relative flex-shrink-0">
            <button
              onClick={() => setShowAudioMenu(!showAudioMenu)}
              className={`px-2.5 py-1.5 rounded-md border text-xs font-bold font-mono transition-all uppercase tracking-wider flex items-center gap-1.5 whitespace-nowrap ${
                ambientSound !== 'none'
                  ? 'bg-amber-950/60 border-amber-500/60 text-amber-400 animate-pulse'
                  : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-slate-200'
              }`}
              title="集中BGM (雨音 / 焚き火 / ホワイトノイズ)"
            >
              <span>
                BGM: {ambientSound === 'none' ? 'OFF' : ambientSound.toUpperCase()}
              </span>
            </button>

            {showAudioMenu && (
              <div className="absolute right-0 mt-2 w-60 p-3.5 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl z-50 animate-fade-in text-xs space-y-3">
                <div className="flex items-center justify-between border-b border-slate-800 pb-2 font-semibold text-slate-200">
                  <span className="flex items-center gap-1.5 text-xs font-mono uppercase text-blue-400 font-bold">
                    <Sparkles className="w-4 h-4 text-blue-400" /> Web Audio Telemetry
                  </span>
                  <button
                    onClick={() => {
                      audioSynth.playChime();
                    }}
                    className="text-[11px] text-blue-400 hover:underline font-mono font-bold"
                  >
                    TEST_CHIME
                  </button>
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <button
                    onClick={() => handleSoundSelect('rain')}
                    className={`p-2.5 rounded-lg flex flex-col items-center gap-1.5 border text-xs font-mono font-bold uppercase transition-all ${
                      ambientSound === 'rain'
                        ? 'bg-blue-950 border-blue-400 text-blue-300'
                        : 'bg-slate-800/60 border-slate-700 hover:bg-slate-800 text-slate-300'
                    }`}
                  >
                    <CloudRain className="w-4 h-4 text-blue-400" />
                    <span>RAIN</span>
                  </button>

                  <button
                    onClick={() => handleSoundSelect('fire')}
                    className={`p-2.5 rounded-lg flex flex-col items-center gap-1.5 border text-xs font-mono font-bold uppercase transition-all ${
                      ambientSound === 'fire'
                        ? 'bg-orange-950 border-orange-400 text-orange-300'
                        : 'bg-slate-800/60 border-slate-700 hover:bg-slate-800 text-slate-300'
                    }`}
                  >
                    <Flame className="w-4 h-4 text-orange-400" />
                    <span>FIRE</span>
                  </button>

                  <button
                    onClick={() => handleSoundSelect('white')}
                    className={`p-2.5 rounded-lg flex flex-col items-center gap-1.5 border text-xs font-mono font-bold uppercase transition-all ${
                      ambientSound === 'white'
                        ? 'bg-purple-950 border-purple-400 text-purple-300'
                        : 'bg-slate-800/60 border-slate-700 hover:bg-slate-800 text-slate-300'
                    }`}
                  >
                    <Radio className="w-4 h-4 text-purple-400" />
                    <span>WHITE</span>
                  </button>
                </div>

                {ambientSound !== 'none' && (
                  <div className="pt-2 border-t border-slate-800 space-y-1.5">
                    <div className="flex justify-between text-xs text-slate-400 font-mono">
                      <span>VOLUME</span>
                      <span>{Math.round(volume * 100)}%</span>
                    </div>
                    <input
                      type="range"
                      min="0.05"
                      max="1"
                      step="0.05"
                      value={volume}
                      onChange={handleVolumeChange}
                      className="w-full accent-blue-500 h-1.5 bg-slate-700 rounded cursor-pointer"
                    />
                  </div>
                )}
              </div>
            )}
          </div>

          {/* DESK_MODE button */}
          <button
            onClick={onOpenDeskMode}
            className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 rounded-md text-xs font-bold text-white uppercase tracking-wider font-mono shadow-sm transition-all flex items-center gap-1.5 whitespace-nowrap flex-shrink-0"
            title="Desk Fullscreen Telemetry (F)"
          >
            <Maximize2 className="w-3.5 h-3.5" />
            <span>DESK_MODE</span>
          </button>

          {/* Driver profile chip */}
          <button
            onClick={onOpenProfile}
            className="px-2.5 py-1.5 bg-slate-900 border border-slate-700 hover:border-slate-600 rounded-md text-xs font-bold font-mono text-slate-300 flex items-center gap-1.5 transition-all whitespace-nowrap flex-shrink-0"
            title="Driver Profile Calibration"
          >
            <div className="w-4 h-4 rounded bg-blue-500/20 text-blue-400 flex items-center justify-center text-[10px] font-bold">
              {driverDisplayName.charAt(0).toUpperCase()}
            </div>
            <span className="max-w-[80px] truncate">{driverDisplayName}</span>
          </button>
        </div>
      </div>
    </header>
  );
};
