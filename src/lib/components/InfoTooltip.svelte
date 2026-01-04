<script lang="ts">
	import { onMount } from 'svelte'

	interface Props {
		text: string
	}

	let { text }: Props = $props()
	let visible = $state(false)
	let tooltipEl: HTMLDivElement | null = $state(null)
	let position = $state<'center' | 'left' | 'right'>('center')

	function updatePosition() {
		if (!tooltipEl) return

		const rect = tooltipEl.getBoundingClientRect()
		const viewportWidth = window.innerWidth
		const padding = 12

		// Check if tooltip overflows on left or right
		if (rect.left < padding) {
			position = 'left'
		} else if (rect.right > viewportWidth - padding) {
			position = 'right'
		} else {
			position = 'center'
		}
	}

	function show() {
		visible = true
		// Wait for next frame so tooltip is rendered, then adjust position
		requestAnimationFrame(updatePosition)
	}

	function hide() {
		visible = false
		position = 'center'
	}
</script>

<span
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
			class:tooltip-left={position === 'left'}
			class:tooltip-right={position === 'right'}
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
		position: absolute;
		bottom: calc(100% + 8px);
		left: 50%;
		transform: translateX(-50%);
		z-index: 50;
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

	/* Position near left edge - anchor to left */
	.tooltip-content.tooltip-left {
		left: 0;
		transform: translateX(0);
	}

	/* Position near right edge - anchor to right */
	.tooltip-content.tooltip-right {
		left: auto;
		right: 0;
		transform: translateX(0);
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

	.tooltip-content.tooltip-left::after {
		left: 10px;
		transform: translateX(0);
	}

	.tooltip-content.tooltip-right::after {
		left: auto;
		right: 10px;
		transform: translateX(0);
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

	.tooltip-content.tooltip-left {
		animation: tooltip-fade-in-left 0.15s ease-out;
	}

	.tooltip-content.tooltip-right {
		animation: tooltip-fade-in-right 0.15s ease-out;
	}

	@keyframes tooltip-fade-in-left {
		from {
			opacity: 0;
			transform: translateY(4px);
		}
		to {
			opacity: 1;
			transform: translateY(0);
		}
	}

	@keyframes tooltip-fade-in-right {
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

