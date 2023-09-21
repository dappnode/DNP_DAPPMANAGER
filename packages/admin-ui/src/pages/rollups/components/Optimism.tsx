import React from "react";
import { api, useApi } from "api";
import { ThemeContext } from "App";
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
import { Alert, Button, Form, OverlayTrigger, Tooltip } from "react-bootstrap";
import Input from "components/Input";
import { confirm } from "components/ConfirmDialog";
import { disclaimer } from "../data";
import { withToast } from "components/toast/Toast";
import OpCommunity from "./OpCommunity";
import { IoHelpCircleOutline } from "react-icons/io5";

export default function Optimism({ description }: { description: string }) {
  const { theme } = React.useContext(ThemeContext);

  const currentOptimismConfigReq = useApi.optimismConfigGet();

  // hooks
  const {
    reqStatus,
    setReqStatus,
    ethRpcUrlError,
    newExecClient,
    setNewExecClient,
    customMainnetRpcUrl,
    setCustomMainnetRpcUrl,
    newRollup,
    setNewRollup,
    newArchive,
    setNewArchive,
    changes
  } = useOptimismConfig(currentOptimismConfigReq);

  /**
   * Set new Optimism config
   */
  async function setNewOptimismConfig() {
    try {
      if (changes) {
        await new Promise((resolve: (confirmOnSetConfig: boolean) => void) => {
          confirm({
            title: `Optimism configuration`,
            text:
              "Are you sure you want to implement this Optimism configuration?",
            buttons: [
              {
                label: "Continue",
                onClick: () => resolve(true)
              }
            ]
          });
        });
        await new Promise((resolve: (confirmOnSetConfig: boolean) => void) => {
          confirm({
            title: `Disclaimer`,
            text: disclaimer,
            buttons: [
              {
                label: "Continue",
                onClick: () => resolve(true)
              }
            ]
          });
        });

        setReqStatus({ loading: true });
        await withToast(
          () =>
            api.optimismConfigSet({
              archive: newArchive,
              rollup: newRollup
                ? {
                    ...newRollup,
                    mainnetRpcUrl: customMainnetRpcUrl
                      ? customMainnetRpcUrl
                      : newRollup?.mainnetRpcUrl
                  }
                : undefined,
              executionClient: newExecClient
            }),
          {
            message: `Setting new Optimism configuration...`,
            onSuccess: `Successfully set new Optimism configuration`,
            onError: `Error setting new Optimism configuration`
          }
        );
        setReqStatus({ result: true });
      }
    } catch (e) {
      setReqStatus({ error: e });
    } finally {
      setReqStatus({ loading: true });
      await withToast(() => currentOptimismConfigReq.revalidate(), {
        message: `Getting new Optimism staker configuration`,
        onSuccess: `Successfully loaded Optimism staker configuration`,
        onError: `Error new loading Optimism staker configuration`
      });
      setReqStatus({ loading: false });
    }
  }

  const renderTooltip = (props: any) => (
    <Tooltip {...props}>
      Set up your Optimism node configuration:
      <br />
      <br />
      (1) <b>Choose</b> an <b>Execution Client</b>
      <br />
      <br />
      (2) <b>Select</b> the <b>Optimism Node</b>
      <br />
      <br />
      (3) <b>Input</b> the <b>Ethereum RPC URL</b> (not necessary you are
      already running an Ethereum node in your Dappnode)
      <br />
      <br />
      (4) [Optional] <b>Select L2 Geth</b> to enable historical txs
    </Tooltip>
  );

  return (
    <div className={theme === "light" ? "optimism-light" : "optimism-dark"}>
      <OpCommunity />
      {currentOptimismConfigReq.data ? (
        <Card>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between"
            }}
          >
            <div style={{ display: "flex", alignItems: "center" }}>
              <h3>Post-Bedrock Node</h3>
              <OverlayTrigger
                delay={{ show: 250, hide: 400 }}
                overlay={renderTooltip}
                placement="bottom"
              >
                <IoHelpCircleOutline
                  style={{
                    cursor: "pointer",
                    fontSize: "1.5rem",
                    marginLeft: "1rem"
                  }}
                />
              </OverlayTrigger>
            </div>
          </div>

          <p>{description}</p>

          <>
            <Input
              value={customMainnetRpcUrl || ""}
              onValueChange={(value: string) => setCustomMainnetRpcUrl(value)}
              isInvalid={Boolean(ethRpcUrlError)}
              prepend="Ethereum RPC URL"
              placeholder="Ethereum mainnet RPC URL for Optimism node"
            />
            {customMainnetRpcUrl && ethRpcUrlError && (
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
                onClick={() => setNewOptimismConfig()}
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
