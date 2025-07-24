<script lang="ts">
    import dayjs from "dayjs";
    const DATE_FORMAT = "YYYY-MM-DD";

    export let name: string;
    export let showQuickSkip: boolean;
    export let label: string;
    export let value: Date | undefined;
    $: displayDate = dayjs(value).format(DATE_FORMAT);

    function adjustDate(unit: "day" | "month" | "year", amount: number) {
        if (unit === "day") {
            if (amount === 1) {
                const newDate = dayjs(value).startOf("month");
                value = newDate.toDate();
            } else {
                const newDate = dayjs(value).endOf("month");
                value = newDate.toDate();
            }
        } else {
            const newDate = dayjs(value).add(amount, unit);
            value = newDate.toDate();
        }
    }
</script>

<div class="field">
    <label class="label" for={name}>{label}</label>
    <div class="control">
        <input
            id={name}
            class="input"
            type="date"
            bind:value={displayDate}
            on:change={() => (value = dayjs(displayDate).toDate())}
        />
    </div>
</div>
{#if showQuickSkip}
    <div class="field has-addons">
        <div class="control">
            <button
                class="button is-small is-danger"
                on:click={() => adjustDate("month", -1)}>-1M</button
            >
        </div>
        <div class="control">
            <button
                class="button is-small is-success"
                on:click={() => adjustDate("month", 1)}>+1M</button
            >
        </div>
        <div class="control">
            <button
                class="button is-small is-info"
                on:click={() => adjustDate("day", 1)}>1</button
            >
        </div>
        <div class="control">
            <button
                class="button is-small is-info"
                on:click={() => adjustDate("day", 31)}>31</button
            >
        </div>
        <div class="control">
            <button
                class="button is-small is-success"
                on:click={() => adjustDate("month", 3)}>+3M</button
            >
        </div>
        <div class="control">
            <button
                class="button is-small is-success"
                on:click={() => adjustDate("year", 1)}>+1Y</button
            >
        </div>
    </div>
{/if}
