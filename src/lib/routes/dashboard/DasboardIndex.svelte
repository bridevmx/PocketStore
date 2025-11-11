<script>
    // @ts-nocheck
    import { pb } from "$lib/pocketbase.js";
    import { onMount } from "svelte";
    import dayjs from "dayjs";
    import relativeTime from "dayjs/plugin/relativeTime";
    import "dayjs/locale/es";
    import Icon from "$lib/components/ui/Icon.svelte";
    import { SettingsPage } from "$lib/stores/settingsPage.store.svelte";
    dayjs.extend(relativeTime);
    dayjs.locale("es");

    const state = $state({
        loading: true,
        stats: {
            totalCampaigns: 0,
            activeCampaigns: 0,
            completedCampaigns: 0,
            totalMessages: 0,
            pendingMessages: 0,
            sentMessages: 0,
            deliveredMessages: 0,
            failedMessages: 0,
            totalContacts: 0,
            activeContacts: 0,
            totalUrls: 0,
            activeUrls: 0,
            totalClicks: 0,
            uniqueClicks: 0,
        },
        recentCampaigns: [],
        topUrls: [],
        recentActivity: [],
        deliveryRate: 0,
        successRate: 0,
        clickRate: 0,
    });

    // Estadísticas derivadas
    const messageStats = $derived({
        total: state.stats.totalMessages,
        pending: state.stats.pendingMessages,
        sent: state.stats.sentMessages,
        delivered: state.stats.deliveredMessages,
        failed: state.stats.failedMessages,
    });

    const progressPercentage = $derived(
        messageStats.total > 0
            ? Math.round(((messageStats.sent + messageStats.delivered + messageStats.failed) / messageStats.total) * 100)
            : 0
    );

    async function loadDashboardData() {
        state.loading = true;
        try {
            // Cargar estadísticas de campañas
            const [campaigns, activeCampaigns, completedCampaigns] = await Promise.all([
                pb.collection("campaigns_config").getFullList(),
                pb.collection("campaigns_config").getList(1, 1, {
                    filter: 'status = "sending" || status = "paused"',
                }),
                pb.collection("campaigns_config").getList(1, 1, {
                    filter: 'status = "completed"',
                }),
            ]);

            state.stats.totalCampaigns = campaigns.length;
            state.stats.activeCampaigns = activeCampaigns.totalItems;
            state.stats.completedCampaigns = completedCampaigns.totalItems;

            // Cargar estadísticas de mensajes
            const [allMessages, pendingMsg, sentMsg, deliveredMsg, failedMsg] = await Promise.all([
                pb.collection("campaign_messages").getList(1, 1),
                pb.collection("campaign_messages").getList(1, 1, { filter: 'status = "pending"' }),
                pb.collection("campaign_messages").getList(1, 1, { filter: 'status = "sent"' }),
                pb.collection("campaign_messages").getList(1, 1, { filter: 'status = "delivered"' }),
                pb.collection("campaign_messages").getList(1, 1, { filter: 'status = "failed"' }),
            ]);

            state.stats.totalMessages = allMessages.totalItems;
            state.stats.pendingMessages = pendingMsg.totalItems;
            state.stats.sentMessages = sentMsg.totalItems;
            state.stats.deliveredMessages = deliveredMsg.totalItems;
            state.stats.failedMessages = failedMsg.totalItems;

            // Calcular tasas
            if (state.stats.totalMessages > 0) {
                state.deliveryRate = ((state.stats.deliveredMessages / state.stats.totalMessages) * 100).toFixed(1);
                state.successRate = (((state.stats.sentMessages + state.stats.deliveredMessages) / state.stats.totalMessages) * 100).toFixed(1);
            }

            // Cargar estadísticas de contactos
            const [allContacts, activeContacts] = await Promise.all([
                pb.collection("contacts").getList(1, 1),
                pb.collection("contacts").getList(1, 1, { filter: 'show = true' }),
            ]);

            state.stats.totalContacts = allContacts.totalItems;
            state.stats.activeContacts = activeContacts.totalItems;

            // Cargar estadísticas de URLs
            const [allUrls, activeUrls] = await Promise.all([
                pb.collection("urls").getFullList(),
                pb.collection("urls").getList(1, 50, {
                    filter: 'active = true',
                    sort: '-clicks',
                }),
            ]);

            state.stats.totalUrls = allUrls.length;
            state.stats.activeUrls = activeUrls.totalItems;
            state.stats.totalClicks = allUrls.reduce((sum, url) => sum + (url.clicks || 0), 0);
            state.stats.uniqueClicks = allUrls.reduce((sum, url) => sum + (url.unique_clicks || 0), 0);

            if (state.stats.totalUrls > 0) {
                state.clickRate = ((state.stats.uniqueClicks / state.stats.totalUrls) * 100).toFixed(1);
            }

            // Top 5 URLs más clickeadas
            state.topUrls = activeUrls.items.slice(0, 5);

            // Últimas 5 campañas
            const recentCampaigns = await pb.collection("campaigns_config").getList(1, 5, {
                sort: "-created",
            });
            state.recentCampaigns = recentCampaigns.items;

            // Actividad reciente (últimos mensajes enviados/entregados)
            const recentMessages = await pb.collection("campaign_messages").getList(1, 5, {
                filter: 'status != "pending"',
                sort: "-updated",
                expand: "contact,campaign_config",
            });

            state.recentActivity = recentMessages.items.map(msg => ({
                id: msg.id,
                contact: msg.expand?.contact?.name || "Desconocido",
                campaign: msg.expand?.campaign_config?.name || "Sin nombre",
                status: msg.status,
                timestamp: msg.updated,
            }));

        } catch (error) {
            console.error("Error loading dashboard:", error);
        } finally {
            state.loading = false;
        }
    }

    function getStatusBadge(status) {
        const badges = {
            draft: "badge-info",
            sending: "badge-warning",
            paused: "badge-warning",
            completed: "badge-success",
            failed: "badge-error",
        };
        return badges[status] || "badge-ghost";
    }

    function getStatusIcon(status) {
        const icons = {
            pending: "mdi:clock-outline",
            sent: "mdi:send",
            delivered: "mdi:check-circle",
            failed: "mdi:alert-circle",
        };
        return icons[status] || "mdi:help-circle";
    }

    onMount(() => {
        loadDashboardData();
    });
