<script lang="ts">
    import { navigate } from "svelte-mini-router";
    import db from "../lib/Data";
    import IconClose from "virtual:icons/mdi/close";
    import {
        ToDictionary,
        type Barcode,
        type Category,
        type Dictionary,
        type Product,
        type Tag,
    } from "../lib/Model";

    type ProductView = Product & { barcode: string };

    let viewedItem: ProductView | undefined;

    let categories: Dictionary<Category> = {};
    let tags: Dictionary<Tag> = {};
    let barcodes: Barcode[] = [];
    let items: ProductView[] = [];

    async function loadItems() {
        barcodes = await db.barcode.toArray();
        items = (await db.product.toArray()).map((i) => ({
            ...i,
            barcode: barcodes.find((b) => b.productId === i.id)?.code || "",
        }));
    }

    async function initialize() {
        categories = ToDictionary(await db.category.toArray());
        tags = ToDictionary(await db.tag.toArray());
        await loadItems();
    }
    initialize();

    async function deleteProduct() {
        if (!viewedItem) {
            return;
        }
        await db.product.delete(viewedItem.id);
        const barcode = barcodes.find((b) => b.productId === viewedItem!.id);
        if (barcode) {
            await db.barcode.delete(barcode.id);
        }
        viewedItem = undefined;
        await loadItems();
    }
</script>

<nav class="navbar is-fixed-top is-primary">
    <div class="navbar-brand is-flex">
        <div class="navbar-item">
            <button class="icon" on:click={() => navigate("/")}
                ><IconClose /></button
            >
        </div>
        <div class="navbar-item has-text-weight-medium">
            All Products ({items.length})
        </div>
    </div>
</nav>

<div>
    {#each items as item, i}
        <!-- svelte-ignore a11y_click_events_have_key_events -->
        <!-- svelte-ignore a11y_no_static_element_interactions -->
        <div
            on:click={() => (viewedItem = item)}
            class="{i % 2 === 0
                ? 'has-background-grey-dark'
                : 'has-background-dark'} px-2 mb-3"
        >
            <div class="columns is-mobile has-text-left">
                <div class="column pl-5 is-three-quarters">
                    <div class="is-size-5">
                        {item.name}
                    </div>
                    <div class="is-size-7">
                        <span class="has-text-weight-medium">Category:</span>
                        {categories[item.categoryId ?? 0]?.name || "None"}
                    </div>
                    {#if item.tagIds}
                        <div class="tags">
                            {#each item.tagIds as tagId}
                                <span
                                    class="tag"
                                    style="background-color: {tags[tagId]
                                        ?.color || '#1F2229'}"
                                    >{tags[tagId]?.name}</span
                                >
                            {/each}
                        </div>
                    {/if}
                </div>
                <div class="column">
                    <div class="is-size-7 has-text-weight-light">Barcode</div>
                    <div class="is-size-6">
                        {item.barcode}
                    </div>
                </div>
            </div>
        </div>
    {/each}
</div>

{#if viewedItem}
    <div class="modal is-active">
        <!-- svelte-ignore a11y_click_events_have_key_events -->
        <!-- svelte-ignore a11y_no_static_element_interactions -->
        <div
            class="modal-background"
            on:click={() => (viewedItem = undefined)}
        ></div>
        <div class="modal-card">
            <header class="modal-card-head">
                <p class="modal-card-title">{viewedItem.name}</p>
                <button
                    class="delete"
                    aria-label="close"
                    on:click={() => (viewedItem = undefined)}
                ></button>
            </header>
            <section class="modal-card-body">
                <div class="fixed-grid has-3-cols">
                    <div class="grid">
                        <div class="cell">Name:</div>
                        <div class="cell is-col-span-2">{viewedItem.name}</div>
                        <div class="cell">Tags:</div>
                        <div class="cell is-col-span-2">
                            {#if viewedItem.tagIds && viewedItem.tagIds.length > 0}
                                <div class="tags">
                                    {#each viewedItem.tagIds as tagId}
                                        <span
                                            class="tag"
                                            style="color: {tags[tagId]?.color ||
                                                '#1F2229'}"
                                            >{tags[tagId]?.name}</span
                                        >
                                    {/each}
                                </div>
                            {:else}
                                None
                            {/if}
                        </div>
                        <div class="cell">Category:</div>
                        <div class="cell is-col-span-2">
                            {viewedItem.categoryId
                                ? categories[viewedItem.categoryId].name
                                : "None"}
                        </div>
                    </div>
                </div>
                <p class="is-size-7">
                    Deleting the product will remove any barcode associations
                    and prevent this data from showing up in the autocomplete
                    when adding new items. It will not delete any items in your
                    storage.
                </p>
            </section>
            <footer class="modal-card-foot">
                <div class="buttons">
                    <button class="button is-danger" on:click={deleteProduct}
                        >Delete</button
                    >
                </div>
            </footer>
        </div>
    </div>
{/if}
