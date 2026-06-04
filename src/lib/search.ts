import { find_summary_matches, get_summary_report } from '$lib/caniuse';
import * as v from 'valibot';
import { get_feature_summaries } from './server/caniuse-data';

export const search_input_schema = v.object({
	query: v.string(),
	feature_id: v.optional(v.string())
});

export function search_features({
	query,
	feature_id = ''
}: v.InferInput<typeof search_input_schema>) {
	const trimmed_query = query.trim();
	const features = get_feature_summaries();
	const matches = find_summary_matches(trimmed_query, features, 8);
	const active_id = feature_id || matches[0]?.id || '';

	return {
		query: trimmed_query,
		matches,
		report: active_id ? get_summary_report(active_id, features) : undefined
	};
}
