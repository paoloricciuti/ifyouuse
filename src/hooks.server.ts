import { parse_theme, theme_cookie } from '$lib/theme';
import type { Handle } from '@sveltejs/kit';

export const handle: Handle = async ({ event, resolve }) => {
	const theme = parse_theme(event.cookies.get(theme_cookie));
	return resolve(event, {
		transformPageChunk: ({ html }) =>
			html.replace('<html lang="en">', `<html lang="en" data-theme="${theme}">`)
	});
};
