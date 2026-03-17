import React from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "components/ui/card";
import { ShieldCheck, Sparkles, Check, ArrowRight } from "lucide-react";
import dappnodeLogo from "img/dappnode-logo-only.png";

export function NewHomePage() {
  const navigate = useNavigate();

  return (
    <div className="tw:relative tw:flex tw:flex-col tw:min-h-screen tw:bg-background tw:overflow-hidden">
      {/* ── Background decoration ────────────────────────────────── */}
      <div className="tw:pointer-events-none tw:absolute tw:inset-0 tw:overflow-hidden" aria-hidden>
        {/* Orb — top-left (purple) */}
        <div className="tw:absolute tw:-top-40 tw:-left-40 tw:size-[600px] tw:rounded-full tw:opacity-20 tw:blur-3xl tw:bg-dn-purple" />
        {/* Orb — top-right (orange) */}
        <div className="tw:absolute tw:-top-24 tw:-right-32 tw:size-[400px] tw:rounded-full tw:opacity-15 tw:blur-3xl tw:bg-dn-orange" />
        {/* Orb — bottom-left (blue) */}
        <div className="tw:absolute tw:-bottom-32 tw:-left-20 tw:size-[450px] tw:rounded-full tw:opacity-12 tw:blur-3xl tw:bg-dn-blue" />
        {/* Orb — bottom-right (pink) */}
        <div className="tw:absolute tw:-bottom-40 tw:-right-40 tw:size-[550px] tw:rounded-full tw:opacity-15 tw:blur-3xl tw:bg-dn-pink" />
        {/* Subtle dot-grid overlay */}
        <div
          className="tw:absolute tw:inset-0 tw:opacity-[0.03]"
          style={{
            backgroundImage: "radial-gradient(circle, currentColor 1px, transparent 1px)",
            backgroundSize: "24px 24px"
          }}
        />
      </div>

      {/* ── Content ──────────────────────────────────────────────── */}
      <div className="tw:relative tw:z-10 tw:flex tw:flex-1 tw:flex-col tw:items-center tw:justify-center tw:px-page-x tw:py-page-y tw:gap-section">
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
        <div className="tw:grid tw:grid-cols-1 tw:md:grid-cols-2 tw:gap-card tw:w-full tw:max-w-4xl">
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
      <footer className="tw:relative tw:z-10 tw:py-6 tw:text-center tw:text-xs tw:text-muted-foreground/60">
        Powered by Dappnode — decentralise everything
      </footer>
    </div>
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
