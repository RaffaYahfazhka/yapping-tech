import React, { useEffect } from 'react';
import { VirtualOfficeCanvas } from './components/canvas3d/VirtualOfficeCanvas';
import { HeaderBar } from './components/hud/HeaderBar';
import { CommandDock } from './components/task/CommandDock';
import { TerminalDrawer } from './components/modals/TerminalDrawer';
import { ArtifactDrawer } from './components/modals/ArtifactDrawer';
import { KanbanDrawer } from './components/modals/KanbanDrawer';
import { useAgentStore } from './store/useAgentStore';
import { Volume2 } from 'lucide-react';

export const App: React.FC = () => {
  const initAudio = useAgentStore((state) => state.initAudio);
  const audioSettings = useAgentStore((state) => state.audioSettings);
  const toggleBGM = useAgentStore((state) => state.toggleBGM);

  // Initialize Web Audio on first user interaction anywhere
  useEffect(() => {
    const handleFirstGesture = () => {
      initAudio();
      window.removeEventListener('click', handleFirstGesture);
      window.removeEventListener('keydown', handleFirstGesture);
    };

    window.addEventListener('click', handleFirstGesture);
    window.addEventListener('keydown', handleFirstGesture);

    return () => {
      window.removeEventListener('click', handleFirstGesture);
      window.removeEventListener('keydown', handleFirstGesture);
    };
  }, [initAudio]);

  return (
    <main className="relative h-screen w-screen overflow-hidden bg-[#060810] text-slate-100 flex flex-col">
      {/* Top Header Bar */}
      <HeaderBar />

      {/* 3D Isometric AI Virtual Office Canvas */}
      <div className="relative flex-1 w-full h-full">
        <VirtualOfficeCanvas />

        {/* Ambient Web Audio Hint Toast (fades once unlocked or music started) */}
        {!audioSettings.isPlaying && (
          <div className="absolute top-4 left-6 z-20 hidden md:flex items-center gap-2.5 rounded-xl border border-slate-800/80 bg-slate-950/70 px-3.5 py-2 backdrop-blur-md shadow-lg pointer-events-auto">
            <Volume2 className="h-4 w-4 text-cyan-400" />
            <span className="text-xs font-mono text-slate-300">
              Procedural Ambient Synthwave Ready
            </span>
            <button
              onClick={() => {
                initAudio();
                toggleBGM();
              }}
              className="ml-2 rounded-lg bg-cyan-500/20 px-2 py-0.5 text-[11px] font-mono font-semibold text-cyan-300 border border-cyan-500/40 hover:bg-cyan-500/30 transition-colors"
            >
              Start BGM
            </button>
          </div>
        )}

        {/* Bottom Task Command Dock */}
        <CommandDock />
      </div>

      {/* Slide-over Drawers */}
      <TerminalDrawer />
      <ArtifactDrawer />
      <KanbanDrawer />
    </main>
  );
};

export default App;
