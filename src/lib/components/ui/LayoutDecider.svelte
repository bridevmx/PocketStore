<script>
    import { auth } from '$lib/stores/auth.store.svelte.js';

    import PublicLayout from '$lib/components/ui/PublicLayout.svelte';
    import AuthenticatedLayout from '$lib/components/ui/AuthenticatedLayout.svelte';

    let { children } = $props();
</script>

{#if auth.loading}
    <div class="flex h-screen w-full items-center justify-center bg-base-200">
        <span class="loading loading-spinner loading-lg text-primary"></span>
    </div>
{:else if auth.isAuthenticated}
    <AuthenticatedLayout>
        {#snippet children()}
            {@render children()}
        {/snippet}
    </AuthenticatedLayout>
{:else}
    <PublicLayout>
        {#snippet children()}
            {@render children()}
        {/snippet}
    </PublicLayout>
{/if}