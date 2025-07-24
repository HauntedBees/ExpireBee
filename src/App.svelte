<script lang="ts">
  import { Router } from "svelte-mini-router";
  import { routerConf } from "./view/RouterConfig";
</script>

<main>
  <Router {routerConf} />
</main>
