import React from "react";
import { Routes, Route, useNavigate, useLocation, Link } from "react-router-dom";
import { Sparkles, ShoppingBag, Package, Home, Globe } from "lucide-react";
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
import { Separator } from "components/primitives/separator";
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
import { DecorativeBackground } from "pages-new/layouts";
import { OverviewPage } from "./OverviewPage";
import { StorePage } from "./store/StorePage";
import { PackagesPage } from "./packages/PackagesPage";
import { PackageDetailPage } from "./packages/PackageDetailPage";
import { InstallerPage } from "./installer/InstallerPage";
import { NexusPage } from "./nexus/NexusPage";
import { storeRelativePath } from "./store/data";
import { packagesRelativePath } from "./packages/data";
import { nexusRelativePath } from "./nexus/data";

/* ── Navigation items ───────────────────────────────────────────────── */

const navItems = [
  { label: "Overview", icon: Sparkles, path: "/ai" },
  { label: "Store", icon: ShoppingBag, path: storeRelativePath },
  { label: "Packages", icon: Package, path: packagesRelativePath },
  { label: "Nexus", icon: Globe, path: nexusRelativePath }
];

function getBreadcrumbItems(pathname: string): { label: string; to: string }[] {
  const segments = pathname.split("/").filter(Boolean);
  const aiIndex = segments.indexOf("ai");
  if (aiIndex === -1) return [];

  const relevantSegments = segments.slice(aiIndex + 1);

  return relevantSegments.map((segment, index) => ({
    label: decodeURIComponent(segment),
    to: `/ai/${relevantSegments.slice(0, index + 1).join("/")}`
  }));
}

/* ── Sidebar brand header (collapse-aware) ──────────────────────────── */

function SidebarBrandHeader({ onNavigateHome }: { onNavigateHome: () => void }) {
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
                <span className="tw:text-xs tw:text-muted-foreground">AI</span>
              </div>
            )}
          </SidebarMenuButton>
        </SidebarMenuItem>
      </SidebarMenu>
    </SidebarHeader>
  );
}

/* ── Layout ─────────────────────────────────────────────────────────── */

export function AiLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const breadcrumbItems = getBreadcrumbItems(location.pathname);

  return (
    <div className="tw-base">
      <SidebarProvider>
        <Sidebar variant="sidebar" collapsible="icon">
          <SidebarBrandHeader onNavigateHome={() => navigate("/")} />

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
          </SidebarContent>
        </Sidebar>

        <SidebarInset>
          {/* Decorative orb background behind page content */}
          <DecorativeBackground />

          {/* Top bar */}
          <header className="tw:sticky tw:top-0 tw:z-10 tw:flex tw:h-topbar-h tw:shrink-0 tw:items-center tw:gap-2 tw:border-b tw:border-border tw:bg-background/80 tw:backdrop-blur-sm tw:px-page-x">
            <SidebarTrigger className="tw:-ml-1" />
            <Separator orientation="vertical" className="tw:mr-2 tw:!h-4" />

            {/* Responsive breadcrumb */}
            <Breadcrumb className="tw:flex-1">
              <BreadcrumbList>
                <BreadcrumbItem className="tw:hidden tw:md:block">
                  <BreadcrumbLink asChild>
                    <Link to="/ai">AI</Link>
                  </BreadcrumbLink>
                </BreadcrumbItem>
                {breadcrumbItems.length > 0 ? (
                  breadcrumbItems.map((item, index) => {
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
                  })
                ) : (
                  <BreadcrumbItem className="tw:md:hidden">
                    <BreadcrumbPage>AI</BreadcrumbPage>
                  </BreadcrumbItem>
                )}
              </BreadcrumbList>
            </Breadcrumb>

            {/* Dark / light mode toggle */}
            <ThemeToggle />
          </header>

          {/* Page content */}
          <div className="tw:relative tw:flex-1">
            <Routes>
              <Route index element={<OverviewPage />} />
              <Route path="store" element={<StorePage />} />
              <Route path="install/:id/*" element={<InstallerPage />} />
              <Route path="packages" element={<PackagesPage />} />
              <Route path="packages/:id/*" element={<PackageDetailPage />} />
              <Route path="nexus" element={<NexusPage />} />
            </Routes>
          </div>

          {/* Toast notifications */}
          <Toaster />
        </SidebarInset>
      </SidebarProvider>
    </div>
  );
}
