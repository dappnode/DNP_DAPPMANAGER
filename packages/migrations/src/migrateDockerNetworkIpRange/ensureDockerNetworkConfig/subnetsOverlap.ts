/**
 * Converts an IPv4 address string to an integer.
 * @param ip - A string representing an IPv4 address.
 * @returns The integer representation of the IPv4 address.
 * @example
 * ipToInteger("192.168.1.1"); // returns 3232235777
 */
function ipToInteger(ip: string): number {
    return ip.split('.').reduce((acc, octet) => (acc << 8) + parseInt(octet, 10), 0);
}

/**
 * Calculates the subnet mask for a given number of bits.
 * @param bits - The number of bits in the subnet mask.
 * @returns The subnet mask as an integer.
 * @example
 * calculateSubnetMask(24); // returns 4294967040 (255.255.255.0)
 */
function calculateSubnetMask(bits: number): number {
    return -1 << (32 - bits);
}

/**
 * Checks if the given string is a valid IPv4 address.
 * @param ip - A string representing an IPv4 address.
 * @returns True if the IP address is valid, false otherwise.
 * @example
 * isValidIp("192.168.1.1"); // returns true
 * isValidIp("999.999.999.999"); // returns false
 */
function isValidIp(ip: string): boolean {
    const octets = ip.split('.').map(Number);
    return octets.length === 4 && octets.every(octet => !isNaN(octet) && octet >= 0 && octet <= 255);
}

/**
 * Checks if the given string is a valid CIDR notation.
 * @param cidr - A string representing a CIDR notation.
 * @returns True if the CIDR notation is valid, false otherwise.
 * @example
 * isValidCidr("24"); // returns true
 * isValidCidr("33"); // returns false
 */
function isValidCidr(cidr: string): boolean {
    const mask = parseInt(cidr, 10);
    return !isNaN(mask) && mask >= 0 && mask <= 32;
}

/**
 * Calculates the network address for a given IP address and subnet mask bits.
 * @param ip - The integer representation of an IPv4 address.
 * @param bits - The number of bits in the subnet mask.
 * @returns The network address as an integer.
 * @example
 * getNetworkAddress(3232235777, 24); // returns 3232235776 (192.168.1.0)
 */
function getNetworkAddress(ip: number, bits: number): number {
    return ip & calculateSubnetMask(bits);
}

/**
 * Determines if two subnets overlap.
 * @param subnetA - A string representing the first subnet in CIDR notation.
 * @param subnetB - A string representing the second subnet in CIDR notation.
 * @returns True if the subnets overlap, false otherwise.
 * @throws Error if either of the subnet inputs is invalid.
 * @example
 * subnetsOverlap("192.168.1.0/24", "192.168.1.128/25"); // returns true
 * subnetsOverlap("192.168.1.0/24", "192.168.2.0/24"); // returns false
 */
export function subnetsOverlap(subnetA: string, subnetB: string): boolean {
    const [ipA, maskBitsA] = subnetA.split('/');
    const [ipB, maskBitsB] = subnetB.split('/');

    if (!isValidIp(ipA) || !isValidIp(ipB) || !isValidCidr(maskBitsA) || !isValidCidr(maskBitsB)) {
        throw new Error("Invalid IP address or CIDR notation");
    }

    const ipIntA = ipToInteger(ipA);
    const ipIntB = ipToInteger(ipB);

    const netA = getNetworkAddress(ipIntA, parseInt(maskBitsA, 10));
    const netB = getNetworkAddress(ipIntB, parseInt(maskBitsB, 10));

    const maskA = calculateSubnetMask(parseInt(maskBitsA, 10));
    const maskB = calculateSubnetMask(parseInt(maskBitsB, 10));

    return (netA & maskB) === (netB & maskB) || (netB & maskA) === (netA & maskA);
}
