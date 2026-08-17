import React from 'react';
import {ThemeProvider} from '@mui/material/styles';
import {beforeMount} from '@playwright/experimental-ct-react/hooks';
import theme from '@components/Theme/theme';
import '../app/globals.scss';

beforeMount(async ({App}) => (
    <ThemeProvider theme={theme}>
        <App/>
    </ThemeProvider>
));
