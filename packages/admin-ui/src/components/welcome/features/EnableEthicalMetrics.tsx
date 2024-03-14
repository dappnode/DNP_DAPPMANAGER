import React, { useEffect, useState } from "react";
import BottomButtons from "../BottomButtons";
import SwitchBig from "components/SwitchBig";
import { api, useApi } from "api";
import Input from "components/Input";
import { docsUrl } from "params";
import Form from "react-bootstrap/esm/Form";
import Button from "components/Button";
import { Accordion } from "react-bootstrap";
import { BsInfoCircleFill } from "react-icons/bs";
import { IoIosArrowUp, IoIosArrowDown } from "react-icons/io";
import "./enableEthicalMetrics.scss";

export default function EnableEthicalMetrics({
  onBack,
  onNext
}: {
  onBack?: () => void;
  onNext: () => void;
}) {
  const ethicalMetricsConfig = useApi.getEthicalMetricsConfig();
  const [ethicalMetricsOn, setEthicalMetricsOn] = useState(false);
  const [mail, setMail] = useState("");
  const [mailError, setMailError] = useState(false);
  const [tgChannelId, setTgChannelId] = useState("");
  const [tgChannelIdError, setTgChannelIdError] = useState(false);
  const [validationMessage, setValidationMessage] = useState("");
  const [tgAccordionOpen, setTgAccordionOpen] = useState(false);

  // useEffect to populate email field when data is available
  useEffect(() => {
    if (ethicalMetricsConfig.data?.mail) {
      setMail(ethicalMetricsConfig.data.mail);
      setEthicalMetricsOn(ethicalMetricsConfig.data?.enabled)
    }
  }, [ethicalMetricsConfig.data]);

  // effect and regex for email validation
  useEffect(() => {
    const regex = /\S+@\S+\.\S+/;
    if (regex.test(mail) || mail === "") {
      setMailError(false);
    } else {
      setMailError(true);
    }
  }, [mail]);

  // effect and regex for telegram channelId validation
  useEffect(() => {
    const regex = /^-100\d{10}$/;
    if (regex.test(tgChannelId) || tgChannelId === "") {
      setTgChannelIdError(false);
    } else {
      setTgChannelIdError(true);
    }
  }, [tgChannelId]);

  async function enableEthicalMetricsSync({
    mailValue,
    tgChannelIdValue
  }: {
    mailValue?: string | null;
    tgChannelIdValue?: string | null;
  }) {
    try {
      setValidationMessage("Enabling ethical metrics...");
      await api.enableEthicalMetrics({
        mail: mailValue || mail,
        tgChannelId: tgChannelIdValue || tgChannelId,
        sync: true
      });
      setEthicalMetricsOn(true);
      setValidationMessage("Ethical metrics enabled successfully.");
      onNext();
    } catch (error) {
      setValidationMessage("Error enabling ethical metrics.");
      console.error("Error enabling ethical metrics:", error);
    }
  }

  function onSetEnableEthicalMetrics() {
    if (ethicalMetricsOn) {
      const tgChannelIdValue = tgChannelId && !tgChannelIdError ? tgChannelId : null;
      const mailValue = mail && !mailError ? mail : null;
      enableEthicalMetricsSync({ mailValue, tgChannelIdValue });
    }
    onNext();
  }

  console.log("Ethical Metrics On:", ethicalMetricsOn);

  return (
    <div className="ethical-container">
      <div className="header">
        <div className="title">Enable System Notifications</div>
        <div className="description">
          Enable ethical metrics and receive alerts whenever your dappnode is
          down without losing your privacy.{" "}
          <a href={docsUrl.ethicalMetricsOverview}>Learn more</a>
        </div>
      </div>

      <p className="instructions">
        <strong>Telegram notifications are available!</strong> Enter your{" "}
        <strong>Telegram Channel ID</strong> to receive reliable alerts promptly.
      </p>
      <em>Advice: We highly recommend using the Telegram channel option (or both) rather than relying only on email notifications. Email notifications may be categorized as spam, potentially causing you to miss important notifications!</em>

      <Accordion defaultActiveKey={tgAccordionOpen ? "0" : ""}>
        <div>
          <Accordion.Toggle
            eventKey="0"
            onClick={() => setTgAccordionOpen(!tgAccordionOpen)}
            className="accordion"
          >
            <div className="header">
              <BsInfoCircleFill className="links-icon" />
              How can I get a Telegram channel Id?{" "}
              {tgAccordionOpen ? <IoIosArrowUp /> : <IoIosArrowDown />}{" "}
            </div>
          </Accordion.Toggle>
          <Accordion.Collapse eventKey="0">
            <div>
              <ol>
                <li>Create a private channel in your telegram.</li>
                <li>
                  Add dappnode bot{" "}
                  <span>
                    @ethicalMetricsAlerts_bot
                  </span>{" "}
                  to the channel as an administrator.
                </li>
                <li>
                  Open telegram in a web browser{" "}
                  <a href="https://web.telegram.org/">(Telegram web)</a> and
                  open the channel.
                </li>
                <li>
                  Copy the channel id from the url. The channel Id is the
                  number of 13 digits that comes just after the{" "}
                  <span>
                    -
                  </span>{" "}
                  in the url. It always starts with{" "}
                  <span>
                    -100
                  </span>
                  . While coping it, make sure to include the{" "}
                  <span>
                    -
                  </span>{" "}
                  just before the number!
                </li>
                <li>
                  Paste it in the Telegram Channel Id field and toggle the
                  switch{" "}
                  <span>
                    ON
                  </span>{" "}
                  to start receiving notifications.
                </li>
              </ol>
            </div>
          </Accordion.Collapse>
        </div>
      </Accordion>

      <span>Ethical metrics notifications by telegram channel</span>
      <Input
        prepend="Telegram"
        value={tgChannelId}
        onValueChange={setTgChannelId}
        isInvalid={tgChannelIdError}
        required={true}
        placeholder="Your Telegram Channel ID"
      />
      {tgChannelIdError && (
        <span style={{ fontSize: "12px", color: "red" }}>
          Telegram channel Id format is incorrect
        </span>
      )}

      <span>Ethical metrics notifications by email</span>
      <Input
        prepend="Email"
        value={mail}
        onValueChange={setMail}
        isInvalid={mailError}
        required={true}
        placeholder="example@email.com"
      />
      {mailError && (
        <span style={{ fontSize: "12px", color: "red" }}>
          Email format is incorrect
        </span>
      )}

      {/* This top div prevents the card from stretching vertically */}
      <div>
        {ethicalMetricsOn ? (
          // Render the "Update" button if ethical metrics are enabled
          <div className="update-button">
            <Button
              type="submit"
              onClick={() =>
                enableEthicalMetricsSync({
                  tgChannelIdValue: tgChannelId,
                  mailValue: mail
                })
              }
              variant="dappnode"
              disabled={
                tgChannelId === "" && mail === "" ||
                tgChannelIdError && mailError ||
                tgChannelIdError && mail === "" ||
                tgChannelId === "" && mailError ||
                mail === ethicalMetricsConfig.data?.mail && tgChannelId === ""
              }
            >
              Update
            </Button>
          </div>
        ) : (
          <SwitchBig
            disabled={mailError}
            checked={ethicalMetricsOn}
            onChange={() => setEthicalMetricsOn(true)}
            label="Enable system notifications"
            id="enable-ethical-metrics"
          />
        )}
      </div>

      <BottomButtons onBack={onBack} onNext={onSetEnableEthicalMetrics} />

      {validationMessage && (
        <p className="validation-message">{validationMessage}</p>
      )}
    </div>
  );
}
