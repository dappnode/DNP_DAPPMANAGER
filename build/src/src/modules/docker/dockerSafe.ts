import { dockerComposeUp, DockerComposeUpOptions } from "./dockerCommands";

// Ports error example error
// root@lionDAppnode:/usr/src/dappnode/DNCORE/dc# docker-compose -f docker-compose2.yml up -d
// WARNING: Found orphan containers (dc_dnp1_1) for this project. If you removed or renamed this service in your compose file, you can run this command with the --remove-orphans flag to clean it up.
// Creating dc_dnp2_1 ... error

// ERROR: for dc_dnp2_1  Cannot start service dnp2: driver failed programming external connectivity on endpoint dc_dnp2_1 (cee2e0d559f12a9434100ff9368b4535380b0e2637ab854475a63c032315b22e): Bind for 0.0.0.0:3000 failed: port is already allocated

// ERROR: for dnp2  Cannot start service dnp2: driver failed programming external connectivity on endpoint dc_dnp2_1 (cee2e0d559f12a9434100ff9368b4535380b0e2637ab854475a63c032315b22e): Bind for 0.0.0.0:3000 failed: port is already allocated
// ERROR: Encountered errors while bringing up the project.

export async function dockerComposeUpSafe(
  dockerComposePath: string,
  options?: DockerComposeUpOptions
): Promise<void> {
  await dockerComposeUp(dockerComposePath, options);
}
