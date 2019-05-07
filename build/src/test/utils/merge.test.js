const expect = require("chai").expect;

const merge = require("utils/merge");

describe("Util: merge", () => {
  const manifest = {
    name: "kovan.dnp.dappnode.eth",
    image: {
      ports: ["30303", "30303/udp", "30304:30304"],
      volumes: ["kovan:/root/.local/share/io.parity.ethereum/"]
    }
  };

  it("should merge the userSetVols object", () => {
    const userSetVols = {
      [manifest.name]: {
        "kovan:/root/.local/share/io.parity.ethereum/":
          "different_path:/root/.local/share/io.parity.ethereum/"
      }
    };
    const editedManifest = merge.manifest.vols(manifest, userSetVols);
    expect(editedManifest).to.deep.equal({
      name: "kovan.dnp.dappnode.eth",
      image: {
        ports: ["30303", "30303/udp", "30304:30304"],
        volumes: ["different_path:/root/.local/share/io.parity.ethereum/"]
      }
    });
  });

  it("should merge the userSetPorts object", () => {
    const userSetPorts = {
      [manifest.name]: {
        "30303": "31313:30303",
        "30303/udp": "31313:30303/udp",
        "30304:30304": "30304"
      }
    };
    const editedManifest = merge.manifest.ports(manifest, userSetPorts);
    expect(editedManifest).to.deep.equal({
      name: "kovan.dnp.dappnode.eth",
      image: {
        ports: ["31313:30303", "31313:30303/udp", "30304"],
        volumes: ["kovan:/root/.local/share/io.parity.ethereum/"]
      }
    });
  });

  describe("utils > merge > ENVs", () => {
    it("Should merge 3 ENVs objects", () => {
      const envs1 = { A: "1", B: "1", C: "1", E: "" };
      const envs2 = { A: "2", B: "" };
      const envs3 = { A: "3", D: "3" };
      const envs = merge.envs(envs1, envs2, envs3);
      expect(envs).to.deep.equal({
        A: "3", // Set on envs1, 2, 3. envs3 = max priority, so it wins
        B: "1", // Set on envs2, but it's empty. So it gets the value of envs1
        C: "1", // Set only on envs1
        D: "3", // Set only on envs3
        E: "" // Even if it's empty it still will persist as empty
      });
    });
  });
});
