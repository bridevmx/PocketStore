<script>
  import { onMount } from 'svelte';
  import { meta } from 'tinro';
  import Icon from "$lib/components/ui/Icon.svelte";
  import { toast } from 'svelte-sonner';
  import {pb} from "$lib/pocketbase.js";

  // Estado reactivo
  const props = meta();
  const urlId = props.params.id;
  let urlRecord = $state(null);
  let metrics = $state([]);
  let loading = $state(true);
  let error = $state(null);

  // Calcular estadísticas agregadas
  const stats = $derived.by(() => {
    if (!metrics || metrics.length === 0) {
      return {
        totalClicks: 0,
        uniqueClicks: 0,
        browsers: {},
        devices: {},
        countries: {},
        topReferers: {},
        clicksByDate: {}
      };
    }

    const aggregated = {
      totalClicks: metrics.length,
      uniqueClicks: metrics.filter(m => m.is_unique).length,
      browsers: {},
      devices: {},
      countries: {},
      topReferers: {},
      clicksByDate: {}
    };

    metrics.forEach(metric => {
      // Browsers
      aggregated.browsers[metric.browser] = (aggregated.browsers[metric.browser] || 0) + 1;
      
      // Devices
      aggregated.devices[metric.device_type] = (aggregated.devices[metric.device_type] || 0) + 1;
      
      // Countries
      aggregated.countries[metric.country] = (aggregated.countries[metric.country] || 0) + 1;
      
      // Referers
      const referer = metric.referer || 'Direct';
      aggregated.topReferers[referer] = (aggregated.topReferers[referer] || 0) + 1;
      
      // Clicks por fecha
      const date = new Date(metric.clicked_at).toLocaleDateString();
      aggregated.clicksByDate[date] = (aggregated.clicksByDate[date] || 0) + 1;
    });

    return aggregated;
  });

  // Cargar datos
  async function loadAnalytics() {
    try {
      loading = true;
      error = null;

      const id = urlId;
      
      // Obtener el registro de URL
      urlRecord = await pb.collection('urls').getOne(id);
      
      // Obtener las métricas
      const metricsResult = await pb.collection('url_metrics').getFullList({
        filter: `url_id = "${id}"`,
        sort: '-clicked_at'
      });
      
      metrics = metricsResult;
      
      toast.success('Analíticas cargadas correctamente');
    } catch (err) {
      error = err.message;
      toast.error('Error al cargar las analíticas: ' + err.message);
      console.error(err);
    } finally {
      loading = false;
    }
  }

  // Formatear porcentajes
  function getPercentage(value, total) {
    if (total === 0) return '0.00';
    return ((value / total) * 100).toFixed(2);
  }

  // Convertir objeto a array ordenado
  function toSortedArray(obj, limit = 5) {
    return Object.entries(obj)
      .sort((a, b) => b[1] - a[1])
      .slice(0, limit);
  }

  onMount(() => {
    loadAnalytics();
  });
</script>

