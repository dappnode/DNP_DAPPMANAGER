import Card from "components/Card";
import React from "react";
import { SelectedCategories } from "pages/installer/types";
import "./installerAiBanner.scss";

export function InstallerAIBanner({
  selectedCategories,
  setSelectedCategories
}: {
  selectedCategories: SelectedCategories;
  setSelectedCategories: (categories: SelectedCategories) => void;
}) {
  return (
    <div className="installer-ai-banner group">
      <Card>
        <div
          className="ai-banner-row"
          onClick={() => {
            setSelectedCategories({ ...selectedCategories, AI: !selectedCategories.AI });
          }}
        >
          <img
            src="https://static.thenounproject.com/png/ai-stars-icon-6056251-512.png"
            alt="AI DAppNode Installer Banner"
            width={50}
            height={50}
          />
          <div>
            <h2>AI DappNode Installer</h2>
            <div>Discover and install AI-powered Dappnode packages.</div>
          </div>
        </div>
      </Card>
    </div>
  );
}
