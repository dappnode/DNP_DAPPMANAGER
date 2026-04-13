import React from "react";
import { Routes, Route } from "react-router-dom";
import { House, Settings, Globe } from "lucide-react";
import { SectionLayout, NavItem } from "layouts";
import { HomePage } from "./HomePage";
import { SettingsPage } from "./settings/SettingsPage";
import { EcosystemPage } from "./ecosystem";

/* ── Route constants ────────────────────────────────────────────────── */

export const homeBasePath = "/";
export const homeInfoPath = "/info";
export const homeSettingsPath = "/settings";
export const homeEcosystemPath = "/ecosystem";

/* ── Navigation items ───────────────────────────────────────────────── */

const navItems: NavItem[] = [
  { label: "Home", icon: House, path: homeBasePath },
  { label: "Settings", icon: Settings, path: homeSettingsPath },
  { label: "Ecosystem", icon: Globe, path: homeEcosystemPath }
];

/* ── Layout ─────────────────────────────────────────────────────────── */

export function HomeLayout() {
  return (
    <SectionLayout sectionLabel="Home" basePath="/" navItems={navItems}>
      <Routes>
        <Route index element={<HomePage />} />
        <Route path="settings/*" element={<SettingsPage />} />
        <Route path="ecosystem" element={<EcosystemPage />} />
      </Routes>
    </SectionLayout>
  );
}
