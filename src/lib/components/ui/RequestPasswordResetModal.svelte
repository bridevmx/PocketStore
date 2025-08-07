<script>
    import { requestPasswordReset } from '$lib/stores/auth.store.svelte.js';
    import { toast } from 'svelte-sonner';

    let { isOpen = false, onClose, email = '' } = $props();
    let isLoading = $state(false);
    let dialogElement;

    $effect(() => {
        if (dialogElement) {
            if (isOpen) dialogElement.showModal();
            else dialogElement.close();
        }
    });

    async function handleSubmit() {
        isLoading = true;
        try {
            await requestPasswordReset(email);
            toast.success("¡Revisa tu correo! Hemos enviado un enlace para restablecer tu contraseña.");
            onClose();
        } catch (error) {
            toast.error(error.message);
        } finally {
            isLoading = false;
        }
    }
</script>

<dialog bind:this={dialogElement} class="modal" onclose={onClose}>
    <div class="modal-box">
        <h3 class="font-bold text-lg">Restablecer Contraseña</h3>
        <p class="py-4">Se enviará un enlace para restablecer tu contraseña a <strong>{email}</strong>. ¿Deseas continuar?</p>
        <div class="modal-action">
            <button type="button" class="btn btn-ghost" onclick={onClose}>Cancelar</button>
            <button class="btn btn-primary" onclick={handleSubmit} disabled={isLoading}>
                {#if isLoading}<span class="loading loading-spinner"></span>{/if}
                Sí, enviar enlace
            </button>
        </div>
    </div>
    <form method="dialog" class="modal-backdrop"><button>close</button></form>
</dialog>