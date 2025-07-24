<script lang="ts">
    import AutoComplete from "simple-svelte-autocomplete";
    import type {
        Category,
        Inventory,
        Location,
        Product,
        Tag,
    } from "../lib/Model";
    import db, { Upsert } from "../lib/Data";
    import DatePicker from "../components/DatePicker.svelte";
    import IconClose from "virtual:icons/mdi/close";
    import IconContentSave from "virtual:icons/mdi/content-save";
    import { getQueryParams, navigate } from "svelte-mini-router";

    let item: Inventory = {
        name: "",
        tagIds: [],
        quantity: 1,
        notes: "",
        expirationDate: new Date(),
        purchaseDate: new Date(),
    };

    let displayProduct: Product | undefined;
    let categories: Category[] = [];
    let tags: Tag[] = [];
    let locations: Location[] = [];
    let barcode: string | undefined;
    let typedText = "";

    async function loadMetadata() {
        categories = await db.category.toArray();
        tags = await db.tag.toArray();
        locations = await db.location.toArray();
        const params = getQueryParams();
        if (!params) {
            return;
        }
        if (params["id"]) {
            const potentialItem = await db.inventory.get(
                parseInt(params["id"]),
            );
            if (!potentialItem) {
                return;
            }
            item = potentialItem;
            displayProduct = {
                id:
                    (
                        await db.product
                            .where("name")
                            .equals(item.name)
                            .toArray()
                    )[0]?.id || 0,
                name: item.name,
            };
        } else if (params["product"]) {
            const potentialProduct = await db.product.get(
                parseInt(params["product"]),
            );
            if (!potentialProduct) {
                return;
            }
            item = {
                name: potentialProduct.name,
                categoryId: potentialProduct.categoryId,
                tagIds: potentialProduct.tagIds,
                quantity: 1,
                notes: "",
                expirationDate: new Date(),
                purchaseDate: new Date(),
            };
            displayProduct = potentialProduct;
        } else if (params["barcode"]) {
            barcode = params["barcode"];
        }
    }
    loadMetadata();

    async function getItems(keywordCased: string) {
        const keyword = keywordCased.toLowerCase();
        const results = await db.product
            .filter((p) => p.name.toLowerCase().includes(keyword))
            .toArray();
        results.push({ name: keywordCased });
        return results;
    }

    function onProductSelected(p: Product | undefined) {
        if (!p) {
            displayProduct = undefined;
            return;
        }
        typedText = p.name;
        item.name = p.name;
        displayProduct = p;
        if (p.id) {
            console.log("hey hi");
            item.categoryId = p.categoryId;
            item.tagIds = p.tagIds;
        } else {
            console.log("I'm new!");
        }
    }

    async function Save() {
        item.name = item.name.trim() || typedText;
        const product: Product = {
            id: displayProduct?.id,
            name: item.name,
            categoryId: item.categoryId,
            tagIds: item.tagIds,
        };
        const productId = await Upsert(db.product, product);
        if (barcode && productId) {
            const existingBarcodeForProduct = await db.barcode
                .where("productId")
                .equals(productId)
                .toArray();
            if (existingBarcodeForProduct.length) {
                await db.barcode.bulkDelete(
                    existingBarcodeForProduct.map((b) => b.id),
                );
            }
            await db.barcode.add({
                code: barcode,
                productId: productId,
            });
        }
        await Upsert(db.inventory, item);
        navigate("/");
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
            {#if item.id}
                Editing {item.name}
            {:else}
                New Item
            {/if}
        </div>
        <div class="navbar-item is-flex-grow-1"></div>
        <div class="navbar-item mr-1">
            <button class="icon" on:click={Save}><IconContentSave /></button>
        </div>
    </div>
</nav>

<div class="mx-2 has-text-left">
    <div class="field">
        <label class="label" for="name">
            Name
            {#if barcode}
                <span> ({barcode})</span>
            {/if}
        </label>
        <div class="control">
            <AutoComplete
                inputId="name"
                searchFunction={getItems}
                delay={100}
                create={true}
                selectFirstIfEmpty={true}
                localFiltering={false}
                labelFieldName="name"
                valueFieldName="name"
                closeOnBlur={false}
                bind:text={typedText}
                bind:selectedItem={displayProduct}
                onChange={() => onProductSelected(displayProduct)}
            />
        </div>
    </div>

    <div class="field">
        <label class="label" for="category">Category</label>
        <div class="control">
            <div class="select is-fullwidth" id="category">
                <select bind:value={item.categoryId}>
                    <option value={0}></option>
                    {#each categories as c}
                        <option value={c.id}>{c.name}</option>
                    {/each}
                </select>
            </div>
        </div>
    </div>

    <div class="field">
        <label class="label" for="location">Location</label>
        <div class="control">
            <div class="select is-fullwidth" id="location">
                <select bind:value={item.locationId}>
                    <option value={0}></option>
                    {#each locations as c}
                        <option value={c.id}>{c.name}</option>
                    {/each}
                </select>
            </div>
        </div>
    </div>

    <div class="field">
        <label class="label" for="tags">Tags</label>
        <div class="control">
            <div class="select is-multiple is-fullwidth" id="tags">
                <select multiple bind:value={item.tagIds}>
                    {#each tags as c}
                        <option value={c.id}>{c.name}</option>
                    {/each}
                </select>
            </div>
        </div>
    </div>

    <DatePicker
        bind:value={item.expirationDate}
        name="expirationdate"
        label="Expiration Date"
        showQuickSkip
    />

    <div class="field">
        <label class="label" for="notes">Notes</label>
        <div class="control">
            <textarea id="notes" class="textarea" placeholder=""></textarea>
        </div>
    </div>

    <DatePicker
        bind:value={item.purchaseDate}
        name="purchasedate"
        label="Purchase Date"
    />
</div>
