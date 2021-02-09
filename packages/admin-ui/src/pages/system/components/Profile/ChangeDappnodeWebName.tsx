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


    async function onChangeDappNodeWebName(newDappnodeWebName: string){
        if(isValid){
            try{
                setReqStatus({ loading: true });
                await api.dappnodeWebNameSet({ dappnodeWebName: newDappnodeWebName });
                setReqStatus({ result: true });
            }catch(e){
                setReqStatus({ error: e });
            }
        }

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
                error: isValid
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
            {reqStatus.result && <Ok ok msg={"Dappnode name changed, refresh the page to see the changes"}></Ok>}
            {reqStatus.error && <ErrorView error={reqStatus.error} hideIcon red />}
      </>

    );
    

}