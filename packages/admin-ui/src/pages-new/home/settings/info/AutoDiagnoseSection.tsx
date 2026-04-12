import React, { useState, useMemo } from "react";
import { useApi } from "api";
import { notEmpty } from "utils/typescript";
import * as formatDiagnose from "pages/support/formaters/autoDiagnoseTexts";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "components/primitives/card";
import { CheckCircle2, XCircle, Loader2, ChevronDown, ChevronUp } from "lucide-react";

/* ── Types ──────────────────────────────────────────────────────────── */

type DiagnoseResult = {
  loading?: boolean;
  ok?: boolean;
  msg: string;
  solutions?: string[];
  link?: { linkMsg: string; linkUrl: string };
};

/* ── DiagnoseItem ───────────────────────────────────────────────────── */

function DiagnoseItem({ result }: { result: DiagnoseResult }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="tw:rounded-lg tw:border tw:p-3">
      <div className="tw:flex tw:items-start tw:gap-2 tw:cursor-pointer" onClick={() => setExpanded((x) => !x)}>
        {result.loading ? (
          <Loader2 className="tw:size-4 tw:mt-0.5 tw:animate-spin tw:text-muted-foreground tw:shrink-0" />
        ) : result.ok ? (
          <CheckCircle2 className="tw:size-4 tw:mt-0.5 tw:text-green-500 tw:shrink-0" />
        ) : (
          <XCircle className="tw:size-4 tw:mt-0.5 tw:text-destructive tw:shrink-0" />
        )}
        <span className="tw:text-sm tw:flex-1">{result.msg}</span>
        {result.solutions && result.solutions.length > 0 && (
          <span className="tw:text-muted-foreground">
            {expanded ? <ChevronUp className="tw:size-4" /> : <ChevronDown className="tw:size-4" />}
          </span>
        )}
      </div>
      {expanded && result.solutions && (
        <div className="tw:mt-2 tw:ml-6 tw:space-y-1">
          {result.solutions.map((s, i) => (
            <p key={i} className="tw:text-xs tw:text-muted-foreground">
              • {s}
            </p>
          ))}
          {result.link && (
            <a
              href={result.link.linkUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="tw:text-xs tw:text-primary tw:underline"
            >
              {result.link.linkMsg}
            </a>
          )}
        </div>
      )}
    </div>
  );
}

/* ── AutoDiagnoseSection ────────────────────────────────────────────── */

export function AutoDiagnoseSection() {
  const systemInfo = useApi.systemInfoGet();
  const publicIpRes = useApi.ipPublicGet();
  const ipfsTest = useApi.ipfsTest();
  const diskInfo = useApi.statsDiskGet();
  const dnpInstalled = useApi.packagesGet();

  const filteredResults: DiagnoseResult[] = useMemo(
    () =>
      [
        formatDiagnose.ipfs(ipfsTest),
        formatDiagnose.internetConnection(publicIpRes, systemInfo),
        formatDiagnose.openPorts(systemInfo),
        formatDiagnose.noNatLoopback(systemInfo),
        formatDiagnose.diskSpace(diskInfo),
        formatDiagnose.coreDnpsRunning(dnpInstalled)
      ].filter(notEmpty),
    [publicIpRes, systemInfo, ipfsTest, diskInfo, dnpInstalled]
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle className="tw:text-base">Auto Diagnose</CardTitle>
        <CardDescription>Automated check of your Dappnode health and connectivity.</CardDescription>
      </CardHeader>
      <CardContent className="tw:space-y-3">
        {filteredResults.map((r, i) => (
          <DiagnoseItem key={i} result={r} />
        ))}
      </CardContent>
    </Card>
  );
}
