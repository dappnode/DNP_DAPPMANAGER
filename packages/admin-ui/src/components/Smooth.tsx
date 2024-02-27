import React from "react";
import { useSelector } from "react-redux";
import { getShouldShowSmooth } from "services/dappnodeStatus/selectors";
import { api } from "api";

export default function Smooth() {
    const shouldShowSmooth = useSelector(getShouldShowSmooth);
    console.log("should show smooth:", shouldShowSmooth);
    if (!shouldShowSmooth) return null;
    // TODO return modal

    // TODO: implement setShouldShownSmooth when user closes the modal. Use api method api.setShouldShownSmooth
    // How to determine that the modal has been shown api.setShouldShownSmooth({ isShown: true })
    // - When user closes the modal
    // - When user clicks on see smooth
    return <div>Show smooth modal</div>;
}