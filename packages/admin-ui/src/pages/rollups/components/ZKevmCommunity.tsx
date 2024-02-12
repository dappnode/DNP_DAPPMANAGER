import React, { useState } from "react";
import { Accordion, Card } from "react-bootstrap";
import { IoIosArrowDown, IoIosArrowUp } from "react-icons/io";
import { BsDiscord } from "react-icons/bs";
import { MdForum, MdHowToVote } from "react-icons/md";
import "./opCommunity.css";

export default function ZkevmCommunity() {
  const [isOpen, setIsOpen] = useState(false);

  const iconStyle = {
    fontSize: "2rem",
    marginRight: "1rem"
  };

  return (
    <div>
      <Accordion defaultActiveKey={isOpen ? "0" : ""}>
        <Card>
          <Accordion.Toggle
            as={Card.Header}
            eventKey="0"
            onClick={() => setIsOpen(!isOpen)}
            style={{ cursor: "pointer" }}
          >
            {isOpen ? <IoIosArrowUp /> : <IoIosArrowDown />}{" "}
            <b>zkEVM Community</b>
          </Accordion.Toggle>
          <Accordion.Collapse eventKey="0">
            <Card.Body>
              <div style={{ marginBottom: "1rem" }}>
                Dive into the next-gen blockchain scalability solution. zkEVM
                revolutionizes transaction speeds, ensuring a seamless and
                efficient decentralized experience. Be part of the movement
                that's shaping the future of blockchain.
              </div>

              <div>
                <a
                  href="https://discord.com/invite/0xPolygon"
                  className="iconLink"
                  target="_blank"
                  rel="noreferrer"
                >
                  <BsDiscord style={iconStyle} />
                </a>
                <b>Discord</b>: Connect with fellow enthusiasts, share insights,
                seek assistance, or simply engage in lively blockchain
                discussions.
              </div>
              <div>
                <a
                  href="https://forum.polygon.technology/"
                  className="iconLink"
                  target="_blank"
                  rel="noreferrer"
                >
                  <MdForum style={iconStyle} />
                </a>
                <b>Forum</b>: The place for thoughtful discussion on Zero
                Knowledge, Polygon products and Improvement Proposals
              </div>
              <div>
                <a
                  href="https://polygon.technology/governance"
                  className="iconLink"
                  target="_blank"
                  rel="noreferrer"
                >
                  <MdForum style={iconStyle} />
                </a>
                <b>Governance</b>: Participate in shaping the zkEVM and Polygon
                protocols
              </div>
            </Card.Body>
          </Accordion.Collapse>
        </Card>
      </Accordion>
    </div>
  );
}