<script>
    // @ts-nocheck
    import { pb } from "$lib/pocketbase.js";
    import { toast } from "svelte-sonner";
    import Icon from "$lib/components/ui/Icon.svelte";
    import QRCode from "qrcode";
    import dayjs from "dayjs";

    const state = $state({
        urls: [],
        loading: false,
        submitting: false,
        showForm: false,
        formData: {
            original_url: "",
            title: "",
        },
        generatedUrl: null,
        qrCode: null,
    });

    async function generateShortUrl() {
        if (!state.formData.original_url.trim()) {
            toast.error("La URL original es requerida");
            return;
        }

        state.submitting = true;
        try {
            const response = await pb.send("/api/shorten", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    original_url: state.formData.original_url,
                    title: state.formData.title || "",
                    host: pb.baseURL || window.location.origin
                })
            });
            const result = response

            if (!response.code) {
                throw new Error(result.error || "Error al crear URL");
            }

            state.generatedUrl = result;

            // Generar QR
            const qrCanvas = await QRCode.toCanvas(result.short_url, {
                width: 300,
                margin: 2,
                color: {
                    dark: "#000",
                    light: "#fff"
                }
            });
            state.qrCode = qrCanvas.toDataURL("image/png");

            toast.success("URL corta creada exitosamente");

            // Limpiar formulario
            state.formData = { original_url: "", title: "" };
            state.showForm = false;

            // Recargar lista
            loadUrls();

        } catch (error) {
            console.error("Error:", error);
            toast.error("Error: " + error.message);
        } finally {
            state.submitting = false;
        }
    }

    async function loadUrls() {
        state.loading = true;
        try {
            state.urls = await pb.collection("urls").getFullList({
                filter: 'metadata = null',
            });
        } catch (error) {
            console.error("Error:", error);
            toast.error("Error al cargar URLs");
        } finally {
            state.loading = false;
        }
    }

    function copyToClipboard(text) {
        navigator.clipboard.writeText(text);
        toast.success("Copiado al portapapeles");
    }

    function downloadQR() {
        if (!state.qrCode) return;
        const link = document.createElement("a");
        link.href = state.qrCode;
        link.download = `qr-${state.generatedUrl.code}.png`;
        link.click();
        toast.success("QR descargado");
    }

    onMount(() => {
        loadUrls();
    });

    import { onMount } from "svelte";
</script>

