# 🚀 Svelte 5 & PocketBase Fullstack Starter 🚀

[![Svelte v5](https://img.shields.io/badge/Svelte-v5-FF3E00?style=for-the-badge&logo=svelte)](https://svelte.dev/blog/runes)
[![PocketBase](https://img.shields.io/badge/PocketBase-B5F1CC?style=for-the-badge&logo=pocketbase)](https://pocketbase.io/)
[![DaisyUI](https://img.shields.io/badge/DaisyUI-5A0EF8?style=for-the-badge&logo=daisyui)](https://daisyui.com/)
[![JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E?style=for-the-badge&logo=javascript&logoColor=black)](https://developer.mozilla.org/en-US/docs/Web/JavaScript)

Un template de inicio fullstack robusto y moderno, construido con **Svelte 5 (usando Runes)** para el frontend y **PocketBase** para el backend. Este proyecto está diseñado para ser una base sólida para aplicaciones web interactivas, con un sistema de autenticación, roles y permisos ya implementado.

La filosofía de este template es la simplicidad y la potencia, adhiriéndose a dos principios clave:
1.  ✅ **Sin TypeScript:** Todo el código está en JavaScript puro para una configuración más sencilla y un prototipado más rápido.
2.  ✅ **Estilización con DaisyUI:** No se utilizan etiquetas `<style>`. Toda la UI se construye exclusivamente con clases de [DaisyUI](https://daisyui.com/) y [Tailwind CSS](https://tailwindcss.com/).

## ✨ Características Principales

*   🌀 **Frontend Moderno con Svelte 5:** Utiliza la última versión de Svelte con "Runes" para un manejo de estado explícito y potente.
*   ⚡ **Backend Integrado con PocketBase:** Aprovecha PocketBase como una base de datos, sistema de autenticación y servidor de archivos todo en uno.
*   🔐 **Autenticación y Sesiones:** Flujo de autenticación completo (**registro**, login, logout, actualización de perfil, cambio de email/contraseña) manejado a través del SDK de PocketBase.
*   📝 **Registro de Usuarios:** Formulario de registro con validación de contraseñas, asignación de rol por defecto y envío de correo de verificación.
*   🛡️ **Roles y Permisos (RBAC):** Sistema de control de acceso basado en roles. Las rutas y los elementos del menú de navegación se muestran dinámicamente según los permisos del usuario.
*   🚧 **Rutas Protegidas:** Componente `Guard.svelte` para proteger rutas del frontend basándose en los permisos del usuario autenticado.
*   ⚙️ **Hooks de Backend Personalizados:** Incluye ejemplos en `pb_hooks` para extender la funcionalidad de PocketBase, como el endpoint `/api/me` para obtener datos del usuario enriquecidos.
*   🎨 **Estilización Exclusiva con DaisyUI:** Un conjunto completo de componentes de UI listos para usar y personalizables a través de temas.
*   🎨 **Theming Dinámico:** Los usuarios pueden seleccionar y cambiar el tema de la aplicación, con persistencia en `localStorage`.
*   🧭 **Ruteo del Lado del Cliente:** Implementado con [Tinro](https://github.com/AlexxNB/tinro) en modo hash, ideal para despliegues sencillos sin configuración de servidor.
*   🖼️ **Iconos Dinámicos con Iconify:** Usa miles de iconos de forma sencilla a través del componente `<Icon />`, sin necesidad de importar cada uno.
*   🗂️ **Estructura Organizada:** Código modularizado en stores, componentes y rutas para una fácil mantenibilidad.

## 🚀 Cómo Empezar

Sigue estos pasos para tener el proyecto funcionando en tu máquina local.

### Prerrequisitos

*   Node.js (v18 o superior)
*   Un gestor de paquetes como `npm`, `pnpm` o `yarn`.
*   El ejecutable de [PocketBase](https://pocketbase.io/docs/). Descárgalo desde el sitio oficial para tu sistema operativo.

### 1️⃣ Configuración del Backend (PocketBase)

1.  **Descarga y Descomprime PocketBase:**
    *   Copia el ejecutable de PocketBase en el directorio `scripts/pocketbase/` de este proyecto.

2.  **Inicia el Servidor de PocketBase:**
    *   Abre una terminal en `scripts/pocketbase/` y ejecuta el servidor:
        ```bash
        ./pocketbase serve
        ```
    *   La primera vez que lo ejecutes, se creará un directorio `pb_data`.

3.  **Configura el Admin y las Colecciones:**
    *   Visita `http://127.0.0.1:8090/_/` en tu navegador.
    *   Crea tu primera cuenta de administrador.
    *   Ve a `Settings > Import collections`.
    *   Sube el archivo `scripts/pocketbase/example.collections.json` que se encuentra en este repositorio. Esto creará las colecciones `users`, `roles` y `menu_items` con sus campos y reglas preconfiguradas.

4.  **Crea Datos de Prueba (Recomendado):**
    *   **Rol:** Ve a la colección `roles`, crea un nuevo registro. Dale un `name` (ej. "Admin") y en `permissions`, pega el siguiente JSON:
        ```json
        {
          "permissions": [
            "dashboard_access",
            "profile_view_own",
            "profile_edit_own"
          ]
        }
        ```
    *   **Usuario:** Ve a la colección `users`, crea un nuevo usuario. Asígnale el rol que acabas de crear.
    *   **Menú:** Ve a la colección `menu_items` y crea un ítem de menú. Por ejemplo:
        *   `label`: "Dashboard"
        *   `href`: `#/dashboard`
        *   `icon`: `material-symbols:dashboard`
        *   `requiredPermission`: `dashboard_access`

5.  **Mueve los Hooks:**
    *   Copia el contenido de `scripts/pocketbase/pb_hooks` al directorio `pb_hooks` que PocketBase creó dentro de `scripts/pocketbase/`.
    *   Reinicia el servidor de PocketBase para que los hooks se carguen.

¡Tu backend ya está listo y funcionando en `http://127.0.0.1:8090`! 🖥️

### 2️⃣ Configuración del Frontend (Svelte)

1.  **Clona el Repositorio:**
    ```bash
    git clone https://github.com/bridevmx/PocketRune.git
    cd tu-repositorio
    ```

2.  **Instala las Dependencias:**
    ```bash
    npm install
    # o pnpm install / yarn install
    ```

3.  **Configura las Variables de Entorno:**
    *   El archivo `src/lib/server/env.js` contiene la URL de PocketBase. Por defecto, apunta a `http://127.0.0.1:8090`. Si tu backend está en otro lugar, modifica este archivo.

4.  **Inicia el Servidor de Desarrollo:**
    ```bash
    npm run dev
    ```
    *   La aplicación estará disponible en `http://localhost:5173`. 💻

## 🏗️ Estructura del Proyecto

```
/
├── scripts/pocketbase/       # 🗄️ Contiene el ejecutable y la configuración de PocketBase
│   ├── pb_hooks/             # ⚙️ Lógica de backend personalizada
│   └── example.collections.json # 📄 Esquema de la base de datos para importar
│
├── src/
│   ├── lib/
│   │   ├── components/       # 🧩 Componentes Svelte reutilizables
│   │   │   ├── ui/           # 🎨 Componentes genéricos de UI (Layouts, Modales, etc.)
│   │   │   └── Guard.svelte  # 🛡️ Componente para proteger rutas
│   │   ├── routes/           # 📄 Componentes de página para cada ruta de la app
│   │   ├── server/           # 🌐 Módulos relacionados con el "servidor" (config, etc.)
│   │   ├── stores/           # 🏪 Stores de Svelte para el manejo de estado global
│   │   └── pocketbase.js     # 🔗 Inicialización del SDK de PocketBase para el cliente
│   │
│   ├── App.svelte            # 🏠 Componente raíz con la definición de rutas (Tinro)
│   └── main.js               # 🚀 Punto de entrada de la aplicación
│
├── svelte.config.js          # 🔧 Configuración de Svelte
└── vite.config.js            # 📦 Configuración de Vite
```

## 🧭 Cómo Agregar Rutas y Parámetros

El ruteo se gestiona en `src/App.svelte` usando la librería **Tinro**. Aquí te mostramos cómo puedes agregar nuevas rutas.

### Agregar una Ruta Estática (ej. `/auth/register`)

1.  **Crea el Componente de la Página:**
    Crea un nuevo archivo en `src/lib/routes/`, por ejemplo: `src/lib/routes/auth/Register.svelte`.

    ```svelte
    <!-- src/lib/routes/auth/Register.svelte -->
    <script>
        // Lógica de tu formulario de registro
    </script>

    <svelte:head>
        <title>Crear una Cuenta</title>
    </svelte:head>

    <div class="p-8">
        <h1 class="text-4xl font-bold">Registro</h1>
        <!-- Contenido del formulario -->
    </div>
    ```

2.  **Registra la Ruta en `App.svelte`:**
    Abre `src/App.svelte`, importa tu nuevo componente y agrega una nueva etiqueta `<Route>`.

    ```svelte
    <!-- src/App.svelte -->
    <script>
        // ... otros imports
        import Register from "$lib/routes/auth/Register.svelte"; // 👈 Importa tu nuevo componente
    </script>

    <LayoutDecider>
        {#snippet children()}
            <!-- ... otras rutas -->
            <Route path="/auth/register">  <!-- 👈 Agrega la nueva ruta -->
                <Register />
            </Route>
        {/snippet}
    </LayoutDecider>
    ```

### Agregar una Ruta Dinámica (ej. `/products/:id`)

1.  **Crea el Componente con Parámetros:**
    Crea un componente que acepte los parámetros de la URL. Por ejemplo: `src/lib/routes/products/ProductDetail.svelte`.

    ```svelte
    <!-- src/lib/routes/products/ProductDetail.svelte -->
    <script>
        let { params } = $props();
        const productId = params.id;
        // Aquí podrías usar `productId` para buscar datos del producto en PocketBase
    </script>

    <svelte:head>
        <title>Producto {productId}</title>
    </svelte:head>

    <div class="p-8">
        <h1 class="text-3xl font-bold">Detalles del Producto</h1>
        <p class="mt-2">Mostrando información para el producto con ID: <span class="badge badge-primary">{productId}</span></p>
    </div>
    ```

2.  **Registra la Ruta Dinámica en `App.svelte`:**
    Usa la sintaxis `:parametro` en el `path` y `let:meta` para pasar los parámetros.

    ```svelte
    <!-- src/App.svelte -->
    <script>
        // ... otros imports
    </script>

    <LayoutDecider>
        {#snippet children()}
            <!-- ... otras rutas -->
            <Route path="/products/:id" let:meta> <!-- 👈 Ruta dinámica -->
                 <Guard
                    permissions={["product_view"]}
                    component={() => import("$lib/routes/products/ProductDetail.svelte")}
                    params={{ ...meta.params }}
                />
            </Route>
        {/snippet}
    </LayoutDecider>
    ```
    *Ahora puedes navegar a `/#/products/123` y el componente `ProductDetail` recibirá `{ id: '123' }` en sus `params`.*

## 🔑 Conceptos Clave

### 🔐 Autenticación y Autorización (RBAC)

*   **`auth.store.svelte.js`**: Es el corazón del manejo de sesión en el frontend. Se inicializa al cargar la app, obtiene los datos del usuario a través del endpoint `/api/me` (definido en `pb_hooks`) y almacena el estado del usuario. Además del login, maneja el **registro de nuevos usuarios**, asignándoles un rol por defecto y enviando un correo de verificación.
*   **Permisos**: Los permisos de un usuario se obtienen a través de su rol (`user.expand.role.permissions.permissions`).
*   **`Guard.svelte`**: Este componente envuelve las rutas protegidas. Recibe un array de `permissions` y solo renderiza el componente hijo si el usuario actual tiene todos los permisos requeridos.
*   **Menú Dinámico**: El `Sidebar.svelte` obtiene los ítems de navegación desde `auth.navItems`, que se pueblan en `initAuth()` filtrando la colección `menu_items` de PocketBase según los permisos del usuario.

### 🎨 Estilización y Theming

*   **Cero `<style>` tags:** La estilización se basa 100% en clases de utilidad.
*   **`theme.store.svelte.js`**: Gestiona el tema actual de DaisyUI.
*   **`ThemeSelectionModal.svelte`**: Permite al usuario cambiar el tema visual de la aplicación, que se guarda en `localStorage` y se aplica al `<html>` tag.

### 🧭 Ruteo

*   **Tinro**: Se utiliza para el ruteo del lado del cliente en modo `hash`. Las rutas se definen de forma declarativa en `App.svelte`.
*   **Navegación**: Para navegar programáticamente, se utiliza `router.goto('/ruta')` de Tinro.

## 📜 Scripts Disponibles

*   `npm run dev`: 🛠️ Inicia el servidor de desarrollo de Vite.
*   `npm run build`: 📦 Compila la aplicación para producción.
*   `npm run preview`: 👁️ Previsualiza la build de producción localmente.