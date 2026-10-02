import { useColorScheme } from 'react-native';

export interface Palette {
  bg: string;
  surface: string;
  surfaceAlt: string;
  text: string;
  muted: string;
  primary: string;
  onPrimary: string;
  accent: string;
  danger: string;
  border: string;
  secret: string;
}

export const light: Palette = {
  bg: '#F7F4EC',
  surface: '#FFFFFF',
  surfaceAlt: '#EFEADB',
  text: '#14302F',
  muted: '#5C706F',
  primary: '#0F5C5A',
  onPrimary: '#FFFFFF',
  accent: '#A9801F',
  danger: '#B3402F',
  border: '#E3DDCB',
  secret: '#3B3A66',
};

export const dark: Palette = {
  bg: '#0C1B1B',
  surface: '#142828',
  surfaceAlt: '#1B3333',
  text: '#EAF1EE',
  muted: '#9DB3B0',
  primary: '#5FC2B8',
  onPrimary: '#06201F',
  accent: '#E0BC66',
  danger: '#F08A78',
  border: '#223838',
  secret: '#A9A6F0',
};

export const space = { xs: 4, sm: 8, md: 12, lg: 16, xl: 24, xxl: 32 } as const;
export const radius = { sm: 8, md: 14, lg: 20, pill: 999 } as const;

export function useTheme(): Palette {
  return useColorScheme() === 'dark' ? dark : light;
}
