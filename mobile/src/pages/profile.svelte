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
  const IMAGE_UPDATE_PATH = import.meta.env.VITE_IMAGE_UPDATE_PATH;
  const PCALL_URL = import.meta.env.VITE_PCALL_URL;

  import { talent } from '../lib/stores';

  import {
    Camera,
    CameraResultType,
    CameraDirection,
    CameraSource,
  } from '@capacitor/camera';
  import urlJoin from 'url-join';

  let imageUrl = $talent?.profileImageUrl;

  $: takePicture = () => {
    Camera.getPhoto({
      quality: 90,
      direction: CameraDirection.Front,
      allowEditing: false,
      resultType: CameraResultType.Uri,
      source: CameraSource.Prompt,
    }).then(async image => {
      if (image && image.webPath) {
        imageUrl = image.webPath;
        console.log(imageUrl);
        const blob = await (await fetch(imageUrl)).blob();
        const file = new File([blob], 'profile.jpg', {
          type: 'image/jpeg',
          lastModified: new Date().getTime(),
        });
        let formData = new FormData();
        formData.append('file', 'file');
        const upload_url = urlJoin(PCALL_URL, IMAGE_UPDATE_PATH);
        console.log(upload_url);
        const res = await fetch(upload_url, {
          method: 'POST',
          body: formData,
        });
        const data = await res.json();
        console.log(data);
      }
    });

    // image.webPath will contain a path that can be set as an image src.
    // You can access the original file using image.path, which can be
    // passed to the Filesystem API to read the raw data of the image,
    // if desired (or pass resultType: CameraResultType.Base64 to getPhoto)
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
            style="background-image: url('{imageUrl ||
              $talent.profileImageUrl}')"
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
