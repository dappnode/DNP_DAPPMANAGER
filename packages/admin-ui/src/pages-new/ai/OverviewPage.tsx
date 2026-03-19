import React, { useState } from "react";
import {
  Info,
  AlertTriangle,
  CheckCircle2,
  ChevronsUpDown,
  Star,
  FileText,
  Image,
  Inbox,
  Sparkles
} from "lucide-react";
import { toast } from "sonner";

/* ── Existing primitives ─────────────────────────────────────────── */
import { Button } from "components/primitives/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "components/primitives/card";
import { Input } from "components/primitives/input";
import { Separator } from "components/primitives/separator";
import {
  Sheet,
  SheetTrigger,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
  SheetClose
} from "components/primitives/sheet";
import { Skeleton } from "components/primitives/skeleton";
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from "components/primitives/tooltip";

/* ── New primitives ──────────────────────────────────────────────── */
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from "components/primitives/accordion";
import { Alert, AlertTitle, AlertDescription } from "components/primitives/alert";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger
} from "components/primitives/alert-dialog";
import { Badge } from "components/primitives/badge";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselPrevious,
  CarouselNext
} from "components/primitives/carousel";
import { Checkbox } from "components/primitives/checkbox";
import { Collapsible, CollapsibleTrigger, CollapsibleContent } from "components/primitives/collapsible";
import {
  ContextMenu,
  ContextMenuTrigger,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuCheckboxItem,
  ContextMenuRadioGroup,
  ContextMenuRadioItem,
  ContextMenuSub,
  ContextMenuSubTrigger,
  ContextMenuSubContent,
  ContextMenuLabel
} from "components/primitives/context-menu";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose
} from "components/primitives/dialog";
import {
  Drawer,
  DrawerTrigger,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
  DrawerFooter,
  DrawerClose
} from "components/primitives/drawer";
import { Empty, EmptyHeader, EmptyTitle, EmptyDescription, EmptyMedia } from "components/primitives/empty";
import { Field, FieldLabel, FieldDescription, FieldError, FieldSet } from "components/primitives/field";
import { Item, ItemMedia, ItemContent, ItemTitle, ItemDescription as ItemDesc } from "components/primitives/item";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationPrevious,
  PaginationNext,
  PaginationEllipsis
} from "components/primitives/pagination";
import { Progress } from "components/primitives/progress";
import { RadioGroup, RadioGroupItem } from "components/primitives/radio-group";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
  SelectGroup,
  SelectLabel
} from "components/primitives/select";
import { Slider } from "components/primitives/slider";
import { Spinner } from "components/primitives/spinner";
import { Switch } from "components/primitives/switch";
import { Label } from "components/primitives/label";
import {
  TypographyH1,
  TypographyH2,
  TypographyH3,
  TypographyH4,
  TypographyP,
  TypographyBlockquote,
  TypographyInlineCode,
  TypographyLead,
  TypographyLarge,
  TypographySmall,
  TypographyMuted
} from "components/primitives/typography";

/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */
/*  Helpers                                                            */
/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */

/** Section wrapper used for every component demo block */
function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="tw:flex tw:flex-col tw:gap-card">
      <h2 className="tw:text-xl tw:font-semibold tw:tracking-tight tw:text-foreground">{title}</h2>
      {children}
    </section>
  );
}

