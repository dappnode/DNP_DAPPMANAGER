import { Network } from "common";

export const rootPath = "/stakers";
export const title = "Stakers";

export const defaultDappnodeGraffiti = "validating_from_DAppNode";
export const getDefaultCheckpointSync = (network: Network) =>
  network === "mainnet"
    ? "https://checkpoint-sync.dappnode.io"
    : network === "prater"
    ? "https://checkpoint-sync-prater.dappnode.io"
    : "";

export const disclaimer = `## Terms of Use - DAppNode

Effective as of Oct 14, 2020

By downloading, accessing or using this DAppNode Package ("DNP"), you (referenced herein as “you” or the “user”) certify that you have read and agreed to the terms and conditions below (the “Terms”) which form a binding contract between you and DAppNode Association (referenced herein as “we” or “us”). If you do not agree to the Terms, do not download or use DAppNode or any DNPs.

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

The use of DAppNode and the 3rd party software included within its different DNPs can lead to loss of money. Blockchain technologies and in particular Ethereum are still experimental systems thus ETH and other cryptocurrencies remain a risky investment. You alone are responsible for your actions on DAppNode including the security of your cryptocurrency and meeting any applicable minimum system requirements.

Furthermore the Wider Crypto Industry including Ethereum is still nascesnt in most respects: Technologically it remains experimental and as such laws and regulations surrounding the industry are still developing, many of which contrast dramatically with the ideological values of much of the cryptocurrency community mainly related to censorhip.

Use the 3rd party software included within its different DNPs might be subject to Terms and Conditions of the 3rd party. DAppNode association has done its best to include such Terms and Conditions, however we do not warrant the accuracy, completeness or usefulness of the 3rd party Terms and Conditions. Any reliance you place on such information is strictly at your own risk. We recommend consulting with the 3rd party responsible for the software for its most updated Terms and Conditions.

We make no claims that DAppNode is appropriate or permitted for use in any specific jurisdiction. Access to DAppNode may not be legal by certain persons or in certain jurisdictions or countries. If you access DAppNode, you do so on your own initiative and are responsible for compliance with local laws.

Some Internet plans will charge an additional amount for any excess upload bandwidth used that isn’t included in the plan and may terminate your connection without warning because of overuse. We advise that you check wher your Internet connection is subjected to such limitations and monitor your bandwidth use so that you can stop DAppNode before you reach your bandwidth limit.

### OFAC + MEV-Boost

One of the most contentious issues in Ethereum at the moment is related to a new technology known as Proposer-Builder Separation (PBS). So far, the primary implementation of this protocol is highly centralized to a single program called MEV-Boost, which is developed by Flashbots.  This technology is designed to try to increase rewards for block proposers by finding the (MEV) Maximal Extractable Value. It is the profit a block proposer (miner or validator) can make through their ability to arbitrarily include, exclude, or re-order transactions from the blocks they propose.  MEV-Boost accomplishes this by outsourcing the block building/transaction bundling duties of the validator to an external specialized builder running a builder relay(s).  There are many builder relays availible from several different sources. The main differences between builder relays are primarily how they bundle these transactions, however the more important difference is whether or not the relay censors any transactions, by not includidng them in the block, regardless of the fee or tip the transaction is paying to be included in the block.  This censorship is a legal and regulatory quandary that goes against the very ideological nature of Ethereum as a censorship resistent, free, open, and permissionless financial ecosystem.  

The censorship at the crux of this quandary is related to the Office of Foreign Asset Control (OFAC) which is one of the enforcement arms of the United States Treasury Department.  OFAC has wide authority over financial transactions and is charged with monitoring and enforcing US financial sanctions against certain countries, organizations, and individuals.  Penalties are strong for OFAC violations and the reach of OFAC extends far beyond US borders; according to OFAC's October 2021 "Sanctions Compliance Guidance for the Virtual Currency Industry", when asked "Who Must Comply with OFAC Sanctions?" the response is as follows:

"All U.S. persons are required to comply with OFAC regulations. This includes all U.S. citizens and lawful permanent residents,
wherever located; all individuals and entities within the United States; and all entities organized under the laws of the United States or
any jurisdiction within the United States, including any foreign branches of those entities. Accordingly, anyone engaging in virtual currency
activities in the United States, or that involve U.S. individuals or entities, should be aware of OFAC sanctions requirements and the
circumstances in which they must comply with those requirements.

Depending on the authorities governing each sanctions program, others may also be required to adhere to OFAC sanctions requirements.
For example, OFAC’s Cuba, Iran, and North Korea sanctions programs extend sanctions prohibitions to certain foreign entities owned or
controlled by U.S. persons or U.S. financial institutions. Certain activities by non-U.S. persons that involve the United States, U.S. persons,
or goods or services exported from the United States may also be subject to OFAC sanctions regulations.

Additionally, in most sanctions programs, any transaction that causes a violation — including a transaction by a non-U.S. person that causes
a U.S. person to violate sanctions — is also prohibited. For certain sanctions programs, U.S. persons, wherever located, also are prohibited
from facilitating actions on behalf of non-U.S. persons if the activity would be prohibited by sanctions regulations if directly performed by a
U.S. person or within the United States.

**Strict Liability Regulations**
OFAC may impose civil penalties for sanctions violations generally based on a strict liability legal standard. This means that, in many cases,
a U.S. person may be held civilly liable for sanctions violations even without having knowledge or reason to know it was engaging in such
a violation. As a general matter, however, OFAC takes into consideration the totality of facts and circumstances surrounding an apparent
violation to determine the appropriate enforcement response. "

As such, relay providers offer: 
	
 - Non-Compliant relays: relays that attempt to maximize the fees paid to the block proposer by using every possible strategy, including not filtering or censoring any transactions, even those that may be destined to or coming from an address that has been blacklisted by OFAC.  
- Compliant relays: relays that attempt to maximize fees paid to the block proposor, but filter out and censor any transactions destined to or coming from an OFAC blacklisted address.

Your use of DAppNode is subject to all applicable laws of any governmental authority You are subject to, including, without limitation, federal, state and foreign securities laws, tax laws, tariff and trade laws, ordinances, judgments, decrees, injunctions, writs and orders or like actions of any governmental authority and rules, regulations, orders, interpretations, licenses, and permits of any federal, regional, state, county, municipal or other governmental authority and you agree to comply with all such laws in Your use of DAppNode. You are solely responsible for determining what rules and regulations apply to Your personal actions that may arise as the result of using MEV-Boost and/or any relays that do not comply with OFAC. The owners of, or contributors to, DAppNode are not responsible for any unnanounced changes to the availability or reliability of any relays, nor determining the rules and regulations that apply to cryptocurrency transactions users may propose using the DAppNode Platform.  DAppNode does not explicitly endorse the use of MEV-Boost or any paricular relay in any way; it is Your responsibility to determine what laws apply to You and abide by them. DAppNode will not be held liable for any of your choices or actions as a result of using DAppNode.  Continued use of DAppNode constitutes Your understanding and agreement with these updated terms.

### Warranty Disclaimer

DAPPNODE IS PROVIDED ON AN “AS-IS” BASIS AND MAY INCLUDE ERRORS, OMISSIONS, OR OTHER INACCURACIES. DAPPNODE ASSOCIATION AND ITS CONTRIBUTORS MAKE NO REPRESENTATIONS OR WARRANTIES ABOUT DAPNODDE FOR ANY PURPOSE, AND HEREBY EXPRESSLY DISCLAIM ALL WARRANTIES, EXPRESS OR IMPLIED, INCLUDING, WITHOUT LIMITATION, ANY WARRANTY OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, OR NON-INFRINGEMENT OR ANY OTHER IMPLIED WARRANTY UNDER THE UNIFORM COMPUTER INFORMATION TRANSACTIONS ACT AS ENACTED BY ANY STATE. WE ALSO MAKE NO REPRESENTATIONS OR WARRANTIES THAT DAPPNODE WILL OPERATE ERROR-FREE, UNINTERRUPTED, OR IN A MANNER THAT WILL MEET YOUR REQUIREMENTS AND/OR NEEDS. THEREFORE, YOU ASSUME THE ENTIRE RISK REGARDING THE QUALITY AND/OR PERFORMANCE OF DAPPNODE AND ANY TRANSACTIONS ENTERED INTO THEREON.

### Limitation of Liability

In no event will DAppNode Association or any of its contributors be liable, whether in contract, warranty, tort (including negligence, whether active, passive or imputed), product liability, strict liability or other theory, breach of statutory duty or otherwise arising out of, or in connection with, your use of DAppNode, for any direct, indirect, incidental, special or consequential damages (including any loss of profits or data, business interruption or other pecuniary loss, or damage, loss or other compromise of data, in each case whether direct, indirect, incidental, special or consequential) arising out of the use of DAppNode, even if we or other users have been advised of the possibility of such damages. The foregoing limitations and disclaimers shall apply to the maximum extent permitted by applicable law, even if any remedy fails of its essential purpose. You acknowledge and agree that the limitations of liability afforded us hereunder constitute a material and actual inducement and condition to entering into these Terms, and are reasonable, fair and equitable in scope to protect our legitimate interests in light of the fact that we are not receiving consideration from you for providing DAppNode.

### Indemnification

To the maximum extent permitted by law, you will defend, indemnify and hold DAppNode and its contributors harmless from and against any and all claims, actions, suits, investigations, or proceedings by any third party (including any party or purported party to or beneficiary or purported beneficiary of any transaction on DAppNode), as well as any and all losses, liabilities,
damages, costs, and expenses (including reasonable attorneys’ fees) arising out of, accruing from, or in any way related to (i) your breach of the terms of this Agreement, (ii) any transaction, or the failure to occur of any transaction on DAppNode, and (iii) your negligence, fraud, or willful misconduct.

### Compliance with Laws and Tax Obligations

Your use of DAppNode is subject to all applicable laws of any governmental authority, including, without limitation, federal, state and foreign securities laws, tax laws, tariff and trade laws, ordinances, judgments, decrees, injunctions, writs and orders or like actions of any governmental authority and rules, regulations, orders, interpretations, licenses, and permits of any federal, regional, state, county, municipal or other governmental authority and you agree to comply with all such laws in your use of DAppNode. The users of DAppNode are solely responsible to determinate what, if any, taxes apply to their cryptocurrency transactions. The owners of, or contributors to, DAppNode are not responsible for determining the taxes that apply to cryptocurrency transactions.

### Miscellaneous

We reserve the right to revise these Terms, and your rights and obligations are at all times subject to the then-current Terms provided on DAppNode. Your continued use of DAppNode constitutes acceptance of such revised Terms.

These Terms constitute the entire agreement between you and DAppNode Association regarding use of DAppNode FOSS and will supersede all prior agreements whether, written or oral. No usage of trade or other regular practice or method of dealing between the parties will be used to modify, interpret, supplement, or alter the terms of these Terms.

If any portion of these Terms is held invalid or unenforceable, such invalidity or enforceability will not affect the other provisions of these Terms, which will remain in full force and effect, and the invalid or unenforceable portion will be given effect to the greatest extent possible. The failure of a party to require performance of any provision will not affect that party’s right to require performance at any time thereafter, nor will a waiver of any breach or default of these Terms or any provision of these Terms constitute a waiver of any subsequent breach or default or a waiver of the provision itself.`;
