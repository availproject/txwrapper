import { getRegistryBase, TypeRegistry } from '@substrate/txwrapper-core';
import { methods as substrateMethods } from '@substrate/txwrapper-substrate';
import { types as availTypes, signedExtensions as availSignedExtensions } from 'avail-js-sdk';

// Export methods of pallets included in your chain's runtime.
// Note: you may also want to create methods for pallets specifc to your chain. In that case
// consult the CHAIN_BUILDER.md guide.
export const methods = {
	balances: substrateMethods.balances,
	nominationPools: substrateMethods.nominationPools,
	proxy: substrateMethods.proxy,
	staking: substrateMethods.staking,
	system: substrateMethods.system,
	utility: substrateMethods.utility,
};

// Export Avail custom decode function
export { decode as decodeAvail } from './decode';

// Rexport all of txwrapper-core so users have access to utilities, construct functions,
// decode function, and types.
export * from '@substrate/txwrapper-core';

export const signedExtensionsList = [
	'CheckNonZeroSender',
	'CheckSpecVersion',
	'CheckTxVersion',
	'CheckGenesis',
	'CheckMortality',
	'CheckNonce',
	'CheckWeight',
	'ChargeTransactionPayment',
	'CheckAppId'
]

export function getRegistry({ metadataRpc }: any): TypeRegistry {
	const registry = getRegistryBase({
		chainProperties: {
			ss58Format: 42,
			tokenDecimals: 18,
			tokenSymbol: 'AVAIL', // For Goldberg, use 'AVL'.
		},
		specTypes: availTypes, // For Goldberg network, import and use 'goldbergTypes' from avail-js-sdk.
		signedExtensions: signedExtensionsList,
		userExtensions: availSignedExtensions,
		metadataRpc,
	});
	registry.setSignedExtensions(signedExtensionsList, availSignedExtensions)
	return registry
}