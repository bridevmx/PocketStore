<script>
    // @ts-nocheck
    import { pb } from "$lib/pocketbase.js";
    import { toast } from "svelte-sonner";
    import Icon from "$lib/components/ui/Icon.svelte";
    import Papa from 'papaparse'; // ✅ Importar PapaParse

    const state = $state({
        file: null,
        fileName: "",
        fileSize: 0,
        csvData: [],
        importedContacts: [],
        importing: false,
        currentBatch: 0,
        totalBatches: 0,
        batchSize: 30,
        progress: 0,
        errors: [],
        warnings: [],
        showPreview: false,
        stats: {
            totalRows: 0,
            validContacts: 0,
            skippedRows: 0,
        }
    });

    // Función para limpiar y validar teléfonos
    function cleanAndValidatePhone(phone) {
        if (!phone) return null;

        let cleaned = String(phone).trim();

        if (cleaned.startsWith('+52')) {
            cleaned = cleaned.substring(3);
        }

        if (cleaned.startsWith('52') && !cleaned.startsWith('+')) {
            cleaned = cleaned.substring(2);
        }

        cleaned = cleaned.replace(/\D/g, '');

        if (cleaned.length !== 10) {
            return null;
        }

        return cleaned;
    }

    // ✅ USANDO PAPAPARSE - MUCHO MÁS FÁCIL
    function handleFileSelect(e) {
        const file = e.target.files?.[0];
        if (!file) return;

        if (!file.name.endsWith('.csv')) {
            toast.error("Por favor selecciona un archivo CSV válido");
            return;
        }

        state.file = file;
        state.fileName = file.name;
        state.fileSize = (file.size / 1024).toFixed(2);
        state.csvData = [];
        state.importedContacts = [];
        state.errors = [];
        state.warnings = [];
        state.showPreview = false;
        state.stats = { totalRows: 0, validContacts: 0, skippedRows: 0 };

        // PapaParse hace todo el trabajo pesado
        Papa.parse(file, {
            header: true,
            skipEmptyLines: true,
            complete: (results) => {
                try {
                    const contacts = [];
                    state.stats.totalRows = results.data.length;

                    results.data.forEach((row, index) => {
                        // Obtener valores sin importar variaciones de nombres de columna
                        const firstName = row['First Name'] || row['first name'] || row['Nombre'] || "";
                        const lastName = row['Last Name'] || row['last name'] || row['Apellido'] || "";
                        const phone = row['Phone 1 - Value'] || row['Phone'] || row['phone'] || row['Teléfono'] || "";

                        // Validar nombre (REQUERIDO)
                        if (!firstName.trim()) {
                            state.warnings.push(`Fila ${index + 1}: Falta nombre`);
                            state.stats.skippedRows++;
                            return;
                        }

                        // Validar teléfono (REQUERIDO)
                        const cleanedPhone = cleanAndValidatePhone(phone);
                        if (!cleanedPhone) {
                            state.warnings.push(`Fila ${index + 1}: Teléfono inválido (${phone})`);
                            state.stats.skippedRows++;
                            return;
                        }

                        // Combinar nombre y apellido (apellido es OPCIONAL)
                        let fullName = firstName.trim();
                        if (lastName && lastName.trim()) {
                            fullName = `${firstName.trim()} ${lastName.trim()}`;
                        }

                        contacts.push({
                            name: fullName,
                            lastname: lastName.trim() || "", // Vacío si no existe
                            phone: cleanedPhone,
                            show: true,
                        });

                        state.stats.validContacts++;
                    });

                    state.csvData = contacts;

                    if (state.csvData.length === 0) {
                        toast.error("No se encontraron contactos válidos");
                        return;
                    }

                    toast.success(`✅ ${state.csvData.length} contactos listos para importar`);
                    state.showPreview = true;

                } catch (error) {
                    console.error("Error procesando CSV:", error);
                    toast.error("Error al procesar el archivo: " + error.message);
                }
            },
            error: (error) => {
                console.error("Error leyendo archivo:", error);
                toast.error("Error al leer el archivo: " + error.message);
            }
        });
    }

    async function importContacts() {
        if (state.csvData.length === 0) {
            toast.error("No hay contactos para importar");
            return;
        }

        state.importing = true;
        state.errors = [];
        state.importedContacts = [];
        state.totalBatches = Math.ceil(state.csvData.length / state.batchSize);
        state.currentBatch = 0;
        state.progress = 0;

        try {
            for (let i = 0; i < state.csvData.length; i += state.batchSize) {
                state.currentBatch++;
                const batch = state.csvData.slice(i, i + state.batchSize);

                const pbBatch = pb.createBatch();

                batch.forEach(contact => {
                    pbBatch.collection('contacts').create({
                        name: contact.name,
                        lastname: contact.lastname, // Puede estar vacío
                        phone: contact.phone,
                        show: contact.show,
                    });
                });

                try {
                    const result = await pbBatch.send();
                    state.importedContacts.push(...result);
                    state.progress = Math.round((state.currentBatch / state.totalBatches) * 100);
                    
                    toast.success(`Lote ${state.currentBatch}/${state.totalBatches} ✅`);
                    
                    await new Promise(resolve => setTimeout(resolve, 500));
                } catch (error) {
                    console.error(`Error en lote ${state.currentBatch}:`, error);
                    state.errors.push(`Lote ${state.currentBatch}: ${error.message}`);
                    toast.error(`Error en lote ${state.currentBatch}`);
                }
            }

            toast.success(`🎉 Importación completada: ${state.importedContacts.length} contactos creados`);

            if (state.errors.length > 0) {
                toast.warning(`⚠️ ${state.errors.length} errores durante la importación`);
            }

            setTimeout(() => {
                state.file = null;
                state.fileName = "";
                state.csvData = [];
                state.showPreview = false;
            }, 3000);

        } catch (error) {
            console.error("Error importing contacts:", error);
            toast.error("Error durante la importación: " + error.message);
        } finally {
            state.importing = false;
        }
    }

    function downloadTemplate() {
        const headers = "First Name,Middle Name,Last Name,Phonetic First Name,Phonetic Middle Name,Phonetic Last Name,Name Prefix,Name Suffix,Nickname,File As,Organization Name,Organization Title,Organization Department,Birthday,Notes,Photo,Labels,Phone 1 - Label,Phone 1 - Value";
        const examples = [
            "Juan,,,,,,,,,,,,,,,,,Mobile,5551234567",
            "María,,,García,,,,,,,,,,,,,Mobile,+525552345678",
            "Carlos,Javier,López,,,,,,,,,,,,,,Mobile,525553456789",
            "Ana,,,,,,,,,,,,,,,,Mobile,5554567890",
        ];
        const csv = [headers, ...examples].join('\n');

        const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
        const link = document.createElement("a");
        const url = URL.createObjectURL(blob);
        link.setAttribute("href", url);
        link.setAttribute("download", "plantilla_google_contacts.csv");
        link.click();
        toast.success("✅ Plantilla descargada");
    }

    function resetImport() {
        state.file = null;
        state.fileName = "";
        state.csvData = [];
        state.importedContacts = [];
        state.errors = [];
        state.warnings = [];
        state.showPreview = false;
        state.progress = 0;
        state.currentBatch = 0;
        state.totalBatches = 0;
        state.stats = { totalRows: 0, validContacts: 0, skippedRows: 0 };
    }
