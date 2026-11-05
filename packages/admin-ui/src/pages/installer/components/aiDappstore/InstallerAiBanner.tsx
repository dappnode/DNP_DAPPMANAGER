import Card from "components/Card";
import React from "react";
import aiStars from "img/ai_stars.png";
import "./installerAiBanner.scss";

export function InstallerAIBanner({ onCategoryChange }: { onCategoryChange: (category: string) => void }) {
  return (
    <div
      className="installer-ai-banner group"
      onClick={() => {
        onCategoryChange("AI");
      }}
    >
      <Card>
        <div className="ai-banner-row">
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