<div class="container mx-auto p-4 max-w-7xl">
  <!-- Header -->
  <div class="mb-8">
    <div class="items-center flex justify-between">
      <h1 class="text-3xl font-bold">Analíticas</h1>
      <a href="#/urls" class="btn btn-ghost btn-lg">
        <Icon name="mdi:arrow-left" width="20" height="20" />
        Volver
      </a>
    </div>

    {#if urlRecord}
      <div class="flex flex-col gap-2">
        <h2 class="text-xl text-gray-600">{urlRecord.title}</h2>
        <div class="flex gap-4 text-sm">
          <span class="badge badge-primary">{urlRecord.code}</span>
          <a href={urlRecord.short_url} target="_blank" class="link link-secondary">
            {urlRecord.short_url}
          </a>
        </div>
      </div>
    {/if}
  </div>

  {#if loading}
    <div class="flex justify-center items-center min-h-screen">
      <span class="loading loading-spinner loading-lg"></span>
    </div>
  {:else if error}
    <div class="alert alert-error">
      <svg xmlns="http://www.w3.org/2000/svg" class="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
      <span>Error: {error}</span>
    </div>
  {:else}
    <!-- Stats Overview -->
    <div class="stats stats-vertical lg:stats-horizontal shadow w-full mb-8">
      <div class="stat">
        <div class="stat-figure text-primary">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" class="inline-block w-8 h-8 stroke-current">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
          </svg>
        </div>
        <div class="stat-title">Total de Clicks</div>
        <div class="stat-value text-primary">{stats.totalClicks}</div>
        <div class="stat-desc">Desde {new Date(urlRecord.created).toLocaleDateString()}</div>
      </div>

      <div class="stat">
        <div class="stat-figure text-secondary">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" class="inline-block w-8 h-8 stroke-current">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4"></path>
          </svg>
        </div>
        <div class="stat-title">Clicks Únicos</div>
        <div class="stat-value text-secondary">{stats.uniqueClicks}</div>
        <div class="stat-desc">Visitantes únicos</div>
      </div>

      <div class="stat">
        <div class="stat-title">Estado</div>
        <div class="stat-value">{urlRecord.active ? 'Activo' : 'Inactivo'}</div>
        <div class="stat-desc">
          {#if urlRecord.last_click_at}
            Último click: {new Date(urlRecord.last_click_at).toLocaleString()}
          {:else}
            Sin clicks aún
          {/if}
        </div>
      </div>
    </div>

    <!-- Grid de analíticas -->
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <!-- Navegadores -->
      <div class="card bg-base-100 shadow-xl">
        <div class="card-body">
          <h2 class="card-title">Navegadores</h2>
          <div class="overflow-x-auto">
            <table class="table table-zebra">
              <thead>
                <tr>
                  <th>Navegador</th>
                  <th>Clicks</th>
                  <th>Porcentaje</th>
                </tr>
              </thead>
              <tbody>
                {#each toSortedArray(stats.browsers) as [browser, count]}
                  <tr>
                    <td class="font-semibold">{browser}</td>
                    <td>{count}</td>
                    <td>
                      <div class="flex items-center gap-2">
                        <progress class="progress progress-primary w-20" value={count} max={stats.totalClicks}></progress>
                        <span class="text-sm">{getPercentage(count, stats.totalClicks)}%</span>
                      </div>
                    </td>
                  </tr>
                {/each}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <!-- Dispositivos -->
      <div class="card bg-base-100 shadow-xl">
        <div class="card-body">
          <h2 class="card-title">Dispositivos</h2>
          <div class="overflow-x-auto">
            <table class="table table-zebra">
              <thead>
                <tr>
                  <th>Dispositivo</th>
                  <th>Clicks</th>
                  <th>Porcentaje</th>
                </tr>
              </thead>
              <tbody>
                {#each toSortedArray(stats.devices) as [device, count]}
                  <tr>
                    <td class="font-semibold capitalize">{device}</td>
                    <td>{count}</td>
                    <td>
                      <div class="flex items-center gap-2">
                        <progress class="progress progress-secondary w-20" value={count} max={stats.totalClicks}></progress>
                        <span class="text-sm">{getPercentage(count, stats.totalClicks)}%</span>
                      </div>
                    </td>
                  </tr>
                {/each}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <!-- Países -->
      <div class="card bg-base-100 shadow-xl">
        <div class="card-body">
          <h2 class="card-title">Ubicaciones</h2>
          <div class="overflow-x-auto">
            <table class="table table-zebra">
              <thead>
                <tr>
                  <th>País</th>
                  <th>Clicks</th>
                  <th>Porcentaje</th>
                </tr>
              </thead>
              <tbody>
                {#each toSortedArray(stats.countries, 10) as [country, count]}
                  <tr>
                    <td class="font-semibold">{country}</td>
                    <td>{count}</td>
                    <td>
                      <div class="flex items-center gap-2">
                        <progress class="progress progress-accent w-20" value={count} max={stats.totalClicks}></progress>
                        <span class="text-sm">{getPercentage(count, stats.totalClicks)}%</span>
                      </div>
                    </td>
                  </tr>
                {/each}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <!-- Referentes -->
      <div class="card bg-base-100 shadow-xl">
        <div class="card-body">
          <h2 class="card-title">Fuentes de Tráfico</h2>
          <div class="overflow-x-auto">
            <table class="table table-zebra">
              <thead>
                <tr>
                  <th>Referente</th>
                  <th>Clicks</th>
                  <th>Porcentaje</th>
                </tr>
              </thead>
              <tbody>
                {#each toSortedArray(stats.topReferers, 10) as [referer, count]}
                  <tr>
                    <td class="font-semibold truncate max-w-xs">{referer === 'Direct' ? 'Directo' : referer}</td>
                    <td>{count}</td>
                    <td>
                      <div class="flex items-center gap-2">
                        <progress class="progress progress-info w-20" value={count} max={stats.totalClicks}></progress>
                        <span class="text-sm">{getPercentage(count, stats.totalClicks)}%</span>
                      </div>
                    </td>
                  </tr>
                {/each}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <!-- Clicks por fecha -->
      <div class="card bg-base-100 shadow-xl lg:col-span-2">
        <div class="card-body">
          <h2 class="card-title">Clicks por Fecha</h2>
          <div class="overflow-x-auto">
            <table class="table table-zebra">
              <thead>
                <tr>
                  <th>Fecha</th>
                  <th>Clicks</th>
                  <th>Visualización</th>
                </tr>
              </thead>
              <tbody>
                {#each toSortedArray(stats.clicksByDate, 30) as [date, count]}
                  <tr>
                    <td class="font-semibold">{date}</td>
                    <td>{count}</td>
                    <td>
                      <progress class="progress progress-success w-56" value={count} max={Math.max(...Object.values(stats.clicksByDate))}></progress>
                    </td>
                  </tr>
                {/each}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <!-- Últimos clicks -->
      <div class="card bg-base-100 shadow-xl lg:col-span-2">
        <div class="card-body">
          <h2 class="card-title">Últimos Clicks</h2>
          <div class="overflow-x-auto">
            <table class="table table-xs">
              <thead>
                <tr>
                  <th>Fecha y Hora</th>
                  <th>País</th>
                  <th>Ciudad</th>
                  <th>Navegador</th>
                  <th>Dispositivo</th>
                  <th>Único</th>
                </tr>
              </thead>
              <tbody>
                {#each metrics.slice(0, 20) as metric}
                  <tr>
                    <td>{new Date(metric.clicked_at).toLocaleString()}</td>
                    <td>{metric.country}</td>
                    <td>{metric.metadata?.geo?.city || 'N/A'}</td>
                    <td>{metric.browser}</td>
                    <td class="capitalize">{metric.device_type}</td>
                    <td>
                      {#if metric.is_unique}
                        <span class="badge badge-success badge-sm">Sí</span>
                      {:else}
                        <span class="badge badge-ghost badge-sm">No</span>
                      {/if}
                    </td>
                  </tr>
                {/each}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  {/if}
</div>
