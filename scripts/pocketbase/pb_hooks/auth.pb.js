routerAdd(
    "GET",
    "/api/me",
    (e) => {
        console.log('[Hook Iinicializado]: /api/me');
        const authRecord = e.auth;
        try {
            $apis.enrichRecord(e, authRecord, "role");
        } catch (err) {
            console.error("Failed to expand role for user:", authRecord.id, err);
        }
        
        return e.json(200, authRecord);
    },
    $apis.requireAuth(),
);