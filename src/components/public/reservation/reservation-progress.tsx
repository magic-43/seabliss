'use client'

import { CalendarDays, BedDouble, User, CreditCard, Check } from 'lucide-react'

interface ReservationProgressProps {
  currentStep: 1 | 2 | 3 | 4
  onStepClick?: (step: 1 | 2 | 3 | 4) => void
  disabled?: boolean
}

export default function ReservationProgress({
  currentStep,
  onStepClick,
  disabled = false,
}: ReservationProgressProps) {
  const steps = [
    { num: 1 as const, label: 'YOUR STAY', Icon: CalendarDays },
    { num: 2 as const, label: 'ROOM SELECTION', Icon: BedDouble },
    { num: 3 as const, label: 'GUEST DETAILS', Icon: User },
    { num: 4 as const, label: 'PAYMENT', Icon: CreditCard },
  ]

  return (
    <nav className="public-cielo-progress-bar" aria-label="Reservation progress">
      <div className="public-cielo-progress-inner">
        {steps.map((step, index) => {
          const isCompleted = currentStep > step.num
          const isCurrent = currentStep === step.num
          const isClickable = !disabled && (isCompleted || step.num < currentStep) && Boolean(onStepClick)
          const StepIcon = step.Icon

          return (
            <div key={step.num} className="public-cielo-progress-step-wrap">
              <button
                type="button"
                onClick={() => isClickable && onStepClick?.(step.num)}
                disabled={disabled || (!isClickable && !isCurrent)}
                aria-current={isCurrent ? 'step' : undefined}
                aria-label={`Step ${step.num}: ${step.label}`}
                className={
                  'public-cielo-progress-pill' +
                  (isCurrent ? ' is-current' : '') +
                  (isCompleted ? ' is-completed' : '') +
                  (!isCurrent && !isCompleted ? ' is-upcoming' : '')
                }
              >
                <span className="public-cielo-progress-badge" aria-hidden="true">
                  {isCompleted ? (
                    <Check size={14} strokeWidth={2.8} />
                  ) : (
                    <StepIcon size={14} strokeWidth={2.2} />
                  )}
                </span>
                <span className="public-cielo-progress-label">{step.label}</span>
              </button>

              {index < steps.length - 1 && (
                <div
                  className={
                    'public-cielo-progress-connector' +
                    (currentStep > step.num ? ' is-completed' : '')
                  }
                  aria-hidden="true"
                />
              )}
            </div>
          )
        })}
      </div>
    </nav>
  )
}
