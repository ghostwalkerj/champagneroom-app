<script lang="ts">
  import { KonstaProvider } from 'konsta/svelte';

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

  import capacitorApp from './ts/capacitor-app';
  import routes from './ts/routes';

  import { createLinkMachineService } from '$lib/machines/linkMachine';
  import { CallEventType } from '$lib/ORM/models/callEvent';
  import type { LinkDocument } from '$lib/ORM/models/link';
  import CallManager from './lib/components/callManager';
  import VideoCall from './lib/components/VideoCall.svelte';
  import {
    currentLink,
    linkMachineService,
    linkMachineState,
    talent,
    talentDB,
  } from './lib/stores';
  import { getTalentDB } from './lib/util';
  import type { Unsubscriber } from 'svelte/store';

  let callManager: CallManager | undefined;
  let key = '';
  let callId = '';
  let unSubLinkMachineState: Unsubscriber;
  let subLinkState: any;
  let subLinkService: any;
  let inCall = false;

  const useLink = (link: LinkDocument) => {
    useLinkState(link, link.linkState);
    if (subLinkState) subLinkState.unsubscribe();
    subLinkState = link.get$('linkState').subscribe(_linkState => {
      useLinkState(link, _linkState);
    });
  };

  const useLinkState = (
    link: LinkDocument,
    linkState: LinkDocument['linkState']
  ) => {
    $linkMachineService?.stop();
    const _linkService = createLinkMachineService(
      linkState,
      link.updateLinkStateCallBack()
    );
    linkMachineService.set(_linkService);
    if (subLinkService) subLinkService.unsubscribe();
    subLinkService = _linkService.subscribe(state => {
      linkMachineState.set(state);
    });
  };

  const initCallManager = (_callId: string) => {
    if (callId === _callId) return;

    callId = _callId;
    callManager = new CallManager(_callId);
    callManager.callService.onEvent(ce => {
      console.log('call event', ce);
      // Log call events on the Talent side
      if (ce) {
        let eventType: CallEventType | undefined;
        switch (ce.type) {
          case 'CALL INCOMING':
            eventType = CallEventType.ATTEMPT;
            break;

          case 'CALL ACCEPTED':
            eventType = CallEventType.ANSWER;
            break;

          case 'CALL CONNECTED':
            eventType = CallEventType.CONNECT;
            $linkMachineService?.send('CALL CONNECTED');
            break;

          case 'CALL UNANSWERED':
            eventType = CallEventType.NO_ANSWER;
            break;

          case 'CALL REJECTED':
            eventType = CallEventType.REJECT;
            break;

          case 'CALL DISCONNECTED':
            eventType = CallEventType.DISCONNECT;
            $linkMachineService?.send('CALL DISCONNECTED');
            break;

          case 'CALL HANGUP':
            eventType = CallEventType.HANGUP;
            break;
        }
        if (eventType !== undefined) {
          $currentLink?.createCallEvent(eventType).then(callEvent => {
            $linkMachineService?.send({
              type: 'CALL EVENT RECEIVED',
              callEvent,
            });
          });
        }
      }
    });
  };

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

      _talent.get$('currentLink').subscribe(linkId => {
        if (linkId && $talentDB) {
          $talentDB.links
            .findOne(linkId)
            .exec()
            .then(link => {
              if (link) {
                currentLink.set(link);
                if (unSubLinkMachineState) unSubLinkMachineState();
                unSubLinkMachineState = linkMachineState.subscribe(state => {
                  if (state?.changed) {
                    if (state.matches('claimed.canCall'))
                      initCallManager(link.callId);
                    else {
                      callManager?.destroy();
                      callManager = undefined;
                      callId = '';
                    }
                  }
                });
                useLink(link);
              }
            });
        }
      });

      preloader.close();
      key = '';
    } catch (e) {
      preloader.close();
      f7.dialog.alert('Errror in Login: ', JSON.stringify(e));
      return;
    }
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
      {#if callManager}
        <VideoCall {callManager} bind:inCall />
      {/if}

      {#if !inCall}
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
              tabLink="#view-preview"
              iconIos="material:video_call"
              iconAurora="material:video_call"
              iconMd="material:video_call"
              text="Preview"
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

          <!-- Preview View -->
          <View id="view-preview" name="preview" tab url="/preview/" />

          <!-- wallet View -->
          <View id="view-wallet" name="wallet" tab url="/wallet/" />

          <!-- profile View -->
          <View id="view-profile" name="profile" tab url="/profile/" />
        </Views>
      {/if}
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
