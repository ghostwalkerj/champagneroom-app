<script lang="ts">
  import { ActorType } from '$lib/ORM/models/link';
  import { TransactionReasonType } from '$lib/ORM/models/transaction';
  import { currencyFormatter } from '$lib/util/constants';
  import getProfileImage from '$lib/util/profilePhoto';
  import { Clipboard } from '@capacitor/clipboard';
  import { Share } from '@capacitor/share';
  import { possessive } from 'i18n-possessive';

  import {
    Block,
    BlockTitle,
    Button,
    Card,
    CardContent,
    Col,
    Icon,
    List,
    ListInput,
    ListItem,
    ListItemCell,
    Navbar,
    Page,
    Range,
    Row,
  } from 'framework7-svelte';
  import {
    currentLink,
    linkMachineService,
    linkMachineState,
    talent,
  } from 'lib/stores';
  import { formatLinkState } from 'lib/util';
  import spacetime from 'spacetime';
  import urlJoin from 'url-join';

  const PCALL_URL = import.meta.env.VITE_PCALL_URL;
  const ROOM_PATH = import.meta.env.VITE_ROOM_PATH;

  $: linkURL =
    ($currentLink && urlJoin(PCALL_URL, ROOM_PATH, $currentLink._id)) || '';
  $: waiting4StateChange = false;

  let name = '';
  let amount = 50;
  let showName = '';
  let showDuration = 15;

  const duration2String = (duration: number): string => {
    const hours = Math.floor(duration / 60);
    const minutes = duration % 60;
    return `${hours}h ${minutes}m`;
  };

  $: canCancelLink = $linkMachineState?.can({
    type: 'REQUEST CANCELLATION',
    cancel: undefined,
  });

  $: canCreateLink =
    !$currentLink ||
    $linkMachineState?.done ||
    $linkMachineState?.matches('inEscrow');

  $: showCurrentLink = !canCreateLink;

  $talent?.get$('name').subscribe((_name: string): void => {
    name = _name;
    showName = possessive(name, 'en') + ' Show';
  });

  $: claim = $linkMachineState?.context.linkState.claim || {
    caller: '',
    createdAt: '',
    call: {
      startedAt: undefined,
      endedAt: undefined,
    },
  };

  $: callerProfileImage = urlJoin(PCALL_URL, getProfileImage(claim.caller));

  linkMachineState.subscribe(state => {
    if (state?.changed) {
      canCancelLink = state.can({
        type: 'REQUEST CANCELLATION',
        cancel: undefined,
      });
      canCreateLink = !$currentLink || state.done || state.matches('inEscrow');
    }
  });

  const cancelLink = () => {
    $linkMachineService?.send({
      type: 'REQUEST CANCELLATION',
      cancel: {
        createdAt: new Date().getTime(),
        canceledInState: JSON.stringify($linkMachineState?.value),
        canceler: ActorType.TALENT,
      },
    });
  };

  const issueRefund = async () => {
    // Create and save a faux transaction
    const transaction = await $currentLink!.createTransaction({
      hash: '0x1234567890',
      block: 1234567890,
      to: '0x1234567890',
      from: $currentLink!.fundingAddress,
      value: $linkMachineState!.context.linkState.totalFunding.toString(),
      reason: TransactionReasonType.REFUND,
    });

    $linkMachineService?.send({
      type: 'REFUND RECEIVED',
      transaction,
    });
  };

  const shareLink = async () => {
    if ((await Share.canShare()).value === true) {
      Share.share({
        title: 'pCall Link',
        url: linkURL,
        dialogTitle: 'Share pCall Link',
      });
    } else {
      Clipboard.write({
        string: linkURL,
      });
    }
  };

  const onAmountChange = value => {
    amount = value;
  };

  const onDurationChange = value => {
    showDuration = value;
  };

  const createLink = () => {
    waiting4StateChange = true;
    $talent?.createLink(amount).then(link => {
      Clipboard.write({
        string: urlJoin(PCALL_URL, ROOM_PATH, link._id),
      });
      waiting4StateChange = false;
    });
  };
