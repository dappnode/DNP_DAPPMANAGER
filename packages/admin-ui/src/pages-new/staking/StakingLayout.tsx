import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { LayoutDashboard, ShieldCheck } from "lucide-react";
import { SectionLayout, NavItem } from "layouts";
import { DashboardPage } from "./DashboardPage";
import { ValidatorsPage } from "./ValidatorsPage";
import { BannerNotifications } from "../home/BannerNotifications";

/* ── Navigation items ───────────────────────────────────────────────── */

const navItems: NavItem[] = [
  { label: "Dashboard", icon: LayoutDashboard, path: "/staking/dashboard" },
  { label: "Validators", icon: ShieldCheck, path: "/staking/validators" }
];

/* ── Layout ─────────────────────────────────────────────────────────── */

export function StakingLayout() {
  return (
    <SectionLayout sectionLabel="Staking" basePath="/staking" navItems={navItems}>
      <BannerNotifications />
      <Routes>
        <Route index element={<Navigate to="dashboard" replace />} />
        <Route path="dashboard" element={<DashboardPage />} />
        <Route path="validators" element={<ValidatorsPage />} />
      </Routes>
    </SectionLayout>
  );
}
