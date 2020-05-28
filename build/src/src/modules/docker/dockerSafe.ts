import { dockerComposeUp, DockerComposeUpOptions } from "./dockerCommands";

/**
 * Solves known issues that may happen with docker-compose up
 *
 * ### Issue 1
 * If the next container failes to be started after creation, the project service will fall in an
 * intermediary state where the previous container has been exited and renamed to `{shortId}_${name}` and the
 * next container has been created in the name in the compose but not started
 * ```bash
 * $ docker ps -a
 *  bcec9fca2514    nginx:alpine    Created                         test_test_1
 *  6181ae0f20b3    nginx:alpine    Exited (0) About an hour ago    6181ae0f20b3_test_test_1
 * ```
 * docker-compose can clean this state. If the project is up-ed with the previous compose the old rename container
 * will be started and will stay renamed. If the project is up-ed with the next compose both containers are removed
 * and a new is created and started
 *
 * Relevant code: `container.rename_to_tmp_name()`
 * https://github.com/docker/compose/blob/f13f26d0997edda343913222dcf228000d0a3540/compose/service.py#L594
 *
 * @param dockerComposePath
 * @param options
 */

export async function dockerComposeUpSafe(
  dockerComposePath: string,
  options?: DockerComposeUpOptions
): Promise<void> {
  await dockerComposeUp(dockerComposePath, options);
}
