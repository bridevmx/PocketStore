<script>
    import { router } from 'tinro';
    import { toast } from 'svelte-sonner';
    import { fade } from 'svelte/transition';
    import { confirmEmailChange } from '$lib/stores/auth.store.svelte.js';

    let isLoading = $state(false);
    const token = router.location.query?.get('token');

    async function onsubmit(e) {
        e.preventDefault();
        if (!token) {
            toast.error("Token no válido o ausente en la URL.");
            return;
        }
        isLoading = true;
        const formData = new FormData(e.target);
        const password = formData.get('password')?.toString().trim();

        try {
            await confirmEmailChange(String(token), password);
            toast.success("¡Tu correo ha sido actualizado con éxito!");
            router.goto('/profile');
        } catch (error) {
            toast.error(error.message);
        } finally {
            isLoading = false;
        }
    }
</script>

<svelte:head><title>Confirmar Cambio de Correo</title></svelte:head>

<div class="flex items-center justify-center flex-1" in:fade>
    <form {onsubmit} class="w-full max-w-sm p-4">
        <div class="card bg-base-100 shadow-xl border border-primary/20">
            <div class="card-body">
                <h2 class="card-title text-2xl">Confirmar Cambio de Correo</h2>
                <p class="text-sm text-base-content/70">
                    Para completar el cambio, por favor ingresa tu contraseña actual.
                </p>
                <div class="form-control mt-4">
                    <label for="password" class="label"><span class="label-text">Contraseña</span></label>
                    <input name="password" id="password" type="password" class="input input-bordered w-full" required />
                </div>
                <button type="submit" class="btn btn-primary w-full mt-6" disabled={isLoading}>
                    {#if isLoading}<span class="loading loading-spinner"></span>{/if}
                    Confirmar y Cambiar Correo
                </button>
            </div>
        </div>
    </form>
</div>