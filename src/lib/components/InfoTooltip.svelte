<script lang="ts">
	interface Props {
		text: string
	}

	let { text }: Props = $props()
	let visible = $state(false)
</script>

<span
	class="info-tooltip"
	onmouseenter={() => (visible = true)}
	onmouseleave={() => (visible = false)}
	onfocus={() => (visible = true)}
	onblur={() => (visible = false)}
	tabindex="0"
	role="button"
	aria-label="More information"
>
	<svg
		class="inline-block w-3.5 h-3.5 text-slate-500 hover:text-slate-400 cursor-help transition-colors"
		fill="none"
		viewBox="0 0 24 24"
		stroke="currentColor"
		stroke-width="2"
	>
		<circle cx="12" cy="12" r="10" />
		<path d="M12 16v-4M12 8h.01" stroke-linecap="round" stroke-linejoin="round" />
	</svg>

	{#if visible}
		<div class="tooltip-content">
			{text}
		</div>
	{/if}
</span>

<style>
	.info-tooltip {
		position: relative;
		display: inline-flex;
		align-items: center;
		margin-left: 0.375rem;
		vertical-align: middle;
	}

	.tooltip-content {
		position: absolute;
		bottom: calc(100% + 8px);
		left: 50%;
		transform: translateX(-50%);
		z-index: 50;
		width: max-content;
		max-width: 280px;
		padding: 0.5rem 0.75rem;
		font-size: 0.7rem;
		font-weight: 400;
		line-height: 1.4;
		color: #e2e8f0;
		background: #1e293b;
		border: 1px solid rgba(148, 163, 184, 0.2);
		border-radius: 0.5rem;
		box-shadow: 0 4px 12px rgba(0, 0, 0, 0.4);
		pointer-events: none;
		animation: tooltip-fade-in 0.15s ease-out;
	}

	.tooltip-content::after {
		content: '';
		position: absolute;
		top: 100%;
		left: 50%;
		transform: translateX(-50%);
		border: 6px solid transparent;
		border-top-color: #1e293b;
	}

	@keyframes tooltip-fade-in {
		from {
			opacity: 0;
			transform: translateX(-50%) translateY(4px);
		}
		to {
			opacity: 1;
			transform: translateX(-50%) translateY(0);
		}
	}
</style>

