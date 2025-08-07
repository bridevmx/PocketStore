<script>
    import { auth, logout } from "$lib/stores/auth.store.svelte.js";
    import { SettingsPage } from "$lib/stores/settingsPage.store.svelte.js";
    import Icon from "./Icon.svelte";
    let username = $derived(auth.user?.username || "Usuario");
    let avatar = $derived(
        auth.user?.avatar ||
            `https://avatar.iran.liara.run/username?username=${username[0].toUpperCase()}`,
    );
</script>


<div class="navbar sticky top-0 z-30 bg-primary backdrop-blur shadow-sm">
    <div class="navbar-start text-primary-content">
        
        <label
            for="app-drawer"
            aria-label="open sidebar"
            class="btn btn-square btn-ghost hover:bg-none hover:text-primary lg:hidden text-primary-content"
        >
            <Icon name="material-symbols:menu" width="24" height="24" />
        </label>
        
        <a href={SettingsPage.header.urlPath} class=" ml-2 text-xl normal-case text-primary-content">{SettingsPage.header.title}</a>
    </div>

    <div class="navbar-center"></div>

    <div class="navbar-end">
        
        <div class="dropdown dropdown-end">
            <div
                tabindex="0"
                role="button"
                class="btn btn-ghost btn-circle avatar"
            >
                {#key avatar}
                    <div
                        class="w-10 rounded-full ring ring-primary ring-offset-base-100 ring-offset-2"
                    >
                        <img src={avatar} alt="Avatar" />
                    </div>
                {/key}
            </div>
            <!-- svelte-ignore a11y_no_noninteractive_tabindex -->
            <ul
                tabindex="0"
                class="menu menu-sm dropdown-content mt-3 z-[1] p-2 shadow bg-base-100 rounded-box w-52"
            >
                <li>
                    <a href="#/profile">
                        Perfil
                        <span class="badge">{username}</span>
                    </a>
                </li>
                <li><button onclick={logout}>Cerrar Sesión</button></li>
            </ul>
        </div>
    </div>
</div>
