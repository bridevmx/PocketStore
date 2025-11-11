<script>
    // @ts-nocheck
    import { pb } from "$lib/pocketbase.js";
    import { toast } from "svelte-sonner";
    import dayjs from "dayjs";
    import Icon from "$lib/components/ui/Icon.svelte";
    import { onMount } from "svelte";

    const state = $state({
        contacts: [],
        searchTerm: "",
        sortBy: "created",
        sortOrder: "desc",
        loading: true,
        submitting: false,
        debounceTimer: null,
        selectedContacts: [],
        
        // Modal de formulario
        showFormModal: false,
        editingId: null,
        formData: {
            name: "",
            phone: "",
            show: true,
        },

        // Paginación
        page: 1,
        perPage: 30,
        totalItems: 0,
        totalPages: 0,
    });

    async function loadContacts() {
        state.loading = true;
        try {
            // Construir filtro de búsqueda si existe
            let filter = "";
            if (state.searchTerm.trim()) {
                filter = `name ~ "${state.searchTerm}" || phone ~ "${state.searchTerm}"`;
            }

            const result = await pb.collection("contacts").getList(state.page, state.perPage, {
                sort: `${state.sortOrder === "asc" ? "" : "-"}${state.sortBy}`,
                filter: filter,
            });

            state.contacts = result.items;
            state.totalItems = result.totalItems;
            state.totalPages = result.totalPages;
        } catch (error) {
            console.error("Error loading contacts:", error);
            toast.error("Error al cargar contactos: " + error.message);
        } finally {
            state.loading = false;
        }
    }

    function handleSearch() {
        clearTimeout(state.debounceTimer);
        state.debounceTimer = setTimeout(() => {
            state.page = 1;
            loadContacts();
        }, 300);
    }

    function handleSort(field) {
        if (state.sortBy === field) {
            state.sortOrder = state.sortOrder === "asc" ? "desc" : "asc";
        } else {
            state.sortBy = field;
            state.sortOrder = "asc";
        }
        state.page = 1;
        loadContacts();
    }

    function changePage(newPage) {
        state.page = newPage;
        loadContacts();
    }

    function openNewForm() {
        state.editingId = null;
        state.formData = { name: "", phone: "", show: true };
        state.showFormModal = true;
    }

    function openEditForm(contact) {
        state.editingId = contact.id;
        state.formData = {
            name: contact.name,
            phone: contact.phone,
            show: contact.show,
        };
        state.showFormModal = true;
    }

    function closeFormModal() {
        state.showFormModal = false;
        state.editingId = null;
    }

    async function saveContact(e) {
        e.preventDefault();
        
        if (!state.formData.name.trim()) {
            toast.error("El nombre es requerido");
            return;
        }

        if (!state.formData.phone.trim()) {
            toast.error("El teléfono es requerido");
            return;
        }

        state.submitting = true;
        try {
            if (state.editingId) {
                // Actualizar
                await pb.collection("contacts").update(state.editingId, state.formData);
                toast.success("Contacto actualizado correctamente");
            } else {
                // Crear
                await pb.collection("contacts").create(state.formData);
                toast.success("Contacto creado correctamente");
            }

            closeFormModal();
            loadContacts();
        } catch (error) {
            console.error("Error saving contact:", error);
            toast.error("Error al guardar: " + error.message);
        } finally {
            state.submitting = false;
        }
    }

    async function deleteContact(id, name) {
        if (!confirm(`¿Estás seguro de eliminar a "${name}"?`)) {
            return;
        }

        try {
            await pb.collection("contacts").delete(id);
            toast.success("Contacto eliminado");
            loadContacts();
        } catch (error) {
            console.error("Error deleting contact:", error);
            toast.error("Error al eliminar: " + error.message);
        }
    }

    function toggleContactSelection(id) {
        const index = state.selectedContacts.indexOf(id);
        if (index > -1) {
            state.selectedContacts.splice(index, 1);
        } else {
            state.selectedContacts.push(id);
        }
    }

    function toggleSelectAll() {
        if (state.selectedContacts.length === state.contacts.length) {
            state.selectedContacts = [];
        } else {
            state.selectedContacts = state.contacts.map(c => c.id);
        }
    }

    async function bulkToggleShow(show) {
        if (state.selectedContacts.length === 0) {
            toast.warning("Selecciona al menos un contacto");
            return;
        }

        try {
            state.submitting = true;
            for (const id of state.selectedContacts) {
                await pb.collection("contacts").update(id, { show });
            }

            toast.success(`${state.selectedContacts.length} contactos ${show ? "activados" : "desactivados"}`);
            state.selectedContacts = [];
            loadContacts();
        } catch (error) {
            console.error("Error bulk updating:", error);
            toast.error("Error: " + error.message);
        } finally {
            state.submitting = false;
        }
    }

    async function bulkDelete() {
        if (state.selectedContacts.length === 0) {
            toast.warning("Selecciona al menos un contacto");
            return;
        }

        if (!confirm(`¿Eliminar ${state.selectedContacts.length} contactos? Esta acción no se puede deshacer.`)) {
            return;
        }

        try {
            state.submitting = true;
            for (const id of state.selectedContacts) {
                await pb.collection("contacts").delete(id);
            }

            toast.success(`${state.selectedContacts.length} contactos eliminados`);
            state.selectedContacts = [];
            loadContacts();
        } catch (error) {
            console.error("Error bulk deleting:", error);
            toast.error("Error: " + error.message);
        } finally {
            state.submitting = false;
        }
    }

    function exportToCSV() {
        const headers = ["Nombre", "Teléfono", "Activo", "Creado"];
        const rows = state.contacts.map(c => [
            c.name,
            c.phone,
            c.show ? "Sí" : "No",
            dayjs(c.created).format("DD/MM/YYYY HH:mm"),
        ]);

        let csv = headers.join(",") + "\n";
        rows.forEach(row => {
            csv += row.map(cell => `"${cell}"`).join(",") + "\n";
        });

        const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
        const link = document.createElement("a");
        const url = URL.createObjectURL(blob);
        link.setAttribute("href", url);
        link.setAttribute("download", `contactos_${dayjs().format("YYYYMMDD_HHmmss")}.csv`);
        link.click();
        toast.success("CSV descargado");
    }

    onMount(() => {
        loadContacts();
    });
