<script lang="ts">
    import { Html5QrcodeScanner } from "html5-qrcode";
    import IconClose from "virtual:icons/mdi/close";
    import db from "../lib/Data";
    import { navigate } from "svelte-mini-router";
    import { onDestroy, onMount } from "svelte";

    let html5QrcodeScanner: Html5QrcodeScanner;
    onMount(() => {
        html5QrcodeScanner = new Html5QrcodeScanner(
            "reader",
            { fps: 10, qrbox: { width: 250, height: 250 } },
            false,
        );
        html5QrcodeScanner.render(
            async (decodedText: string) => {
                html5QrcodeScanner.pause();
                const codes = await db.barcode
                    .where("code")
                    .equals(decodedText)
                    .toArray();
                if (!codes || codes.length === 0) {
                    navigate("/entry", { barcode: decodedText });
                } else {
                    navigate("/entry", { product: codes[0].productId });
                }
            },
            (error: string) => console.warn(error),
        );
    });
    onDestroy(() => {
        html5QrcodeScanner.clear();
    });
</script>

<nav class="navbar is-fixed-top is-primary">
    <div class="navbar-brand is-flex">
        <div class="navbar-item">
            <button class="icon" on:click={() => history.back()}
                ><IconClose /></button
            >
        </div>
        <div class="navbar-item">Scanning Barcode</div>
    </div>
</nav>
<div id="reader" style="width: 100%"></div>
