import React, { useState, useEffect } from "react";
import { api } from "api";
import ReactMarkdown from "react-markdown";
import { Card, CardContent, CardHeader, CardTitle } from "components/primitives/card";
import { Button } from "components/primitives/button";
import { X } from "lucide-react";

export function GettingStartedSection({
  dnpName,
  gettingStarted,
  gettingStartedShow
}: {
  dnpName: string;
  gettingStarted?: string;
  gettingStartedShow?: boolean;
}) {
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setShow(Boolean(gettingStartedShow));
  }, [gettingStartedShow]);

  async function dismiss() {
    if (loading) return;
    try {
      setLoading(true);
      setShow(false);
      if (gettingStartedShow) await api.packageGettingStartedToggle({ dnpName, show: false });
    } catch (e) {
      console.error(`Error on packageGettingStartedToggle: ${e}`);
    } finally {
      setLoading(false);
    }
  }

  if (!gettingStarted) return null;

  if (!show) {
    return (
      <Button variant="link" onClick={() => setShow(true)}>
        Show getting started guide
      </Button>
    );
  }

  return (
    <Card>
      <CardHeader className="tw:flex tw:flex-row tw:items-center tw:justify-between tw:space-y-0">
        <CardTitle>Getting started</CardTitle>
        <Button variant="ghost" size="icon" onClick={dismiss} disabled={loading}>
          <X className="tw:size-4" />
        </Button>
      </CardHeader>
      <CardContent>
        <div className="tw:prose tw:prose-sm tw:dark:prose-invert tw:max-w-none">
          <ReactMarkdown linkTarget="_blank">{gettingStarted}</ReactMarkdown>
        </div>
      </CardContent>
    </Card>
  );
}
