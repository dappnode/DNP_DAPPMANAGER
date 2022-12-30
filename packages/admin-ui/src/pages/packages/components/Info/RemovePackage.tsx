import React from "react";
import { useHistory } from "react-router-dom";
import { api } from "api";
// Components
import Button from "components/Button";
import { confirm } from "components/ConfirmDialog";
import { withToast } from "components/toast/Toast";
import { BsTrash } from "react-icons/bs";
// Utils
import { prettyDnpName } from "utils/format";
import { InstalledPackageDetailData } from "@dappnode/common";
import { rootPath as packagesRootPath } from "../../data";
import { markdownList } from "utils/markdown";
import "./removePackage.scss";

interface WarningItem {
  title: string;
  body: string;
}

export function RemovePackage({ dnp }: { dnp: InstalledPackageDetailData }) {
  const {
    dnpName,
    areThereVolumesToRemove,
    dependantsOf,
    notRemovable,
    manifest
  } = dnp;

  const history = useHistory();

  async function packageRemove() {
    // Dialog to confirm warning onRemove from manifest
    const removeWarnings = manifest?.warnings?.onRemove;
    if (removeWarnings) {
      await new Promise(
        (resolve: (confirmOnRemoveWarning: boolean) => void) => {
          confirm({
            title: `Removal warning`,
            text: removeWarnings,
            buttons: [
              {
                label: "Continue",
                onClick: () => resolve(true)
              }
            ]
          });
        }
      );
    }

    // Dialog to confirm remove + USER INPUT for delete volumes
    const deleteVolumes = await new Promise(
      (resolve: (_deleteVolumes: boolean) => void) => {
        const title = `Removing ${prettyDnpName(dnpName)}`;
        let text = `This action cannot be undone.`;
        const buttons = [{ label: "Remove", onClick: () => resolve(false) }];
        if (areThereVolumesToRemove) {
          // Only show the remove data related text if necessary
          text += ` If you do NOT want to keep ${dnpName}'s data, remove it permanently clicking the "Remove and delete data" option.`;
          // Only display the "Remove and delete data" button if necessary
          buttons.push({
            label: "Remove and delete data",
            onClick: () => resolve(true)
          });
        }
        confirm({ title, text, buttons });
      }
    );

    const dnpsToRemoveWarningsList: WarningItem[] = [];
    // Don't show the same DNP in both dnpsToRemove and dependantsOf
    // dependantsOf = ["raiden.dnp.dappnode.eth", "another.dnp.dappnode.eth"]
    if (dependantsOf.length > 0) {
      const dependantsOfList = markdownList(dependantsOf);
      dnpsToRemoveWarningsList.push({
        title: "Warning! There are package dependants",
        body: `Some DAppNode Packages depend on ${dnpName} and may stop working if you continue. \n\n ${dependantsOfList}`
      });
    }

    if (dnpsToRemoveWarningsList.length > 0)
      await new Promise<void>(resolve =>
        confirm({
          title: `Removing ${prettyDnpName(dnpName)}`,
          text: `This action cannot be undone.`,
          list: dnpsToRemoveWarningsList,
          label: "Continue",
          onClick: resolve
        })
      );

    // Use a try/catch to capture a successful remove and go to packages
    try {
      const name = prettyDnpName(dnpName);
      await withToast(() => api.packageRemove({ dnpName, deleteVolumes }), {
        message: `Removing ${name} ${deleteVolumes ? " and volumes" : ""}...`,
        onSuccess: `Removed ${name}`
      });
      history.push(packagesRootPath);
    } catch (e) {
      console.error(e);
    }
  }

  if (dnp.notRemovable) {
    return null;
  }

  // Table style -> Removes the space below the table, only for tables in cards
  return (
    <div className="remove-package">
      <div className="text">
        <strong>Remove</strong>
        <div>Delete {prettyDnpName(dnpName)} package permanently.</div>
      </div>
      <Button
        variant="outline-danger"
        onClick={packageRemove}
        style={{ whiteSpace: "normal" }}
        disabled={notRemovable}
      >
        <BsTrash />
      </Button>
    </div>
  );
}
