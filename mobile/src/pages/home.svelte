<script type="ts">
  import {
    Block,
    BlockFooter,
    BlockTitle,
    Button,
    Col,
    f7,
    List,
    ListButton,
    ListInput,
    ListItem,
    LoginScreen,
    LoginScreenTitle,
    Navbar,
    Page,
    Row,
  } from 'framework7-svelte';

  import { talent } from '../lib/stores';
  import { getTalentDB } from '../lib/util';

  let loginScreenOpened = false;
  let key = '';
  $: name = '';

  if (!$talent) {
    loginScreenOpened = true;
  }

  const login = async () => {
    if (key.trim() === '') {
      return;
    }
    const preloader = f7.dialog.preloader('Loading...', 'purple');
    const db = await getTalentDB(key);
    if (!db) {
      preloader.close();
      f7.dialog.alert('Invalid DB');
      return;
    }
    const _talent = await db.talents.findOne().where('key').equals(key).exec();
    if (!_talent) {
      preloader.close();

      f7.dialog.alert('Invalid Key');
      return;
    }
    talent.set(_talent);
    name = _talent.name;
    preloader.close();

    loginScreenOpened = false;
  };
</script>

<Page name="home">
  <!-- Top Navbar -->
  <Navbar title="pCall Creator" subtitle={name} />

  <!-- Login Screen -->
  <LoginScreen
    class="login-screen"
    opened={loginScreenOpened}
    onLoginScreenClosed={() => (loginScreenOpened = false)}
  >
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
        Pretioso flos est, nihil ad vos nunc. Posset faciens pecuniam. Posuit
        eam ad opus nunc et adepto a pCall!</BlockFooter
      >
    </Page>
  </LoginScreen>

  <!-- Page content -->
  <Block strong>
    {#if $talent}
      <p>Welcome {$talent.name}</p>
      <div
        class="bg-cover bg-no-repeat bg-center rounded-full h-48 w-48"
        style="background-image: url('{$talent.profileImageUrl}')"
      />
    {:else}
      <p>Welcome</p>
    {/if}

    <p>
      Each tab/view may have different layout, different navbar type (dynamic,
      fixed or static) or without navbar like this tab.
    </p>
  </Block>

  <BlockTitle>Navigation</BlockTitle>
  <List>
    <ListItem link="/about/" title="About" />
    <ListItem link="/form/" title="Form" />
  </List>

  <BlockTitle>Modals</BlockTitle>
  <Block strong>
    <Row>
      <Col width="50">
        <Button fill raised popupOpen="#my-popup">Popup</Button>
      </Col>
      <Col width="50">
        <Button fill raised loginScreenOpen="#my-login-screen"
          >Login Screen</Button
        >
      </Col>
    </Row>
  </Block>

  <BlockTitle>Panels</BlockTitle>
  <Block strong>
    <Row>
      <Col width="50">
        <Button fill raised panelOpen="left">Left Panel</Button>
      </Col>
      <Col width="50">
        <Button fill raised panelOpen="right">Right Panel</Button>
      </Col>
    </Row>
  </Block>
</Page>
