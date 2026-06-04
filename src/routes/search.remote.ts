import { query } from '$app/server';
import { search_features, search_input_schema } from '$lib/search';

export const get_search_results = query(search_input_schema, search_features);
