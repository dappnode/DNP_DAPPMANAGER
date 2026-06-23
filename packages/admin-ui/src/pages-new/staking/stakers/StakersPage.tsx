import React, { useMemo } from "react";
import { Routes, Route, Navigate, NavLink, useLocation, useNavigate } from "react-router-dom";
import { PageContainer, PageHeader } from "components/primitives/page";
import { Switch } from "components/primitives/switch";
import { Label } from "components/primitives/label";
import {
  NavigationMenu,
  NavigationMenuList,
  NavigationMenuItem,
  NavigationMenuLink
} from "components/primitives/navigation-menu";
import { cn } from "lib/utils";
import { networkDefs } from "./data";
import { StakerNetworkConfig } from "./StakerNetworkConfig";

/**
 * Main Stakers page — replaces the legacy StakersRoot.
 * Provides a horizontal network tab bar with a mainnet/testnet toggle.
 */
export function StakersPage() {
  const location = useLocation();
  const navigate = useNavigate();

  // Determine current slug from URL
  const currentSlug = location.pathname.split("/").pop() || "";
  const currentDef = networkDefs.find((d) => d.slug === currentSlug);

  // Derive testnet toggle from current selection
  const testnetsSelected = currentDef ? currentDef.group === "testnet" : false;

  // Filter visible networks based on the toggle
  const filteredNetworks = useMemo(
    () => networkDefs.filter((d) => (testnetsSelected ? d.group === "testnet" : d.group === "mainnet")),
    [testnetsSelected]
  );

  // Handle mainnet/testnet toggle
  const handleToggle = (toTestnets: boolean) => {
    const target = networkDefs.find((d) => d.group === (toTestnets ? "testnet" : "mainnet"));
    if (target) {
      navigate(target.slug);
    }
  };

  return (
    <PageContainer>
      <PageHeader title="Stakers" description="Configure your Proof-of-Stake nodes across all supported networks." />

      {/* Toggle + Network tabs */}
      <div className="tw:space-y-4">
        <div className="tw:flex tw:items-center tw:gap-3">
          <Label htmlFor="net-toggle" className="tw:text-sm tw:font-medium">
            Mainnet
          </Label>
          <Switch id="net-toggle" checked={testnetsSelected} onCheckedChange={handleToggle} />
          <Label htmlFor="net-toggle" className="tw:text-sm tw:font-medium">
            Testnet
          </Label>
        </div>

        <NavigationMenu>
          <NavigationMenuList>
            {filteredNetworks.map((def) => (
              <NavigationMenuItem key={def.slug}>
                <NavigationMenuLink asChild>
                  <NavLink
                    to={def.slug}
                    className={({ isActive }) =>
                      cn(
                        "tw:inline-flex tw:h-9 tw:items-center tw:justify-center tw:rounded-lg tw:px-3 tw:py-1.5 tw:text-sm tw:font-medium tw:transition-colors",
                        isActive
                          ? "tw:bg-primary/10 tw:text-primary"
                          : "tw:text-muted-foreground tw:hover:bg-muted tw:hover:text-foreground"
                      )
                    }
                  >
                    {def.label}
                  </NavLink>
                </NavigationMenuLink>
              </NavigationMenuItem>
            ))}
          </NavigationMenuList>
        </NavigationMenu>
      </div>

      {/* Network config routes */}
      <Routes>
        <Route index element={<Navigate to="ethereum" replace />} />
        {networkDefs
          .filter((d) => d.type === "staker")
          .map((def) => (
            <Route key={def.slug} path={def.slug} element={<StakerNetworkConfig networkDef={def} />} />
          ))}
        {/* Starknet / Optimism — placeholder for now, these have custom config UIs */}
        {networkDefs
          .filter((d) => d.type !== "staker")
          .map((def) => (
            <Route
              key={def.slug}
              path={def.slug}
              element={<StakerNetworkConfig networkDef={def} />}
            />
          ))}
      </Routes>
    </PageContainer>
  );
}
