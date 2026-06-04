export const themes = ['light', 'dark'] as const;

export type Theme = (typeof themes)[number];

export const default_theme: Theme = 'light';
export const theme_cookie = 'theme';

export function parse_theme(value: string | undefined | null): Theme {
	return value === 'dark' || value === 'light' ? value : default_theme;
}

export function opposite_theme(theme: Theme): Theme {
	return theme === 'dark' ? 'light' : 'dark';
}
