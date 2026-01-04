<script lang="ts">
import { getKindName } from '$lib/api'
import { formatNumber } from '$lib/format'

interface KindRow {
	kind: number
	event_count: number
	unique_pubkeys: number
}

interface Props {
	data: KindRow[]
}

const { data }: Props = $props()

type SortKey = 'kind' | 'event_count' | 'unique_pubkeys'
type SortDir = 'asc' | 'desc'

let sortKey = $state<SortKey>('event_count')
let sortDir = $state<SortDir>('desc')

const sortedData = $derived(() => {
	return [...data].sort((a, b) => {
		const aVal = a[sortKey]
		const bVal = b[sortKey]
		return sortDir === 'asc' ? aVal - bVal : bVal - aVal
	})
})

function toggleSort(key: SortKey) {
	if (sortKey === key) {
		sortDir = sortDir === 'asc' ? 'desc' : 'asc'
	} else {
		sortKey = key
		sortDir = 'desc'
	}
}

function getSortIcon(key: SortKey): string {
	if (sortKey !== key) return '⇅'
	return sortDir === 'asc' ? '▲' : '▼'
}
</script>

<div class="overflow-x-auto -mx-2.5 px-2.5">
	<table class="w-full text-xs sm:text-sm min-w-[320px]">
		<thead>
			<tr class="border-b border-slate-700/50 text-left text-[10px] sm:text-xs uppercase tracking-wider text-slate-500">
				<th class="py-2 pr-2 sm:pr-4">
					<button
						class="flex items-center gap-1 sm:gap-2 hover:text-slate-300 transition-colors"
						onclick={() => toggleSort('kind')}
					>
						Kind <span class="text-[10px] opacity-60">{getSortIcon('kind')}</span>
					</button>
				</th>
				<th class="py-2 px-1 sm:px-2 hidden xs:table-cell">Description</th>
				<th class="py-2 px-1 sm:px-4 text-right">
					<button
						class="flex items-center gap-1 sm:gap-2 ml-auto hover:text-slate-300 transition-colors"
						onclick={() => toggleSort('event_count')}
					>
						Events <span class="text-[10px] opacity-60">{getSortIcon('event_count')}</span>
					</button>
				</th>
				<th class="py-2 pl-1 sm:pl-4 pr-1 text-right">
					<button
						class="flex items-center gap-1 sm:gap-2 ml-auto hover:text-slate-300 transition-colors"
						onclick={() => toggleSort('unique_pubkeys')}
					>
						Users <span class="text-[10px] opacity-60">{getSortIcon('unique_pubkeys')}</span>
					</button>
				</th>
			</tr>
		</thead>
		<tbody>
			{#each sortedData() as row}
				<tr class="border-b border-slate-800/50 hover:bg-slate-800/30 transition-colors">
					<td class="py-1.5 pr-1 sm:pr-2">
						<span class="font-mono text-violet-400">{row.kind}</span>
						<span class="xs:hidden block text-[10px] text-slate-500 truncate max-w-[100px]">{getKindName(row.kind)}</span>
					</td>
					<td class="py-1.5 px-1 sm:px-2 text-slate-300 truncate max-w-[140px] sm:max-w-[200px] hidden xs:table-cell">{getKindName(row.kind)}</td>
					<td class="py-1.5 px-1 sm:px-2 text-right font-mono text-slate-200">{formatNumber(row.event_count)}</td>
					<td class="py-1.5 pl-1 sm:pl-2 text-right font-mono text-slate-200">{formatNumber(row.unique_pubkeys)}</td>
				</tr>
			{/each}
		</tbody>
	</table>
</div>

