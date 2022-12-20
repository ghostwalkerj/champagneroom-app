<script lang="ts">
  import { currencyFormatter } from '$lib/util/constants';
  import { Clipboard } from '@capacitor/clipboard';
  import { Share } from '@capacitor/share';
  import { possessive } from 'i18n-possessive';

  import type { ShowDocType } from '$lib/ORM/models/show';
  import type { ShowMachineStateType } from '$lib/machines/showMachine';
  import { durationFormatter } from '$lib/util/constants';

  import {
    BlockTitle,
    Button,
    Card,
    CardContent,
    Col,
    f7,
    Icon,
    List,
    ListInput,
    ListItem,
    ListItemCell,
    MenuDropdown,
    MenuDropdownItem,
    MenuItem,
    Navbar,
    Page,
    Range,
    Row,
  } from 'framework7-svelte';
  import {
    currentShow,
    showMachineState,
    showMachineService,
    talent,
  } from 'lib/stores';
  import spacetime from 'spacetime';
  import urlJoin from 'url-join';

  const APP_URL = import.meta.env.VITE_APP_URL;
  const SHOW_PATH = import.meta.env.VITE_SHOW_PATH;

  $: showURL =
    ($currentShow && urlJoin(APP_URL, SHOW_PATH, $currentShow._id)) || '';
  $: waiting4StateChange = false;

  let name = '';
  let price = 50;
  let showName = '';
  let showDuration = 15;

  $: canCreateShow =
    !$currentShow ||
    $showMachineState?.done ||
    $showMachineState?.matches('inEscrow');
  $: canCancelShow = $showMachineState?.can('REQUEST CANCELLATION');

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

  const cancelShow = () => {
    const confirm = f7.dialog.confirm(
      'This will Refund all Tickets. Are you sure?',
      'Cancel Show',
      () => {
        $showMachineService?.send('REQUEST CANCELLATION');
        confirm.close();
      },

      () => {
        confirm.close();
      }
    );
  };

  showMachineState.subscribe((state: ShowMachineStateType | null) => {
    if (state && state.changed) {
      console.log(state.value);
      canCancelShow = state.can('REQUEST CANCELLATION');
      canCreateShow = !state.done || !state.matches('inEscrow');
    }
  });
</script>

<Page name="home">
  <!-- Top Navbar -->
  <div>
    <Navbar>
      <div class="flex justify-between w-full place-items-center">
        <!-- svelte-ignore a11y-missing-attribute -->
        <img src="/assets/logo.png" class="h-8" />
        Champagne Room Creator
        <!-- svelte-ignore a11y-missing-attribute -->
        <img src="/assets/logo.png" class=" h-8" />
      </div>
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
            <span>{durationFormatter(showDuration)}</span>
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
          class="bg-cover bg-no-repeat bg-center rounded-xl h-60  relative"
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
              <div>{durationFormatter(showDuration)}</div>
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
  {:else if $currentShow}
    <Card class="rounded-lg" outline>
      <div class="justify-start  w-full place-items-center flex  p-1 ">
        <MenuItem iconF7="menu" dropdown>
          <MenuDropdown left>
            <MenuDropdownItem href="#" class="bg-black">
              <Button iconF7="square_arrow_up" on:click={shareLink}
                >Share</Button
              >
            </MenuDropdownItem>
            {#if canCancelShow}
              <MenuDropdownItem href="#" class="bg-black">
                <Button iconF7="xmark" on:click={cancelShow}>Cancel Show</Button
                >
              </MenuDropdownItem>
            {/if}
          </MenuDropdown>
        </MenuItem>
        <div class="ml-3">Current Show</div>
      </div>

      <CardContent class="bg-color-black rounded-lg">
        <div
          class="bg-cover bg-no-repeat bg-center rounded-xl h-60  relative"
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
              <div>{durationFormatter($currentShow.duration)}</div>
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
  {/if}
</Page>
