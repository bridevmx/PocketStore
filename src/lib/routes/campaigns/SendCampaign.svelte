<script>
  import { onMount, onDestroy } from "svelte";
  import { pb } from "$lib/pocketbase.js";
  import { toast } from "svelte-sonner";
  import dayjs from "dayjs";
  import { router, meta } from "tinro";
  import {env} from "$lib/server/env.js";

  const props = meta();
  const campaignId = props.params.id;
  const urlSmsGateway = env.PUBLIC_URL_SMS_GATEWAY;
  
  // Estado reactivo Svelte 5 (runes)
  let campaign = $state(null);
  let messages = $state([]);
  let loading = $state(true);
  let realtimeConnected = $state(false);
  let logs = $state([]);
  let lastUpdate = $state(null);
  let sending = $state(false);
  let retrying = $state(false);
  let campaignUnsubscribe;
  let messagesUnsubscribe;

  // Stats derivados
  const stats = $derived({
    pending: messages.filter((m) => m.status === "pending").length,
    sent: messages.filter((m) => m.status === "sent").length,
    delivered: messages.filter((m) => m.status === "delivered").length,
    failed: messages.filter((m) => m.status === "failed").length,
    total: messages.length,
  });

  const progress = $derived(
    stats.total > 0
      ? ((stats.sent + stats.delivered + stats.failed) / stats.total) * 100
      : 0
  );

  const successRate = $derived(
    stats.total > 0 ? ((stats.delivered / stats.total) * 100).toFixed(1) : 0
  );

  const failureRate = $derived(
    stats.total > 0 ? ((stats.failed / stats.total) * 100).toFixed(1) : 0
  );

  const canStart = $derived(
    campaign?.status === "draft" || campaign?.status === "failed"
  );

  const canPause = $derived(
    campaign?.status === "sending"
  );

  const canResume = $derived(
    campaign?.status === "paused" && stats.pending > 0
  );

  const canRetry = $derived(
    (campaign?.status === "completed" || campaign?.status === "failed") && 
    stats.failed > 0
  );

  const isCompleted = $derived(
    stats.total > 0 && 
    stats.pending === 0 &&
    campaign?.status === "completed"
  );

  const isSending = $derived(
    campaign?.status === "sending"
  );

  function addLog(msg, type = "info") {
    const time = dayjs().format("HH:mm:ss");
    logs = [{ timestamp: time, message: msg, type }, ...logs.slice(0, 99)];
  }

  function getLogClass(type) {
    return {
      error: "text-error",
      success: "text-success",
      system: "text-info",
      warning: "text-warning",
      sent: "text-success",
    }[type] || "";
  }

  function clearLogs() {
    logs = [];
    addLog("Logs limpiados", "system");
  }

  async function updateCampaignStatus(status) {
    try {
      await pb.collection("campaigns_config").update(campaignId, { status });
      campaign = { ...campaign, status };
      addLog(`Estado de campaña actualizado a: ${status}`, "system");
    } catch (error) {
      console.error("Error actualizando estado de campaña:", error);
      addLog(`Error actualizando estado: ${error.message}`, "error");
      throw error;
    }
  }

  async function loadCampaign() {
    try {
      loading = true;
      
      campaign = await pb.collection("campaigns_config").getOne(campaignId);
      
      const messagesData = await pb.collection("campaign_messages").getList(1, 500, {
        filter: `campaign_config = "${campaignId}"`,
        expand: "contact",
      });
      
      messages = messagesData.items.map(item => ({
        ...item,
        contact_name: item.expand?.contact?.name || "Sin nombre",
        contact_phone: item.expand?.contact?.phone || "Sin teléfono"
      }));

      lastUpdate = new Date();
      addLog("Campaña cargada correctamente", "success");
    } catch (e) {
      console.error("Error cargando campaña:", e);
      toast.error("Error al cargar la campaña: " + e.message);
      router.goto("/campaigns");
    } finally {
      loading = false;
    }
  }

  function setupRealtime() {
    try {
      // Limpiar suscripciones anteriores
      if (campaignUnsubscribe) {
        pb.collection("campaigns_config").unsubscribe(campaignId);
      }
      if (messagesUnsubscribe) {
        pb.collection("campaign_messages").unsubscribe("*");
      }

      // Suscribirse a cambios en la campaña
      campaignUnsubscribe = pb.collection("campaigns_config").subscribe(campaignId, (e) => {
        const { action, record } = e;
        
        if (action === "update") {
          campaign = { ...campaign, ...record };
          addLog(`📡 Campaña actualizada: ${record.status}`, "system");
        }
      });

      // Suscribirse a cambios en los mensajes de esta campaña
      messagesUnsubscribe = pb.collection("campaign_messages").subscribe("*", async (e) => {
        const { action, record } = e;
        
        // Solo procesar mensajes de esta campaña
        if (record.campaign_config !== campaignId) return;

        if (action === "create") {
          // Expandir el contacto para obtener nombre y teléfono
          try {
            const fullRecord = await pb.collection("campaign_messages").getOne(record.id, {
              expand: "contact"
            });
            
            messages = [...messages, {
              ...fullRecord,
              contact_name: fullRecord.expand?.contact?.name || "Sin nombre",
              contact_phone: fullRecord.expand?.contact?.phone || "Sin teléfono"
            }];
            
            addLog(`➕ Mensaje creado para ${fullRecord.expand?.contact?.name}`, "system");
          } catch (err) {
            console.error("Error expandiendo mensaje:", err);
          }
        } else if (action === "update") {
          const idx = messages.findIndex((m) => m.id === record.id);
          if (idx > -1) {
            const contactName = messages[idx].contact_name;
            const contactPhone = messages[idx].contact_phone;
            
            messages[idx] = { 
              ...messages[idx], 
              ...record,
              contact_name: contactName,
              contact_phone: contactPhone
            };
            messages = [...messages];

            // Registrar el cambio de estado
            if (record.status === "sent") {
              addLog(`📤 Enviado a ${contactName}`, "sent");
            } else if (record.status === "delivered") {
              addLog(`✅ Entregado a ${contactName}`, "success");
            } else if (record.status === "failed") {
              addLog(`❌ Falló ${contactName}: ${record.error_message}`, "error");
            } else if (record.status === "pending") {
              addLog(`🔄 Reintentando ${contactName}`, "warning");
            }
          }
        } else if (action === "delete") {
          messages = messages.filter((m) => m.id !== record.id);
          addLog(`🗑️ Mensaje eliminado`, "system");
        }

        lastUpdate = new Date();
      });

      realtimeConnected = true;
      addLog("✅ Realtime conectado", "success");
    } catch (error) {
      console.error("Error configurando realtime:", error);
      addLog("❌ Error conectando realtime", "error");
      realtimeConnected = false;
    }
  }

  async function refresh() {
    addLog("🔄 Actualizando datos...", "system");
    try {
      const messagesData = await pb.collection("campaign_messages").getList(1, 500, {
        filter: `campaign_config = "${campaignId}"`,
        expand: "contact"
      });
      
      messages = messagesData.items.map(item => ({
        ...item,
        contact_name: item.expand?.contact?.name || "Sin nombre",
        contact_phone: item.expand?.contact?.phone || "Sin teléfono"
      }));

      campaign = await pb.collection("campaigns_config").getOne(campaignId);

      lastUpdate = new Date();
      addLog("✅ Datos actualizados", "success");
      toast.success("Datos actualizados");
    } catch (error) {
      addLog("❌ Error actualizando datos", "error");
      toast.error("Error al actualizar");
    }
  }

  async function createCampaignMessages(phoneNumbers) {
    const createdMessages = [];
    
    for (const phone of phoneNumbers) {
      try {
        // Buscar el contacto por teléfono
        const contactsData = await pb.collection("contacts").getList(1, 1, {
          filter: `phone = "${phone}"`,
        });

        const contact = contactsData.items[0];
        
        const messageData = {
          campaign_config: campaignId,
          contact: contact?.id || "",
          status: "pending",
          retry_count: 0,
        };

        const created = await pb.collection("campaign_messages").create(messageData);
        
        createdMessages.push({
          ...created,
          contact_name: contact?.name || "Sin nombre",
          contact_phone: phone,
        });
      } catch (error) {
        console.error(`Error creando mensaje para ${phone}:`, error);
        addLog(`❌ Error creando mensaje para ${phone}`, "error");
      }
    }

    return createdMessages;
  }

  async function retryFailedMessages() {
    if (retrying || sending) return;
    
    try {
      retrying = true;
      addLog("🔄 Iniciando reintento de mensajes fallidos...", "warning");
      
      const failedMessages = messages.filter(m => m.status === "failed");
      
      if (failedMessages.length === 0) {
        toast.warning("No hay mensajes fallidos para reintentar");
        return;
      }

      addLog(`📋 Encontrados ${failedMessages.length} mensajes fallidos`, "warning");

      // Actualizar todos los mensajes fallidos a "pending" y resetear campos
      let updatedCount = 0;
      const batch = pb.createBatch();
      failedMessages.forEach(msg=>{
        batch.collection('campaign_messages').update(msg.id, {
            status: "pending",
            error_message: "",
            failed_at: "",
            retry_count: (msg.retry_count || 0) + 1
          });
        
          updatedCount++;
          addLog(`🔄 ${msg.contact_name} marcado para reintento (intento #${(msg.retry_count || 0) + 1})`, "warning");
      })
      
        try {
          await batch.send();
        } catch (updateErr) {
          addLog(`❌ Error actualizando mensajes: ${updateErr.message}`, "error");
        }
      

      if (updatedCount === 0) {
        throw new Error("No se pudo actualizar ningún mensaje fallido");
      }

      addLog(`✅ ${updatedCount} mensajes marcados como pendientes`, "success");

      // Actualizar estado de campaña a "sending"
      await updateCampaignStatus("sending");

      // Construir la URL del webhook de SMSGateway
      const macroWebhook = `${urlSmsGateway}${campaignId}`;
      
      addLog(`📡 Enviando solicitud de reintento a SMSGateway...`, "system");
      
      // Llamar al webhook de SMSGateway
      const sendSms = await pb.send(macroWebhook, {method: 'GET'});
      
      if (sendSms.success) {
        addLog(`✅ SMSGateway procesando reintentos`, "success");
        toast.success(`Reintentando ${updatedCount} mensajes fallidos`);
      } else {
        throw new Error(`Respuesta inesperada de SMSGateway: ${sendSms}`);
      }

      // Refrescar datos para ver los cambios
      await refresh();

    } catch (error) {
      console.error("Error reintentando mensajes:", error);
      addLog(`❌ Error en reintento: ${error.message}`, "error");
      toast.error("Error al reintentar mensajes: " + error.message);
      
      try {
        await updateCampaignStatus("failed");
      } catch (statusError) {
        console.error("Error actualizando estado a failed:", statusError);
      }
    } finally {
      retrying = false;
    }
  }

  async function startCampaign() {
    if (sending) return;
    
    try {
      sending = true;
      addLog("🚀 Iniciando campaña...", "system");

      // Si no hay mensajes, crearlos
      if (messages.length === 0) {
        addLog("📝 Creando mensajes para contactos activos...", "system");
        
        const contactsData = await pb.collection("contacts").getList(1, 500, {
          filter: "show = true"
        });
        
        if (contactsData.items.length === 0) {
          toast.error("No hay contactos disponibles para enviar");
          sending = false;
          return;
        }

        const phoneNumbers = contactsData.items.map(contact => contact.phone);
        const createdMessages = await createCampaignMessages(phoneNumbers);
        messages = createdMessages;
        
        addLog(`✅ ${messages.length} mensajes creados`, "success");
      }

      // Actualizar estado de campaña a "sending"
      await updateCampaignStatus("sending");

      // Construir la URL del webhook de SMSGateway
      const macroWebhook = `${urlSmsGateway}${campaignId}`;
      
      addLog(`📡 Enviando solicitud a SMSGateway...`, "system");
      
      // Llamar al webhook de SMSGateway
      const sendSms = await pb.send(macroWebhook, {method: 'GET'});
      
      if (sendSms.success) {
        addLog(`✅ SMSGateway procesando campaña`, "success");
        toast.success("Campaña iniciada - SMSGateway está procesando los mensajes");
      } else {
        throw new Error(`Respuesta inesperada de SMSGateway: ${sendSms}`);
      }

    } catch (error) {
      console.error("Error iniciando campaña:", error);
      addLog(`❌ Error iniciando campaña: ${error.message}`, "error");
      toast.error("Error al iniciar la campaña: " + error.message);
      
      try {
        await updateCampaignStatus("failed");
      } catch (statusError) {
        console.error("Error actualizando estado a failed:", statusError);
      }
    } finally {
      sending = false;
    }
  }

  async function pauseCampaign() {
    try {
      await updateCampaignStatus("paused");
      addLog("⏸️ Campaña pausada", "warning");
      toast.info("Campaña pausada");
    } catch (error) {
      console.error("Error pausando campaña:", error);
      toast.error("Error al pausar la campaña");
    }
  }

  async function resumeCampaign() {
    if (sending) return;
    
    try {
      sending = true;
      addLog("▶️ Reanudando campaña...", "system");

      // Actualizar estado de campaña a "sending"
      await updateCampaignStatus("sending");

      // Construir la URL del webhook de SMSGateway
      const macroWebhook = `${urlSmsGateway}${campaignId}`;
      
      addLog(`📡 Enviando solicitud a SMSGateway...`, "system");
      
      // Llamar al webhook de SMSGateway
      const sendSms = await pb.send(macroWebhook, {method: 'GET'});
      
      if (sendSms.success) {
        addLog(`✅ SMSGateway reanudando envío`, "success");
        toast.success("Campaña reanudada");
      } else {
        throw new Error(`Respuesta inesperada de SMSGateway: ${sendSms}`);
      }

    } catch (error) {
      console.error("Error reanudando campaña:", error);
      addLog(`❌ Error reanudando campaña: ${error.message}`, "error");
      toast.error("Error al reanudar la campaña: " + error.message);
      
      try {
        await updateCampaignStatus("failed");
      } catch (statusError) {
        console.error("Error actualizando estado a failed:", statusError);
      }
    } finally {
      sending = false;
    }
  }

  // Efecto para detectar cuando la campaña se completa
  $effect(() => {
    if (campaign && stats.total > 0 && stats.pending === 0) {
      // Solo actualizar si el estado actual es "sending"
      if (campaign.status === "sending") {
        updateCampaignStatus("completed").then(() => {
          addLog("✅ Campaña completada automáticamente", "success");
          toast.success("Campaña completada");
          
          // Notificar si hay mensajes fallidos
          if (stats.failed > 0) {
            toast.warning(`${stats.failed} mensajes fallidos - Puedes reintentarlos`);
            addLog(`⚠️ ${stats.failed} mensajes fallidos disponibles para reintento`, "warning");
          }
        });
      }
    }
  });

  onMount(async () => {
    await loadCampaign();
    setupRealtime();
  });

  onDestroy(() => {
    if (campaignUnsubscribe) {
      pb.collection("campaigns_config").unsubscribe(campaignId);
    }
    if (messagesUnsubscribe) {
      pb.collection("campaign_messages").unsubscribe("*");
    }
  });
