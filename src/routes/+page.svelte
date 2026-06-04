<script lang="ts">
	import { format_percentage } from '$lib/caniuse';
	import { get_search_results } from './search.remote';
	import { resolve } from '$app/paths';
	import { page } from '$app/state';

	let query = $derived(page.url.searchParams.get('q') ?? '');
	let feature_id = $derived(page.url.searchParams.get('feature') ?? undefined);
	let search_result = $derived(await get_search_results({ query, feature_id }));

	let highlight = $state(0);

	let matches = $derived(search_result.matches);
	let report = $derived(search_result.report);
	let active_id = $derived(report?.id ?? '');

	type Band = { key: 'strong' | 'good' | 'limited'; label: string; note: string };

	function band(total: number): Band {
		if (total >= 92) {
			return { key: 'strong', label: 'Baseline safe', note: 'shipped almost everywhere' };
		}
		if (total >= 80) {
			return { key: 'good', label: 'Widely usable', note: 'safe for most audiences' };
		}
		return { key: 'limited', label: 'Ship with care', note: 'check your own analytics' };
	}

	function on_keydown(event: KeyboardEvent) {
		if (!matches.length) return;
		if (event.key === 'ArrowDown') {
			event.preventDefault();
			highlight = (highlight + 1) % matches.length;
		} else if (event.key === 'ArrowUp') {
			event.preventDefault();
			highlight = (highlight - 1 + matches.length) % matches.length;
		} else if (event.key === 'Enter') {
			highlight = 0;
		}
	}
</script>

<svelte:head>
	<title>If You Use — relative browser support, made decidable</title>
	<meta
		name="description"
		content="Search a web platform feature, see its global support, then find the features you already ship that set a lower or equal bar. A relative read on caniuse data."
	/>
</svelte:head>

