<script>
    import { router } from 'tinro';
    import { toast } from 'svelte-sonner';
    import { fade } from 'svelte/transition';
    import { confirmPasswordReset } from '$lib/stores/auth.store.svelte.js';

    let isLoading = $state(false);
    const token = router.location.query.get('token');

    async function onsubmit(e) {
        e.preventDefault();
        if (!token) {
            toast.error("Token no válido o ausente en la URL.");
            return;
        }
        isLoading = true;
        const formData = new FormData(e.target);
        const password = formData.get('password')?.toString().trim();
        const passwordConfirm = formData.get('passwordConfirm')?.toString().trim();

        if (password !== passwordConfirm) {
            toast.error("Las contraseñas no coinciden.");
            isLoading = false;
            return;
        }

        try {
            // @ts-ignore
            await confirmPasswordReset(token, password, passwordConfirm);
            toast.success("¡Contraseña actualizada! Por favor, inicia sesión de nuevo.");
            router.goto('/auth/login');
        } catch (error) {
            toast.error(error.message);
        } finally {
            isLoading = false;
        }
    }
</script>

<svelte:head><title>Restablecer Contraseña</title></svelte:head>

<div class="flex items-center justify-center flex-1" in:fade>
    <form {onsubmit} class="w-full max-w-sm p-4">
        <div class="card bg-base-100 shadow-xl border border-primary/20">
            <div class="card-body">
                <h2 class="card-title text-2xl">Establecer Nueva Contraseña</h2>
                <div class="space-y-4 mt-4">
                    <div class="form-control">
                        <label for="password" class="label"><span class="label-text">Nueva Contraseña</span></label>
                        <input name="password" id="password" type="password" class="input input-bordered w-full" required />
                    </div>
                    <div class="form-control">
                        <label for="passwordConfirm" class="label"><span class="label-text">Confirmar Nueva Contraseña</span></label>
                        <input name="passwordConfirm" id="passwordConfirm" type="password" class="input input-bordered w-full" required />
                    </div>
                </div>
                <button type="submit" class="btn btn-primary w-full mt-6" disabled={isLoading}>
                    {#if isLoading}<span class="loading loading-spinner"></span>{/if}
                    Guardar Nueva Contraseña
                </button>
            </div>
        </div>
    </form>
</div>