<script>
    // @ts-nocheck
    import { pb } from "$lib/pocketbase.js";
    import { toast } from "svelte-sonner";
    import dayjs from "dayjs";
    import Icon from "$lib/components/ui/Icon.svelte";

    const state = $state({
        page: 1,
        perPage: 9,
        searchTerm: "",
        debounceTimer: null,
        campaigns: [],
        totalPages: 0,
        loading: true,
    });

    async function loadCampaigns() {
        state.loading = true;
        try {
            const filter = state.searchTerm ? `name ~ "${state.searchTerm}"` : "";
            const result = await pb.collection("campaigns_config").getList(state.page, state.perPage, {
                filter: filter,
                sort: "-created",
            });
            
            state.campaigns = result.items;
            state.totalPages = result.totalPages;
        } catch (error) {
            console.error("Error loading campaigns:", error);
            toast.error("Error al cargar las campañas");
            state.campaigns = [];
            state.totalPages = 0;
        } finally {
            state.loading = false;
        }
    }

    // Efecto para recargar cuando cambian los filtros
    $effect(() => {
        loadCampaigns();
    });

    function handleSearchInput() {
        clearTimeout(state.debounceTimer);
        state.debounceTimer = setTimeout(() => {
            state.page = 1;
        }, 300);
    }

    function getStatusClass(status) {
        const statusMap = {
            draft: "badge-info",
            sending: "badge-warning",
            completed: "badge-success",
            failed: "badge-error",
        };
        return statusMap[status] || "badge-ghost";
    }

    async function deleteCampaign(campaignId, campaignName) {
        if (!confirm(`¿Estás seguro de eliminar la campaña "${campaignName}"?\n\nEsto eliminará también todos los mensajes asociados.`)) {
            return;
        }

        try {

            // Luego eliminar la campaña
            await pb.collection("campaigns_config").delete(campaignId);

            toast.success("Campaña eliminada correctamente");
            
            // Recargar la lista
            await loadCampaigns();
            
        } catch (error) {
            console.error("Error al eliminar campaña:", error);
            toast.error("Error al eliminar la campaña: " + error.message);
        }
    }

    function getDisplayMessage(campaign) {
        if (campaign.message.includes("<ORIGINAL_URL>") && campaign.original_url) {
            return campaign.message.replace("<ORIGINAL_URL>", campaign.original_url);
        }
        return campaign.message;
    }
</script>

<div class="space-y-6">
    <!-- Header -->
    <div class="flex flex-col sm:flex-row justify-between items-center gap-4">
        <h1 class="text-2xl font-bold items-center flex gap-1">
            <Icon name="ix:sms" width="24" height="24" />
            Campañas</h1>
        <a href="#/campaigns/new" class="btn btn-primary w-full sm:w-auto">
            <Icon name="fluent-mdl2:campaign-template" width="24" height="24" />
            Nueva Campaña
        </a>
    </div>

    <!-- Búsqueda -->
    <div class="form-control">
        <input
            type="text"
            placeholder="Buscar por nombre de campaña..."
            class="input input-bordered w-full"
            bind:value={state.searchTerm}
            oninput={handleSearchInput}
        />
    </div>

    <!-- Lista de Campañas -->
    {#if state.loading}
        <div class="text-center p-12">
            <span class="loading loading-spinner loading-lg"></span>
        </div>
    {:else if state.campaigns.length > 0}
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {#each state.campaigns as campaign (campaign.id)}
                <div class="card bg-base-100 shadow-xl">
                    <div class="card-body">
                        <!-- Header con título y estado -->
                        <div class="flex justify-between items-start gap-2">
                            <div class="flex-1">
                                <label for="title-{campaign.id}" class="label">
                                    <span class="label-text">Título de la campaña:</span>
                                </label>
                                <h2 class="card-title text-lg" id="title-{campaign.id}">
                                    {campaign.name}
                                </h2>
                            </div>
                            <div class="badge {getStatusClass(campaign.status)}">
                                {campaign.status}
                            </div>
                        </div>

                        <!-- Mensaje -->
                        <label for="message-{campaign.id}" class="label">
                            <span class="label-text">Mensaje:</span>
                        </label>
                        <p id="message-{campaign.id}" class="text-sm mb-3 line-clamp-3">
                            {getDisplayMessage(campaign)}
                        </p>

                        <!-- Stats -->
                        <div class="grid gap-2 text-sm text-base-content/70">
                            <div class="flex items-center gap-2">
                                <Icon name="mdi:account-multiple-outline" width="16" height="16" />
                                <span>{campaign.total_contacts} contactos</span>
                            </div>
                            <div class="flex items-center gap-2">
                                <Icon name="mdi:message-outline" width="16" height="16" />
                                <span>Tamaño: {campaign.message.length}/160</span>
                            </div>
                            {#if campaign.tracking}
                                <div class="flex items-center gap-2">
                                    <Icon name="mdi:link-variant" width="16" height="16" />
                                    <span class="text-success">Tracking activado</span>
                                </div>
                            {/if}
                            <div class="flex items-center gap-2">
                                <Icon name="mdi:calendar-clock" width="16" height="16" />
                                <span>Creada: {dayjs(campaign.created).format("DD/MM/YYYY HH:mm")}</span>
                            </div>
                        </div>

                        <!-- Acciones -->
                        <div class="card-actions justify-end mt-4">
                            <button
                                onclick={() => deleteCampaign(campaign.id, campaign.name)}
                                class="btn btn-error btn-sm"
                            >
                                Eliminar
                                <Icon name="mdi:delete" width="16" height="16" />
                            </button>
                            <a
                                href="#/campaigns/send/{campaign.id}"
                                class="btn btn-secondary btn-sm"
                            >
                                Enviar
                                <Icon name="mdi:send" width="16" height="16" />
                            </a>
                            {#if campaign.status === "completed"}
                                <a
                                href="#/campaigns/analytics/{campaign.id}"
                                class="btn btn-primary btn-sm"
                            >
                                Analytics
                                <Icon name="mdi:chart-line" width="16" height="16" />
                            </a>
                            {/if}
                        </div>
                    </div>
                </div>
            {/each}
        </div>
    {:else}
        <div class="text-center p-12">
            <div class="text-6xl mb-4">📭</div>
            <p class="text-lg font-semibold mb-2">No se encontraron campañas</p>
            {#if state.searchTerm}
                <p class="text-sm text-base-content/70">
                    Intenta con otro término de búsqueda
                </p>
            {:else}
                <p class="text-sm text-base-content/70">
                    Crea tu primera campaña para comenzar
                </p>
            {/if}
        </div>
    {/if}

    <!-- Paginación -->
    {#if state.totalPages > 1}
        <div class="flex justify-center">
            <div class="join">
                {#each Array(state.totalPages) as _, i}
                    <button
                        class="join-item btn {state.page === i + 1 ? 'btn-active' : ''}"
                        onclick={() => (state.page = i + 1)}
                    >
                        {i + 1}
                    </button>
                {/each}
            </div>
        </div>
    {/if}
</div>