<div class="space-y-6 p-6">
    <!-- Header -->
    <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
            <h1 class="text-4xl font-bold">Generador de URLs Cortas</h1>
            <p class="text-base-content/70 mt-2">
                Crea URLs cortas con código QR
            </p>
        </div>
        <button 
            class="btn btn-primary btn-lg gap-2"
            onclick={() => state.showForm = !state.showForm}
        >
            <Icon name="mdi:plus" width="20" height="20" />
            Nueva URL
        </button>
    </div>

    <!-- Formulario -->
    {#if state.showForm}
        <div class="card bg-base-100 shadow-xl">
            <div class="card-body">
                <h2 class="card-title mb-4">Crear Nueva URL Corta</h2>
                
                <div class="space-y-4">
                    <label class="form-control">
                        <div class="label">
                            <span class="label-text">URL Original</span>
                        </div>
                        <input
                            type="url"
                            placeholder="https://ejemplo.com/promo"
                            class="input input-bordered w-full"
                            bind:value={state.formData.original_url}
                            required
                        />
                    </label>

                    <label class="form-control">
                        <div class="label">
                            <span class="label-text">Título (Opcional)</span>
                        </div>
                        <input
                            type="text"
                            placeholder="Mi promoción"
                            class="input input-bordered w-full"
                            bind:value={state.formData.title}
                        />
                    </label>

                    <div class="card-actions justify-end gap-2 mt-6">
                        <button
                            class="btn btn-ghost"
                            onclick={() => state.showForm = false}
                        >
                            Cancelar
                        </button>
                        <button
                            class="btn btn-primary"
                            onclick={generateShortUrl}
                            disabled={state.submitting}
                        >
                            {#if state.submitting}
                                <span class="loading loading-spinner loading-sm"></span>
                            {/if}
                            Generar URL Corta
                        </button>
                    </div>
                </div>
            </div>
        </div>
    {/if}

    <!-- Resultado generado -->
    {#if state.generatedUrl}
        <div class="card bg-gradient-to-r from-success/20 to-success/10 border-2 border-success shadow-xl">
            <div class="card-body">
                <h2 class="card-title text-success">✅ URL Corta Generada</h2>
                
                <div class="grid lg:grid-cols-3 gap-6">
                    <!-- QR Code -->
                    <div class="flex flex-col items-center justify-center">
                        {#if state.qrCode}
                            <img src={state.qrCode} alt="QR Code" class="w-64 h-64 border-4 border-success rounded-lg" />
                            <button
                                class="btn btn-success btn-sm mt-4 gap-2"
                                onclick={downloadQR}
                            >
                                <Icon name="mdi:download" width="16" height="16" />
                                Descargar QR
                            </button>
                        {/if}
                    </div>

                    <!-- Información -->
                    <div class="col-span-2 space-y-4">
                        <div>
                            <p class="text-sm text-base-content/70">URL Corta</p>
                            <div class="flex gap-2">
                                <code class="bg-base-300 px-4 py-3 rounded-lg flex-1 font-mono font-bold text-sm overflow-auto">
                                    {state.generatedUrl.short_url}
                                </code>
                                <button
                                    class="btn btn-outline btn-sm"
                                    onclick={() => copyToClipboard(state.generatedUrl.short_url)}
                                >
                                    <Icon name="mdi:content-copy" width="16" height="16" />
                                </button>
                            </div>
                        </div>

                        <div>
                            <p class="text-sm text-base-content/70">Código</p>
                            <p class="font-bold text-lg">{state.generatedUrl.code}</p>
                        </div>

                        <div>
                            <p class="text-sm text-base-content/70">URL Original</p>
                            <p class="text-sm break-all">{state.generatedUrl.original_url}</p>
                        </div>

                        <div class="flex gap-2 mt-6">
                            <button
                                class="btn btn-outline btn-sm gap-2"
                                onclick={() => {
                                    state.generatedUrl = null;
                                    state.qrCode = null;
                                }}
                            >
                                <Icon name="mdi:plus" width="16" height="16" />
                                Crear Otra
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    {/if}

    <!-- Lista de URLs -->
    <div class="card bg-base-100 shadow-xl">
        <div class="card-body">
            <h2 class="card-title mb-4">Mis URLs Cortas</h2>

            {#if state.loading}
                <div class="text-center p-8">
                    <span class="loading loading-spinner loading-lg"></span>
                </div>
            {:else if state.urls.length > 0}
                <div class="overflow-x-auto">
                    <table class="table table-compact w-full">
                        <thead>
                            <tr>
                                <th>Código</th>
                                <th>Título</th>
                                <th>Clicks</th>
                                <th>Unique</th>
                                <th>Creada</th>
                                <th>Estado</th>
                                <th>Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            {#each state.urls as url (url.id)}
                                <tr class="hover:bg-base-200">
                                    <td>
                                        <code class="bg-base-300 px-2 py-1 rounded text-xs font-bold">
                                            {url.code}
                                        </code>
                                    </td>
                                    <td>{url.title || "—"}</td>
                                    <td class="font-bold">{url.clicks}</td>
                                    <td>{url.unique_clicks}</td>
                                    <td class="text-sm text-base-content/70">
                                        {dayjs(url.created).format("DD/MM HH:mm")}
                                    </td>
                                    <td>
                                        <span class="badge {url.active ? 'badge-success' : 'badge-neutral'}">
                                            {url.active ? "Activo" : "Inactivo"}
                                        </span>
                                    </td>
                                    <td>
                                        <div class="flex gap-2">
                                            <button
                                                class="btn btn-ghost btn-xs gap-1"
                                                onclick={() => copyToClipboard(url.short_url)}
                                            >
                                                <Icon name="mdi:content-copy" width="14" height="14" />
                                            </button>
                                            <a
                                                href="#/urls/{url.id}/stats"
                                                class="btn btn-ghost btn-xs gap-1"
                                            >
                                                <Icon name="mdi:chart-line" width="14" height="14" />
                                            </a>
                                        </div>
                                    </td>
                                </tr>
                            {/each}
                        </tbody>
                    </table>
                </div>
            {:else}
                <div class="text-center p-12 text-base-content/50">
                    <Icon name="mdi:link-off" width="48" height="48" class="mx-auto mb-2 opacity-30" />
                    <p>No tienes URLs cortas aún</p>
                </div>
            {/if}
        </div>
    </div>
</div>
