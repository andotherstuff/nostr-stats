<script lang="ts">
interface Props {
	type?: 'card' | 'chart' | 'table' | 'stat-row' | 'header-stat'
	height?: number
	rows?: number
}

const { type = 'card', height = 180, rows = 5 }: Props = $props()
</script>

{#if type === 'card'}
	<div class="rounded-lg border border-slate-700/50 bg-slate-900/50 p-2.5 animate-pulse">
		<div class="h-3 w-32 rounded bg-slate-700/50 mb-2"></div>
		<div class="h-6 w-24 rounded bg-slate-700/30 mb-2"></div>
		<div class="space-y-1.5">
			<div class="flex justify-between">
				<div class="h-2.5 w-16 rounded bg-slate-800/50"></div>
				<div class="h-2.5 w-12 rounded bg-slate-800/50"></div>
			</div>
			<div class="flex justify-between">
				<div class="h-2.5 w-20 rounded bg-slate-800/50"></div>
				<div class="h-2.5 w-10 rounded bg-slate-800/50"></div>
			</div>
			<div class="flex justify-between">
				<div class="h-2.5 w-14 rounded bg-slate-800/50"></div>
				<div class="h-2.5 w-14 rounded bg-slate-800/50"></div>
			</div>
		</div>
	</div>
{:else if type === 'chart'}
	<div class="rounded-lg border border-slate-700/50 bg-slate-900/50 p-2.5 animate-pulse">
		<div class="h-3 w-40 rounded bg-slate-700/50 mb-3"></div>
		<div class="flex items-end gap-1" style="height: {height}px">
			{#each Array(20) as _, i}
				<div
					class="flex-1 rounded-t bg-slate-700/30"
					style="height: {30 + Math.sin(i * 0.5) * 20 + Math.random() * 40}%"
				></div>
			{/each}
		</div>
	</div>
{:else if type === 'table'}
	<div class="rounded-lg border border-slate-700/50 bg-slate-900/50 p-2.5 animate-pulse">
		<div class="h-3 w-32 rounded bg-slate-700/50 mb-3"></div>
		<div class="space-y-2">
			<div class="flex gap-4 border-b border-slate-800/50 pb-2">
				<div class="h-2.5 w-12 rounded bg-slate-700/40"></div>
				<div class="h-2.5 w-24 rounded bg-slate-700/40"></div>
				<div class="h-2.5 w-16 rounded bg-slate-700/40 ml-auto"></div>
				<div class="h-2.5 w-12 rounded bg-slate-700/40"></div>
			</div>
			{#each Array(rows) as _}
				<div class="flex gap-4 py-1">
					<div class="h-3 w-10 rounded bg-slate-800/50"></div>
					<div class="h-3 w-28 rounded bg-slate-800/40"></div>
					<div class="h-3 w-14 rounded bg-slate-800/40 ml-auto"></div>
					<div class="h-3 w-10 rounded bg-slate-800/40"></div>
				</div>
			{/each}
		</div>
	</div>
{:else if type === 'stat-row'}
	<div class="grid grid-cols-1 sm:grid-cols-3 gap-2">
		{#each Array(3) as _}
			<div class="rounded-lg border border-slate-700/30 bg-slate-900/50 p-2.5 animate-pulse">
				<div class="flex justify-between mb-1.5">
					<div class="h-2.5 w-24 rounded bg-slate-700/50"></div>
					<div class="h-4 w-8 rounded bg-slate-700/30"></div>
				</div>
				<div class="h-7 w-20 rounded bg-slate-700/40 mb-2"></div>
				<div class="space-y-1">
					<div class="flex justify-between">
						<div class="h-2 w-14 rounded bg-slate-800/50"></div>
						<div class="h-2 w-10 rounded bg-slate-800/50"></div>
					</div>
					<div class="flex justify-between">
						<div class="h-2 w-16 rounded bg-slate-800/50"></div>
						<div class="h-2 w-8 rounded bg-slate-800/50"></div>
					</div>
					<div class="flex justify-between">
						<div class="h-2 w-12 rounded bg-slate-800/50"></div>
						<div class="h-2 w-12 rounded bg-slate-800/50"></div>
					</div>
				</div>
			</div>
		{/each}
	</div>
{:else if type === 'header-stat'}
	<span class="text-slate-500 animate-pulse inline-flex items-center gap-2">
		<span class="h-3 w-20 rounded bg-slate-700/50 inline-block"></span>
		<span class="font-mono h-3 w-16 rounded bg-slate-700/30 inline-block"></span>
		<span class="text-slate-600 mx-1">·</span>
		<span class="h-3 w-32 rounded bg-slate-700/40 inline-block"></span>
	</span>
{/if}

<style>
@keyframes pulse {
	0%, 100% {
		opacity: 1;
	}
	50% {
		opacity: 0.5;
	}
}

:global(.animate-pulse) {
	animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
}
</style>

