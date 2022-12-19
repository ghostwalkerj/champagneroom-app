<script lang="ts">
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
  // @ts-ignore
  import { getDevice } from 'framework7/lite-bundle';
  import { onMount } from 'svelte';

  import capacitorApp from 'ts/capacitor-app';
  import routes from 'ts/routes';

  import type { ShowDocument } from '$lib/ORM/models/show';
  import { currentShow, talent, talentDB } from 'lib/stores';
  import { getTalentDB } from 'lib/util';

  let key = '';

  const login = async () => {
    if (key.trim() === '') {
      return;
    }
    const preloader = f7.dialog.preloader('Loading...', 'deeppurple');
    try {
      const db = await getTalentDB(key);
      talentDB.set(db);
      const _talent = await db.talents
        .findOne()
        .where('key')
        .equals(key)
        .exec();
      if (!_talent) {
        preloader.close();
        f7.dialog.alert('Invalid Key');
        return;
      }
      talent.set(_talent);

      _talent.get$('currentShow').subscribe(showId => {
        if (showId && $talentDB) {
          $talentDB.shows
            .findOne(showId)
            .exec()
            .then((show: ShowDocument | null) => {
              if (show) {
                currentShow.set(show);
              }
            });
        }
      });

      preloader.close();
      key = '';
    } catch (e) {
      preloader.close();
      f7.dialog.alert('Error in Login: ', JSON.stringify(e));
      return;
    }
  };

  const device = getDevice();
  // Framework7 Parameters
  let f7params = {
    name: 'Champagne Room', // App name
    theme: 'auto', // Automatic theme detection

    id: 'app.champagneroom', // App bundle ID
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

<App {...f7params} dark colorTheme="purple">
  <!-- Views/Tabs container -->

  {#if $talent}
    <!-- {#if callManager}
        <VideoCall {callManager} bind:inCall />
      {/if} -->

    <Views tabs class="z-40">
      <!-- Tabbar for switching views-tabs -->
      <Toolbar tabbar labels bottom>
        <Link
          tabLink="#view-home"
          tabLinkActive
          iconIos="f7:ticket_fill"
          iconAurora="f7:ticket_fill"
          iconMd="material:confirmation_number"
          text="Tickets"
        />

        <Link
          tabLink="#view-show"
          iconIos="material:video_call"
          iconAurora="material:video_call"
          iconMd="material:video_call"
          text="Showtime"
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

      <!-- show View -->
      <View id="view-show" name="show" tab url="/show/" />

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
          Flos tuus pretiosus nunc perditus est, cum posset tibi pecuniam
          facere. Cur non nunc opus est? Aperi cella Campaniae et pecunia in
          volumine.</BlockFooter
        >
      </Page>
    </LoginScreen>
  {/if}
</App>
