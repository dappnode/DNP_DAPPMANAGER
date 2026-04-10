import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { ShoppingBag, Package, Globe } from "lucide-react";
import { SectionLayout, NavItem } from "layouts";
import { StorePage } from "./store/StorePage";
import { PackagesPage } from "./packages/PackagesPage";
import { PackageDetailPage } from "./packages/PackageDetailPage";
import { InstallerPage } from "./installer/InstallerPage";
import { NexusPage } from "./nexus/NexusPage";
import { storeRelativePath } from "./store/data";
import { packagesRelativePath } from "./packages/data";
import { nexusRelativePath } from "./nexus/data";

/* ── Navigation items ───────────────────────────────────────────────── */

const navItems: NavItem[] = [
  { label: "Packages", icon: Package, path: packagesRelativePath },
  { label: "Store", icon: ShoppingBag, path: storeRelativePath },
  { label: "Nexus", icon: Globe, path: nexusRelativePath }
];

/* ── Layout ─────────────────────────────────────────────────────────── */

export function AiLayout() {
  return (
    <SectionLayout sectionLabel="AI" basePath="/ai" navItems={navItems}>
      <Routes>
        <Route index element={<Navigate to={packagesRelativePath} replace />} />
        <Route path="packages" element={<PackagesPage />} />
        <Route path="packages/:id/*" element={<PackageDetailPage />} />
        <Route path="store" element={<StorePage />} />
        <Route path="install/:id/*" element={<InstallerPage />} />
        <Route path="nexus" element={<NexusPage />} />
      </Routes>
    </SectionLayout>
  );
}
