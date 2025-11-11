<script>
    // @ts-nocheck
    import { pb } from "$lib/pocketbase.js";
    import { toast } from "svelte-sonner";
    import Icon from "$lib/components/ui/Icon.svelte";
    import dayjs from "dayjs";
    import { onMount } from "svelte";
    import { router, meta } from "tinro";
    
    const props = meta();
    const campaignId = props.params.id;

    const state = $state({
        loading: true,
        campaign: null,
        aggregated: null,
        messages: [],
        metrics: null,
        expandedContacts: new Set(),
        searchTerm: "",
        timeFilter: "all",
        selectedMetric: "clicks",
    });

    // Función helper para limitar valores de 0-100
    function clampProgress(value) {
        const num = parseFloat(value) || 0;
        return Math.min(Math.max(num, 0), 100);
    }

    // Métricas calculadas avanzadas
    const advancedMetrics = $derived.by(() => {
        if (!state.aggregated) return null;

        const agg = state.aggregated;
        const totalMessages = agg.totalMessages || 1;
        const totalClicks = agg.totalClicks || 0;
        const uniqueClicks = agg.uniqueClicks || 0;

        return {
            clickThroughRate: parseFloat(agg.clickThroughRate) || 0,
            uniqueClickRate: parseFloat(agg.uniqueClickRate) || 0,
            avgClicksPerMessage: parseFloat(agg.avgClicksPerMessage) || 0,
            repeatClickRatio: parseFloat(agg.repeatClickRatio) || 0,
            engagementScore: parseFloat(agg.engagementScore) || 0,
            topDevice: agg.topDevice || "N/A",
            topBrowser: agg.topBrowser || "N/A",
            peakHour: agg.peakHour || "00",
            topDay: agg.topDay || "N/A",
            topCountry: agg.topCountry || "N/A",
        };
    });

    // Top contactos con filtros
    const topContacts = $derived.by(() => {
        if (!state.messages) return [];
        
        let filtered = state.messages.filter((m) => m.tracking && m.tracking.clicks > 0);
        
        if (state.searchTerm) {
            const search = state.searchTerm.toLowerCase();
            filtered = filtered.filter(m => 
                m.contact?.name?.toLowerCase().includes(search) ||
                m.contact?.phone?.includes(search)
            );
        }
        
        return filtered
            .sort((a, b) => {
                if (state.selectedMetric === "clicks") {
                    return (b.tracking?.clicks || 0) - (a.tracking?.clicks || 0);
                } else if (state.selectedMetric === "unique") {
                    return (b.tracking?.unique_clicks || 0) - (a.tracking?.unique_clicks || 0);
                } else {
                    const engA = a.tracking?.clicks > 0 ? (a.tracking.unique_clicks / a.tracking.clicks) : 0;
                    const engB = b.tracking?.clicks > 0 ? (b.tracking.unique_clicks / b.tracking.clicks) : 0;
                    return engB - engA;
                }
            })
            .slice(0, 20);
    });

    // Datos preparados para gráficos
    const chartData = $derived.by(() => {
        if (!state.aggregated) return null;

        const agg = state.aggregated;

        return {
            dates: Object.keys(agg.clicksByDate || {}).sort(),
            dateValues: Object.keys(agg.clicksByDate || {})
                .sort()
                .map(date => agg.clicksByDate[date]),
            
            devices: Object.entries(agg.devices || {})
                .sort((a, b) => b[1] - a[1])
                .map(([device]) => device),
            deviceValues: Object.entries(agg.devices || {})
                .sort((a, b) => b[1] - a[1])
                .map(([, count]) => count),
            
            browsers: Object.entries(agg.browsers || {})
                .sort((a, b) => b[1] - a[1])
                .slice(0, 5)
                .map(([browser]) => browser),
            browserValues: Object.entries(agg.browsers || {})
                .sort((a, b) => b[1] - a[1])
                .slice(0, 5)
                .map(([, count]) => count),
            
            hours: Object.keys(agg.clicksByHour || {}).sort(),
            hourValues: Object.keys(agg.clicksByHour || {})
                .sort()
                .map(hour => agg.clicksByHour[hour]),
        };
    });

    // Calcular distribución de engagement
    const engagementDistribution = $derived.by(() => {
        if (!state.aggregated?.engagementDistribution) {
            return { low: 0, medium: 0, high: 0, none: 0 };
        }
        return state.aggregated.engagementDistribution;
    });

    async function loadAnalytics() {
        state.loading = true;
        try {
            const response = await fetch(
                `${pb.baseUrl}/api/campaigns/${campaignId}/analytics`,
                {
                    headers: {
                        Authorization: `Bearer ${pb.authStore.token}`,
                    },
                }
            );

            if (!response.ok) {
                throw new Error("Error al cargar analytics");
            }

            const result = await response.json();
            state.campaign = result.campaign;
            state.aggregated = result.aggregated;
            state.messages = result.messages;
            state.metrics = result.metrics;
            
            toast.success("Analytics cargadas correctamente");
        } catch (error) {
            console.error("Error:", error);
            toast.error("Error al cargar datos: " + error.message);
        } finally {
            state.loading = false;
        }
    }

    function toggleExpand(messageId) {
        if (state.expandedContacts.has(messageId)) {
            state.expandedContacts.delete(messageId);
        } else {
            state.expandedContacts.add(messageId);
        }
        state.expandedContacts = state.expandedContacts;
    }

    function getDeviceIcon(device) {
        const icons = {
            mobile: "mdi:cellphone",
            desktop: "mdi:monitor",
            tablet: "mdi:tablet",
            bot: "mdi:robot",
            unknown: "mdi:help-circle",
        };
        return icons[device] || icons["unknown"];
    }

    function getPercentage(value, total) {
        if (!total || total === 0) return 0;
        return ((value / total) * 100).toFixed(1);
    }

    function copyToClipboard(text) {
        navigator.clipboard.writeText(text);
        toast.success("Copiado al portapapeles");
    }

    function exportCSV() {
        const csv = [
            ["Nombre", "Teléfono", "Clicks", "Clicks Únicos", "Engagement", "Último Click"].join(","),
            ...topContacts.map(c => [
                c.contact?.name || "",
                c.contact?.phone || "",
                c.tracking?.clicks || 0,
                c.tracking?.unique_clicks || 0,
                ((c.tracking?.unique_clicks / c.tracking?.clicks) * 100).toFixed(1) + "%",
                c.tracking?.last_click_at || ""
            ].join(","))
        ].join("\n");
        
        const blob = new Blob([csv], { type: "text/csv" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `campaign-${campaignId}-analytics.csv`;
        a.click();
        toast.success("CSV exportado");
    }

    onMount(() => {
        loadAnalytics();
    });
</script>

<div class="space-y-6 p-6 max-w-[1600px] mx-auto">
    <!-- Header con acciones -->
    <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
            <div class="flex items-center gap-3">
                <h1 class="text-4xl font-bold">📊 Analytics de Campaña</h1>
                {#if state.campaign}
                    <span class="badge badge-lg badge-{state.campaign.status === 'completed' ? 'success' : 'warning'}">
                        {state.campaign.status}
                    </span>
                {/if}
            </div>
            <p class="text-base-content/70 mt-2">
                {state.campaign?.name || "Cargando..."}
            </p>
        </div>
        <div class="flex gap-2">
            <button class="btn btn-outline btn-sm gap-2" onclick={exportCSV}>
                <Icon name="mdi:download" width="18" height="18" />
                Exportar CSV
            </button>
            <button class="btn btn-outline btn-sm gap-2" onclick={loadAnalytics}>
                <Icon name="mdi:refresh" width="18" height="18" />
                Actualizar
            </button>
            <a href="#/campaigns" class="btn btn-ghost btn-sm gap-2">
                <Icon name="mdi:arrow-left" width="18" height="18" />
                Volver
            </a>
        </div>
    </div>

    {#if state.loading}
        <div class="text-center p-12">
            <span class="loading loading-spinner loading-lg"></span>
            <p class="mt-4 text-base-content/70">Cargando analytics...</p>
        </div>
    {:else if state.campaign && state.aggregated}
        
        <!-- KPIs Principales Mejorados -->
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div class="stat bg-gradient-to-br from-primary/10 to-primary/5 shadow rounded-lg border border-primary/20">
                <div class="stat-figure text-primary">
                    <Icon name="fa6-solid:comment-sms" width="32" height="32" />
                </div>
                <div class="stat-title">Mensajes Enviados</div>
                <div class="stat-value text-primary text-3xl">
                    {state.aggregated.totalMessages}
                </div>
                <div class="stat-desc">Total de contactos alcanzados</div>
            </div>

            <div class="stat bg-gradient-to-br from-secondary/10 to-secondary/5 shadow rounded-lg border border-secondary/20">
                <div class="stat-figure text-secondary">
                    <Icon name="mdi:cursor-default-click" width="32" height="32" />
                </div>
                <div class="stat-title">Total Clicks</div>
                <div class="stat-value text-secondary text-3xl">
                    {state.aggregated.totalClicks}
                </div>
                <div class="stat-desc">
                    CTR: {advancedMetrics?.clickThroughRate.toFixed(1)}%
                </div>
            </div>

            <div class="stat bg-gradient-to-br from-accent/10 to-accent/5 shadow rounded-lg border border-accent/20">
                <div class="stat-figure text-accent">
                    <Icon name="mdi:account-multiple" width="32" height="32" />
                </div>
                <div class="stat-title">Visitantes Únicos</div>
                <div class="stat-value text-accent text-3xl">
                    {state.aggregated.uniqueClicks}
                </div>
                <div class="stat-desc">
                    {advancedMetrics?.uniqueClickRate.toFixed(1)}% de conversión
                </div>
            </div>

            <div class="stat bg-gradient-to-br from-success/10 to-success/5 shadow rounded-lg border border-success/20">
                <div class="stat-figure text-success">
                    <Icon name="mdi:chart-line" width="32" height="32" />
                </div>
                <div class="stat-title">Engagement Score</div>
                <div class="stat-value text-success text-3xl">
                    {advancedMetrics?.engagementScore.toFixed(1)}
                </div>
                <div class="stat-desc">
                    {state.aggregated.engagementRate} total
                </div>
            </div>
        </div>

        <!-- Métricas Secundarias con Radial Progress -->
        <div class="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
            <!-- CTR -->
            <div class="card bg-base-100 shadow-lg">
                <div class="card-body items-center text-center p-4">
                    <div 
                        class="radial-progress text-primary" 
                        style="--value:{clampProgress(advancedMetrics?.clickThroughRate)}; --size:5rem; --thickness: 4px"
                        role="progressbar"
                    >
                        {advancedMetrics?.clickThroughRate.toFixed(1)}%
                    </div>
                    <p class="text-xs font-semibold mt-2">Click Rate</p>
                </div>
            </div>

            <!-- Unique Rate -->
            <div class="card bg-base-100 shadow-lg">
                <div class="card-body items-center text-center p-4">
                    <div 
                        class="radial-progress text-secondary" 
                        style="--value:{clampProgress(advancedMetrics?.uniqueClickRate)}; --size:5rem; --thickness: 4px"
                        role="progressbar"
                    >
                        {advancedMetrics?.uniqueClickRate.toFixed(1)}%
                    </div>
                    <p class="text-xs font-semibold mt-2">Unique Rate</p>
                </div>
            </div>

            <!-- Repeat Clicks -->
            <div class="card bg-base-100 shadow-lg">
                <div class="card-body items-center text-center p-4">
                    <div 
                        class="radial-progress text-accent" 
                        style="--value:{clampProgress(advancedMetrics?.repeatClickRatio)}; --size:5rem; --thickness: 4px"
                        role="progressbar"
                    >
                        {advancedMetrics?.repeatClickRatio.toFixed(1)}%
                    </div>
                    <p class="text-xs font-semibold mt-2">Repeat Ratio</p>
                </div>
            </div>

            <!-- Avg Clicks -->
            <div class="card bg-base-100 shadow-lg">
                <div class="card-body items-center text-center p-4">
                    <div class="text-4xl font-bold text-info">
                        {advancedMetrics?.avgClicksPerMessage.toFixed(2)}
                    </div>
                    <p class="text-xs font-semibold mt-2">Avg Clicks/Msg</p>
                </div>
            </div>

            <!-- Top Device -->
            <div class="card bg-base-100 shadow-lg">
                <div class="card-body items-center text-center p-4">
                    <Icon name={getDeviceIcon(advancedMetrics?.topDevice)} width="40" height="40" class="text-warning" />
                    <p class="text-xs font-semibold mt-2 capitalize">{advancedMetrics?.topDevice}</p>
                </div>
            </div>

            <!-- Peak Hour -->
            <div class="card bg-base-100 shadow-lg">
                <div class="card-body items-center text-center p-4">
                    <div class="text-3xl font-bold text-error">
                        {advancedMetrics?.peakHour}:00
                    </div>
                    <p class="text-xs font-semibold mt-2">Hora Pico</p>
                </div>
            </div>
        </div>

        <!-- Información de la Campaña -->
        <div class="card bg-base-100 shadow-xl">
            <div class="card-body">
                <h2 class="card-title text-2xl">📋 Detalles de Campaña</h2>
                <div class="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 mt-4">
                    <div>
                        <p class="text-sm text-base-content/70">Estado</p>
                        <p class="font-bold capitalize">{state.campaign.status}</p>
                    </div>
                    <div>
                        <p class="text-sm text-base-content/70">Total Contactos</p>
                        <p class="font-bold">{state.campaign.total_contacts}</p>
                    </div>
                    <div>
                        <p class="text-sm text-base-content/70">Tracking</p>
                        <p class="font-bold">{state.campaign.tracking ? "✅ Activo" : "❌ Inactivo"}</p>
                    </div>
                    <div>
                        <p class="text-sm text-base-content/70">Creada</p>
                        <p class="font-bold text-sm">
                            {dayjs(state.campaign.created).format("DD/MM/YY HH:mm")}
                        </p>
                    </div>
                    <div>
                        <p class="text-sm text-base-content/70">Browser Top</p>
                        <p class="font-bold text-sm">{advancedMetrics?.topBrowser}</p>
                    </div>
                    <div>
                        <p class="text-sm text-base-content/70">Día Top</p>
                        <p class="font-bold text-sm">{dayjs(advancedMetrics?.topDay).format("DD/MM")}</p>
                    </div>
                </div>
                <div class="mt-4">
                    <p class="text-sm text-base-content/70 mb-2">Mensaje Original</p>
                    <div class="bg-base-200 p-4 rounded-lg text-sm font-mono">
                        {state.campaign.message.replace("<ORIGINAL_URL>", state.campaign.original_url)}
                    </div>
                </div>
            </div>
        </div>

        <!-- Distribución de Engagement -->
        <div class="card bg-base-100 shadow-xl">
            <div class="card-body">
                <h2 class="card-title text-2xl">🎯 Distribución de Engagement</h2>
                <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
                    <div class="stat bg-error/10 rounded-lg">
                        <div class="stat-title">Sin Clicks</div>
                        <div class="stat-value text-error">{engagementDistribution.none}</div>
                        <div class="stat-desc">
                            {getPercentage(engagementDistribution.none, state.aggregated.totalMessages)}%
                        </div>
                    </div>
                    <div class="stat bg-warning/10 rounded-lg">
                        <div class="stat-title">Engagement Bajo</div>
                        <div class="stat-value text-warning">{engagementDistribution.low}</div>
                        <div class="stat-desc">
                            {getPercentage(engagementDistribution.low, state.aggregated.totalMessages)}%
                        </div>
                    </div>
                    <div class="stat bg-info/10 rounded-lg">
                        <div class="stat-title">Engagement Medio</div>
                        <div class="stat-value text-info">{engagementDistribution.medium}</div>
                        <div class="stat-desc">
                            {getPercentage(engagementDistribution.medium, state.aggregated.totalMessages)}%
                        </div>
                    </div>
                    <div class="stat bg-success/10 rounded-lg">
                        <div class="stat-title">Engagement Alto</div>
                        <div class="stat-value text-success">{engagementDistribution.high}</div>
                        <div class="stat-desc">
                            {getPercentage(engagementDistribution.high, state.aggregated.totalMessages)}%
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <!-- Gráficos Mejorados -->
        <div class="grid lg:grid-cols-2 gap-6">
            <!-- Clicks por fecha -->
            <div class="card bg-base-100 shadow-xl">
                <div class="card-body">
                    <h3 class="card-title text-xl">📈 Timeline de Clicks</h3>
                    {#if chartData?.dates && chartData.dates.length > 0}
                        <div class="space-y-2 max-h-96 overflow-y-auto">
                            {#each chartData.dates as date, i}
                                {@const maxValue = Math.max(...(chartData?.dateValues || [1]))}
                                {@const value = chartData.dateValues[i]}
                                <div class="flex items-center gap-3">
                                    <span class="text-xs font-mono w-20 shrink-0">
                                        {dayjs(date).format("DD MMM")}
                                    </span>
                                    <progress 
                                        class="progress progress-primary flex-1" 
                                        value={value} 
                                        max={maxValue}
                                    ></progress>
                                    <span class="font-bold text-sm w-12 text-right shrink-0">{value}</span>
                                </div>
                            {/each}
                        </div>
                    {:else}
                        <div class="text-center py-8 text-base-content/70">
                            <Icon name="mdi:chart-line-variant" width="48" height="48" class="mx-auto mb-2 opacity-50" />
                            <p>No hay datos de clicks por fecha</p>
                        </div>
                    {/if}
                </div>
            </div>

            <!-- Clicks por hora del día -->
            <div class="card bg-base-100 shadow-xl">
                <div class="card-body">
                    <h3 class="card-title text-xl">🕐 Actividad por Hora</h3>
                    <div class="grid grid-cols-6 gap-2 mt-4">
                        {#each Array(24) as _, hour}
                            {@const hourStr = hour.toString().padStart(2, "0")}
                            {@const clicks = state.aggregated?.clicksByHour?.[hourStr] || 0}
                            {@const allHourValues = Object.values(state.aggregated?.clicksByHour || {0:1})}
                            {@const maxClicks = allHourValues.length > 0 ? Math.max(...allHourValues) : 1}
                            {@const intensity = clicks > 0 ? Math.ceil((clicks / maxClicks) * 4) : 0}
                            <div 
                                class="tooltip" 
                                data-tip="{hourStr}:00 - {clicks} clicks"
                            >
                                <div 
                                    class="aspect-square rounded-lg border-2 border-base-300 flex items-center justify-center text-xs font-bold cursor-pointer transition-all hover:scale-110
                                    {intensity === 0 ? 'bg-base-200 text-base-content/50' : ''}
                                    {intensity === 1 ? 'bg-success/20 text-success' : ''}
                                    {intensity === 2 ? 'bg-success/40 text-success' : ''}
                                    {intensity === 3 ? 'bg-success/60 text-success' : ''}
                                    {intensity === 4 ? 'bg-success text-success-content' : ''}"
                                >
                                    {hourStr}
                                </div>
                            </div>
                        {/each}
                    </div>
                    <div class="flex items-center justify-between text-xs text-base-content/70 mt-4">
                        <div class="flex items-center gap-2">
                            <div class="w-4 h-4 bg-base-200 rounded"></div>
                            <span>Sin actividad</span>
                        </div>
                        <div class="flex items-center gap-2">
                            <div class="w-4 h-4 bg-success rounded"></div>
                            <span>Alta actividad</span>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Dispositivos Mejorado -->
            <div class="card bg-base-100 shadow-xl">
                <div class="card-body">
                    <h3 class="card-title text-xl">📱 Distribución por Dispositivo</h3>
                    {#if chartData?.devices && chartData.devices.length > 0}
                        <div class="space-y-4 mt-4">
                            {#each chartData.devices as device, i}
                                {@const count = chartData.deviceValues[i]}
                                {@const percentage = parseFloat(getPercentage(count, state.aggregated.totalClicks))}
                                <div>
                                    <div class="flex justify-between items-center mb-2">
                                        <div class="flex items-center gap-2">
                                            <Icon name={getDeviceIcon(device)} width="24" height="24" />
                                            <span class="font-semibold capitalize">{device}</span>
                                        </div>
                                        <div class="text-right">
                                            <span class="font-bold text-lg">{count}</span>
                                            <span class="text-sm text-base-content/70 ml-2">({percentage.toFixed(1)}%)</span>
                                        </div>
                                    </div>
                                    <progress 
                                        class="progress progress-secondary w-full" 
                                        value={percentage} 
                                        max="100"
                                    ></progress>
                                </div>
                            {/each}
                        </div>
                    {:else}
                        <div class="text-center py-8 text-base-content/70">
                            <Icon name="mdi:devices" width="48" height="48" class="mx-auto mb-2 opacity-50" />
                            <p>No hay datos de dispositivos</p>
                        </div>
                    {/if}
                </div>
            </div>

            <!-- Browsers Mejorado -->
            <div class="card bg-base-100 shadow-xl">
                <div class="card-body">
                    <h3 class="card-title text-xl">🌐 Top Navegadores</h3>
                    {#if chartData?.browsers && chartData.browsers.length > 0}
                        <div class="space-y-4 mt-4">
                            {#each chartData.browsers as browser, i}
                                {@const count = chartData.browserValues[i]}
                                {@const percentage = parseFloat(getPercentage(count, state.aggregated.totalClicks))}
                                <div>
                                    <div class="flex justify-between items-center mb-2">
                                        <span class="font-semibold">{browser}</span>
                                        <div class="text-right">
                                            <span class="font-bold text-lg">{count}</span>
                                            <span class="text-sm text-base-content/70 ml-2">({percentage.toFixed(1)}%)</span>
                                        </div>
                                    </div>
                                    <progress 
                                        class="progress progress-accent w-full" 
                                        value={percentage} 
                                        max="100"
                                    ></progress>
                                </div>
                            {/each}
                        </div>
                    {:else}
                        <div class="text-center py-8 text-base-content/70">
                            <Icon name="mdi:web" width="48" height="48" class="mx-auto mb-2 opacity-50" />
                            <p>No hay datos de navegadores</p>
                        </div>
                    {/if}
                </div>
            </div>
        </div>

        <!-- Top Contactos Mejorado -->
        <div class="card bg-base-100 shadow-xl">
            <div class="card-body">
                <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
                    <h2 class="card-title text-2xl">🏆 Ranking de Contactos</h2>
                    <div class="flex gap-2 flex-wrap">
                        <input 
                            type="text" 
                            placeholder="Buscar por nombre o teléfono..." 
                            class="input input-bordered input-sm w-64"
                            bind:value={state.searchTerm}
                        />
                        <select class="select select-bordered select-sm" bind:value={state.selectedMetric}>
                            <option value="clicks">Por Clicks</option>
                            <option value="unique">Por Únicos</option>
                            <option value="engagement">Por Engagement</option>
                        </select>
                    </div>
                </div>
                
                <div class="overflow-x-auto">
                    <table class="table table-zebra table-compact w-full">
                        <thead>
                            <tr>
                                <th class="bg-base-200">#</th>
                                <th class="bg-base-200">Contacto</th>
                                <th class="bg-base-200">Teléfono</th>
                                <th class="bg-base-200">Total Clicks</th>
                                <th class="bg-base-200">Clicks Únicos</th>
                                <th class="bg-base-200">Engagement</th>
                                <th class="bg-base-200">Score</th>
                                <th class="bg-base-200">Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            {#each topContacts as contact, i}
                                {@const engRate = contact.tracking && contact.tracking.clicks > 0 ? (contact.tracking.unique_clicks / contact.tracking.clicks * 100) : 0}
                                {@const score = contact.tracking ? (contact.tracking.unique_clicks * 2 + contact.tracking.clicks).toFixed(0) : 0}
                                <tr class="hover">
                                    <td>
                                        <div class="badge badge-lg {i < 3 ? 'badge-warning' : 'badge-ghost'}">
                                            {#if i === 0}🥇{:else if i === 1}🥈{:else if i === 2}🥉{:else}{i + 1}{/if}
                                        </div>
                                    </td>
                                    <td class="font-semibold">{contact.contact?.name || "Sin nombre"}</td>
                                    <td>
                                        <code class="bg-base-300 px-2 py-1 rounded text-xs">
                                            {contact.contact?.phone || "—"}
                                        </code>
                                    </td>
                                    <td>
                                        <span class="badge badge-secondary badge-lg">
                                            {contact.tracking?.clicks || 0}
                                        </span>
                                    </td>
                                    <td>
                                        <span class="badge badge-accent badge-lg">
                                            {contact.tracking?.unique_clicks || 0}
                                        </span>
                                    </td>
                                    <td>
                                        <div class="flex items-center gap-2">
                                            <progress 
                                                class="progress progress-success w-16" 
                                                value={clampProgress(engRate)} 
                                                max="100"
                                            ></progress>
                                            <span class="text-sm font-bold">{engRate.toFixed(1)}%</span>
                                        </div>
                                    </td>
                                    <td>
                                        <span class="badge badge-primary badge-lg">{score}</span>
                                    </td>
                                    <td>
                                        <div class="flex gap-1">
                                            <button
                                                class="btn btn-ghost btn-xs"
                                                onclick={() => toggleExpand(contact.id)}
                                            >
                                                <Icon name="mdi:eye" width="16" height="16" />
                                            </button>
                                            <button
                                                class="btn btn-ghost btn-xs"
                                                onclick={() => copyToClipboard(contact.tracking?.short_url || "")}
                                            >
                                                <Icon name="mdi:content-copy" width="16" height="16" />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                                {#if state.expandedContacts.has(contact.id)}
                                    <tr class="bg-base-200">
                                        <td colspan="8">
                                            <div class="p-6 space-y-4">
                                                <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                                                    <div>
                                                        <p class="text-sm text-base-content/70 mb-1">Código de URL</p>
                                                        <code class="bg-base-300 px-3 py-2 rounded block text-sm font-mono">
                                                            {contact.tracking?.code || "—"}
                                                        </code>
                                                    </div>
                                                    <div>
                                                        <p class="text-sm text-base-content/70 mb-1">URL Corta</p>
                                                        <div class="flex gap-2">
                                                            <input 
                                                                type="text" 
                                                                class="input input-sm input-bordered flex-1 font-mono text-xs" 
                                                                value={contact.tracking?.short_url || ""} 
                                                                readonly 
                                                            />
                                                            <button 
                                                                class="btn btn-sm btn-square"
                                                                onclick={() => copyToClipboard(contact.tracking?.short_url || "")}
                                                            >
                                                                <Icon name="mdi:content-copy" width="16" height="16" />
                                                            </button>
                                                        </div>
                                                    </div>
                                                    <div>
                                                        <p class="text-sm text-base-content/70 mb-1">Estado</p>
                                                        <span class="badge {contact.tracking?.active ? 'badge-success' : 'badge-error'} badge-lg">
                                                            {contact.tracking?.active ? "✅ Activo" : "❌ Inactivo"}
                                                        </span>
                                                    </div>
                                                </div>
                                                <div class="divider my-2"></div>
                                                <div class="flex gap-2">
                                                    <a 
                                                        href="#/analytics/{contact.tracking?.id}" 
                                                        class="btn btn-sm btn-primary gap-2"
                                                    >
                                                        <Icon name="mdi:chart-bar" width="16" height="16" />
                                                        Ver Analytics Detalladas
                                                    </a>
                                                    <button class="btn btn-sm btn-outline gap-2">
                                                        <Icon name="mdi:qrcode" width="16" height="16" />
                                                        Generar QR
                                                    </button>
                                                </div>
                                            </div>
                                        </td>
                                    </tr>
                                {/if}
                            {/each}
                        </tbody>
                    </table>
                </div>
                
                {#if topContacts.length === 0}
                    <div class="text-center py-8 text-base-content/70">
                        <Icon name="mdi:inbox" width="48" height="48" class="mx-auto mb-2 opacity-50" />
                        <p>No hay contactos con clicks aún</p>
                    </div>
                {/if}
            </div>
        </div>

    {:else}
        <div class="alert alert-error shadow-lg">
            <Icon name="mdi:alert-circle" width="24" height="24" />
            <div>
                <h3 class="font-bold">Error al cargar la campaña</h3>
                <div class="text-xs">No se pudieron obtener los datos de analytics</div>
            </div>
        </div>
    {/if}
</div>
