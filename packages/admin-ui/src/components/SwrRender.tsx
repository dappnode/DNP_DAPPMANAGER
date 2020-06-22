import React from "react";
import { responseInterface } from "swr";
import ErrorView from "./ErrorView";
import Loading from "./Loading";

export function renderResponse<T>(
  res: responseInterface<T, Error>,
  loadingMessages: string[],
  onData: (data: T) => React.ReactElement
): React.ReactElement | null {
  if (res.data) return onData(res.data);
  if (res.error) return <ErrorView error={res.error} />;
  if (res.isValidating) return <Loading steps={loadingMessages} />;
  return null;
}
