<script type="ts">
  import {
    Block,
    Button,
    Col,
    List,
    ListInput,
    Navbar,
    Page,
    Row,
  } from 'framework7-svelte';
  import StarRating from 'svelte-star-rating';
  import { Preferences } from '@capacitor/preferences';
  import type { LinkDocument } from '$lib/ORM/models/link';

  const PHOTO_UPDATE_PATH = import.meta.env.VITE_PHOTO_UPDATE_PATH;
  const PCALL_URL = import.meta.env.VITE_PCALL_URL;

  import { talent } from '../lib/stores';

  import {
    Camera,
    CameraDirection,
    CameraResultType,
    CameraSource,
  } from '@capacitor/camera';
  import urlJoin from 'url-join';

  let imageUrl = $talent!.profileImageUrl;
  let name = $talent!.name;

  if ($talent) {
    $talent.get$('profileImageUrl').subscribe((url: string): void => {
      imageUrl = url;
    });

    $talent.get$('name').subscribe((_name: string): void => {
      name = _name;
    });
  }

  $: takePicture = () => {
    Camera.getPhoto({
      quality: 90,
      direction: CameraDirection.Front,
      allowEditing: false,
      resultType: CameraResultType.DataUrl,
      source: CameraSource.Prompt,
    }).then(async image => {
      if (image && image.dataUrl) {
        imageUrl = image.dataUrl;
        const blob = await (await fetch(image.dataUrl)).blob();
        const file = new File([blob], 'profile.jpg', {
          type: 'image/jpeg',
          lastModified: new Date().getTime(),
        });
        let formData = new FormData();
        formData.append('file', file);
        formData.append('key', $talent!.key);

        const upload_url = urlJoin(PCALL_URL, PHOTO_UPDATE_PATH);
        fetch(upload_url, {
          method: 'POST',
          body: formData,
        });
      }
    });

    // image.webPath will contain a path that can be set as an image src.
    // You can access the original file using image.path, which can be
    // passed to the Filesystem API to read the raw data of the image,
    // if desired (or pass resultType: CameraResultType.Base64 to getPhoto)
  };

  const logout = () => {
    talent.set(null);
    Preferences.remove({
      key: 'key',
    });
  };

  const updateName = () => {
    name = name.trim();
    if (name !== $talent!.name) {
      $talent!.atomicPatch({
        name,
        updatedAt: new Date().getTime(),
      });

      $talent!
        .populate('currentLink')
        .then((currentLink: LinkDocument | null) => {
          if (currentLink) {
            currentLink.atomicPatch({
              talentInfo: {
                ...currentLink.talentInfo,
                name,
              },
              updatedAt: new Date().getTime(),
            });
          }
        });
    }
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
            style="background-image: url('{imageUrl}')"
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
      <ListInput
        label="Name"
        type="text"
        placeholder={name}
        on:blur={updateName}
        bind:value={name}
        minlength="3"
        maxlength="20"
        required
        validate
      />
    </List>

    <Button on:click={logout}>Logout</Button>
  </Page>
{/if}
