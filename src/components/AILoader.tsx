import React, { useState, useEffect } from 'react';

interface AILoaderProps {
  isVisible: boolean;
}

// Define all loaders with their titles and CSS at module level (removed asteroids loader)
const loaders = [
  {
    title: "Hold on our Agents are playing Tetris",
    css: `
      .active-loader {
        width: 45px;
        height: 30px;
        background:
          linear-gradient(#004ce4 0 0) 0 100%/100% 50%,
          linear-gradient(#004ce4 0 0) 0 0/calc(100%/3) 100%;
        background-repeat: no-repeat;
        position: relative;
        clip-path: inset(-100% 0 0 0);
        animation: l2-0 2s infinite steps(4);
      }
      .active-loader::before,
      .active-loader::after {
        content: "";
        position: absolute;
        inset: -50% 0 50%;
        background:
          linear-gradient(#00e622 0 0) 0 0/calc(2*100%/3) 50%,
          linear-gradient(#00e622 0 0) 100% 100%/calc(2*100%/3) 50%;
        background-repeat: no-repeat;
        animation: inherit;
        animation-name: l2-1;
      }
      .active-loader::after {
        inset: -100% 0 100%;
        background:
          linear-gradient(#e50021 0 0) 0 0/100% 50%,
          linear-gradient(#e50021 0 0) 100% 0/calc(100%/3) 100%;
        background-repeat: no-repeat; 
        animation-name: l2-2;
      }
      @keyframes l2-0{
        0% { transform: translateY(-250%); clip-path: inset(100% 0 0 0) }
        25%, 100% { transform: translateY(0); clip-path: inset(-100% 0 0 0) }
      }
      @keyframes l2-1{
        0%, 25% { transform: translateY(-250%) }
        50%, 100% { transform: translateY(0) }
      }
      @keyframes l2-2{
        0%, 50% { transform: translateY(-250%) }
        75%, 100% { transform: translateY(0) }
      }
    `
  },
  {
    title: "Our Agents are playing Ping Pong wait a sec",
    css: `
      .active-loader {
        width: 80px;
        height: 70px;
        border: 5px solid #000;
        padding: 0 8px;
        box-sizing: border-box;
        background:
          linear-gradient(#fff 0 0) 0 0/8px 20px,
          linear-gradient(#fff 0 0) 100% 0/8px 20px,
          radial-gradient(farthest-side, #fff 90%, #0000) 0 5px/8px 8px content-box,
          #000;
        background-repeat: no-repeat; 
        animation: l3 2s infinite linear;
      }
      .dark .active-loader {
        border-color: #fff;
        background:
          linear-gradient(#000 0 0) 0 0/8px 20px,
          linear-gradient(#000 0 0) 100% 0/8px 20px,
          radial-gradient(farthest-side, #000 90%, #0000) 0 5px/8px 8px content-box,
          #fff;
      }
      @keyframes l3{
        25% { background-position: 0 0, 100% 100%, 100% calc(100% - 5px) }
        50% { background-position: 0 100%, 100% 100%, 0 calc(100% - 5px) }
        75% { background-position: 0 100%, 100% 0, 100% 5px }
      }
    `
  },
  {
    title: "Our Agents are on Level 255 in Pacman so u gotta wait lil",
    css: `
      .active-loader {
        width: 90px;
        height: 24px;
        padding: 2px 0;
        box-sizing: border-box;
        display: flex;
        animation: l5-0 3s infinite steps(6);
        background:
          linear-gradient(#000 0 0) 0 0/0% 100% no-repeat,
          radial-gradient(circle 3px, #eeee89 90%, #0000) 0 0/20% 100%
          #000;
        overflow: hidden;
      }
      .dark .active-loader {
        background:
          linear-gradient(#fff 0 0) 0 0/0% 100% no-repeat,
          radial-gradient(circle 3px, #eeee89 90%, #0000) 0 0/20% 100%
          #fff;
      }
      .active-loader::before {
        content: "";
        width: 20px;
        transform: translate(-100%);
        border-radius: 50%;
        background: #ffff2d;
        animation: 
          l5-1 .25s .153s infinite steps(5) alternate,
          l5-2 3s infinite linear;
      }
      @keyframes l5-1{ 
        0% { clip-path: polygon(50% 50%, 100% 0, 100% 0, 0 0, 0 100%, 100% 100%, 100% 100%) }
        100% { clip-path: polygon(50% 50%, 100% 65%, 100% 0, 0 0, 0 100%, 100% 100%, 100% 35%) }
      }
      @keyframes l5-2{ 
        100% { transform: translate(90px) }
      }
      @keyframes l5-0{ 
        100% { background-size: 120% 100%, 20% 100% }
      }
    `
  },
  {
    title: "Our agents are smashing records on geometry dash u can wait",
    css: `
      .active-loader {
        width: 70px;
        height: 50px;
        box-sizing: border-box;
        background:
          conic-gradient(from 135deg at top, #0000, #fff 1deg 90deg, #0000 91deg) right -20px bottom 8px/18px 9px,
          linear-gradient(#fff 0 0) bottom/100% 8px,
          #000;
        background-repeat: no-repeat;
        border-bottom: 8px solid #000;
        position: relative;
        animation: l7-0 2s infinite linear;
      }
      .dark .active-loader {
        background:
          conic-gradient(from 135deg at top, #0000, #000 1deg 90deg, #0000 91deg) right -20px bottom 8px/18px 9px,
          linear-gradient(#000 0 0) bottom/100% 8px,
          #fff;
        border-bottom-color: #fff;
      }
      .active-loader::before {
        content: "";
        position: absolute;
        width: 10px;
        height: 14px;
        background: lightblue;
        left: 10px;
        animation: l7-1 2s infinite cubic-bezier(0, 200, 1, 200);
      }
      @keyframes l7-0{
        100% { background-position: left -20px bottom 8px, bottom }
      }
      @keyframes l7-1{
        0%, 50% { bottom: 8px }
        90%, 100% { bottom: 8.1px }
      }
    `
  },
  {
    title: "Our Agents are saving princess peach can u wait",
    css: `
      .active-loader {
        width: fit-content;
        font-size: 17px;
        font-family: monospace;
        line-height: 1.4;
        font-weight: bold;
        padding: 30px 2px 50px;
        background: linear-gradient(#000 0 0) 0 0/100% 100% content-box padding-box no-repeat; 
        position: relative;
        overflow: hidden;
        animation: l10-0 2s infinite cubic-bezier(1, 175, .5, 175);
        color: #000;
      }
      .dark .active-loader {
        background: linear-gradient(#fff 0 0) 0 0/100% 100% content-box padding-box no-repeat;
        color: #fff;
      }
      .active-loader::before {
        content: "Loading";
        display: inline-block;
        animation: l10-2 2s infinite;
      }
      .active-loader::after {
        content: "";
        position: absolute;
        width: 34px;
        height: 28px;
        top: 110%;
        left: calc(50% - 16px);
        background:
          linear-gradient(90deg, #0000 12px, #f92033 0 22px, #0000 0 26px, #fdc98d 0 32px, #0000) bottom 26px left 50%,
          linear-gradient(90deg, #0000 10px, #f92033 0 28px, #fdc98d 0 32px, #0000 0) bottom 24px left 50%,
          linear-gradient(90deg, #0000 10px, #643700 0 16px, #fdc98d 0 20px, #000 0 22px, #fdc98d 0 24px, #000 0 26px, #f92033 0 32px, #0000 0) bottom 22px left 50%,
          linear-gradient(90deg, #0000 8px, #643700 0 10px, #fdc98d 0 12px, #643700 0 14px, #fdc98d 0 20px, #000 0 22px, #fdc98d 0 28px, #f92033 0 32px, #0000 0) bottom 20px left 50%,
          linear-gradient(90deg, #0000 8px, #643700 0 10px, #fdc98d 0 12px, #643700 0 16px, #fdc98d 0 22px, #000 0 24px, #fdc98d 0 30px, #f92033 0 32px, #0000 0) bottom 18px left 50%,
          linear-gradient(90deg, #0000 8px, #643700 0 12px, #fdc98d 0 20px, #000 0 28px, #f92033 0 30px, #0000 0) bottom 16px left 50%,
          linear-gradient(90deg, #0000 12px, #fdc98d 0 26px, #f92033 0 30px, #0000 0) bottom 14px left 50%,
          linear-gradient(90deg, #fdc98d 6px, #f92033 0 14px, #222a87 0 16px, #f92033 0 22px, #222a87 0 24px, #f92033 0 28px, #0000 0 32px, #643700 0) bottom 12px left 50%,
          linear-gradient(90deg, #fdc98d 6px, #f92033 0 16px, #222a87 0 18px, #f92033 0 24px, #f92033 0 26px, #0000 0 30px, #643700 0) bottom 10px left 50%,
          linear-gradient(90deg, #0000 10px, #f92033 0 16px, #222a87 0 24px, #feee49 0 26px, #222a87 0 30px, #643700 0) bottom 8px left 50%,
          linear-gradient(90deg, #0000 12px, #222a87 0 18px, #feee49 0 20px, #222a87 0 30px, #643700 0) bottom 6px left 50%,
          linear-gradient(90deg, #0000 8px, #643700 0 12px, #222a87 0 30px, #643700 0) bottom 4px left 50%,
          linear-gradient(90deg, #0000 6px, #643700 0 14px, #222a87 0 26px, #0000 0) bottom 2px left 50%,
          linear-gradient(90deg, #0000 6px, #643700 0 10px, #0000 0) bottom 0px left 50%;
        background-size: 34px 2px;
        background-repeat: no-repeat;
        animation: inherit;
        animation-name: l10-1;
      }
      @keyframes l10-0{
        0%, 30% { background-position: 0 0px }
        50%, 100% { background-position: 0 -0.1px }
      }
      @keyframes l10-1{
        50%, 100% { top: 109.5% }
      }
      @keyframes l10-2{
        0%, 30% { transform: translateY(0) }
        80%, 100% { transform: translateY(-260%) }
      }
    `
  }
];

