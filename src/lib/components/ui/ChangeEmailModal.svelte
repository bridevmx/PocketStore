<script>
    import { requestEmailChange } from '$lib/stores/auth.store.svelte.js';
    import { toast } from 'svelte-sonner';

    let { isOpen = false, onClose } = $props();
    let isLoading = $state(false);
    let dialogElement;

    $effect(() => {
        if (dialogElement) {
            if (isOpen) dialogElement.showModal();
            else dialogElement.close();
        }
    });

    async function handleSubmit(e) {
        e.preventDefault();
        isLoading = true;
        const formData = new FormData(e.target);
        const newEmail = formData.get('newEmail')?.toString().trim();
        
        if (!newEmail) {
            toast.error("Por favor, ingresa un nuevo correo.");
            isLoading = false;
            return;
        }

        try {
            
            await requestEmailChange(newEmail);
            toast.success("¡Revisa tu nuevo correo! Hemos enviado un enlace de confirmación.");
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
        <h3 class="font-bold text-lg">Cambiar Correo Electrónico</h3>
        <p class="py-2 text-sm">Se enviará un enlace de confirmación a tu nueva dirección de correo.</p>
        <form onsubmit={handleSubmit} class="space-y-4 mt-4">
            <div class="form-control">
                <label class="label" for="newEmail"><span class="label-text">Nuevo Correo</span></label>
                <input id="newEmail" name="newEmail" type="email" class="input input-bordered" required />
            </div>

            <div class="modal-action">
                <button type="button" class="btn btn-ghost" onclick={onClose}>Cancelar</button>
                <button type="submit" class="btn btn-primary" disabled={isLoading}>
                    {#if isLoading}<span class="loading loading-spinner"></span>{/if}
                    Solicitar Cambio
                </button>
            </div>
        </form>
    </div>
    <form method="dialog" class="modal-backdrop"><button>close</button></form>
</dialog>