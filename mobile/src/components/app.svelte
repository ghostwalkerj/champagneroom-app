<script lang="ts">
  import { KonstaProvider } from 'konsta/svelte';
  import { Preferences } from '@capacitor/preferences';

  import {
    App,
    BlockFooter,
    f7,
    f7ready,
    Link,
    List,
    ListButton,
    ListInput,
    LoginScreen,
    LoginScreenTitle,
    Page,
    Toolbar,
    View,
    Views,
  } from 'framework7-svelte';
  import { getDevice } from 'framework7/lite-bundle';
  import { onMount } from 'svelte';

  import capacitorApp from '../ts/capacitor-app';
  import routes from '../ts/routes';

  import { talent, talentDB } from '../lib/stores';
  import { getTalentDB } from '../lib/util';

  import { videoCall } from '$lib/util/videoCall';
  import type { VideoCallType } from '$lib/util/videoCall';

  let vc: VideoCallType;
  let key = '';
  let callId = '';

  const login = async () => {
    if (key.trim() === '') {
      return;
    }
    const preloader = f7.dialog.preloader('Loading...', 'deeppurple');
    const db = await getTalentDB(key);
    if (!db) {
      preloader.close();
      f7.dialog.alert('Invalid DB');
      return;
    }
    talentDB.set(db);
    const _talent = await db.talents.findOne().where('key').equals(key).exec();
    if (!_talent) {
      preloader.close();
      f7.dialog.alert('Invalid Key');
      return;
    }

    Preferences.set({
      key: 'key',
      value: key,
    });

    talent.set(_talent);

    preloader.close();
    key = '';
  };

  const device = getDevice();
  // Framework7 Parameters
  let f7params = {
    name: 'pCall', // App name
    theme: 'auto', // Automatic theme detection

    id: 'app.pcall', // App bundle ID
    // App routes
    routes: routes,
    // Register service worker (only on production build)
    serviceWorker:
      process.env.NODE_ENV === 'production'
        ? {
            path: '/service-worker.js',
          }
        : {},
    // Input profile
    input: {
      scrollIntoViewOnFocus: device.capacitor,
      scrollIntoViewCentered: device.capacitor,
    },
    // Capacitor Statusbar profile
    statusbar: {
      iosOverlaysWebView: true,
      androidOverlaysWebView: false,
    },
  };

  onMount(() => {
    f7ready(() => {
      // Init capacitor APIs (see capacitor-app.js)
      if (f7.device.capacitor) {
        capacitorApp.init(f7);
      }
      // Call F7 APIs here
    });
  });
</script>

<KonstaProvider theme="parent">
  <App {...f7params} dark colorTheme="purple">
    <!-- Views/Tabs container -->

    {#if $talent}
      <Views tabs class="z-40">
        <!-- Tabbar for switching views-tabs -->
        <Toolbar tabbar labels bottom>
          <Link
            tabLink="#view-home"
            tabLinkActive
            iconIos="f7:house_fill"
            iconAurora="f7:house_fill"
            iconMd="material:home"
            text="Home"
          />
          <Link
            tabLink="#view-profile"
            iconIos="f7:person_circle"
            iconAurora="f7:person_circle"
            iconMd="material:person"
            text="Profile"
          />

          <Link
            tabLink="#view-wallet"
            iconIos="f7:wallet_fill"
            iconAurora="f7:wallet_fill"
            iconMd="material:wallet_fill"
            text="Wallet"
          />
        </Toolbar>

        <!-- Your main view/tab, should have "view-main" class. It also has "tabActive" prop -->
        <View id="view-home" main tab tabActive url="/" />

        <!-- wallet View -->
        <View id="view-wallet" name="wallet" tab url="/wallet/" />

        <!-- profile View -->
        <View id="view-profile" name="profile" tab url="/profile/" />
      </Views>
    {:else}
      <!-- Login Screen -->
      <LoginScreen opened={true}>
        <Page loginScreen>
          <LoginScreenTitle>Talent Login</LoginScreenTitle>
          <List form>
            <ListInput
              label="Talent Key"
              type="text"
              placeholder="Your Key"
              value={key}
              onInput={e => (key = e.target.value)}
              required
              validate
            />
          </List>
          <List>
            <ListButton onClick={login}>Log In</ListButton>
          </List>
          <BlockFooter>
            Pretioso flos est, nihil ad vos nunc. Posset faciens pecuniam.
            Posuit eam ad opus nunc et adepto a pCall!</BlockFooter
          >
        </Page>
      </LoginScreen>
    {/if}
  </App>
</KonstaProvider>
