<script>
    import { router } from "tinro";
    import { toast } from "svelte-sonner";
    import { fade } from "svelte/transition";
    import { login } from "$lib/stores/auth.store.svelte.js";

    let { params } = $props();
    let { authCollectionName, refreshPage = false } = params;
    let isLoading = $state(false);

    async function onsubmit(e) {
        e.preventDefault();
        isLoading = true;
        const formElement = e.target;
        const formData = new FormData(formElement);

        try {
            const identity = formData?.get("identity")? new String(formData.get("identity")).trim() : "";
            const password = formData?.get("password")? new String(formData.get("password")).trim() : "";
            if (!identity || !password) {
                toast.error("Por favor, completa todos los campos.");
                return;
            }
            await login(identity, password, authCollectionName);
            toast.success("¡Bienvenido de nuevo!");
            
            if (refreshPage) {
                setTimeout(() => window.location.reload(), 500);
            } else {
                router.goto("/dashboard");
            }
        } catch (error) {
            toast.error(error.message || "Las credenciales son incorrectas.");
        } finally {
            isLoading = false;
        }
    }
</script>

<svelte:head>
    <title>Iniciar Sesión</title>
</svelte:head>

<div
    class="flex items-center justify-center flex-1"
    in:fade={{ duration: 300 }}
>
    <form {onsubmit} class="w-full max-w-sm p-4">
        <div class="card bg-base-100 shadow-xl border border-primary/20">
            <div class="card-body">
                <h2 class="card-title text-2xl">Iniciar Sesión</h2>
                <p class="text-sm text-base-content/70">
                    Ingresa tus credenciales para acceder.
                </p>
                <div class="grid gap-4 mt-4">
                    <div class="form-control">
                        <label for="identity" class="label">
                            <span class="label-text">Correo o Usuario</span>
                        </label>
                        <input
                            name="identity"
                            id="identity"
                            type="text"
                            placeholder="tu@correo.com"
                            class="input input-bordered w-full"
                            required
                        />
                    </div>
                    <div class="form-control">
                        <div class="flex items-center justify-between">
                            <label for="password" class="label">
                                <span class="label-text">Contraseña</span>
                            </label>
                            <a href="#/auth/forgot-password" class="label-text-alt link link-hover text-sm">
                                ¿Olvidaste tu contraseña?
                            </a>
                        </div>
                        <input
                            name="password"
                            id="password"
                            type="password"
                            class="input input-bordered w-full"
                            required
                        />
                    </div>
                    <button
                        type="submit"
                        class="btn btn-primary w-full mt-4"
                        disabled={isLoading}
                    >
                        {#if isLoading}
                            <span class="loading loading-spinner"></span>
                        {/if}
                        <span>Iniciar Sesión</span>
                    </button>
                </div>
                <div class="divider text-xs">¿No tienes cuenta?</div>
                <a href="#/auth/register" class="btn btn-ghost w-full">
                    Crear una cuenta
                </a>
            </div>
        </div>
    </form>
</div>