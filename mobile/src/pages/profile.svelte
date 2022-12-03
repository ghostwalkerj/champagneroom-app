<script type="ts">
  import {
    Block,
    BlockTitle,
    Button,
    Col,
    f7,
    List,
    ListInput,
    ListItem,
    Navbar,
    Page,
    Range,
    Row,
    Toggle,
  } from 'framework7-svelte';
  import StarRating from 'svelte-star-rating';

  import { talent } from '../lib/stores';

  import {
    Camera,
    CameraResultType,
    CameraDirection,
    CameraSource,
  } from '@capacitor/camera';

  const takePicture = async () => {
    const image = await Camera.getPhoto({
      quality: 90,
      direction: CameraDirection.Front,
      allowEditing: false,
      resultType: CameraResultType.Base64,
      source: CameraSource.Prompt,
    });
    console.log(image);

    // image.webPath will contain a path that can be set as an image src.
    // You can access the original file using image.path, which can be
    // passed to the Filesystem API to read the raw data of the image,
    // if desired (or pass resultType: CameraResultType.Base64 to getPhoto)
    var imageUrl = image.webPath;
  };
</script>

{#if $talent}
  <Page name="Profile">
    <Navbar title="Profile" />
    <Block strong>
      <Row>
        <Col width="100" class="flex place-content-center">
          <!-- svelte-ignore a11y-click-events-have-key-events -->
          <div
            class=" bg-cover bg-no-repeat bg-center rounded-full h-48 w-48"
            style="background-image: url('{$talent.profileImageUrl}')"
            on:click={takePicture}
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
    </List>
  </Page>
{/if}
