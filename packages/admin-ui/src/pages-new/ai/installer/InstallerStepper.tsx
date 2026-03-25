import React from "react";
import { cn } from "lib/utils";
import { Check } from "lucide-react";

interface InstallerStepperProps {
  steps: string[];
  currentIndex: number;
}

export function InstallerStepper({ steps, currentIndex }: InstallerStepperProps) {
  return (
    <nav aria-label="Installation progress">
      {/* Segmented pill container */}
      <div className="tw:inline-flex tw:items-center tw:rounded-full tw:bg-muted tw:p-1 tw:gap-1">
        {steps.map((step, i) => {
          const isCompleted = i < currentIndex;
          const isActive = i === currentIndex;

          return (
            <div
              key={step}
              className={cn(
                "tw:flex tw:items-center tw:gap-1.5 tw:rounded-full tw:px-3 tw:py-1.5 tw:text-xs tw:font-medium tw:transition-all tw:duration-200",
                isActive && "tw:bg-background tw:text-foreground tw:shadow-sm",
                isCompleted && "tw:text-primary",
                !isCompleted && !isActive && "tw:text-muted-foreground"
              )}
            >
              <span
                className={cn(
                  "tw:flex tw:size-5 tw:shrink-0 tw:items-center tw:justify-center tw:rounded-full tw:text-[10px] tw:font-bold tw:leading-none",
                  isCompleted && "tw:bg-primary tw:text-primary-foreground",
                  isActive && "tw:bg-primary/15 tw:text-primary tw:ring-1 tw:ring-primary/40",
                  !isCompleted && !isActive && "tw:bg-muted-foreground/20 tw:text-muted-foreground"
                )}
              >
                {isCompleted ? <Check className="tw:size-3" strokeWidth={3} /> : i + 1}
              </span>
              <span className="tw:hidden tw:sm:inline">{step}</span>
            </div>
          );
        })}
      </div>

      {/* Overall progress bar */}
      <div className="tw:mt-2 tw:h-1 tw:rounded-full tw:bg-muted tw:overflow-hidden">
        <div
          className="tw:h-full tw:rounded-full tw:bg-primary tw:transition-all tw:duration-500 tw:ease-out"
          style={{
            width: `${steps.length > 1 ? (currentIndex / (steps.length - 1)) * 100 : 0}%`
          }}
        />
      </div>
    </nav>
  );
}
