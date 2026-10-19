import React, { useState, useRef, useEffect } from 'react';
import { StarEmoji, StarNode } from '../types';
import { audioManager } from '../utils/audio';
import { 
  RotateCcw, 
  Trash2, 
  Download, 
  Volume2, 
  VolumeX, 
  Music
} from 'lucide-react';

interface StarMakerProps {
  // Navigation / callbacks if any
}

export const StarMaker: React.FC<StarMakerProps> = () => {
  const [stars, setStars] = useState<StarNode[]>([]);
  const [selectedEmoji, setSelectedEmoji] = useState<StarEmoji>('🌟');
  const [connectLines, setConnectLines] = useState<boolean>(true);
  const [lineColor] = useState<string>('#FF70A6'); // pink glow line
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  const [musicActive, setMusicActive] = useState<boolean>(false);

  const containerRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const draggingStarId = useRef<string | null>(null);

  // Background ambient tiny stars
  const ambientStarsRef = useRef<{ x: number; y: number; r: number; a: number; speed: number }[]>([]);

  // Toggle sound
  const toggleSound = (e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    const next = !soundEnabled;
    setSoundEnabled(next);
    audioManager.sfxEnabled = next;
  };

  // Toggle music
  const toggleMusic = (e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    const active = audioManager.toggleMusic();
    setMusicActive(active);
  };

  // Init ambient starry sky
  useEffect(() => {
    const count = 100;
    const bg: { x: number; y: number; r: number; a: number; speed: number }[] = [];
    for (let i = 0; i < count; i++) {
      bg.push({
        x: Math.random() * 100,
        y: Math.random() * 100,
        r: Math.random() * 1.5 + 0.4,
        a: Math.random() * 0.7 + 0.2,
        speed: Math.random() * 0.02 + 0.005,
      });
    }
    ambientStarsRef.current = bg;
  }, []);

  // Canvas drawing loop for constellation lines and glowing effects
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;

    const render = () => {
      const width = (canvas.width = canvas.parentElement?.clientWidth || window.innerWidth);
      const height = (canvas.height = canvas.parentElement?.clientHeight || window.innerHeight);

      // Deep celestial night sky
      const grad = ctx.createLinearGradient(0, 0, 0, height);
      grad.addColorStop(0, '#09071c');
      grad.addColorStop(0.5, '#120d2e');
      grad.addColorStop(1, '#1b123f');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, width, height);

      // Draw background twinkling stars
      ambientStarsRef.current.forEach((s) => {
        s.a += (Math.random() - 0.5) * s.speed;
        if (s.a > 0.85) s.a = 0.85;
        if (s.a < 0.15) s.a = 0.15;

        ctx.beginPath();
        ctx.arc((s.x / 100) * width, (s.y / 100) * height, s.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255, 255, 255, ${s.a})`;
        ctx.fill();
      });

      // Draw constellation connecting lines if enabled and at least 2 stars exist
      if (connectLines && stars.length > 1) {
        ctx.save();
        ctx.beginPath();

        const firstPtX = (stars[0].x / 100) * width;
        const firstPtY = (stars[0].y / 100) * height;
        ctx.moveTo(firstPtX, firstPtY);

        for (let i = 1; i < stars.length; i++) {
          const ptX = (stars[i].x / 100) * width;
          const ptY = (stars[i].y / 100) * height;
          ctx.lineTo(ptX, ptY);
        }

        // Glowing outer stroke
        ctx.strokeStyle = lineColor;
        ctx.shadowColor = lineColor;
        ctx.shadowBlur = 12;
        ctx.lineWidth = 2.5;
        ctx.stroke();

        // Bright inner core stroke
        ctx.beginPath();
        ctx.moveTo(firstPtX, firstPtY);
        for (let i = 1; i < stars.length; i++) {
          ctx.lineTo((stars[i].x / 100) * width, (stars[i].y / 100) * height);
        }
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.7)';
        ctx.lineWidth = 1;
        ctx.stroke();
        ctx.restore();
      }

      animId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animId);
    };
  }, [stars, connectLines, lineColor]);

  // Handle clicking on sky to place star
  const handleSkyClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (draggingStarId.current) return;
    if (!containerRef.current) return;

    // Strict guard: NEVER place a star if clicking on buttons, icons, controls, or interactive bars
    const target = e.target as HTMLElement | null;
    if (
      target &&
      (target.closest('button') ||
       target.closest('svg') ||
       target.closest('path') ||
       target.closest('.pointer-events-auto') ||
       target.closest('[data-no-star]') ||
       target.classList.contains('cursor-grab') ||
       target.classList.contains('cursor-pointer'))
    ) {
      return;
    }

    const rect = containerRef.current.getBoundingClientRect();
    const xPct = ((e.clientX - rect.left) / rect.width) * 100;
    const yPct = ((e.clientY - rect.top) / rect.height) * 100;

    // Bounds check - ensure stars are placed only in open sky, not behind headers or bottom controls
    if (xPct < 3 || xPct > 97 || yPct < 15 || yPct > 85) return;

    const newStar: StarNode = {
      id: `star-${Date.now()}-${Math.random()}`,
      x: Number(xPct.toFixed(2)),
      y: Number(yPct.toFixed(2)),
      emoji: selectedEmoji,
      size: 28,
      order: stars.length,
    };

    setStars((prev) => [...prev, newStar]);
    audioManager.playStarChime(stars.length);
  };

  // Undo last placed star
  const handleUndo = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (stars.length === 0) return;
    setStars((prev) => prev.slice(0, prev.length - 1));
    audioManager.playUndoSound();
  };

  // Clear all stars
  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (stars.length === 0) return;
    setStars([]);
    audioManager.playClearSound();
  };

  // Export constellation image as PNG download (clean starry sky without watermark)
  const handleDownload = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!containerRef.current || stars.length === 0) return;

    const offscreen = document.createElement('canvas');
    offscreen.width = 1080;
    offscreen.height = 1080;
    const ctx = offscreen.getContext('2d');
    if (!ctx) return;

    // Background
    const bgGrad = ctx.createLinearGradient(0, 0, 0, 1080);
    bgGrad.addColorStop(0, '#09071c');
    bgGrad.addColorStop(0.5, '#140e34');
    bgGrad.addColorStop(1, '#20134b');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, 1080, 1080);

    // Stars & constellations lines
    if (connectLines && stars.length > 1) {
      ctx.beginPath();
      ctx.moveTo((stars[0].x / 100) * 1080, (stars[0].y / 100) * 1080);
      for (let i = 1; i < stars.length; i++) {
        ctx.lineTo((stars[i].x / 100) * 1080, (stars[i].y / 100) * 1080);
      }
      ctx.strokeStyle = lineColor;
      ctx.shadowColor = lineColor;
      ctx.shadowBlur = 18;
      ctx.lineWidth = 4;
      ctx.stroke();
    }

    // Render emojis
    ctx.font = '40px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    stars.forEach((s) => {
      ctx.fillText(s.emoji, (s.x / 100) * 1080, (s.y / 100) * 1080);
    });

    const link = document.createElement('a');
    link.download = `Star_Constellation_${Date.now()}.png`;
    link.href = offscreen.toDataURL('image/png');
    link.click();
  };

  return (
    <div 
      ref={containerRef}
      onClick={handleSkyClick}
      className="relative w-full h-full overflow-hidden select-none cursor-crosshair"
    >
      {/* Background canvas for starry sky & glowing constellation lines */}
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full pointer-events-none z-0" />

      {/* Top Header & Audio Bar (Angela white & pinkish theme) */}
      <div className="absolute top-0 left-0 right-0 z-20 px-4 py-3 flex flex-col items-center pointer-events-none">
        {/* Audio buttons row */}
        <div 
          onClick={(e) => e.stopPropagation()}
          onMouseDown={(e) => e.stopPropagation()}
          onTouchStart={(e) => e.stopPropagation()}
          className="w-full max-w-lg flex items-center justify-end mb-1 pointer-events-auto"
        >
          <div 
            onClick={(e) => e.stopPropagation()}
            onMouseDown={(e) => e.stopPropagation()}
            onTouchStart={(e) => e.stopPropagation()}
            className="flex items-center gap-2 bg-white/90 backdrop-blur-md border-2 border-pink-200 rounded-full px-3 py-1.5 shadow-[0_4px_15px_rgba(255,105,180,0.15)]"
          >
            <button
              type="button"
              onClick={toggleMusic}
              onMouseDown={(e) => e.stopPropagation()}
              onTouchStart={(e) => e.stopPropagation()}
              title={musicActive ? 'Pause Music' : 'Play Music'}
              className="p-1.5 text-pink-500 hover:text-pink-600 hover:bg-pink-50 rounded-full transition-all cursor-pointer"
            >
              <Music className={`w-4 h-4 ${musicActive ? 'text-pink-500 animate-pulse' : 'text-pink-300'}`} />
            </button>
            <button
              type="button"
              onClick={toggleSound}
              onMouseDown={(e) => e.stopPropagation()}
              onTouchStart={(e) => e.stopPropagation()}
              title={soundEnabled ? 'Mute SFX' : 'Enable SFX'}
              className="p-1.5 text-pink-500 hover:text-pink-600 hover:bg-pink-50 rounded-full transition-all cursor-pointer"
            >
              {soundEnabled ? <Volume2 className="w-4 h-4 text-pink-500" /> : <VolumeX className="w-4 h-4 text-pink-300" />}
            </button>
          </div>
        </div>

        {/* Clean Header: "Star Maker" only */}
        <h1 
          onClick={(e) => e.stopPropagation()} 
          className="text-2xl sm:text-3xl font-bold font-fredoka text-transparent bg-clip-text bg-gradient-to-r from-pink-500 via-rose-500 to-purple-500 drop-shadow-sm pointer-events-auto"
        >
          Star Maker
        </h1>

        {/* Emoji Switcher Bar with Angela White & Pinkish Theme */}
        <div 
          onClick={(e) => e.stopPropagation()}
          onMouseDown={(e) => e.stopPropagation()}
          onTouchStart={(e) => e.stopPropagation()}
          className="mt-2.5 pointer-events-auto flex items-center gap-2 bg-white/90 backdrop-blur-md border-2 border-pink-200 px-3 py-1.5 rounded-2xl shadow-[0_4px_20px_rgba(255,105,180,0.18)]"
        >
          <span className="text-[11px] font-fredoka font-semibold text-pink-600 uppercase tracking-wider pr-1 hidden sm:inline">
            Active Star:
          </span>

          {/* Option 1: '🌟' Glowing Star */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setSelectedEmoji('🌟');
              audioManager.playStarChime(1);
            }}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-fredoka font-bold text-sm transition-all duration-200 cursor-pointer ${
              selectedEmoji === '🌟'
                ? 'bg-gradient-to-r from-pink-500 to-rose-400 text-white shadow-[0_2px_12px_rgba(255,105,180,0.4)] scale-105 border border-pink-200'
                : 'text-slate-600 hover:text-pink-600 hover:bg-pink-50'
            }`}
          >
            <span className="text-base">🌟</span>
            <span>Glow 🌟</span>
          </button>

          {/* Option 2: '⭐' Classic Star */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setSelectedEmoji('⭐');
              audioManager.playStarChime(4);
            }}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-fredoka font-bold text-sm transition-all duration-200 cursor-pointer ${
              selectedEmoji === '⭐'
                ? 'bg-gradient-to-r from-amber-400 to-pink-500 text-white shadow-[0_2px_12px_rgba(251,191,36,0.4)] scale-105 border border-amber-200'
                : 'text-slate-600 hover:text-pink-600 hover:bg-pink-50'
            }`}
          >
            <span className="text-base">⭐</span>
            <span>Gold ⭐</span>
          </button>

          {/* Line toggle */}
          <div className="h-5 w-px bg-pink-200 mx-1" />

          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setConnectLines(!connectLines);
            }}
            title="Toggle Constellation Lines"
            className={`px-2.5 py-1.5 rounded-xl text-xs font-fredoka font-semibold transition-all cursor-pointer ${
              connectLines
                ? 'bg-pink-100 text-pink-700 border border-pink-300 shadow-sm'
                : 'text-slate-400 hover:text-pink-600'
            }`}
          >
            Lines: {connectLines ? 'ON' : 'OFF'}
          </button>
        </div>
      </div>

      {/* Render placed Star Emojis */}
      {stars.map((star, idx) => (
        <div
          key={star.id}
          onClick={(e) => e.stopPropagation()}
          onMouseDown={(e) => e.stopPropagation()}
          onTouchStart={(e) => e.stopPropagation()}
          style={{
            left: `${star.x}%`,
            top: `${star.y}%`,
            transform: 'translate(-50%, -50%)',
          }}
          className="absolute z-10 pointer-events-auto flex items-center justify-center cursor-grab active:cursor-grabbing group select-none"
          title={`Star #${idx + 1} (${star.emoji}) - Tap or drag`}
        >
          {/* Subtle celestial aura */}
          <div className="absolute inset-0 w-8 h-8 -m-1 rounded-full bg-pink-400/20 blur-md pointer-events-none group-hover:bg-pink-400/40 transition-all animate-pulse" />
          
          {/* Star Emoji: 🌟 or ⭐ */}
          <span 
            className="text-2xl sm:text-3xl filter drop-shadow-[0_0_8px_rgba(255,215,0,0.8)] transition-transform duration-150 group-hover:scale-125"
          >
            {star.emoji}
          </span>

          {/* Star node index badge */}
          <span className="absolute -bottom-3 text-[9px] font-fredoka font-bold text-pink-200/80 bg-slate-950/70 px-1 rounded-full border border-pink-400/30 opacity-0 group-hover:opacity-100 transition-opacity">
            {idx + 1}
          </span>
        </div>
      ))}

      {/* Bottom Action Bar (Angela white & pinkish theme) */}
      <div 
        onClick={(e) => e.stopPropagation()}
        onMouseDown={(e) => e.stopPropagation()}
        onTouchStart={(e) => e.stopPropagation()}
        className="absolute bottom-20 left-0 right-0 z-20 px-6 flex items-center justify-center gap-4 pointer-events-none"
      >
        {/* UNDO BUTTON */}
        <button
          type="button"
          onClick={handleUndo}
          disabled={stars.length === 0}
          className={`pointer-events-auto flex items-center justify-center gap-2 px-6 py-3 rounded-2xl font-fredoka font-bold text-sm sm:text-base transition-all duration-200 shadow-md cursor-pointer ${
            stars.length > 0
              ? 'bg-white/95 hover:bg-white text-pink-600 border-2 border-pink-300 active:scale-95 shadow-[0_4px_15px_rgba(255,105,180,0.2)]'
              : 'bg-white/60 text-slate-400 border border-pink-100 cursor-not-allowed opacity-60'
          }`}
        >
          <RotateCcw className="w-4 h-4 text-pink-500" />
          <span>Undo</span>
        </button>

        {/* CLEAR BUTTON */}
        <button
          type="button"
          onClick={handleClear}
          disabled={stars.length === 0}
          className={`pointer-events-auto flex items-center justify-center gap-2 px-6 py-3 rounded-2xl font-fredoka font-bold text-sm sm:text-base transition-all duration-200 shadow-md cursor-pointer ${
            stars.length > 0
              ? 'bg-white/95 hover:bg-rose-50 text-rose-500 border-2 border-rose-300 active:scale-95 shadow-[0_4px_15px_rgba(244,63,94,0.18)]'
              : 'bg-white/60 text-slate-400 border border-pink-100 cursor-not-allowed opacity-60'
          }`}
        >
          <Trash2 className="w-4 h-4 text-rose-500" />
          <span>Clear</span>
        </button>

        {/* Download button */}
        {stars.length > 0 && (
          <button
            type="button"
            onClick={handleDownload}
            title="Download Constellation Art"
            className="pointer-events-auto w-12 h-12 rounded-2xl bg-gradient-to-r from-pink-500 to-rose-400 hover:from-pink-400 hover:to-rose-300 text-white flex items-center justify-center border-2 border-white/80 shadow-[0_4px_15px_rgba(255,105,180,0.35)] active:scale-95 transition-all cursor-pointer"
          >
            <Download className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Floating Star Counter Helper at bottom left */}
      <div className="absolute bottom-20 left-4 z-10 pointer-events-none hidden sm:block">
        <div className="bg-white/90 backdrop-blur-md px-3 py-1.5 rounded-full border border-pink-200 text-[11px] font-fredoka text-pink-600 shadow-sm">
          Stars: <span className="text-pink-600 font-bold">{stars.length}</span>
        </div>
      </div>
    </div>
  );
};
