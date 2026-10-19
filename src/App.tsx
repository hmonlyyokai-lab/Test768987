import React, { useState } from 'react';
import { AppTab } from './types';
import { FireworksCanvas } from './components/FireworksCanvas';
import { StarMaker } from './components/StarMaker';
import { Navigation } from './components/Navigation';

export default function App() {
  const [currentTab, setCurrentTab] = useState<AppTab>('fireworks');

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-gradient-to-b from-[#FFF5F8] via-[#FFEBF2] to-[#FFD6E5] flex flex-col font-quicksand select-none">
      {/* Active Tab Screen */}
      <main className="relative flex-1 w-full h-full overflow-hidden">
        {currentTab === 'fireworks' ? (
          <FireworksCanvas />
        ) : (
          <StarMaker />
        )}
      </main>

      {/* Bottom Navigation for the two requested features with Angela pastel theme */}
      <Navigation currentTab={currentTab} onSelectTab={setCurrentTab} />
    </div>
  );
}
