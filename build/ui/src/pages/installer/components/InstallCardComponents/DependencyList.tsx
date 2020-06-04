import React from "react";
import { sortBy } from "lodash";
import Badge from "react-bootstrap/Badge";
import computeSemverUpdateType from "utils/computeSemverUpdateType";
import RenderMarkdown from "components/RenderMarkdown";
import styled from "styled-components";
import { shortNameCapitalized } from "utils/format";
import { DependencyListItem } from "types";

const InfoContainer = styled.div`
  display: grid;
  justify-content: space-between;
  grid-template-columns: repeat(auto-fit, minmax(12rem, max-content));
`;

const SpanCenter = styled.span`
  display: flex;
  align-items: center;
  > .badge {
    margin-left: 0.5rem;
  }
`;

// const Badge = ({ text }) => (
//   <span
//     className={`badge badge-warning`}
//     style={{
//       textTransform: "capitalize",
//       marginLeft: "6px"
//     }}
//   >
//     {text}
//   </span>
// );

interface DependencyListProps {
  deps: DependencyListItem[];
}

const DependencyList: React.FunctionComponent<DependencyListProps> = ({
  deps
}) => {
  if (!Array.isArray(deps)) {
    console.error("deps must be an array");
    return null;
  }

  return (
    <>
      {sortBy(deps, "name").map(({ name, from, to, warningOnInstall }) => {
        const updateType = computeSemverUpdateType(from || "", to, false);
        return (
          <div key={name} className="dependency-list">
            <InfoContainer>
              <span>{shortNameCapitalized(name)}</span>
              <SpanCenter>
                {from ? `Update from ${from} to ${to}` : `Installs ${to}`}
                {updateType === "downgrade" || updateType === "major" ? (
                  <Badge variant="danger">{updateType}</Badge>
                ) : null}
              </SpanCenter>
            </InfoContainer>
            {warningOnInstall && (
              <div
                className="alert alert-warning"
                style={{ margin: "12px 0 6px 0" }}
              >
                <RenderMarkdown source={warningOnInstall} />
              </div>
            )}
          </div>
        );
      })}
    </>
  );
};

export default DependencyList;
