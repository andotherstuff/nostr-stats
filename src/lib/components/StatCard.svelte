<script lang="ts">
import { formatNumber, formatPercent } from '$lib/format'

interface Props {
	label: string
	value: number
	change?: number | null
	sublabel?: string
	color?: 'purple' | 'cyan' | 'orange' | 'green' | 'pink'
}

const { label, value, change = null, sublabel = '', color = 'purple' }: Props = $props()

const colorClasses = {
	purple: 'border-violet-500/20 bg-violet-500/5',
	cyan: 'border-cyan-500/20 bg-cyan-500/5',
	orange: 'border-amber-500/20 bg-amber-500/5',
	green: 'border-emerald-500/20 bg-emerald-500/5',
	pink: 'border-pink-500/20 bg-pink-500/5',
}

const textColors = {
	purple: 'text-violet-400',
	cyan: 'text-cyan-400',
	orange: 'text-amber-400',
	green: 'text-emerald-400',
	pink: 'text-pink-400',
}
</script>

<div class="rounded-lg border p-3 {colorClasses[color]}">
	<div class="text-xs font-medium uppercase tracking-wider text-slate-500">{label}</div>
	<div class="mt-0.5 flex items-baseline gap-2">
		<span class="font-mono text-xl font-bold {textColors[color]}">{formatNumber(value)}</span>
		{#if change !== null}
			<span class="text-xs {change >= 0 ? 'text-emerald-400' : 'text-rose-400'}">
				{formatPercent(change)}
			</span>
		{/if}
	</div>
	{#if sublabel}
		<div class="mt-0.5 text-[10px] text-slate-500">{sublabel}</div>
	{/if}
</div>
