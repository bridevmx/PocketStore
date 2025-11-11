<script>
    // @ts-nocheck
    import { Route, router } from "tinro";
    import { Toaster } from "svelte-sonner";
    import { env } from "$lib/server/env.js";
    import LayoutDecider from "$lib/components/ui/LayoutDecider.svelte";
    import Guard from "$lib/components/Guard.svelte";
    import IndexRoot from "$lib/routes/root/IndexRoot.svelte";
    import Login from "$lib/routes/auth/Login.svelte";
    import Register from "$lib/routes/auth/Register.svelte";
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
        
        <Route path="/auth/register">
            <Register />
        </Route>

        <Route path="/dashboard" let:meta>
            <Guard
                permissions={["dashboard:view"]}
                component={() => import("$lib/routes/dashboard/DasboardIndex.svelte")}
                params={{ authCollectionName: userCollectionName, ...meta.params }}
            />
        </Route>

        <Route path="/campaigns" let:meta>
            <Guard
                permissions={["campaigns:list"]}
                component={() => import("$lib/routes/campaigns/Campaigns.svelte")}
                params={{ authCollectionName: userCollectionName, ...meta.params }}
            />
        </Route>

        <Route path="/campaigns/new" let:meta>
            <Guard
                permissions={["campaigns:create"]}
                component={() => import("$lib/routes/campaigns/NewCampaign.svelte")}
                params={{ authCollectionName: userCollectionName, ...meta.params }}
            />
        </Route>

        <Route path="/campaigns/send/:id" let:meta>
            <Guard
                permissions={["campaigns:create"]}
                component={() => import("$lib/routes/campaigns/SendCampaign.svelte")}
                params={{ authCollectionName: userCollectionName, ...meta.params }}
            />
        </Route>

        <Route path="/campaigns/analytics/:id" let:meta>
            <Guard
                permissions={["campaigns:create"]}
                component={() => import("$lib/routes/campaigns/Analytics.svelte")}
                params={{ authCollectionName: userCollectionName, ...meta.params }}
            />
        </Route>

        <Route path="/contacts" let:meta>
            <Guard
                permissions={["contacts:list", "contacts:create", "contacts:update", "contacts:delete"]}
                component={() => import("$lib/routes/contacts/IndexContacts.svelte")}
                params={{ authCollectionName: userCollectionName, ...meta.params }}
            />
        </Route>

        <Route path="/contacts/import" let:meta>
            <Guard
                permissions={["contacts:create"]}
                component={() => import("$lib/routes/contacts/Import.svelte")}
                params={{ authCollectionName: userCollectionName, ...meta.params }}
            />
        </Route>

        <Route path="/urls" let:meta>
            <Guard
                permissions={["url_shorten:view"]}
                component={() => import("$lib/routes/urls/NewUrlShorten.svelte")}
                params={{ authCollectionName: userCollectionName, ...meta.params }}
            />
        </Route>

        <Route path="/urls/:id/stats" let:meta>
            <Guard
                permissions={["url_shorten:view"]}
                component={() => import("$lib/routes/urls/StatsUrls.svelte")}
                params={{ authCollectionName: userCollectionName, ...meta.params }}
            />
        </Route>

        <Route path="/profile" let:meta>
            <Guard
                permissions={["profile:view"]}
                component={() => import("$lib/routes/profile/ProfileIndex.svelte")}
                params={{ ...meta.params }}
            />
        </Route>

        <Route path="/profile/edit" let:meta>
            <Guard
                permissions={["profile:update"]}
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