import { Network } from "common";

export const rootPath = "/stakers";
export const title = "Stakers";

export const disclaimer = `## Terms of Use - DAppNode

Effective as of Oct 14, 2020

By downloading, accessing or using this DAppNode Package ("DNP"), you (referenced herein as “you” or the “user”) certify that you have read and agreed to the terms and conditions below (the “Terms”) which form a binding contract between you and DAppNode Association (referenced herein as “we” or “us”). If you do not agree to the Terms, do not download or use DAppNode.

### About DAppNode

DAppNode is Free Open Source Software ("FOSS") aimed at facilitating the use of decentralized technologies. DAppNode is developed by the DAppNode Association, a voluntary association with the purpose of empowering users to participate in decentralized networks and to help such networks become more resilient by promoting the deployment of more nodes.
The modular structure of the DAppNode FOSS allows for the wrapping of 3rd party software with the intention of facilitating its deployment. In no way we are responsible for the misuse of such software and in no way we warrant its functionalities. We accept no responsibiity for its errors, or for the errors that the wrapping process might have introduced. Any usage of DAppNode and a DNP is strictly at your own risk.

### About this DNP

This software is experimental, presented 'as is' and inherently carries risks. By installing it, you acknowledge that DAppNode Association has done its best to mitigate these risks and accept to waive any liability or responsibility for DAppNode Association in case of any shortage, discrepancy, damage, loss or destruction of any digital asset managed within this DAppNode package.

This package stores private keys. Neither DAppNode Association nor the developers of this software can have access to your private keys, nor help you recover it if you lose them.

You are solely responsible for keeping your private keys and password safe and to perform secure backups, as well as to restrict access to your computer and other equipment. To the extent permitted by applicable law, you agree to be responsible for all activities that have been conducted from your account. You must take all necessary steps to ensure that your private key, password, and recovery phrase remain confidential and secured.

This is experimental open source software released under an GPLv3 license and may contain errors and/or bugs. No guarantee or representations whatsoever is made regarding its suitability (or its use) for any purpose or regarding its compliance with any applicable laws and regulations. Use of the software is at your own risk and discretion and by using the software you acknowledge that you have read this disclaimer, understand its contents, assume all risk related thereto and hereby release, waive, discharge and covenant not to sue DAppNode Association or any officers, employees or affiliates from and for any direct or indirect liability resulting from the use of the software as permissible by applicable laws and regulations.

### Licensing Terms

DAppNode FOSS is a fully open-source software program licensed pursuant to the GNU General Public License v3.0.

The DAppNode name, the term “DAppNode” and all related names, logos, product and service names, designs and slogans are trademarks of DAppNode Association or its affiliates and/or licensors. You must not use such marks without our prior written permission.

### Risks of Operating DAppNode

The use of DAppNode and the 3rd party software included within its different DNPs can lead to loss of money. Blockchain technologies and in particular Ethereum are still experimental systems and ETH and other cryptocurrencies remain a risky investment. You alone are responsible for your actions on DAppNode including the security of your ETH and meeting any applicable minimum system requirements.

Use the 3rd party software included within its different DNPs might be subject to Terms and Conditions of the 3rd party. DAppNode association has done its best to include such Terms and Conditions, however we do not warrant the accuracy, completeness or usefulness of the 3rd party Terms and Conditions. Any reliance you place on such information is strictly at your own risk. We recommend consulting with the 3rd party responsible for the software for its most updated Terms and Conditions.

We make no claims that DAppNode is appropriate or permitted for use in any specific jurisdiction. Access to DAppNode may not be legal by certain persons or in certain jurisdictions or countries. If you access DAppNode, you do so on your own initiative and are responsible for compliance with local laws.

Some Internet plans will charge an additional amount for any excess upload bandwidth used that isn't included in the plan and may terminate your connection without warning because of overuse. We advise that you check whether your Internet connection is subjected to such limitations and monitor your bandwidth use so that you can stop DAppNode before you reach your bandwidth limit.

### Warranty Disclaimer

DAPPNODE IS PROVIDED ON AN “AS-IS” BASIS AND MAY INCLUDE ERRORS, OMISSIONS, OR OTHER INACCURACIES. DAPPNODE ASSOCIATION AND ITS CONTRIBUTORS MAKE NO REPRESENTATIONS OR WARRANTIES ABOUT DAPNODDE FOR ANY PURPOSE, AND HEREBY EXPRESSLY DISCLAIM ALL WARRANTIES, EXPRESS OR IMPLIED, INCLUDING, WITHOUT LIMITATION, ANY WARRANTY OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, OR NON-INFRINGEMENT OR ANY OTHER IMPLIED WARRANTY UNDER THE UNIFORM COMPUTER INFORMATION TRANSACTIONS ACT AS ENACTED BY ANY STATE. WE ALSO MAKE NO REPRESENTATIONS OR WARRANTIES THAT DAPPNODE WILL OPERATE ERROR-FREE, UNINTERRUPTED, OR IN A MANNER THAT WILL MEET YOUR REQUIREMENTS AND/OR NEEDS. THEREFORE, YOU ASSUME THE ENTIRE RISK REGARDING THE QUALITY AND/OR PERFORMANCE OF DAPPNODE AND ANY TRANSACTIONS ENTERED INTO THEREON.

### Limitation of Liability

In no event will DAppNode Association or any of its contributors be liable, whether in contract, warranty, tort (including negligence, whether active, passive or imputed), product liability, strict liability or other theory, breach of statutory duty or otherwise arising out of, or in connection with, your use of DAppNode, for any direct, indirect, incidental, special or consequential damages (including any loss of profits or data, business interruption or other pecuniary loss, or damage, loss or other compromise of data, in each case whether direct, indirect, incidental, special or consequential) arising out of the use of DAppNode, even if we or other users have been advised of the possibility of such damages. The foregoing limitations and disclaimers shall apply to the maximum extent permitted by applicable law, even if any remedy fails of its essential purpose. You acknowledge and agree that the limitations of liability afforded us hereunder constitute a material and actual inducement and condition to entering into these Terms, and are reasonable, fair and equitable in scope to protect our legitimate interests in light of the fact that we are not receiving consideration from you for providing DAppNode.

### Indemnification

To the maximum extent permitted by law, you will defend, indemnify and hold DAppNode and its contributors harmless from and against any and all claims, actions, suits, investigations, or proceedings by any third party (including any party or purported party to or beneficiary or purported beneficiary of any transaction on DAppNode), as well as any and all losses, liabilities,
damages, costs, and expenses (including reasonable attorneys' fees) arising out of, accruing from, or in any way related to (i) your breach of the terms of this Agreement, (ii) any transaction, or the failure to occur of any transaction on DAppNode, and (iii) your negligence, fraud, or willful misconduct.

### Compliance with Laws and Tax Obligations

Your use of DAppNode is subject to all applicable laws of any governmental authority, including, without limitation, federal, state and foreign securities laws, tax laws, tariff and trade laws, ordinances, judgments, decrees, injunctions, writs and orders or like actions of any governmental authority and rules, regulations, orders, interpretations, licenses, and permits of any federal, regional, state, county, municipal or other governmental authority and you agree to comply with all such laws in your use of DAppNode. The users of DAppNode are solely responsible to determinate what, if any, taxes apply to their cryptocurrency transactions. The owners of, or contributors to, DAppNode are not responsible for determining the taxes that apply to cryptocurrency transactions.

### Miscellaneous

We reserve the right to revise these Terms, and your rights and obligations are at all times subject to the then-current Terms provided on DAppNode. Your continued use of DAppNode constitutes acceptance of such revised Terms.

These Terms constitute the entire agreement between you and DAppNode Association regarding use of DAppNode FOSS and will supersede all prior agreements whether, written or oral. No usage of trade or other regular practice or method of dealing between the parties will be used to modify, interpret, supplement, or alter the terms of these Terms.

If any portion of these Terms is held invalid or unenforceable, such invalidity or enforceability will not affect the other provisions of these Terms, which will remain in full force and effect, and the invalid or unenforceable portion will be given effect to the greatest extent possible. The failure of a party to require performance of any provision will not affect that party's right to require performance at any time thereafter, nor will a waiver of any breach or default of these Terms or any provision of these Terms constitute a waiver of any subsequent breach or default or a waiver of the provision itself.`;

