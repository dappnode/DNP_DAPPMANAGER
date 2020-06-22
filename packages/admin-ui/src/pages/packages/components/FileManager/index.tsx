import React from "react";
import { useLocation } from "react-router-dom";
// Components
import Card from "components/Card";
import To from "./To";
import From from "./From";

export const FileManager = ({ id }: { id: string }) => {
  const location = useLocation();
  const { from, to } = fetchParamsFromExtraUrl(location.search);

  return (
    <Card spacing divider className="file-manager">
      <div>
        <div className="subtle-header">Upload file to package</div>
        <To id={id} to={to} />
      </div>
      <div>
        <div className="subtle-header">Download file from package</div>
        <From id={id} from={from} />
      </div>
    </Card>
  );
};

/**
 * Additional feature to auto-complete the from and to paths
 * Since it's not critical, errors are logged and ignored
 * @param {string} searchQuery
 */
function fetchParamsFromExtraUrl(
  searchQuery: string
): {
  from?: string;
  to?: string;
} {
  try {
    if (!searchQuery) return {};
    const searchParams = new URLSearchParams(searchQuery);
    if (!searchParams) return {};
    return {
      from: searchParams.get("from") || undefined,
      to: searchParams.get("to") || undefined
    };
  } catch (e) {
    console.error(`Error parsing extra URL: ${e.stack}`);
    return {};
  }
}
