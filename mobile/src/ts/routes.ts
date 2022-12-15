
import HomePage from 'pages/home.svelte';
import ProfilePage from 'pages/profile.svelte';
import WalletPage from 'pages/wallet.svelte';

import NotFoundPage from 'pages/404.svelte';
import Jitisi from 'pages/jitisPreview.svelte';

var routes = [
  {
    path: '/',
    component: HomePage,
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
    path: '/preview/',
    component: Jitisi
  },

  {
    path: '(.*)',
    component: NotFoundPage,
  },
];

export default routes;
