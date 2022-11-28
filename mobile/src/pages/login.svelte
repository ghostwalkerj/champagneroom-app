<script type="ts">
  import {
    f7,
    Page,
    LoginScreenTitle,
    List,
    ListInput,
    ListButton,
    BlockFooter,
  } from 'framework7-svelte';
  import { setContext } from 'svelte';
  import { getTalentDB } from '../lib/util';

  export let f7router;

  let key = '';

  const signIn = async () => {
    if (key.trim() !== '') {
      const talentDB = await getTalentDB(key);
      if (!talentDB) {
        f7.dialog.alert('Invalid DB');
        return;
      }
      const talent = await talentDB.talents
        .findOne()
        .where('key')
        .equals(key)
        .exec();
      if (!talent) {
        f7.dialog.alert('Invalid Key');
        return;
      }
      //setContext('talent', talent);
      f7.dialog.alert('Welcome ' + talent.name);
      f7router.navigate('/');
    }
  };
</script>

<Page noToolbar noNavbar noSwipeback loginScreen>
  <LoginScreenTitle>pCall Creator</LoginScreenTitle>
  <List form>
    <ListInput
      label="Talent Key"
      type="text"
      placeholder="Key"
      value={key}
      onInput={e => (key = e.target.value)}
    />
  </List>
  <List>
    <ListButton onClick={signIn}>Sign In</ListButton>
  </List>
  <BlockFooter
    >Some text about login information.<br />Lorem ipsum dolor sit amet,
    consectetur adipiscing elit.</BlockFooter
  >
</Page>
