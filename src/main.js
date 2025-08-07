// file: src/main.js (Modificado)

import { mount } from 'svelte';
import './app.css';
import App from './App.svelte';
// @ts-ignore
import { initAuth } from '$lib/stores/auth.store.svelte.js';
// @ts-ignore
import { initTheme } from '$lib/stores/theme.store.svelte.js';
import 'iconify-icon'
initTheme();
initAuth();

const app = mount(App, {
  target: document.getElementById('app'),
});

export default app;