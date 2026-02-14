export type ThemeId =
  | 'ember'
  | 'neon'
  | 'ocean'
  | 'violet'
  | 'forest'
  | 'mono';

export type Theme = {
  id: ThemeId;
  name: string;
  matrixColors: string[];
  matrixFade: string;
  ui: {
    accentFrom: string;
    accentTo: string;
    panelBg: string;
    panelBorder: string;
    chipBg: string;
    chipHoverBg: string;
    text: string;
    textMuted: string;
  };
};

export const THEMES: Theme[] = [
  {
    id: 'ember',
    name: 'Ember',
    matrixColors: ['#ff3b30', '#ff9500', '#ffd60a', '#ff2d55'],
    matrixFade: 'rgba(0,0,0,0.12)',
    ui: {
      accentFrom: 'from-orange-600',
      accentTo: 'to-red-600',
      panelBg: 'bg-zinc-900/95',
      panelBorder: 'border-zinc-700',
      chipBg: 'bg-white/5',
      chipHoverBg: 'hover:bg-white/10',
      text: 'text-white',
      textMuted: 'text-zinc-400'
    }
  },
  {
    id: 'neon',
    name: 'Neon',
    matrixColors: ['#00f5ff', '#00ff85', '#b5ff00', '#ff00e6'],
    matrixFade: 'rgba(0,0,0,0.10)',
    ui: {
      accentFrom: 'from-cyan-500',
      accentTo: 'to-fuchsia-600',
      panelBg: 'bg-zinc-950/90',
      panelBorder: 'border-zinc-800',
      chipBg: 'bg-white/5',
      chipHoverBg: 'hover:bg-white/10',
      text: 'text-white',
      textMuted: 'text-zinc-300'
    }
  },
  {
    id: 'ocean',
    name: 'Ocean',
    matrixColors: ['#00c2ff', '#1e90ff', '#00ffd1', '#22c55e'],
    matrixFade: 'rgba(0,0,0,0.14)',
    ui: {
      accentFrom: 'from-sky-500',
      accentTo: 'to-emerald-500',
      panelBg: 'bg-slate-950/85',
      panelBorder: 'border-slate-700',
      chipBg: 'bg-white/5',
      chipHoverBg: 'hover:bg-white/10',
      text: 'text-white',
      textMuted: 'text-slate-300'
    }
  },
  {
    id: 'violet',
    name: 'Violet',
    matrixColors: ['#a855f7', '#6366f1', '#ec4899', '#22d3ee'],
    matrixFade: 'rgba(0,0,0,0.12)',
    ui: {
      accentFrom: 'from-violet-600',
      accentTo: 'to-pink-600',
      panelBg: 'bg-zinc-950/90',
      panelBorder: 'border-violet-800/40',
      chipBg: 'bg-white/5',
      chipHoverBg: 'hover:bg-white/10',
      text: 'text-white',
      textMuted: 'text-zinc-300'
    }
  },
  {
    id: 'forest',
    name: 'Forest',
    matrixColors: ['#22c55e', '#16a34a', '#86efac', '#0ea5e9'],
    matrixFade: 'rgba(0,0,0,0.14)',
    ui: {
      accentFrom: 'from-emerald-600',
      accentTo: 'to-lime-500',
      panelBg: 'bg-zinc-950/90',
      panelBorder: 'border-emerald-900/40',
      chipBg: 'bg-white/5',
      chipHoverBg: 'hover:bg-white/10',
      text: 'text-white',
      textMuted: 'text-zinc-300'
    }
  },
  {
    id: 'mono',
    name: 'Mono',
    matrixColors: ['#ffffff', '#bdbdbd', '#8a8a8a', '#e5e5e5'],
    matrixFade: 'rgba(0,0,0,0.16)',
    ui: {
      accentFrom: 'from-zinc-200',
      accentTo: 'to-zinc-500',
      panelBg: 'bg-black/90',
      panelBorder: 'border-zinc-800',
      chipBg: 'bg-white/5',
      chipHoverBg: 'hover:bg-white/10',
      text: 'text-white',
      textMuted: 'text-zinc-400'
    }
  }
];

export const DEFAULT_THEME_ID: ThemeId = 'ember';

export function getThemeById(id: string | null | undefined): Theme {
  const found = THEMES.find((t) => t.id === id);
  return found || THEMES.find((t) => t.id === DEFAULT_THEME_ID) || THEMES[0];
}

export function getRandomThemeId(exclude?: ThemeId): ThemeId {
  const ids = THEMES.map((t) => t.id).filter((id) => id !== exclude);
  const i = Math.floor(Math.random() * ids.length);
  return (ids[i] || DEFAULT_THEME_ID) as ThemeId;
}
