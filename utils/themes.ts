export type ThemeId = string;

export type Theme = {
  id: ThemeId;
  name: string;
  matrixFade: string;
  matrixColors: string[];
  ui: {
    panelBorder: string;
    panelBg: string;
    accentFrom: string;
    accentTo: string;
  };
};

export const THEMES: Theme[] = [
  {
    id: 'default',
    name: 'Default',
    matrixFade: 'rgba(0,0,0,0.3)',
    matrixColors: ['#0ea5e9', '#06b6d4', '#34d399'],
    ui: {
      // Tailwind utility class fragments expected by components
      panelBorder: 'border-white/10',
      panelBg: 'bg-zinc-900/80',
      accentFrom: 'from-orange-500',
      accentTo: 'to-red-500'
    }
  }
];

export function getRandomThemeId(current?: ThemeId): ThemeId {
  return THEMES[0].id;
}

export function getThemeById(id?: ThemeId): Theme {
  return THEMES.find(t => t.id === id) || THEMES[0];
}
