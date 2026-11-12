// Open /theme-contrast.html in the mock standalone dev server. This entry is
// excluded from the production bundle. Every theme checks the actual CSS cascade.
import React from "react";
import { createRoot } from "react-dom/client";
import { MemoryRouter } from "react-router-dom";
import Alert from "react-bootstrap/Alert";
import Card from "components/Card";
import Button from "components/Button";
import SwitchBig from "components/SwitchBig";
import { StateBadge } from "pages/packages/components/StateBadge";
import { TailscaleStatusPanel } from "pages/vpn/components/TailscaleStatusPanel";
import { dnpInstalled } from "../../__mock-backend__/data/dnpInstalled";
import { auditContrast } from "./contrast";
import "bootstrap/dist/css/bootstrap.min.css";
import "../../dappnode_styles.scss";
import "../../dappnode_colors.scss";
import "../../light_dark.scss";
import "components/notificationsMain.scss";
import "components/confirmDialog.scss";
import "components/smooth.scss";
import "components/sectionNavigator.scss";
import "pages/vpn/components/tailscale.scss";
import "pages/dashboard/components/networkStats.scss";
import "pages/installer/components/Steps/info.scss";
import "pages/installer/components/horizontalStepper.scss";
import "pages/packages/components/packages.scss";
import "pages/notifications/tabs/Inbox/inbox.scss";
import "pages/premium/components/premiumRoot.scss";

const dnp = dnpInstalled.find((pkg) => pkg.dnpName === "tailscale.dnp.dappnode.eth")!;
const states = ["Running", "NeedsLogin", "Starting", "NeedsMachineAuth", "Stopped", "Unavailable"];

function Fixtures() {
  return (
    <MemoryRouter>
      <div id="fixture">
        <div id="dark" className="body">
          <main id="main" style={{ padding: 24 }}>
            <h1>Theme contrast regression fixtures</h1>
            <div className="tailscale-vpn">
              {states.map((state) => (
                <TailscaleStatusPanel
                  key={state}
                  dnp={{
                    ...dnp,
                    packageSentData: {
                      "tailscale.status": JSON.stringify({
                        version: 1,
                        state,
                        online: state === "Running",
                        updatedAt: Math.floor(Date.now() / 1000),
                        authUrl: state === "NeedsLogin" ? "https://login.tailscale.com/a/MOCK-ONLY" : null
                      })
                    }
                  }}
                  onRefresh={() => {}}
                />
              ))}
            </div>
            <Card spacing>
              <p className="text-muted">Muted helper text</p>
              <small className="form-text">Form helper text</small>
              <div className="help-text">Help text</div>
              <div className="subtle-header">Secondary heading</div>
              <label className="form-label">Form label</label>
              <input className="form-control" type="email" defaultValue="test@example.com" />
              <textarea className="form-control" defaultValue="Textarea content" />
              <select className="form-select">
                <option>Selected option</option>
              </select>
              <div className="text-danger">Validation error</div>
              <div className="text-warning">Warning text</div>
              <div className="text-success">Success text</div>
              <a href="#">Regular link</a>
              <table className="table">
                <thead>
                  <tr>
                    <th>Table heading</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>Table cell</td>
                  </tr>
                </tbody>
              </table>
              {(
                [
                  "dappnode",
                  "outline-dappnode",
                  "outline-secondary",
                  "outline-danger",
                  "outline-warning",
                  "outline-info",
                  "warning",
                  "danger",
                  "info"
                ] as const
              ).map((variant) => (
                <Button key={variant} variant={variant}>
                  <span>{variant} button</span>
                </Button>
              ))}
              {(["success", "warning", "danger", "secondary"] as const).map((variant) => (
                <span key={variant} className={`badge badge-${variant}`}>
                  {variant} badge
                </span>
              ))}
              <Button variant="dappnode" className="active">
                Active primary button
              </Button>
              <Button variant="outline-dappnode" className="active">
                Active outline button
              </Button>
              <SwitchBig id="switch-on" label="Enabled switch" checked onChange={() => {}} />
              <SwitchBig id="switch-off" label="Disabled setting" checked={false} onChange={() => {}} />
              {(["success", "warning", "danger", "secondary"] as const).map((variant) => (
                <StateBadge key={variant} variant={variant} state="running" title={variant} />
              ))}
            </Card>
            {(["success", "warning", "danger", "info", "secondary"] as const).map((variant) => (
              <Alert key={variant} variant={variant}>
                <h5>{variant} alert</h5>
                <p>
                  Nested <strong>important text</strong> and <a href="#">help link</a>
                </p>
              </Alert>
            ))}
            <div className="banner-notifications-col">
              {["low", "medium", "high", "critical"].map((priority) => (
                <div key={priority} className={`banner-card ${priority}-priority`}>
                  <h5>{priority} priority banner</h5>
                  <div>Nested notification text</div>
                  <Button variant="dappnode">
                    <div className="btn-text">Notification action</div>
                  </Button>
                </div>
              ))}
            </div>
            <nav className="horizontal-navbar">
              <a className="item active">Active tab</a>
              <a className="item">Inactive tab</a>
            </nav>
            <div className="network-stats">
              <div className="network-cards-container">
                <Card className="network-stats-card">
                  <div className="network-stat-col">
                    <span className="badge-status syncing">Syncing</span>
                  </div>
                </Card>
              </div>
            </div>
            <Card style={{ background: "#ffeda6", color: "#433c1d" }}>
              <div>
                <p>Featured package with a custom color pair</p>
              </div>
            </Card>
            <div className="notification-card">
              <div className="notification-header">
                <div className="notification-header-data">
                  {["resolved", "critical", "high", "medium", "low", "category"].map((priority) => (
                    <span key={priority} className={`${priority}-label`}>
                      {priority} notification
                    </span>
                  ))}
                </div>
              </div>
            </div>
            <div className="premium-root">
              <div className="premium-header">
                <div className="premium-status activated">Activated</div>
                <div className="premium-status deactivated">Deactivated</div>
              </div>
            </div>
          </main>
        </div>
        <div id="dark-dialog">
          <div className="confirm-dialog-root" style={{ position: "static" }}>
            <div className="dialog">
              <h3>Confirmation</h3>
              <strong>List item title</strong>
              <div className="text">Dialog content</div>
              <Button>Cancel</Button>
              <Button variant="outline-danger">Confirm action</Button>
            </div>
          </div>
        </div>
        <div className="modal-content p-3">
          <div className="smooth-modal-title">Portal modal title</div>
          <p>Portal modal content</p>
        </div>
      </div>
    </MemoryRouter>
  );
}

createRoot(document.getElementById("root")!).render(<Fixtures />);

// Automatically exercise both themes in a real browser, without a production dependency.
setTimeout(async () => {
  const results = [];
  for (const theme of ["light", "dark"]) {
    document.documentElement.dataset.bsTheme = theme;
    document.documentElement.className = theme;
    document.body.className = theme;
    document.querySelector(".body")!.id = theme;
    document.querySelector(".confirm-dialog-root")!.parentElement!.id = `${theme}-dialog`;
    await new Promise((resolve) => setTimeout(resolve, 300));
    results.push({ theme, ...auditContrast(document.getElementById("fixture")!) });
  }
  const report = document.createElement("pre");
  report.id = "contrast-report";
  report.style.cssText = "padding:24px;white-space:pre-wrap;color:inherit";
  report.textContent = JSON.stringify(results, null, 2);
  document.body.prepend(report);
  document.title = `${results.reduce((total, result) => total + result.failures.length, 0)} contrast failures`;
}, 500);
