<script lang="ts">
import { getKindName } from '$lib/api'
import { formatNumber, formatRelativeTime } from '$lib/format'

interface Props {
	kind: number
	eventCount: number
	uniquePubkeys: number
	lastSeen: number
	maxCount: number
}

const { kind, eventCount, uniquePubkeys, lastSeen, maxCount }: Props = $props()

const barWidth = $derived((eventCount / maxCount) * 100)
</script>

<div class="group relative rounded-lg border border-slate-700/50 bg-slate-800/30 p-3 transition-all hover:border-violet-500/30 hover:bg-slate-800/50">
	<!-- Background bar -->
	<div
		class="absolute inset-0 rounded-lg bg-gradient-to-r from-violet-500/10 to-transparent transition-all group-hover:from-violet-500/20"
		style="width: {barWidth}%"
	></div>

	<div class="relative flex items-center justify-between">
		<div class="flex items-center gap-3">
			<span class="w-16 font-mono text-sm text-violet-400">{kind}</span>
			<span class="text-sm text-slate-300">{getKindName(kind)}</span>
		</div>
		<div class="flex items-center gap-6 text-right">
			<div>
				<div class="font-mono text-sm text-slate-200">{formatNumber(eventCount)}</div>
				<div class="text-xs text-slate-500">events</div>
			</div>
			<div class="hidden sm:block">
				<div class="font-mono text-sm text-slate-200">{formatNumber(uniquePubkeys)}</div>
				<div class="text-xs text-slate-500">users</div>
			</div>
			<div class="hidden md:block w-20">
				<div class="text-xs text-slate-400">{formatRelativeTime(lastSeen)}</div>
			</div>
		</div>
	</div>
</div>

