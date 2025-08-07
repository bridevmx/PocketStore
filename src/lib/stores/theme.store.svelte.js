let currentTheme = $state('light');


export const themeStore = {
    get theme() { return currentTheme; },
    setTheme(theme) {
        currentTheme = theme;
    }
};


export function initTheme() {
    if (typeof window !== 'undefined') {
        const savedTheme = localStorage.getItem('app-theme') || 'light';
        themeStore.setTheme(savedTheme);
    }
}