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

  $: name = '';

  $: talent.subscribe(talent => {
    if (talent) {
      name = talent.name;
    }
  });
</script>

<Page name="home">
  <!-- Top Navbar -->
  <Navbar title="pCall Creator" subtitle={name} />

  <!-- Page content -->
  <Block strong>
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
