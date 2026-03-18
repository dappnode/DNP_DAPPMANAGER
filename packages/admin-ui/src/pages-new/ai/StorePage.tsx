import React from "react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "components/primitives/card";
import { ShoppingBag, Download, Star } from "lucide-react";

/**
 * AI Store page — browse and install AI models and tools.
 */
export function StorePage() {
  return (
    <div className="tw:flex tw:flex-col tw:gap-section tw:px-page-x tw:py-page-y">
      <header>
        <h1 className="tw:text-3xl tw:font-bold tw:tracking-tight tw:text-foreground">Store</h1>
        <p className="tw:mt-header-gap tw:text-muted-foreground tw:max-w-2xl">
          Browse, discover and install AI models, agents and tools to extend your Dappnode with intelligent
          capabilities.
        </p>
      </header>

      <div className="tw:grid tw:grid-cols-1 tw:sm:grid-cols-2 tw:lg:grid-cols-3 tw:gap-card">
        <StoreItemCard
          icon={<ShoppingBag className="tw:size-5" />}
          title="Local LLM Runtime"
          description="Run large language models privately on your own hardware."
          downloads={1240}
          rating={4.8}
        />
        <StoreItemCard
          icon={<ShoppingBag className="tw:size-5" />}
          title="Node Diagnostics Agent"
          description="AI-powered agent that monitors and diagnoses node health issues."
          downloads={870}
          rating={4.5}
        />
        <StoreItemCard
          icon={<ShoppingBag className="tw:size-5" />}
          title="Smart Config Wizard"
          description="Automatically tune client settings based on your hardware profile."
          downloads={630}
          rating={4.3}
        />
      </div>
    </div>
  );
}

function StoreItemCard({
  icon,
  title,
  description,
  downloads,
  rating
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  downloads: number;
  rating: number;
}) {
  return (
    <Card className="tw:transition-all tw:duration-200 tw:hover:ring-2 tw:hover:ring-primary/30 tw:hover:-translate-y-0.5">
      <CardHeader>
        <div className="tw:flex tw:items-center tw:gap-3">
          <div className="tw:flex tw:items-center tw:justify-center tw:size-10 tw:rounded-lg tw:bg-primary/10 tw:text-primary">
            {icon}
          </div>
          <CardTitle>{title}</CardTitle>
        </div>
        <CardDescription className="tw:mt-2">{description}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="tw:flex tw:items-center tw:gap-4 tw:text-xs tw:text-muted-foreground">
          <span className="tw:flex tw:items-center tw:gap-1">
            <Download className="tw:size-3" />
            {downloads.toLocaleString()}
          </span>
          <span className="tw:flex tw:items-center tw:gap-1">
            <Star className="tw:size-3" />
            {rating}
          </span>
        </div>
      </CardContent>
    </Card>
  );
}
