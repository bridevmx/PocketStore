# 🚀 PocketStore: Svelte 5 & PocketBase Fullstack E-Commerce Starter 🚀

[![Svelte v5](https://img.shields.io/badge/Svelte-v5-FF3E00?style=for-the-badge&logo=svelte)](https://svelte.dev/blog/runes)
[![PocketBase](https://img.shields.io/badge/PocketBase-B5F1CC?style=for-the-badge&logo=pocketbase)](https://pocketbase.io/)
[![DaisyUI](https://img.shields.io/badge/DaisyUI-5A0EF8?style=for-the-badge&logo=daisyui)](https://daisyui.com/)
[![JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E?style=for-the-badge&logo=javascript&logoColor=black)](https://developer.mozilla.org/en-US/docs/Web/JavaScript)

Un template de inicio fullstack robusto y moderno para **E-Commerce**, construido con **Svelte 5 (usando Runes)** para el frontend y **PocketBase** para el backend. Este proyecto está diseñado para ser una base sólida para aplicaciones de comercio electrónico, con un sistema de autenticación, roles, permisos, tiendas, productos y variantes ya implementado.

La filosofía de este template es la simplicidad y la potencia, adhiriéndose a dos principios clave:
1.  ✅ **Sin TypeScript:** Todo el código está en JavaScript puro para una configuración más sencilla y un prototipado más rápido.
2.  ✅ **Estilización con DaisyUI:** No se utilizan etiquetas `<style>`. Toda la UI se construye exclusivamente con clases de [DaisyUI](https://daisyui.com/) y [Tailwind CSS](https://tailwindcss.com/).

## ✨ Características Principales

*   🌀 **Frontend Moderno con Svelte 5:** Utiliza la última versión de Svelte con "Runes" para un manejo de estado explícito y potente.
*   ⚡ **Backend Pre-configurado con PocketBase:** Aprovecha un backend de PocketBase hosteado en `pockethost.io`, que sirve como base de datos, sistema de autenticación y servidor de archivos.
*   🔐 **Autenticación y Sesiones:** Flujo de autenticación completo (**registro**, login, logout, actualización de perfil, cambio de email/contraseña) manejado a través del SDK de PocketBase.
*   📝 **Registro de Usuarios con Rol Dinámico:** Formulario de registro con validación, asignación automática del rol "user" y envío de correo de verificación.
*   🛡️ **Roles y Permisos (RBAC):** Sistema de control de acceso basado en roles. Las rutas y los elementos del menú de navegación se muestran dinámicamente según los permisos del usuario.
*   🚧 **Rutas Protegidas:** Componente `Guard.svelte` para proteger rutas del frontend basándose en los permisos del usuario autenticado.
*   🛍️ **Estructura E-Commerce:** Incluye colecciones de base de datos para `users`, `roles`, `permissions` y `menu_items`.
*   🎨 **Estilización Exclusiva con DaisyUI:** Un conjunto completo de componentes de UI listos para usar y personalizables a través de temas.
*   🎨 **Theming Dinámico:** Los usuarios pueden seleccionar y cambiar el tema de la aplicación, con persistencia en `localStorage`.
*   🧭 **Ruteo del Lado del Cliente:** Implementado con [Tinro](https://github.com/AlexxNB/tinro) en modo hash.
*   🖼️ **Iconos Dinámicos con Iconify:** Usa miles de iconos de forma sencilla a través del componente `<Icon />`.
*   🗂️ **Estructura Organizada:** Código modularizado en stores, componentes y rutas para una fácil mantenibilidad.

## 🚀 Cómo Empezar

Con el backend ya desplegado y configurado, empezar a trabajar en el frontend es muy sencillo.

### Prerrequisitos

*   Node.js (v18 o superior)
*   Un gestor de paquetes como `npm`, `pnpm` o `yarn`.

### Configuración del Frontend (Svelte)

1.  **Clona el Repositorio:**
    ```bash
    git clone https://github.com/bridevmx/PocketStore.git
    cd PocketStore
    ```

2.  **Instala las Dependencias:**
    ```bash
    npm install
    # o pnpm install / yarn install
    ```

3.  **Verifica las Variables de Entorno:**
    *   El archivo `src/lib/server/env.js` contiene la URL del backend de PocketBase. Ya está configurado para apuntar a la instancia de producción:
        ```javascript
        export const env = {
            PUBLIC_POCKETBASE_HOST: 'https://pocketstore.pockethost.io',
            // ... otras variables
        }
        ```

4.  **Inicia el Servidor de Desarrollo:**
    ```bash
    npm run dev
    ```
    *   La aplicación estará disponible en `http://localhost:5173`. 💻

## 🏗️ Estructura del Proyecto

```
/
├── scripts/pocketbase/       # 🗄️ Contiene la configuración de PocketBase para referencia
│   ├── pb_hooks/             # ⚙️ Lógica de backend (actualmente vacía, el código está en producción)
│   └── example.collections.json # 📄 Esquema de la base de datos como referencia
│
├── src/
│   ├── lib/
│   │   ├── components/       # 🧩 Componentes Svelte reutilizables
│   │   │   ├── ui/           # 🎨 Componentes genéricos de UI (Layouts, Modales, etc.)
│   │   │   └── Guard.svelte  # 🛡️ Componente para proteger rutas
│   │   ├── routes/           # 📄 Componentes de página para cada ruta de la app
│   │   ├── server/           # 🌐 Módulos relacionados con la configuración del entorno
│   │   ├── stores/           # 🏪 Stores de Svelte para el manejo de estado global
│   │   └── pocketbase.js     # 🔗 Inicialización del SDK de PocketBase para el cliente
│   │
│   ├── App.svelte            # 🏠 Componente raíz con la definición de rutas (Tinro)
│   └── main.js               # 🚀 Punto de entrada de la aplicación
│
├── svelte.config.js          # 🔧 Configuración de Svelte
└── vite.config.js            # 📦 Configuración de Vite
```

## 🔑 Conceptos Clave

### 🔐 Autenticación y Autorización (RBAC)

*   **`auth.store.svelte.js`**: Es el corazón del manejo de sesión. Al iniciar la aplicación, utiliza la función `authRefresh` del SDK de PocketBase para verificar si hay una sesión válida y obtener los datos del usuario, incluyendo sus roles y permisos expandidos (`expand: 'role.permissions'`).
*   **Permisos**: Los permisos de un usuario (`user.expand.role.expand.permissions`) son la fuente de verdad para controlar el acceso a diferentes partes de la aplicación.
*   **`Guard.svelte`**: Este componente protege rutas. Recibe un array de `permissions` y solo renderiza el componente hijo si el usuario actual (`auth.user`) tiene todos los permisos requeridos, usando la función `auth.hasPermissions()`.
*   **Menú Dinámico**: El `Sidebar.svelte` obtiene los ítems de navegación desde `auth.navItems`. Estos se pueblan en la función `initAuth()` al filtrar la colección `menu_items` de PocketBase según los permisos que tiene el usuario, asegurando que solo vea los enlaces a los que puede acceder.

### 🎨 Estilización y Theming

*   **Cero `<style>` tags:** La estilización se basa 100% en clases de utilidad de TailwindCSS y componentes de DaisyUI.
*   **`theme.store.svelte.js`**: Gestiona el tema actual de DaisyUI.
*   **`ThemeSelectionModal.svelte`**: Permite al usuario cambiar el tema visual de la aplicación, que se guarda en `localStorage` y se aplica al `<html>` tag.

### 🧭 Ruteo

*   **Tinro**: Se utiliza para el ruteo del lado del cliente en modo `hash`. Las rutas se definen de forma declarativa en `App.svelte`.
*   **Navegación**: Para navegar programáticamente, se utiliza `router.goto('/ruta')` de Tinro.

## 📜 Scripts Disponibles

*   `npm run dev`: 🛠️ Inicia el servidor de desarrollo de Vite.
*   `npm run build`: 📦 Compila la aplicación para producción.
*   `npm run preview`: 👁️ Previsualiza la build de producción localmente.
