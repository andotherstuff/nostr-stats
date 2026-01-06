<script lang="ts">
import Chart from 'chart.js/auto'
import { onMount } from 'svelte'

interface Dataset {
	label: string
	data: number[]
	color: string
	fill?: boolean
	yAxisID?: string
}

interface Props {
	labels: string[]
	datasets: Dataset[]
	type?: 'line' | 'bar'
	height?: number
	stacked?: boolean
	dualAxis?: boolean
	isPercent?: boolean
}

const { labels, datasets, type = 'line', height = 200, stacked = false, dualAxis = false, isPercent = false }: Props = $props()

let canvas: HTMLCanvasElement
let chart: Chart | null = null

function formatAxisValue(value: number): string {
	if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`
	if (value >= 1_000) return `${(value / 1_000).toFixed(0)}K`
	return value.toString()
}

function createChart() {
	if (chart) {
		chart.destroy()
	}

	const ctx = canvas.getContext('2d')
	if (!ctx) return

	// Build scales config
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	const scales: any = {
		x: {
			stacked,
			grid: {
				color: 'rgba(100, 116, 139, 0.08)',
			},
			ticks: {
				color: 'rgb(100, 116, 139)',
				maxRotation: 0,
				maxTicksLimit: 10,
				font: { size: 10 },
			},
		},
		y: {
			stacked,
			position: 'left',
			grid: {
				color: 'rgba(100, 116, 139, 0.08)',
			},
			ticks: {
				color: datasets[0]?.color ?? 'rgb(100, 116, 139)',
				font: { size: 10 },
				callback: (value: unknown) => typeof value === 'number' ? formatAxisValue(value) : value,
			},
		},
	}

	if (dualAxis && datasets.length > 1) {
		scales.y1 = {
			position: 'right',
			grid: {
				drawOnChartArea: false,
			},
			ticks: {
				color: datasets[1]?.color ?? 'rgb(100, 116, 139)',
				font: { size: 10 },
				callback: (value: unknown) => typeof value === 'number' ? formatAxisValue(value) : value,
			},
		}
	}

	chart = new Chart(ctx, {
		type,
		data: {
			labels,
			datasets: datasets.map((ds, i) => ({
				label: ds.label,
				data: ds.data,
				borderColor: ds.color,
				backgroundColor: type === 'bar' ? `${ds.color}cc` : ds.fill ? `${ds.color}33` : 'transparent',
				fill: ds.fill ?? false,
				tension: 0.3,
				pointRadius: 0,
				pointHoverRadius: 3,
				borderWidth: type === 'bar' ? 0 : 2,
				yAxisID: dualAxis ? (i === 0 ? 'y' : 'y1') : 'y',
			})),
		},
		options: {
			responsive: true,
			maintainAspectRatio: false,
			interaction: {
				mode: 'index',
				intersect: false,
			},
			scales,
			plugins: {
				legend: {
					display: datasets.length > 1,
					position: 'top',
					align: 'end',
					labels: {
						color: 'rgb(148, 163, 184)',
						boxWidth: 10,
						boxHeight: 10,
						padding: 12,
						font: { size: 11 },
					},
				},
				tooltip: {
					backgroundColor: 'rgba(15, 23, 42, 0.95)',
					titleColor: 'rgb(226, 232, 240)',
					bodyColor: 'rgb(148, 163, 184)',
					borderColor: 'rgba(100, 116, 139, 0.3)',
					borderWidth: 1,
					padding: 8,
					displayColors: true,
					boxWidth: 8,
					boxHeight: 8,
					callbacks: {
						label: (context) => {
							const value = context.parsed.y ?? 0
							let formatted: string
							if (isPercent) {
								formatted = `${value.toFixed(2)}%`
							} else if (value >= 1_000_000) {
								formatted = `${(value / 1_000_000).toFixed(2)}M`
							} else if (value >= 1_000) {
								formatted = `${(value / 1_000).toFixed(1)}K`
							} else {
								formatted = value.toLocaleString()
							}
							return `${context.dataset.label}: ${formatted}`
						},
					},
				},
			},
		},
	})
}

onMount(() => {
	createChart()
	return () => {
		if (chart) chart.destroy()
	}
})

$effect(() => {
	if (canvas && labels && datasets) {
		createChart()
	}
})
</script>

<div style="height: {height}px">
	<canvas bind:this={canvas}></canvas>
</div>
