import { form, prerender, query } from '$app/server';
import { search_features, search_input_schema } from '$lib/search';
import { get_feature_summaries } from '$lib/server/caniuse-data';

export const get_search_results = query(search_input_schema, search_features);

export const search = form(search_input_schema, search_features);

export const prerendered_feature_summaries = prerender(get_feature_summaries);
