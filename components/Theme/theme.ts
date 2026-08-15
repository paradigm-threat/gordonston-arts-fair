'use client';

import {createTheme, type PaletteMode} from '@mui/material/styles';

declare module '@mui/material/Button' {
  interface ButtonPropsSizeOverrides {
    'x-small': true;
  }
}

export function createAppTheme(mode: PaletteMode) {
  return createTheme({
    palette: {
      mode,
      background: {
        default: mode === 'dark' ? '#121212' : '#ffffff',
        paper: mode === 'dark' ? '#1e1e1e' : '#ffffff',
      },
    },
    components: {
      MuiButton: {
        variants: [
          {
            props: {size: 'x-small'},
            style: {
              textTransform: 'none',
              fontSize: '8px',
              padding: '2px 8px',
            },
          },
        ],
      },
    },
  });
}

const theme = createAppTheme('light');

export default theme;
