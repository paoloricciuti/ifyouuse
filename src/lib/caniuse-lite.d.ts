declare module 'caniuse-lite/data/features.js' {
	const features: Record<string, unknown>;
	export default features;
}

declare module 'caniuse-lite/dist/unpacker/feature.js' {
	import type { CaniuseFeature } from './caniuse';

	export default function unpack_feature(feature: unknown): CaniuseFeature;
}

declare module 'caniuse-lite/dist/unpacker/agents.js' {
	export const agents: Record<string, { usage_global: Record<string, number> }>;
}
