<script>
    import { auth } from "$lib/stores/auth.store.svelte.js";
    import { router } from "tinro";

    let { permissions = [], component, params = {} } = $props();
    if (!auth.isAuthenticated) router.goto("/auth/login");

    let isAuthorized = $derived(auth.hasPermissions(permissions));
</script>


{#if auth.isAuthenticated}
    {#if isAuthorized}
        {#await component.then ? component : component()}
            <div class="flex flex-1 items-center justify-center">
                <span class="loading loading-spinner loading-lg text-primary"
                ></span>
            </div>
        {:then { default: ProtectedComponent }}
            <ProtectedComponent {params} />
        {/await}
    {:else}
        <div
            class="flex h-screen w-full flex-col items-center justify-center gap-4 bg-base-200"
        >
            <div class="card bg-base-100 shadow-xl">
                <div class="card-body items-center text-center">
                    <h1 class="card-title text-4xl">Acceso Denegado</h1>
                    <p>
                        No tienes los permisos necesarios para ver esta página.
                    </p>
                    <div class="card-actions justify-end mt-4">
                        <a href="/" class="btn btn-primary">Volver al inicio</a>
                    </div>
                </div>
            </div>
        </div>
    {/if}
{/if}
