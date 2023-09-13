import React from "react";
import { api, useApi } from "api";
import { ThemeContext } from "App";
import { responseInterface } from "swr";
import Card from "components/Card";
import ErrorView from "components/ErrorView";
import Loading from "components/Loading";
import Col from "react-bootstrap/Col";
import Row from "react-bootstrap/Row";
import SubTitle from "components/SubTitle";
import ExecutionClient from "./columns/ExecutionClient";
import LegacyGeth from "./columns/LegacyGeth";
import OptimismNode from "./columns/OptimismNode";
import { useOptimismConfig } from "./useOptimismConfig";
import "./columns.scss";
import { Alert, Button, Form } from "react-bootstrap";
import Input from "components/Input";

export default function Optimism({ description }: { description: string }) {
  const { theme } = React.useContext(ThemeContext);

  const currentOptimismConfigReq = useApi.optimismConfigGet();

  // hooks
  const {
    reqStatus,
    setReqStatus,
    ethRpcUrl,
    setEthRpcUrl,
    ethRpcUrlError,
    setEthRpcUrlError,
    newExecClient,
    setNewExecClient,
    newRollup,
    setNewRollup,
    newArchive,
    setNewArchive,
    currentOptimismConfig,
    setCurrentOptimismConfig,
    changes
  } = useOptimismConfig(currentOptimismConfigReq);

  return (
    <div className={theme === "light" ? "optimism-light" : "optimism-dark"}>
      {currentOptimismConfigReq.data ? (
        <Card>
          <p>
            Set up your Optimism node configuration. You will need to: <br />
            (1) Choose an Execution Layer client <br />
            (2) Install the optimism node with an Ethereum RPC endpoint
            <br />
            (3) Optional; activate/deactivate archive node for historical tx.
          </p>
          <br />

          <p>{description}</p>

          <>
            <Input
              value={ethRpcUrl || ""}
              onValueChange={setEthRpcUrl}
              isInvalid={Boolean(ethRpcUrlError)}
              prepend="Ethereum RPC URL"
              placeholder="Ethereum mainnet RPC URL for Optimism node"
            />
            {ethRpcUrl && ethRpcUrlError && (
              <Form.Text className="text-danger" as="span">
                {ethRpcUrlError}
              </Form.Text>
            )}
          </>

          <Row className="staker-network">
            <Col>
              <SubTitle>Execution Clients</SubTitle>
              {currentOptimismConfigReq.data.executionClients.map(
                (executionClient, i) => (
                  <ExecutionClient
                    key={i}
                    executionClient={executionClient}
                    setNewExecClient={setNewExecClient}
                    isSelected={
                      executionClient.dnpName === newExecClient?.dnpName
                    }
                  />
                )
              )}
            </Col>

            <Col>
              <SubTitle>Optimism Node</SubTitle>
              <OptimismNode
                rollup={currentOptimismConfigReq.data.rollup}
                setNewRollup={setNewRollup}
                isSelected={
                  currentOptimismConfigReq.data.rollup.dnpName ===
                  newRollup?.dnpName
                }
              />
            </Col>

            <Col>
              <SubTitle>Legacy Geth</SubTitle>
              <LegacyGeth
                archive={currentOptimismConfigReq.data.archive}
                setNewArchive={setNewArchive}
                isSelected={
                  currentOptimismConfigReq.data.archive.dnpName ===
                  newArchive?.dnpName
                }
              />
            </Col>
          </Row>

          <hr />

          <div>
            <div className="staker-buttons">
              <Button
                variant="dappnode"
                disabled={!changes.isAllowed || reqStatus.loading}
                onClick={() => /* TODO */ console.log("TODO")}
              >
                Apply changes
              </Button>
            </div>

            {!changes.isAllowed && changes.reason && (
              <>
                <br />
                <br />
                <Alert variant={changes.severity}>
                  Cannot apply changes: <b>{changes.reason}</b>
                </Alert>
              </>
            )}

            {reqStatus.error && (
              <ErrorView error={reqStatus.error} hideIcon red />
            )}
          </div>
        </Card>
      ) : currentOptimismConfigReq.error ? (
        <ErrorView error={currentOptimismConfigReq.error} hideIcon red />
      ) : currentOptimismConfigReq.isValidating ? (
        <Loading steps={[`Loading Optimism configuration`]} />
      ) : (
        <ErrorView error={"No data found"} hideIcon red />
      )}
    </div>
  );
}
