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
    CardFooter,
    Icon,
  } from 'framework7-svelte';
  import { talent, talentDB } from '../lib/stores';
  import type { LinkDocument } from '$lib/ORM/models/link';
  import { currencyFormatter } from '$lib/util/constants';
  import {
    createLinkMachineService,
    type LinkMachineServiceType,
  } from '$lib/machines/linkMachine';
  import type { Subscription } from 'xstate';
  import urlJoin from 'url-join';
  import getProfileImage from '$lib/util/profilePhoto';
  import spacetime from 'spacetime';

  const PCALL_URL = import.meta.env.VITE_PCALL_URL;
  const ROOM_PATH = import.meta.env.VITE_ROOM_PATH;

  $: name = '';
  $: currentLink = null as LinkDocument | null;
  $: waiting4StateChange = false;
  $: linkURL =
    (currentLink && urlJoin(PCALL_URL, ROOM_PATH, currentLink._id)) || '';

  let linkMachineState =
    currentLink &&
    createLinkMachineService(currentLink.linkState).getSnapshot();
  let linkService: LinkMachineServiceType;
  let linkSub: Subscription;
  let tooltipOpen = '';
  const copyLink = () => {
    navigator.clipboard.writeText(linkURL);
    tooltipOpen = 'tooltip-open';
    setTimeout(() => (tooltipOpen = ''), 2000);
  };

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

  $: claim = (linkMachineState && linkMachineState.context.linkState.claim) || {
    caller: '',
    createdAt: '',
    call: {
      startedAt: undefined,
      endedAt: undefined,
    },
  };

  $: callerProfileImage = urlJoin(PCALL_URL, getProfileImage(claim.caller));

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
  {#if currentLink && linkMachineState}
    <Card title="Your Outstanding pCall Link" class="border-2 rounded-lg ">
      <CardContent class="bg-color-black">
        {#if linkMachineState.matches('unclaimed')}
          <Row>Your pCall Link has Not Been Claimed</Row>
        {:else if linkMachineState.matches('claimed')}
          <Row>
            Your pCall Link was Claimed by:
            <Col
              class="mt-4 flex flex-row w-full place-content-evenly items-center"
            >
              <div
                class="bg-cover  bg-no-repeat bg-center rounded-full h-32 w-32"
                style="background-image: url('{callerProfileImage}')"
              />
              <div class="text-center">
                <div>{claim.caller}</div>
                <div>on</div>
                <div>{spacetime(claim.createdAt).format('nice-short')}</div>
              </div>
            </Col>
          </Row>
        {/if}
      </CardContent>
      <CardContent>
        <Row
          ><Col
            >Amount Requested:<br />{currencyFormatter.format(
              currentLink.requestedAmount
            )}</Col
          >
          <Col
            >Total Funded:<br />{currencyFormatter.format(
              linkMachineState.context.linkState.totalFunding || 0
            )}</Col
          >
        </Row>
        <Row class="pt-4">
          <Col>Funding Address:<br /></Col>
          <div class="break-all">{currentLink.fundingAddress}</div>
        </Row>
      </CardContent>
      <Button on:click={copyLink}>Copy pCall Link</Button>

      <CardFooter>
        {#if linkMachineState.context.linkState.totalFunding >= currentLink.requestedAmount}
          Link is Fully Funded!
        {/if}
      </CardFooter>
    </Card>
  {:else}
    <Card title="No Outstanding pCall Link">
      <CardContent>
        <p>Click the button below to create a new pCall link.</p>
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
