import React, { useEffect, useRef, useState, useCallback } from 'react';
import { FireworkSetting } from '../types';
import { audioManager } from '../utils/audio';
import { Play, Pause, X, Sparkles, Sun, Moon, Volume2, VolumeX, Music } from 'lucide-react';

interface FireworksCanvasProps {
  onBackToMenu?: () => void;
}

// Coordinate in particle trail history
interface TrailPoint {
  x: number;
  y: number;
}

// Long-exposure photo-grade particle with continuous trail
interface Particle {
  x: number;
  y: number;
  history: TrailPoint[];
  maxHistory: number;
  vx: number;
  vy: number;
  alpha: number;
  decay: number;
  color: string;
  size: number;
  gravity: number;
  friction: number;
  twinkle: boolean;
  type: 'ray' | 'concentricCore' | 'brocadeWillow';
}

// Ascending rocket with luminous anime comet stem (matching Image 3)
interface Rocket {
  x: number;
  y: number;
  startX: number;
  destX: number;
  destY: number;
  vx: number;
  vy: number;
  color: string;
  history: TrailPoint[];
  style: 'solarBurst' | 'sapphireIce' | 'rubySunset' | 'neonPrismatic' | 'emeraldFestival' | 'brocadeWillow';
}

// Electric burst lightning filament (Anime-style micro-lightning)
interface LightningBolt {
  segments: TrailPoint[];
  color: string;
  alpha: number;
  decay: number;
  width: number;
}

// Expanding optical shockwave ring
interface ShockwaveRing {
  x: number;
  y: number;
  radius: number;
  maxRadius: number;
  speed: number;
  color: string;
  alpha: number;
  decay: number;
}

// Localized optical burst flash flare (No whole-screen blinding)
interface BurstFlash {
  x: number;
  y: number;
  radius: number;
  maxRadius: number;
  color: string;
  alpha: number;
  decay: number;
}

// Floating stardust & bokeh embers (matching Images 2 & 3)
interface FloatingEmber {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  alpha: number;
  baseAlpha: number;
  color: string;
  phase: number;
  twinkleSpeed: number;
}

// Distinct, highly saturated color palettes matching the 4 reference photos:
// Photo 1: Radiant solar gold, sapphire blue, ruby starburst
// Photo 2: Golden brocade willow, crimson fireworks, stardust fallout, festival crowd
// Photo 3: Luminous ascending comet stems, champagne golden bursts, sparkling diamond tips
// Photo 4: Japanese anime festival concentric rings (peach-pink with emerald mint core)
const FESTIVAL_PALETTES = {
  // 1. Blazing Solar Gold Sunburst (Image 1 & 3)
  solarBurst: {
    glow: '#FFEA00',
    lightning: '#FFF9C4',
    accents: [
      '#FFFFFF', // Incandescent diamond white core
      '#FFF9C4', // Lemon sunshine
      '#FFF176', // Radiant gold
      '#FFEA00', // Solar gold
      '#FFD600', // Warm amber gold
      '#FF9100', // Sunset tangerine
      '#FF6D00', // Deep flame
    ],
    innerGlow: '#FFFFFF',
  },
  // 2. Royal Sapphire & Electric Ice Cyan (Image 1)
  sapphireIce: {
    glow: '#00E5FF',
    lightning: '#80D8FF',
    accents: [
      '#FFFFFF', // Diamond ice
      '#80D8FF', // Sky diamond
      '#00E5FF', // Electric cyan
      '#00B0FF', // Bright azure
      '#2979FF', // Royal sapphire
      '#3D5AFE', // Deep indigo
      '#7C4DFF', // Electric violet
    ],
    innerGlow: '#80D8FF',
  },
  // 3. Vivid Ruby & Sunset Magenta Starburst (Image 1 & 2)
  rubySunset: {
    glow: '#FF1744',
    lightning: '#FF4081',
    accents: [
      '#FFFFFF', // Hot white center
      '#FF1744', // Fiery ruby
      '#F50057', // Vivid magenta
      '#FF4081', // Neon rose
      '#D500F9', // Electric purple
      '#FF6D00', // Sunset gold-orange
      '#FFD54F', // Golden amber tips
    ],
    innerGlow: '#FF80AB',
  },
  // 4. Vibrant Multi-Color Prismatic Rainbow (Image 1)
  neonPrismatic: {
    glow: '#FF007F',
    lightning: '#00E5FF',
    accents: [
      '#FF007F', // Hot neon pink
      '#00E5FF', // Electric cyan
      '#FFEA00', // Canary solar gold
      '#D500F9', // Vivid magenta violet
      '#00E676', // Bright emerald mint
      '#FF3D00', // Blazing coral red
      '#3D5AFE', // Royal electric blue
      '#FF9100', // Radiant tangerine
    ],
    innerGlow: '#FFEA00',
  },
  // 5. Anime Festival Concentric (Image 4 - Kyoto Animation style peach-pink with emerald mint core)
  emeraldFestival: {
    glow: '#00E676',
    lightning: '#69F0AE',
    accents: [
      '#FF80AB', // Soft anime peach pink (outer ring)
      '#FF4081', // Rose
      '#00E676', // Radiant emerald mint (inner ring)
      '#69F0AE', // Mint sparkle
      '#00E5FF', // Electric cyan
      '#FFFFFF', // Pure diamond
    ],
    innerGlow: '#69F0AE',
  },
  // 6. Brocade Willow & Cascading Gold Palms (Image 2 - Weeping glittering gold)
  brocadeWillow: {
    glow: '#FFD54F',
    lightning: '#FFF9C4',
    accents: [
      '#FFFFFF', // White star tips
      '#FFF9C4', // Champagne gold
      '#FFE082', // Rich honey gold
      '#FFD54F', // Golden willow
      '#FFCA28', // Shimmering palm
      '#FFA000', // Deep amber
      '#FF8F00', // Warm bronze
    ],
    innerGlow: '#FFE082',
  },
};

