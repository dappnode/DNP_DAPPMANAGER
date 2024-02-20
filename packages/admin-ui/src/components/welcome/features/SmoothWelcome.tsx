import React from "react";
import BottomButtons from "../BottomButtons";
import { Link } from "react-router-dom";
import { useApi } from "api";
import Button from "components/Button";
import { BsInfoCircleFill } from "react-icons/bs";


export default function SmoothWelcome({
  onBack,
  onNext
}: {
  onBack?: () => void;
  onNext: () => void;
}) {
  const dnpsRequest = useApi.packagesGet();

  // Check if the "web3signer.dnp.dappnode.eth" package is installed
  const web3SignerDnp = dnpsRequest.data?.find(dnp => dnp.dnpName === "web3signer.dnp.dappnode.eth");

  return (
    <>
      <div className="header">
        <BsInfoCircleFill className="links-icon" />
        <div className="title">Smooth by Dappnode is here!</div>
        <div className="description">
          <p>
            Welcome to Smooth, a MEV Smoothing Pool designed to enhance your Ethereum solo staking journey. By aggregating MEV rewards, Smooth provides solo stakers with a distinct advantage, allowing them to:
          </p>
          <div className="centered">
            <ul className="list">
              <li>🚀 Consistently earn higher rewards</li>
              <li>🍀 Minimize dependency on luck</li>
              <li>💰 Maximize the potential of every staked ether</li>
            </ul>
          </div>
          <p>
            Elevate your solo staking experience with Smooth! Ready to learn more?{" "}
            <Link to="https://docs.dappnode.io/docs/smooth/" target="_blank">Explore now</Link>
          </p>
        </div>

        {web3SignerDnp ? (
          // Package is installed
          <>
            <div className="button-container">
              <Link to="https://smooth.dappnode.io/" target="_blank">
                <Button variant="dappnode" className="full-width-button">
                  Go to Smooth
                </Button>
              </Link>

              <Link to="http://brain.web3signer.dappnode/" target="_blank">
                <Button variant="dappnode" className="full-width-button">
                  Go to Brain
                </Button>
              </Link>
            </div>
          </>
        ) : (
          // Package is not installed
          <>
            <Link to="https://smooth.dappnode.io/" target="_blank">
              <Button variant="dappnode" className="full-width-button">
                Go to Smooth
              </Button>
            </Link>
          </>
        )}
      </div>
      <BottomButtons onBack={onBack} onNext={onNext} />
    </>
  );
}
