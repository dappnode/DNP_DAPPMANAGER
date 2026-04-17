import React from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { Home } from "lucide-react";
import dappnodeLogo from "img/dappnode-logo-only.png";
import {
  SidebarProvider,
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarInset,
  SidebarTrigger,
  useSidebar
} from "components/primitives/sidebar";
import {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbPage,
  BreadcrumbSeparator
} from "components/primitives/breadcrumb";
import { ThemeToggle } from "components/ThemeToggle";
import { Toaster } from "components/primitives/sonner";
import { DecorativeBackground } from "./DecorativeBackground";

export interface NavItem {
  label: string;
  icon: React.ComponentType;
  path: string;
}

export interface SectionLayoutProps {
  /** Human-readable section name shown in sidebar subtitle & breadcrumb root (e.g. "AI"). */
  sectionLabel: string;
  /** Base path for this section (e.g. "/ai"). Used for breadcrumb root link. */
  basePath: string;
  /** Navigation items rendered in the sidebar. */
  navItems: NavItem[];
  /** Page content — typically a `<Routes>` block. */
  children: React.ReactNode;
}

/* ── Breadcrumb helper ──────────────────────────────────────────────── */

function getBreadcrumbItems(pathname: string, basePath: string): { label: string; to: string }[] {
  // Strip the basePath prefix, then split into segments
  const trimmed = pathname.startsWith(basePath) ? pathname.slice(basePath.length) : pathname;
  const segments = trimmed.split("/").filter(Boolean);
  // Normalize basePath so "/" doesn't produce double slashes
  const prefix = basePath === "/" ? "" : basePath;

  return segments.map((segment, index) => ({
    label: decodeURIComponent(segment),
    to: `${prefix}/${segments.slice(0, index + 1).join("/")}`
  }));
}

/* ── Sidebar brand header (collapse-aware) ──────────────────────────── */

function SidebarBrandHeader({ sectionLabel, onNavigateHome }: { sectionLabel: string; onNavigateHome: () => void }) {
  const { state } = useSidebar();
  const isCollapsed = state === "collapsed";

  return (
    <SidebarHeader>
      <SidebarMenu>
        <SidebarMenuItem>
          <SidebarMenuButton size="lg" onClick={onNavigateHome} tooltip="Back to Home">
            <div className="tw:flex tw:items-center tw:justify-center tw:size-8 tw:rounded-lg tw:bg-primary/10">
              <img className="tw:size-5" src={dappnodeLogo} alt="Dappnode" />
            </div>
            {!isCollapsed && (
              <div className="tw:flex tw:flex-col tw:gap-0.5 tw:leading-none">
                <span className="tw:font-semibold">Dappnode</span>
                <span className="tw:text-xs tw:text-muted-foreground">{sectionLabel}</span>
              </div>
            )}
          </SidebarMenuButton>
        </SidebarMenuItem>
      </SidebarMenu>
    </SidebarHeader>
  );
}

/* ── Layout ─────────────────────────────────────────────────────────── */

export function SectionLayout({ sectionLabel, basePath, navItems, children }: SectionLayoutProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const breadcrumbItems = getBreadcrumbItems(location.pathname, basePath);

  return (
    <div className="tw-base">
      <SidebarProvider>
        <Sidebar variant="sidebar" collapsible="icon">
          <SidebarBrandHeader sectionLabel={sectionLabel} onNavigateHome={() => navigate("/")} />

          {/* Navigation */}
          <SidebarContent>
            <SidebarGroup>
              <SidebarGroupLabel>Navigation</SidebarGroupLabel>
              <SidebarMenu>
                {navItems.map((item) => {
                  const isActive = location.pathname === item.path || location.pathname.startsWith(item.path + "/");
                  return (
                    <SidebarMenuItem key={item.path}>
                      <SidebarMenuButton isActive={isActive} onClick={() => navigate(item.path)} tooltip={item.label}>
                        <item.icon />
                        <span>{item.label}</span>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  );
                })}
              </SidebarMenu>
            </SidebarGroup>

            {basePath !== "/" && (
              <SidebarGroup className="tw:mt-auto">
                <SidebarMenu>
                  <SidebarMenuItem>
                    <SidebarMenuButton onClick={() => navigate("/")} tooltip="Back to Home">
                      <Home />
                      <span>Back to Home</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                </SidebarMenu>
              </SidebarGroup>
            )}
          </SidebarContent>
        </Sidebar>

        <SidebarInset>
          {/* Decorative orb background behind page content */}
          <DecorativeBackground />

          {/* Top bar */}
          <header className="tw:sticky tw:top-0 tw:z-10 tw:flex tw:h-topbar-h tw:shrink-0 tw:items-center tw:gap-2 tw:border-b tw:border-border tw:bg-background/80 tw:backdrop-blur-sm tw:px-page-x">
            <SidebarTrigger className="tw:-ml-1" />

            {/* Responsive breadcrumb */}
            <Breadcrumb className="tw:flex-1">
              {breadcrumbItems.length > 0 && (
                <BreadcrumbList>
                  <BreadcrumbItem className="tw:hidden tw:md:block">
                    <BreadcrumbLink asChild>
                      <Link to={basePath}>{sectionLabel}</Link>
                    </BreadcrumbLink>
                  </BreadcrumbItem>
                  {breadcrumbItems.map((item, index) => {
                    const isLast = index === breadcrumbItems.length - 1;
                    return (
                      <React.Fragment key={item.to}>
                        <BreadcrumbSeparator className="tw:hidden tw:md:block" />
                        <BreadcrumbItem>
                          {isLast ? (
                            <BreadcrumbPage>{item.label}</BreadcrumbPage>
                          ) : (
                            <BreadcrumbLink asChild>
                              <Link to={item.to}>{item.label}</Link>
                            </BreadcrumbLink>
                          )}
                        </BreadcrumbItem>
                      </React.Fragment>
                    );
                  })}
                </BreadcrumbList>
              )}
            </Breadcrumb>

            {/* Dark / light mode toggle */}
            <ThemeToggle />
          </header>

          {/* Page content */}
          <div className="tw:relative tw:flex-1">{children}</div>

          {/* Toast notifications */}
          <Toaster />
        </SidebarInset>
      </SidebarProvider>
    </div>
  );
}
