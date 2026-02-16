/**
 * Generate a unique ID for IP asset registration
 * @param contractAddress - The contract address
 * @param tokenId - The token ID
 * @param timestamp - Optional timestamp to make ID more unique
 * @returns A unique ID string
 */
export declare function generateUniqueId(contractAddress: string, tokenId: number | string, timestamp?: number): string;
/**
 * Generate a unique ID with current timestamp
 * @param contractAddress - The contract address
 * @param tokenId - The token ID
 * @returns A unique ID string with timestamp
 */
export declare function generateTimestampedId(contractAddress: string, tokenId: number | string): string;
/**
 * Extract contract address and token ID from an ID string
 * @param id - The ID (format: contract:tokenId or contract:tokenId:timestamp)
 * @returns Object with contract address and token ID
 */
export declare function parseId(id: string): {
    contractAddress: string;
    tokenId: string;
};
export declare const parseYakoaId: typeof parseId;
//# sourceMappingURL=idGenerator.d.ts.map