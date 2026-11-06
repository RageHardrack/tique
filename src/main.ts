import { createApp } from 'vue';

import { createPinia } from 'pinia';

import ui from '@nuxt/ui/vue-plugin';

import './style.css';
import App from './App.vue';
import { router } from './presentation/router';
import { useAuthStore } from './presentation/store/auth';
import { useThemeStore } from './presentation/store/theme';
import { registerApiAuth } from './presentation/router/registerApiAuth';
import { registerServiceWorker } from './presentation/pwa/registerServiceWorker';

const app = createApp(App);
const pinia = createPinia();

app.use(pinia);
registerApiAuth(router, useAuthStore(pinia));
app.use(router);
app.use(ui);
app.mount('#app');

// Initialize theme and service worker
useThemeStore().initTheme();
registerServiceWorker();
