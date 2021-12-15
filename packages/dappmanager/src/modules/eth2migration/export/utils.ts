/**
 * Return a string with the public keys comma separated
 * @param validatorAccountsData output from prysm `validator accounts list`
 */
export function parseValidatorAccounts(validatorAccountsData: string): string {
  const validatorAccounts = validatorAccountsData.match(/(0x[0-9a-fA-F]{96})/g);
  if (!validatorAccounts) throw Error("No validator accounts found");
  return validatorAccounts.join(",");
}
