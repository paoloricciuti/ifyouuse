import { describe, expect, it } from 'vitest';
import {
	calculate_support,
	find_feature_matches,
	find_summary_matches,
	get_feature_report,
	get_recommendations
} from './caniuse';

const test_features = [
	{
		id: 'stable-api',
		title: 'Stable API',
		stats: {
			chrome: { '1': 'y', '2': 'y' },
			firefox: { '1': 'n' }
		}
	},
	{
		id: 'new-api',
		title: 'New API',
		stats: {
			chrome: { '1': 'n', '2': 'y' },
			firefox: { '1': 'n' }
		}
	},
	{
		id: 'partial-api',
		title: 'Partial API',
		stats: {
			chrome: { '1': 'a', '2': 'a' },
			firefox: { '1': 'n' }
		}
	}
];

const test_usage = {
	chrome: { '1': 40, '2': 35 },
	firefox: { '1': 25 }
};

describe('caniuse utilities', () => {
	it('calculates full and partial support weighted by browser usage', () => {
		expect(calculate_support(test_features[0].stats, test_usage)).toEqual({
			full: 75,
			partial: 0,
			total: 75
		});

		expect(calculate_support(test_features[2].stats, test_usage)).toEqual({
			full: 0,
			partial: 75,
			total: 75
		});
	});

	it('finds features by slug and title', () => {
		expect(find_feature_matches('new api', test_features, test_usage)).toMatchObject([
			{ id: 'new-api', title: 'New API' }
		]);
		expect(find_feature_matches('stable-api', test_features, test_usage)).toMatchObject([
			{ id: 'stable-api', title: 'Stable API' }
		]);
	});

	it('finds precomputed summaries by plural feature slugs', () => {
		expect(
			find_summary_matches('invokers', [
				{
					id: 'invokers',
					title: 'HTML Invokers',
					caniuse_url: 'https://caniuse.com/invokers',
					support: { full: 1, partial: 0, total: 1 }
				}
			])
		).toMatchObject([{ id: 'invokers', title: 'HTML Invokers' }]);
	});

	it('builds a searched feature report with lower and similar support recommendations', () => {
		const report = get_feature_report('stable-api', test_features, test_usage, {
			limit: 4,
			similar_threshold: 5
		});

		expect(report).toMatchObject({ id: 'stable-api', support: { full: 75 } });
		expect(report?.recommendations).toMatchObject([
			{ id: 'partial-api', comparison: 'similar' },
			{ id: 'new-api', comparison: 'lower' }
		]);
	});

	it('orders recommendation candidates from closest support downward', () => {
		expect(
			get_recommendations(test_features[0], test_features, test_usage, {
				limit: 1,
				similar_threshold: 5
			})
		).toMatchObject([{ id: 'partial-api' }]);
	});
});