const AILoader: React.FC<AILoaderProps> = ({ isVisible }) => {
  const [selectedLoader, setSelectedLoader] = useState<number | null>(null);
  const [lastUsedLoader, setLastUsedLoader] = useState<number>(-1);
  const [startTime, setStartTime] = useState<number | null>(null);
  const [canHide, setCanHide] = useState(false);

  // Only select a loader when component becomes visible
  useEffect(() => {
    if (isVisible && selectedLoader === null) {
      // Pick a random loader that's different from the last one
      let newLoader;
      do {
        newLoader = Math.floor(Math.random() * loaders.length);
      } while (newLoader === lastUsedLoader && loaders.length > 1);
      
      setSelectedLoader(newLoader);
      setLastUsedLoader(newLoader);
      setStartTime(Date.now());
      setCanHide(false);

      // Set minimum 5-second timer
      const timer = setTimeout(() => {
        setCanHide(true);
      }, 5000);

      return () => clearTimeout(timer);
    } else if (!isVisible) {
      // Reset when hidden
      setSelectedLoader(null);
      setStartTime(null);
      setCanHide(false);
    }
  }, [isVisible, selectedLoader, lastUsedLoader]);

  // Don't hide until both conditions are met: not visible AND minimum time has passed
  if (!isVisible && canHide) return null;
  if (!isVisible && !canHide && startTime) {
    // Still show loader until minimum time is reached
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center backdrop-blur-md bg-black/60 dark:bg-white/10">
        <div className="bg-white dark:bg-black border border-gray-200 dark:border-gray-800 rounded-2xl shadow-2xl p-6 sm:p-8 max-w-sm mx-4 text-center">
          <style dangerouslySetInnerHTML={{ __html: selectedLoader !== null ? loaders[selectedLoader].css : '' }} />
          
          <div className="mb-6 flex justify-center">
            <div className="active-loader"></div>
          </div>
          
          <h3 className="text-sm sm:text-base font-medium text-black dark:text-white leading-relaxed">
            {selectedLoader !== null ? loaders[selectedLoader].title : ''}
          </h3>
          
          <div className="mt-4 flex justify-center space-x-1">
            <div className="w-2 h-2 bg-black dark:bg-white rounded-full animate-bounce"></div>
            <div className="w-2 h-2 bg-black dark:bg-white rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
            <div className="w-2 h-2 bg-black dark:bg-white rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
          </div>
        </div>
      </div>
    );
  }
  if (!isVisible || selectedLoader === null) return null;

  const currentLoader = loaders[selectedLoader];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center backdrop-blur-md bg-black/60 dark:bg-white/10">
      <div className="bg-white dark:bg-black border border-gray-200 dark:border-gray-800 rounded-2xl shadow-2xl p-6 sm:p-8 max-w-sm mx-4 text-center">
        <style dangerouslySetInnerHTML={{ __html: currentLoader.css }} />
        
        <div className="mb-6 flex justify-center">
          <div className="active-loader"></div>
        </div>
        
        <h3 className="text-sm sm:text-base font-medium text-black dark:text-white leading-relaxed">
          {currentLoader.title}
        </h3>
        
        <div className="mt-4 flex justify-center space-x-1">
          <div className="w-2 h-2 bg-black dark:bg-white rounded-full animate-bounce"></div>
          <div className="w-2 h-2 bg-black dark:bg-white rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
          <div className="w-2 h-2 bg-black dark:bg-white rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
        </div>
      </div>
    </div>
  );
};

export default AILoader;