<script>
  import { Block, List, ListItem, Navbar, Page } from 'framework7-svelte';

  export let user;
</script>

<Page>
  <Navbar title={`${user.firstName} ${user.lastName}`} backLink="Back" />
  <Block strong>
    {user.about}
  </Block>
  <List>
    {#each user.links as link}
      <ListItem link={link.url} title={link.title} external target="_blank" />
    {/each}
  </List>
</Page>