/** Wraps demo items in a flex row with wrapping */
function Row({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={`tw:flex tw:flex-wrap tw:items-center tw:gap-3 ${className ?? ""}`}>{children}</div>;
}

/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */
/*  Overview Page                                                      */
/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */

export function OverviewPage() {
  /* local state for interactive demos */
  const [progress, setProgress] = useState(45);
  const [sliderValue, setSliderValue] = useState([33]);
  const [checkboxA, setCheckboxA] = useState(true);
  const [checkboxB, setCheckboxB] = useState(false);
  const [switchOn, setSwitchOn] = useState(true);
  const [radioValue, setRadioValue] = useState("option-a");
  const [collapsibleOpen, setCollapsibleOpen] = useState(false);
  const [ctxCheck, setCtxCheck] = useState(true);
  const [ctxRadio, setCtxRadio] = useState("pedro");

  return (
    <TooltipProvider delayDuration={0}>
      <div className="tw:flex tw:flex-col tw:gap-section tw:px-page-x tw:py-page-y tw:max-w-content-max">
        {/* Page header */}
        <header>
          <h1 className="tw:text-3xl tw:font-bold tw:tracking-tight tw:text-foreground">AI Overview</h1>
          <p className="tw:mt-header-gap tw:text-muted-foreground tw:max-w-2xl">
            Component showcase — every shadcn primitive rendered with all its variants. Use this page to verify
            consistency across light and dark mode.
          </p>
        </header>

        <Separator />

        {/* ── Typography ─────────────────────────────────────────── */}
        <Section title="Typography">
          <TypographyH1>Heading 1</TypographyH1>
          <TypographyH2>Heading 2</TypographyH2>
          <TypographyH3>Heading 3</TypographyH3>
          <TypographyH4>Heading 4</TypographyH4>
          <TypographyP>
            This is a paragraph. The quick brown fox jumps over the lazy dog. Typography sets the tone for the entire
            interface and should feel balanced.
          </TypographyP>
          <TypographyLead>This is a lead paragraph — slightly larger and muted.</TypographyLead>
          <TypographyLarge>Large text for emphasis</TypographyLarge>
          <TypographySmall>Small text for fine print</TypographySmall>
          <TypographyMuted>Muted text for secondary information</TypographyMuted>
          <TypographyBlockquote>"Decentralise everything" — this is a blockquote.</TypographyBlockquote>
          <TypographyP>
            Use <TypographyInlineCode>inline code</TypographyInlineCode> for code references.
          </TypographyP>
        </Section>

        <Separator />

        {/* ── Button ─────────────────────────────────────────────── */}
        <Section title="Button">
          <p className="tw:text-sm tw:text-muted-foreground">Variants</p>
          <Row>
            <Button variant="default">Default</Button>
            <Button variant="secondary">Secondary</Button>
            <Button variant="outline">Outline</Button>
            <Button variant="ghost">Ghost</Button>
            <Button variant="destructive">Destructive</Button>
            <Button variant="link">Link</Button>
          </Row>
          <p className="tw:text-sm tw:text-muted-foreground tw:mt-2">Sizes</p>
          <Row>
            <Button size="xs">Extra Small</Button>
            <Button size="sm">Small</Button>
            <Button size="default">Default</Button>
            <Button size="lg">Large</Button>
            <Button size="icon">
              <Star className="tw:size-4" />
            </Button>
            <Button size="icon-xs">
              <Star />
            </Button>
            <Button size="icon-sm">
              <Star />
            </Button>
            <Button size="icon-lg">
              <Star />
            </Button>
          </Row>
          <p className="tw:text-sm tw:text-muted-foreground tw:mt-2">States</p>
          <Row>
            <Button disabled>Disabled</Button>
            <Button>
              <Sparkles /> With Icon
            </Button>
          </Row>
        </Section>

        <Separator />

        {/* ── Badge ──────────────────────────────────────────────── */}
        <Section title="Badge">
          <Row>
            <Badge variant="default">Default</Badge>
            <Badge variant="secondary">Secondary</Badge>
            <Badge variant="destructive">Destructive</Badge>
            <Badge variant="success">Success</Badge>
            <Badge variant="caution">Caution</Badge>
            <Badge variant="outline">Outline</Badge>
          </Row>
        </Section>

        <Separator />

        {/* ── Card ───────────────────────────────────────────────── */}
        <Section title="Card">
          <div className="tw:grid tw:grid-cols-1 tw:md:grid-cols-2 tw:gap-card">
            <Card>
              <CardHeader>
                <CardTitle>Card Title</CardTitle>
                <CardDescription>Card description with supporting text.</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="tw:text-sm tw:text-muted-foreground">Body content goes here.</p>
              </CardContent>
              <CardFooter>
                <Button size="sm">Action</Button>
              </CardFooter>
            </Card>

            <Card className="tw:border-destructive/50">
              <CardHeader>
                <CardTitle className="tw:text-destructive">Error Card</CardTitle>
                <CardDescription>Something went wrong.</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="tw:text-sm tw:text-destructive/80">Please check your configuration.</p>
              </CardContent>
            </Card>
          </div>
        </Section>

        <Separator />

        {/* ── Input ──────────────────────────────────────────────── */}
        <Section title="Input">
          <Row>
            <Input placeholder="Default input" className="tw:max-w-xs" />
            <Input placeholder="Disabled" disabled className="tw:max-w-xs" />
            <Input type="password" placeholder="Password" className="tw:max-w-xs" />
          </Row>
        </Section>

        <Separator />

        {/* ── Separator ──────────────────────────────────────────── */}
        <Section title="Separator">
          <div className="tw:space-y-2">
            <p className="tw:text-sm tw:text-muted-foreground">Horizontal (default)</p>
            <Separator />
            <p className="tw:text-sm tw:text-muted-foreground">Vertical</p>
            <div className="tw:flex tw:h-6 tw:items-center tw:gap-4">
              <span className="tw:text-sm">Left</span>
              <Separator orientation="vertical" />
              <span className="tw:text-sm">Right</span>
            </div>
          </div>
        </Section>

        <Separator />

        {/* ── Skeleton ───────────────────────────────────────────── */}
        <Section title="Skeleton">
          <div className="tw:flex tw:items-center tw:gap-4">
            <Skeleton className="tw:size-12 tw:rounded-full" />
            <div className="tw:space-y-2">
              <Skeleton className="tw:h-4 tw:w-[250px]" />
              <Skeleton className="tw:h-4 tw:w-[200px]" />
            </div>
          </div>
        </Section>

        <Separator />

        {/* ── Tooltip ────────────────────────────────────────────── */}
        <Section title="Tooltip">
          <Row>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="outline">Hover me</Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Tooltip content</p>
              </TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon">
                  <Info className="tw:size-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="right">
                <p>Info tooltip (right)</p>
              </TooltipContent>
            </Tooltip>
          </Row>
        </Section>

        <Separator />

        {/* ── Accordion ──────────────────────────────────────────── */}
        <Section title="Accordion">
          <Accordion type="single" collapsible className="tw:w-full tw:max-w-lg">
            <AccordionItem value="item-1">
              <AccordionTrigger>Is it accessible?</AccordionTrigger>
              <AccordionContent>Yes. It adheres to the WAI-ARIA design pattern.</AccordionContent>
            </AccordionItem>
            <AccordionItem value="item-2">
              <AccordionTrigger>Is it styled?</AccordionTrigger>
              <AccordionContent>Yes. It comes with default styles using Tailwind.</AccordionContent>
            </AccordionItem>
            <AccordionItem value="item-3">
              <AccordionTrigger>Is it animated?</AccordionTrigger>
              <AccordionContent>Yes. Transitions are built in.</AccordionContent>
            </AccordionItem>
          </Accordion>
        </Section>

        <Separator />

        {/* ── Alert ──────────────────────────────────────────────── */}
        <Section title="Alert">
          <div className="tw:flex tw:flex-col tw:gap-3 tw:max-w-lg">
            <Alert variant="default">
              <Info className="tw:size-4" />
              <AlertTitle>Default Alert</AlertTitle>
              <AlertDescription>This is an informational alert message.</AlertDescription>
            </Alert>
            <Alert variant="destructive">
              <AlertTriangle className="tw:size-4" />
              <AlertTitle>Destructive Alert</AlertTitle>
              <AlertDescription>Something went wrong. Please try again.</AlertDescription>
            </Alert>
          </div>
        </Section>

        <Separator />

        {/* ── Alert Dialog ───────────────────────────────────────── */}
        <Section title="Alert Dialog">
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive">Delete Account</Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                <AlertDialogDescription>
                  This action cannot be undone. This will permanently delete your account and remove your data from our
                  servers.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction>Continue</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </Section>

        <Separator />

        {/* ── Carousel ───────────────────────────────────────────── */}
        <Section title="Carousel">
          <Carousel className="tw:w-full tw:max-w-sm tw:mx-auto">
            <CarouselContent>
              {Array.from({ length: 5 }).map((_, index) => (
                <CarouselItem key={index}>
                  <Card>
                    <CardContent className="tw:flex tw:aspect-square tw:items-center tw:justify-center tw:p-6">
                      <span className="tw:text-4xl tw:font-semibold">{index + 1}</span>
                    </CardContent>
                  </Card>
                </CarouselItem>
              ))}
            </CarouselContent>
            <CarouselPrevious />
            <CarouselNext />
          </Carousel>
        </Section>

        <Separator />

        {/* ── Checkbox ───────────────────────────────────────────── */}
        <Section title="Checkbox">
          <div className="tw:flex tw:flex-col tw:gap-3">
            <div className="tw:flex tw:items-center tw:gap-2">
              <Checkbox id="cb-a" checked={checkboxA} onCheckedChange={(v) => setCheckboxA(!!v)} />
              <Label htmlFor="cb-a">Accept terms and conditions (checked)</Label>
            </div>
            <div className="tw:flex tw:items-center tw:gap-2">
              <Checkbox id="cb-b" checked={checkboxB} onCheckedChange={(v) => setCheckboxB(!!v)} />
              <Label htmlFor="cb-b">Subscribe to newsletter (unchecked)</Label>
            </div>
            <div className="tw:flex tw:items-center tw:gap-2">
              <Checkbox id="cb-disabled" disabled />
              <Label htmlFor="cb-disabled" className="tw:text-muted-foreground">
                Disabled checkbox
              </Label>
            </div>
          </div>
        </Section>

        <Separator />

        {/* ── Collapsible ────────────────────────────────────────── */}
        <Section title="Collapsible">
          <Collapsible open={collapsibleOpen} onOpenChange={setCollapsibleOpen} className="tw:max-w-sm tw:space-y-2">
            <div className="tw:flex tw:items-center tw:justify-between tw:gap-4 tw:rounded-md tw:border tw:border-border tw:px-4 tw:py-3">
              <h4 className="tw:text-sm tw:font-semibold">@dappnode/toolkit has 3 repositories</h4>
              <CollapsibleTrigger asChild>
                <Button variant="ghost" size="icon-sm">
                  <ChevronsUpDown className="tw:size-4" />
                  <span className="tw:sr-only">Toggle</span>
                </Button>
              </CollapsibleTrigger>
            </div>
            <div className="tw:rounded-md tw:border tw:border-border tw:px-4 tw:py-3 tw:text-sm">@dappnode/types</div>
            <CollapsibleContent className="tw:space-y-2">
              <div className="tw:rounded-md tw:border tw:border-border tw:px-4 tw:py-3 tw:text-sm">
                @dappnode/common
              </div>
              <div className="tw:rounded-md tw:border tw:border-border tw:px-4 tw:py-3 tw:text-sm">
                @dappnode/toolkit
              </div>
            </CollapsibleContent>
          </Collapsible>
        </Section>

        <Separator />

        {/* ── Context Menu ───────────────────────────────────────── */}
        <Section title="Context Menu">
          <ContextMenu>
            <ContextMenuTrigger className="tw:flex tw:h-36 tw:w-72 tw:items-center tw:justify-center tw:rounded-md tw:border tw:border-dashed tw:text-sm tw:text-muted-foreground">
              Right click here
            </ContextMenuTrigger>
            <ContextMenuContent className="tw:w-64">
              <ContextMenuItem>
                Back <span className="tw:ml-auto tw:text-xs tw:text-muted-foreground">⌘[</span>
              </ContextMenuItem>
              <ContextMenuItem disabled>
                Forward <span className="tw:ml-auto tw:text-xs tw:text-muted-foreground">⌘]</span>
              </ContextMenuItem>
              <ContextMenuItem>
                Reload <span className="tw:ml-auto tw:text-xs tw:text-muted-foreground">⌘R</span>
              </ContextMenuItem>
              <ContextMenuSub>
                <ContextMenuSubTrigger>More Tools</ContextMenuSubTrigger>
                <ContextMenuSubContent className="tw:w-48">
                  <ContextMenuItem>
                    Save Page As… <span className="tw:ml-auto tw:text-xs tw:text-muted-foreground">⇧⌘S</span>
                  </ContextMenuItem>
                  <ContextMenuItem>Create Shortcut…</ContextMenuItem>
                  <ContextMenuItem>Name Window…</ContextMenuItem>
                  <ContextMenuSeparator />
                  <ContextMenuItem>Developer Tools</ContextMenuItem>
                </ContextMenuSubContent>
              </ContextMenuSub>
              <ContextMenuSeparator />
              <ContextMenuCheckboxItem checked={ctxCheck} onCheckedChange={setCtxCheck}>
                Show Bookmarks Bar <span className="tw:ml-auto tw:text-xs tw:text-muted-foreground">⇧⌘B</span>
              </ContextMenuCheckboxItem>
              <ContextMenuCheckboxItem>Show Full URLs</ContextMenuCheckboxItem>
              <ContextMenuSeparator />
              <ContextMenuLabel>People</ContextMenuLabel>
              <ContextMenuRadioGroup value={ctxRadio} onValueChange={setCtxRadio}>
                <ContextMenuRadioItem value="pedro">Pedro Duarte</ContextMenuRadioItem>
                <ContextMenuRadioItem value="colm">Colm Tuite</ContextMenuRadioItem>
              </ContextMenuRadioGroup>
            </ContextMenuContent>
          </ContextMenu>
        </Section>

        <Separator />

        {/* ── Dialog ─────────────────────────────────────────────── */}
        <Section title="Dialog">
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="outline">Open Dialog</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Edit profile</DialogTitle>
                <DialogDescription>Make changes to your profile here. Click save when you're done.</DialogDescription>
              </DialogHeader>
              <div className="tw:grid tw:gap-4 tw:py-4">
                <div className="tw:grid tw:grid-cols-4 tw:items-center tw:gap-4">
                  <Label htmlFor="dialog-name" className="tw:text-right tw:text-foreground">
                    Name
                  </Label>
                  <Input id="dialog-name" defaultValue="DAppNode" className="tw:col-span-3" />
                </div>
                <div className="tw:grid tw:grid-cols-4 tw:items-center tw:gap-4">
                  <Label htmlFor="dialog-user" className="tw:text-right tw:text-foreground">
                    Username
                  </Label>
                  <Input id="dialog-user" defaultValue="@dappnode" className="tw:col-span-3" />
                </div>
              </div>
              <DialogFooter>
                <DialogClose asChild>
                  <Button variant="outline">Cancel</Button>
                </DialogClose>
                <Button>Save changes</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </Section>

        <Separator />

        {/* ── Drawer ─────────────────────────────────────────────── */}
        <Section title="Drawer">
          <Drawer>
            <DrawerTrigger asChild>
              <Button variant="outline">Open Drawer</Button>
            </DrawerTrigger>
            <DrawerContent>
              <DrawerHeader>
                <DrawerTitle>Move Goal</DrawerTitle>
                <DrawerDescription>Set your daily activity goal.</DrawerDescription>
              </DrawerHeader>
              <div className="tw:px-4 tw:pb-4">
                <div className="tw:flex tw:items-center tw:justify-center tw:gap-4 tw:py-8">
                  <Button variant="outline" size="icon" onClick={() => setProgress((p) => Math.max(0, p - 10))}>
                    -
                  </Button>
                  <span className="tw:text-5xl tw:font-bold tw:tabular-nums">{progress}</span>
                  <Button variant="outline" size="icon" onClick={() => setProgress((p) => Math.min(100, p + 10))}>
                    +
                  </Button>
                </div>
                <Progress value={progress} className="tw:w-full" />
              </div>
              <DrawerFooter>
                <Button>Submit</Button>
                <DrawerClose asChild>
                  <Button variant="outline">Cancel</Button>
                </DrawerClose>
              </DrawerFooter>
            </DrawerContent>
          </Drawer>
        </Section>

        <Separator />

        <Separator />

        {/* ── Empty ──────────────────────────────────────────────── */}
        <Section title="Empty">
          <Card className="tw:max-w-sm">
            <CardContent className="tw:py-8">
              <Empty>
                <EmptyMedia>
                  <Inbox className="tw:size-8 tw:text-muted-foreground" />
                </EmptyMedia>
                <EmptyHeader>
                  <EmptyTitle>No packages found</EmptyTitle>
                  <EmptyDescription>Install a package from the Store to get started.</EmptyDescription>
                </EmptyHeader>
              </Empty>
            </CardContent>
          </Card>
        </Section>

        <Separator />

        {/* ── Field ──────────────────────────────────────────────── */}
        <Section title="Field">
          <FieldSet className="tw:max-w-sm">
            <Field>
              <FieldLabel htmlFor="field-name">Display Name</FieldLabel>
              <Input id="field-name" placeholder="Enter your name" />
              <FieldDescription>This is your public display name.</FieldDescription>
            </Field>
            <Field>
              <FieldLabel htmlFor="field-email">Email</FieldLabel>
              <Input id="field-email" type="email" placeholder="user@example.com" />
              <FieldError>Please enter a valid email address.</FieldError>
            </Field>
          </FieldSet>
        </Section>

        <Separator />

        <Separator />

        {/* ── Item ───────────────────────────────────────────────── */}
        <Section title="Item">
          <div className="tw:flex tw:flex-col tw:gap-2 tw:max-w-lg">
            <Item variant="default">
              <ItemMedia>
                <FileText className="tw:size-5" />
              </ItemMedia>
              <ItemContent>
                <ItemTitle>Default Item</ItemTitle>
                <ItemDesc>A simple item with default variant.</ItemDesc>
              </ItemContent>
            </Item>
            <Item variant="outline">
              <ItemMedia>
                <Image className="tw:size-5" />
              </ItemMedia>
              <ItemContent>
                <ItemTitle>Outline Item</ItemTitle>
                <ItemDesc>Item with a border outline.</ItemDesc>
              </ItemContent>
            </Item>
            <Item variant="muted">
              <ItemMedia>
                <Star className="tw:size-5" />
              </ItemMedia>
              <ItemContent>
                <ItemTitle>Muted Item</ItemTitle>
                <ItemDesc>A muted background item.</ItemDesc>
              </ItemContent>
            </Item>
          </div>
        </Section>

        <Separator />

        {/* ── Pagination ─────────────────────────────────────────── */}
        <Section title="Pagination">
          <Pagination>
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious href="#" />
              </PaginationItem>
              <PaginationItem>
                <PaginationLink href="#" isActive>
                  1
                </PaginationLink>
              </PaginationItem>
              <PaginationItem>
                <PaginationLink href="#">2</PaginationLink>
              </PaginationItem>
              <PaginationItem>
                <PaginationLink href="#">3</PaginationLink>
              </PaginationItem>
              <PaginationItem>
                <PaginationEllipsis />
              </PaginationItem>
              <PaginationItem>
                <PaginationNext href="#" />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        </Section>

        <Separator />

        {/* ── Progress ───────────────────────────────────────────── */}
        <Section title="Progress">
          <div className="tw:flex tw:flex-col tw:gap-3 tw:max-w-sm">
            <Progress value={0} />
            <Progress value={25} />
            <Progress value={50} />
            <Progress value={75} />
            <Progress value={100} />
          </div>
        </Section>

        <Separator />

        {/* ── Radio Group ────────────────────────────────────────── */}
        <Section title="Radio Group">
          <RadioGroup value={radioValue} onValueChange={setRadioValue}>
            <div className="tw:flex tw:items-center tw:gap-2">
              <RadioGroupItem value="option-a" id="r-a" />
              <Label htmlFor="r-a">Option A</Label>
            </div>
            <div className="tw:flex tw:items-center tw:gap-2">
              <RadioGroupItem value="option-b" id="r-b" />
              <Label htmlFor="r-b">Option B</Label>
            </div>
            <div className="tw:flex tw:items-center tw:gap-2">
              <RadioGroupItem value="option-c" id="r-c" />
              <Label htmlFor="r-c">Option C</Label>
            </div>
          </RadioGroup>
        </Section>

        <Separator />

        {/* ── Select ─────────────────────────────────────────────── */}
        <Section title="Select">
          <div className="tw:max-w-xs">
            <Select>
              <SelectTrigger>
                <SelectValue placeholder="Select a fruit" />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  <SelectLabel>Fruits</SelectLabel>
                  <SelectItem value="apple">Apple</SelectItem>
                  <SelectItem value="banana">Banana</SelectItem>
                  <SelectItem value="cherry">Cherry</SelectItem>
                </SelectGroup>
                <SelectGroup>
                  <SelectLabel>Vegetables</SelectLabel>
                  <SelectItem value="carrot">Carrot</SelectItem>
                  <SelectItem value="celery">Celery</SelectItem>
                </SelectGroup>
              </SelectContent>
            </Select>
          </div>
        </Section>

        <Separator />

        {/* ── Sheet ──────────────────────────────────────────────── */}
        <Section title="Sheet">
          <Row>
            {(["top", "right", "bottom", "left"] as const).map((side) => (
              <Sheet key={side}>
                <SheetTrigger asChild>
                  <Button variant="outline">{side}</Button>
                </SheetTrigger>
                <SheetContent side={side}>
                  <SheetHeader>
                    <SheetTitle>Sheet — {side}</SheetTitle>
                    <SheetDescription>This sheet slides in from the {side}.</SheetDescription>
                  </SheetHeader>
                  <div className="tw:py-4 tw:px-4">
                    <p className="tw:text-sm tw:text-muted-foreground">Sheet content goes here.</p>
                  </div>
                  <SheetFooter>
                    <SheetClose asChild>
                      <Button variant="outline">Close</Button>
                    </SheetClose>
                  </SheetFooter>
                </SheetContent>
              </Sheet>
            ))}
          </Row>
        </Section>

        <Separator />

        {/* ── Slider ─────────────────────────────────────────────── */}
        <Section title="Slider">
          <div className="tw:flex tw:flex-col tw:gap-4 tw:max-w-sm">
            <div>
              <p className="tw:text-sm tw:text-muted-foreground tw:mb-2">Value: {sliderValue[0]}</p>
              <Slider value={sliderValue} onValueChange={setSliderValue} max={100} step={1} />
            </div>
            <div>
              <p className="tw:text-sm tw:text-muted-foreground tw:mb-2">Disabled</p>
              <Slider defaultValue={[50]} max={100} step={1} disabled />
            </div>
          </div>
        </Section>

        <Separator />

        {/* ── Spinner ────────────────────────────────────────────── */}
        <Section title="Spinner">
          <Row>
            <Spinner className="tw:size-4" />
            <Spinner className="tw:size-6" />
            <Spinner className="tw:size-8" />
            <Spinner className="tw:size-8 tw:text-primary" />
            <Spinner className="tw:size-8 tw:text-destructive" />
          </Row>
        </Section>

        <Separator />

        {/* ── Switch ─────────────────────────────────────────────── */}
        <Section title="Switch">
          <div className="tw:flex tw:flex-col tw:gap-3">
            <div className="tw:flex tw:items-center tw:gap-2">
              <Switch id="sw-a" checked={switchOn} onCheckedChange={setSwitchOn} />
              <Label htmlFor="sw-a">Airplane Mode ({switchOn ? "on" : "off"})</Label>
            </div>
            <div className="tw:flex tw:items-center tw:gap-2">
              <Switch id="sw-disabled" disabled />
              <Label htmlFor="sw-disabled" className="tw:text-muted-foreground">
                Disabled
              </Label>
            </div>
          </div>
        </Section>

        <Separator />

        {/* ── Sonner (Toast trigger) ─────────────────────────────── */}
        <Section title="Sonner (Toast)">
          <p className="tw:text-sm tw:text-muted-foreground">
            The <TypographyInlineCode>{"<Toaster />"}</TypographyInlineCode> component is in the AI layout. Each toast
            type has its own color variant using design tokens.
          </p>
          <Row>
            <Button
              onClick={() => toast.success("Package installed", { description: "DMS v1.2.3 is now running." })}
              variant="outline"
            >
              <CheckCircle2 className="tw:size-4 tw:mr-1" /> Success
            </Button>
            <Button
              onClick={() => toast.error("Installation failed", { description: "Could not reach IPFS gateway." })}
              variant="outline"
            >
              <AlertTriangle className="tw:size-4 tw:mr-1" /> Error
            </Button>
            <Button
              onClick={() => toast.warning("Disk space low", { description: "Only 2 GB remaining on /dev/sda1." })}
              variant="outline"
            >
              <AlertTriangle className="tw:size-4 tw:mr-1" /> Warning
            </Button>
            <Button
              onClick={() => toast.info("Update available", { description: "A new version is available." })}
              variant="outline"
            >
              <Info className="tw:size-4 tw:mr-1" /> Info
            </Button>
            <Button
              onClick={() => toast("Default toast", { description: "This is a default notification." })}
              variant="outline"
            >
              Default
            </Button>
          </Row>
        </Section>

        {/* Bottom spacer */}
        <div className="tw:h-8" />
      </div>
    </TooltipProvider>
  );
}
