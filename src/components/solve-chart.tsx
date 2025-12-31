import { useMemo, useState } from 'react'
import {
  ResponsiveContainer,
  ComposedChart,
  Scatter,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts'
import type { Solve } from '@/types'

interface SolveChartProps {
  solves: Solve[]
}

type ChartDataType = 'speed' | 'ao10' | 'ao100'

function calculateMovingAverage(times: number[], window: number): (number | null)[] {
  return times.map((_, i) => {
    if (i < window - 1) return null
    const slice = times.slice(i - window + 1, i + 1)
    const sorted = [...slice].sort((a, b) => a - b)
    const trimmed = sorted.slice(1, -1)
    if (trimmed.length === 0) return null
    return trimmed.reduce((a, b) => a + b, 0) / trimmed.length
  })
}

function formatTime(ms: number): string {
  const seconds = ms / 1000
  return seconds.toFixed(2) + 's'
}

export function SolveChart({ solves }: SolveChartProps) {
  const [activeTypes, setActiveTypes] = useState<Set<ChartDataType>>(
    new Set(['speed', 'ao10', 'ao100'])
  )

  const chartData = useMemo(() => {
    const reversedSolves = [...solves].reverse()
    const times = reversedSolves.map((s) => (s.plusTwo ? s.time + 2000 : s.time))
    const ao10 = calculateMovingAverage(times, 10)
    const ao100 = calculateMovingAverage(times, 100)

    return reversedSolves.map((solve, index) => ({
      index: index + 1,
      time: times[index],
      ao10: ao10[index],
      ao100: ao100[index],
      date: new Date(solve.date).toLocaleDateString(),
    }))
  }, [solves])

  const toggleType = (type: ChartDataType) => {
    setActiveTypes((prev) => {
      const newSet = new Set(prev)
      if (newSet.has(type)) {
        newSet.delete(type)
      } else {
        newSet.add(type)
      }
      return newSet
    })
  }

  if (solves.length < 2) {
    return (
      <div
        className="flex h-48 items-center justify-center rounded-xl"
        style={{ backgroundColor: 'var(--theme-bgSecondary)', color: 'var(--theme-sub)' }}
      >
        <span className="text-sm">Need more solves to show chart</span>
      </div>
    )
  }

  return (
    <div
      className="rounded-xl p-3 sm:p-4"
      style={{ backgroundColor: 'var(--theme-bgSecondary)' }}
    >
      <div className="mb-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h3
          className="text-xs sm:text-sm font-medium uppercase tracking-wider"
          style={{ color: 'var(--theme-sub)' }}
        >
          Solve Times
        </h3>

        <div className="flex items-center gap-1">
          <button
            onClick={() => toggleType('speed')}
            className="rounded-md px-3 py-1.5 text-xs font-medium transition-colors"
            style={{
              backgroundColor: activeTypes.has('speed')
                ? 'var(--theme-accent)'
                : 'var(--theme-subAlt)',
              color: activeTypes.has('speed')
                ? 'var(--theme-bg)'
                : 'var(--theme-sub)',
              opacity: activeTypes.has('speed') ? 0.5 : 1,
            }}
          >
            Speed
          </button>
          <button
            onClick={() => toggleType('ao10')}
            className="rounded-md px-3 py-1.5 text-xs font-medium transition-colors"
            style={{
              backgroundColor: activeTypes.has('ao10')
                ? 'var(--theme-accent)'
                : 'var(--theme-subAlt)',
              color: activeTypes.has('ao10')
                ? 'var(--theme-bg)'
                : 'var(--theme-sub)',
              opacity: activeTypes.has('ao10') ? 0.7 : 1,
            }}
          >
            Avg of 10
          </button>
          <button
            onClick={() => toggleType('ao100')}
            className="rounded-md px-3 py-1.5 text-xs font-medium transition-colors"
            style={{
              backgroundColor: activeTypes.has('ao100')
                ? 'var(--theme-accent)'
                : 'var(--theme-subAlt)',
              color: activeTypes.has('ao100')
                ? 'var(--theme-bg)'
                : 'var(--theme-sub)',
              opacity: 1,
            }}
          >
            Avg of 100
          </button>
        </div>
      </div>

      <div className="h-48 sm:h-64">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="var(--theme-subAlt)"
              opacity={0.5}
            />
            <XAxis
              dataKey="index"
              tick={{ fill: 'var(--theme-sub)', fontSize: 10 }}
              tickLine={{ stroke: 'var(--theme-subAlt)' }}
              axisLine={{ stroke: 'var(--theme-subAlt)' }}
            />
            <YAxis
              tick={{ fill: 'var(--theme-sub)', fontSize: 10 }}
              tickLine={{ stroke: 'var(--theme-subAlt)' }}
              axisLine={{ stroke: 'var(--theme-subAlt)' }}
              tickFormatter={(value) => (value / 1000).toFixed(0) + 's'}
              domain={['dataMin - 1000', 'dataMax + 1000']}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: 'var(--theme-bg)',
                border: '1px solid var(--theme-subAlt)',
                borderRadius: '8px',
                fontSize: '12px',
                color: 'var(--theme-text)',
              }}
              itemStyle={{ color: 'var(--theme-text)' }}
              labelStyle={{ color: 'var(--theme-sub)' }}
              formatter={(value, name) => {
                if (value === undefined) return ['-', name]
                return [
                  formatTime(value as number),
                  name === 'time' ? 'Time' : name === 'ao10' ? 'Ao10' : 'Ao100',
                ]
              }}
              labelFormatter={(label) => `Solve #${label}`}
            />

            {activeTypes.has('speed') && (
              <Scatter
                dataKey="time"
                fill="var(--theme-accent)"
                opacity={0.4}
                shape="circle"
                legendType="none"
              />
            )}

            {activeTypes.has('ao10') && (
              <Line
                type="monotone"
                dataKey="ao10"
                stroke="var(--theme-accent)"
                strokeWidth={1.5}
                dot={false}
                opacity={0.65}
                connectNulls
              />
            )}

            {activeTypes.has('ao100') && (
              <Line
                type="monotone"
                dataKey="ao100"
                stroke="var(--theme-accent)"
                strokeWidth={2}
                dot={false}
                opacity={1}
                connectNulls
              />
            )}
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
