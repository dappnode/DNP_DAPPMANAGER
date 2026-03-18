import React from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "components/primitives/card";
import { ShieldCheck, Sparkles, Check, ArrowRight } from "lucide-react";
import dappnodeLogo from "img/dappnode-logo-only.png";
import { NewPageLayout } from "pages-new/layouts";

export function NewHomePage() {
  const navigate = useNavigate();

  return (
    <NewPageLayout>
      {/* ── Content ──────────────────────────────────────────────── */}
      <div className="tw:flex tw:flex-1 tw:flex-col tw:items-center tw:justify-center tw:px-page-x tw:py-page-y tw:gap-section">
        {/* Hero section */}
        <header className="tw:text-center tw:max-w-2xl tw:space-y-5">
          {/* Dappnode logo mark */}
          <div className="tw:mx-auto tw:mb-4 tw:flex tw:items-center tw:justify-center tw:size-20 tw:rounded-2xl tw:bg-primary/10 tw:ring-1 tw:ring-primary/20">
            <img className="tw:size-10" src={dappnodeLogo} alt="Dappnode Logo" />
          </div>

          <h1 className="tw:text-5xl tw:sm:text-6xl tw:font-extrabold tw:tracking-tight tw:text-foreground">
            Welcome to{" "}
            <span className="tw:bg-gradient-to-r tw:from-dn-blue tw:via-dn-pink tw:to-dn-orange tw:bg-clip-text tw:text-transparent">
              Dappnode
            </span>
          </h1>

          <p className="tw:text-lg tw:sm:text-xl tw:text-muted-foreground tw:max-w-lg tw:mx-auto tw:leading-relaxed">
            Your gateway to decentralised infrastructure. Choose a path below to get started.
          </p>
        </header>

        {/* ── Navigation cards ───────────────────────────────────── */}
        <div className="tw:grid tw:grid-cols-1 tw:md:grid-cols-2 tw:gap-card tw:w-full tw:max-w-content-max">
          {/* Staking Card */}
          <Card
            className="tw:group tw:relative tw:flex tw:flex-col tw:justify-between tw:border-0 tw:ring-1 tw:ring-border tw:bg-card/80 tw:backdrop-blur-sm tw:transition-all tw:duration-300 tw:hover:ring-2 tw:hover:ring-accent/50 tw:hover:shadow-xl tw:hover:shadow-accent/5 tw:hover:-translate-y-1 tw:cursor-pointer"
            onClick={() => navigate("/staking")}
          >
            <CardHeader>
              <div className="tw:flex tw:items-center tw:gap-4 tw:mb-2">
                <div className="tw:flex tw:items-center tw:justify-center tw:size-12 tw:rounded-xl tw:bg-accent/10 tw:text-accent tw:ring-1 tw:ring-accent/20 tw:transition-colors tw:group-hover:bg-accent/20">
                  <ShieldCheck className="tw:size-6" />
                </div>
                <CardTitle className="tw:text-2xl tw:font-bold">Staking</CardTitle>
              </div>
              <CardDescription className="tw:text-base tw:leading-relaxed">
                Run nodes, validators and manage your staking setup among several networks.
              </CardDescription>
            </CardHeader>

            <CardContent className="tw:flex-1">
              <ul className="tw:space-y-3">
                <FeatureItem>Set-up and run nodes &amp; configuration</FeatureItem>
                <FeatureItem>Package management</FeatureItem>
                <FeatureItem>Network &amp; device settings</FeatureItem>
              </ul>
            </CardContent>
            <CardContent className="tw:flex-1">
              <div className="tw:w-full tw:mt-5 tw:flex tw:justify-center tw:items-center tw:font-semibold tw:group-hover:text-primary">
                Open Staking
                <ArrowRight className="tw:ml-1 tw:size-4 tw:transition-transform tw:group-hover:translate-x-0.5" />
              </div>
            </CardContent>
          </Card>

          {/* AI Card */}
          <Card
            className="tw:group tw:relative tw:flex tw:flex-col tw:justify-between tw:border-0 tw:ring-1 tw:ring-border tw:bg-card/80 tw:backdrop-blur-sm tw:transition-all tw:duration-300 tw:hover:ring-2 tw:hover:ring-primary/50 tw:hover:shadow-xl tw:hover:shadow-primary/5 tw:hover:-translate-y-1 tw:cursor-pointer"
            onClick={() => navigate("/ai")}
          >
            <CardHeader>
              <div className="tw:flex tw:items-center tw:gap-4 tw:mb-2">
                <div className="tw:flex tw:items-center tw:justify-center tw:size-12 tw:rounded-xl tw:bg-primary/10 tw:text-primary tw:ring-1 tw:ring-primary/20 tw:transition-colors tw:group-hover:bg-primary/20">
                  <Sparkles className="tw:size-6" />
                </div>
                <CardTitle className="tw:text-2xl tw:font-bold">AI</CardTitle>
              </div>
              <CardDescription className="tw:text-base tw:leading-relaxed">
                Explore AI-powered features to manage and optimise your Dappnode experience.
              </CardDescription>
            </CardHeader>

            <CardContent className="tw:flex-1">
              <ul className="tw:space-y-3">
                <FeatureItem>Run local private models</FeatureItem>
                <FeatureItem>Run and manage Agents</FeatureItem>
                <FeatureItem>Discover powerful AI tools</FeatureItem>
              </ul>
            </CardContent>
            <CardContent className="tw:flex-1">
              <div className="tw:w-full tw:mt-5 tw:flex tw:justify-center tw:items-center tw:font-semibold tw:group-hover:text-primary">
                Open AI
                <ArrowRight className="tw:ml-1 tw:size-4 tw:transition-transform tw:group-hover:translate-x-0.5" />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* ── Footer ───────────────────────────────────────────────── */}
      <footer className="tw:py-6 tw:text-center tw:text-xs tw:text-muted-foreground/60">
        Powered by Dappnode — decentralise everything
      </footer>
    </NewPageLayout>
  );
}

function FeatureItem({ children }: { children: React.ReactNode }) {
  return (
    <li className="tw:flex tw:items-center tw:gap-3 tw:text-sm tw:text-muted-foreground">
      <span className="tw:flex tw:items-center tw:justify-center tw:size-5 tw:rounded-full tw:bg-accent/10 tw:text-accent tw:shrink-0">
        <Check className="tw:size-3" strokeWidth={3} />
      </span>
      {children}
    </li>
  );
}