</script>

<div class="space-y-6">
    <!-- Header -->
    <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
            <h1 class="text-3xl font-bold">Gestión de Contactos</h1>
            <p class="text-base-content/70 mt-1">
                Total: {state.totalItems} contactos
            </p>
        </div>
        <button 
            class="btn btn-primary"
            onclick={openNewForm}
        >
            <Icon name="mdi:plus" width="20" height="20" />
            Nuevo Contacto
        </button>
    </div>

    <!-- Búsqueda y filtros -->
    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div class="form-control">
            <input
                type="text"
                placeholder="Buscar por nombre o teléfono..."
                class="input input-bordered w-full"
                bind:value={state.searchTerm}
                oninput={handleSearch}
            />
        </div>
        <div class="flex gap-2">
            <a href="#/contacts/import" class="btn btn-outline btn-sm">
                <Icon name="mdi:cloud-upload" width="18" height="18" />
                Importar Contactos
            </a>
            <button class="btn btn-outline btn-sm" onclick={() => exportToCSV()}>
                <Icon name="mdi:download" width="18" height="18" />
                Descargar CSV
            </button>
            <button class="btn btn-outline btn-sm" onclick={() => loadContacts()}>
                <Icon name="mdi:refresh" width="18" height="18" />
                Actualizar
            </button>
        </div>
    </div>

    <!-- Acciones por lotes -->
    {#if state.selectedContacts.length > 0}
        <div class="alert alert-info">
            <div class="flex items-center justify-between w-full">
                <span>
                    {state.selectedContacts.length} contacto{state.selectedContacts.length > 1 ? "s" : ""} seleccionado{state.selectedContacts.length > 1 ? "s" : ""}
                </span>
                <div class="flex gap-2">
                    <button 
                        class="btn btn-sm btn-success"
                        onclick={() => bulkToggleShow(true)}
                        disabled={state.submitting}
                    >
                        <Icon name="mdi:check-circle" width="16" height="16" />
                        Activar
                    </button>
                    <button 
                        class="btn btn-sm btn-warning"
                        onclick={() => bulkToggleShow(false)}
                        disabled={state.submitting}
                    >
                        <Icon name="mdi:close-circle" width="16" height="16" />
                        Desactivar
                    </button>
                    <button 
                        class="btn btn-sm btn-error"
                        onclick={bulkDelete}
                        disabled={state.submitting}
                    >
                        <Icon name="mdi:trash-can" width="16" height="16" />
                        Eliminar
                    </button>
                    <button 
                        class="btn btn-sm btn-ghost"
                        onclick={() => (state.selectedContacts = [])}
                    >
                        Limpiar
                    </button>
                </div>
            </div>
        </div>
    {/if}

    <!-- Tabla de contactos -->
    {#if state.loading}
        <div class="text-center p-12">
            <span class="loading loading-spinner loading-lg"></span>
        </div>
    {:else if state.contacts.length > 0}
        <div class="card bg-base-100 shadow-xl">
            <div class="overflow-x-auto">
                <table class="table table-compact w-full">
                    <thead>
                        <tr>
                            <th class="w-12">
                                <input
                                    type="checkbox"
                                    class="checkbox"
                                    checked={state.selectedContacts.length === state.contacts.length && state.contacts.length > 0}
                                    onchange={toggleSelectAll}
                                />
                            </th>
                            <th
                                class="cursor-pointer hover:bg-base-200 select-none"
                                onclick={() => handleSort("name")}
                            >
                                <div class="flex items-center gap-2">
                                    Nombre
                                    {#if state.sortBy === "name"}
                                        <Icon
                                            name={state.sortOrder === "asc" ? "mdi:sort-ascending" : "mdi:sort-descending"}
                                            width="16"
                                            height="16"
                                        />
                                    {/if}
                                </div>
                            </th>
                            <th
                                class="cursor-pointer hover:bg-base-200 select-none"
                                onclick={() => handleSort("phone")}
                            >
                                <div class="flex items-center gap-2">
                                    Teléfono
                                    {#if state.sortBy === "phone"}
                                        <Icon
                                            name={state.sortOrder === "asc" ? "mdi:sort-ascending" : "mdi:sort-descending"}
                                            width="16"
                                            height="16"
                                        />
                                    {/if}
                                </div>
                            </th>
                            <th>Estado</th>
                            <th
                                class="cursor-pointer hover:bg-base-200 select-none"
                                onclick={() => handleSort("created")}
                            >
                                <div class="flex items-center gap-2">
                                    Creado
                                    {#if state.sortBy === "created"}
                                        <Icon
                                            name={state.sortOrder === "asc" ? "mdi:sort-ascending" : "mdi:sort-descending"}
                                            width="16"
                                            height="16"
                                        />
                                    {/if}
                                </div>
                            </th>
                            <th>Acciones</th>
                        </tr>
                    </thead>
                    <tbody>
                        {#each state.contacts as contact (contact.id)}
                            <tr class="hover:bg-base-200">
                                <td>
                                    <input
                                        type="checkbox"
                                        class="checkbox"
                                        checked={state.selectedContacts.includes(contact.id)}
                                        onchange={() => toggleContactSelection(contact.id)}
                                    />
                                </td>
                                <td class="font-semibold">{contact.name}</td>
                                <td>
                                    <code class="bg-base-200 px-2 py-1 rounded">{contact.phone}</code>
                                </td>
                                <td>
                                    <span
                                        class="badge {contact.show ? "badge-success" : "badge-neutral"}"
                                    >
                                        {contact.show ? "Activo" : "Inactivo"}
                                    </span>
                                </td>
                                <td class="text-sm text-base-content/70">
                                    {dayjs(contact.created).format("DD/MM/YYYY HH:mm")}
                                </td>
                                <td>
                                    <div class="flex gap-2">
                                        <button
                                            class="btn btn-ghost btn-xs"
                                            onclick={() => openEditForm(contact)}
                                        >
                                            <Icon name="mdi:pencil" width="16" height="16" />
                                            Editar
                                        </button>
                                        <button
                                            class="btn btn-ghost btn-xs text-error"
                                            onclick={() => deleteContact(contact.id, contact.name)}
                                        >
                                            <Icon name="mdi:trash-can" width="16" height="16" />
                                            Eliminar
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        {/each}
                    </tbody>
                </table>
            </div>

            <!-- Paginación -->
            {#if state.totalPages > 1}
                <div class="card-body">
                    <div class="flex justify-center items-center gap-2">
                        <button
                            class="btn btn-sm"
                            onclick={() => changePage(Math.max(1, state.page - 1))}
                            disabled={state.page === 1}
                        >
                            Anterior
                        </button>
                        <div class="join">
                            {#each Array(state.totalPages) as _, i}
                                <button
                                    class="join-item btn btn-sm {state.page === i + 1 ? "btn-active" : ""}"
                                    onclick={() => changePage(i + 1)}
                                >
                                    {i + 1}
                                </button>
                            {/each}
                        </div>
                        <button
                            class="btn btn-sm"
                            onclick={() => changePage(Math.min(state.totalPages, state.page + 1))}
                            disabled={state.page === state.totalPages}
                        >
                            Siguiente
                        </button>
                    </div>
                </div>
            {/if}
        </div>
    {:else}
        <div class="text-center p-12">
            <Icon name="mdi:account-group-outline" width="64" height="64" class="mx-auto mb-4 opacity-30" />
            <p class="text-lg font-semibold">No hay contactos</p>
            <p class="text-base-content/70 mt-1">
                {state.searchTerm ? "No coinciden con tu búsqueda" : "Crea tu primer contacto"}
            </p>
        </div>
    {/if}
</div>

<!-- Modal del formulario -->
{#if state.showFormModal}
    <dialog class="modal modal-open">
        <div class="modal-box w-11/12 max-w-md">
            <h3 class="font-bold text-lg mb-4">
                {state.editingId ? "Editar Contacto" : "Nuevo Contacto"}
            </h3>

            <form onsubmit={saveContact} class="space-y-4">
                <label class="form-control">
                    <div class="label">
                        <span class="label-text">Nombre</span>
                    </div>
                    <input
                        type="text"
                        placeholder="Ej: Juan Pérez"
                        class="input input-bordered"
                        bind:value={state.formData.name}
                        required
                    />
                </label>

                <label class="form-control">
                    <div class="label">
                        <span class="label-text">Teléfono</span>
                    </div>
                    <input
                        type="tel"
                        placeholder="Ej: 5551234567"
                        class="input input-bordered"
                        bind:value={state.formData.phone}
                        required
                    />
                </label>

                <label class="form-control">
                    <div class="label cursor-pointer">
                        <span class="label-text">Activo</span>
                        <input
                            type="checkbox"
                            class="toggle toggle-primary"
                            bind:checked={state.formData.show}
                        />
                    </div>
                </label>

                <div class="modal-action">
                    <button type="button" class="btn" onclick={closeFormModal}>
                        Cancelar
                    </button>
                    <button type="submit" class="btn btn-primary" disabled={state.submitting}>
                        {#if state.submitting}
                            <span class="loading loading-spinner loading-sm"></span>
                        {/if}
                        {state.editingId ? "Actualizar" : "Crear"}
                    </button>
                </div>
            </form>
        </div>
        <form method="dialog" class="modal-backdrop">
            <button onclick={closeFormModal}>close</button>
        </form>
    </dialog>
{/if}
