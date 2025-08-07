<script>
    import { SettingsPage } from "$lib/stores/settingsPage.store.svelte";

    let {params} = $props();
</script>

<svelte:head><title>Dashboard - {SettingsPage.header.title}</title></svelte:head>

<div class="flex justify-center items-center h-screen"> 
    Page de Dashboard
    <div>
        Params: {JSON.stringify(params, null, 2)}
    </div>
</div>