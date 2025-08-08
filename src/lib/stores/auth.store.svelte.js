// @ts-nocheck
import { pb } from '$lib/pocketbase.js';
import { router } from 'tinro';

let state = $state({
    user: null,
    loading: true,
    navItems: [],
});

export const auth = {
    get user() { return state.user; },
    get loading() { return state.loading; },
    get isAuthenticated() { return !!state.user; },
    get navItems() { return state.navItems; }, 
    
    hasPermissions(requiredPermissions = []) {
        const userPermissions = state.user?.expand?.role?.permissions?.permissions;
        if (!userPermissions || !Array.isArray(userPermissions)) {
            return false;
        }
        return requiredPermissions.every((p) => userPermissions.includes(p));
    },
};

export async function initAuth() {
    if (!pb.authStore.isValid) {
        state.user = null;
        state.navItems = []; 
        state.loading = false;
        return;
    }
    state.loading = true;
    try {
        const userData = await pb.send("/api/me", { method: "GET" });
        state.user = userData;

        let filterRoles = [];
        filterRoles =  userData.expand?.role?.permissions?.permissions;
        if (!Array.isArray(filterRoles)) filterRoles = [];
        let filterRolesString = '';
        filterRoles.forEach((p,i) => {
            
            if (p === '' || i === filterRoles.length - 1) {
                filterRolesString += `requiredPermission = '${p.replace(/'/g, "''")}' `;
                return;
            }
            filterRolesString += `requiredPermission = '${p.replace(/'/g, "''")}' || `;
        });
        
        const menuData = await pb.collection('menu_items').getFullList({filter: filterRolesString})
        state.navItems = menuData;

    } catch (error) {
        state.user = null;
        state.navItems = []; 
        pb.authStore.clear();
    } finally {
        state.loading = false;
    }
}

export async function login(identity, password, collectionName) {
    state.loading = true;
    try {
        await pb.collection(collectionName).authWithPassword(identity, password);
        await initAuth();
    } finally {
        state.loading = false;
    }
}

// --- NUEVA FUNCIÓN DE REGISTRO ---
export async function register(email, username, phone, password, passwordConfirm) {
    // NOTA: Reemplaza 'ID_DEL_ROL_POR_DEFECTO' con el ID real del rol que deseas
    // asignar a los nuevos usuarios. Puedes encontrar este ID en tu panel de PocketBase.
    const defaultUserRoleId = 'ux4y8824xzrqwgt'; // Ejemplo: ID del rol 'roles'

    const data = {
        email,
        username,
        phone,
        password,
        passwordConfirm,
        role: defaultUserRoleId,
        avatar: `https://ui-avatars.com/api/?name=${username}&rounded=true&size=128`
    };

    try {
        await pb.collection('users').create(data);
        // Opcional: Solicitar verificación de correo después del registro
        await pb.collection('users').requestVerification(email);
    } catch (error) {
        console.error("Error en el registro:", error);
        // Personaliza los mensajes de error basados en la respuesta de PocketBase
        if (error.data?.data?.email?.code === 'validation_not_unique') {
            throw new Error("Este correo electrónico ya está en uso.");
        }
        if (error.data?.data?.username?.code === 'validation_not_unique') {
            throw new Error("Este nombre de usuario ya está en uso.");
        }
        if (error.data?.data?.phone?.code === 'validation_not_unique') {
            throw new Error("Este número de teléfono ya está en uso.");
        }
        throw new Error("No se pudo completar el registro. Inténtalo de nuevo.");
    }
}
// --- FIN DE LA NUEVA FUNCIÓN ---

export function logout() {
    pb.authStore.clear();
    state.user = null;
    state.navItems = []; 
    router.goto('/');
}

export async function updateProfile(userId, collectionName, data) {
    state.loading = true;
    try {
        await pb.collection(collectionName).update(userId, data);
        await initAuth();
    } catch (error) {
        throw error;
    } finally {
        state.loading = false;
    }
}
export async function requestEmailChange(newEmail) { 
    if (!state.user) throw new Error("Usuario no autenticado.");
    try {
        await pb.collection(state.user.collectionName).requestEmailChange(newEmail);
    } catch (error) {
        console.error("Error al solicitar cambio de email:", error);
        throw new Error("No se pudo solicitar el cambio de email. Inténtalo de nuevo.");
    }
}
export async function confirmEmailChange(token, password) {
    if (!state.user) throw new Error("Usuario no autenticado.");
    try {
        await pb.collection(state.user.collectionName).confirmEmailChange(token, password);
        await initAuth();
    } catch (error) {
        console.error("Error al confirmar el cambio de email:", error);
        throw new Error("El token es inválido, ha expirado o la contraseña es incorrecta.");
    }
}
export async function requestPasswordReset(email) {
    if (!state.user) throw new Error("Usuario no autenticado.");
    try {
        await pb.collection(state.user.collectionName).requestPasswordReset(email);
    } catch (error) {
        console.error("Error al solicitar reseteo de contraseña:", error);
        throw new Error("No se pudo iniciar el proceso de reseteo de contraseña.");
    }
}
export async function confirmPasswordReset(token, newPassword, newPasswordConfirm) {
    try {
        const userCollectionName = import.meta.env.PUBLIC_USERS_COLLECTION || 'users';
        await pb.collection(userCollectionName).confirmPasswordReset(token, newPassword, newPasswordConfirm);
    } catch (error) {
        console.error("Error al confirmar reseteo de contraseña:", error);
        throw new Error("El token es inválido o ha expirado. Por favor, solicita un nuevo reseteo.");
    }
}