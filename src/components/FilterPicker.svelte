<script lang="ts">
    export let icon: any;
    export let options: { id?: number; name: string }[];
    export let value: number | undefined;
    let isOpen = false;
    let selectedOption: { name: string } | undefined;
    function Select(o: { id?: number; name: string } | undefined) {
        isOpen = false;
        selectedOption = o;
        value = o?.id;
    }
</script>

<div class="dropdown {isOpen ? 'is-active' : ''} mx-auto" style="width: 100%">
    <div class="dropdown-trigger mx-auto">
        <button class="tags has-addons" on:click={() => (isOpen = !isOpen)}>
            {#if icon}
                <span class="tag is-info is-rounded"
                    ><svelte:component this={icon} /></span
                >
            {/if}
            {#if value}
                <span class="tag is-primary is-rounded">Active</span>
            {:else}
                <span class="tag is-info is-rounded">None</span>
            {/if}
        </button>
    </div>
    <div class="dropdown-menu">
        <div class="dropdown-content">
            <button
                on:click={() => Select(undefined)}
                class="dropdown-item {value ? '' : 'is-active'}"
                ><em>None</em></button
            >
            {#each options as o}
                <button
                    on:click={() => Select(o)}
                    class="dropdown-item {value === o.id ? 'is-active' : ''}"
                >
                    {o.name}
                </button>
            {/each}
        </div>
    </div>
</div>
