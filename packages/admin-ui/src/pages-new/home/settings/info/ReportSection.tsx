import React, { useMemo } from "react";
import { useApi } from "api";
import { formatTopicBody, formatTopicUrl } from "pages/support/formaters/discourseTopic";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "components/primitives/card";
import { Button } from "components/primitives/button";
import { ExternalLink } from "lucide-react";

export function ReportSection() {
  const systemInfo = useApi.systemInfoGet();
  const diagnose = useApi.diagnose();

  const topicBody = useMemo(() => {
    const versions = systemInfo.data?.versionData
      ? Object.entries(systemInfo.data.versionData).map(([name, version]) => ({
          name,
          version: version || "unknown"
        }))
      : [];
    const hostDiagnose = diagnose.data || [];
    return formatTopicBody(versions, hostDiagnose);
  }, [systemInfo.data, diagnose.data]);

  const topicUrl = formatTopicUrl(topicBody);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="tw:text-base">Support Report</CardTitle>
        <CardDescription>
          Generate a report with your system information to share with Dappnode support.
        </CardDescription>
      </CardHeader>
      <CardContent className="tw:space-y-4">
        <div className="tw:rounded-lg tw:bg-muted tw:p-3 tw:max-h-48 tw:overflow-y-auto">
          <pre className="tw:text-xs tw:whitespace-pre-wrap tw:font-mono">{topicBody || "Loading report data..."}</pre>
        </div>
        <div className="tw:flex tw:gap-2">
          <Button variant="outline" asChild>
            <a href={topicUrl} target="_blank" rel="noopener noreferrer">
              <ExternalLink className="tw:size-3.5" />
              Open support topic
            </a>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
