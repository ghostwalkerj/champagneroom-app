<script type="ts">
  import {
    Block,
    BlockTitle,
    Button,
    List,
    ListInput,
    ListItem,
    Navbar,
    Page,
    Range,
    Row,
    Toggle,
    Col,
  } from 'framework7-svelte';
  import StarRating from 'svelte-star-rating';

  import { talent } from '../lib/stores';
</script>

{#if $talent}
  <Page name="Profile">
    <Navbar title="Profile" />
    <Block strong>
      <Row>
        <Col width="100" class="flex place-content-center">
          <div
            class=" bg-cover bg-no-repeat bg-center rounded-full h-48 w-48"
            style="background-image: url('{$talent.profileImageUrl}')"
          />
        </Col>
      </Row>
      <Row>
        <Col width="100" class="flex pt-4 place-content-center">
          <StarRating rating={$talent.stats.ratingAvg ?? 0} />
        </Col>
      </Row>
    </Block>
    <List noHairlinesMd>
      <ListInput label="Name" type="text" placeholder={$talent.name} />

      <ListInput label="Gender" type="select">
        <option>Male</option>
        <option>Female</option>
      </ListInput>

      <ListInput
        label="Birth date"
        type="date"
        placeholder="Birth day"
        value="2014-04-30"
      />

      <ListItem title="Toggle">
        <span slot="after">
          <Toggle />
        </span>
      </ListItem>

      <ListInput label="Range" input={false}>
        <span slot="after">
          <Range value={50} min={0} max={100} step={1} />
        </span>
      </ListInput>

      <ListInput type="textarea" label="Textarea" placeholder="Bio" />
      <ListInput
        type="textarea"
        label="Resizable"
        placeholder="Bio"
        resizable
      />
    </List>

    <BlockTitle>Buttons</BlockTitle>
    <Block strong>
      <Row tag="p">
        <Button class="col">Button</Button>
        <Button class="col" fill>Fill</Button>
      </Row>
      <Row tag="p">
        <Button class="col" raised>Raised</Button>
        <Button class="col" raised fill>Raised Fill</Button>
      </Row>
      <Row tag="p">
        <Button class="col" round>Round</Button>
        <Button class="col" round fill>Round Fill</Button>
      </Row>
      <Row tag="p">
        <Button class="col" outline>Outline</Button>
        <Button class="col" round outline>Outline Round</Button>
      </Row>
      <Row tag="p">
        <Button class="col" small outline>Small</Button>
        <Button class="col" small round outline>Small Round</Button>
      </Row>
      <Row tag="p">
        <Button class="col" small fill>Small</Button>
        <Button class="col" small round fill>Small Round</Button>
      </Row>
      <Row tag="p">
        <Button class="col" large raised>Large</Button>
        <Button class="col" large fill raised>Large Fill</Button>
      </Row>
      <Row tag="p">
        <Button class="col" large fill raised color="red">Large Red</Button>
        <Button class="col" large fill raised color="green">Large Green</Button>
      </Row>
    </Block>

    <BlockTitle>Checkbox group</BlockTitle>
    <List>
      <ListItem checkbox name="my-checkbox" value="Books" title="Books" />
      <ListItem checkbox name="my-checkbox" value="Movies" title="Movies" />
      <ListItem checkbox name="my-checkbox" value="Food" title="Food" />
    </List>

    <BlockTitle>Radio buttons group</BlockTitle>
    <List>
      <ListItem radio name="radio" value="Books" title="Books" />
      <ListItem radio name="radio" value="Movies" title="Movies" />
      <ListItem radio name="radio" value="Food" title="Food" />
    </List>
  </Page>
{/if}
