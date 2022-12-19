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
    currentShow,
    linkMachineService,
    linkMachineState,
    talent,
  } from 'lib/stores';
  import { formatLinkState } from 'lib/util';
  import spacetime from 'spacetime';
  import urlJoin from 'url-join';
  import type { ShowDocType } from '$lib/ORM/models/show';

  const APP_URL = import.meta.env.VITE_APP_URL;
  const SHOW_PATH = import.meta.env.VITE_SHOW_PATH;

  $: showURL =
    ($currentShow && urlJoin(APP_URL, SHOW_PATH, $currentShow._id)) || '';
  $: waiting4StateChange = false;

  let name = '';
  let price = 50;
  let showName = '';
  let showDuration = 15;

  const duration2String = (duration: number): string => {
    const hours = Math.floor(duration / 60);
    const minutes = duration % 60;
    const hoursString = hours > 0 ? `${hours}h ` : '';
    const minuteString = minutes > 0 ? `${minutes}m` : '';
    return `${hoursString} ${minuteString}`;
  };

  $: canCreateShow = !$currentShow;

  $talent?.get$('name').subscribe((_name: string): void => {
    name = _name;
    showName = possessive(name, 'en') + ' Show';
  });

  const shareLink = async () => {
    if ((await Share.canShare()).value === true) {
      Share.share({
        title: 'Ticket Link',
        url: showURL,
        dialogTitle: 'Share Show Link',
      });
    } else {
      Clipboard.write({
        string: showURL,
      });
    }
  };

  const onAmountChange = (value: number) => {
    price = value;
  };

  const onDurationChange = (value: number) => {
    showDuration = value;
  };

  const createShow = () => {
    waiting4StateChange = true;
    const show = {
      name: showName,
      duration: showDuration,
      price: price,
      maxNumTickets: 1,
      coverPhotoUrl: $talent?.profileImageUrl,
    } as Partial<ShowDocType>;
    $talent?.createShow(show).then(show => {
      Clipboard.write({
        string: urlJoin(APP_URL, SHOW_PATH, show._id),
      });
      waiting4StateChange = false;
    });
  };
</script>

<Page name="home">
  <!-- Top Navbar -->
  <div>
    <Navbar title="Champagne Room Creator" subtitle={name} class="relative">
      <!-- svelte-ignore a11y-missing-attribute -->
      <img src="/assets/logo.png" class="absolute top-0 left-0  h-full p-1" />
      <!-- svelte-ignore a11y-missing-attribute -->
      <img src="/assets/logo.png" class="absolute top-0 right-0  h-full p-1" />
    </Navbar>
  </div>
  <!-- Create Show -->
  {#if canCreateShow}
    <Card class="rounded-lg" outline>
      <List noHairlinesMd>
        <ListInput
          label="Title"
          type="text"
          required
          clearButton
          validate
          minlength="3"
          maxlength="50"
          bind:value={showName}
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
              <Icon ios="f7:timer" aurora="f7:timer" md="material:schedule" />
            </ListItemCell>
            <ListItemCell class="flex-shrink-3">
              <Range
                min={15}
                max={120}
                step={15}
                label={false}
                value={showDuration}
                onRangeChange={onDurationChange}
              />
            </ListItemCell>
            <ListItemCell class="width-auto flex-shrink-0">
              <Icon
                ios="f7:timer_fill"
                aurora="f7:timer_fill"
                md="material:watch_later"
              />
            </ListItemCell>
          </ListItem>
        </div>

        <div>
          <BlockTitle class="display-flex justify-content-space-between mt-3">
            <span>Ticket Price</span>
            <span>${price}</span>
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
                value={price}
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
            on:click={createShow}
            disabled={waiting4StateChange}>Create Show</Button
          ></Col
        ></Row
      >
    </Card>

    <!-- Show Preview -->
    <Card class="rounded-lg" outline>
      <CardContent class="bg-color-black rounded-lg">
        <div
          class="bg-cover bg-no-repeat bg-center rounded-xl h-64  relative"
          style="background-image: url('{$talent?.profileImageUrl}')"
        />
        <div class="absolute top-4 left-6 text-lg">{showName}</div>

        <div class="text-center">
          <div>{name}</div>
        </div>
        <Row class="mt-4">
          <Col class="flex flex-col items-center">
            <div class="text-center">
              <div>Duration</div>
              <div>{duration2String(showDuration)}</div>
            </div>
          </Col>
          <Col class="flex flex-col items-center">
            <div class="text-center">
              <div>Price</div>
              <div>${price}</div>
            </div>
          </Col>
        </Row>
      </CardContent>
    </Card>
  {/if}

  {#if $currentShow}
    <Card class="rounded-lg" title="Current Show" outline>
      <CardContent class="bg-color-black rounded-lg">
        <div
          class="bg-cover bg-no-repeat bg-center rounded-xl h-64  relative"
          style="background-image: url('{$currentShow.coverPhotoUrl}')"
        />
        <div class="absolute top-4 left-6 text-lg">{$currentShow.name}</div>

        <div class="text-center">
          <div>{name}</div>
        </div>
        <Row class="mt-4">
          <Col class="flex flex-col items-center">
            <div class="text-center">
              <div>Duration</div>
              <div>{duration2String($currentShow.duration)}</div>
            </div>
          </Col>
          <Col class="flex flex-col items-center">
            <div class="text-center">
              <div>Price</div>
              <div>${$currentShow.price}</div>
            </div>
          </Col>
        </Row>
      </CardContent>
    </Card>
    <Card class="rounded-lg" outline>
      <CardContent>
        <List>
          <ListItem title="Created">
            {spacetime($currentShow.createdAt).format('nice-short')}
          </ListItem>
          <ListItem title="Total Tickets">
            {$currentShow.maxNumTickets}
          </ListItem>
          <ListItem title="Tickets Sold">
            {$currentShow.salesStats.ticketsSold}
          </ListItem>
          <ListItem title="Sales">
            {currencyFormatter.format($currentShow.salesStats.totalSales)}
          </ListItem>
        </List>
      </CardContent>
    </Card>

    <Button on:click={shareLink}>Share Show Link</Button>
  {/if}
</Page>
