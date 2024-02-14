import React, { useEffect, useState } from "react";
import { ZKEVMItem } from "../../../../../types/src/rollups";
import { useApi } from "api";
import { AppContext } from "App";
import Card from "components/Card";
import ErrorView from "components/ErrorView";
import Loading from "components/Loading";
import Col from "react-bootstrap/Col";
import Row from "react-bootstrap/Row";
import SubTitle from "components/SubTitle";
import "./columns.scss";
import { Alert, Button } from "react-bootstrap";
import ZkevmCommunity from "./ZKevmCommunity";
import ZkEvm from "./columns/ZkEvm";
import { responseInterface } from "swr";
import { useZkEvmConfig } from "./useZkEvmConfig";
import {
  listPackageNoThrow,
} from "@dappnode/dockerapi";

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


  const [isPackageInstalled, setIsPackageInstalled] = useState<boolean>(false);

  // Function to check package installation
  async function checkPackageInstallation() {
    try {
      const packageName = "zkevm-tokens-withdrawal.dnp.dappnode.eth";
      const installedPackage = await listPackageNoThrow({ dnpName: packageName });

      if (installedPackage) {
        console.log(`${packageName} is installed.`);
        setIsPackageInstalled(true);
        // Package is installed
      } else {
        console.log(`${packageName} is not installed.`);
        setIsPackageInstalled(false);
        // Package is not installed
      }
    } catch (error) {
      console.error("An error occurred while checking package installation:", error);
      // Handle error
    }
  }

  // Call the function when currentZkEvmConfigReq.data changes
  useEffect(() => {
    if (currentZkEvmConfigReq.data) {
      checkPackageInstallation();
    }
  }, [currentZkEvmConfigReq.data]);


  return (
    <div className={theme === "light" ? "optimism-light" : "optimism-dark"}>
      {/* Render the ZkEvmCommunity component */}
      <ZkevmCommunity />
      <p>{isPackageInstalled ? "Package is installed" : "Package is not installed"}</p>

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