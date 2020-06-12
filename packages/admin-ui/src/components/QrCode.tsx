import React from "react";
import QRCode from "qrcode.react";

function QrCode({ width, url }: { width: string; url: string }) {
  if (!url) return null;

  return (
    <div>
      <div style={{ maxWidth: width, margin: "auto" }}>
        {url && (
          <QRCode
            value={url}
            renderAs="svg"
            style={{ width: "100%", height: "100%" }}
          />
        )}
      </div>
    </div>
  );
}

export default QrCode;
