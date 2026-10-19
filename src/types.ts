export type AppTab = 'fireworks' | 'stars';

export type FireworkSetting = 'day' | 'night';

export type StarEmoji = '🌟' | '⭐';

export interface StarNode {
  id: string;
  x: number; // percentage (0 - 100)
  y: number; // percentage (0 - 100)
  emoji: StarEmoji;
  size: number; // px font size
  order: number;
}

export interface StarLine {
  fromId: string;
  toId: string;
}

export type PresetShape = 'heart' | 'letterA' | 'crown' | 'moon' | 'cake' | 'constellation';