</script>

<Page name="home">
  <!-- Top Navbar -->
  <Navbar title="Champagne Room Creator" subtitle={name} />

  <!-- Current Link -->
  {#if showCurrentLink && $currentLink && $linkMachineState}
    <Card title="Your Outstanding pCall Link" class="rounded-lg" outline>
      <CardContent class="bg-color-black">
        {#if $linkMachineState?.matches('unclaimed')}
          <Row>Your pCall Link has Not Been Claimed</Row>
        {:else if $linkMachineState?.matches('claimed')}
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
              $currentLink.requestedAmount
            )}</Col
          >
          <Col
            >Total Funded:<br />{currencyFormatter.format(
              $linkMachineState.context.linkState.totalFunding || 0
            )}</Col
          >
        </Row>
        {#if $linkMachineState.context.linkState.totalFunding >= $currentLink.requestedAmount}
          <Row>Link is Fully Funded!</Row>
        {/if}
        <Row class="pt-4">
          <Col>Funding Address:<br /></Col>
          <div class="break-all">{$currentLink.fundingAddress}</div>
        </Row>
        <Row class="pt-4">
          <Col
            >Status: <span class="italic">
              {formatLinkState($linkMachineState)}
            </span>
          </Col>
        </Row>
      </CardContent>
      <Button on:click={shareLink}>Share pCall Link</Button>
    </Card>

    <!-- Cancel Link -->
    {#if canCancelLink}
      <Card title="Cancel Your pCall Link" class="rounded-lg" outline>
        {#if $linkMachineState.context.linkState.totalFunding > 0}
          <CardContent class="bg-color-black">
            <Row>
              <Col>
                {currencyFormatter.format(
                  $linkMachineState.context.linkState.totalFunding
                )} will be refunded to "{$linkMachineState.context.linkState
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
    {#if $linkMachineState.matches('claimed.requestedCancellation.waiting4Refund')}
      <Card title="Issue Refund" class="rounded-lg" outline>
        <Block strong>
          <Row class="pb-4">
            <Col>
              Send {currencyFormatter.format(
                $linkMachineState.context.linkState.totalFunding
              )} to "{$linkMachineState.context.linkState.claim?.caller}"
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

  <!-- Create Ticket -->
  {#if canCreateLink}
    <Card title="Create a New Show" class="rounded-lg" outline>
      <List noHairlinesMd>
        <ListInput
          label="Title"
          type="text"
          required
          clearButton
          validate
          minlength="3"
          maxlength="50"
          value={showName}
        />

        <ListInput
          label="Number of Tickets"
          type="number"
          placeholder="1"
          disabled
        />

        <div>
          <BlockTitle class="display-flex justify-content-space-between mt-3">
            <span>Show Duration</span>
            <span>{duration2String(showDuration)}</span>
          </BlockTitle>
          <ListItem class="-mt-2">
            <ListItemCell class="width-auto flex-shrink-0">
              <Icon
                ios="f7:money_dollar_circle"
                aurora="f7:money_dollar_circle"
                md="material:attach_money"
              />
            </ListItemCell>
            <ListItemCell class="flex-shrink-3">
              <Range
                min={15}
                max={120}
                step={15}
                label={true}
                value={showDuration}
                onRangeChange={onDurationChange}
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
        </div>

        <div>
          <BlockTitle class="display-flex justify-content-space-between mt-3">
            <span>Ticket Price</span>
            <span>${amount}</span>
          </BlockTitle>
          <ListItem class="-mt-2">
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
        </div>
      </List>
      <Row class="p-4">
        <Col
          ><Button
            fill
            round
            on:click={createLink}
            disabled={waiting4StateChange}>Create Ticket Sales Link</Button
          ></Col
        ></Row
      >
    </Card>
  {/if}
</Page>
