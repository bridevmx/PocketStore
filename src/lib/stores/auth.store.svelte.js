// @ts-nocheck
import { pb } from '$lib/pocketbase.js';
import { env } from '$lib/server/env';
import { router } from 'tinro';

let state = $state({
    user: null,
    loading: true,
    navItems: [],
});

// Helper function to extract permission keys from the user object
function getUserPermissionKeys(user) {
    return user?.expand?.role?.expand?.permissions?.map(p => p.key) || [];
}

export const auth = {
    get user() { return state.user; },
    get loading() { return state.loading; },
    get isAuthenticated() { return !!state.user; },
    get navItems() { return state.navItems; },

    /**
     * Checks if the current user has all the required permissions.
     * @param {string[]} requiredPermissions - An array of permission keys to check.
     * @returns {boolean} - True if the user has all required permissions, otherwise false.
     */
    hasPermissions(requiredPermissions = []) {
        if (requiredPermissions.length === 0) {
            return true; // No permissions required, access granted.
        }
        if (!state.user) {
            return false; // Not authenticated, no permissions.
        }
        const userPermissions = getUserPermissionKeys(state.user);
        return requiredPermissions.every(p => userPermissions.includes(p));
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
        const userData = await pb.collection('users').authRefresh({
            expand: 'role.permissions'
        });
        state.user = userData.record;

        // Build a filter for menu_items based on the user's permissions
        const userPermissions = getUserPermissionKeys(state.user);
        let menuFilter = "requiredPermission = ''"; // Everyone gets items with no required permission
        if (userPermissions.length > 0) {
            const permissionFilters = userPermissions.map(p => `requiredPermission = '${p}'`).join(' || ');
            menuFilter += ` || ${permissionFilters}`;
        }
        
        const menuData = await pb.collection('menu_items').getFullList({ filter: menuFilter, sort: 'order' });
        state.navItems = menuData;

    } catch (error) {
        console.error("Auth Init Error:", error);
        state.user = null;
        state.navItems = [];
        pb.authStore.clear();
    } finally {
        state.loading = false;
    }
}

export async function login(identity, password) {
    state.loading = true;
    try {
        await pb.collection('users').authWithPassword(identity, password);
        await initAuth(); // This will fetch user with roles and permissions
    } finally {
        state.loading = false;
    }
}

export async function register(email, username, phone, password, passwordConfirm) {
    state.loading = true;
    try {
        // Find the default 'user' role ID to assign it to the new user.
        const userRole = await pb.collection('roles').getFirstListItem('name = "user"');
        if (!userRole) {
            throw new Error("Default 'user' role not found. Please create it in PocketBase.");
        }

        const data = {
            email,
            username,
            phone,
            password,
            passwordConfirm,
            role: userRole.id, // Assign the dynamically found role ID
            avatar: `https://ui-avatars.com/api/?name=${username}&rounded=true&size=128`
        };

        await pb.collection('users').create(data);
        await pb.collection('users').requestVerification(email);
    } catch (error) {
        console.error("Registration Error:", error);
        // Custom error messages
        if (error.data?.data?.email?.code === 'validation_not_unique') {
            throw new Error("Este correo electrónico ya está en uso.");
        }
        if (error.data?.data?.username?.code === 'validation_not_unique') {
            throw new Error("Este nombre de usuario ya está en uso.");
        }
        if (error.data?.data?.phone?.code === 'validation_not_unique') {
            throw new Error("Este número de teléfono ya está en uso.");
        }
        throw error; // Rethrow the original error for more specific handling if needed
    } finally {
        state.loading = false;
    }
}

export function logout() {
    pb.authStore.clear();
    state.user = null;
    state.navItems = [];
    router.goto('/');
}

export async function updateProfile(userId, data) {
    state.loading = true;
    try {
        await pb.collection(env.PUBLIC_USERS_COLLECTION).update(userId, data);
        await initAuth(); // Refresh auth state after update
    } catch (error) {
        throw error;
    } finally {
        state.loading = false;
    }
}

// Other functions remain largely the same, but we ensure to call initAuth() 
// after any operation that might change the user's state.

export async function requestEmailChange(newEmail) {
    if (!state.user) throw new Error("Usuario no autenticado.");
    try {
        await pb.collection('users').requestEmailChange(newEmail);
    } catch (error) {
        console.error("Error al solicitar cambio de email:", error);
        throw new Error("No se pudo solicitar el cambio de email. Inténtalo de nuevo.");
    }
}

export async function confirmEmailChange(token, password) {
    if (!state.user) throw new Error("Usuario no autenticado.");
    try {
        await pb.collection('users').confirmEmailChange(token, password);
        await initAuth(); // Refresh user data
    } catch (error) {
        console.error("Error al confirmar el cambio de email:", error);
        throw new Error("El token es inválido, ha expirado o la contraseña es incorrecta.");
    }
}

export async function requestPasswordReset(email) {
    try {
        await pb.collection('users').requestPasswordReset(email);
    } catch (error) {
        console.error("Error al solicitar reseteo de contraseña:", error);
        throw new Error("No se pudo iniciar el proceso de reseteo de contraseña.");
    }
}

export async function confirmPasswordReset(token, newPassword, newPasswordConfirm) {
    try {
        await pb.collection('users').confirmPasswordReset(token, newPassword, newPasswordConfirm);
    } catch (error) {
        console.error("Error al confirmar reseteo de contraseña:", error);
        throw new Error("El token es inválido o ha expirado. Por favor, solicita un nuevo reseteo.");
    }
}
