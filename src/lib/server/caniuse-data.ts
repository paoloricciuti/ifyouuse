import { calculate_support, get_caniuse_url, type CaniuseFeature } from '$lib/caniuse';
import features_data from 'caniuse-lite/data/features.js';
import { agents } from 'caniuse-lite/dist/unpacker/agents.js';
import unpack_feature from 'caniuse-lite/dist/unpacker/feature.js';
import { features as web_features } from 'web-features';

type WebFeatureSupport = {
	chrome?: string;
	chrome_android?: string;
	edge?: string;
	firefox?: string;
	firefox_android?: string;
	safari?: string;
	safari_ios?: string;
};

const web_feature_browser_map = {
	chrome: 'chrome',
	chrome_android: 'and_chr',
	edge: 'edge',
	firefox: 'firefox',
	firefox_android: 'and_ff',
	safari: 'safari',
	safari_ios: 'ios_saf'
} satisfies Record<keyof WebFeatureSupport, string>;

const all_features = Object.entries(features_data).map(([id, feature]) => ({
	...unpack_feature(feature),
	id
}));

const global_usage = Object.fromEntries(
	Object.entries(agents).map(([browser, data]) => [browser, data.usage_global])
);

export function get_all_features() {
	return all_features satisfies CaniuseFeature[];
}

export function get_feature_summaries() {
	const summaries = all_features.map((feature) => ({
		id: feature.id,
		title: feature.title,
		caniuse_url: get_caniuse_url(feature.id),
		support: calculate_support(feature.stats, global_usage)
	}));
	const summary_ids = new Set(summaries.map(({ id }) => id));

	return [
		...summaries,
		...get_web_feature_summaries().filter(({ id }) => !summary_ids.has(id.replace(/^wf-/, '')))
	];
}

function get_web_feature_summaries() {
	return Object.entries(web_features)
		.filter((entry) => {
			const [, feature] = entry;

			if (feature.kind !== 'feature') return false;

			return !feature.caniuse?.some((id) => Object.hasOwn(features_data, id));
		})
		.map(([id, feature]) => ({
			id: `wf-${id}`,
			title: feature.kind === 'feature' ? feature.name : id,
			caniuse_url: `https://caniuse.com/?search=${encodeURIComponent(
				feature.kind === 'feature' ? feature.name : id
			)}`,
			support:
				feature.kind === 'feature'
					? calculate_web_feature_support(feature.status.support)
					: { full: 0, partial: 0, total: 0 }
		}))
		.filter(({ support }) => support.total > 0);
}

function calculate_web_feature_support(support: WebFeatureSupport) {
	let full = 0;

	for (const [web_feature_browser, minimum_version] of Object.entries(support)) {
		const caniuse_browser = web_feature_browser_map[web_feature_browser as keyof WebFeatureSupport];

		for (const [version, usage] of Object.entries(global_usage[caniuse_browser] ?? {})) {
			if (compare_versions(version, minimum_version) >= 0) {
				full += usage;
			}
		}
	}

	const rounded = Math.round(full * 10) / 10;

	return { full: rounded, partial: 0, total: rounded };
}

function compare_versions(left: string, right: string) {
	const left_parts = left.split('.').map(Number);
	const right_parts = right.split('.').map(Number);
	const length = Math.max(left_parts.length, right_parts.length);

	for (let index = 0; index < length; index += 1) {
		const difference = (left_parts[index] ?? 0) - (right_parts[index] ?? 0);

		if (difference !== 0) return difference;
	}

	return 0;
}
