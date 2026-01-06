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
	if (sortKey !== key) return ''
	return sortDir === 'asc' ? ' ^' : ' v'
}
</script>

<div class="overflow-x-auto -mx-3 px-3">
	<table class="w-full text-sm min-w-[320px]">
		<thead>
			<tr class="border-b border-slate-700/50 text-left text-xs uppercase tracking-wider text-slate-500">
				<th class="py-2 pr-4">
					<button
						class="flex items-center hover:text-slate-300 transition-colors"
						onclick={() => toggleSort('kind')}
					>
						Event Type<span class="text-[10px] opacity-60">{getSortIcon('kind')}</span>
					</button>
				</th>
				<th class="py-2 px-4 text-right">
					<button
						class="flex items-center ml-auto hover:text-slate-300 transition-colors"
						onclick={() => toggleSort('event_count')}
					>
						Events<span class="text-[10px] opacity-60">{getSortIcon('event_count')}</span>
					</button>
				</th>
				<th class="py-2 pl-4 pr-1 text-right">
					<button
						class="flex items-center ml-auto hover:text-slate-300 transition-colors"
						onclick={() => toggleSort('unique_pubkeys')}
					>
						Users<span class="text-[10px] opacity-60">{getSortIcon('unique_pubkeys')}</span>
					</button>
				</th>
			</tr>
		</thead>
		<tbody>
			{#each sortedData() as row}
				<tr class="border-b border-slate-800/50 hover:bg-slate-800/30 transition-colors">
					<td class="py-2 pr-4">
						<div class="text-slate-200 font-medium">{getKindName(row.kind)}</div>
						<div class="text-xs text-slate-500 font-mono">Kind {row.kind}</div>
					</td>
					<td class="py-2 px-4 text-right font-mono text-slate-200">{formatNumber(row.event_count)}</td>
					<td class="py-2 pl-4 text-right font-mono text-slate-200">{formatNumber(row.unique_pubkeys)}</td>
				</tr>
			{/each}
		</tbody>
	</table>
</div>

