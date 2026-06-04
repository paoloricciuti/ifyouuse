import { getRequestEvent, form, query } from '$app/server';
import { redirect } from '@sveltejs/kit';
import { parse_theme, theme_cookie, type Theme } from '$lib/theme';

type ThemeInput = {
	theme: Theme;
};

export const get_theme = query(() => {
	const event = getRequestEvent();
	const theme = parse_theme(event.cookies.get(theme_cookie));
	return theme;
});

export const set_theme = form<ThemeInput, never>('unchecked', ({ theme }) => {
	const event = getRequestEvent();
	const next_theme = parse_theme(theme);
	const return_to = event.request.headers.get('referer') ?? '/';

	event.cookies.set(theme_cookie, next_theme, {
		path: '/',
		httpOnly: false,
		sameSite: 'lax',
		secure: false,
		maxAge: 60 * 60 * 24 * 365
	});

	redirect(303, return_to);
});
