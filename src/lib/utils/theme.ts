export type Theme = 'light' | 'dark' | 'system';

const STORAGE_KEY = 'theme';

/** Reads the saved preference. Defaults to 'system' (follow the OS). */
export function getTheme(): Theme {
	if (typeof localStorage === 'undefined') return 'system';
	const value = localStorage.getItem(STORAGE_KEY);
	return value === 'light' || value === 'dark' ? value : 'system';
}

/** Applies a theme to <html>: sets data-theme for a manual choice, removes it for 'system'
 *  so the prefers-color-scheme media query takes over. Mirrors the inline script in app.html. */
export function applyTheme(theme: Theme) {
	if (typeof document === 'undefined') return;
	const root = document.documentElement;
	if (theme === 'system') {
		delete root.dataset.theme;
	} else {
		root.dataset.theme = theme;
	}
}

/** Persists and applies the chosen theme. */
export function setTheme(theme: Theme) {
	if (typeof localStorage !== 'undefined') {
		if (theme === 'system') localStorage.removeItem(STORAGE_KEY);
		else localStorage.setItem(STORAGE_KEY, theme);
	}
	applyTheme(theme);
}
