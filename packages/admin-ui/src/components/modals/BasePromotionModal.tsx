import React from "react";
import { externalUrlProps } from "params";
import { Link } from "react-router-dom";

import "./basePromotionModal.scss";

interface BasePromotionModalProps {
  show: boolean;
  onClose: () => void;
  title: string;
  description: string;
  imageSrc: string;
  imageAlt: string;
  primaryButtonText: string;
  primaryButtonAction: () => void;
  secondaryButton?: {
    text: string;
  } & (
    | { type: "action"; action: () => void }
    | { type: "internal-link"; to: string }
    | { type: "external-link"; href: string; onClick?: () => void }
  );
}

export default function BasePromotionModal({
  show,
  onClose,
  title,
  description,
  imageSrc,
  imageAlt,
  primaryButtonText,
  primaryButtonAction,
  secondaryButton
}: BasePromotionModalProps) {
  if (!show) return null;

  const renderSecondaryButton = () => {
    if (!secondaryButton) return null;

    const buttonElement = (
      <button className="promotion-full-width-button promotion-button-secondary">{secondaryButton.text}</button>
    );

    switch (secondaryButton.type) {
      case "action":
        return (
          <button className="promotion-full-width-button promotion-button-secondary" onClick={secondaryButton.action}>
            {secondaryButton.text}
          </button>
        );
      case "internal-link":
        return (
          <Link to={secondaryButton.to} className="promotion-link-button">
            {buttonElement}
          </Link>
        );
      case "external-link":
        return (
          <a
            href={secondaryButton.href}
            {...externalUrlProps}
            className="promotion-link-button"
            onClick={secondaryButton.onClick}
          >
            {buttonElement}
          </a>
        );
      default:
        return null;
    }
  };

  return (
    <div className="promotion-modal-overlay" onClick={onClose}>
      <div className="promotion-modal-container" onClick={(e) => e.stopPropagation()}>
        <button className="promotion-modal-close" onClick={onClose} aria-label="Close">
          ×
        </button>

        <div className="promotion-modal-header">
          <h2 className="promotion-modal-title">{title}</h2>
        </div>

        <div className="promotion-modal-image-container">
          <img src={imageSrc} alt={imageAlt} className="promotion-modal-image" />
        </div>

        <div className="promotion-modal-body">
          <div className="promotion-modal-description">
            <p>{description}</p>
          </div>

          <div className="promotion-modal-button-container">
            <button className="promotion-full-width-button promotion-button-primary" onClick={primaryButtonAction}>
              {primaryButtonText}
            </button>
            {renderSecondaryButton()}
          </div>
        </div>
      </div>
    </div>
  );
}
