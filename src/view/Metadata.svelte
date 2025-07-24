<script lang="ts">
    import {
        MetadataType,
        type Category,
        type Location,
        type Tag,
    } from "../lib/Model";
    import db, { Upsert } from "../lib/Data";
    import IconClose from "virtual:icons/mdi/close";
    import IconTag from "virtual:icons/mdi/tag";
    import IconPlusThick from "virtual:icons/mdi/plus-thick";
    import { getQueryParams, navigate } from "svelte-mini-router";

    let typeName = "";
    let type: MetadataType = MetadataType.Category;
    let items: Tag[] | Category[] | Location[] = [];

    let viewedItem: Tag | Category | Location | undefined;
    $: viewedTag =
        viewedItem && type == MetadataType.Tag
            ? (viewedItem as Tag)
            : undefined;
    let deletingItem: Tag | Category | Location | undefined;
    let deleteRecords = false;

    async function init() {
        const params = getQueryParams();
        typeName = params["type"];
        switch (typeName) {
            case "tag":
                type = MetadataType.Tag;
                items = await db.tag.toArray();
                break;
            case "category":
                type = MetadataType.Category;
                items = await db.category.toArray();
                break;
            default:
                type = MetadataType.Location;
                items = await db.location.toArray();
                break;
        }
        typeName = typeName[0].toUpperCase() + typeName.slice(1);
        deleteRecords = false;
    }
    init();

    function addNew() {
        switch (type) {
            case MetadataType.Location:
            case MetadataType.Category:
                viewedItem = { name: "" };
                break;
            case MetadataType.Tag:
                viewedItem = { name: "", color: "#1F2229" };
                break;
        }
    }

    async function deleteItem() {
        if (!deletingItem || !deletingItem.id) {
            return;
        }
        switch (type) {
            case MetadataType.Location:
                const itemsAtLocation = await db.inventory
                    .where("locationId")
                    .equals(deletingItem.id)
                    .toArray();
                if (deleteRecords) {
                    await db.inventory.bulkDelete(
                        itemsAtLocation.map((k) => k.id),
                    );
                } else {
                    await db.inventory.bulkUpdate(
                        itemsAtLocation.map((i) => ({
                            key: i.id,
                            changes: {
                                locationId: undefined,
                            },
                        })),
                    );
                }
                await db.location.delete(deletingItem.id);
                break;
            case MetadataType.Category:
                const itemsInCategory = await db.inventory
                    .where("categoryId")
                    .equals(deletingItem.id)
                    .toArray();
                if (deleteRecords) {
                    await db.inventory.bulkDelete(
                        itemsInCategory.map((k) => k.id),
                    );
                } else {
                    await db.inventory.bulkUpdate(
                        itemsInCategory.map((i) => ({
                            key: i.id,
                            changes: {
                                categoryId: undefined,
                            },
                        })),
                    );
                }
                await db.category.delete(deletingItem.id);
                break;
            case MetadataType.Tag:
                const itemsWithTag = await db.inventory
                    .filter(
                        (i) =>
                            i.tagIds !== undefined &&
                            deletingItem!.id !== undefined &&
                            i.tagIds.indexOf(deletingItem!.id) >= 0,
                    )
                    .toArray();
                if (deleteRecords) {
                    await db.inventory.bulkDelete(
                        itemsWithTag.map((k) => k.id),
                    );
                } else {
                    await db.inventory.bulkUpdate(
                        itemsWithTag.map((i) => ({
                            key: i.id,
                            changes: {
                                tagIds: i.tagIds?.filter(
                                    (t) => t !== deletingItem?.id,
                                ),
                            },
                        })),
                    );
                }
                await db.tag.delete(deletingItem.id);
                break;
        }
        deletingItem = undefined;
        viewedItem = undefined;
        await init();
    }

    async function Save() {
        if (!viewedItem) {
            return;
        }
        switch (type) {
            case MetadataType.Location:
                Upsert(db.location, viewedItem as Location);
                break;
            case MetadataType.Category:
                Upsert(db.category, viewedItem as Category);
                break;
            case MetadataType.Tag:
                Upsert(db.tag, viewedItem as Tag);
                break;
        }
        viewedItem = undefined;
        await init();
    }
