import React from "react";
import { api, useApi } from "api";
import { AppContext } from "App";
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
import { confirm } from "components/ConfirmDialog";
import { disclaimer } from "../data";
import { withToast } from "components/toast/Toast";
import ZkevmCommunity from "./ZKevmCommunity";

export default function Zkevm({ description }: { description: string }) {
  const { theme } = React.useContext(AppContext);

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

  return (
    <div className={theme === "light" ? "optimism-light" : "optimism-dark"}>
      <ZkevmCommunity />
      {currentOptimismConfigReq.data ? (
        <Card>
          <p>
            The zkEVM is a zero-knowledge powered scalability solution. You can
            use your dappnode to run self-sovereign tools to empower yourself.
            Currently, you can deploy your own UI to Force Transactions in the
            zkEVM without needing the sequencer, making you uncensorable. Most
            of the times you won't need this, as it needs ETH in L1 to pay for
            it, but if something were to happen to the zkEVM, you would be able
            to withdraw your funds.
            <br />
            <br />
            (1) <b>Choose</b> an <b>Execution Client</b> <br />
            (2) <b>Select</b> the <b>zkEVM Node</b> <br />
            (3) <b>Input</b> the <b>Ethereum RPC URL</b> (Not necessary if you
            are already running an Ethereum mainnet node on this Dappnode)
            <br />
            (4) [Optional] <b>Select Legacy Geth</b> to enable historical
            transactions
          </p>
          <br />

          <p>{description}</p>

          <>
            <Input
              value={customMainnetRpcUrl || ""}
              onValueChange={(value: string) => setCustomMainnetRpcUrl(value)}
              isInvalid={Boolean(ethRpcUrlError)}
              prepend="Ethereum RPC URL"
              placeholder="Ethereum mainnet RPC URL for zkEVM node"
            />
            {customMainnetRpcUrl && ethRpcUrlError && (
              <Form.Text className="text-danger" as="span">
                {ethRpcUrlError}
              </Form.Text>
            )}
          </>

          <Row className="staker-network">
            <Col>
              <SubTitle>zkEVM Modules</SubTitle>
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

            <Col></Col>

            <Col></Col>
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
        <Loading steps={[`Loading zkEVM configuration`]} />
      ) : (
        <ErrorView error={"No data found"} hideIcon red />
      )}
    </div>
  );
}
