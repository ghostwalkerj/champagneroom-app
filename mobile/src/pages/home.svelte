<script lang="ts">
  import {
    Block,
    BlockTitle,
    Button,
    Col,
    List,
    ListItem,
    Navbar,
    Page,
    Row,
  } from 'framework7-svelte';
  import { talent, talentDB } from '../lib/stores';
  import type { LinkDocument } from '$lib/ORM/models/link';

  $: name = '';
  $: currentLink = null as LinkDocument | null;

  $: talent.subscribe(talent => {
    if (talent) {
      name = talent.name;
      talent.get$('currentLink').subscribe(linkId => {
        if (linkId && $talentDB) {
          $talentDB.links
            .findOne(linkId)
            .exec()
            .then(link => {
              currentLink = link;
            });
        }
      });
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
