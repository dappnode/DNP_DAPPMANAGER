import React, { useEffect, useState } from "react";
import { api, useApi } from "api";
import { ReqStatus } from "types";
import Form from "react-bootstrap/esm/Form";
import Button from "components/Button";
import Card from "components/Card";
import Switch from "components/Switch";
import ErrorView from "components/ErrorView";
import Ok from "components/Ok";
import { withToast } from "components/toast/Toast";
import { InputSecret } from "components/InputSecret";
import { forumUrl } from "params";
import Input from "components/Input";
import { Accordion } from "react-bootstrap";
import { BsInfoCircleFill } from "react-icons/bs";
import { IoIosArrowUp, IoIosArrowDown } from "react-icons/io";

export function TelegramNotifications() {
  const telegramStatus = useApi.telegramStatusGet();
  const telegramConfig = useApi.telegramConfigGet();

  const [reqStatusConfig, setReqStatusConfig] = useState<ReqStatus>({});
  const [reqStatusStatus, setReqStatusStatus] = useState<ReqStatus>({});
  const [token, setToken] = useState("");
  const [tokenError, setTokenError] = useState(false);
  const [userId, setUserId] = useState("");
  const [userIdError, setUserIdError] = useState(false);
  const [tgAccordionOpen, setTgAccordionOpen] = useState(false);

  // Update local `token` and user ID input with the token stored in the DAPPMANAGER DB `telegramToken`
  useEffect(() => {
    if (telegramConfig.data?.token) setToken(telegramConfig.data.token);
    if (telegramConfig.data?.userId) setUserId(telegramConfig.data.userId);
  }, [telegramConfig.data]);

  useEffect(() => {
    const tokenRegex = /^[0-9]{8,10}:[a-zA-Z0-9_-]{35}$/;
    // Telegram token validation
    if (tokenRegex.test(token) || token === "") setTokenError(false);
    else setTokenError(true);
  }, [token]);

  useEffect(() => {
    const userIdRegex = /^\d{1,10}$/;
    // Telegram user ID validation
    if (userIdRegex.test(userId) || userId === "") setUserIdError(false);
    else setUserIdError(true);
  }, [userId]);

  async function updateTelegramConfig() {
    try {
      setReqStatusConfig({ loading: true });
      await withToast(() => api.telegramConfigSet({ token, userId }), {
        message: `Setting telegram configuration...`,
        onSuccess: `Updated telegram configuration`
      });
      await telegramConfig.revalidate();
      setReqStatusConfig({ result: true });
      if (telegramStatus.data === false) await updateTelegramStatus(true);
    } catch (e) {
      setReqStatusConfig({ error: e });
      console.error("Error on telegramConfigSet", e);
    }
  }

  async function updateTelegramStatus(newStatus: boolean) {
    try {
      setReqStatusStatus({ loading: true });
      await withToast(
        () => api.telegramStatusSet({ telegramStatus: newStatus }),
        {
          message: newStatus ? "Enabling telegram..." : "Disabling telegram...",
          onSuccess: newStatus ? "Telegram ON" : "Telegram OFF"
        }
      );
      await telegramStatus.revalidate();
      setReqStatusStatus({ result: true });
    } catch (e) {
      setReqStatusStatus({ error: e });
      console.error("Error on telegramStatusSet", e);
    }
  }

  async function sendTestNotification() {
    try {
      await api.notificationsTest({
        notification: {
          id: "test-notification",
          type: "info",
          title: "Test notification",
          body: "This is a test notification manually triggered by the user"
        }
      });
    } catch (e) {
      console.error("Error on sendTestNotification", e);
    }
  }

  return (
    <Card spacing>
      <div>
        Receive important notifications directly to your telegram account. To
        get your own token from Telegram botfather follow{" "}
        <a href={forumUrl.telegramHowTo}>this guide</a>
      </div>
      <div>
        Available commands in to start your bot chat
        <ul>
          <li>
            <strong>/start</strong>: Send after starting a conversation
            (channel) with your bot. You subscribe to future notifications
          </li>
          <li>
            <strong>/help</strong>: Display all available commands
          </li>
        </ul>
      </div>

      {telegramStatus.data !== undefined ? (
        <Form.Group>
          <div>
            <Form.Label>Telegram status</Form.Label>
          </div>
          <Switch
            checked={telegramStatus.data}
            label={telegramStatus.data === true ? "On" : "Off"}
            onToggle={updateTelegramStatus}
            disabled={
              telegramStatus.isValidating ||
              reqStatusConfig.loading ||
              (telegramStatus.data === false && (userIdError || tokenError)) ||
              ((!userId || !token) && telegramStatus.data === false)
            }
          ></Switch>
        </Form.Group>
      ) : telegramStatus.error ? (
        <Ok msg={"Error getting status"} style={{ margin: "auto" }} />
      ) : (
        <Ok
          msg={"Loading status..."}
          loading={true}
          style={{ margin: "auto" }}
        />
      )}

      <Form.Group>
        <Form.Label>Telegram token</Form.Label>
        <InputSecret
          placeholder="Telegram token"
          value={token}
          onValueChange={setToken}
          onEnterPress={updateTelegramConfig}
          append={
            <Button
              type="submit"
              className="register-button"
              onClick={updateTelegramConfig}
              variant="dappnode"
              disabled={
                !token || token === telegramConfig.data?.token || tokenError
              }
            >
              Submit
            </Button>
          }
        />
        {tokenError && (
          <span style={{ fontSize: "12px", color: "red" }}>
            Telegram token format is incorrect
          </span>
        )}
        <br />
        <Form.Label>Telegram user ID</Form.Label>
        <Input
          placeholder="Telegram user ID"
          value={userId}
          onValueChange={setUserId}
          onEnterPress={updateTelegramConfig}
          append={
            <Button
              type="submit"
              className="register-button"
              onClick={updateTelegramConfig}
              variant="dappnode"
              disabled={
                !userId || userId === telegramConfig.data?.userId || userIdError
              }
            >
              Submit
            </Button>
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
                How can I get my telegram user Id?{" "}
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
                  </li>
                  <li>
                    Search for the bot <span>@raw_data_bot</span>.
                  </li>
                  <li>
                    Write the command <span>/start</span> and copy the user ID
                    returned.
                  </li>
                  <li>
                    Paste the user ID into the user ID field and enable Telegram
                    to secure your dappnode telegram bot and ensure only you are
                    the only one allowed to write authenticated commands to it.
                  </li>
                </ol>
              </div>
            </Accordion.Collapse>
          </div>
        </Accordion>
        {userIdError && (
          <span style={{ fontSize: "12px", color: "red" }}>
            Telegram user ID format is incorrect
          </span>
        )}
      </Form.Group>

      {reqStatusConfig.error && (
        <ErrorView error={reqStatusConfig.error} hideIcon red />
      )}
      {reqStatusStatus.error && (
        <ErrorView error={reqStatusStatus.error} hideIcon red />
      )}

      <hr />

      <Button onClick={sendTestNotification}>Send test notification</Button>
    </Card>
  );
}
