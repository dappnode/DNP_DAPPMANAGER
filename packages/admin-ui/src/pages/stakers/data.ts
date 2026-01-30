export const basePath = "stakers";
export const relativePath = `${basePath}/ethereum`; // default redirect to mainnet
export const rootPath = `${basePath}/*`;
export const title = "Stakers";

const intro = `**Effective as of Oct 14, 2020**  
**Last updated: January 28, 2026**

By downloading, accessing or using this Dappnode Package (“DNP”), you (referenced herein as “you” or the “user”) certify that you have read and agreed to the terms and conditions below (the “Terms”) which form a binding contract between you and Dappnode Association (referenced herein as “we” or “us”). If you do not agree to the Terms, do not download or use Dappnode nor any of the DNPs.

By clicking “I accept”, installing, accessing, or continuing to use this Dappnode Package, you expressly confirm that you have read, understood, and agree to be bound by these Terms, and that you are of legal age and have the full legal capacity to enter into a binding contract in your jurisdiction. If you do not meet these requirements, you must not use the Dappnode Package.
`;

const aboutDappnode = `## About Dappnode

Dappnode is Free Open Source Software (“FOSS”) aimed at facilitating the use of decentralized technologies. Dappnode is developed by the Dappnode Association, a voluntary association with the purpose of empowering users to participate in decentralized networks and to help such networks become more resilient by promoting the deployment of more nodes. The modular structure of the Dappnode FOSS allows for the wrapping of 3rd party software with the intention of facilitating its deployment. In no way we are responsible for the misuse of such software and in no way we warrant its functionalities. We accept no responsibility for its errors, or for the errors that the wrapping process might have introduced. Any usage of Dappnode and a DNP is strictly at your own risk.

Nothing in these Terms shall exclude or limit any mandatory rights granted to users under applicable law.
`;
const aboutDNP = `## About this DNP

This software is experimental, presented ‘as is’ and inherently carries risks. By installing it, you acknowledge that Dappnode Association has done its best to mitigate these risks and accept to waive any liability or responsibility for Dappnode Association in case of any shortage, discrepancy, damage, loss or destruction of any digital asset managed within this Dappnode package

This package helps block proposers receive blocks from block producers to propose to the Ethereum network via relayers. Dappnode has no affiliation with any block producers nor relayers and is in no way responsible for the content of such blocks. The user is the sole responsible for complying with any regulations the user is subject to.

This is experimental open source software released under an GPLv3 license and may contain errors and/or bugs. No guarantee or representations whatsoever is made regarding its suitability (or its use) for any purpose or regarding its compliance with any applicable laws and regulations. Use of the software is at your own risk and discretion and by using the software you acknowledge that you have read this disclaimer, understand its contents, assume all risk related thereto and hereby release, waive, discharge and covenant not to sue Dappnode Association or any officers, employees or affiliates from and for any direct or indirect liability resulting from the use of the software to the maximum extent permitted by applicable laws and regulations.
`;
const licenseTerms = `## Licensing Terms

Dappnode FOSS is a fully open-source software program licensed pursuant to the GNU General Public License v3.0.

The Dappnode name, the term “Dappnode” and all related names, logos, product and service names, designs and slogans are trademarks of Dappnode Association or its affiliates and/or licensors. You must not use such marks without our prior written permission.
`;
const risksOfOperatingDappnode = `## Risks of Operating Dappnode

The use of Dappnode and the 3rd party software included within its different DNPs can lead to loss of money. Blockchain technologies and in particular Ethereum are still experimental systems and ETH and other cryptocurrencies remain a risky investment. You alone are responsible for your actions on Dappnode including the security of your cryptocurrency and meeting any applicable minimum system requirements.

Use the 3rd party software included within its different DNPs might be subject to Terms and Conditions of the 3rd party. The Dappnode Association has done its best to include such Terms and Conditions, however we do not warrant the accuracy, completeness or usefulness of the 3rd party Terms and Conditions. Any reliance you place on such information is strictly at your own risk. We recommend consulting with the 3rd party responsible for the software for its most updated Terms and Conditions.

We make no claims that Dappnode is appropriate or permitted for use in any specific jurisdiction. Access to Dappnode may not be legal by certain persons or in certain jurisdictions or countries. If you access Dappnode, you do so on your own initiative and are responsible for compliance with local laws.

Some Internet plans will charge an additional amount for any excess upload bandwidth used that isn’t included in the plan and may terminate your connection without warning because of overuse. We advise that you check whether your Internet connection is subjected to such limitations and monitor your bandwidth use so that you can stop Dappnode before you reach your bandwidth limit.
`;
const warranty = `## Warranty Disclaimer

Dappnode is provided on an “as-is” basis and may include errors, omissions, or other inaccuracies. Dappnode association and its contributors make no representations or warranties about dappnode for any purpose, and hereby expressly disclaim all warranties, express or implied, including, without limitation, any warranty of merchantability, fitness for a particular purpose, or non-infringement or any other implied warranty under the uniform computer information transactions act as enacted by any state. We also make no representations or warranties that dappnode will operate error-free, uninterrupted, or in a manner that will meet your requirements and/or needs. Therefore, you assume the entire risk regarding the quality and/or performance of dappnode and any transactions entered into thereon.
`;
const liabilitylimitation = `## Limitation of Liability

In no event will Dappnode Association or any of its contributors be liable, whether in contract, warranty, tort (including negligence, whether active, passive or imputed), product liability, strict liability or other theory, breach of statutory duty or otherwise arising out of, or in connection with, your use of Dappnode, for any direct, indirect, incidental, special or consequential damages (including any loss of profits or data, business interruption or other pecuniary loss, or damage, loss or other compromise of data, in each case whether direct, indirect, incidental, special or consequential) arising out of the use of Dappnode, even if we or other users have been advised of the possibility of such damages. The foregoing limitations and disclaimers shall apply to the maximum extent permitted by applicable law, even if any remedy fails of its essential purpose.
`;
const indemnification = `## Indemnification

To the maximum extent permitted by law, you will defend, indemnify and hold Dappnode and its contributors harmless from and against any and all claims, actions, suits, investigations, or proceedings by any third party (including any party or purported party to or beneficiary or purported beneficiary of any transaction on Dappnode), as well as any and all losses, liabilities, damages, costs, and expenses (including reasonable attorneys’ fees) arising out of, accruing from, or in any way related to (i) your breach of the terms of this Agreement, (ii) any transaction, or the failure to occur of any transaction on Dappnode, and (iii) your negligence, fraud, or willful misconduct.
`;
const lawsAndTaxes = `## Compliance with Laws and Tax Obligations

Your use of Dappnode is subject to all applicable laws of any governmental authority, including, without limitation, federal, state and foreign securities laws, tax laws, tariff and trade laws, ordinances, judgments, decrees, injunctions, writs and orders or like actions of any governmental authority and rules, regulations, orders, interpretations, licenses, and permits of any federal, regional, state, county, municipal or other governmental authority and you agree to comply with all such laws in your use of Dappnode. The users of Dappnode are solely responsible to determine what, if any, taxes apply to their cryptocurrency transactions. The owners of, or contributors to, Dappnode are not responsible for determining the taxes that apply to cryptocurrency transactions.
`;
const termsModifications = `## Modifications to the Terms

We reserve the right to revise these Terms, and your rights and obligations are at all times subject to the then-current Terms provided on Dappnode. Your continued use of Dappnode constitutes acceptance of such revised Terms.
`;
const lawsAndJurisdiction = `## Governing Law and Jurisdiction

These Terms of Use are governed by Swiss law. The courts of the Kanton of Zug, Switzerland, shall have exclusive jurisdiction. Dappnode Association is organized as a Verein (Swiss association).
`;
const privacyPolicy = `## Privacy Policy

Dappnode Association, respects your privacy and is committed to protecting your personal data in accordance with applicable law. By using Dappnode, you consent to the collection and processing of the following information:

Personal data collected: IP addresses, device identifiers, usage logs, emails or other contact information provided voluntarily, and data generated from the use of Dappnode.

Purpose of processing: operation of the software, security, support, communications, and legal compliance.

Legal basis: performance of a contract, legitimate interest, or compliance with legal obligations.

Data retention: personal data is retained only as long as necessary for the purposes described or as required by law.

Recipients: data may be shared with service providers necessary for operation, including payment processors, hosting, and technical support providers.

International transfers: any transfers outside Switzerland or the EU are subject to appropriate safeguards under applicable law.

User rights: you may request access, correction, deletion, restriction of processing, or objection. You may also lodge a complaint with the relevant data protection authority (Swiss Federal Data Protection and Information Commissioner, FDPIC).

How to exercise rights: contact Dappnode Association via support channels or email provided in the application or website.

By using Dappnode, you acknowledge that you have read and understood this Privacy Policy and consent to the collection and processing of your personal data as described herein.
`;
const miscellaneous = `## Miscellaneous

These Terms constitute the entire agreement between you and Dappnode Association regarding use of Dappnode FOSS and will supersede all prior agreements whether, written or oral. No usage of trade or other regular practice or method of dealing between the parties will be used to modify, interpret, supplement, or alter the terms of these Terms.

If any portion of these Terms is held invalid or unenforceable, such invalidity or enforceability will not affect the other provisions.
`;
const contactInfo = `## Contact Information

For any questions regarding these Terms of Use or our Privacy Policy, you may contact us at: support@dappnode.com
`;

export const termsOfUseList = [
  intro,
  aboutDappnode,
  aboutDNP,
  licenseTerms,
  risksOfOperatingDappnode,
  warranty,
  liabilitylimitation,
  indemnification,
  lawsAndTaxes,
  termsModifications,
  lawsAndJurisdiction,
  privacyPolicy,
  miscellaneous,
  contactInfo
];
