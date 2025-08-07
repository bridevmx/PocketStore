
<script>
    export let params;
    const { title } = params;
</script>

<svelte:head>
    <title>{title}</title>
</svelte:head>

<main>
    <slot />
</main>