</script>

<nav class="navbar is-fixed-top is-primary">
    <div class="navbar-brand is-flex">
        <div class="navbar-item">
            <button class="icon" on:click={() => navigate("/")}
                ><IconClose /></button
            >
        </div>
        <div class="navbar-item">
            {#if type == MetadataType.Category}
                Categories
            {:else if type == MetadataType.Tag}
                Tags
            {:else}
                Locations
            {/if}
        </div>
        <div class="navbar-item is-flex-grow-1"></div>
        <div class="navbar-item mr-1">
            <button class="icon" on:click={addNew}><IconPlusThick /></button>
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
                    {#if type == MetadataType.Tag}
                        <span class="icon-text">
                            <span
                                class="icon"
                                style="color: {(item as Tag).color}"
                                ><IconTag /></span
                            >
                            <span>{item.name}</span>
                        </span>
                    {:else}
                        <span>{item.name}</span>
                    {/if}
                </div>
                <div class="column"></div>
            </div>
        </div>
    {/each}
</div>

{#if viewedItem && !deletingItem}
    <div class="modal is-active">
        <!-- svelte-ignore a11y_click_events_have_key_events -->
        <!-- svelte-ignore a11y_no_static_element_interactions -->
        <div
            class="modal-background"
            on:click={() => (viewedItem = undefined)}
        ></div>
        <div class="modal-card">
            <header class="modal-card-head">
                <p class="modal-card-title">
                    {viewedItem.name ? "Editing" : "New"}
                    {typeName}
                </p>
                <button
                    class="delete"
                    aria-label="close"
                    on:click={() => (viewedItem = undefined)}
                ></button>
            </header>
            <section class="modal-card-body">
                <div class="field">
                    <label class="label" for="name">Name</label>
                    <div class="control">
                        <input
                            id="name"
                            class="input"
                            type="text"
                            placeholder={`Enter your ${typeName} name.`}
                            bind:value={viewedItem.name}
                        />
                    </div>
                </div>
                {#if viewedTag}
                    <div class="field">
                        <label class="label" for="color">Color</label>
                        <div class="control">
                            <input
                                id="color"
                                class="input"
                                type="color"
                                bind:value={viewedTag.color}
                            />
                        </div>
                    </div>
                {/if}
            </section>
            <footer class="modal-card-foot">
                <div class="buttons">
                    <button class="button is-success" on:click={Save}
                        >Save</button
                    >
                    {#if viewedItem.id}
                        <button
                            class="button is-danger"
                            on:click={() => (deletingItem = viewedItem)}
                            >Delete</button
                        >
                    {/if}
                </div>
            </footer>
        </div>
    </div>
{/if}
{#if deletingItem}
    <div class="modal is-active">
        <!-- svelte-ignore a11y_click_events_have_key_events -->
        <!-- svelte-ignore a11y_no_static_element_interactions -->
        <div
            class="modal-background"
            on:click={() => (deletingItem = undefined)}
        ></div>
        <div class="modal-card">
            <header class="modal-card-head">
                <p class="modal-card-title">
                    Deleting
                    {deletingItem.name}
                </p>
                <button
                    class="delete"
                    aria-label="close"
                    on:click={() => (deletingItem = undefined)}
                ></button>
            </header>
            <section class="modal-card-body">
                <p>
                    This will delete the {typeName} "{deletingItem.name}" and
                    remove its association from all linked items.
                </p>
                <div class="mt-2">
                    <label class="checkbox">
                        <input
                            type="checkbox"
                            class="mr-2"
                            bind:checked={deleteRecords}
                        />
                        Delete all items with this {typeName.toLowerCase()},
                        too.
                    </label>
                </div>
            </section>
            <footer class="modal-card-foot">
                <div class="buttons">
                    <button class="button is-danger" on:click={deleteItem}
                        >Confirm</button
                    >
                    <button
                        class="button"
                        on:click={() => (deletingItem = undefined)}
                        >Nevermind</button
                    >
                </div>
            </footer>
        </div>
    </div>
{/if}
