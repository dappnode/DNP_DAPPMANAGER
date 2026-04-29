import * as React from "react";
import { CornerDownLeft, Search } from "lucide-react";
import { cn } from "lib/utils";
import { Input } from "./input";

interface SearchBarProps extends Omit<React.ComponentProps<"div">, "onChange"> {
  value?: string;
  onChange?: React.ChangeEventHandler<HTMLInputElement>;
  onEnter?: () => void;
  placeholder?: string;
  showEnterHint?: boolean;
}

function SearchBar({
  value,
  onChange,
  onEnter,
  placeholder,
  showEnterHint,
  className,
  ...props
}: SearchBarProps) {
  return (
    <div role="search" data-slot="search" className={cn("tw:relative", className)} {...props}>
      <Search aria-hidden="true" className="tw:pointer-events-none tw:absolute tw:left-3 tw:top-1/2 tw:-translate-y-1/2 tw:size-4 tw:text-muted-foreground" />
      <Input
        value={value}
        onChange={onChange}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            onEnter?.();
          }
        }}
        placeholder={placeholder}
        aria-keyshortcuts={showEnterHint ? "Enter" : undefined}
        className={cn(
          "tw:h-10 tw:bg-background tw:pl-9 tw:shadow-sm tw:dark:bg-input/50",
          showEnterHint && "tw:pr-28"
        )}
      />
      {showEnterHint && (
        <span
          aria-hidden="true"
          className="tw:absolute tw:right-3 tw:top-1/2 tw:-translate-y-1/2 tw:flex tw:items-center tw:gap-1 tw:text-xs tw:text-muted-foreground tw:pointer-events-none"
        >
          Press <CornerDownLeft aria-hidden="true" className="tw:size-3" /> to open
        </span>
      )}
    </div>
  );
}

export { SearchBar };
