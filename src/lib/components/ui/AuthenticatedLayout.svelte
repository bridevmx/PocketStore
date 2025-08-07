<script>
    import Topbar from './Topbar.svelte';
    import Sidebar from './Sidebar.svelte';
    import Icon from './Icon.svelte';

    let { children } = $props();

    let showScrollTopButton = $state(false);
    let mainContentElement;
    
    $effect(() => {
        const mainEl = mainContentElement;
        if (!mainEl) return;

        function handleScroll() {
            showScrollTopButton = mainEl.scrollTop > 400;
        }

        mainEl.addEventListener('scroll', handleScroll);

        return () => {
            mainEl.removeEventListener('scroll', handleScroll);
        };
    });

    function scrollToTop() {
        mainContentElement?.scrollTo({ top: 0, behavior: 'smooth' });
    }
</script>

<div class="drawer lg:drawer-open">
    
    <input id="app-drawer" type="checkbox" class="drawer-toggle" />

    <div class="drawer-content flex flex-col h-screen">
        
        <Topbar />

        <main bind:this={mainContentElement} class="flex-1 overflow-y-auto bg-base-200 p-4 md:p-6 lg:p-8">
            {@render children()}
        </main>
    </div>

    <div class="drawer-side z-50">
        <label for="app-drawer" aria-label="close sidebar" class="drawer-overlay"></label>
        <Sidebar />
    </div>
</div>

{#if showScrollTopButton}
    <button
        onclick={scrollToTop}
        class="btn btn-sm text-base-100 btn-circle btn-primary fixed bottom-5 right-5 z-50 shadow-lg"
        aria-label="Volver arriba"
    >
        <Icon name="material-symbols:arrow-circle-up-outline-rounded"  width="24" height="24" />
    </button>
{/if}