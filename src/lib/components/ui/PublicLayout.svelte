<script>
    let { children } = $props();
</script>

<div class="flex flex-col min-h-screen bg-base-200">
   
    <div class="navbar bg-base-100 shadow-sm">
        <div class="navbar-start">
            <a href="#/" class="btn btn-ghost text-xl normal-case">MiApp</a>
        </div>
        <div class="navbar-end">
            <a href="#/auth/login" class="btn btn-ghost">Iniciar Sesión</a>
            <a href="#/auth/register" class="btn btn-primary ml-2">Registrarse</a>
        </div>
    </div>

    <main class="flex-1">
        {@render children()}
    </main>

    <footer class="footer footer-center p-4 bg-base-300 text-base-content">
        <aside>
            <p>Copyright © {new Date().getFullYear()} - Todos los derechos reservados por MiApp Inc.</p>
        </aside>
    </footer>
</div>