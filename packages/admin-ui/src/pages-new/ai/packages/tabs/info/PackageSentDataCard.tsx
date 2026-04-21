import React, { useState } from "react";
import { api } from "api";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "components/primitives/card";
import { Button } from "components/primitives/button";
import { Separator } from "components/primitives/separator";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger
} from "components/primitives/alert-dialog";
import { isSecret } from "utils/isSecret";
import { isLink } from "utils/isLink";
import { Copy, Eye, EyeOff } from "lucide-react";

export function PackageSentDataCard({ dnpName, data }: { dnpName: string; data: Record<string, string> }) {
  const entries = Object.entries(data).sort((a, b) =>
    a[0].localeCompare(b[0], undefined, { numeric: true, sensitivity: "base" })
  );

  if (entries.length === 0) return null;

  async function handleDelete() {
    const toastId = toast.loading("Deleting sent data…");
    try {
      await api.packageSentDataDelete({ dnpName });
      toast.success("Deleted sent data", { id: toastId });
    } catch (e) {
      toast.error(`Failed: ${e}`, { id: toastId });
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Package Sent Data</CardTitle>
        <CardDescription>Values provided by the package at runtime.</CardDescription>
      </CardHeader>
      <CardContent className="tw:flex tw:flex-col tw:gap-3">
        {entries.map(([key, value]) => (
          <SentDataRow key={key} label={key} value={value} />
        ))}
        <Separator />
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="ghost" size="sm" className="tw:self-start tw:text-destructive tw:hover:text-destructive">
              Delete all sent data
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent className="tw-base">
            <AlertDialogHeader>
              <AlertDialogTitle>Delete sent data</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete all package-sent data? This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction variant="destructive" onClick={handleDelete}>
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </CardContent>
    </Card>
  );
}

function SentDataRow({ label, value }: { label: string; value: string }) {
  const secret = isSecret(label);
  const link = isLink(value);
  const [visible, setVisible] = useState(!secret);
  const [copied, setCopied] = useState(false);

  function copyValue() {
    navigator.clipboard.writeText(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  return (
    <div className="tw:flex tw:items-center tw:gap-3 tw:text-sm">
      <span className="tw:font-medium tw:min-w-32 tw:text-muted-foreground">{label}</span>
      <div className="tw:flex-1 tw:flex tw:items-center tw:gap-1.5 tw:min-w-0">
        {link ? (
          <a
            href={value}
            target="_blank"
            rel="noopener noreferrer"
            className="tw:text-primary tw:hover:underline tw:truncate"
          >
            {value}
          </a>
        ) : (
          <span className="tw:font-mono tw:text-xs tw:truncate">{visible ? value : "••••••••••"}</span>
        )}
        {!link && secret && (
          <Button variant="ghost" size="icon" className="tw:size-6" onClick={() => setVisible((v) => !v)}>
            {visible ? <EyeOff className="tw:size-3" /> : <Eye className="tw:size-3" />}
          </Button>
        )}
        {!link && (
          <Button variant="ghost" size="icon" className="tw:size-6" onClick={copyValue}>
            {copied ? <span className="tw:text-[10px] tw:text-green-600">✓</span> : <Copy className="tw:size-3" />}
          </Button>
        )}
      </div>
    </div>
  );
}
