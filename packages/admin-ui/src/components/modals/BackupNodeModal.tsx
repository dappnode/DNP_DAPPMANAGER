import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import dappnodeServerShield from "img/dappnode_server_shield.png";

import "./backupNodeModal.scss";

export default function BackupNodeModal() {
  const [modalShown, setModalShown] = useState(false);

  useEffect(() => {
    setModalShown(true);
    return () => setModalShown(false);
  }, []);

  const closeModal = () => {
    setModalShown(false);
  };

  if (!modalShown) return null;

  return (
    <div className="backup-modal-overlay" onClick={closeModal}>
      <div className="backup-modal-container" onClick={(e) => e.stopPropagation()}>
        <button className="backup-modal-close" onClick={closeModal} aria-label="Close">
          ×
        </button>

        <div className="backup-modal-header">
          <h2 className="backup-node-modal-title">Node runner, you are losing rewards!</h2>
        </div>

        <div className="backup-modal-image-container">
          <img src={dappnodeServerShield} alt="DAppNode Server Shield" className="backup-modal-image" />
        </div>

        <div className="backup-modal-body">
          <div className="backup-node-modal-description">
            <p>
              The Backup node keeps your validators attesting when your local clients are syncing or not available. No
              more downtime.
            </p>
          </div>

          <div className="backup-node-modal-button-container">
            <button className="backup-full-width-button backup-button-primary" onClick={closeModal}>
              Upgrade to Premium
            </button>
            <Link to="https://docs.dappnode.io/docs/backup" target="_blank" className="backup-link-button">
              <button className="backup-full-width-button backup-button-secondary">Learn More</button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
