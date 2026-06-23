import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { LayoutDashboard, Settings2, Package, ShoppingBag } from "lucide-react";
import { SectionLayout, NavItem } from "layouts";
import { DashboardPage } from "./dashboard";
import { StakersPage } from "./stakers";
import { PackagesPage, PackageDetailPage, StorePage } from "pages-new/packages";
import { BannerNotifications } from "../home/BannerNotifications";
import { stakingPackagesConfig } from "./packagesConfig";

/* ── Navigation items ───────────────────────────────────────────────── */

const navItems: NavItem[] = [
  { label: "Dashboard", icon: LayoutDashboard, path: "/staking/dashboard" },
  { label: "Stakers", icon: Settings2, path: "/staking/stakers" },
  { label: "Packages", icon: Package, path: stakingPackagesConfig.packagesPath },
  { label: "Store", icon: ShoppingBag, path: stakingPackagesConfig.storePath }
];

/* ── Layout ─────────────────────────────────────────────────────────── */

export function StakingLayout() {
  return (
    <SectionLayout sectionLabel="Staking" basePath="/staking" navItems={navItems}>
      <BannerNotifications />
      <Routes>
        <Route index element={<Navigate to="dashboard" replace />} />
        <Route path="dashboard" element={<DashboardPage />} />
        <Route path="stakers/*" element={<StakersPage />} />
        <Route path="packages" element={<PackagesPage config={stakingPackagesConfig} />} />
        <Route path="packages/:id/*" element={<PackageDetailPage config={stakingPackagesConfig} />} />
        <Route path="store" element={<StorePage config={stakingPackagesConfig} />} />
      </Routes>
    </SectionLayout>
  );
}
