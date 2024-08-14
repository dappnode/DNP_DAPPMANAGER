import { Dependencies, InstalledPackageData } from "@dappnode/types";
import { satisfies, validRange } from "semver";

/**
 * Processes the dependencies by first filtering out those that are already satisfied by installed packages
 * and then converting any remaining semver ranges to appropriate APM versions.
 *
 * @param dependencies The main dependencies object to be processed.
 * @param installedPackages The list of currently installed packages.
 */
export function filterSatisfiedDependencies(
    dependencies: Dependencies,
    installedPackages: InstalledPackageData[]
): Dependencies {

    const filteredDependencies: Dependencies = {};

    for (const [depName, depVersion] of Object.entries(dependencies)) {
        const installedPackage = installedPackages.find(
            (pkg) => pkg.dnpName === depName
        );

        if (!validRange(depVersion))
            throw new Error(`Invalid semver notation for dependency ${depName}: ${depVersion}`);

        // Remove dependency if it is already satisfied by an installed package
        if (installedPackage && satisfies(installedPackage.version, depVersion)) {
            console.log(
                `Dependency ${depName} is already installed with version ${installedPackage.version}`
            );

            filteredDependencies[depName] = installedPackage.version;
        }
    }

    return filteredDependencies;
}