</script>
<svelte:head><title>Dashboard - {SettingsPage.header.title}</title></svelte:head>

<div class="space-y-6">
    <!-- Header -->
    <div class="flex justify-between items-center">
        <div>
            <h1 class="text-3xl font-bold">Dashboard</h1>
            <p class="text-base-content/70 mt-1">
                Bienvenido a tu panel de control de campañas SMS
            </p>
        </div>
        <button class="btn btn-primary btn-sm" onclick={loadDashboardData}>
            <Icon name="mdi:refresh" width="20" height="20" />
            Actualizar
        </button>
    </div>

    {#if state.loading}
        <div class="flex justify-center items-center min-h-[400px]">
            <span class="loading loading-spinner loading-lg"></span>
        </div>
    {:else}
        <!-- Stats principales -->
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <!-- Total Campañas -->
            <div class="stat bg-base-100 shadow rounded-lg">
                <div class="stat-figure text-primary">
                    <Icon name="mdi:bullhorn" width="32" height="32" />
                </div>
                <div class="stat-title">Total Campañas</div>
                <div class="stat-value text-primary">{state.stats.totalCampaigns}</div>
                <div class="stat-desc">
                    {state.stats.activeCampaigns} activas • {state.stats.completedCampaigns} completadas
                </div>
            </div>

            <!-- Mensajes -->
            <div class="stat bg-base-100 shadow rounded-lg">
                <div class="stat-figure text-secondary">
                    <Icon name="mdi:message-text" width="32" height="32" />
                </div>
                <div class="stat-title">Total Mensajes</div>
                <div class="stat-value text-secondary">{state.stats.totalMessages}</div>
                <div class="stat-desc">
                    {state.stats.deliveredMessages} entregados • {state.deliveryRate}% tasa
                </div>
            </div>

            <!-- Contactos -->
            <div class="stat bg-base-100 shadow rounded-lg">
                <div class="stat-figure text-accent">
                    <Icon name="mdi:account-group" width="32" height="32" />
                </div>
                <div class="stat-title">Contactos</div>
                <div class="stat-value text-accent">{state.stats.activeContacts}</div>
                <div class="stat-desc">
                    de {state.stats.totalContacts} totales
                </div>
            </div>

            <!-- URLs y Clicks -->
            <div class="stat bg-base-100 shadow rounded-lg">
                <div class="stat-figure text-info">
                    <Icon name="mdi:link-variant" width="32" height="32" />
                </div>
                <div class="stat-title">URLs Tracking</div>
                <div class="stat-value text-info">{state.stats.totalClicks}</div>
                <div class="stat-desc">
                    {state.stats.uniqueClicks} únicos • {state.clickRate}% CTR
                </div>
            </div>
        </div>

        <!-- Progreso de mensajes -->
        <div class="card bg-base-100 shadow-xl">
            <div class="card-body">
                <h2 class="card-title">Estado de Mensajes</h2>
                
                <div class="grid grid-cols-2 md:grid-cols-5 gap-4 mb-4">
                    <div class="text-center">
                        <div class="text-2xl font-bold text-neutral">{messageStats.pending}</div>
                        <div class="text-sm text-base-content/70">Pendientes</div>
                    </div>
                    <div class="text-center">
                        <div class="text-2xl font-bold text-info">{messageStats.sent}</div>
                        <div class="text-sm text-base-content/70">Enviados</div>
                    </div>
                    <div class="text-center">
                        <div class="text-2xl font-bold text-success">{messageStats.delivered}</div>
                        <div class="text-sm text-base-content/70">Entregados</div>
                    </div>
                    <div class="text-center">
                        <div class="text-2xl font-bold text-error">{messageStats.failed}</div>
                        <div class="text-sm text-base-content/70">Fallidos</div>
                    </div>
                    <div class="text-center">
                        <div class="text-2xl font-bold">{messageStats.total}</div>
                        <div class="text-sm text-base-content/70">Total</div>
                    </div>
                </div>

                <progress 
                    class="progress progress-success w-full h-4" 
                    value={progressPercentage} 
                    max="100"
                ></progress>
                <div class="text-sm text-center mt-2">
                    {progressPercentage}% procesado • {state.successRate}% tasa de éxito
                </div>
            </div>
        </div>

        <!-- Dos columnas: Campañas recientes y Top URLs -->
        <div class="grid lg:grid-cols-2 gap-6">
            <!-- Campañas recientes -->
            <div class="card bg-base-100 shadow-xl">
                <div class="card-body">
                    <div class="flex justify-between items-center">
                        <h2 class="card-title">Campañas Recientes</h2>
                        <a href="#/campaigns" class="btn btn-ghost btn-sm">
                            Ver todas
                            <Icon name="mdi:arrow-right" width="16" height="16" />
                        </a>
                    </div>

                    {#if state.recentCampaigns.length > 0}
                        <div class="space-y-3 mt-2">
                            {#each state.recentCampaigns as campaign}
                                <a href="#/campaigns/send/{campaign.id}" class="block hover:bg-base-200 p-3 rounded-lg transition">
                                    <div class="flex justify-between items-start">
                                        <div class="flex-1">
                                            <div class="font-semibold">{campaign.name}</div>
                                            <div class="text-sm text-base-content/70 mt-1">
                                                {campaign.total_contacts} contactos • {dayjs(campaign.created).fromNow()}
                                            </div>
                                        </div>
                                        <span class="badge {getStatusBadge(campaign.status)} badge-sm">
                                            {campaign.status}
                                        </span>
                                    </div>
                                </a>
                            {/each}
                        </div>
                    {:else}
                        <div class="text-center py-8 text-base-content/50">
                            <Icon name="mdi:inbox" width="48" height="48" class="mx-auto mb-2" />
                            <p>No hay campañas aún</p>
                        </div>
                    {/if}
                </div>
            </div>

            <!-- Top URLs -->
            <div class="card bg-base-100 shadow-xl">
                <div class="card-body">
                    <h2 class="card-title">URLs Más Clickeadas</h2>

                    {#if state.topUrls.length > 0}
                        <div class="space-y-3 mt-2">
                            {#each state.topUrls as url}
                                <div class="flex items-center gap-3 p-3 bg-base-200 rounded-lg">
                                    <div class="flex-1 min-w-0">
                                        <div class="font-semibold truncate" title={url.title}>
                                            {url.title || "Sin título"}
                                        </div>
                                        <div class="text-sm text-base-content/70 truncate" title={url.original_url}>
                                            {url.code}
                                        </div>
                                    </div>
                                    <div class="text-right">
                                        <div class="text-xl font-bold text-primary">
                                            {url.clicks || 0}
                                        </div>
                                        <div class="text-xs text-base-content/70">
                                            {url.unique_clicks || 0} únicos
                                        </div>
                                    </div>
                                </div>
                            {/each}
                        </div>
                    {:else}
                        <div class="text-center py-8 text-base-content/50">
                            <Icon name="mdi:link-off" width="48" height="48" class="mx-auto mb-2" />
                            <p>No hay URLs con tracking aún</p>
                        </div>
                    {/if}
                </div>
            </div>
        </div>

        <!-- Actividad reciente -->
        <div class="card bg-base-100 shadow-xl">
            <div class="card-body">
                <h2 class="card-title">Actividad Reciente</h2>

                {#if state.recentActivity.length > 0}
                    <div class="overflow-x-auto">
                        <table class="table table-sm">
                            <thead>
                                <tr>
                                    <th>Contacto</th>
                                    <th>Campaña</th>
                                    <th>Estado</th>
                                    <th>Tiempo</th>
                                </tr>
                            </thead>
                            <tbody>
                                {#each state.recentActivity as activity}
                                    <tr>
                                        <td>{activity.contact}</td>
                                        <td>{activity.campaign}</td>
                                        <td>
                                            <div class="flex items-center gap-2">
                                                <Icon name={getStatusIcon(activity.status)} width="16" height="16" />
                                                <span class="badge badge-sm {getStatusBadge(activity.status)}">
                                                    {activity.status}
                                                </span>
                                            </div>
                                        </td>
                                        <td>{dayjs(activity.timestamp).fromNow()}</td>
                                    </tr>
                                {/each}
                            </tbody>
                        </table>
                    </div>
                {:else}
                    <div class="text-center py-8 text-base-content/50">
                        <Icon name="mdi:history" width="48" height="48" class="mx-auto mb-2" />
                        <p>No hay actividad reciente</p>
                    </div>
                {/if}
            </div>
        </div>

        <!-- Acciones rápidas -->
        <div class="grid md:grid-cols-3 gap-4">
            <a href="#/campaigns/new" class="btn btn-lg btn-primary">
                <Icon name="mdi:plus" width="24" height="24" />
                Nueva Campaña
            </a>
            <a href="#/contacts" class="btn btn-lg btn-secondary">
                <Icon name="mdi:account-multiple" width="24" height="24" />
                Gestionar Contactos
            </a>
            <a href="#/campaigns" class="btn btn-lg btn-accent">
                <Icon name="mdi:bullhorn" width="24" height="24" />
                Ver Campañas
            </a>
        </div>
    {/if}
</div>
