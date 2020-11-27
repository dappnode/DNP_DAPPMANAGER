import React from "react";
import { AiOutlineUser } from "react-icons/ai";
import { Link } from "react-router-dom";

export default function Profile() {
  return (
    <div className="tn-dropdown profile">
      <Link to="/">
        <div className="tn-dropdown-toggle">
          <AiOutlineUser />
        </div>
      </Link>
    </div>
  );
}