export const FireworksCanvas: React.FC<FireworksCanvasProps> = () => {
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [setting, setSetting] = useState<FireworkSetting>('night');
  const [isPaused, setIsPaused] = useState<boolean>(false);
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  const [musicActive, setMusicActive] = useState<boolean>(false);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  // Simulation collections
  const rocketsRef = useRef<Rocket[]>([]);
  const particlesRef = useRef<Particle[]>([]);
  const lightningsRef = useRef<LightningBolt[]>([]);
  const shockwavesRef = useRef<ShockwaveRing[]>([]);
  const flashesRef = useRef<BurstFlash[]>([]);
  const embersRef = useRef<FloatingEmber[]>([]);
  const lastAutoLaunchRef = useRef<number>(0);
  const sequenceStepRef = useRef<number>(0);
  const isPausedRef = useRef<boolean>(false);

  // Pre-rendered offscreen background (starry sky, distant hills/town lights, festival crowd)
  const bgCanvasRef = useRef<HTMLCanvasElement | null>(null);

  isPausedRef.current = isPaused;

  const toggleSound = (e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    const next = !soundEnabled;
    setSoundEnabled(next);
    audioManager.sfxEnabled = next;
  };

  const toggleMusic = (e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    const active = audioManager.toggleMusic();
    setMusicActive(active);
  };

  // Pre-render the scenic festival horizon matching Images 2, 3, and 4
  const preRenderBackground = useCallback((width: number, height: number, mode: FireworkSetting) => {
    const bgCanvas = document.createElement('canvas');
    bgCanvas.width = width;
    bgCanvas.height = height;
    const bgCtx = bgCanvas.getContext('2d');
    if (!bgCtx) return;

    if (mode === 'night') {
      // Deep midnight indigo sky with soft twilight warm horizon glow (Image 3 & 4)
      const skyGrad = bgCtx.createLinearGradient(0, 0, 0, height);
      skyGrad.addColorStop(0, '#02040e');
      skyGrad.addColorStop(0.35, '#060a1d');
      skyGrad.addColorStop(0.68, '#0d1330');
      skyGrad.addColorStop(0.85, '#171836');
      skyGrad.addColorStop(0.94, '#241a36');
      skyGrad.addColorStop(1, '#321d37');
      bgCtx.fillStyle = skyGrad;
      bgCtx.fillRect(0, 0, width, height);

      // Pre-draw 85 crisp celestial stars
      bgCtx.fillStyle = '#FFFFFF';
      for (let i = 0; i < 85; i++) {
        const sx = Math.random() * width;
        const sy = Math.random() * (height * 0.74);
        const sr = Math.random() * 1.3 + 0.4;
        const sa = Math.random() * 0.65 + 0.25;
        bgCtx.globalAlpha = sa;
        bgCtx.beginPath();
        bgCtx.arc(sx, sy, sr, 0, Math.PI * 2);
        bgCtx.fill();
      }
      bgCtx.globalAlpha = 1.0;
    } else {
      // Twilight / Day mode
      const skyGrad = bgCtx.createLinearGradient(0, 0, 0, height);
      skyGrad.addColorStop(0, '#1c315e');
      skyGrad.addColorStop(0.4, '#30518f');
      skyGrad.addColorStop(0.75, '#6a8cc7');
      skyGrad.addColorStop(0.9, '#eea6b7');
      skyGrad.addColorStop(1, '#ffcad4');
      bgCtx.fillStyle = skyGrad;
      bgCtx.fillRect(0, 0, width, height);
    }

    // Distant mountain ridge / hills with warm bokeh town lights (Image 3)
    const horizonY = height * 0.85;
    bgCtx.fillStyle = '#080a18';
    bgCtx.beginPath();
    bgCtx.moveTo(0, height);
    bgCtx.lineTo(0, horizonY - 10);
    bgCtx.quadraticCurveTo(width * 0.22, horizonY - 28, width * 0.45, horizonY - 14);
    bgCtx.quadraticCurveTo(width * 0.72, horizonY - 32, width, horizonY - 12);
    bgCtx.lineTo(width, height);
    bgCtx.closePath();
    bgCtx.fill();

    // Distant warm city lights along the horizon (Image 3)
    bgCtx.fillStyle = '#FFE082';
    for (let l = 0; l < 32; l++) {
      const lx = (l / 32) * width + (Math.random() * 12 - 6);
      const ly = horizonY - 8 + (Math.sin(l * 3.7) * 4);
      const lr = Math.random() * 1.6 + 0.8;
      bgCtx.globalAlpha = Math.random() * 0.6 + 0.2;
      bgCtx.beginPath();
      bgCtx.arc(lx, ly, lr, 0, Math.PI * 2);
      bgCtx.fill();
    }
    bgCtx.globalAlpha = 1.0;

    // Festival spectator silhouettes along the foreground overlook (Images 2 & 4)
    bgCtx.fillStyle = '#030409';
    bgCtx.beginPath();
    bgCtx.moveTo(0, height);
    bgCtx.lineTo(0, horizonY + 16);

    const crowdStep = 24;
    const totalCrowdHeads = Math.ceil(width / crowdStep) + 2;
    for (let c = 0; c < totalCrowdHeads; c++) {
      const cx = c * crowdStep - 8;
      const seed = Math.sin(c * 17.3 + 4.1);
      const headRadius = 6.5 + Math.abs(seed) * 4.5;
      const headY = horizonY + 16 - Math.abs(seed) * 12;

      bgCtx.arc(cx, headY, headRadius, Math.PI, 0, false);
      bgCtx.lineTo(cx + headRadius + 4, horizonY + 32);
    }
    bgCtx.lineTo(width, height);
    bgCtx.closePath();
    bgCtx.fill();

    bgCanvasRef.current = bgCanvas;

    // Initialize 36 atmospheric stardust bokeh embers (Images 2 & 3)
    const embers: FloatingEmber[] = [];
    const colors = ['#FFFFFF', '#FFF9C4', '#FFE082', '#FF80AB', '#80D8FF', '#FFD54F'];
    for (let i = 0; i < 36; i++) {
      embers.push({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * 0.25,
        vy: 0.12 + Math.random() * 0.2,
        radius: Math.random() * 1.8 + 0.8,
        alpha: Math.random() * 0.5 + 0.2,
        baseAlpha: Math.random() * 0.5 + 0.2,
        color: colors[Math.floor(Math.random() * colors.length)],
        phase: Math.random() * Math.PI * 2,
        twinkleSpeed: 0.02 + Math.random() * 0.03,
      });
    }
    embersRef.current = embers;
  }, []);

  // Launch a single rocket with luminous ascending comet stem (Image 3)
  const launchRocket = useCallback((
    targetX?: number, 
    targetY?: number, 
    forcedStyle?: Rocket['style'],
    customStartX?: number
  ) => {
    if (!canvasRef.current) return;
    const canvas = canvasRef.current;
    const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
    const width = canvas.width / dpr;
    const height = canvas.height / dpr;

    // Maintain clean one-by-one cadence: max 2 active ascending rockets
    if (rocketsRef.current.length >= 2) return;

    const styles: Rocket['style'][] = [
      'solarBurst',
      'sapphireIce',
      'rubySunset',
      'emeraldFestival',
      'brocadeWillow',
      'neonPrismatic',
    ];
    const style = forcedStyle || styles[Math.floor(Math.random() * styles.length)];

    const startX = customStartX !== undefined 
      ? customStartX 
      : targetX !== undefined 
        ? targetX + (Math.random() * 24 - 12) 
        : width * (0.22 + Math.random() * 0.56);
    
    // High sky elevation to allow slow, wide expansion
    const destY = targetY !== undefined 
      ? targetY 
      : height * (0.15 + Math.random() * 0.22);
    
    const destX = targetX !== undefined ? targetX : startX + (Math.random() * 36 - 18);

    const distanceY = height - destY;
    // Fluid slow ascent (~55 frames)
    const duration = 54 + Math.random() * 6;
    const vy = -distanceY / duration;
    const vx = (destX - startX) / duration;

    const pal = FESTIVAL_PALETTES[style];
    rocketsRef.current.push({
      x: startX,
      y: height - 10,
      startX,
      destX,
      destY,
      vx,
      vy,
      color: pal.glow,
      history: [{ x: startX, y: height - 10 }],
      style,
    });

    audioManager.playLaunchSound();
  }, []);

  // Launch fireworks strictly one-by-one in an alternating dance across the sky
  const launchNextOneByOne = useCallback(() => {
    if (!canvasRef.current) return;
    const canvas = canvasRef.current;
    const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
    const width = canvas.width / dpr;
    const height = canvas.height / dpr;

    // Choreographed cycle through the palettes
    const stylesSequence: Rocket['style'][] = [
      'solarBurst',       // Image 1: Golden Chrysanthemum
      'sapphireIce',     // Image 1: Royal Sapphire Electric Blue
      'rubySunset',      // Image 1 & 2: Radiant Crimson-Pink Starburst
      'emeraldFestival', // Image 4: Anime Kyoto Peach & Mint concentric ring
      'brocadeWillow',   // Image 2 & 3: Weeping Gold Brocade Willow
      'neonPrismatic',   // Image 1: Multi-color prismatic flower
    ];

    // Elegant positions across upper sky framing the glowing birthday message
    const positions = [
      { xRatio: 0.50, yRatio: 0.22 },
      { xRatio: 0.28, yRatio: 0.18 },
      { xRatio: 0.72, yRatio: 0.20 },
      { xRatio: 0.38, yRatio: 0.25 },
      { xRatio: 0.62, yRatio: 0.19 },
      { xRatio: 0.22, yRatio: 0.22 },
      { xRatio: 0.78, yRatio: 0.21 },
    ];

    const idx = sequenceStepRef.current % positions.length;
    const styleIdx = sequenceStepRef.current % stylesSequence.length;
    sequenceStepRef.current += 1;

    const targetPos = positions[idx];
    const targetX = width * targetPos.xRatio;
    const targetY = height * targetPos.yRatio;
    const style = stylesSequence[styleIdx];

    launchRocket(targetX, targetY, style);
  }, [launchRocket]);

  // Detonate into SLOW, WIDE, HIGHLY COLOURFUL & LONG-LASTING fireworks
  // Grounded in all 4 reference images with anime concentric shells, electric burst lightning, and no blinding glare
  const detonateRocket = useCallback((rocket: Rocket) => {
    audioManager.playExplosionSound(0.92 + Math.random() * 0.18);

    const currentParticles = particlesRef.current;
    // Hard cap particles to maintain 60 FPS
    if (currentParticles.length > 360) {
      currentParticles.splice(0, currentParticles.length - 260);
    }

    const originX = rocket.x;
    const originY = rocket.y;
    const pal = FESTIVAL_PALETTES[rocket.style] || FESTIVAL_PALETTES.solarBurst;

    // 1. ANIME ELECTRIC BURST LIGHTNING FILAMENTS (8 Jagged Micro-Lightning Bolts)
    // Instant electric crackle shooting outward from the detonation core
    const boltCount = 8;
    for (let b = 0; b < boltCount; b++) {
      const baseAngle = (b / boltCount) * Math.PI * 2 + (Math.random() * 0.35 - 0.17);
      const boltLength = 48 + Math.random() * 42;
      const segments: TrailPoint[] = [{ x: originX, y: originY }];
      const steps = 4;
      const normalAngle = baseAngle + Math.PI / 2;

      for (let s = 1; s <= steps; s++) {
        const t = s / steps;
        const segDist = boltLength * t;
        const perpJitter = (Math.random() - 0.5) * 14 * (1 - t * 0.25);
        const px = originX + Math.cos(baseAngle) * segDist + Math.cos(normalAngle) * perpJitter;
        const py = originY + Math.sin(baseAngle) * segDist + Math.sin(normalAngle) * perpJitter;
        segments.push({ x: px, y: py });
      }

      lightningsRef.current.push({
        segments,
        color: Math.random() > 0.4 ? '#FFFFFF' : pal.lightning,
        alpha: 1.0,
        decay: 0.14, // Rapid 7-frame flash: instant electric burst lightning!
        width: 2.2,
      });
    }

    // 2. EXPANDING OPTICAL SHOCKWAVE RING (Sonic refraction wave)
    shockwavesRef.current.push({
      x: originX,
      y: originY,
      radius: 6,
      maxRadius: 85 + Math.random() * 25,
      speed: 6.2,
      color: pal.glow,
      alpha: 0.9,
      decay: 0.055,
    });

    // 3. LOCALIZED OPTICAL BURST FLASH FLARE (Clear, localized burst light with diffraction star)
    flashesRef.current.push({
      x: originX,
      y: originY,
      radius: 20,
      maxRadius: 110 + Math.random() * 25,
      color: pal.glow,
      alpha: 0.9,
      decay: 0.085,
    });

    // 4. MAIN HIGH-GRAPHIC NEEDLE RAYS: Expansive, slow-motion radiant spokes (Images 1, 2, 3)
    const spokeCount = 76;
    for (let i = 0; i < spokeCount; i++) {
      const angle = (i / spokeCount) * Math.PI * 2 + (Math.random() * 0.02 - 0.01);
      
      // Speed: Fluid slow-motion bloom
      const speed = 4.1 + Math.random() * 2.6;

      const spokeColor = rocket.style === 'neonPrismatic'
        ? pal.accents[i % pal.accents.length]
        : pal.accents[Math.floor(Math.random() * pal.accents.length)];

      currentParticles.push({
        x: originX,
        y: originY,
        history: [{ x: originX, y: originY }],
        maxHistory: 11, // 11 points: long streaming needle tail
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        alpha: 1.0,
        decay: 0.005 + Math.random() * 0.002, // Lasts 4.5+ seconds in the sky
        color: spokeColor,
        size: 2.0,
        gravity: 0.028, // Soft weeping downward arc
        friction: 0.984, // Expands wide across the sky
        twinkle: Math.random() > 0.45,
        type: 'ray',
      });
    }

    // 5. SECONDARY CONCENTRIC INNER ANIME CORE (Image 4 - Concentric ring flower!)
    const innerSpokeCount = 28;
    for (let i = 0; i < innerSpokeCount; i++) {
      const angle = (i / innerSpokeCount) * Math.PI * 2 + 0.1;
      const speed = 2.1 + Math.random() * 1.2;
      const innerColor = rocket.style === 'emeraldFestival'
        ? '#00E676' // Emerald mint core inside peach pink!
        : pal.innerGlow || '#FFFFFF';

      currentParticles.push({
        x: originX,
        y: originY,
        history: [{ x: originX, y: originY }],
        maxHistory: 8,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        alpha: 1.0,
        decay: 0.0065 + Math.random() * 0.002,
        color: innerColor,
        size: 1.6,
        gravity: 0.022,
        friction: 0.978,
        twinkle: true,
        type: 'concentricCore',
      });
    }

    // 6. INNER WEEPING BROCADE WILLOW SPARKLING FALLOUT (Image 2 - cascading gold & diamond embers)
    for (let i = 0; i < 16; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 1.6 + Math.random() * 2.2;
      currentParticles.push({
        x: originX,
        y: originY,
        history: [{ x: originX, y: originY }],
        maxHistory: 9,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        alpha: 0.95,
        decay: 0.0042 + Math.random() * 0.002,
        color: Math.random() > 0.5 ? '#FFF9C4' : pal.glow,
        size: 1.8,
        gravity: 0.038,
        friction: 0.975,
        twinkle: true,
        type: 'brocadeWillow',
      });
    }
  }, []);

  // Main 60fps Render Loop with Maximum GPU Optimization
  useEffect(() => {
    if (!isPlaying) return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d', { alpha: false });
    if (!ctx) return;

    const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
    let width = window.innerWidth;
    let height = window.innerHeight;
    canvas.width = Math.floor(width * dpr);
    canvas.height = Math.floor(height * dpr);
    ctx.scale(dpr, dpr);

    preRenderBackground(width, height, setting);

    const handleResize = () => {
      if (!canvas) return;
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = Math.floor(width * dpr);
      canvas.height = Math.floor(height * dpr);
      ctx.scale(dpr, dpr);
      preRenderBackground(width, height, setting);
    };

    window.addEventListener('resize', handleResize);

    // Initial launch: start first one-by-one firework
    const initialTimer = setTimeout(() => {
      launchNextOneByOne();
      lastAutoLaunchRef.current = Date.now();
    }, 400);

    const render = () => {
      if (!isPausedRef.current) {
        const now = Date.now();

        // One-by-one pacing:
        // A firework launches -> ascends as a glowing comet stem (~1.0s).
        // It detonates, blooms slow and wide for ~2.6s (mid-way through its majestic expansion).
        // Then the NEXT rocket launches from the ground!
        if (now - lastAutoLaunchRef.current > 2600 && rocketsRef.current.length === 0) {
          lastAutoLaunchRef.current = now;
          launchNextOneByOne();
        }

        // 1. FAST SINGLE-BLIT BACKGROUND
        // Draws pre-rendered starry sky, distant town lights, and crowd in ONE operation
        if (bgCanvasRef.current) {
          ctx.globalCompositeOperation = 'source-over';
          ctx.globalAlpha = 1.0;
          ctx.drawImage(bgCanvasRef.current, 0, 0, width, height);
        }

        // 2. OPTICAL ADDITIVE LIGHTING PIPELINE
        ctx.globalCompositeOperation = 'lighter';

        // A. Render Ascending Rocket (Luminous rising comet stem, Image 3)
        const rockets = rocketsRef.current;
        for (let i = rockets.length - 1; i >= 0; i--) {
          const r = rockets[i];
          r.x += r.vx;
          r.y += r.vy;

          r.history.push({ x: r.x, y: r.y });
          if (r.history.length > 10) r.history.shift();

          if (r.history.length > 1) {
            // Radiant comet stem aura
            ctx.beginPath();
            ctx.moveTo(r.history[0].x, r.history[0].y);
            for (let h = 1; h < r.history.length; h++) {
              ctx.lineTo(r.history[h].x, r.history[h].y);
            }
            ctx.strokeStyle = r.color;
            ctx.lineWidth = 2.8;
            ctx.globalAlpha = 0.85;
            ctx.stroke();

            // Luminous white-hot rising core stem
            ctx.strokeStyle = '#FFFFFF';
            ctx.lineWidth = 1.3;
            ctx.globalAlpha = 1.0;
            ctx.stroke();
          }

          // Glowing rocket head
          ctx.beginPath();
          ctx.arc(r.x, r.y, 2.8, 0, Math.PI * 2);
          ctx.fillStyle = '#FFFFFF';
          ctx.globalAlpha = 1.0;
          ctx.fill();

          // Detonation condition
          if (r.y <= r.destY || r.vy >= 0) {
            detonateRocket(r);
            rockets.splice(i, 1);
          }
        }

        // B. Render Localized Optical Burst Flash Flare with Diffraction Star (Images 1 & 3)
        const flashes = flashesRef.current;
        for (let i = flashes.length - 1; i >= 0; i--) {
          const f = flashes[i];
          f.radius += (f.maxRadius - f.radius) * 0.24;
          f.alpha -= f.decay;

          if (f.alpha <= 0) {
            flashes.splice(i, 1);
            continue;
          }

          ctx.save();
          ctx.globalAlpha = f.alpha;
          const radGrad = ctx.createRadialGradient(f.x, f.y, 0, f.x, f.y, Math.max(1, f.radius));
          radGrad.addColorStop(0, '#FFFFFF');
          radGrad.addColorStop(0.35, f.color);
          radGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
          ctx.fillStyle = radGrad;
          ctx.beginPath();
          ctx.arc(f.x, f.y, Math.max(1, f.radius), 0, Math.PI * 2);
          ctx.fill();

          // Delicate 4-point star spike flare
          const spike = f.radius * 0.8;
          ctx.strokeStyle = '#FFFFFF';
          ctx.lineWidth = 1.4;
          ctx.beginPath();
          ctx.moveTo(f.x - spike, f.y);
          ctx.lineTo(f.x + spike, f.y);
          ctx.moveTo(f.x, f.y - spike);
          ctx.lineTo(f.x, f.y + spike);
          ctx.stroke();

          ctx.restore();
        }

        // C. Render Electric Burst Lightning Filaments (Micro-Arcs)
        const lightnings = lightningsRef.current;
        for (let i = lightnings.length - 1; i >= 0; i--) {
          const l = lightnings[i];
          l.alpha -= l.decay;

          if (l.alpha <= 0) {
            lightnings.splice(i, 1);
            continue;
          }

          ctx.save();
          ctx.globalAlpha = l.alpha;

          // Outer aura stroke
          ctx.beginPath();
          ctx.moveTo(l.segments[0].x, l.segments[0].y);
          for (let s = 1; s < l.segments.length; s++) {
            ctx.lineTo(l.segments[s].x, l.segments[s].y);
          }
          ctx.strokeStyle = l.color;
          ctx.lineWidth = l.width * 1.5;
          ctx.stroke();

          // Sharp white core strike
          ctx.strokeStyle = '#FFFFFF';
          ctx.lineWidth = 1.2;
          ctx.stroke();

          ctx.restore();
        }

        // D. Render Expanding Optical Shockwave Rings
        const shockwaves = shockwavesRef.current;
        for (let i = shockwaves.length - 1; i >= 0; i--) {
          const sw = shockwaves[i];
          sw.radius += sw.speed;
          sw.alpha -= sw.decay;

          if (sw.alpha <= 0 || sw.radius >= sw.maxRadius) {
            shockwaves.splice(i, 1);
            continue;
          }

          ctx.save();
          ctx.globalAlpha = sw.alpha;
          ctx.strokeStyle = sw.color;
          ctx.lineWidth = Math.max(1.0, 2.8 * (1 - sw.radius / sw.maxRadius));
          ctx.beginPath();
          ctx.arc(sw.x, sw.y, sw.radius, 0, Math.PI * 2);
          ctx.stroke();

          // White inner refraction rim
          ctx.strokeStyle = '#FFFFFF';
          ctx.lineWidth = 1.0;
          ctx.stroke();
          ctx.restore();
        }

        // E. Render High-Definition Long Needle Ray Particles & Concentric Cores (Images 1, 2, 4)
        const particles = particlesRef.current;
        for (let i = particles.length - 1; i >= 0; i--) {
          const p = particles[i];

          // Slow fluid momentum
          p.vx *= p.friction;
          p.vy *= p.friction;
          p.vy += p.gravity;
          p.x += p.vx;
          p.y += p.vy;
          p.alpha -= p.decay;

          if (p.alpha <= 0) {
            particles.splice(i, 1);
            continue;
          }

          p.history.push({ x: p.x, y: p.y });
          if (p.history.length > p.maxHistory) {
            p.history.shift();
          }

          const currentAlpha = p.twinkle && Math.random() > 0.4 ? p.alpha * 0.6 : p.alpha;

          if (p.history.length > 1) {
            // High-graphic needle ray line
            ctx.beginPath();
            ctx.moveTo(p.history[0].x, p.history[0].y);
            for (let h = 1; h < p.history.length; h++) {
              ctx.lineTo(p.history[h].x, p.history[h].y);
            }
            ctx.strokeStyle = p.color;
            ctx.lineWidth = p.size;
            ctx.globalAlpha = currentAlpha;
            ctx.stroke();
          }

          // Sparkling Diamond Tip Bead (Image 3)
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size * 0.7, 0, Math.PI * 2);
          ctx.fillStyle = '#FFFFFF';
          ctx.globalAlpha = currentAlpha * 0.95;
          ctx.fill();
        }

        // F. Render Drifting Stardust & Bokeh Embers (Images 2 & 3)
        const embers = embersRef.current;
        for (let i = 0; i < embers.length; i++) {
          const emb = embers[i];
          emb.x += emb.vx;
          emb.y += emb.vy;

          if (emb.y > height) {
            emb.y = -6;
            emb.x = Math.random() * width;
          }
          if (emb.x < 0) emb.x = width;
          if (emb.x > width) emb.x = 0;

          const twinkle = emb.baseAlpha + Math.sin(Date.now() * 0.003 + emb.phase) * 0.25;
          const alpha = Math.max(0.1, Math.min(0.9, twinkle));

          ctx.beginPath();
          ctx.arc(emb.x, emb.y, emb.radius, 0, Math.PI * 2);
          ctx.fillStyle = emb.color;
          ctx.globalAlpha = alpha;
          ctx.fill();
        }
      }

      animationFrameRef.current = requestAnimationFrame(render);
    };

    animationFrameRef.current = requestAnimationFrame(render);

    return () => {
      clearTimeout(initialTimer);
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
      window.removeEventListener('resize', handleResize);
    };
  }, [isPlaying, setting, launchNextOneByOne, detonateRocket, preRenderBackground]);

  // Handle user canvas tap to launch custom firework (with 350ms debounce)
  const lastTapRef = useRef<number>(0);
  const handleCanvasInteraction = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isPlaying || isPaused) return;

    const now = Date.now();
    if (now - lastTapRef.current < 350) return;
    lastTapRef.current = now;

    let clientX = 0;
    let clientY = 0;

    if ('touches' in e) {
      if (e.touches.length > 0) {
        clientX = e.touches[0].clientX;
        clientY = e.touches[0].clientY;
      }
    } else {
      clientX = e.clientX;
      clientY = e.clientY;
    }

    launchRocket(clientX, clientY);
  };

  return (
    <div className="relative w-full h-full flex flex-col items-center justify-center overflow-hidden">
      {!isPlaying ? (
        /* SETUP SCREEN: Angela White & Pinkish Theme */
        <div className="relative z-10 w-full max-w-md mx-auto px-6 py-8 flex flex-col items-center text-center animate-in fade-in zoom-in-95 duration-300">
          {/* Top Audio controls */}
          <div className="w-full flex justify-end mb-4">
            <div className="flex items-center gap-2 bg-white/90 backdrop-blur-md border-2 border-pink-200 rounded-full px-3 py-1.5 shadow-[0_4px_15px_rgba(255,105,180,0.15)]">
              <button
                type="button"
                onClick={toggleMusic}
                title={musicActive ? 'Pause Music' : 'Play Music'}
                className="p-1.5 text-pink-500 hover:text-pink-600 hover:bg-pink-50 rounded-full transition-all cursor-pointer"
              >
                <Music className={`w-4 h-4 ${musicActive ? 'text-pink-500 animate-pulse' : 'text-pink-300'}`} />
              </button>
              <button
                type="button"
                onClick={toggleSound}
                title={soundEnabled ? 'Mute SFX' : 'Enable SFX'}
                className="p-1.5 text-pink-500 hover:text-pink-600 hover:bg-pink-50 rounded-full transition-all cursor-pointer"
              >
                {soundEnabled ? <Volume2 className="w-4 h-4 text-pink-500" /> : <VolumeX className="w-4 h-4 text-pink-300" />}
              </button>
            </div>
          </div>

          {/* Center Card: Pure Angela White Glass with Pinkish Accents */}
          <div className="w-full bg-white/92 backdrop-blur-xl border-2 border-pink-200 rounded-3xl p-6 sm:p-8 shadow-[0_20px_45px_rgba(255,140,180,0.22)] flex flex-col items-center">
            {/* Cute sparkles badge */}
            <div className="w-14 h-14 rounded-full bg-gradient-to-tr from-pink-400 via-rose-300 to-amber-200 p-0.5 shadow-[0_4px_15px_rgba(255,105,180,0.3)] mb-3 flex items-center justify-center">
              <div className="w-full h-full rounded-full bg-white flex items-center justify-center">
                <Sparkles className="w-7 h-7 text-pink-500" />
              </div>
            </div>

            {/* Clean Title Only (No subtitle as requested) */}
            <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-pink-500 via-rose-500 to-purple-500 font-fredoka mb-6 drop-shadow-sm">
              Fireworks Show
            </h1>

            {/* Day / Night segmented toggle */}
            <div className="w-full flex items-center p-1.5 bg-pink-50/80 border border-pink-200 rounded-2xl mb-6 shadow-inner">
              <button
                type="button"
                onClick={() => setSetting('day')}
                className={`flex-1 py-3 px-4 rounded-xl flex items-center justify-center gap-2 font-fredoka font-semibold text-sm transition-all duration-200 cursor-pointer ${
                  setting === 'day'
                    ? 'bg-gradient-to-r from-sky-400 to-blue-500 text-white shadow-[0_4px_12px_rgba(56,189,248,0.35)] scale-[1.02]'
                    : 'text-slate-500 hover:text-pink-600'
                }`}
              >
                <Sun className="w-4 h-4 text-amber-200" />
                <span>Day</span>
              </button>

              <button
                type="button"
                onClick={() => setSetting('night')}
                className={`flex-1 py-3 px-4 rounded-xl flex items-center justify-center gap-2 font-fredoka font-semibold text-sm transition-all duration-200 cursor-pointer ${
                  setting === 'night'
                    ? 'bg-gradient-to-r from-pink-500 to-purple-600 text-white shadow-[0_4px_12px_rgba(236,72,153,0.35)] scale-[1.02]'
                    : 'text-slate-500 hover:text-pink-600'
                }`}
              >
                <Moon className="w-4 h-4 text-indigo-100" />
                <span>Night</span>
              </button>
            </div>

            {/* Start Show button */}
            <button
              type="button"
              onClick={() => {
                setIsPlaying(true);
                setIsPaused(false);
              }}
              className="w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-pink-500 via-rose-400 to-purple-500 hover:from-pink-400 hover:to-purple-400 active:scale-98 text-white font-fredoka font-bold text-lg shadow-[0_8px_25px_rgba(255,105,180,0.4)] border-2 border-white/60 flex items-center justify-center gap-3 transition-all cursor-pointer"
            >
              <Sparkles className="w-5 h-5 text-amber-200" />
              <span>Start Show</span>
            </button>
          </div>
        </div>
      ) : (
        /* ACTIVE FULLSCREEN PHOTO-GRADE FIREWORKS SHOW */
        <div className="relative w-full h-full overflow-hidden select-none">
          <canvas
            ref={canvasRef}
            onClick={handleCanvasInteraction}
            onTouchStart={handleCanvasInteraction}
            className="absolute inset-0 w-full h-full touch-none cursor-crosshair z-0"
          />

          {/* Top Bar HUD */}
          <div className="absolute top-0 left-0 right-0 z-20 px-5 py-4 flex items-center justify-between pointer-events-none">
            {/* Audio Controls */}
            <div 
              onClick={(e) => e.stopPropagation()}
              className="pointer-events-auto flex items-center gap-2 bg-white/80 backdrop-blur-md border border-pink-200/80 rounded-full px-3 py-1.5 shadow-md"
            >
              <button
                type="button"
                onClick={toggleMusic}
                title={musicActive ? 'Pause Music' : 'Play Music'}
                className="p-1 text-pink-500 hover:text-pink-700 transition-all cursor-pointer"
              >
                <Music className={`w-3.5 h-3.5 ${musicActive ? 'text-pink-500 animate-pulse' : 'text-slate-400'}`} />
              </button>
              <button
                type="button"
                onClick={toggleSound}
                title={soundEnabled ? 'Mute SFX' : 'Enable SFX'}
                className="p-1 text-pink-500 hover:text-pink-700 transition-all cursor-pointer"
              >
                {soundEnabled ? <Volume2 className="w-3.5 h-3.5 text-pink-500" /> : <VolumeX className="w-3.5 h-3.5 text-slate-400" />}
              </button>
            </div>

            {/* Central "TAP ANYWHERE" prompt */}
            <div className="flex flex-col items-center">
              <span className="text-xs sm:text-sm font-fredoka font-medium tracking-[0.25em] text-white/95 uppercase drop-shadow-[0_2px_8px_rgba(255,255,255,0.8)]">
                TAP ANYWHERE
              </span>
            </div>

            {/* Pause & Close buttons */}
            <div 
              onClick={(e) => e.stopPropagation()}
              className="pointer-events-auto flex items-center gap-2.5"
            >
              <button
                type="button"
                onClick={() => setIsPaused(!isPaused)}
                title={isPaused ? 'Resume' : 'Pause'}
                className="w-10 h-10 rounded-full bg-white/80 backdrop-blur-md border border-pink-200/80 text-pink-600 hover:bg-white flex items-center justify-center transition-all shadow-md active:scale-95 cursor-pointer"
              >
                {isPaused ? <Play className="w-4 h-4 fill-pink-600 text-pink-600" /> : <Pause className="w-4 h-4 fill-pink-600 text-pink-600" />}
              </button>

              <button
                type="button"
                onClick={() => {
                  setIsPlaying(false);
                  setIsPaused(false);
                }}
                title="Exit Fireworks Show"
                className="w-10 h-10 rounded-full bg-white/80 backdrop-blur-md border border-pink-200/80 text-pink-600 hover:bg-rose-50 flex items-center justify-center transition-all shadow-md active:scale-95 cursor-pointer"
              >
                <X className="w-5 h-5 text-pink-600" />
              </button>
            </div>
          </div>

          {/* USER SPECIFICATION: "happy birthday aadhya" medium size, white glow */}
          <div className="absolute inset-0 pointer-events-none flex items-center justify-center pb-24 z-10 px-4">
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-fredoka font-semibold tracking-wider white-glow-text text-center select-none">
              happy birthday aadhya
            </h1>
          </div>
        </div>
      )}
    </div>
  );
};
