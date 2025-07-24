<script lang="ts">
    import IconSort from "virtual:icons/mdi/sort";
    import IconMagnify from "virtual:icons/mdi/magnify";
    import IconBarcode from "virtual:icons/mdi/barcode";
    import IconBarcodeScan from "virtual:icons/mdi/barcode-scan";
    import IconPlusThick from "virtual:icons/mdi/plus-thick";
    import IconMapMarker from "virtual:icons/mdi/map-marker";
    import IconShape from "virtual:icons/mdi/shape";
    import IconTagMultiple from "virtual:icons/mdi/tag-multiple";
    import { navigate } from "svelte-mini-router";
    import dayjs from "dayjs";
    import db from "../lib/Data";
    import {
        SortOrder,
        ToDictionary,
        type Category,
        type Dictionary,
        type InventoryView,
        type Location,
        type Tag,
    } from "../lib/Model";
    import FilterPicker from "../components/FilterPicker.svelte";
    import { tick } from "svelte";

    const TODAY = dayjs().startOf("day");

    let title = "";
    let isTopNavOpen = false;

    let showSearch = false;
    let searchQuery = "";
    let selectedCategory: number | undefined;
    let selectedLocation: number | undefined;
    let selectedTag: number | undefined;
    $: {
        (selectedCategory ||
            selectedLocation ||
            selectedTag ||
            searchQuery ||
            true) &&
            Search();
    }
    function ToggleSearch() {
        showSearch = !showSearch;
        if (showSearch) {
            tick().then(() => {
                document.getElementById("searchbox")?.focus();
                window.scrollTo(0, 0); // may not be necessary because of focus
            });
        }
    }
    function Search() {
        if (
            selectedCategory ||
            selectedLocation ||
            selectedTag ||
            searchQuery
        ) {
            const query = (searchQuery || "").toLowerCase().trim();
            displayItems = items.filter(
                (i) =>
                    (!selectedCategory || i.categoryId === selectedCategory) &&
                    (!selectedLocation || i.locationId === selectedLocation) &&
                    (!selectedTag ||
                        (selectedTag &&
                            i.tagIds?.indexOf(selectedTag) !== -1)) &&
                    (!query ||
                        i.name.toLowerCase().indexOf(query) >= 0 ||
                        i.notes.toLowerCase().indexOf(query) >= 0),
            );
            title = `Filtered Items (${displayItems.length})`;
        } else {
            displayItems = [...items];
            title = `All Items (${displayItems.length})`;
        }
        sortEntries();
    }

    let showSortNav = false;
    const navItems = [
        { icon: IconBarcodeScan, path: "/scan" },
        { icon: IconPlusThick, path: "/entry" },
    ];

    const navSettingsItems = [
        {
            icon: IconTagMultiple,
            text: "Manage Tags",
            route: "/metadata",
            queryParams: { type: "tag" },
        },
        {
            icon: IconShape,
            text: "Manage Categories",
            route: "/metadata",
            queryParams: { type: "category" },
        },
        {
            icon: IconMapMarker,
            text: "Manage Locations",
            route: "/metadata",
            queryParams: { type: "location" },
        },
        {
            icon: IconBarcode,
            text: "Manage Products",
            route: "/products",
            queryParams: undefined,
        },
    ];

    let viewedItem: InventoryView | undefined;
    let deletingItem: InventoryView | undefined;
    let deleteProduct = false;
    let sortOrder: SortOrder = SortOrder.Date;

    let locations: Dictionary<Location> = {};
    let categories: Dictionary<Category> = {};
    let tags: Dictionary<Tag> = {};
    let items: InventoryView[] = [];
    let displayItems: InventoryView[] = [];
    async function loadEntries() {
        items = (await db.inventory.toArray()).map((i) => ({
            ...i,
            expireDays: dayjs(i.expirationDate).diff(TODAY, "day"),
            dayjsPurchase: dayjs(i.purchaseDate),
            dayjsExpire: dayjs(i.expirationDate),
        }));
        displayItems = [...items];
        title = `All Items (${displayItems.length})`;
        sortEntries();
    }
    function sortEntries() {
        switch (sortOrder) {
            case SortOrder.Date:
                displayItems.sort((a, b) => a.expireDays - b.expireDays);
                break;
            case SortOrder.Name:
                displayItems.sort((a, b) => a.name.localeCompare(b.name));
                break;
            case SortOrder.Location:
                displayItems.sort(
                    (a, b) => (a.locationId || 0) - (b.locationId || 0),
                );
                break;
        }
        displayItems = displayItems;
    }
    function setSort(sort: SortOrder) {
        sortOrder = sort;
        sortEntries();
        showSortNav = false;
    }

    async function deleteItem() {
        if (!deletingItem || !deletingItem.id) {
            return;
        }
        if (deleteProduct) {
            const product = (
                await db.product
                    .filter(
                        (p) =>
                            p.name.toLowerCase() ===
                            deletingItem!.name.toLowerCase(),
                    )
                    .toArray()
            )[0];
            if (product && product.id) {
                const barcode = (
                    await db.barcode
                        .where("productId")
                        .equals(product.id)
                        .toArray()
                )[0];
                if (barcode) {
                    await db.barcode.delete(barcode.id);
                }
                await db.product.delete(product.id);
            }
            await db.inventory.delete(deletingItem.id);
        }
        deletingItem = undefined;
        viewedItem = undefined;
        await loadEntries();
    }

    async function initialize() {
        locations = ToDictionary(await db.location.toArray());
        categories = ToDictionary(await db.category.toArray());
        tags = ToDictionary(await db.tag.toArray());
        await loadEntries();
    }
    initialize();
