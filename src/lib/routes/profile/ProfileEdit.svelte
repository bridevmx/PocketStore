<script>
    import { auth, updateProfile } from '$lib/stores/auth.store.svelte.js';
    import { toast } from 'svelte-sonner';
    import { router } from 'tinro';
    import { themeStore } from '$lib/stores/theme.store.svelte.js';
    import { fade } from 'svelte/transition';
    import AvatarSelectionModal from '$lib/components/ui/AvatarSelectionModal.svelte';
    import ChangeEmailModal from '$lib/components/ui/ChangeEmailModal.svelte';
    import RequestPasswordResetModal from '$lib/components/ui/RequestPasswordResetModal.svelte';
    import Icon from '$lib/components/ui/Icon.svelte';
    import ThemeSelectionModal from '$lib/components/ui/ThemeSelectionModal.svelte';
    import { SettingsPage } from '$lib/stores/settingsPage.store.svelte';
    
    let isLoading = $state(false);
    let showAvatarModal = $state(false);
    let showEmailModal = $state(false);
    let showPasswordModal = $state(false);
    let showThemeModal = $state(false);

    let formData = $state({
        username: auth.user?.username || '',
        phone: auth.user?.phone || '',
        avatar: auth.user?.avatar || '',
    });

    $effect(() => {
        if (auth.user) {
            formData.username = auth.user.username;
            formData.phone = auth.user.phone;
            formData.avatar = auth.user.avatar || `https://avatar.iran.liara.run/username?username=${auth.user.username[0].toUpperCase()}`;
        }
    });

    async function handleSubmit(e) {
        e.preventDefault();
        if (!auth.user) return;
        isLoading = true;

        try {
            // CORRECTED: The function expects only two arguments: userId and the data object.
            await updateProfile(auth.user.id, {
                username: formData.username,
                phone: formData.phone,
                avatar: formData.avatar,
            });
            toast.success("Perfil actualizado correctamente.");
            router.goto('/profile');
        } catch (error) {
            toast.error(error.message || 'No se pudo actualizar el perfil.');
        } finally {
            isLoading = false;
        }
    }

    
    function handleThemeSelect(newTheme) {
        themeStore.setTheme(newTheme);
        showThemeModal = false;
    }
</script>

<svelte:head>
    <title>Editar Perfil - {SettingsPage.header.title}</title>
</svelte:head>

<div class="p-4 sm:p-6 md:p-8" in:fade>
    <div class="max-w-2xl mx-auto space-y-8">
        
        <form onsubmit={handleSubmit} class="card bg-base-100 shadow-xl">
            <div class="card-body">
                <h2 class="card-title text-2xl">Editar Perfil</h2>
                
                <div class="form-control items-center my-4">
                    <div class="avatar relative">
                        <div class="w-24 rounded-full ring ring-primary ring-offset-base-100 ring-offset-2">
                            <img src={formData.avatar || `https://avatar.iran.liara.run/public/boy`} alt="Avatar actual" />
                        </div>
                        <button
                            type="button"
                            onclick={() => showAvatarModal = true}
                            class="btn btn-xs btn-circle btn-primary absolute top-0 right-0 shadow-md"
                            aria-label="Cambiar avatar"
                        >
                            <Icon name="lucide:pencil" width="12" height="12" />
                        </button>
                    </div>
                </div>

                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div class="form-control">
                        <label for="username" class="label"><span class="label-text">Nombre de Usuario</span></label>
                        <input id="username" type="text" class="input input-bordered" bind:value={formData.username} required />
                    </div>
                    <div class="form-control">
                        <label for="phone" class="label"><span class="label-text">Teléfono</span></label>
                        <input id="phone" type="tel" class="input input-bordered" bind:value={formData.phone} placeholder="Ej. 5512345678" />
                    </div>
                </div>
                <div class="card-actions justify-end mt-6">
                    <a href="#/profile" class="btn btn-ghost">Cancelar</a>
                    <button type="submit" class="btn btn-primary" disabled={isLoading}>
                        {#if isLoading}<span class="loading loading-spinner"></span>{/if}
                        Guardar Cambios
                    </button>
                </div>
            </div>
        </form>

        <div class="card bg-base-100 shadow-xl">
            <div class="card-body">
                <h2 class="card-title text-2xl">Seguridad</h2>
                <div class="space-y-4 mt-4">
                    <div class="flex items-center justify-between p-4 border rounded-lg">
                        <div>
                            <p class="font-semibold">Correo Electrónico</p>
                            <p class="text-sm text-base-content/70">{auth.user?.email}</p>
                        </div>
                        <button class="btn btn-outline" onclick={() => showEmailModal = true}>Cambiar</button>
                    </div>
                    <div class="flex items-center justify-between p-4 border rounded-lg">
                        <div>
                            <p class="font-semibold">Contraseña</p>
                            <p class="text-sm text-base-content/70">********</p>
                        </div>
                        <button class="btn btn-outline" onclick={() => showPasswordModal = true}>Cambiar</button>
                    </div>
                </div>
            </div>
        </div>

        <div class="card bg-base-100 shadow-xl">
            <div class="card-body">
                <h2 class="card-title text-2xl">Apariencia</h2>
                <div class="space-y-4 mt-4">
                    <div class="flex items-center justify-between p-4 border rounded-lg">
                        <div>
                            <p class="font-semibold">Tema</p>
                            <p class="text-sm text-base-content/70 capitalize">{themeStore.theme}</p>
                        </div>
                        <button class="btn btn-outline" onclick={() => showThemeModal = true}>Cambiar Tema</button>
                    </div>
                </div>
            </div>
        </div>
        
    </div>
</div>

<AvatarSelectionModal 
    isOpen={showAvatarModal} 
    currentAvatar={formData.avatar} 
    onClose={() => showAvatarModal = false} 
    onSelect={(newAvatar) => { formData.avatar = newAvatar; showAvatarModal = false; }} 
/>
<ChangeEmailModal 
    isOpen={showEmailModal} 
    onClose={() => showEmailModal = false} 
/>
<RequestPasswordResetModal 
    isOpen={showPasswordModal} 
    onClose={() => showPasswordModal = false} 
    email={auth.user?.email} 
/>

<ThemeSelectionModal 
    isOpen={showThemeModal}
    currentTheme={themeStore.theme}
    onClose={() => showThemeModal = false}
    onSelect={handleThemeSelect}
/>