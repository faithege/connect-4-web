import Vue from 'vue';
import { BootstrapVue } from 'bootstrap-vue';
import VueRouter from 'vue-router';
import App from './App.vue';
import NewGamePage from './pages/NewGame.vue';
import GameSessionPage from './pages/GameSession.vue';

// Import Bootstrap an BootstrapVue CSS files (order is important)
import 'bootstrap/dist/css/bootstrap.css';
import 'bootstrap-vue/dist/bootstrap-vue.css';

const routes = [
  { path: '/:gameId/:playerId', component: GameSessionPage },
  { path: '/', component: NewGamePage },
];

const router = new VueRouter({
  mode: 'history',
  routes, 
});

// Make BootstrapVue available throughout your project
Vue.use(BootstrapVue);
Vue.use(VueRouter);
Vue.config.productionTip = false;

new Vue({
  render: (h) => h(App),
  router,
}).$mount('#app');
