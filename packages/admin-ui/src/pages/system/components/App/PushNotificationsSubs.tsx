import SubTitle from "components/SubTitle";
import Card from "components/Card";
import { OverlayTrigger, Tooltip } from "react-bootstrap";
import { MdBeenhere, MdClose, MdEdit } from "react-icons/md";
import React, { useState } from "react";
import { NotifierSubscription } from "@dappnode/types";
import "./pushNotificationsSubs.scss";
import Button from "components/Button";
import { api } from "api";

interface PushNotificationSubsProps {
  subscriptionsList: NotifierSubscription[] | null;
  browserSubEndpoint: string | undefined;
  deleteSubscription: (endpoint: string) => Promise<void>;
  revalidateSubs: () => Promise<boolean>;
}
export function PushNotificationsSubs({
  subscriptionsList,
  browserSubEndpoint,
  deleteSubscription,
  revalidateSubs
}: PushNotificationSubsProps) {
  return (
    <div>
      <SubTitle>Subscribed Devices</SubTitle>
      <Card>
        This section displays all devices currently subscribed to push notifications. You can rename each subscription
        or remove it from the list. <b>Learn more in docs...</b>
      </Card>

      {subscriptionsList && subscriptionsList.length > 0 ? (
        subscriptionsList.map((sub, index) => (
          <SubscriptionCard
            key={index}
            sub={sub}
            browserSubEndpoint={browserSubEndpoint}
            deleteSubscription={deleteSubscription}
            revalidateSubs={revalidateSubs}
          />
        ))
      ) : (
        <Card>No subscriptions found</Card>
      )}
    </div>
  );
}

function SubscriptionCard({
  sub,
  browserSubEndpoint,
  deleteSubscription,
  revalidateSubs
}: {
  sub: NotifierSubscription;
  browserSubEndpoint: string | undefined;
  deleteSubscription: (endpoint: string) => Promise<void>;
  revalidateSubs: () => Promise<boolean>;
}) {
  const [editAlias, setEditAlias] = useState(false);
  const [newAlias, setNewAlias] = useState(sub.alias);

  async function handleUpdateAlias(subEndpoint: string = sub.endpoint || "", alias: string = newAlias) {
    try {
      await api.notificationsUpdateSubAlias({ endpoint: subEndpoint, alias });
      revalidateSubs();
    } catch (error) {
      console.error("Error updating alias:", error);
    } finally {
      setEditAlias(false);
    }
  }
  return (
    <Card className="subscription-card">
      <div className="alias-info">
        {editAlias ? (
          <input
            type="text"
            value={newAlias}
            onChange={(e) => setNewAlias(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                handleUpdateAlias();
              }
            }}
          />
        ) : (
          <span onClick={() => setEditAlias(true)}>{sub.alias}</span>
        )}
        {browserSubEndpoint && browserSubEndpoint === sub.endpoint && (
          <OverlayTrigger overlay={<Tooltip id="current-device">Current Device</Tooltip>} placement="top">
            <MdBeenhere className="current-tag" />
          </OverlayTrigger>
        )}
      </div>
      <div className="btns-container">
        {editAlias ? (
          <>
            <Button onClick={() => setEditAlias(false)} variant="outline-danger">
              Cancel
            </Button>
            <Button
              onClick={() => handleUpdateAlias()}
              variant="dappnode"
              disabled={!newAlias || newAlias === sub.alias}
            >
              Update
            </Button>
          </>
        ) : (
          <>
            {" "}
            <OverlayTrigger overlay={<Tooltip id="rename-sub">Rename subscription</Tooltip>} placement="top">
              <div className="icon-btns" onClick={() => setEditAlias(true)}>
                <MdEdit />
              </div>
            </OverlayTrigger>
            {sub.endpoint && (
              <OverlayTrigger overlay={<Tooltip id="delete-sub">Delete subscription</Tooltip>} placement="top">
                <div className="icon-btns" onClick={() => deleteSubscription(sub.endpoint!)}>
                  <MdClose />
                </div>
              </OverlayTrigger>
            )}
          </>
        )}
      </div>
    </Card>
  );
}
