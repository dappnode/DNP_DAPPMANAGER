import React from "react";
import newTabProps from "utils/newTabProps";
import { packageSurveyLink } from "params";

function NoPackageFound({ query }: { query: string }) {
  return (
    <div className="centered-container">
      <h4>Not found</h4>
      <p>
        If you would like a specific DAppNode package to be developed, express
        so in the survery below
      </p>
      <a href={packageSurveyLink} {...newTabProps}>
        Request {query}
      </a>
    </div>
  );
}

export default NoPackageFound;
