<script>
    // @ts-nocheck
    import { pb } from "$lib/pocketbase.js";
    import { toast } from "svelte-sonner";
    import { router } from "tinro";
    import { onMount, onDestroy } from "svelte";

    const state = $state({
        name: "",
        message: "",
        tracking: false,
        original_url: "",
        contacts: [],
        selectedContacts: [],
        searchTerm: "",
        loading: true,
        submitting: false,
    });

    let messageTextarea;

    async function loadContacts() {
        try {
            state.loading = true;
            const records = await pb.collection("contacts").getFullList({
                sort: "name",
                filter: 'show = true'
            });
            state.contacts = records;
        } catch (error) {
            toast.error(`Error al cargar contactos: ${error.message}`);
        } finally {
            state.loading = false;
        }
    }

    const messageLength = $derived(state.message.length);
    
    // Detecta si hay placeholder en el mensaje
    const hasTemplate = $derived(state.message.includes('<ORIGINAL_URL>'));

    const filteredContacts = $derived(
        state.contacts.filter(
            (contact) =>
                contact.name.toLowerCase().includes(state.searchTerm.toLowerCase()) ||
                contact.phone.includes(state.searchTerm)
        )
    );

    // Verifica si todos los contactos filtrados están seleccionados
    const allSelected = $derived(
        filteredContacts.length > 0 && 
        filteredContacts.every(contact => state.selectedContacts.includes(contact.id))
    );

    function toggleContact(id) {
        const index = state.selectedContacts.indexOf(id);
        if (index > -1) {
            state.selectedContacts.splice(index, 1);
        } else {
            state.selectedContacts.push(id);
        }
    }

    function toggleAllContacts() {
        if (allSelected) {
            // Deseleccionar todos los contactos filtrados
            filteredContacts.forEach(contact => {
                const index = state.selectedContacts.indexOf(contact.id);
                if (index > -1) {
                    state.selectedContacts.splice(index, 1);
                }
            });
        } else {
            // Seleccionar todos los contactos filtrados que no estén ya seleccionados
            filteredContacts.forEach(contact => {
                if (!state.selectedContacts.includes(contact.id)) {
                    state.selectedContacts.push(contact.id);
                }
            });
        }
    }

    // Generador de message_id único
    function generateMessageId() {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
        let result = '';
        for (let i = 0; i < 16; i++) {
            result += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return result;
    }

    // Función para insertar la plantilla en la posición del cursor
    function insertTemplate() {
        if (!messageTextarea) return;

        const template = '<ORIGINAL_URL>';
        const start = messageTextarea.selectionStart;
        const end = messageTextarea.selectionEnd;
        
        // Insertar en la posición del cursor
        const before = state.message.substring(0, start);
        const after = state.message.substring(end);
        state.message = before + template + after;
        
        // Restaurar el foco y posicionar el cursor después de la plantilla
        setTimeout(() => {
            messageTextarea.focus();
            const newPosition = start + template.length;
            messageTextarea.setSelectionRange(newPosition, newPosition);
        }, 0);
        
        toast.success("Plantilla insertada");
    }

    // Manejador de eventos de teclado
    function handleKeydown(e) {
        // Ctrl+Shift+L
        if (e.ctrlKey && e.shiftKey && e.key === 'L') {
            e.preventDefault();
            insertTemplate();
        }
    }

    async function handleSubmit(e) {
        e.preventDefault();
        if (state.selectedContacts.length === 0) {
            toast.warning("Debes seleccionar al menos un contacto.");
            return;
        }

        // Validación: si tracking está activo y hay plantilla, se requiere original_url
        if (state.tracking && hasTemplate && !state.original_url.trim()) {
            toast.warning("Debes ingresar la URL original para crear URLs de tracking.");
            return;
        }

        state.submitting = true;
        try {
            // Paso 1: Crear la campaña en campaigns_config
            const newCampaign = await pb.collection("campaigns_config").create({
                name: state.name,
                message: state.message,
                tracking: state.tracking,
                original_url: state.tracking ? state.original_url : "",
                status: "draft",
                total_contacts: state.selectedContacts.length
            });

            // Paso 2: Preparar los contactos con message_id para el endpoint
            const contactsData = state.selectedContacts.map(contactId => ({
                contact: contactId,
                message_id: generateMessageId()
            }));

            // Paso 3: Llamar al endpoint personalizado para crear mensajes y URLs
            const response = await fetch(`${pb.baseUrl}/api/campaigns/new`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    campaign_config: newCampaign.id,
                    contacts: contactsData,
                    tracking: state.tracking,
                    originalUrl: state.tracking ? state.original_url : null,
                    title: state.name
                })
            });

            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.error || 'Error al crear la campaña');
            }

            console.log('Campaña creada:', result);
            
            if (state.tracking) {
                toast.success(`Campaña creada con ${result.contactsProcessed} contactos y ${result.urls.length} URLs de tracking`);
            } else {
                toast.success(`Campaña creada con ${result.contactsProcessed} contactos`);
            }
            
            router.goto("/campaigns");

        } catch (error) {
            console.error("Error creating campaign:", error);
            toast.error(`Error al crear la campaña: ${error.message}`);
        } finally {
            state.submitting = false;
        }
    }

    onMount(() => {
        loadContacts();
        // Agregar event listener para el atajo de teclado
        window.addEventListener('keydown', handleKeydown);
    });

    onDestroy(() => {
        // Limpiar event listener
        window.removeEventListener('keydown', handleKeydown);
    });
