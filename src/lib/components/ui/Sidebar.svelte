<script>
    import { auth } from '$lib/stores/auth.store.svelte.js';
    import { active } from 'tinro';
    import Icon from './Icon.svelte';

    function closeDrawer() {
        const checkbox = document.getElementById('app-drawer');
        if (checkbox) {
            // @ts-ignore
            checkbox.checked = false;
        }
    }
</script>

<ul class="menu p-4 w-60 min-h-full bg-base-200 text-base-content">
    <li class="menu-title">
        <span>Menú</span>
    </li>
    
    <li>
        <a href="#/" use:active on:click={closeDrawer} class="items-center">
            <Icon name="material-symbols:home" width="24" height="24" />
            Inicio
        </a>
    </li>

    {#each auth.navItems as link}
        <li>
            <a href={link.href} use:active on:click={closeDrawer} class="items-center">
                <Icon name={link.icon} width="24" height="24" />
                {link.label}
            </a>
        </li>
    {/each}
</ul>
