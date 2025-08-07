<script>
    /**
     * Props que recibe el modal:
     * - isOpen: Un booleano para controlar la visibilidad.
     * - currentAvatar: La URL del avatar actualmente seleccionado para resaltarlo.
     * - onSelect: Callback que se ejecuta cuando se selecciona un avatar.
     * - onClose: Callback que se ejecuta para cerrar el modal.
     */
    let { isOpen = false, currentAvatar = '', onSelect, onClose } = $props();

    let dialogElement;

    const avatarUrls = [
        "https://avatar.iran.liara.run/public/job/police/male", "https://avatar.iran.liara.run/public/job/police/female",
        "https://avatar.iran.liara.run/public/job/doctor/male", "https://avatar.iran.liara.run/public/job/doctor/female",
        "https://avatar.iran.liara.run/public/job/designer/male", "https://avatar.iran.liara.run/public/job/designer/female",
        "https://avatar.iran.liara.run/public/job/chef/male", "https://avatar.iran.liara.run/public/job/chef/female",
        "https://avatar.iran.liara.run/public/job/farmer/male", "https://avatar.iran.liara.run/public/job/farmer/female",
        "https://avatar.iran.liara.run/public/job/firefighters/male", "https://avatar.iran.liara.run/public/job/firefighters/female",
        "https://avatar.iran.liara.run/public/job/operator/male", "https://avatar.iran.liara.run/public/job/operator/female",
        "https://avatar.iran.liara.run/public/job/lawyer/male", "https://avatar.iran.liara.run/public/job/lawyer/female",
        "https://avatar.iran.liara.run/public/job/teacher/male", "https://avatar.iran.liara.run/public/job/teacher/female",
        "https://avatar.iran.liara.run/public/job/astronomer/male", "https://avatar.iran.liara.run/public/job/astronomer/female"
    ];

    $effect(() => {
        if (dialogElement) {
            if (isOpen) {
                dialogElement.showModal();
            } else {
                dialogElement.close();
            }
        }
    });

    function handleSelect(url) {
        if (onSelect) {
            onSelect(url);
        }
    }
</script>


<dialog bind:this={dialogElement} class="modal" onclose={onClose}>
    <div class="modal-box w-11/12 max-w-2xl">
        <h3 class="font-bold text-lg">Selecciona tu Avatar</h3>
        
        <div class="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 gap-4 py-4 overflow-y-auto max-h-[60vh]">
            {#each avatarUrls as url}
                <button
                    onclick={() => handleSelect(url)}
                    class="avatar rounded-full transition-transform duration-200 hover:scale-110 focus:outline-none focus:ring-2 focus:ring-primary"
                    class:ring-2={currentAvatar === url}
                    class:ring-primary={currentAvatar === url}
                    class:ring-offset-base-100={currentAvatar === url}
                    class:ring-offset-2={currentAvatar === url}
                    aria-label="Seleccionar avatar"
                >
                    <div class="w-24 rounded-full">
                        <img src={url} alt="Avatar" />
                    </div>
                </button>
            {/each}
        </div>
        
        <div class="modal-action">
            
            <form method="dialog">
                <button class="btn">Cerrar</button>
            </form>
        </div>
    </div>
     <form method="dialog" class="modal-backdrop">
        <button>close</button>
    </form>
</dialog>