</script>

<div class="flex flex-col lg:flex-row gap-8 p-4">
    <!-- Columna del Formulario -->
    <div class="flex-1">
        <form class="form-control space-y-4" onsubmit={handleSubmit}>
            <h1 class="text-2xl font-bold mb-4">Nueva Campaña</h1>

            <label class="form-control w-full">
                <div class="label"><span class="label-text">Nombre de la Campaña</span></div>
                <input 
                    type="text" 
                    placeholder="Ej: Promoción de Verano" 
                    class="input input-bordered w-full" 
                    bind:value={state.name} 
                    required 
                />
            </label> 

            <label class="form-control w-full grid mt-8">
                <div class="label">
                    <span class="label-text">Mensaje SMS</span>
                    <span class="label-text-alt {messageLength > 160 ? 'text-error' : ''}">{messageLength}/160</span>
                </div>
                <textarea 
                    bind:this={messageTextarea}
                    class="textarea textarea-bordered h-32 w-full" 
                    placeholder="Escribe tu mensaje aquí... Usa <ORIGINAL_URL> donde quieras insertar el enlace de tracking." 
                    bind:value={state.message} 
                    required 
                    maxlength="160"
                ></textarea>
                <div class="label">
                    <span class="label-text-alt text-info">
                        💡 Presiona <kbd class="kbd kbd-xs">Ctrl</kbd> + <kbd class="kbd kbd-xs">Shift</kbd> + <kbd class="kbd kbd-xs">L</kbd> para insertar la plantilla
                    </span>
                </div>
            </label>

            <!-- Toggle para tracking -->
            <div class="form-control">
                <label class="label cursor-pointer justify-start gap-4">
                    <input 
                        type="checkbox" 
                        class="toggle toggle-primary" 
                        bind:checked={state.tracking}
                    />
                    <div>
                        <span class="label-text font-semibold">Activar Tracking de Enlaces</span>
                        <p class="text-sm text-gray-600 mt-1">
                            Si está activado, se crearán URLs cortas únicas y reemplazará &lt;ORIGINAL_URL&gt; en el mensaje
                        </p>
                    </div>
                </label>
            </div>

            <!-- Input para la URL original -->
            {#if hasTemplate && state.tracking}
                <label class="form-control w-full">
                    <div class="label">
                        <span class="label-text font-semibold">URL Original para Tracking</span>
                        <span class="label-text-alt text-info">Requerida</span>
                    </div>
                    <input 
                        type="url" 
                        placeholder="https://ejemplo.com/promocion" 
                        class="input input-bordered w-full" 
                        bind:value={state.original_url}
                        required
                    />
                    <div class="label">
                        <span class="label-text-alt text-gray-600">
                            Esta URL será usada para crear URLs cortas únicas para cada contacto
                        </span>
                    </div>
                </label>
            {/if}

            <!-- Advertencias -->
            {#if state.tracking && hasTemplate && !state.original_url.trim()}
                <div class="alert alert-warning">
                    <span>⚠️ Debes ingresar la URL original para activar el tracking</span>
                </div>
            {/if}

            {#if hasTemplate && !state.tracking}
                <div class="alert alert-info">
                    <span>ℹ️ Detección de plantilla: Activa tracking para reemplazar &lt;ORIGINAL_URL&gt; con URLs cortas</span>
                </div>
            {/if}

            <div>
                <button 
                    type="button" 
                    class="btn btn-info btn-outline" 
                    onclick={() => contact_modal.showModal()}
                >
                    <span class="icon-[mdi--account-multiple-plus]"></span>
                    Seleccionar Contactos ({state.selectedContacts.length})
                </button>
            </div>

            <div class="grid grid-cols-2 gap-4 pt-4">
                <a href="#/campaigns" class="btn btn-ghost">Cancelar</a>
                <button type="submit" class="btn btn-primary" disabled={state.submitting || (state.tracking && hasTemplate && !state.original_url.trim())}>
                    {#if state.submitting}
                        <span class="loading loading-spinner"></span>
                    {/if}
                    Guardar Campaña
                </button>
            </div>
        </form>
    </div>

    <!-- Panel de información -->
    <div class="flex-1 lg:max-w-md">
        <div class="card bg-base-200 shadow-xl">
            <div class="card-body">
                <h2 class="card-title">💡 Información</h2>
                
                <div class="space-y-4">
                    <div>
                        <h3 class="font-semibold text-sm">⌨️ Atajo de Teclado</h3>
                        <p class="text-sm text-gray-600 mt-1">
                            Presiona <kbd class="kbd kbd-sm">Ctrl</kbd> + <kbd class="kbd kbd-sm">Shift</kbd> + <kbd class="kbd kbd-sm">L</kbd> 
                            para insertar rápidamente la plantilla <code class="bg-base-300 px-1 rounded">&lt;ORIGINAL_URL&gt;</code>
                        </p>
                    </div>

                    <div>
                        <h3 class="font-semibold text-sm">📤 Proceso de Envío</h3>
                        <p class="text-sm text-gray-600 mt-1">
                            Una vez creada la campaña, podrás iniciarla desde el panel de control. 
                            MacroDroid procesará automáticamente los mensajes pendientes.
                        </p>
                    </div>

                    <div>
                        <h3 class="font-semibold text-sm">🔗 Tracking de Enlaces</h3>
                        <p class="text-sm text-gray-600 mt-1">
                            Si activas tracking, incluye <code class="bg-base-300 px-1 rounded">&lt;ORIGINAL_URL&gt;</code> 
                            en tu mensaje. Se crearán URLs cortas únicas para cada contacto automáticamente.
                        </p>
                    </div>

                    {#if hasTemplate}
                        <div class="alert alert-success">
                            <span>✅ Plantilla detectada: &lt;ORIGINAL_URL&gt;</span>
                        </div>
                    {/if}

                    <div>
                        <h3 class="font-semibold text-sm">⚡ Optimización</h3>
                        <p class="text-sm text-gray-600 mt-1">
                            El proceso de creación está optimizado con transacciones para mayor velocidad y confiabilidad.
                        </p>
                    </div>

                    <div>
                        <h3 class="font-semibold text-sm">⏸️ Control Total</h3>
                        <p class="text-sm text-gray-600 mt-1">
                            Podrás pausar, reanudar o cancelar la campaña en cualquier momento desde el panel.
                        </p>
                    </div>

                    {#if state.selectedContacts.length > 0}
                        <div class="alert alert-info">
                            <span>
                                ✅ {state.selectedContacts.length} contacto{state.selectedContacts.length > 1 ? 's' : ''} 
                                seleccionado{state.selectedContacts.length > 1 ? 's' : ''}
                            </span>
                        </div>
                    {/if}
                </div>
            </div>
        </div>
    </div>
</div>

<!-- Modal para seleccionar contactos -->
<dialog id="contact_modal" class="modal">
    <div class="modal-box w-11/12 max-w-2xl">
        <div class="flex justify-between items-center mb-4">
            <h3 class="font-bold text-lg">Seleccionar Contactos</h3>
            <button 
                type="button"
                class="btn btn-sm btn-primary"
                onclick={toggleAllContacts}
            >
                {allSelected ? 'Deseleccionar Todos' : 'Seleccionar Todos'}
            </button>
        </div>

        <input 
            type="text" 
            placeholder="Buscar contacto..." 
            class="input input-bordered w-full mb-4" 
            bind:value={state.searchTerm} 
        />

        <div class="max-h-96 overflow-y-auto space-y-2">
            {#if state.loading}
                <div class="text-center p-4"><span class="loading loading-spinner"></span></div>
            {:else if filteredContacts.length > 0}
                {#each filteredContacts as contact (contact.id)}
                    <label class="flex items-center gap-4 p-2 rounded-lg hover:bg-base-200 cursor-pointer">
                        <input
                            type="checkbox"
                            class="checkbox"
                            checked={state.selectedContacts.includes(contact.id)}
                            onchange={() => toggleContact(contact.id)}
                        />
                        <div>
                            <div class="font-bold">{contact.name}</div>
                            <div class="text-sm opacity-70">{contact.phone}</div>
                        </div>
                    </label>
                {/each}
            {:else}
                <p class="text-center p-4">No se encontraron contactos.</p>
            {/if}
        </div>

        <div class="modal-action">
            <form method="dialog">
                <button class="btn">Cerrar</button>
            </form>
        </div>
    </div>
    <form method="dialog" class="modal-backdrop"><button>close</button></form>
</dialog>
