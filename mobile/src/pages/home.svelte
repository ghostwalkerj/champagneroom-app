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
    Card,
    CardContent,
  } from 'framework7-svelte';
  import { talent, talentDB } from '../lib/stores';
  import type { LinkDocument } from '$lib/ORM/models/link';
  import { currencyFormatter } from '$lib/util/constants';
  import {
    createLinkMachineService,
    type LinkMachineServiceType,
  } from '$lib/machines/linkMachine';
  import type { Subscription } from 'xstate';

  $: name = '';
  $: currentLink = null as LinkDocument | null;
  $: waiting4StateChange = false;

  let linkMachineState =
    currentLink &&
    createLinkMachineService(currentLink.linkState).getSnapshot();
  let linkService: LinkMachineServiceType;
  let linkSub: Subscription;

  $: canCancelLink =
    linkMachineState &&
    linkMachineState.can({
      type: 'REQUEST CANCELLATION',
      cancel: undefined,
    });

  $: canCreateLink =
    !currentLink ||
    (linkMachineState && linkMachineState.done) ||
    (linkMachineState && linkMachineState.matches('inEscrow'));

  $: talent.subscribe(talent => {
    if (talent) {
      name = talent.name;
      talent.get$('currentLink').subscribe(linkId => {
        if (linkId && $talentDB) {
          $talentDB.links
            .findOne(linkId)
            .exec()
            .then(link => {
              if (link) useLink(link);
            });
        }
      });
    }
  });

  const useLinkState = (
    link: LinkDocument,
    linkState: LinkDocument['linkState']
  ) => {
    if (linkService) linkService.stop();
    if (linkSub) linkSub.unsubscribe();

    linkService = createLinkMachineService(
      linkState,
      link.updateLinkStateCallBack()
    );
    linkSub = linkService.subscribe(state => {
      linkMachineState = state;

      if (state.changed) {
        canCancelLink = state.can({
          type: 'REQUEST CANCELLATION',
          cancel: undefined,
        });
        canCreateLink = state.done ?? true;
      }
    });
  };

  const useLink = (link: LinkDocument) => {
    currentLink = link;
    waiting4StateChange = false; // link changed, so can submit again
    useLinkState(link, link.linkState);
    link.get$('linkState').subscribe(_linkState => {
      waiting4StateChange = false; // link changed, so can submit again
      useLinkState(link, _linkState);
    });
  };
</script>

<Page name="home">
  <!-- Top Navbar -->
  <Navbar title="pCall Creator" subtitle={name} />

  <!-- Current Link -->
  {#if currentLink}
    <Card title="Your Outstanding pCall Link">
      <CardContent>
        <Row
          ><Col
            >Amount Requested: {currencyFormatter.format(
              currentLink.requestedAmount
            )}</Col
          >
          <Col
            >Total Funded: {currencyFormatter.format(
              currentLink.linkState.totalFunding || 0
            )}</Col
          >
        </Row>
      </CardContent>
    </Card>
  {/if}

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
