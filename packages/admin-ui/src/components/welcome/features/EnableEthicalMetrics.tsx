import React, { useEffect, useState } from "react";
import BottomButtons from "../BottomButtons";
import SwitchBig from "components/SwitchBig";
import { api, useApi } from "api";
import Input from "components/Input";
import { docsUrl } from "params";
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
    const ethicalMetricsData = ethicalMetricsConfig.data;
    if (ethicalMetricsData) {
      setMail(ethicalMetricsData.mail || "");
      setTgChannelId(ethicalMetricsData.tgChannelId || "");
      setEthicalMetricsOn(ethicalMetricsData.enabled);
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

  async function enableEthicalMetricsSync() {
    try {
      setValidationMessage("Enabling ethical metrics...");
      await api.enableEthicalMetrics({
        mail: mail ? mail : null,
        tgChannelId: tgChannelId ? tgChannelId : null,
        sync: true
      });
      setEthicalMetricsOn(true);
      setValidationMessage("Ethical metrics enabled successfully.");
      await ethicalMetricsConfig.revalidate();
    } catch (error) {
      setValidationMessage("Error enabling ethical metrics.");
      console.error("Error enabling ethical metrics:", error);
    }
  }

  // clear the success message after 5 seconds
  useEffect(() => {
    if (validationMessage === "Ethical metrics enabled successfully.") {
      const timer = setTimeout(() => {
        setValidationMessage("");
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [validationMessage]);

  function toggleEthicalSwitch() {
    if (!ethicalMetricsOn) {
      enableEthicalMetricsSync();
    }
    setEthicalMetricsOn(!ethicalMetricsOn);
  }

  return (
    <div className="ethical-container">
      <div className="header">
        <div className="title">Enable System Notifications</div>
        <div className="description">
          <p className="description-text">
            <span className="highlight">Enable ethical metrics</span> and
            receive alerts whenever your dappnode is down without compromising
            your privacy.
            <span className="note">
              {" "}
              Note: Ethical Metrics requires the Dappnode Monitoring Service
              (DMS) as a dependency.
            </span>{" "}
            <a href={docsUrl.ethicalMetricsOverview} className="learn-more">
              Learn more
            </a>
          </p>
        </div>
      </div>

      <p className="instructions">
        <strong>Telegram notifications are available!</strong> Enter your{" "}
        <strong>Telegram Channel ID</strong> to receive reliable alerts
        promptly.
      </p>
      <em className="advice">
        <strong>Advice: </strong> We highly recommend using the Telegram channel
        option (or both) rather than relying only on email notifications. Email
        notifications may be categorized as spam, potentially causing you to
        miss important notifications!
      </em>
      {!ethicalMetricsOn && (
        <span
          style={{
            fontStyle: "italic",
            fontSize: "14px",
            color: "var(--dappnode-strong-main-color)"
          }}
        >
          You must provide a Telegram channel ID or an email to enable ethical
          metrics notifications
        </span>
      )}
      <span>Ethical metrics notifications by telegram channel</span>
      <Input
        prepend="Telegram"
        value={tgChannelId}
        onValueChange={setTgChannelId}
        isInvalid={tgChannelIdError}
        required={true}
        placeholder="-100XXXXXXXXXX"
      />
      <Accordion defaultActiveKey={tgAccordionOpen ? "0" : ""}>
        <div className="accordion-modal-wrapper">
          <Accordion.Toggle
            eventKey="0"
            onClick={() => setTgAccordionOpen(!tgAccordionOpen)}
            className="accordion-modal"
          >
            <div className="header">
              <BsInfoCircleFill
                className="links-icon"
                style={{ fontSize: "14px" }}
              />
              How can I get a Telegram channel Id?{" "}
              {tgAccordionOpen ? <IoIosArrowUp /> : <IoIosArrowDown />}{" "}
            </div>
          </Accordion.Toggle>
          <Accordion.Collapse eventKey="0">
            <div>
              <ol>
                <li>Create a private channel in your telegram.</li>
                <li>
                  Add dappnode bot <span>@ethicalMetricsAlerts_bot</span> to the
                  channel as an administrator.
                </li>
                <li>
                  Open telegram in a web browser{" "}
                  <a href="https://web.telegram.org/" target="_blank">
                    (Telegram web)
                  </a>{" "}
                  and open the channel.
                </li>
                <li>
                  Copy the channel id from the url. The channel Id is the number
                  of 13 digits that comes just after the <span>-</span> in the
                  url. It always starts with <span>-100</span>. While coping it,
                  make sure to include the <span>-</span> just before the
                  number!
                </li>
                <li>
                  Paste it in the Telegram Channel Id field and toggle the
                  switch <span>ON</span> to start receiving notifications.
                </li>
              </ol>
            </div>
          </Accordion.Collapse>
        </div>
      </Accordion>
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
              onClick={async () => {
                setValidationMessage("");
                await enableEthicalMetricsSync();
              }}
              variant="dappnode"
              disabled={
                // No input provided or both inputs have errors
                (tgChannelId === "" && mail === "") ||
                (tgChannelIdError && mailError) ||
                // Only tgChannelId has error or only mail has error
                (tgChannelIdError && mail === "") ||
                (tgChannelId === "" && mailError) ||
                // No changes in mail or tgChannelId
                (mail === ethicalMetricsConfig.data?.mail &&
                  (tgChannelId === "" ||
                    tgChannelId === ethicalMetricsConfig.data?.tgChannelId ||
                    tgChannelIdError)) ||
                // Asynchronous operation in progress
                validationMessage !== ""
              }
            >
              Update
            </Button>
          </div>
        ) : (
          <SwitchBig
            disabled={
              (tgChannelId === "" && mail === "") ||
              (tgChannelIdError && mailError) ||
              (tgChannelIdError && mail === "") ||
              (tgChannelId === "" && mailError)
            }
            checked={ethicalMetricsOn}
            onChange={toggleEthicalSwitch}
            label=""
            id="enable-ethical-metrics"
          />
        )}
      </div>

      <BottomButtons onBack={onBack} onNext={() => onNext()} />

      {validationMessage && (
        <p className="validation-message">{validationMessage}</p>
      )}
    </div>
  );
}