</script>

<div class="min-h-screen bg-gradient-to-br from-base-200 to-base-300 p-6">
    <div class="max-w-4xl mx-auto space-y-6">
        <!-- Header -->
        <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
                <h1 class="text-4xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                    Importar Contactos
                </h1>
                <p class="text-base-content/70 mt-2">
                    Carga tus contactos desde Google Contacts en segundos
                </p>
            </div>
            <a href="#/contacts" class="btn btn-ghost btn-lg gap-2">
                <Icon name="mdi:arrow-left" width="20" height="20" />
                Volver
            </a>
        </div>

        {#if !state.showPreview}
            <!-- Zona de carga -->
            <div class="card bg-base-100 shadow-2xl">
                <div class="card-body p-8">
                    <h2 class="card-title text-2xl mb-8">
                        <Icon name="mdi:upload-cloud" width="28" height="28" class="text-primary" />
                        Cargar Archivo CSV
                    </h2>

                    <div class="grid lg:grid-cols-3 gap-8 mb-8">
                        <!-- Área de drag & drop -->
                        <div class="lg:col-span-2">
                            <label
                                class="group relative flex flex-col items-center justify-center w-full h-64 border-3 border-dashed border-primary/30 rounded-2xl p-8 text-center cursor-pointer hover:border-primary hover:bg-primary/5 transition-all duration-300"
                                for="file-input"
                            >
                                <div class="space-y-3">
                                    <Icon name="mdi:cloud-upload-outline" width="64" height="64" class="mx-auto text-primary/60 group-hover:text-primary group-hover:scale-110 transition-all" />
                                    <div>
                                        <p class="font-bold text-lg">Arrastra tu archivo aquí</p>
                                        <p class="text-sm text-base-content/60">o haz clic para seleccionar</p>
                                    </div>
                                </div>
                                <input
                                    id="file-input"
                                    type="file"
                                    accept=".csv"
                                    class="hidden"
                                    onchange={handleFileSelect}
                                />
                            </label>

                            {#if state.fileName}
                                <div class="mt-6 p-6 bg-gradient-to-r from-success/10 to-success/5 rounded-xl border-2 border-success/50 animate-in fade-in slide-in-from-bottom-4">
                                    <div class="flex items-center gap-4">
                                        <Icon name="mdi:check-circle" width="32" height="32" class="text-success" />
                                        <div class="flex-1">
                                            <p class="font-bold text-success text-lg">Archivo cargado</p>
                                            <p class="text-sm text-base-content/70">📄 {state.fileName}</p>
                                            <p class="text-sm text-base-content/70">💾 {state.fileSize} KB</p>
                                        </div>
                                    </div>
                                </div>
                            {/if}
                        </div>

                        <!-- Panel de información -->
                        <div class="lg:col-span-1 space-y-4">
                            <div class="card bg-info/10 border border-info/50">
                                <div class="card-body p-4">
                                    <h3 class="font-bold text-info mb-3 flex items-center gap-2">
                                        <Icon name="mdi:information-outline" width="20" height="20" />
                                        Cómo exportar
                                    </h3>
                                    <ol class="list-decimal list-inside space-y-2 text-sm">
                                        <li><a href="https://contacts.google.com" target="_blank" class="link text-info">contacts.google.com</a></li>
                                        <li>Selecciona tus contactos</li>
                                        <li>Más → Exportar</li>
                                        <li>Google CSV</li>
                                        <li>Carga aquí</li>
                                    </ol>
                                </div>
                            </div>

                            <div class="card bg-success/10 border border-success/50">
                                <div class="card-body p-4">
                                    <h3 class="font-bold text-success mb-3 flex items-center gap-2">
                                        <Icon name="mdi:shield-check" width="20" height="20" />
                                        Validaciones
                                    </h3>
                                    <ul class="space-y-2 text-sm">
                                        <li class="flex items-start gap-2">
                                            <Icon name="mdi:check" width="16" height="16" class="text-success flex-shrink-0 mt-0.5" />
                                            <span>10 dígitos exactos</span>
                                        </li>
                                        <li class="flex items-start gap-2">
                                            <Icon name="mdi:check" width="16" height="16" class="text-success flex-shrink-0 mt-0.5" />
                                            <span>Elimina +52 y 52</span>
                                        </li>
                                        <li class="flex items-start gap-2">
                                            <Icon name="mdi:check" width="16" height="16" class="text-success flex-shrink-0 mt-0.5" />
                                            <span>Apellido opcional</span>
                                        </li>
                                        <li class="flex items-start gap-2">
                                            <Icon name="mdi:check" width="16" height="16" class="text-success flex-shrink-0 mt-0.5" />
                                            <span>Lotes de 30</span>
                                        </li>
                                    </ul>
                                </div>
                            </div>

                            <button class="btn btn-outline btn-block gap-2 hover:btn-primary" onclick={downloadTemplate}>
                                <Icon name="mdi:download" width="18" height="18" />
                                Plantilla
                            </button>
                        </div>
                    </div>

                    {#if state.stats.validContacts > 0}
                        <div class="divider my-0"></div>
                        <div class="mt-8">
                            <h3 class="font-bold mb-4">📊 Análisis del archivo</h3>
                            <div class="grid md:grid-cols-3 gap-4">
                                <div class="stat bg-base-200 rounded-lg">
                                    <div class="stat-title">Total filas</div>
                                    <div class="stat-value text-lg">{state.stats.totalRows}</div>
                                </div>
                                <div class="stat bg-success/10 rounded-lg">
                                    <div class="stat-title">Válidos</div>
                                    <div class="stat-value text-lg text-success">{state.stats.validContacts}</div>
                                </div>
                                <div class="stat bg-warning/10 rounded-lg">
                                    <div class="stat-title">Ignorados</div>
                                    <div class="stat-value text-lg text-warning">{state.stats.skippedRows}</div>
                                </div>
                            </div>

                            {#if state.warnings.length > 0}
                                <div class="alert alert-warning mt-4">
                                    <Icon name="mdi:alert-circle-outline" width="20" height="20" />
                                    <div>
                                        <p class="font-semibold">{state.warnings.length} advertencia{state.warnings.length > 1 ? "s" : ""}</p>
                                        <details class="mt-2">
                                            <summary class="cursor-pointer text-sm">Ver detalles</summary>
                                            <ul class="list-disc list-inside text-xs mt-2 space-y-1 max-h-32 overflow-y-auto">
                                                {#each state.warnings as warning}
                                                    <li>{warning}</li>
                                                {/each}
                                            </ul>
                                        </details>
                                    </div>
                                </div>
                            {/if}
                        </div>
                    {/if}

                    {#if state.csvData.length > 0}
                        <div class="card-actions justify-end gap-4 mt-8">
                            <button class="btn btn-outline gap-2" onclick={resetImport}>
                                <Icon name="mdi:close" width="18" height="18" />
                                Cancelar
                            </button>
                            <button class="btn btn-primary gap-2 btn-lg" onclick={() => (state.showPreview = true)}>
                                <Icon name="mdi:eye" width="18" height="18" />
                                Vista Previa ({state.csvData.length})
                            </button>
                        </div>
                    {/if}
                </div>
            </div>
        {:else}
            <!-- Vista previa -->
            <div class="card bg-base-100 shadow-2xl">
                <div class="card-body p-8">
                    <h2 class="card-title text-2xl mb-6">
                        <Icon name="mdi:preview" width="28" height="28" class="text-primary" />
                        Vista Previa ({state.csvData.length} contactos)
                    </h2>

                    {#if !state.importing}
                        <div class="overflow-x-auto mb-6 border rounded-lg">
                            <table class="table table-zebra w-full">
                                <thead class="bg-base-200">
                                    <tr>
                                        <th class="w-12">#</th>
                                        <th>Nombre Completo</th>
                                        <th>Teléfono</th>
                                        <th>Estado</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {#each state.csvData.slice(0, 10) as contact, i}
                                        <tr class="hover:bg-base-200">
                                            <td class="font-bold">{i + 1}</td>
                                            <td>{contact.name}</td>
                                            <td>
                                                <code class="bg-primary/10 text-primary px-3 py-1 rounded-lg font-bold">{contact.phone}</code>
                                            </td>
                                            <td>
                                                <span class="badge badge-success">✓ Activo</span>
                                            </td>
                                        </tr>
                                    {/each}
                                </tbody>
                            </table>
                        </div>

                        <div class="card-actions justify-end gap-4 mt-6">
                            <button class="btn btn-outline gap-2" onclick={() => (state.showPreview = false)}>
                                <Icon name="mdi:arrow-left" width="18" height="18" />
                                Atrás
                            </button>
                            <button class="btn btn-success gap-2 btn-lg" onclick={importContacts}>
                                <Icon name="mdi:play-circle" width="18" height="18" />
                                Importar
                            </button>
                        </div>
                    {:else}
                        <div class="space-y-8">
                            <div class="text-center space-y-2">
                                <Icon name="mdi:cloud-upload-outline" width="64" height="64" class="mx-auto text-primary animate-bounce" />
                                <p class="font-bold text-xl">Importando...</p>
                                <p class="text-base-content/70">
                                    Lote {state.currentBatch} de {state.totalBatches}
                                </p>
                            </div>

                            <div class="space-y-2">
                                <progress class="progress progress-primary w-full h-4" value={state.progress} max="100" />
                                <p class="text-center font-bold text-2xl text-primary">{state.progress}%</p>
                            </div>

                            <div class="grid md:grid-cols-3 gap-4">
                                <div class="stat bg-success/10 rounded-lg border border-success/50">
                                    <div class="stat-title">Importados</div>
                                    <div class="stat-value text-success">{state.importedContacts.length}</div>
                                </div>
                                <div class="stat bg-primary/10 rounded-lg border border-primary/50">
                                    <div class="stat-title">Lote</div>
                                    <div class="stat-value text-primary">{state.currentBatch}</div>
                                </div>
                                <div class="stat bg-warning/10 rounded-lg border border-warning/50">
                                    <div class="stat-title">Errores</div>
                                    <div class="stat-value text-warning">{state.errors.length}</div>
                                </div>
                            </div>

                            <div class="alert alert-info">
                                <Icon name="mdi:clock-outline" width="20" height="20" />
                                <span>Espera a que finalice la importación...</span>
                            </div>
                        </div>
                    {/if}
                </div>
            </div>

            {#if state.importing === false && state.importedContacts.length > 0}
                <div class="card bg-gradient-to-r from-success/20 to-success/10 border-2 border-success shadow-2xl">
                    <div class="card-body p-8">
                        <div class="flex items-start gap-4">
                            <Icon name="mdi:check-circle" width="40" height="40" class="text-success flex-shrink-0" />
                            <div class="flex-1">
                                <h2 class="card-title text-2xl text-success">¡Importación Completada!</h2>
                                <p class="text-lg mt-2">
                                    <strong>{state.importedContacts.length}</strong> contactos importados
                                </p>
                                
                                {#if state.errors.length > 0}
                                    <div class="mt-4 p-3 bg-warning/10 rounded-lg text-sm">
                                        ⚠️ {state.errors.length} error{state.errors.length > 1 ? "es" : ""}
                                    </div>
                                {/if}

                                <div class="card-actions justify-end mt-4">
                                    <a href="#/contacts" class="btn btn-success btn-lg gap-2">
                                        <Icon name="mdi:account-check" width="20" height="20" />
                                        Ver Contactos
                                    </a>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            {/if}
        {/if}
    </div>
</div>
