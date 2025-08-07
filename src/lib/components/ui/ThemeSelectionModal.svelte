<script>
    /**
     * Props:
     * - isOpen: Controla si el modal está visible.
     * - currentTheme: El tema actual para resaltarlo en la lista.
     * - onSelect: Callback que se ejecuta al seleccionar un tema.
     * - onClose: Callback para cerrar el modal.
     */
    let { isOpen = false, currentTheme = '', onSelect, onClose } = $props();

    let dialogElement;

    const themes = [
        "light", "dark", "cupcake", "bumblebee", "emerald", "corporate", "synthwave",
        "retro", "cyberpunk", "valentine", "halloween", "garden", "forest", "aqua",
        "lofi", "pastel", "fantasy", "wireframe", "black", "luxury", "dracula",
        "cmyk", "autumn", "business", "acid", "lemonade", "night", "coffee",
        "winter", "dim", "nord", "sunset", "caramellatte", "abyss", "silk"
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

    function handleSelect(theme) {
        if (onSelect) {
            onSelect(theme);
        }
    }
</script>

<dialog bind:this={dialogElement} class="modal" onclose={onClose}>
    <div class="modal-box w-11/12 max-w-4xl">
        <h3 class="font-bold text-lg">Selecciona un Tema</h3>
        
        
        <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 py-4 overflow-y-auto max-h-[70vh]">
            {#each themes as theme}
                <button
                    onclick={() => handleSelect(theme)}
                    class="border-2 rounded-lg transition-all duration-200"
                    class:border-primary={currentTheme === theme}
                    class:border-transparent={currentTheme !== theme}
                    aria-label={`Seleccionar tema ${theme}`}
                >
                    
                    <div data-theme={theme} class="bg-base-100 text-base-content rounded-lg p-4 w-full cursor-pointer">
                        <div class="font-bold capitalize">{theme}</div>
                        <div class="flex flex-wrap gap-1 mt-2">
                            <div class="bg-primary w-5 h-5 rounded-full"></div>
                            <div class="bg-secondary w-5 h-5 rounded-full"></div>
                            <div class="bg-accent w-5 h-5 rounded-full"></div>
                            <div class="bg-neutral w-5 h-5 rounded-full"></div>
                        </div>
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