</script>

<nav class="navbar is-fixed-top is-primary">
    <div class="navbar-brand is-flex">
        <div class="navbar-item has-text-weight-medium">{title}</div>
        <button
            class="navbar-burger has-text-dark {isTopNavOpen
                ? 'is-active'
                : ''}"
            aria-label="menu"
            aria-expanded="false"
            on:click={() => (isTopNavOpen = !isTopNavOpen)}
        >
            <span aria-hidden="true"></span>
            <span aria-hidden="true"></span>
            <span aria-hidden="true"></span>
            <span aria-hidden="true"></span>
        </button>
    </div>
    <div class="navbar-menu {isTopNavOpen ? 'is-active' : ''}">
        {#each navSettingsItems as nav}
            <button
                class="navbar-item is-fullwidth"
                on:click={() => navigate(nav.route, nav.queryParams)}
            >
                <span class="icon-text">
                    <span class="icon"
                        ><svelte:component this={nav.icon} /></span
                    >
                    <span>{nav.text}</span>
                </span>
            </button>
        {/each}
    </div>
</nav>

{#if showSearch}
    <div class="mb-4">
        <div class="field">
            <div class="control has-icons-left">
                <input
                    id="searchbox"
                    class="input"
                    type="text"
                    on:blur={Search}
                    bind:value={searchQuery}
                    placeholder="Search"
                />
                <span class="icon is-left">
                    <IconMagnify />
                </span>
            </div>
        </div>
        <div class="columns is-mobile">
            <div class="column is-one-third">
                <FilterPicker
                    icon={IconMapMarker}
                    options={Object.values(locations)}
                    bind:value={selectedLocation}
                />
            </div>
            <div class="column is-one-third">
                <FilterPicker
                    icon={IconShape}
                    options={Object.values(categories)}
                    bind:value={selectedCategory}
                />
            </div>
            <div class="column is-one-third">
                <FilterPicker
                    icon={IconTagMultiple}
                    options={Object.values(tags)}
                    bind:value={selectedTag}
                />
            </div>
        </div>
    </div>
{/if}

<div>
    {#each displayItems as item, i}
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
                        <em class="is-size-6 pr-2">{item.quantity}</em>
                        {item.name}
                    </div>
                    <div class="is-size-7">
                        <span class="has-text-weight-medium">Location:</span>
                        {locations[item.locationId ?? 0]?.name}
                    </div>
                    {#if item.tagIds}
                        <div class="tags">
                            {#each item.tagIds as tagId}
                                <span
                                    class="tag"
                                    style="background-color: {tags[tagId]
                                        .color || '#1F2229'}"
                                    >{tags[tagId].name}</span
                                >
                            {/each}
                        </div>
                    {/if}
                </div>
                <div class="column">
                    <div class="is-size-7 has-text-weight-light">
                        Expires in
                    </div>
                    <div
                        class="is-size-6 has-text-weight-bold has-text-{item.expireDays <=
                        0
                            ? 'danger'
                            : item.expireDays <= 5
                              ? 'warning'
                              : 'success'}"
                    >
                        {item.expireDays} day{item.expireDays === 1 ? "" : "s"}
                    </div>
                </div>
            </div>
        </div>
    {/each}
</div>

<nav class="navbar is-fixed-bottom is-primary">
    <div class="navbar-brand is-flex">
        <div
            class="navbar-item is-flex-grow-1 dropdown is-up {showSortNav
                ? 'is-active'
                : ''}"
        >
            <div class="dropdown-trigger" style="width: 100%">
                <button
                    style="width: 100%"
                    on:click={() => (showSortNav = !showSortNav)}
                >
                    <div class="icon has-text-dark mx-auto">
                        <IconSort />
                    </div>
                </button>
                <div class="dropdown-menu">
                    <div class="dropdown-content">
                        <button
                            on:click={() => setSort(SortOrder.Date)}
                            class="dropdown-item {sortOrder == SortOrder.Date
                                ? 'is-active'
                                : ''}">Expiration Date</button
                        >
                        <button
                            on:click={() => setSort(SortOrder.Name)}
                            class="dropdown-item {sortOrder == SortOrder.Name
                                ? 'is-active'
                                : ''}">Name</button
                        >
                        <button
                            on:click={() => setSort(SortOrder.Location)}
                            class="dropdown-item {sortOrder ==
                            SortOrder.Location
                                ? 'is-active'
                                : ''}">Location</button
                        >
                    </div>
                </div>
            </div>
        </div>
        <button class="navbar-item is-flex-grow-1" on:click={ToggleSearch}>
            <div class="icon has-text-dark mx-auto">
                <IconMagnify />
            </div>
        </button>
        {#each navItems as item}
            <button
                class="navbar-item is-flex-grow-1"
                on:click={() => navigate(item.path)}
            >
                <div class="icon has-text-dark mx-auto">
                    <svelte:component this={item.icon} />
                </div>
            </button>
        {/each}
        <div class="navbar-item padding"></div>
    </div>
</nav>

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
                        {#if viewedItem.notes}
                            <div class="cell">Notes:</div>
                            <div class="cell is-col-span-2">
                                {viewedItem.notes}
                            </div>
                        {/if}
                        <div class="cell">Quantity:</div>
                        <div class="cell is-col-span-2">
                            {viewedItem.quantity}
                        </div>
                        <div class="cell">Tags:</div>
                        <div class="cell is-col-span-2">
                            {#if viewedItem.tagIds && viewedItem.tagIds.length > 0}
                                <div class="tags">
                                    {#each viewedItem.tagIds as tagId}
                                        <span
                                            class="tag"
                                            style="color: {tags[tagId].color ||
                                                '#1F2229'}"
                                            >{tags[tagId].name}</span
                                        >
                                    {/each}
                                </div>
                            {:else}
                                None
                            {/if}
                        </div>
                        <div class="cell">Purchased:</div>
                        <div class="cell is-col-span-2">
                            {#if viewedItem.dayjsPurchase.isSame(TODAY, "day")}
                                Today
                            {:else}
                                {viewedItem.dayjsPurchase.diff(TODAY, "day")} day{viewedItem.dayjsPurchase.diff(
                                    TODAY,
                                    "day",
                                ) === 1
                                    ? ""
                                    : "s"}
                                ago
                            {/if}
                            <div class="is-size-7">
                                {viewedItem.dayjsPurchase.format("MMM D, YYYY")}
                            </div>
                        </div>
                        <div class="cell">Expires:</div>
                        <div class="cell is-col-span-2">
                            {#if viewedItem.expireDays === 0}
                                <span
                                    class="has-text-danger has-text-weight-bold"
                                    >Today</span
                                >
                            {:else if viewedItem.expireDays < 0}
                                <span
                                    class="has-text-danger has-text-weight-bold"
                                    >{-viewedItem.expireDays}</span
                                >
                                day{viewedItem.expireDays === -1 ? "" : "s"} ago
                            {:else if viewedItem.expireDays === 1}
                                <span class="has-text-warning">Tomorrow</span>
                            {:else}
                                {viewedItem.expireDays} days from now
                            {/if}
                            <div class="is-size-7">
                                {viewedItem.dayjsExpire.format("MMM D, YYYY")}
                            </div>
                        </div>
                        <div class="cell">Location:</div>
                        <div class="cell is-col-span-2">
                            {viewedItem.locationId
                                ? locations[viewedItem.locationId].name
                                : "Not Set"}
                        </div>
                        <div class="cell">Category:</div>
                        <div class="cell is-col-span-2">
                            {viewedItem.categoryId
                                ? categories[viewedItem.categoryId].name
                                : "None"}
                        </div>
                    </div>
                </div>
            </section>
            <footer class="modal-card-foot">
                <div class="buttons">
                    <button
                        class="button is-success"
                        on:click={() =>
                            navigate("/entry", { id: viewedItem?.id })}
                        >Edit</button
                    >
                    <button
                        class="button is-danger"
                        on:click={() => (deletingItem = viewedItem)}
                        >Delete</button
                    >
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
                <p>This will delete the item.</p>
                <div class="mt-2">
                    <label class="checkbox">
                        <input
                            type="checkbox"
                            class="mr-2"
                            bind:checked={deleteProduct}
                        />
                        Delete product and barcode data, too.
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

<style>
    .padding {
        width: 32px;
    }
    .navbar-item.is-fullwidth {
        width: 100%;
    }
</style>
