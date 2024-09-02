import React, { useState, useEffect } from "react";
import { api } from "api";
import { useSelector } from "react-redux";
import isIpv4 from "utils/isIpv4";
import { withToastNoThrow } from "components/toast/Toast";
// Components
import Input from "components/Input";
import Button from "components/Button";
// External
import { getStaticIp } from "services/dappnodeStatus/selectors";

export function StaticIp() {
  const staticIp = useSelector(getStaticIp);
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

  return (
    <div className="input-group">
      <Input
        placeholder="Your static ip..."
        value={input}
        onValueChange={setInput}
        onEnterPress={() => {
          if (isIpv4(input)) updateStaticIp(input);
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
              onClick={() => updateStaticIp(input)}
            >
              {staticIp ? "Update" : "Enable"}
            </Button>
            {staticIp && (
              <Button variant="outline-dappnode" onClick={() => updateStaticIp("")}>
                Disable
              </Button>
            )}
          </>
        }
      />
    </div>
  );
}
