import React, { useState, useEffect } from "react";
import { useSelector } from "react-redux";
import { getShouldShowSmooth } from "services/dappnodeStatus/selectors";
import { api } from "api";
import Modal from "react-bootstrap/Modal";
import Button from "react-bootstrap/Button";
import { Link } from "react-router-dom";
import { mainSmooth, docsSmooth, brainSmooth } from "params";
import "./smooth.scss";

export default function Smooth() {
  const shouldShowSmooth = useSelector(getShouldShowSmooth);
  const [modalShown, setModalShown] = useState(false);

  useEffect(() => {
    if (shouldShowSmooth) {
      setModalShown(true);
    } else {
      setModalShown(false);
    }
  }, [shouldShowSmooth]);

  const closeModal = () => {
    setModalShown(false);
    handleModalClose();
  };

  const handleModalClose = async () => {
    try {
      await api.setShouldShownSmooth({ isShown: true });
    } catch (error) {
      console.error("Error setting shouldShownSmooth:", error);
    }
  };

  return (
    <Modal show={modalShown} onHide={closeModal} centered size="lg" dialogClassName="custom-modal">
      <Modal.Header closeButton className="custom-header">
        <Modal.Title>
          <div className="smooth-modal-title">Smooth by Dappnode is here!</div>
        </Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <div>
          <div className="smooth-modal-description">
            <p>
              Welcome to Smooth, a MEV Smoothing Pool designed to enhance your Ethereum solo staking journey. By
              aggregating MEV rewards, Smooth provides solo stakers with a distinct advantage, allowing them to:
            </p>
            <div>
              <ul>
                <li>🚀 Consistently earn higher rewards</li>
                <li>🍀 Minimize dependency on luck</li>
                <li>💰 Maximize the potential of every staked ether</li>
              </ul>
            </div>
            <p>
              Elevate your solo staking experience with Smooth! Ready to learn more?{" "}
              <Link to={docsSmooth} target="_blank">
                Explore now
              </Link>
            </p>
          </div>
          <div className="smooth-modal-button-container">
            <Link to={mainSmooth} target="_blank">
              <Button variant="dappnode" className="smooth-full-width-button">
                Go to Smooth
              </Button>
            </Link>

            <Link to={brainSmooth} target="_blank">
              <Button variant="dappnode" className="smooth-full-width-button">
                Go to Brain
              </Button>
            </Link>
          </div>
        </div>
      </Modal.Body>
    </Modal>
  );
}
