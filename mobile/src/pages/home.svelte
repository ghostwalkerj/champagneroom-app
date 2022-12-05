<script lang="ts">
  import {
    createLinkMachineService,
    type LinkMachineServiceType,
  } from '$lib/machines/linkMachine';
  import { ActorType, type LinkDocument } from '$lib/ORM/models/link';
  import { TransactionReasonType } from '$lib/ORM/models/transaction';
  import { currencyFormatter } from '$lib/util/constants';
  import getProfileImage from '$lib/util/profilePhoto';
  import {
    Block,
    BlockTitle,
    Button,
    Card,
    CardContent,
    Col,
    Icon,
    List,
    ListItem,
    ListItemCell,
    Navbar,
    Page,
    Range,
    Row,
  } from 'framework7-svelte';
  import spacetime from 'spacetime';
  import urlJoin from 'url-join';
  import type { Subscription } from 'xstate';
  import { talent, talentDB } from '../lib/stores';
  import { formatLinkState } from '../lib/util';
  import { Clipboard } from '@capacitor/clipboard';

  const PCALL_URL = import.meta.env.VITE_PCALL_URL;
  const ROOM_PATH = import.meta.env.VITE_ROOM_PATH;

  $: name = '';
  $: currentLink = null as LinkDocument | null;
  $: linkURL =
    (currentLink && urlJoin(PCALL_URL, ROOM_PATH, currentLink._id)) || '';

  let linkMachineState =
    currentLink &&
    createLinkMachineService(currentLink.linkState).getSnapshot();
  let linkService: LinkMachineServiceType;
  let linkSub: Subscription;

  let amount = 50;

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

  $: showCurrentLink = !canCreateLink;

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
        canCreateLink = !currentLink || state.done || state.matches('inEscrow');
      }
    });
  };

  const useLink = (link: LinkDocument) => {
    currentLink = link;
    useLinkState(link, link.linkState);
    link.get$('linkState').subscribe(_linkState => {
      useLinkState(link, _linkState);
    });
  };

  const cancelLink = () => {
    if (linkService && linkMachineState) {
      linkService.send({
        type: 'REQUEST CANCELLATION',
        cancel: {
          createdAt: new Date().getTime(),
          canceledInState: JSON.stringify(linkMachineState.value),
          canceler: ActorType.TALENT,
        },
      });
    }
  };

  const issueRefund = async () => {
    if (currentLink && linkMachineState) {
      // Create and save a faux transaction
      const transaction = await currentLink.createTransaction({
        hash: '0x1234567890',
        block: 1234567890,
        to: '0x1234567890',
        from: currentLink.fundingAddress,
        value: linkMachineState.context.linkState.totalFunding.toString(),
        reason: TransactionReasonType.REFUND,
      });

      linkService.send({
        type: 'REFUND RECEIVED',
        transaction,
      });
    }
  };

  const copyLink = () => {
    Clipboard.write({
      string: linkURL,
    });
  };

  const onAmountChange = value => {
    amount = value;
  };

  const createLink = () => {
    $talent?.createLink(amount).then(link => {
      Clipboard.write({
        string: urlJoin(PCALL_URL, ROOM_PATH, link._id),
      });
    });
  };
</script>

<Page name="home">
  <!-- Top Navbar -->
  <Navbar title="pCall Creator" subtitle={name} />

  <!-- Current Link -->
  {#if showCurrentLink && currentLink && linkMachineState}
    <Card title="Your Outstanding pCall Link" class="rounded-lg" outline>
      <CardContent class="bg-color-black">
        {#if linkMachineState.matches('unclaimed')}
          <Row>Your pCall Link has Not Been Claimed</Row>
        {:else if linkMachineState.matches('claimed')}
          <Row>
            pCall Link was Claimed by:
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
        {#if linkMachineState.context.linkState.totalFunding >= currentLink.requestedAmount}
          <Row>Link is Fully Funded!</Row>
        {/if}
        <Row class="pt-4">
          <Col>Funding Address:<br /></Col>
          <div class="break-all">{currentLink.fundingAddress}</div>
        </Row>
        <Row class="pt-4">
          <Col
            >Status: <span class="italic">
              {formatLinkState(linkMachineState)}
            </span>
          </Col>
        </Row>
      </CardContent>
      <Button on:click={copyLink}>Copy pCall Link</Button>
    </Card>

    <!-- Cancel Link -->
    {#if canCancelLink}
      <Card title="Cancel Your pCall Link" class="rounded-lg" outline>
        {#if linkMachineState.context.linkState.totalFunding > 0}
          <CardContent class="bg-color-black">
            <Row>
              <Col>
                {currencyFormatter.format(
                  linkMachineState.context.linkState.totalFunding
                )} will be refunded to "{linkMachineState.context.linkState
                  .claim?.caller}"
              </Col>
            </Row>
          </CardContent>
        {/if}

        <Block strong>
          <Row>
            <Col>
              <Button fill round on:click={cancelLink}>Cancel</Button>
            </Col>
          </Row>
        </Block>
      </Card>
    {/if}

    <!-- Issue Refund -->
    {#if linkMachineState && linkMachineState.matches('claimed.requestedCancellation.waiting4Refund')}
      <Card title="Issue Refund" class="rounded-lg" outline>
        <Block strong>
          <Row class="pb-4">
            <Col>
              Send {currencyFormatter.format(
                linkMachineState.context.linkState.totalFunding
              )} to "{linkMachineState.context.linkState.claim?.caller}"
            </Col>
          </Row>
          <Row>
            <Col>
              <Button fill round on:click={issueRefund}>Issue Refund</Button>
            </Col>
          </Row>
        </Block>
      </Card>
    {/if}
  {/if}

  <!-- Create Link -->
  {#if canCreateLink}
    <Card title="Create new pCall Link" class="rounded-lg" outline>
      <BlockTitle class="display-flex justify-content-space-between mt-6">
        <span>Amount</span>
        <span>${amount}</span>
      </BlockTitle>
      <List simpleList>
        <ListItem>
          <ListItemCell class="width-auto flex-shrink-0">
            <Icon
              ios="f7:money_dollar_circle"
              aurora="f7:money_dollar_circle"
              md="material:attach_money"
            />
          </ListItemCell>
          <ListItemCell class="flex-shrink-3">
            <Range
              min={1}
              max={2000}
              step={10}
              label={true}
              value={amount}
              onRangeChange={onAmountChange}
            />
          </ListItemCell>
          <ListItemCell class="width-auto flex-shrink-0">
            <Icon
              ios="f7:money_dollar_circle_fill"
              aurora="f7:money_dollar_circle_fill"
              md="material:monetization_on"
            />
          </ListItemCell>
        </ListItem>
      </List>
      <Row class="p-4">
        <Col
          ><Button fill round on:click={createLink}>Create pCall Link</Button
          ></Col
        ></Row
      >
    </Card>
  {/if}
</Page>
