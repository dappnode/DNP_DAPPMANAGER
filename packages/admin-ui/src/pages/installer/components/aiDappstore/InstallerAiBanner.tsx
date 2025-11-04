import Card from "components/Card";
import React from "react";
import { SelectedCategories } from "pages/installer/types";
import aiStars from "img/ai_stars.png";
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
          <img src={aiStars} alt="AI DAppNode Installer Banner" width={50} height={50} />
          <div>
            <h2>AI Toolkit</h2>
            <div className="description">
              Explore the new AI-powered Dappnode packages, running locally, privately, and securely on your node.
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}
