import React, { useEffect, useState } from "react";
import Button from "components/Button";
import { api } from "api";
import { InputForm } from "components/InputForm";
import { useSelector } from "react-redux";
import { getDappnodeName } from "services/dappnodeStatus/selectors";
import { withToastNoThrow } from "components/toast/Toast";
import { validateDappnodeWebName } from "utils/validation";
import ErrorView from "components/ErrorView";
import Ok from "components/Ok";
import { ReqStatus } from "types";

export function ChangeDappnodeWebName() {
    
    const dappnodeWebName = useSelector(getDappnodeName);
    const [input, setInput] = useState(dappnodeWebName);
    const [reqStatus, setReqStatus] = useState<ReqStatus>({});

    const isValid = validateDappnodeWebName(dappnodeWebName);

    useEffect(() => {
        setInput(dappnodeWebName);
      }, [dappnodeWebName]);


    function onChangeDappNodeWebName(newDappnodeWebName: string) {
        withToastNoThrow(() => api.dappnodeWebNameSet({ dappnodeWebName: newDappnodeWebName }), {
          message: "Setting dappnode name ...",
          onSuccess: "Regresh the page to see the changes"
        });
      }
    


    return (
        <>
            <InputForm fields={[
            {
                label: "Current Dappnode Name",
                labelId: "current-dappnode-name",
                name: "Current-dappnode-name",
                autoComplete: "current-dappnode-name",
                secret: false,
                value: input,
                onValueChange: setInput,
            }
            ]}
            >
            <Button
                type="submit"
                onClick={() => onChangeDappNodeWebName(input)}
                variant="dappnode"
                disabled={reqStatus.loading}
            >
                    Change dappnode Name
                </Button>
            </InputForm>
      </>

    );
    

}