</script>

{#if loading}
  <div class="flex justify-center items-center min-h-screen">
    <span class="loading loading-spinner loading-lg"></span>
  </div>
{:else if !campaign}
  <div class="alert alert-error">No se pudo cargar la campaña.</div>
{:else}
  <div class="p-4 max-w-6xl mx-auto space-y-6">
    <!-- HEADER -->
    <div class="flex justify-between items-center">
      <div>
        <h1 class="text-3xl font-bold">{campaign.name}</h1>
        <div class="flex gap-2 mt-2">
          <span
            class="badge"
            class:badge-success={campaign.status === "sending"}
            class:badge-warning={campaign.status === "paused"}
            class:badge-info={campaign.status === "completed"}
            class:badge-neutral={campaign.status === "draft"}
            class:badge-error={campaign.status === "failed"}
          >
            {campaign.status}
          </span>
          <span
            class="badge"
            class:badge-success={realtimeConnected}
            class:badge-error={!realtimeConnected}
          >
            {realtimeConnected ? "🟢 Realtime" : "🔴 Desconectado"}
          </span>
          {#if isSending}
            <span class="badge badge-primary animate-pulse">
              📤 Enviando...
            </span>
          {/if}
          {#if retrying}
            <span class="badge badge-warning animate-pulse">
              🔄 Reintentando...
            </span>
          {/if}
        </div>
      </div>
      <div class="flex gap-2 flex-wrap">
        <button 
          class="btn btn-sm" 
          onclick={refresh} 
          disabled={sending || retrying}
        >
          🔄 Actualizar
        </button>
        
        {#if canStart}
          <button 
            class="btn btn-sm btn-primary" 
            onclick={startCampaign}
            disabled={sending || retrying}
          >
            {#if sending}
              <span class="loading loading-spinner loading-xs"></span>
            {/if}
            🚀 {messages.length > 0 ? 'Enviar Mensajes' : 'Iniciar Campaña'}
          </button>
        {/if}
        
        {#if canPause}
          <button 
            class="btn btn-sm btn-warning" 
            onclick={pauseCampaign}
            disabled={sending || retrying}
          >
            ⏸️ Pausar
          </button>
        {/if}

        {#if canResume}
          <button 
            class="btn btn-sm btn-success" 
            onclick={resumeCampaign}
            disabled={sending || retrying}
          >
            {#if sending}
              <span class="loading loading-spinner loading-xs"></span>
            {/if}
            ▶️ Reanudar
          </button>
        {/if}

        {#if canRetry}
          <button 
            class="btn btn-sm btn-warning gap-2" 
            onclick={retryFailedMessages}
            disabled={sending || retrying}
          >
            {#if retrying}
              <span class="loading loading-spinner loading-xs"></span>
            {/if}
            🔄 Reintentar Fallidos ({stats.failed})
          </button>
        {/if}

        {#if campaign.status === "sending" || campaign.status === "paused"}
          <button 
            class="btn btn-sm btn-error btn-outline" 
            onclick={() => updateCampaignStatus("failed")}
            disabled={sending || retrying}
          >
            ❌ Cancelar
          </button>
        {/if}
      </div>
    </div>

    <!-- ALERTS -->
    {#if campaign.status === "failed"}
      <div class="alert alert-error">
        <span>❌ La campaña falló o fue cancelada.</span>
        {#if stats.failed > 0}
          <button class="btn btn-sm btn-warning" onclick={retryFailedMessages}>
            Reintentar {stats.failed} fallidos
          </button>
        {/if}
      </div>
    {:else if retrying}
      <div class="alert alert-warning animate-pulse">
        <span>🔄 Reintentando mensajes fallidos...</span>
      </div>
    {:else if isSending}
      <div class="alert alert-info animate-pulse">
        <span>📤 SMSGateway está procesando y enviando mensajes...</span>
      </div>
    {:else if campaign.status === "paused"}
      <div class="alert alert-warning">
        <span>⏸️ Campaña pausada - Puedes reanudar el envío cuando desees</span>
      </div>
    {:else if isCompleted}
      <div class="alert alert-success">
        <div class="flex-1">
          <span>✅ Campaña completada - Todos los mensajes fueron procesados</span>
          {#if stats.failed > 0}
            <div class="text-sm mt-1">
              ⚠️ Hay {stats.failed} mensajes fallidos que puedes reintentar
            </div>
          {/if}
        </div>
        {#if stats.failed > 0}
          <button class="btn btn-sm btn-warning" onclick={retryFailedMessages}>
            🔄 Reintentar Fallidos
          </button>
        {/if}
      </div>
    {:else if campaign.status === "draft" && messages.length > 0}
      <div class="alert alert-info">
        <span>📋 Hay {messages.length} mensajes pendientes listos para enviar</span>
      </div>
    {/if}

    <!-- STATS -->
    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
      <div class="stat shadow">
        <div class="stat-title">Total</div>
        <div class="stat-value">{stats.total}</div>
      </div>
      <div class="stat shadow" class:animate-pulse={stats.pending > 0 && (isSending || retrying)}>
        <div class="stat-title">Pendientes</div>
        <div class="stat-value text-warning">{stats.pending}</div>
      </div>
      <div class="stat shadow">
        <div class="stat-title">Enviados</div>
        <div class="stat-value text-info">{stats.sent}</div>
      </div>
      <div class="stat shadow">
        <div class="stat-title">Entregados</div>
        <div class="stat-value text-success">{stats.delivered}</div>
        <div class="stat-desc">{successRate}% éxito</div>
      </div>
      <div class="stat shadow" class:animate-pulse={canRetry}>
        <div class="stat-title">Fallidos</div>
        <div class="stat-value text-error">{stats.failed}</div>
        <div class="stat-desc">
          {failureRate}% fallo
          {#if canRetry}
            <button 
              class="btn btn-xs btn-warning ml-2"
              onclick={retryFailedMessages}
              disabled={retrying}
            >
              Reintentar
            </button>
          {/if}
        </div>
      </div>
    </div>

    <!-- PROGRESS -->
    <div class="card shadow p-4">
      <h2 class="font-semibold mb-2">Progreso</h2>
      <progress 
        class="progress w-full" 
        class:progress-primary={isSending}
        class:progress-warning={campaign.status === "paused" || retrying}
        class:progress-error={campaign.status === "failed"}
        class:progress-success={isCompleted}
        value={progress} 
        max="100" 
      />
      <div class="text-sm mt-1 flex justify-between">
        <span>
          {Math.round(progress)}% completado
          {#if retrying}
            <span class="text-warning font-bold">(Reintentando...)</span>
          {:else if isSending}
            <span class="text-primary font-bold">(Enviando...)</span>
          {:else if campaign.status === "paused"}
            <span class="text-warning font-bold">(Pausada)</span>
          {:else if campaign.status === "failed"}
            <span class="text-error font-bold">(Fallida)</span>
          {/if}
        </span>
        <span>
          Última actualización: {lastUpdate ? dayjs(lastUpdate).format("HH:mm:ss") : "Nunca"}
        </span>
      </div>
    </div>

    <!-- Campaign Info & Logs -->
    <div class="grid lg:grid-cols-2 gap-6">
      <div class="card shadow p-4">
        <h2 class="font-semibold mb-2">Información de Campaña</h2>
        <p><strong>Mensaje:</strong></p>
        <div class="p-3 bg-base-200 rounded whitespace-pre-wrap">{campaign.message.replace('<ORIGINAL_URL>', campaign.original_url)}</div>
        <p class="mt-2 text-sm text-gray-600">
          Creada: {dayjs(campaign.created).format("DD/MM/YYYY HH:mm")}<br />
          Total contactos: {campaign.total_contacts || 0}<br />
          Estado: <span class="font-semibold">{campaign.status}</span><br />
          Tracking: <span class="font-semibold">{campaign.tracking ? "✅ Activo" : "❌ Inactivo"}</span>
        </p>
      </div>
      
      <div class="card shadow p-4">
        <div class="flex justify-between items-center mb-2">
          <h2 class="font-semibold">Registro de Actividad</h2>
          <button class="btn btn-xs" onclick={clearLogs}>Limpiar</button>
        </div>
        <div class="h-48 overflow-auto font-mono text-sm space-y-1">
          {#if logs.length === 0}
            <p class="text-gray-500">Sin actividad...</p>
          {:else}
            {#each logs as log}
              <div class={getLogClass(log.type)}>
                [{log.timestamp}] {log.message}
              </div>
            {/each}
          {/if}
        </div>
      </div>
    </div>

    <!-- Tabla de Mensajes -->
    <div class="card shadow p-4">
      <div class="flex justify-between items-center mb-2">
        <h2 class="font-semibold">
          Mensajes ({messages.length})
          {#if isSending}
            <span class="text-primary text-sm animate-pulse">- Enviando...</span>
          {:else if retrying}
            <span class="text-warning text-sm animate-pulse">- Reintentando...</span>
          {/if}
        </h2>
        {#if stats.failed > 0 && canRetry}
          <button 
            class="btn btn-sm btn-warning gap-2"
            onclick={retryFailedMessages}
            disabled={retrying || sending}
          >
            {#if retrying}
              <span class="loading loading-spinner loading-xs"></span>
            {/if}
            🔄 Reintentar {stats.failed} Fallidos
          </button>
        {/if}
      </div>
      <div class="overflow-auto">
        <table class="table table-sm w-full">
          <thead>
            <tr>
              <th>Contacto</th>
              <th>Teléfono</th>
              <th>Estado</th>
              <th>Enviado</th>
              <th>Entregado</th>
              <th>Fallido</th>
              <th>Reintentos</th>
              <th>Error</th>
            </tr>
          </thead>
          <tbody>
            {#each messages as m}
              <tr 
                class:animate-pulse={(isSending || retrying) && m.status === "pending"}
                class:bg-error-content={m.status === "failed"}
              >
                <td>{m.contact_name}</td>
                <td>{m.contact_phone}</td>
                <td>
                  <span
                    class="badge badge-sm"
                    class:badge-success={m.status === "delivered"}
                    class:badge-info={m.status === "sent"}
                    class:badge-error={m.status === "failed"}
                    class:badge-neutral={m.status === "pending"}
                    class:animate-pulse={m.status === "pending" && (isSending || retrying)}
                  >
                    {m.status}
                  </span>
                </td>
                <td>{m.sent_at ? dayjs(m.sent_at).format("HH:mm:ss") : "-"}</td>
                <td>{m.delivered_at ? dayjs(m.delivered_at).format("HH:mm:ss") : "-"}</td>
                <td>{m.failed_at ? dayjs(m.failed_at).format("HH:mm:ss") : "-"}</td>
                <td class="text-center">
                  <span class:badge={m.retry_count > 0} class:badge-warning={m.retry_count > 0}>
                    {m.retry_count || 0}
                  </span>
                </td>
                <td class="text-error text-xs max-w-xs truncate" title={m.error_message}>
                  {m.error_message || "-"}
                </td>
              </tr>
            {/each}
          </tbody>
        </table>
        {#if messages.length === 0}
          <div class="text-center text-gray-500 mt-4 py-8">
            <p>No hay mensajes aún.</p>
            <p class="text-sm">
              {#if campaign.status === "draft"}
                Haz clic en "Iniciar Campaña" para comenzar el envío.
              {:else if campaign.status === "failed"}
                La campaña falló o fue cancelada.
              {:else}
                Los mensajes aparecerán aquí una vez que se procesen.
              {/if}
            </p>
          </div>
        {/if}
      </div>
    </div>
  </div>
{/if}
