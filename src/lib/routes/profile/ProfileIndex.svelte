<script>
    import { auth } from "$lib/stores/auth.store.svelte.js";
    import { SettingsPage } from "$lib/stores/settingsPage.store.svelte";
    import { fade } from "svelte/transition";
    let user = $derived(auth.user);
    let avatar = $derived(
        auth.user?.avatar ||
            `https://avatar.iran.liara.run/username?username=${user.username[0].toUpperCase()}`,
    );
</script>

<svelte:head>
    <title>Mi Perfil - {SettingsPage.header.title}</title>
</svelte:head>

<div class="p-4 sm:p-6 md:p-8" in:fade>
    {#if user}
        <div class="card lg:card-side bg-base-100 shadow-xl">
            <figure class="p-8">
                <div class="avatar">
                    <div
                        class="w-28 rounded-full ring ring-primary ring-offset-base-100 ring-offset-2"
                    >
                        <img src={avatar} alt="Avatar" />
                    </div>
                </div>
            </figure>
            <div class="card-body">
                <div
                    class="stats stats-vertical lg:stats-horizontal shadow mt-4"
                >
                    <div class="stat">
                        <h2 class="stat-value">{user.username}</h2>
                        <p class="text-base-content/70 stat-desc">
                            {user.email}
                        </p>
                    </div>
                </div>
                <div
                    class="stats stats-vertical lg:stats-horizontal shadow mt-4"
                >
                    <div class="stat">
                        <div class="stat-title">Rol</div>
                        <div class="stat-value text-primary">
                            {user.expand?.role?.name || "N/A"}
                        </div>
                        <div class="stat-desc">Nivel de acceso</div>
                    </div>
                    <div class="stat">
                        <div class="stat-title">Teléfono</div>
                        <div class="stat-value">
                            {user.phone || "No especificado"}
                        </div>
                    </div>
                </div>
                <div class="card-actions justify-end mt-4">
                    <a href="#/profile/edit" class="btn btn-primary"
                        >Editar Perfil</a
                    >
                </div>
            </div>
        </div>
    {:else}
        <p>No se pudo cargar la información del usuario.</p>
    {/if}
</div>
