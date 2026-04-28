import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { ShoppingBag, Package, Globe } from "lucide-react";
import { SectionLayout, NavItem } from "layouts";
import { PackagesPage, PackageDetailPage, StorePage } from "pages-new/packages";
import { NexusPage } from "./nexus/NexusPage";
import { nexusRelativePath } from "./nexus/data";
import { BannerNotifications } from "../home/BannerNotifications";
import { aiPackagesConfig } from "./packagesConfig";

/* ── Navigation items ───────────────────────────────────────────────── */

const navItems: NavItem[] = [
  { label: "Packages", icon: Package, path: aiPackagesConfig.packagesPath },
  { label: "Store", icon: ShoppingBag, path: aiPackagesConfig.storePath },
  { label: "Nexus", icon: Globe, path: nexusRelativePath }
];

/* ── Layout ─────────────────────────────────────────────────────────── */

export function AiLayout() {
  return (
    <SectionLayout sectionLabel="AI" basePath="/ai" navItems={navItems}>
      <BannerNotifications />
      <Routes>
        <Route index element={<Navigate to={aiPackagesConfig.packagesPath} replace />} />
        <Route path="packages" element={<PackagesPage config={aiPackagesConfig} />} />
        <Route path="packages/:id/*" element={<PackageDetailPage config={aiPackagesConfig} />} />
        <Route path="store" element={<StorePage config={aiPackagesConfig} />} />
        <Route path="nexus" element={<NexusPage />} />
      </Routes>
    </SectionLayout>
  );
}
