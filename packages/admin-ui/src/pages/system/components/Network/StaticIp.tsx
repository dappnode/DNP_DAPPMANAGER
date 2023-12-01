import React, { useState, useEffect } from "react";
import { api } from "api";
import { useSelector } from "react-redux";
import isIpv4 from "utils/isIpv4";
import { withToastNoThrow } from "components/toast/Toast";
// Components
import Input from "components/Input";
import Button from "components/Button";
// External
import { getLocalStaticIp, getStaticIp } from "services/dappnodeStatus/selectors";

export function StaticIp({ type }: { type: "local" | "public" }) {
  let staticIpSelector;
  if (type === "public") staticIpSelector = getStaticIp;
  else staticIpSelector = getLocalStaticIp;
  const staticIp = useSelector(staticIpSelector);
  const [input, setInput] = useState(staticIp);

  useEffect(() => {
    setInput(staticIp);
  }, [staticIp]);

  function updateStaticIp(newStaticIp: string) {
    withToastNoThrow(() => api.setStaticIp({ staticIp: newStaticIp }), {
      message: "Setting static ip...",
      onSuccess: "Set static ip"
    });
  }

  function updateStaticLocalIp(newStaticIp: string) {
    withToastNoThrow(() => api.setStaticLocalIp(newStaticIp), {
      message: "Setting static local ip...",
      onSuccess: "Set static local ip"
    });
  }

  return (
    <div className="input-group">
      <Input
        placeholder="Your static ip..."
        value={input}
        onValueChange={setInput}
        onEnterPress={() => {
          if (isIpv4(input)) {
            type === "public"
              ? updateStaticIp(input)
              : updateStaticLocalIp(input);
          }
        }}
        append={
          <>
            <Button
              variant="dappnode"
              disabled={
                // Invalid input
                !isIpv4(input) ||
                // Input is the same as previous IP
                (Boolean(staticIp) && staticIp === input)
              }
              onClick={() =>
                type === "public"
                  ? updateStaticIp(input)
                  : updateStaticLocalIp(input)
              }
            >
              {staticIp ? "Update" : "Enable"}
            </Button>
            {staticIp && (
              <Button
                variant="outline-dappnode"
                onClick={() => updateStaticIp("")}
              >
                Disable
              </Button>
            )}
          </>
        }
      />
    </div>
  );
}
