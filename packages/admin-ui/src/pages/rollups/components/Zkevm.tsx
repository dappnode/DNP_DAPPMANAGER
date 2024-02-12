import React from "react";
import { useApi } from "api";
import { AppContext } from "App";
import Card from "components/Card";
import ErrorView from "components/ErrorView";
import Loading from "components/Loading";
import Col from "react-bootstrap/Col";
import Row from "react-bootstrap/Row";
import SubTitle from "components/SubTitle";
import { useZkEvmConfig } from "./useZkEvmConfig";
import "./columns.scss";
import { Alert, Button } from "react-bootstrap";
import ZkevmCommunity from "./ZKevmCommunity";
import ZkEvm from "./columns/ZkEvm";
import { responseInterface } from "swr";
import { ZKEVMItem } from "@dappnode/common";

type ZkEvmConfigGetResponse = responseInterface<ZKEVMItem<"rollup">[], Error>;

const zkEvmConfigGet = (): ZkEvmConfigGetResponse => {
 
  return {
    data: [], 
    revalidate: async () => true,
    mutate: async () => [],
    isValidating: false
  };
};

export default function Zkevm({ description }: { description: string }) {
  const { theme } = React.useContext(AppContext);
  const currentZkEvmConfigReq = zkEvmConfigGet();

  // hooks
  const { reqStatus, isZkEvmInstalled, setReqStatus } = useZkEvmConfig(
    currentZkEvmConfigReq
  );

  /**
   * Set new zkEVM config
   */
  async function setNewZkEvmConfig() {
    try {
      // logic for setting the zkEVM configuration here
    } catch (e) {
      setReqStatus({ error: e });
    } finally {
      // logic for updating the zkEVM configuration here
    }
  }

  function setNewZkEvmItem(value: any): void {
    throw new Error("Function not implemented.");
  }

  return (
    <div className={theme === "light" ? "optimism-light" : "optimism-dark"}>
      {/* Render the ZkEvmCommunity component */}
      <ZkevmCommunity />
      {currentZkEvmConfigReq.data ? (
        <Card>
          {/* Render the description */}
          <p>{description}</p>

          <Row className="staker-network">
            <Col>
              <SubTitle>zkEVM Modules</SubTitle>
              {/* Map over the zkEVM items */}
              {currentZkEvmConfigReq.data.map(
                (zkEvmItem: ZKEVMItem<"rollup">, i: number) => (
                  <ZkEvm
                    key={i}
                    zkEvmItem={zkEvmItem}
                    setNewZkEvmItem={setNewZkEvmItem}
                    isSelected={false} 
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
              {/* Button to apply changes */}
              <Button
                variant="dappnode"
                disabled={!isZkEvmInstalled || reqStatus.loading}
                onClick={() => setNewZkEvmConfig()}
              >
                Apply changes
              </Button>
            </div>

            {/* Render alert if changes are not allowed */}
            {!isZkEvmInstalled && (
              <>
                <br />
                <br />
                <Alert variant="danger">
                  Cannot apply changes: zkEVM is not installed
                </Alert>
              </>
            )}

            {/* Render error view if there's an error */}
            {reqStatus.error && (
              <ErrorView error={reqStatus.error} hideIcon red />
            )}
          </div>
        </Card>
      ) : currentZkEvmConfigReq.error ? (
        <ErrorView error={currentZkEvmConfigReq.error} hideIcon red />
      ) : currentZkEvmConfigReq.isValidating ? (
        <Loading steps={[`Loading zkEVM configuration`]} />
      ) : (
        <ErrorView error={"No data found"} hideIcon red />
      )}
    </div>
  );
}
