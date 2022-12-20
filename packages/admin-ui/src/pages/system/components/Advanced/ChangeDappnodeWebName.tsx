import React, { useEffect, useState } from "react";
import Button from "components/Button";
import { api } from "api";
import { InputForm } from "components/InputForm";
import { useSelector, useDispatch } from "react-redux";
import { getDappnodeName } from "services/dappnodeStatus/selectors";
import { withToastNoThrow } from "components/toast/Toast";
import { fetchSystemInfo } from "services/dappnodeStatus/actions";

export function ChangeDappnodeWebName() {
  const dappnodeWebName = useSelector(getDappnodeName);
  const [input, setInput] = useState(dappnodeWebName);
  const dispatch = useDispatch();
  useEffect(() => {
    setInput(dappnodeWebName);
  }, [dappnodeWebName]);

  function onChangeDappNodeWebName() {
    withToastNoThrow(() => api.dappnodeWebNameSet({ dappnodeWebName: input }), {
      message: "Setting DAppNode name ...",
      onSuccess: "DAppNode name changed correctly"
    }).then(() => {
      dispatch(fetchSystemInfo());
    });
  }

  return (
    <>
      <InputForm
        fields={[
          {
            label: "Current Dappnode Name",
            labelId: "current-dappnode-name",
            name: "Current-dappnode-name",
            autoComplete: "current-dappnode-name",
            secret: false,
            value: input,
            onValueChange: setInput
          }
        ]}
      >
        <Button
          type="submit"
          onClick={() => onChangeDappNodeWebName()}
          variant="dappnode"
        >
          Change dappnode Name
        </Button>
      </InputForm>
    </>
  );
}
