import * as React from "react"
import { cn } from "@/lib/utils"

export interface CircularProgressProps extends React.HTMLAttributes<HTMLDivElement> {
  value?: number
  size?: number
  strokeWidth?: number
  showLabel?: boolean
  renderLabel?: (value: number) => React.ReactNode
  progressClassName?: string
  progressBgClassName?: string
  labelClassName?: string
  min?: number
  max?: number
}

function CircularProgress({
  value = 0,
  size = 40,
  strokeWidth = 4,
  showLabel = false,
  renderLabel,
  progressClassName,
  progressBgClassName,
  labelClassName,
  className,
  min = 0,
  max = 100,
  ...props
}: CircularProgressProps) {
  const normalizedValue = Math.min(Math.max(value, min), max)
  const percentage = ((normalizedValue - min) / (max - min)) * 100

  const radius = (size - strokeWidth) / 2
  const circumference = 2 * Math.PI * radius
  const strokeDashoffset = circumference - (percentage / 100) * circumference

  return (
    <div
      data-slot="circular-progress"
      className={cn("relative inline-flex items-center justify-center shrink-0", className)}
      style={{ width: size, height: size }}
      {...props}
    >
      <svg
        className="w-full h-full -rotate-90 origin-center transition-transform"
        viewBox={`0 0 ${size} ${size}`}
      >
        {/* Background Track */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          strokeWidth={strokeWidth}
          className={cn("stroke-muted/40", progressBgClassName)}
        />
        {/* Progress Indicator */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          className={cn(
            "stroke-primary transition-all duration-500 ease-out",
            progressClassName
          )}
        />
      </svg>
      {showLabel && (
        <div
          className={cn(
            "absolute inset-0 flex items-center justify-center text-xs font-semibold",
            labelClassName
          )}
        >
          {renderLabel ? renderLabel(normalizedValue) : `${Math.round(percentage)}%`}
        </div>
      )}
    </div>
  )
}

export { CircularProgress }
