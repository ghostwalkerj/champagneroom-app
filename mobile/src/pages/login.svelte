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
  

  export let f7router;

  let key = '';

  const signIn = () => {
    
    });
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
