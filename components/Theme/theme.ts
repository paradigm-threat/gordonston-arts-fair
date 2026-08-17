'use client';

import {createTheme, type PaletteMode} from '@mui/material/styles';

declare module '@mui/material/Button' {
  interface ButtonPropsSizeOverrides {
    'x-small': true;
  }
}

export const GOLD_LIGHT = '#7a5600';
export const GOLD_DARK = '#8ec8ff';
export const GOLD_CONTRAST_LIGHT = '#ffffff';
export const GOLD_CONTRAST_DARK = '#1a1916';
export const DARK_PAGE = '#252422';
export const DARK_PAPER = '#32302c';
export const DARK_INPUT = '#2a2824';
export const DARK_TEXT = '#f4f0e8';
export const DARK_TEXT_MUTED = '#d5cfc4';

const goldLight = GOLD_LIGHT;
const goldDark = GOLD_DARK;

export function createAppTheme(mode: PaletteMode) {
  const dark = mode === 'dark';
  return createTheme({
    palette: {
      mode,
      primary: {
        main: dark ? goldDark : goldLight,
        contrastText: dark ? GOLD_CONTRAST_DARK : GOLD_CONTRAST_LIGHT,
      },
      secondary: {
        main: dark ? '#c5e4ff' : '#5c4300',
        contrastText: dark ? GOLD_CONTRAST_DARK : GOLD_CONTRAST_LIGHT,
      },
      background: {
        default: dark ? DARK_PAGE : '#ffffff',
        paper: dark ? DARK_PAPER : '#ffffff',
      },
      text: {
        primary: dark ? DARK_TEXT : '#121212',
        secondary: dark ? DARK_TEXT_MUTED : '#333333',
      },
    },
    typography: {
      button: {
        textTransform: 'none',
        fontSize: '1rem',
        fontWeight: 600,
      },
    },
    components: {
      MuiButton: {
        defaultProps: {
          size: 'medium',
        },
        styleOverrides: {
          root: {
            minHeight: 44,
          },
        },
        variants: [
          {
            props: {size: 'x-small'},
            style: {
              textTransform: 'none',
              fontSize: '1rem',
              minHeight: 44,
              padding: '8px 16px',
            },
          },
        ],
      },
      MuiOutlinedInput: {
        styleOverrides: {
          root: {
            minHeight: 48,
            ...(dark ? {backgroundColor: DARK_INPUT} : {}),
          },
        },
      },
    },
  });
}

const theme = createAppTheme('light');

export default theme;
