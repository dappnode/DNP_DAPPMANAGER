import React, { useState } from "react";
import { Accordion, Card } from "react-bootstrap";
import { IoIosArrowDropdown, IoIosArrowDropup } from "react-icons/io";
import { BsDiscord } from "react-icons/bs";
import { MdForum, MdHowToVote } from "react-icons/md";
import "./opCommunity.css";

export default function OpCommunity() {
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
            {isOpen ? <IoIosArrowDropup /> : <IoIosArrowDropdown />}{" "}
            <b>Optimism Community</b>
          </Accordion.Toggle>
          <Accordion.Collapse eventKey="0">
            <Card.Body>
              <div style={{ marginBottom: "1rem" }}>
                Dive into the next-gen blockchain scalability solution. Optimism
                revolutionizes transaction speeds, ensuring a seamless and
                efficient decentralized experience. Be part of the movement
                that's shaping the future of blockchain.
              </div>

              <div>
                <a href="https://discord.gg/optimism" className="iconLink">
                  <BsDiscord style={iconStyle} />
                </a>
                <b>Discord</b>: Connect with fellow enthusiasts, share insights,
                seek assistance, or simply engage in lively blockchain
                discussions.
              </div>
              <div>
                <a href="https://gov.optimism.io/" className="iconLink">
                  <MdForum style={iconStyle} />
                </a>
                <b>Governance Forum</b>: Delve into deep-dive discussions, share
                your perspectives, or keep abreast with the latest updates.
              </div>
              <div>
                <a
                  href="https://snapshot.org/#/opcollective.eth"
                  className="iconLink"
                >
                  <MdHowToVote style={iconStyle} />
                </a>
                <b>Snapshot Governance Voting</b>: Have a say in the future of
                Optimism. Voice your opinion and cast your vote on key
                proposals.
              </div>
            </Card.Body>
          </Accordion.Collapse>
        </Card>
      </Accordion>
    </div>
  );
}
