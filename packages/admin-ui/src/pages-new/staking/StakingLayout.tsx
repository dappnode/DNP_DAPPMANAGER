import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { LayoutDashboard, Settings2 } from "lucide-react";
import { SectionLayout, NavItem } from "layouts";
import { DashboardPage } from "./dashboard";
import { StakersPage } from "./stakers";
import { BannerNotifications } from "../home/BannerNotifications";

/* ── Navigation items ───────────────────────────────────────────────── */

const navItems: NavItem[] = [
  { label: "Dashboard", icon: LayoutDashboard, path: "/staking/dashboard" },
  { label: "Stakers", icon: Settings2, path: "/staking/stakers" }
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
      </Routes>
    </SectionLayout>
  );
}
