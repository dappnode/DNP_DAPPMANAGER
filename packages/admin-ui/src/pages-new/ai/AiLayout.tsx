import React from "react";
import { Routes, Route, useNavigate, useLocation } from "react-router-dom";
import { Sparkles, ShoppingBag, Package, Home } from "lucide-react";
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
  SidebarTrigger
} from "components/primitives/sidebar";
import { Separator } from "components/primitives/separator";
import { StorePage } from "./StorePage";
import { PackagesPage } from "./PackagesPage";

/* ── Navigation items ───────────────────────────────────────────────── */

const navItems = [
  { label: "Overview", icon: Sparkles, path: "/ai" },
  { label: "Store", icon: ShoppingBag, path: "/ai/store" },
  { label: "Packages", icon: Package, path: "/ai/packages" }
];

/* ── AI Overview (index page) ───────────────────────────────────────── */

function AiHome() {
  return (
    <div className="tw:flex tw:flex-col tw:gap-section tw:px-page-x tw:py-page-y">
      <header>
        <h1 className="tw:text-3xl tw:font-bold tw:tracking-tight tw:text-foreground">AI Overview</h1>
        <p className="tw:mt-2 tw:text-muted-foreground tw:max-w-2xl">
          AI-powered features to help you manage and optimise your Dappnode. Explore the Store to discover models and
          tools, or check your installed Packages.
        </p>
      </header>
    </div>
  );
}

/* ── Layout ─────────────────────────────────────────────────────────── */

export function AiLayout() {
  const navigate = useNavigate();
  const location = useLocation();

  return (
    <div className="tw-base">
      <SidebarProvider>
        <Sidebar variant="sidebar" collapsible="icon">
          {/* Logo / brand header */}
          <SidebarHeader>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton size="lg" onClick={() => navigate("/")} tooltip="Back to Home">
                  <div className="tw:flex tw:items-center tw:justify-center tw:size-8 tw:rounded-lg tw:bg-primary/10">
                    <img className="tw:size-5" src={dappnodeLogo} alt="Dappnode" />
                  </div>
                  <div className="tw:flex tw:flex-col tw:gap-0.5 tw:leading-none">
                    <span className="tw:font-semibold">Dappnode</span>
                    <span className="tw:text-xs tw:text-muted-foreground">AI</span>
                  </div>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarHeader>

          {/* Navigation */}
          <SidebarContent>
            <SidebarGroup>
              <SidebarGroupLabel>Navigation</SidebarGroupLabel>
              <SidebarMenu>
                {navItems.map((item) => {
                  const isActive = location.pathname === item.path;
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
          {/* Top bar */}
          <header className="tw:flex tw:h-12 tw:shrink-0 tw:items-center tw:gap-2 tw:border-b tw:px-4">
            <SidebarTrigger className="tw:-ml-1" />
            <Separator orientation="vertical" className="tw:mr-2 tw:!h-4" />
            <span className="tw:text-sm tw:font-medium tw:text-muted-foreground">AI</span>
          </header>

          {/* Page content */}
          <div className="tw:flex-1 tw:overflow-auto">
            <Routes>
              <Route index element={<AiHome />} />
              <Route path="store" element={<StorePage />} />
              <Route path="packages" element={<PackagesPage />} />
            </Routes>
          </div>
        </SidebarInset>
      </SidebarProvider>
    </div>
  );
}
