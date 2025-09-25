import React from "react";
import { useApi } from "api";
import Card from "components/Card";
import Loading from "components/Loading";
import ErrorView from "components/ErrorView";

export function MathSum() {
  const mathSumRes = useApi.mathSumGet();

  if (mathSumRes.isValidating) return <Loading steps={["Loading math sum..."]} />;
  if (mathSumRes.error) return <ErrorView error={mathSumRes.error} />;

  return (
    <Card>
      <div className="text-center">
        <h5>Math Sum Result</h5>
        <p className="mb-0">
          The sum of 3 + 5 = <strong>{mathSumRes.data}</strong>
        </p>
      </div>
    </Card>
  );
}