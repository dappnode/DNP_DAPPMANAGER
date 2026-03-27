import React, { useState, useEffect } from "react";
import { RequestedDnp, upstreamVersionToString } from "@dappnode/types";
import { prettyDnpName, isDnpVerified, shortAuthor } from "utils/format";
import humanFileSize from "utils/humanFileSize";
import getRepoSlugFromManifest from "utils/getRepoSlugFromManifest";
import RenderMarkdown from "components/RenderMarkdown";
import { Card, CardContent } from "components/primitives/card";
import { Button } from "components/primitives/button";
import { Badge } from "components/primitives/badge";
import { Separator } from "components/primitives/separator";
import { Switch } from "components/primitives/switch";
import { Label } from "components/primitives/label";
import {
  ShieldCheck,
  CheckCircle,
  XCircle,
  Loader2,
  HardDrive,
  User,
  Tag,
  ExternalLink,
  Download,
  ArrowUpCircle,
  ChevronDown,
  ChevronUp,
  Package
} from "lucide-react";
import defaultAvatar from "img/defaultAvatar.png";
import { InstallerProgressLogs } from "./InstallerProgressLogs";
import { ProgressLogs } from "types";

interface InstallerInfoStepProps {
  dnp: RequestedDnp;
  onInstall: () => void;
  disableInstallation: boolean;
  optionsArray: {
    name: string;
    checked: boolean;
    toggle: () => void;
  }[];
  progressLogs?: ProgressLogs;
  isInstalling?: boolean;
}

/**
 * Two-column layout:
 * - Left: Hero header + description/details
 * - Right: Sticky sidebar with install CTA, metadata, status, options
 */
