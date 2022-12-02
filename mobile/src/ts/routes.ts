
import AboutPage from '../pages/about.svelte';
import HomePage from '../pages/home.svelte';
import ProfilePage from '../pages/profile.svelte';
import WalletPage from '../pages/wallet.svelte';

import NotFoundPage from '../pages/404.svelte';

var routes = [
  {
    path: '/',
    component: HomePage,
  },
  {
    path: '/about/',
    component: AboutPage,
  },

  {
    path: '/wallet/',
    component: WalletPage
  },

  {
    path: '/profile/',
    component: ProfilePage
  },

  {
    path: '(.*)',
    component: NotFoundPage,
  },
];

export default routes;