<div class="page">
	<header class="masthead">
		<a class="wordmark" href={resolve('/')}>
			<span class="mark" aria-hidden="true"></span>
			If&nbsp;You&nbsp;Use
		</a>
		<div class="masthead-end">
			<p class="source">caniuse data · global usage share</p>
		</div>
	</header>

	<main>
		<section class="lead">
			<h1>If you already ship this, what else is fair game?</h1>
			<p class="dek">
				A raw support percentage tells you little on its own. Anchor an unfamiliar feature against
				the ones you already trust in production, and the ship decision gets a lot easier.
			</p>
		</section>

		<section class="search" aria-label="Search web platform features">
			<form data-sveltekit-keepfocus method="GET" action={resolve('/')}>
				<div class="search-controls">
					<label class="field">
						<span class="field-label">Web platform feature</span>
						<input
							type="search"
							name="q"
							defaultValue={search_result.query}
							role="combobox"
							aria-expanded={matches.length > 0}
							aria-controls="match-list"
							autocomplete="off"
							spellcheck="false"
							oninput={(e) => {
								highlight = 0;
								e.currentTarget.form?.requestSubmit();
							}}
							onkeydown={on_keydown}
							placeholder="subgrid, container queries, :has(), webp…"
						/>
					</label>
					<button type="submit" class="search-button">Search</button>
				</div>

				{#if matches.length}
					<ul id="match-list" class="matches" role="listbox" aria-label="Matching features">
						{#each matches as match, i (match.id)}
							{@const b = band(match.support.total)}
							<li role="presentation">
								<button
									type="submit"
									name="feature"
									value={match.id}
									role="option"
									aria-selected={match.id === active_id}
									class={{ match: true, active: match.id === active_id, cued: i === highlight }}
									onmouseenter={() => (highlight = i)}
								>
									<span class="match-title">{match.title}</span>
									<span class="match-id">{match.id}</span>
									<span class="match-pct" data-band={b.key}>
										<span class="dot" aria-hidden="true"></span>
										{format_percentage(match.support.total)}
									</span>
								</button>
							</li>
						{/each}
					</ul>
				{:else}
					<p class="no-match">Nothing in the caniuse dataset matches “{search_result.query}”.</p>
				{/if}
			</form>
		</section>

		{#if report}
			{@const b = band(report.support.total)}
			<section class="answer" aria-labelledby="feature-title">
				<div class="answer-head">
					<p class="kicker">Selected feature</p>
					<h2 id="feature-title">{report.title}</h2>
					<div class="feature-meta">
						<p class="feature-id">{report.id}</p>
						<a
							class="external-link"
							href={report.caniuse_url}
							target="_blank"
							rel="external noreferrer"
							aria-label={`View ${report.title} on Can I Use`}
						>
							View on Can I Use
							<span aria-hidden="true">↗</span>
						</a>
					</div>
				</div>

				<div class="verdict" data-band={b.key}>
					<div class="reading">
						<span class="big-pct">{format_percentage(report.support.total)}</span>
						<span class="of">of global usage</span>
					</div>
					<div class="grade">
						<span class="grade-label">{b.label}</span>
						<span class="grade-note">{b.note}</span>
					</div>
				</div>

				<div class="meter" data-band={b.key}>
					<div class="meter-fill" style:width={`${Math.min(report.support.total, 100)}%`}></div>
				</div>

				<dl class="split">
					<div>
						<dt>Full support</dt>
						<dd>{format_percentage(report.support.full)}</dd>
					</div>
					<div>
						<dt>Partial support</dt>
						<dd>{format_percentage(report.support.partial)}</dd>
					</div>
				</dl>

				<div class="argument">
					<h3>
						Already shipping these? Then <em>{report.title}</em> clears the same bar.
					</h3>
					<p class="argument-dek">
						Every feature below sits at equal or lower global support. If one of them is in your
						production code today, this one is at least as safe.
					</p>
				</div>

				{#if report.recommendations.length}
					<div class="ledger" role="table" aria-label="Comparable features by support">
						<div class="ledger-head" role="row">
							<span role="columnheader">Feature</span>
							<span role="columnheader" class="num">Support</span>
							<span role="columnheader" class="rel">Relative bar</span>
						</div>
						{#each report.recommendations as rec (rec.id)}
							{@const rb = band(rec.support.total)}
							<div class="row" role="row">
								<span class="rec-feature" role="cell">
									<span class="rec-title-line">
										<span class="rec-title">{rec.title}</span>
										<a
											class="external-link rec-link"
											href={rec.caniuse_url}
											target="_blank"
											rel="external noreferrer"
											aria-label={`View ${rec.title} on Can I Use`}
										>
											Can I Use
											<span aria-hidden="true">↗</span>
										</a>
									</span>
									<span class="rec-id">{rec.id}</span>
								</span>
								<span class="rec-pct num" data-band={rb.key} role="cell">
									<span class="dot" aria-hidden="true"></span>
									{format_percentage(rec.support.total)}
								</span>
								<span class="rec-rel rel" role="cell">
									{rec.comparison === 'similar' ? 'About the same' : 'Lower bar'}
								</span>
							</div>
						{/each}
					</div>
				{:else}
					<p class="no-match">
						Nothing in the dataset sits at or below this feature. It is among the safest things you
						can ship.
					</p>
				{/if}
			</section>
		{:else}
			<section class="answer empty">
				<p class="kicker">No feature yet</p>
				<h2>Type a feature to begin.</h2>
				<p class="dek">Search above, then read its support against everything you already trust.</p>
			</section>
		{/if}
	</main>

	<footer class="colophon">
		<p>
			Support figures are global usage share from the caniuse dataset, counting full and partial
			support. Always sanity-check against your own audience analytics before you ship.
		</p>
	</footer>
</div>

<style>
	.page {
		width: min(100% - 2.5rem, 60rem);
		margin-inline: auto;
		padding-block: clamp(1.75rem, 4vw, 3rem) 4rem;
	}

	/* Masthead */
	.masthead {
		display: flex;
		flex-wrap: wrap;
		align-items: baseline;
		justify-content: space-between;
		gap: 0.75rem 1.5rem;
		padding-bottom: 1.1rem;
		border-bottom: 1px solid var(--hairline);
	}

	.wordmark {
		display: inline-flex;
		align-items: center;
		gap: 0.55rem;
		color: var(--ink);
		font-family: var(--font-display);
		font-weight: 600;
		font-size: 1.05rem;
		letter-spacing: -0.01em;
		text-decoration: none;
	}

	.mark {
		width: 0.7rem;
		height: 0.7rem;
		border-radius: 50%;
		background: var(--accent);
	}

	.source {
		margin: 0;
		font-family: var(--font-mono);
		font-size: 0.72rem;
		letter-spacing: 0.02em;
		color: var(--ink-faint);
	}

	.masthead-end {
		display: inline-flex;
		align-items: center;
		gap: 1rem;
	}

	/* Lead */
	.lead {
		padding-block: clamp(2.5rem, 7vw, 4.5rem) clamp(1.75rem, 4vw, 2.75rem);
	}

	h1 {
		max-width: 18ch;
		margin: 0 0 1.1rem;
		font-family: var(--font-display);
		font-optical-sizing: auto;
		font-weight: 540;
		font-size: clamp(2.5rem, 6.5vw, 4.6rem);
		line-height: 1.02;
		letter-spacing: -0.025em;
		text-wrap: balance;
	}

	.dek {
		max-width: var(--measure);
		margin: 0;
		font-size: clamp(1.05rem, 1.6vw, 1.2rem);
		line-height: 1.6;
		color: var(--ink-soft);
	}

	/* Search */
	.search {
		margin-bottom: clamp(2.5rem, 6vw, 4rem);
	}

	.field {
		display: grid;
		min-width: 0;
		grid-template-rows: subgrid;
		grid-row: 1/-1;
	}

	.search-controls {
		display: grid;
		grid-template-columns: 1fr auto;
		grid-template-rows: auto 1fr;
		gap: 0.75rem;
	}

	.field-label {
		display: block;
		margin-bottom: 0.6rem;
		font-family: var(--font-mono);
		font-size: 0.72rem;
		text-transform: uppercase;
		letter-spacing: 0.14em;
		color: var(--ink-faint);
	}

	.field input {
		width: 100%;
		padding: 1rem 1.15rem;
		border: 1px solid var(--hairline-strong);
		border-radius: 0.85rem;
		background: var(--surface);
		color: var(--ink);
		font-family: var(--font-display);
		font-size: clamp(1.15rem, 2.2vw, 1.5rem);
		letter-spacing: -0.01em;
		transition:
			border-color 140ms ease,
			box-shadow 140ms ease;
	}

	.field input::placeholder {
		color: var(--ink-faint);
		opacity: 0.7;
	}

	.field input:focus {
		outline: none;
		border-color: var(--accent-deep);
		box-shadow: 0 0 0 4px var(--focus-ring);
	}

	.search-button {
		min-height: 3.65rem;
		padding: 0 1.25rem;
		border: 1px solid var(--accent-deep);
		border-radius: 0.85rem;
		background: var(--accent-deep);
		color: var(--paper);
		font: 600 0.9rem/1 var(--font-mono);
		text-transform: uppercase;
		letter-spacing: 0.08em;
		cursor: pointer;
		grid-row: 2;
		transition:
			transform 140ms ease,
			opacity 140ms ease;
	}

	.search-button:hover {
		transform: translateY(-1px);
	}

	.search-button:focus-visible {
		outline: none;
		box-shadow: 0 0 0 4px var(--focus-ring);
	}

	.search-button:disabled {
		opacity: 0.65;
		cursor: wait;
		transform: none;
	}

	.matches {
		margin: 0.75rem 0 0;
		padding: 0;
		list-style: none;
		border: 1px solid var(--hairline);
		border-radius: 0.85rem;
		overflow: hidden;
		background: var(--surface);
	}

	.matches li + li .match {
		border-top: 1px solid var(--hairline);
	}

	.match {
		display: grid;
		grid-template-columns: 1fr auto;
		grid-template-areas:
			'title pct'
			'id pct';
		align-items: center;
		column-gap: 1rem;
		row-gap: 0.1rem;
		width: 100%;
		padding: 0.7rem 1.1rem;
		border: 0;
		background: transparent;
		text-align: left;
		cursor: pointer;
		transition: background-color 120ms ease;
	}

	.match.cued,
	.match:hover {
		background: var(--paper-sunk);
	}

	.match.active {
		background: var(--accent-wash);
	}

	.match-title {
		grid-area: title;
		font-weight: 500;
		color: var(--ink);
	}

	.match-id {
		grid-area: id;
		font-family: var(--font-mono);
		font-size: 0.74rem;
		color: var(--ink-faint);
	}

	.match-pct {
		grid-area: pct;
		display: inline-flex;
		align-items: center;
		gap: 0.45rem;
		font-family: var(--font-mono);
		font-size: 0.85rem;
		font-variant-numeric: tabular-nums;
		color: var(--ink-soft);
	}

	.dot {
		width: 0.5rem;
		height: 0.5rem;
		border-radius: 50%;
		background: var(--band, var(--ink-faint));
	}

	[data-band='strong'] {
		--band: var(--band-strong);
	}
	[data-band='good'] {
		--band: var(--band-good);
	}
	[data-band='limited'] {
		--band: var(--band-limited);
	}

	.no-match {
		margin: 1rem 0 0;
		padding: 1rem 1.15rem;
		border: 1px dashed var(--hairline-strong);
		border-radius: 0.85rem;
		color: var(--ink-soft);
	}

	/* Answer */
	.answer {
		padding-top: clamp(2rem, 5vw, 3rem);
		border-top: 1px solid var(--hairline);
	}

	.answer.empty {
		text-align: left;
		color: var(--ink-soft);
	}

	.kicker {
		margin: 0 0 0.6rem;
		font-family: var(--font-mono);
		font-size: 0.72rem;
		text-transform: uppercase;
		letter-spacing: 0.14em;
		color: var(--ink-faint);
	}

	.answer-head h2,
	.answer.empty h2 {
		margin: 0;
		font-family: var(--font-display);
		font-weight: 540;
		font-size: clamp(2rem, 5vw, 3.4rem);
		line-height: 1.05;
		letter-spacing: -0.025em;
	}

	.feature-id {
		margin: 0;
		font-family: var(--font-mono);
		font-size: 0.82rem;
		color: var(--ink-faint);
	}

	.feature-meta {
		display: flex;
		flex-wrap: wrap;
		align-items: baseline;
		gap: 0.45rem 0.75rem;
		margin-top: 0.55rem;
	}

	.external-link {
		display: inline-flex;
		align-items: baseline;
		gap: 0.25rem;
		width: fit-content;
		color: var(--accent-deep);
		font-family: var(--font-mono);
		font-size: 0.72rem;
		font-weight: 600;
		letter-spacing: 0.02em;
		text-decoration: none;
	}

	.external-link:hover {
		text-decoration: underline;
		text-underline-offset: 0.18em;
	}

	.external-link:focus-visible {
		outline: none;
		border-radius: 0.2rem;
		box-shadow: 0 0 0 3px var(--focus-ring);
	}

	.verdict {
		display: flex;
		flex-wrap: wrap;
		align-items: baseline;
		gap: 0.6rem 2rem;
		margin-top: clamp(1.75rem, 4vw, 2.75rem);
	}

	.reading {
		display: flex;
		align-items: baseline;
		gap: 0.55rem;
	}

	.big-pct {
		font-family: var(--font-display);
		font-weight: 560;
		font-size: clamp(3rem, 9vw, 5.5rem);
		line-height: 0.9;
		letter-spacing: -0.04em;
		font-variant-numeric: tabular-nums;
		color: var(--band, var(--ink));
	}

	.of {
		font-size: 1rem;
		color: var(--ink-soft);
	}

	.grade {
		display: flex;
		flex-direction: column;
		gap: 0.15rem;
		padding-left: 1.25rem;
		border-left: 1px solid var(--hairline-strong);
	}

	.grade-label {
		font-weight: 600;
		font-size: 1.05rem;
		color: var(--band, var(--ink));
	}

	.grade-note {
		font-size: 0.9rem;
		color: var(--ink-soft);
	}

	.meter {
		position: relative;
		height: 0.65rem;
		margin-top: 1.5rem;
		border-radius: 999px;
		background: var(--paper-sunk);
		box-shadow: inset 0 0 0 1px var(--hairline);
		overflow: hidden;
	}

	.meter-fill {
		height: 100%;
		border-radius: inherit;
		background: var(--band, var(--ink));
		transition: width 520ms cubic-bezier(0.22, 1, 0.36, 1);
	}

	.split {
		display: flex;
		gap: 2.5rem;
		margin: 1.15rem 0 0;
	}

	.split div {
		display: flex;
		flex-direction: column;
		gap: 0.2rem;
	}

	.split dt {
		font-family: var(--font-mono);
		font-size: 0.7rem;
		text-transform: uppercase;
		letter-spacing: 0.1em;
		color: var(--ink-faint);
	}

	.split dd {
		margin: 0;
		font-family: var(--font-mono);
		font-size: 1.05rem;
		font-variant-numeric: tabular-nums;
		color: var(--ink);
	}

	.argument {
		margin-top: clamp(2.5rem, 6vw, 4rem);
	}

	.argument h3 {
		max-width: 22ch;
		margin: 0 0 0.75rem;
		font-family: var(--font-display);
		font-weight: 500;
		font-size: clamp(1.4rem, 3vw, 2.1rem);
		line-height: 1.15;
		letter-spacing: -0.02em;
		text-wrap: balance;
	}

	.argument h3 em {
		font-style: italic;
		color: var(--accent-deep);
	}

	.argument-dek {
		max-width: var(--measure);
		margin: 0;
		color: var(--ink-soft);
		line-height: 1.6;
	}

	/* Ledger (comparison table) */
	.ledger {
		margin-top: 1.5rem;
	}

	.ledger-head {
		display: grid;
		grid-template-columns: 1fr auto 9rem;
		gap: 1rem;
		padding: 0 0.25rem 0.6rem;
		border-bottom: 1px solid var(--hairline-strong);
		font-family: var(--font-mono);
		font-size: 0.68rem;
		text-transform: uppercase;
		letter-spacing: 0.12em;
		color: var(--ink-faint);
	}

	.ledger-head .num {
		text-align: right;
	}

	.row {
		display: grid;
		grid-template-columns: 1fr auto 9rem;
		align-items: center;
		gap: 1rem;
		padding: 0.85rem 0.25rem;
		border-bottom: 1px solid var(--hairline);
	}

	.rec-feature {
		display: flex;
		flex-direction: column;
		gap: 0.15rem;
		min-width: 0;
	}

	.rec-title {
		font-weight: 500;
		color: var(--ink);
	}

	.rec-title-line {
		display: flex;
		flex-wrap: wrap;
		align-items: baseline;
		gap: 0.25rem 0.6rem;
		min-width: 0;
	}

	.rec-link {
		font-size: 0.68rem;
		white-space: nowrap;
	}

	.rec-id {
		font-family: var(--font-mono);
		font-size: 0.74rem;
		color: var(--ink-faint);
	}

	.rec-pct {
		display: inline-flex;
		align-items: center;
		justify-content: flex-end;
		gap: 0.45rem;
		font-family: var(--font-mono);
		font-size: 1rem;
		font-variant-numeric: tabular-nums;
		color: var(--ink);
	}

	.rec-rel {
		font-size: 0.85rem;
		color: var(--ink-soft);
	}

	/* Colophon */
	.colophon {
		max-width: var(--measure);
		margin-top: clamp(3rem, 8vw, 5rem);
		padding-top: 1.25rem;
		border-top: 1px solid var(--hairline);
	}

	.colophon p {
		margin: 0;
		font-size: 0.85rem;
		line-height: 1.6;
		color: var(--ink-faint);
	}

	@media (max-width: 33rem) {
		.search-controls {
			align-items: stretch;
			flex-direction: column;
		}

		.ledger-head,
		.row {
			grid-template-columns: 1fr auto;
		}

		.ledger-head .rel,
		.rec-rel {
			display: none;
		}

		.grade {
			padding-left: 0;
			border-left: 0;
		}
	}

	@media (prefers-reduced-motion: reduce) {
		.meter-fill {
			transition: none;
		}
	}
</style>
