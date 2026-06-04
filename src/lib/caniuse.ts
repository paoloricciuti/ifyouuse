export type BrowserUsage = Record<string, Record<string, number>>;
export type BrowserStats = Record<string, Record<string, string>>;

export type CaniuseFeature = {
	id: string;
	title: string;
	stats: BrowserStats;
	status?: string;
	shown?: boolean;
};

export type SupportSummary = {
	full: number;
	partial: number;
	total: number;
};

export type FeatureSummary = {
	id: string;
	title: string;
	caniuse_url: string;
	support: SupportSummary;
};

export type Recommendation = FeatureSummary & {
	comparison: 'lower' | 'similar';
};

export type FeatureReport = FeatureSummary & {
	recommendations: Recommendation[];
};

export type RecommendationOptions = {
	limit?: number;
	similar_threshold?: number;
};

const default_options = {
	limit: 12,
	similar_threshold: 2
};

export function calculate_support(stats: BrowserStats, usage: BrowserUsage): SupportSummary {
	let full = 0;
	let partial = 0;

	for (const [browser, versions] of Object.entries(stats)) {
		for (const [version, support] of Object.entries(versions)) {
			const version_usage = usage[browser]?.[version] ?? 0;

			if (has_support_flag(support, 'y')) {
				full += version_usage;
			} else if (has_support_flag(support, 'a')) {
				partial += version_usage;
			}
		}
	}

	return {
		full: round_percentage(full),
		partial: round_percentage(partial),
		total: round_percentage(full + partial)
	};
}

export function find_feature_matches(
	query: string,
	features: CaniuseFeature[],
	usage: BrowserUsage,
	limit = 8
) {
	const normalized_query = normalize_search(query);

	if (!normalized_query) return [];

	return features
		.map((feature) => ({ feature, rank: match_rank(feature, normalized_query) }))
		.filter(({ rank }) => rank > 0)
		.sort((a, b) => b.rank - a.rank || a.feature.title.localeCompare(b.feature.title))
		.slice(0, limit)
		.map(({ feature }) => summarize_feature(feature, usage));
}

export function find_summary_matches(query: string, features: FeatureSummary[], limit = 8) {
	const normalized_query = normalize_search(query);

	if (!normalized_query) return [];

	return features
		.map((feature) => ({ feature, rank: match_summary_rank(feature, normalized_query) }))
		.filter(({ rank }) => rank > 0)
		.sort((a, b) => b.rank - a.rank || a.feature.title.localeCompare(b.feature.title))
		.slice(0, limit)
		.map(({ feature }) => feature);
}

export function get_feature_report(
	feature_id: string,
	features: CaniuseFeature[],
	usage: BrowserUsage,
	options: RecommendationOptions = {}
): FeatureReport | undefined {
	const feature = features.find(({ id }) => id === feature_id);

	if (!feature) return undefined;

	return {
		...summarize_feature(feature, usage),
		recommendations: get_recommendations(feature, features, usage, options)
	};
}

export function get_recommendations(
	target_feature: CaniuseFeature,
	features: CaniuseFeature[],
	usage: BrowserUsage,
	options: RecommendationOptions = {}
) {
	const target_summary = summarize_feature(target_feature, usage);
	const summaries = features.map((feature) => summarize_feature(feature, usage));

	return get_summary_recommendations(target_summary, summaries, options);
}

export function get_summary_report(
	feature_id: string,
	features: FeatureSummary[],
	options: RecommendationOptions = {}
): FeatureReport | undefined {
	const feature = features.find(({ id }) => id === feature_id);

	if (!feature) return undefined;

	return {
		...feature,
		recommendations: get_summary_recommendations(feature, features, options)
	};
}

export function format_percentage(value: number) {
	return `${value.toFixed(1).replace(/\.0$/, '')}%`;
}

function get_summary_recommendations(
	target_feature: FeatureSummary,
	features: FeatureSummary[],
	options: RecommendationOptions = {}
) {
	const { limit, similar_threshold } = { ...default_options, ...options };
	const target_support = target_feature.support.total;

	return features
		.filter(({ id }) => id !== target_feature.id)
		.filter(({ support }) => support.total <= target_support + similar_threshold)
		.map(
			(feature) =>
				({
					...feature,
					comparison:
						Math.abs(feature.support.total - target_support) <= similar_threshold
							? 'similar'
							: 'lower'
				}) satisfies Recommendation
		)
		.sort(
			(a, b) =>
				Math.abs(a.support.total - target_support) - Math.abs(b.support.total - target_support) ||
				b.support.total - a.support.total ||
				a.title.localeCompare(b.title)
		)
		.slice(0, limit);
}

function summarize_feature(feature: CaniuseFeature, usage: BrowserUsage): FeatureSummary {
	return {
		id: feature.id,
		title: feature.title,
		caniuse_url: get_caniuse_url(feature.id),
		support: calculate_support(feature.stats, usage)
	};
}

export function get_caniuse_url(id: string) {
	return `https://caniuse.com/${id}`;
}

function has_support_flag(support: string, flag: 'a' | 'y') {
	return support.split(' ').includes(flag);
}

function normalize_search(value: string) {
	return value
		.toLowerCase()
		.replace(/[^a-z0-9]+/g, ' ')
		.trim();
}

function match_rank(feature: CaniuseFeature, normalized_query: string) {
	const normalized_id = normalize_search(feature.id);
	const normalized_title = normalize_search(feature.title);

	return rank_normalized_match(normalized_id, normalized_title, normalized_query);
}

function match_summary_rank(feature: FeatureSummary, normalized_query: string) {
	const normalized_id = normalize_search(feature.id);
	const normalized_title = normalize_search(feature.title);

	return rank_normalized_match(normalized_id, normalized_title, normalized_query);
}

function rank_normalized_match(
	normalized_id: string,
	normalized_title: string,
	normalized_query: string
) {
	if (normalized_id === normalized_query) return 4;
	if (normalized_title === normalized_query) return 3;
	if (normalized_id.includes(normalized_query)) return 2;
	if (normalized_title.includes(normalized_query)) return 1;

	return 0;
}

function round_percentage(value: number) {
	return Math.round(value * 10) / 10;
}
