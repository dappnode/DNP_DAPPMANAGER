import React, { useEffect, useState } from "react";
import SubTitle from "components/SubTitle";
import Card from "components/Card";
import Col from "react-bootstrap/Col";
import Row from "react-bootstrap/Row";
import { InstalledPackageDataApiReturn } from "types";
import { useApi } from "api";
import ErrorView from "components/ErrorView";
import Ok from "components/Ok";
import MevBoost from "./MevBoost";
import RemoteSigner from "./RemoteSigner";
import ConsensusClient from "./ConsensusClient";
import ExecutionClient from "./ExecutionClient";

export default function StakerNetwork({
  network,
  description,
  executionClients,
  consensusClients,
  signer,
  mevBoost
}: {
  network: string;
  description: string;
  executionClients: string[];
  consensusClients: string[];
  signer: string;
  mevBoost?: string;
}) {
  const [executionClientsInstalled, setExecutionClientsInstalled] = useState<
    InstalledPackageDataApiReturn[]
  >([]);
  const [consensusClientsInstalled, setConsensusClientsInstalled] = useState<
    InstalledPackageDataApiReturn[]
  >([]);
  const [signerInstalled, setSignerInstalled] = useState<
    InstalledPackageDataApiReturn
  >();
  const [mevBoostInstalled, setMevBoostInstalled] = useState<
    InstalledPackageDataApiReturn
  >();

  const dnps = useApi.packagesGet();

  useEffect(() => {
    if (dnps.data) {
      setExecutionClientsInstalled(
        dnps.data.filter(dnp => executionClients.includes(dnp.dnpName))
      );
      setConsensusClientsInstalled(
        dnps.data.filter(dnp => consensusClients.includes(dnp.dnpName))
      );
      setSignerInstalled(dnps.data.find(dnp => dnp.dnpName === signer));
      if (mevBoost)
        setMevBoostInstalled(dnps.data.find(dnp => dnp.dnpName === mevBoost));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dnps.data]);

  /**
   * Set the execution client to be used:
   * -
   */
  async function setExecutionClient() {
    // TODO
  }

  /**
   * Set the consensus client to be used:
   * -
   */
  async function setConsensusClient() {
    // TODO
  }

  if (dnps.error) return <ErrorView error={dnps.error} hideIcon red />;
  if (dnps.isValidating) return <Ok loading msg="Loading packages" />;
  if (!dnps.data) return <ErrorView error={"No data"} hideIcon red />;

  return (
    <>
      <Row>
        <Col>
          <SubTitle>Execution Clients</SubTitle>
          <Card>
            {executionClients.map(executionClient => (
              <ExecutionClient
                executionClient={executionClient}
                isInstalled={executionClientsInstalled.some(
                  el => el.dnpName === executionClient
                )}
              />
            ))}
          </Card>
        </Col>
        <Col>
          <SubTitle>Consensus Clients</SubTitle>
          <Card>
            {consensusClients.map(consensusClient => (
              <ConsensusClient
                consensusClient={consensusClient}
                isInstalled={consensusClientsInstalled.some(
                  cl => cl.dnpName === consensusClient
                )}
              />
            ))}
          </Card>
        </Col>

        <Col>
          <SubTitle>Remote signer</SubTitle>
          <RemoteSigner
            signer={signer}
            isInstalled={signerInstalled ? true : false}
          />
        </Col>

        {mevBoost && (
          <Col>
            <SubTitle>Mev Boost</SubTitle>
            <MevBoost
              mevBoost={mevBoost}
              isInstalled={mevBoostInstalled ? true : false}
            />
          </Col>
        )}
      </Row>
    </>
  );
}
