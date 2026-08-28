import { createApp } from 'vue';

import { createPinia } from 'pinia';

import ui from '@nuxt/ui/vue-plugin';

import './style.css';
import App from './App.vue';
import { router } from './presentation/router';
import { usePwaStore } from './presentation/store/pwa';
import { useThemeStore } from './presentation/store/theme';

const app = createApp(App);
const pinia = createPinia();

app.use(pinia);
app.use(router);
app.use(ui);
app.mount('#app');

// Initialize theme and PWA update listener
useThemeStore().initTheme();
usePwaStore();
