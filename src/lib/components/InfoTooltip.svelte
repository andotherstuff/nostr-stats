<script lang="ts">
	import { tick } from 'svelte'

	interface Props {
		text: string
	}

	let { text }: Props = $props()
	let visible = $state(false)
	let tooltipEl: HTMLDivElement | null = $state(null)
	let iconEl: HTMLSpanElement | null = $state(null)
	let tooltipStyle = $state('')

	function updatePosition() {
		if (!tooltipEl || !iconEl) return

		const iconRect = iconEl.getBoundingClientRect()
		const tooltipRect = tooltipEl.getBoundingClientRect()
		const viewportWidth = window.innerWidth
		const padding = 12

		// Calculate ideal center position
		let left = iconRect.left + iconRect.width / 2 - tooltipRect.width / 2

		// Clamp to viewport bounds
		if (left < padding) {
			left = padding
		} else if (left + tooltipRect.width > viewportWidth - padding) {
			left = viewportWidth - padding - tooltipRect.width
		}

		// Position above the icon
		const top = iconRect.top - tooltipRect.height - 8

		tooltipStyle = `top: ${top}px; left: ${left}px;`
	}

	async function show() {
		visible = true
		// Wait for Svelte to render the tooltip, then calculate position
		await tick()
		updatePosition()
	}

	function hide() {
		visible = false
		tooltipStyle = ''
	}
</script>

<span
	bind:this={iconEl}
	class="info-tooltip"
	onmouseenter={show}
	onmouseleave={hide}
	onfocus={show}
	onblur={hide}
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
		<div
			bind:this={tooltipEl}
			class="tooltip-content"
			style={tooltipStyle}
		>
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
		position: fixed;
		z-index: 9999;
		width: max-content;
		max-width: min(280px, calc(100vw - 24px));
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

	@keyframes tooltip-fade-in {
		from {
			opacity: 0;
			transform: translateY(4px);
		}
		to {
			opacity: 1;
			transform: translateY(0);
		}
	}
</style>

