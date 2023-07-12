import "mocha";
import { expect } from "chai";
import rewiremock from "rewiremock/webpack";

/* eslint-disable-next-line @typescript-eslint/explicit-function-return-type */
function getPasswordManager(
  shellMock: (cmd: string | string[]) => Promise<string>,
  image: string
) {
  return rewiremock.around(
    () => import("../../../src/modules/passwordManager"),
    mock => {
      mock(() => import("../../../src/utils/shell"))
        .withDefault(shellMock)
        .toBeUsed();
      mock(() => import("../../../src/utils/getDappmanagerImage"))
        .withDefault(async () => image)
        .toBeUsed();
    }
  );
}

describe.skip("Module > passwordManager", () => {
  const image = "dappmanager.dnp.dappnode.eth:0.2.0";
  const grepCommand = `docker run --rm -v /etc:/etc --privileged --entrypoint="" dappmanager.dnp.dappnode.eth:0.2.0 sh -c "grep dappnode:.*insecur3 /etc/shadow"`;
  const passwordHash = `dappnode:$6$insecur3$rnEv9Amdjn3ctXxPYOlzj/cwvLT43GjWzkPECIHNqd8Vvza5bMG8QqMwEIBKYqnj609D.4ngi4qlmt29dLE.71:18004:0:99999:7:::`;

  it("Should check if the password is secure", async () => {
    const { isPasswordSecure } = await getPasswordManager(
      async (cmd: string | string[]) => {
        if (cmd == grepCommand) return passwordHash;
        throw Error(`Unknown command ${cmd}`);
      },
      image
    );

    const isSecure = await isPasswordSecure();
    expect(isSecure).to.equal(false);
  });

  it("Should change the password", async () => {
    let lastCmd;
    const { changePassword } = await getPasswordManager(
      async (cmd: string | string[]) => {
        lastCmd = cmd;
        if (cmd == grepCommand) return passwordHash;
        if (cmd.includes("chpasswd")) return "";
        throw Error(`Unknown command ${cmd}`);
      },
      image
    );

    const newPassword = "secret-password";
    await changePassword(newPassword);
    expect(lastCmd).to.equal(
      `docker run --rm -v /etc:/etc --privileged --entrypoint="" -e PASS='${newPassword}' dappmanager.dnp.dappnode.eth:0.2.0 sh -c 'echo dappnode:$PASS | chpasswd'`
    );
  });

  it("Should block changing the password when it's secure", async () => {
    const { changePassword } = await getPasswordManager(
      async (cmd: string | string[]) => {
        if (cmd == grepCommand) return "";
        throw Error(`Unknown command ${cmd}`);
      },
      image
    );

    let errorMessage = "---did not throw---";
    try {
      await changePassword("password");
    } catch (e) {
      errorMessage = e.message;
    }

    expect(errorMessage).to.equal(
      `The password can only be changed if it's the insecure default`
    );
  });

  it("Should block changing the password if the input contains problematic characters", async () => {
    const { changePassword } = await getPasswordManager(
      async (cmd: string | string[]) => {
        if (cmd == grepCommand) return passwordHash;
        throw Error(`Unknown command ${cmd}`);
      },
      image
    );

    let errorMessage = "---did not throw---";
    try {
      await changePassword("password'ops");
    } catch (e) {
      errorMessage = e.message;
    }

    expect(errorMessage).to.equal(
      `Password must contain only ASCII characters and not the ' character`
    );
  });
});
