import React, { useState } from "react";
import Card from "components/Card";
import Col from "react-bootstrap/Col";
import Row from "react-bootstrap/Row";
import SubTitle from "components/SubTitle";
import { useApi } from "api";
import { useNavigate } from "react-router-dom";
import Alert from "react-bootstrap/esm/Alert";
import ErrorView from "components/ErrorView";
import defaultAvatar from "img/defaultAvatar.png";
import { ReqStatus } from "types";
import Button from "components/Button";
import { zkevmDnpName, packageInfoPath, zkevmUiUrl } from "params";
import ZkevmCommunity from "./ZKevmCommunity";
import { prettyDnpName } from "utils/format";

export function Zkevm() {
  const navigate = useNavigate();
  const [reqStatus] = useState<ReqStatus>({});
  const dnpsRequest = useApi.packagesGet();

  // Declare zkevmDnp and zkevmRunning variables
  const zkevmDnp = dnpsRequest.data?.find(dnp => dnp.dnpName === zkevmDnpName);
  const zkevmRunning = zkevmDnp?.containers.every(container => container.running);

  return (
    <div>
      <ZkevmCommunity />
      <Card>
        <p>The zkEVM is a zero-knowledge powered scalability solution. You can use your dappnode to run self-sovereign tools to empower yourself.
          Currently, you can deploy your own UI to Force Transactions in the zkEVM without needing the sequencer, making you uncensorable. Most of the times you won't need this, as it needs ETH in L1 to pay for it, but if something were to happen to the zkEVM, you would be able to withdraw your funds.</p>
        {zkevmDnp && (
          <Row className="staker-network">
            <Col>
              <SubTitle>zkEVM Token Withdrawal</SubTitle>
              {zkevmRunning ? (
                <Card className={`zkevm-rollup`} shadow={false}>
                  <div className="avatar">
                    <img src={zkevmDnp.avatarUrl || defaultAvatar} alt="avatar" />
                  </div>
                  <div className="title">{prettyDnpName(zkevmDnp.dnpName)}</div>

                  <br />
                  <Alert variant="success">
                    The Zkevm package is currently <span className="running-text">running</span>
                  </Alert>
                  <a
                    href={zkevmUiUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <Button variant="dappnode" className="fullWidthButton">Go to UI</Button>
                  </a>
                </Card>
              ) : (
                <Card className="not-found">
                  {/* zkevmDnp is not running */}
                  <div className="avatar">
                    <img src={zkevmDnp.avatarUrl || defaultAvatar} alt="avatar" />
                  </div>
                  <div className="title">{prettyDnpName(zkevmDnp.dnpName)}</div>
                  <br />
                  <Alert variant="warning">
                    The Zkevm package is installed but not currently running.
                  </Alert>
                  <Button
                    variant="dappnode"
                    className="fullWidthButton"
                    onClick={() => navigate(packageInfoPath)}
                  >
                    GO TO PACKAGES
                  </Button>
                </Card>
              )}
            </Col>
            <Col>
            </Col>
            <Col>
            </Col>
          </Row>
        )}
        <div>
          {reqStatus.error && (
            <ErrorView error={reqStatus.error} hideIcon red />
          )}
        </div>
      </Card>
    </div>
  );

}
