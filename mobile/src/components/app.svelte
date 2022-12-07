<script lang="ts">
  import { Preferences } from '@capacitor/preferences';
  import { Block, Dialog, KonstaProvider } from 'konsta/svelte';

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
    Navbar,
    Page,
    Popup,
    Toolbar,
    View,
    Views,
  } from 'framework7-svelte';
  // @ts-ignore
  import { getDevice } from 'framework7/lite-bundle';
  import { onMount } from 'svelte';

  import capacitorApp from '../ts/capacitor-app';
  import routes from '../ts/routes';

  import { createLinkMachineService } from '$lib/machines/linkMachine';
  import type { LinkDocument } from '$lib/ORM/models/link';
  import type { VideoCallType } from '$lib/util/videoCall';
  import { videoCall } from '$lib/util/videoCall';
  import {
    currentLink,
    linkMachineService,
    linkMachineState,
    talent,
    talentDB,
  } from '../lib/stores';
  import { getTalentDB } from '../lib/util';
  import { CallEventType } from '$lib/ORM/models/callEvent';
  import { get } from 'svelte/store';

  let vc: VideoCallType;
  let key = '';
  let callId = '';
  let inCall = false;
  let callAlert: Dialog['Dialog'];

  const useLink = (link: LinkDocument) => {
    useLinkState(link, link.linkState);
    link.get$('linkState').subscribe(_linkState => {
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
    _linkService.subscribe(state => {
      linkMachineState.set(state);
    });
  };

  const initVC = (_callId: string) => {
    if (callId === _callId) return;

    callId = _callId;
    if (vc) vc.destroy();

    vc = videoCall(_callId);
    vc.callEvent.subscribe(ce => {
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

    vc.callMachineState.subscribe(cs => {
      // Logic for all of the possible call states
      if (cs) {
        if (cs.changed) {
          if (cs.matches('receivingCall')) {
            let callerName = $currentLink?.linkState.claim?.caller || 'Unknown';

            const callText = `pCall from ${callerName}`;
            callAlert.setText(callText);
            callAlert.open();
          } else callAlert.close();
          inCall = cs.matches('inCall');
        }
      }
    });
  };

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

    _talent.get$('currentLink').subscribe(linkId => {
      if (linkId && $talentDB) {
        $talentDB.links
          .findOne(linkId)
          .exec()
          .then(link => {
            if (link) {
              currentLink.set(link);

              linkMachineState.subscribe(state => {
                if (state?.changed) {
                  if (state.matches('claimed.canCall')) initVC(link.callId);
                  else {
                    vc?.destroy();
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

      callAlert = f7.dialog.create({
        title: 'Incoming Call',
        text: 'You have an incoming call',
        buttons: [
          {
            text: 'Answer',
            onClick: () => {
              vc?.rejectCall();
            },
          },
        ],
      });
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
