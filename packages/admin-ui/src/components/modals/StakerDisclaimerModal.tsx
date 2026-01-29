import React, { useState } from "react";
import { Modal } from "react-bootstrap";
import Button from "components/Button";
import { ModernAccordion } from "components/ModernAccordion";
import { termsOfUseList } from "pages/stakers/data";

import "./stakerDisclaimerModal.scss";

interface StakerDisclaimerModalProps {
  show: boolean;
  onClose: (accepted: boolean) => void;
}

// Parse the terms of use list into accordion items
const parseTermsSections = (termsList: string[]) => {
  const items: { title: string; content: React.ReactNode }[] = [];

  // Skip the first item (intro) and process the rest
  for (let i = 1; i < termsList.length; i++) {
    const text = termsList[i].trim();
    // Split by first line break to get title and content
    const lines = text.split("\n");
    // Remove ## from title
    const title = lines[0].replace(/^##\s*/, "").trim();
    const content = lines.slice(1).join("\n").trim();
    
    // Convert content to React elements
    const contentElements = (
      <>
        {content.split('\n\n').map((paragraph, index) => (
          <p key={index}>{paragraph}</p>
        ))}
      </>
    );
    
    items.push({ title, content: contentElements });
  }

  return items;
};

export function StakerDisclaimerModal({ show, onClose }: StakerDisclaimerModalProps) {
  const [hasAccepted, setHasAccepted] = useState(false);

  const intro = termsOfUseList[0]; // First item is the intro
  const accordionItems = parseTermsSections(termsOfUseList);

  const handleClose = () => {
    setHasAccepted(false);
    onClose(false);
  };

  const handleAccept = () => {
    if (hasAccepted) {
      setHasAccepted(false);
      onClose(true);
    }
  };

  if (!show) return null;

  return (
    <Modal show={show} onHide={handleClose} size="lg" centered className="staker-disclaimer-modal">
      <Modal.Header closeButton>
        <Modal.Title>Terms of Use – Dappnode</Modal.Title>
      </Modal.Header>

      <Modal.Body>
        <div className="disclaimer-intro">
          <p>
            <strong>Effective as of Oct 14, 2020</strong>
          </p>
          <p>
            <strong>Last updated: January 28, 2026</strong>
          </p>
          {intro.split('\n\n').slice(1).map((paragraph, index) => (
            <p key={index}>{paragraph.replace(/\*\*/g, '')}</p>
          ))}
        </div>

        <div className="disclaimer-sections">
          <ModernAccordion items={accordionItems} allowMultipleOpen={true} />
        </div>

        <div className="disclaimer-acceptance">
          <label className="disclaimer-checkbox-label">
            <input type="checkbox" checked={hasAccepted} onChange={(e) => setHasAccepted(e.target.checked)} />
            <span>I have read and agree to the Terms of Use and Privacy Policy</span>
          </label>
        </div>
      </Modal.Body>

      <Modal.Footer>
        <Button variant="outline-secondary" onClick={handleClose}>
          Cancel
        </Button>
        <Button variant="dappnode" onClick={handleAccept} disabled={!hasAccepted}>
          Accept and Continue
        </Button>
      </Modal.Footer>
    </Modal>
  );
}