export function InstallerInfoStep({
  dnp,
  onInstall,
  disableInstallation,
  optionsArray,
  progressLogs,
  isInstalling
}: InstallerInfoStepProps) {
  const [showSignedStatus, setShowSignedStatus] = useState(false);
  const [showResolveStatus, setShowResolveStatus] = useState(false);

  const {
    dnpName,
    compatible,
    signedSafe,
    signedSafeAll,
    manifest,
    isUpdated,
    isInstalled,
    avatarUrl,
    imageSize,
    origin
  } = dnp;

  const {
    shortDescription,
    description = "No description",
    author = "Unknown",
    version,
    upstreamVersion,
    upstream
  } = manifest;

  const parsedUpstreamVersion = upstreamVersionToString({ upstreamVersion, upstream });
  const repoSlug = getRepoSlugFromManifest(manifest);
  const isVerified = !origin && isDnpVerified(dnpName);

  const isCompatible = compatible.isCompatible;
  const resolvingCompatibility = compatible.resolving;
  const compatibilityError = compatible.error;

  useEffect(() => {
    if (!isCompatible) setShowResolveStatus(true);
  }, [isCompatible]);
  useEffect(() => {
    if (!signedSafeAll) setShowSignedStatus(true);
  }, [signedSafeAll]);

  const InstallIcon = isUpdated ? CheckCircle : isInstalled ? ArrowUpCircle : Download;
  const installLabel = isUpdated ? "Up to date" : isInstalled ? "Update" : "Install";

  return (
    <div className="tw:flex tw:flex-col tw:gap-section">
      {/* ═══════ Hero header ═══════════════════════════════════════ */}
      <div className="tw:flex tw:flex-col tw:sm:flex-row tw:items-center tw:gap-5">
        <img
          src={avatarUrl || defaultAvatar}
          alt={`${dnpName} avatar`}
          className="tw:size-20 tw:sm:size-24 tw:shrink-0 tw:rounded-2xl tw:object-cover tw:bg-muted tw:ring-1 tw:ring-border tw:shadow-sm"
        />
        <div className="tw:flex tw:flex-1 tw:flex-col tw:gap-2 tw:min-w-0">
          <div className="tw:flex tw:flex-wrap tw:items-center tw:gap-2">
            <h1 className="tw:text-2xl tw:sm:text-3xl tw:font-bold tw:tracking-tight tw:text-foreground">
              {prettyDnpName(dnpName)}
            </h1>
            {isVerified && (
              <Badge variant="success" className="tw:gap-1">
                <ShieldCheck className="tw:size-3" />
                Verified
              </Badge>
            )}
          </div>
          <p className="tw:text-sm tw:text-muted-foreground">{shortAuthor(author)}</p>

          {/* Status pills – inline with the header on desktop */}
          <div className="tw:flex tw:flex-wrap tw:gap-2 tw:mt-1">
            <StatusPill
              ok={signedSafeAll}
              label={signedSafeAll ? "Signed" : "Not signed"}
              loading={false}
              onClick={() => setShowSignedStatus((x) => !x)}
              expanded={showSignedStatus}
            />
            <StatusPill
              ok={isCompatible}
              label={
                isCompatible
                  ? "Compatible"
                  : resolvingCompatibility
                  ? "Resolving…"
                  : compatibilityError
                  ? "Not compatible"
                  : "Error"
              }
              loading={resolvingCompatibility}
              onClick={() => setShowResolveStatus((x) => !x)}
              expanded={showResolveStatus}
            />
            <StatusPill ok={true} label="Available" loading={false} />
          </div>
        </div>
      </div>

      {/* ═══════ Progress / Installing indicator ═══════════════════ */}
      {(progressLogs || isInstalling) && (
        <InstallerProgressLogs progressLogs={progressLogs} isInstalling={isInstalling} />
      )}

      {/* ═══════ Two-column body ═══════════════════════════════════ */}
      <div className="tw:grid tw:grid-cols-1 tw:lg:grid-cols-[1fr_320px] tw:gap-section tw:items-start">
        {/* ── Main content column ──────────────────────────────────── */}
        <div className="tw:flex tw:flex-col tw:gap-card tw:order-2 tw:lg:order-1">
          {/* Signed status expand */}
          {showSignedStatus && (
            <Card>
              <CardContent className="tw:flex tw:flex-col tw:gap-2">
                <div className="tw:flex tw:items-center tw:gap-2 tw:text-sm tw:font-medium tw:text-muted-foreground">
                  <ShieldCheck className="tw:size-4" />
                  Signature status
                </div>
                <div className="tw:flex tw:flex-col tw:gap-1.5">
                  {Object.entries(signedSafe).map(([name, { safe, message }]) => (
                    <div key={name} className="tw:flex tw:items-center tw:gap-2 tw:text-sm">
                      {safe ? (
                        <CheckCircle className="tw:size-3.5 tw:text-success tw:shrink-0" />
                      ) : (
                        <XCircle className="tw:size-3.5 tw:text-destructive tw:shrink-0" />
                      )}
                      <span className="tw:font-medium">{prettyDnpName(name)}</span>
                      <span className="tw:text-muted-foreground">{message}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Compatibility expand */}
          {showResolveStatus && (
            <Card>
              <CardContent className="tw:flex tw:flex-col tw:gap-2">
                <div className="tw:flex tw:items-center tw:gap-2 tw:text-sm tw:font-medium tw:text-muted-foreground">
                  <Package className="tw:size-4" />
                  Compatibility details
                </div>
                {resolvingCompatibility ? (
                  <div className="tw:flex tw:items-center tw:gap-2 tw:text-sm tw:text-muted-foreground">
                    <Loader2 className="tw:size-4 tw:animate-spin" />
                    Resolving dependencies…
                  </div>
                ) : compatibilityError ? (
                  <div className="tw:flex tw:items-center tw:gap-2 tw:text-sm tw:text-destructive">
                    <XCircle className="tw:size-3.5" />
                    Not compatible: {compatibilityError}
                  </div>
                ) : compatible.dnps ? (
                  <div className="tw:flex tw:flex-col tw:gap-1.5">
                    <div className="tw:flex tw:items-center tw:gap-2 tw:text-sm tw:text-success">
                      <CheckCircle className="tw:size-3.5" />
                      Package is compatible
                    </div>
                    {Object.entries(compatible.dnps).map(([name, { from, to }]) => (
                      <div key={name} className="tw:ml-5 tw:text-sm tw:text-muted-foreground">
                        {prettyDnpName(name)}: {from || "new"} → {to}
                      </div>
                    ))}
                  </div>
                ) : null}
              </CardContent>
            </Card>
          )}

          {/* Description / Details */}
          <Card>
            <CardContent className="tw:flex tw:flex-col tw:gap-5">
              {shortDescription && (
                <div>
                  <h3 className="tw:text-xs tw:font-semibold tw:uppercase tw:tracking-wider tw:text-muted-foreground tw:mb-2">
                    About
                  </h3>
                  <div className="tw:text-sm tw:text-foreground/90 tw:leading-relaxed">
                    <RenderMarkdown source={shortDescription} />
                  </div>
                </div>
              )}
              <div>
                <h3 className="tw:text-xs tw:font-semibold tw:uppercase tw:tracking-wider tw:text-muted-foreground tw:mb-2">
                  {shortDescription ? "Details" : "About"}
                </h3>
                <div className="tw:prose tw:prose-sm tw:max-w-none tw:text-foreground/90">
                  <RenderMarkdown source={description} />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Advanced options */}
          {optionsArray.length > 0 && (
            <Card>
              <CardContent>
                <span className="tw:text-sm tw:font-medium">Advanced options</span>

                <div className="tw:flex tw:flex-col tw:gap-3 tw:pt-3">
                  {optionsArray.map(({ name, checked, toggle }) => (
                    <div key={name} className="tw:flex tw:items-center tw:gap-3">
                      <Switch checked={checked} onCheckedChange={toggle} id={`opt-${name}`} />
                      <Label htmlFor={`opt-${name}`} className="tw:cursor-pointer tw:text-sm">
                        {name}
                      </Label>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* ── Sidebar column (sticky) ──────────────────────────────── */}
        <div className="tw:flex tw:flex-col tw:gap-card tw:order-1 tw:lg:order-2 tw:lg:sticky tw:lg:top-[calc(var(--topbar-height)+1rem)]">
          <Card className="tw:overflow-hidden">
            <CardContent className="tw:flex tw:flex-col tw:gap-4">
              {/* Install CTA */}
              <Button
                onClick={onInstall}
                disabled={disableInstallation || isUpdated}
                size="lg"
                className="tw:w-full tw:gap-2 tw:text-base"
              >
                <InstallIcon className="tw:size-4" />
                {installLabel}
              </Button>

              <Separator />

              {/* Metadata */}
              <div className="tw:flex tw:flex-col tw:gap-3">
                <MetaRow icon={<Tag className="tw:size-3.5" />} label="Version">
                  <span className="tw:font-medium">{version}</span>
                  {parsedUpstreamVersion && (
                    <span className="tw:text-muted-foreground tw:text-xs tw:ml-1">({parsedUpstreamVersion})</span>
                  )}
                  {origin && <span className="tw:text-muted-foreground tw:text-xs tw:ml-1">{origin}</span>}
                </MetaRow>

                <MetaRow icon={<HardDrive className="tw:size-3.5" />} label="Size">
                  {humanFileSize(imageSize)}
                </MetaRow>

                <MetaRow icon={<User className="tw:size-3.5" />} label="Author">
                  <RenderMarkdown source={author} />
                </MetaRow>
              </div>

              {/* GitHub link */}
              {repoSlug && version && (
                <>
                  <Separator />
                  <a
                    href={`https://github.com/${repoSlug}/releases/v${version}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="tw:inline-flex tw:items-center tw:gap-2 tw:text-sm tw:text-primary tw:hover:text-primary/80 tw:transition-colors"
                  >
                    <ExternalLink className="tw:size-3.5" />
                    View on GitHub
                  </a>
                </>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

/* ── Helper: status pill ────────────────────────────────────────────── */

function StatusPill({
  ok,
  label,
  loading,
  onClick,
  expanded
}: {
  ok: boolean;
  label: string;
  loading: boolean;
  onClick?: () => void;
  expanded?: boolean;
}) {
  const ExpandIcon = expanded ? ChevronUp : ChevronDown;
  return (
    <button
      type="button"
      onClick={onClick}
      className="tw:inline-flex tw:items-center tw:gap-1.5 tw:rounded-full tw:border tw:border-border tw:bg-card tw:px-3 tw:py-1 tw:text-xs tw:font-medium tw:text-foreground tw:transition-all tw:hover:bg-muted tw:hover:shadow-sm tw:cursor-pointer"
    >
      {loading ? (
        <Loader2 className="tw:size-3 tw:animate-spin tw:text-muted-foreground" />
      ) : ok ? (
        <CheckCircle className="tw:size-3 tw:text-success" />
      ) : (
        <XCircle className="tw:size-3 tw:text-destructive" />
      )}
      {label}
      {onClick && <ExpandIcon className="tw:size-3 tw:text-muted-foreground" />}
    </button>
  );
}

/* ── Helper: metadata row ───────────────────────────────────────────── */

function MetaRow({ icon, label, children }: { icon: React.ReactNode; label: string; children: React.ReactNode }) {
  return (
    <div className="tw:flex tw:items-start tw:justify-between tw:gap-3">
      <div className="tw:flex tw:items-center tw:gap-1.5 tw:text-xs tw:text-muted-foreground tw:whitespace-nowrap">
        {icon}
        {label}
      </div>
      <div className="tw:text-sm tw:text-foreground tw:text-right">{children}</div>
    </div>
  );
}
