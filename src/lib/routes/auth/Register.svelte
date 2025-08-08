<script>
    import { router } from "tinro";
    import { toast } from "svelte-sonner";
    import { fade } from "svelte/transition";
    import { register } from "$lib/stores/auth.store.svelte.js";

    let isLoading = $state(false);

    async function onsubmit(e) {
        e.preventDefault();
        isLoading = true;
        const formElement = e.target;
        const formData = new FormData(formElement);
        
        const email = formData.get("email")?.toString().trim();
        const username = formData.get("username")?.toString().trim();
        const phone = formData.get("phone")?.toString().trim();
        const password = formData.get("password")?.toString().trim();
        const passwordConfirm = formData.get("passwordConfirm")?.toString().trim();

        if (!email || !username || !phone || !password || !passwordConfirm) {
            toast.error("Por favor, completa todos los campos.");
            isLoading = false;
            return;
        }

        if (password !== passwordConfirm) {
            toast.error("Las contraseñas no coinciden.");
            isLoading = false;
            return;
        }

        try {
            await register(email, username, phone, password, passwordConfirm);
            toast.success("¡Registro exitoso! Por favor, revisa tu correo para verificar tu cuenta.");
            router.goto("/auth/login");
        } catch (error) {
            toast.error(error.message || "Ocurrió un error inesperado.");
        } finally {
            isLoading = false;
        }
    }
</script>

<svelte:head>
    <title>Crear una Cuenta</title>
</svelte:head>

<div
    class="flex items-center justify-center flex-1"
    in:fade={{ duration: 300 }}
>
    <form {onsubmit} class="w-full max-w-sm p-4">
        <div class="card bg-base-100 shadow-xl border border-primary/20">
            <div class="card-body">
                <h2 class="card-title text-2xl">Crear una Cuenta</h2>
                <p class="text-sm text-base-content/70">
                    Únete a nuestra comunidad.
                </p>
                <div class="grid gap-4 mt-4">
                    <div class="form-control">
                        <label for="email" class="label">
                            <span class="label-text">Correo Electrónico</span>
                        </label>
                        <input
                            name="email"
                            id="email"
                            type="email"
                            placeholder="tu@correo.com"
                            class="input input-bordered w-full"
                            required
                        />
                    </div>
                     <div class="form-control">
                        <label for="username" class="label">
                            <span class="label-text">Nombre de Usuario</span>
                        </label>
                        <input
                            name="username"
                            id="username"
                            type="text"
                            placeholder="tu_usuario"
                            class="input input-bordered w-full"
                            required
                        />
                    </div>
                     <div class="form-control">
                        <label for="phone" class="label">
                            <span class="label-text">Teléfono</span>
                        </label>
                        <input
                            name="phone"
                            id="phone"
                            type="tel"
                            placeholder="5512345678"
                            class="input input-bordered w-full"
                            required
                            minlength="10"
                            maxlength="10"
                        />
                    </div>
                    <div class="form-control">
                        <label for="password" class="label">
                            <span class="label-text">Contraseña</span>
                        </label>
                        <input
                            name="password"
                            id="password"
                            type="password"
                            class="input input-bordered w-full"
                            required
                        />
                    </div>
                     <div class="form-control">
                        <label for="passwordConfirm" class="label">
                            <span class="label-text">Confirmar Contraseña</span>
                        </label>
                        <input
                            name="passwordConfirm"
                            id="passwordConfirm"
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
                        <span>Registrarse</span>
                    </button>
                </div>
                <div class="divider text-xs">¿Ya tienes una cuenta?</div>
                <a href="#/auth/login" class="btn btn-ghost w-full">
                    Iniciar Sesión
                </a>
            </div>
        </div>
    </form>
</div>