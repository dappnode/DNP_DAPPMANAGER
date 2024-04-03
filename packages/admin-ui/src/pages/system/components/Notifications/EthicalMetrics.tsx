import { api, useApi } from "api";
import Button from "components/Button";
import Card from "components/Card";
import ErrorView from "components/ErrorView";
import Input from "components/Input";
import Ok from "components/Ok";
import { withToast } from "components/toast/Toast";
import React, { useEffect, useState } from "react";
import { Accordion } from "react-bootstrap";
import Form from "react-bootstrap/esm/Form";
import { BsInfoCircleFill } from "react-icons/bs";
import { IoIosArrowUp, IoIosArrowDown } from "react-icons/io";
import { ReqStatus } from "types";
import "./ethicalMetrics.scss";
import { AppContext } from "App";
import SwitchBig from "components/SwitchBig";
import { confirm } from "components/ConfirmDialog";
import LinkDocs from "components/LinkDocs";
import { docsUrl } from "params";

export default function EthicalMetrics() {
  const { theme } = React.useContext(AppContext);

  const ethicalMetricsConfig = useApi.getEthicalMetricsConfig();
  const [ethicalMetricsOn, setEthicalMetricsOn] = useState(false);

  const [mail, setMail] = useState("");
  const [mailError, setMailError] = useState(false);

  const [tgAccordionOpen, setTgAccordionOpen] = useState(false);
  const [tgChannelId, setTgChannelId] = useState("");
  const [tgChannelIdError, setTgChannelIdError] = useState(false);

  const [reqStatusEnable, setReqStatusEnable] = useState<ReqStatus>({});
  const [reqStatusDisable, setReqStatusDisable] = useState<ReqStatus>({});

  useEffect(() => {
    const emailRegex = /\S+@\S+\.\S+/;
    const tgChannelIdRegex = /^-100\d{10}(?:_\d{1,3})?$/;

    // Email validation
    if (emailRegex.test(mail) || mail === "") {
      setMailError(false);
    } else {
      setMailError(true);
    }

    // Telegram channel ID validation
    if (tgChannelIdRegex.test(tgChannelId) || tgChannelId === "") {
      setTgChannelIdError(false);
    } else {
      setTgChannelIdError(true);
    }
  }, [mail, tgChannelId]);

  useEffect(() => {
    const ethicalMetricsData = ethicalMetricsConfig.data;
    if (ethicalMetricsData) {
      setMail(ethicalMetricsData.mail || "");
      setTgChannelId(ethicalMetricsData.tgChannelId || "");
      setEthicalMetricsOn(ethicalMetricsData.enabled);
    }
  }, [ethicalMetricsConfig.data]);

  async function enableEthicalMetricsSync({
    mailValue = ethicalMetricsConfig.data?.mail,
    tgChannelIdValue = ethicalMetricsConfig.data?.tgChannelId
  }) {
    try {
      setReqStatusEnable({ loading: true });

      await withToast(
        () =>
          api.enableEthicalMetrics({
            mail: mailValue ? mailValue : null,
            tgChannelId: tgChannelIdValue ? tgChannelIdValue : null,
            sync: true
          }),
        {
          message: `Enabling ethical metrics via ${mailValue && tgChannelIdValue
            ? "telegram channel and email"
            : mailValue
              ? "email"
              : tgChannelId && "telegram channel"
            }`,
          onSuccess: `Enabled ethical metrics`
        }
      );
      setReqStatusEnable({ result: true });
      await ethicalMetricsConfig.revalidate();
      setEthicalMetricsOn(true);
    } catch (e) {
      setReqStatusEnable({ error: e });
      console.error("Error on enableEthicalMetrics", e);
      setEthicalMetricsOn(false);
    }
  }

  function disableConfirmation() {
    confirm({
      title: `Disabling Ethical Metrics`,
      text: `Are you sure you want to disable Ethical Metrics? That way yo won't receive any notifications when your dappnode goes down!`,
      label: "Disable",
      onClick: disableEthicalMetrics
    });
  }

  async function disableEthicalMetrics() {
    try {
      setReqStatusDisable({ loading: true });
      await withToast(() => api.disableEthicalMetrics(), {
        message: `Disabling ethical metrics...`,
        onSuccess: `Disabled ethical metrics`
      });
      setReqStatusDisable({ result: true });
      await ethicalMetricsConfig.revalidate();
      setEthicalMetricsOn(false);
    } catch (e) {
      setReqStatusDisable({ error: e });
      console.error("Error on registerEthicalMetrics", e);
    }
  }

  return (
    <Card spacing>
      <div>
        <p>
          Receive notifications if your <strong>dappnode remains offline</strong>{" "}
          for at least 3 hours, sent to either your Telegram or email. Telemetry
          is collected anonymously to ensure no personal data is retained.
        </p>
      </div>
      <div>
        <p>
          <span style={{ fontWeight: "bold" }}>Advice: </span>
          We highly recommend using the Telegram channel option (or both) rather
          than relying only on email notifications. Email notifications may be
          categorized as spam, potentially causing you to miss important
          notifications!
        </p>
        <LinkDocs href={docsUrl.ethicalMetricsOverview}>
          Learn more about Ethical metrics in our Documentation
        </LinkDocs>
      </div>

      {ethicalMetricsConfig.data ? (
        <Form.Group>
          <Form.Label>Ethical metrics status</Form.Label>
          <br />
          {/** TODO: show instance and register status */}
          <div style={{ display: "inline-block" }}>
            <SwitchBig
              disabled={
                (tgChannelId === "" && mail === "") ||
                mailError ||
                tgChannelIdError
              }
              checked={ethicalMetricsOn}
              onChange={
                ethicalMetricsOn
                  ? disableConfirmation
                  : () =>
                    enableEthicalMetricsSync({
                      mailValue: mail && !mailError ? mail : null,
                      tgChannelIdValue:
                        tgChannelId && !tgChannelIdError ? tgChannelId : null
                    })
              }
              label={""}
              id="enable-ethical-metrics"
              factor={1}
            />
          </div>
          {!ethicalMetricsOn && (
            <>
              <br />
              <span
                style={{
                  fontStyle: "italic",
                  fontSize: "14px",
                  color: "var(--dappnode-strong-main-color)"
                }}
              >
                You must provide a Telegram channel ID or an email to enable
                ethical metrics notifications
              </span>
            </>
          )}
          <br />
          <br />

          <Form.Label>
            Ethical metrics notifications by telegram channel
          </Form.Label>
          <Input
            placeholder="Telegram Channel ID"
            isInvalid={tgChannelIdError}
            value={tgChannelId}
            onValueChange={setTgChannelId}
            append={
              ethicalMetricsOn ? (
                <Button
                  type="submit"
                  className="register-button"
                  onClick={() =>
                    enableEthicalMetricsSync({ tgChannelIdValue: tgChannelId })
                  }
                  variant="dappnode"
                  disabled={
                    tgChannelId === "" ||
                    tgChannelId === ethicalMetricsConfig.data.tgChannelId ||
                    tgChannelIdError
                  }
                >
                  Update
                </Button>
              ) : (
                <></>
              )
            }
          />
          <Accordion defaultActiveKey={tgAccordionOpen ? "0" : ""}>
            <div className="accordion-notifications-wrapper">
              <Accordion.Toggle
                eventKey="0"
                onClick={() => setTgAccordionOpen(!tgAccordionOpen)}
                className="accordion-notifications"
              >
                <div className="header">
                  <BsInfoCircleFill
                    className="links-icon"
                    style={{ fontSize: "14px" }}
                  />
                  How can I get a Telegram channel ID?{" "}
                  {tgAccordionOpen ? <IoIosArrowUp /> : <IoIosArrowDown />}{" "}
                </div>
              </Accordion.Toggle>
              <Accordion.Collapse eventKey="0">
                <div>
                  <ol>
                    <li>
                      Open{" "}
                      <a
                        href="https://web.telegram.org/a/"
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        Telegram web
                      </a>
                      .
                      <ul>
                        <li>
                          Ensure the URL ends with{" "}
                          <span className={theme === "dark" ? "dark" : "light"}>
                            /a/
                          </span>
                          . If not, manually add{" "}
                          <span className={theme === "dark" ? "dark" : "light"}>
                            /a/
                          </span>{" "}
                          after{" "}
                          <span className={theme === "dark" ? "dark" : "light"}>
                            https://web.telegram.org
                          </span>
                          .{" "}
                        </li>
                      </ul>
                    </li>
                    <li>Create a private channel.</li>
                    <li>
                      Add{" "}
                      <span className={theme === "dark" ? "dark" : "light"}>
                        @ethicalMetricsAlerts_bot
                      </span>{" "}
                      as an administrator in the channel.
                    </li>
                    <li>
                      Go to your channel and copy the 13-digit ID from the URL.
                      <ul>
                        <li>
                          The channel ID always starts with{" "}
                          <span className={theme === "dark" ? "dark" : "light"}>
                            -100
                          </span>
                          . Ensure to include the{" "}
                          <span className={theme === "dark" ? "dark" : "light"}>
                            -
                          </span>{" "}
                          when coping it.
                        </li>
                      </ul>
                    </li>

                    <li>
                      Paste the ID into the Telegram Channel ID field and enable
                      Ethical Metrics to receive notifications.
                    </li>
                  </ol>
                </div>
              </Accordion.Collapse>
            </div>
          </Accordion>
          {tgChannelIdError && (
            <span style={{ fontSize: "12px", color: "red" }}>
              Telegram channel ID format is incorrect
            </span>
          )}
          <br />
          <Form.Label>Ethical metrics notifications by email</Form.Label>
          <Input
            placeholder="Email"
            isInvalid={mailError}
            value={mail}
            onValueChange={setMail}
            append={
              ethicalMetricsOn ? (
                <Button
                  type="submit"
                  className="register-button"
                  onClick={() => enableEthicalMetricsSync({ mailValue: mail })}
                  variant="dappnode"
                  disabled={
                    mail === "" ||
                    mail === ethicalMetricsConfig.data.mail ||
                    mailError
                  }
                >
                  Update
                </Button>
              ) : (
                <></>
              )
            }
          />
          {mailError && (
            <span style={{ fontSize: "12px", color: "red" }}>
              Email format is incorrect
            </span>
          )}
        </Form.Group>
      ) : ethicalMetricsConfig.error ? (
        <Ok msg={"Error getting status"} style={{ margin: "auto" }} />
      ) : (
        <Ok
          msg={"Loading status..."}
          loading={true}
          style={{ margin: "auto" }}
        />
      )}

      {reqStatusDisable.error && (
        <ErrorView error={reqStatusDisable.error} hideIcon red />
      )}
      {reqStatusEnable.error && (
        <ErrorView error={reqStatusEnable.error} hideIcon red />
      )}
    </Card>
  );
}

