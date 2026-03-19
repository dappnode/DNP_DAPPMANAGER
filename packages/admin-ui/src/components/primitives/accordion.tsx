import * as React from "react";
import { Accordion as AccordionPrimitive } from "radix-ui";

import { cn } from "lib/utils";
import { ChevronDownIcon, ChevronUpIcon } from "lucide-react";

function Accordion({ className, ...props }: React.ComponentProps<typeof AccordionPrimitive.Root>) {
  return (
    <AccordionPrimitive.Root
      data-slot="accordion"
      className={cn("tw:flex tw:w-full tw:flex-col", className)}
      {...props}
    />
  );
}

function AccordionItem({ className, ...props }: React.ComponentProps<typeof AccordionPrimitive.Item>) {
  return (
    <AccordionPrimitive.Item
      data-slot="accordion-item"
      className={cn("tw:not-last:border-b tw:border-border", className)}
      {...props}
    />
  );
}

function AccordionTrigger({ className, children, ...props }: React.ComponentProps<typeof AccordionPrimitive.Trigger>) {
  return (
    <AccordionPrimitive.Header className="tw:flex">
      <AccordionPrimitive.Trigger
        data-slot="accordion-trigger"
        className={cn(
          "tw:group/accordion-trigger tw:relative tw:flex tw:flex-1 tw:items-start tw:justify-between tw:rounded-lg tw:border tw:border-transparent tw:py-2.5 tw:text-left tw:text-sm tw:font-medium tw:text-foreground tw:transition-all tw:outline-none tw:hover:underline tw:focus-visible:border-ring tw:focus-visible:ring-3 tw:focus-visible:ring-ring/50 tw:focus-visible:after:border-ring tw:disabled:pointer-events-none tw:disabled:opacity-50 tw:**:data-[slot=accordion-trigger-icon]:ml-auto tw:**:data-[slot=accordion-trigger-icon]:size-4 tw:**:data-[slot=accordion-trigger-icon]:text-muted-foreground",
          className
        )}
        {...props}
      >
        {children}
        <ChevronDownIcon
          data-slot="accordion-trigger-icon"
          className="tw:pointer-events-none tw:shrink-0 tw:group-aria-expanded/accordion-trigger:hidden"
        />
        <ChevronUpIcon
          data-slot="accordion-trigger-icon"
          className="tw:pointer-events-none tw:hidden tw:shrink-0 tw:group-aria-expanded/accordion-trigger:inline"
        />
      </AccordionPrimitive.Trigger>
    </AccordionPrimitive.Header>
  );
}

function AccordionContent({ className, children, ...props }: React.ComponentProps<typeof AccordionPrimitive.Content>) {
  return (
    <AccordionPrimitive.Content
      data-slot="accordion-content"
      className="tw:overflow-hidden tw:text-sm tw:text-foreground tw:data-[state=open]:animate-accordion-down tw:data-[state=closed]:animate-accordion-up"
      {...props}
    >
      <div
        className={cn(
          "tw:h-(--radix-accordion-content-height) tw:pt-0 tw:pb-2.5 tw:[&_a]:underline tw:[&_a]:underline-offset-3 tw:[&_a]:hover:text-foreground tw:[&_p:not(:last-child)]:mb-4",
          className
        )}
      >
        {children}
      </div>
    </AccordionPrimitive.Content>
  );
}

export { Accordion, AccordionItem, AccordionTrigger, AccordionContent };
