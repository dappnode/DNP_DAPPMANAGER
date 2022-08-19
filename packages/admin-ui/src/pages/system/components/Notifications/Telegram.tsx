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
import Input from "components/Input";
import { forumUrl } from "params";
import { BsTrash } from "react-icons/bs";

export function TelegramNotifications() {
  const telegramStatus = useApi.telegramStatusGet();
  const telegramToken = useApi.telegramTokenGet();
  const telegramWhitelistChannelId = useApi.telegramChannelIdWhitelistGet();

  const [reqStatusToken, setReqStatusToken] = useState<ReqStatus>({});
  const [reqTelegramStatus, setReqTelegramStatus] = useState<ReqStatus>({});
  const [
    reqStatusWhitelistChannelId,
    setReqStatusWhitelistChannelId
  ] = useState<ReqStatus>({});
  const [newChannelId, setNewChannelId] = useState("");
  const [channelIds, setChannelIds] = useState<string[]>([]);
  const [token, setToken] = useState("");

  // Update local `token` input with the token stored in the DAPPMANAGER DB `telegramToken`
  useEffect(() => {
    if (telegramToken.data) setToken(telegramToken.data);
  }, [telegramToken.data]);

  // Update local `channelId` input with the channelId stored in the DAPPMANAGER DB `telegramWhitelistChannelId`
  useEffect(() => {
    if (telegramWhitelistChannelId.data)
      setChannelIds(telegramWhitelistChannelId.data);
  }, [telegramWhitelistChannelId.data]);

  async function updateTelegramWhitelistChannelId() {
    setReqStatusWhitelistChannelId({ loading: true });
    try {
      await withToast(
        () => api.telegramChannelIdWhitelistSet({ channelId: newChannelId }),
        {
          message: `Setting channel ID...`,
          onSuccess: `Updated telegram channel ID whitelist`
        }
      );
      setReqStatusWhitelistChannelId({ result: true });
    } catch (err) {
      setReqStatusWhitelistChannelId({ error: err });
    }
  }

  async function updateTelegramToken() {
    try {
      setReqStatusToken({ loading: true });
      await withToast(() => api.telegramTokenSet({ telegramToken: token }), {
        message: `Setting telegram token...`,
        onSuccess: `Updated telegram token`
      });
      setReqStatusToken({ result: true });
      if (telegramStatus.data === false) {
        await updateTelegramStatus(true);
      }
      setToken("");
    } catch (e) {
      setReqStatusToken({ error: e });
      console.error("Error on telegramTokenSet", e);
    }
  }

  async function updateTelegramStatus(newStatus: boolean) {
    try {
      setReqTelegramStatus({ loading: true });
      await withToast(
        () => api.telegramStatusSet({ telegramStatus: newStatus }),
        {
          message: newStatus ? "Enabling telegram..." : "Disabling telegram...",
          onSuccess: newStatus ? "Telegram ON" : "Telegram OFF"
        }
      );
      telegramStatus.revalidate();
      setReqTelegramStatus({ result: true });
    } catch (e) {
      setReqTelegramStatus({ error: e });
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

      <Form.Group>
        <Form.Label>Telegram token</Form.Label>
        <InputSecret
          placeholder="Telegram token"
          value={token}
          onValueChange={setToken}
          onEnterPress={updateTelegramToken}
          append={
            <Button
              type="submit"
              className="register-button"
              onClick={updateTelegramToken}
              variant="dappnode"
            >
              Submit
            </Button>
          }
        />
      </Form.Group>

      <Form.Group>
        <Form.Label>Telegram channel ID</Form.Label>
        <Input
          placeholder="Telegram channel ID"
          value={newChannelId}
          onValueChange={setNewChannelId}
          onEnterPress={updateTelegramWhitelistChannelId}
          append={
            <Button
              type="submit"
              className="register-button"
              disabled={!newChannelId || !token}
              onClick={updateTelegramWhitelistChannelId}
              variant="dappnode"
            >
              Submit
            </Button>
          }
        />
        <br />
        {/** Create a list of removable channel ids */}

        {channelIds.length > 0 ? (
          <div>
            <div>
              <strong>Telegram channel ID whitelist</strong>
            </div>
            <div>
              <ul>
                {channelIds.map(channelId => (
                  <li key={channelId}>
                    <BsTrash
                      onClick={() =>
                        withToast(
                          () =>
                            api.telegramChannelIdWhitelistRemove({
                              channelId
                            }),
                          {
                            message: `Removing channel ID ${channelId}...`,
                            onSuccess: `Removed channel ID ${channelId} from the whitelist`
                          }
                        )
                      }
                    />
                    {" " + channelId}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        ) : (
          <div>No channels added</div>
        )}
      </Form.Group>

      {telegramStatus.data !== undefined ? (
        <Form.Group>
          <div>
            <Form.Label>Telegram status</Form.Label>
          </div>
          <Switch
            checked={telegramStatus.data}
            label={telegramStatus.data === true ? "On" : "Off"}
            onToggle={updateTelegramStatus}
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
      {reqStatusToken.error && (
        <ErrorView error={reqStatusToken.error} hideIcon red />
      )}
      {reqStatusWhitelistChannelId.error && (
        <ErrorView error={reqStatusWhitelistChannelId.error} hideIcon red />
      )}
      {reqTelegramStatus.error && (
        <ErrorView error={reqTelegramStatus.error} hideIcon red />
      )}

      <hr />

      <Button onClick={sendTestNotification}>Send test notification</Button>
    </Card>
  );
}
