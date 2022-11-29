<script>
  import { KonstaProvider } from 'konsta/svelte';

  import { onMount } from 'svelte';
  import { getDevice } from 'framework7/lite-bundle';
  import {
    f7,
    f7ready,
    App,
    Panel,
    Views,
    View,
    Popup,
    Page,
    Navbar,
    Toolbar,
    NavRight,
    Link,
    Block,
    BlockTitle,
    LoginScreen,
    LoginScreenTitle,
    List,
    ListItem,
    ListInput,
    ListButton,
    BlockFooter,
  } from 'framework7-svelte';

  import capacitorApp from '../ts/capacitor-app';
  import routes from '../ts/routes';
  import store from '../ts/store';

  const device = getDevice();
  // Framework7 Parameters
  let f7params = {
    name: 'pCall', // App name
    theme: 'auto', // Automatic theme detection

    id: 'app.pcall', // App bundle ID
    // App store
    store: store,
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
    <!-- Left panel with cover effect-->
    <Panel left cover dark>
      <View>
        <Page>
          <Navbar title="Left Panel" />
          <Block>Left panel content goes here</Block>
        </Page>
      </View>
    </Panel>

    <!-- Right panel with reveal effect-->
    <Panel right reveal dark>
      <View>
        <Page>
          <Navbar title="Right Panel" />
          <Block>Right panel content goes here</Block>
        </Page>
      </View>
    </Panel>

    <!-- Views/Tabs container -->
    <Views tabs class="safe-areas">
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
          iconIos="f7:person_circle_fill"
          iconAurora="f7:person_circle_fill"
          iconMd="material:person_circle_fill"
          text="Profile"
        />
        <Link
          tabLink="#view-wallet"
          iconIos="f7:wallet_fill"
          iconAurora="f7:square_list_fill"
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

    <!-- Popup -->
    <Popup id="my-popup">
      <View>
        <Page>
          <Navbar title="Popup">
            <NavRight>
              <Link popupClose>Close</Link>
            </NavRight>
          </Navbar>
          <Block>
            <p>Popup content goes here.</p>
          </Block>
        </Page>
      </View>
    </Popup>
  </App>
</KonstaProvider>
