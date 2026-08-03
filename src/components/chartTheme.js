// Shared Recharts styling so every chart in the dashboard reads as one
// system rather than being styled ad hoc per component.

export const axisTick = { fill: 'var(--muted)', fontSize: 11, fontFamily: 'var(--font-mono)' }

export const axisLine = { stroke: 'var(--baseline)' }

// For x-axes with many categories (months/years/labels) that would
// otherwise overlap horizontally — spread onto <XAxis> alongside the usual
// dataKey/tick/axisLine/tickLine props. Angling needs extra bottom margin
// (see chartMarginAngled below) so rotated labels aren't clipped, and an
// explicit axis `height` so Recharts reserves room for them.
export const xAxisAngledProps = {
  angle: -35,
  textAnchor: 'end',
  height: 48,
}

// Drop-in replacement for a chart's `margin` prop when its XAxis uses
// xAxisAngledProps — same left/right/top as the common chart margin, but
// enough bottom space for angled labels to render without being cut off.
export const chartMarginAngled = { top: 4, right: 8, bottom: 24, left: -16 }

export const gridStroke = 'var(--gridline)'

export const tooltipCursor = { fill: 'var(--gridline)' }

export const tooltipContentStyle = {
  background: 'var(--surface-2)',
  border: '1px solid var(--border-strong)',
  borderRadius: 3,
  fontSize: 12,
  fontFamily: 'var(--font-mono)',
  padding: '0.5rem 0.65rem',
}

export const tooltipLabelStyle = {
  color: 'var(--text-primary)',
  fontFamily: 'var(--font-sans)',
  fontWeight: 600,
  marginBottom: 4,
}

// Recharts animates on mount by default; these just make the timing/easing
// consistent across bar/area/line charts instead of each using defaults.
export const chartAnimation = { animationDuration: 600, animationEasing: 'ease-out' }