export interface RelayIface {
  operator: string;
  url: string;
  ofacCompliant?: boolean;
}

export const getDefaultRelays = <T extends Network>(
  network: T
): RelayIface[] => {
  switch (network) {
    case "mainnet":
      return [
        {
          operator: "Flashbots",
          ofacCompliant: true,
          url:
            "https://0xac6e77dfe25ecd6110b8e780608cce0dab71fdd5ebea22a16c0205200f2f8e2e3ad3b71d3499c54ad14d6c21b41a37ae@boost-relay.flashbots.net"
        },
        {
          operator: "bloXroute (1)",
          ofacCompliant: false,
          url:
            "https://0x8b5d2e73e2a3a55c6c87b8b6eb92e0149a125c852751db1422fa951e42a09b82c142c3ea98d0d9930b056a3bc9896b8f@bloxroute.max-profit.blxrbdn.com"
        },
        {
          operator: "bloXroute (2)",
          ofacCompliant: false,
          url:
            "https://0xad0a8bb54565c2211cee576363f3a347089d2f07cf72679d16911d740262694cadb62d7fd7483f27afd714ca0f1b9118@bloxroute.ethical.blxrbdn.com"
        },
        {
          operator: "bloXroute (3)",
          ofacCompliant: false,
          url:
            "https://0xb0b07cd0abef743db4260b0ed50619cf6ad4d82064cb4fbec9d3ec530f7c5e6793d9f286c4e082c0244ffb9f2658fe88@bloxroute.regulated.blxrbdn.com"
        },
        {
          operator: "Blocknative",
          ofacCompliant: true,
          url:
            "https://0x9000009807ed12c1f08bf4e81c6da3ba8e3fc3d953898ce0102433094e5f22f21102ec057841fcb81978ed1ea0fa8246@builder-relay-mainnet.blocknative.com"
        },
        {
          operator: "Eden Network",
          ofacCompliant: true,
          url:
            "https://0xb3ee7afcf27f1f1259ac1787876318c6584ee353097a50ed84f51a1f21a323b3736f271a895c7ce918c038e4265918be@relay.edennetwork.io"
        },
        {
          operator: "Anonymous",
          ofacCompliant: false,
          url:
            "https://0x84e78cb2ad883861c9eeeb7d1b22a8e02332637448f84144e245d20dff1eb97d7abdde96d4e7f80934e5554e11915c56@relayooor.wtf"
        }
      ];
    case "prater":
      return [
        {
          operator: "Flashbots",
          url:
            "https://0xafa4c6985aa049fb79dd37010438cfebeb0f2bd42b115b89dd678dab0670c1de38da0c4e9138c9290a398ecd9a0b3110@builder-relay-goerli.flashbots.net"
        },
        {
          operator: "bloXroute",
          url:
            "https://0x821f2a65afb70e7f2e820a925a9b4c80a159620582c1766b1b09729fec178b11ea22abb3a51f07b288be815a1a2ff516@bloxroute.max-profit.builder.goerli.blxrbdn.com"
        },
        {
          operator: "Blocknative",
          url:
            "https://0x8f7b17a74569b7a57e9bdafd2e159380759f5dc3ccbd4bf600414147e8c4e1dc6ebada83c0139ac15850eb6c975e82d0@builder-relay-goerli.blocknative.com"
        },
        {
          operator: "Eden Network",
          url:
            "https://0xb1d229d9c21298a87846c7022ebeef277dfc321fe674fa45312e20b5b6c400bfde9383f801848d7837ed5fc449083a12@relay-goerli.edennetwork.io"
        },
        {
          operator: "Manifold",
          url:
            "https://0x8a72a5ec3e2909fff931c8b42c9e0e6c6e660ac48a98016777fc63a73316b3ffb5c622495106277f8dbcc17a06e92ca3@goerli-relay.securerpc.com/"
        }
      ];
    default:
      return [];
  }
};
