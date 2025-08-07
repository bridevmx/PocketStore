<script>
    // @ts-nocheck
    import { Route, router } from "tinro";
    import { Toaster } from "svelte-sonner";
    import { env } from "$lib/server/env.js";
    import LayoutDecider from "$lib/components/ui/LayoutDecider.svelte";
    import Guard from "$lib/components/Guard.svelte";
    import IndexRoot from "$lib/routes/root/IndexRoot.svelte";
    import Login from "$lib/routes/auth/Login.svelte";
    import { themeStore } from '$lib/stores/theme.store.svelte.js';
    import ConfirmEmailChange from "$lib/routes/auth/ConfirmEmailChange.svelte";
    import ConfirmPasswordReset from "$lib/routes/auth/ConfirmPasswordReset.svelte";
    import { SettingsPage } from "$lib/stores/settingsPage.store.svelte";
    router.mode.hash();
    router.subscribe((_) => window.scrollTo(0, 0));
    const userCollectionName = env.PUBLIC_USERS_COLLECTION;

    
    $effect(() => {
        if (typeof window !== 'undefined') {
            const currentTheme = themeStore.theme;
            document.documentElement.setAttribute('data-theme', currentTheme);
            localStorage.setItem('app-theme', currentTheme);
        }
    });
</script>
<svelte:head><title>{SettingsPage.header.title}</title></svelte:head>

<Toaster position="top-right" />

<LayoutDecider>
    {#snippet children()}
        <Route path="/">
            <IndexRoot />
        </Route>

        <Route path="/auth/login">
            <Login params={{ authCollectionName: userCollectionName }} />
        </Route>

        <Route path="/dashboard" let:meta>
            <Guard
                permissions={["dashboard_access"]}
                component={() => import("$lib/routes/dashboard/DasboardIndex.svelte")}
                params={{ authCollectionName: userCollectionName, ...meta.params }}
            />
        </Route>

        <Route path="/profile" let:meta>
            <Guard
                permissions={["profile_view_own"]}
                component={() => import("$lib/routes/profile/ProfileIndex.svelte")}
                params={{ ...meta.params }}
            />
        </Route>

        <Route path="/profile/edit" let:meta>
            <Guard
                permissions={["profile_edit_own"]}
                component={() => import("$lib/routes/profile/ProfileEdit.svelte")}
                params={{ ...meta.params }}
            />
        </Route>

        <Route path="/auth/confirm-email-change">
            <ConfirmEmailChange />
        </Route>

        <Route path="/auth/confirm-password-reset">
            <ConfirmPasswordReset />
        </Route>
    {/snippet}
</LayoutDecider>