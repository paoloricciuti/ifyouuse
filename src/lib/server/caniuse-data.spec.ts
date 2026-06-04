import { describe, expect, it } from 'vitest';
import { find_summary_matches } from '$lib/caniuse';
import { get_feature_summaries } from './caniuse-data';

describe('caniuse server data', () => {
	it('includes caniuse web-features entries missing from caniuse-lite', () => {
		expect(find_summary_matches('invokers', get_feature_summaries())).toMatchObject([
			{ id: 'wf-interest-invokers', title: 'Interest invokers' }
		]);
	});
});
