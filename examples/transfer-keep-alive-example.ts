/* eslint-disable @typescript-eslint/restrict-template-expressions */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/**
 * @ignore Don't show this file in documentation.
 */

import { Keyring } from '@polkadot/api';
import { cryptoWaitReady } from '@polkadot/util-crypto';
import { signedExtensions as availSignedExtensions } from 'avail-js-sdk';
import { UnsignedTransaction, construct, decodeAvail, deriveAddress, getRegistry, methods, signedExtensionsList } from '../src';
import { rpcToLocalNode, signWith } from './util';

export interface AvailUnsignedTransaction extends UnsignedTransaction {
	// The app id used to send a transaction 
	app_id?: number;
}

/**
 * Entry point of the script. This script assumes an Avail node is running
 * locally on `http://0.0.0.0:9944`.
 */
async function main(): Promise<void> {
	// Wait for the promise to resolve async WASM
	await cryptoWaitReady();
	// Create a new keyring, and add an "Alice" account
	const keyring = new Keyring();
	const alice = keyring.addFromUri('//Alice', { name: 'Alice' }, 'sr25519');
	const bob = keyring.addFromUri('//Bob', { name: 'Bob' }, 'sr25519');
	console.log(
		"Alice's SS58-Encoded Address:",
		deriveAddress(alice.publicKey, 42),
	);

	// To construct the tx, we need some up-to-date information from the node.
	// `txwrapper` is offline-only, so does not care how you retrieve this info.
	// In this tutorial, we simply send RPC requests to the node.
	const { block } = await rpcToLocalNode('chain_getBlock');
	const blockHash = await rpcToLocalNode('chain_getBlockHash');
	const genesisHash = await rpcToLocalNode('chain_getBlockHash', [0]);
	const metadataRpc = await rpcToLocalNode('state_getMetadata');
	const nonce = await rpcToLocalNode('system_accountNextIndex', [deriveAddress(alice.publicKey, 42)]);
	const { specVersion, transactionVersion } = await rpcToLocalNode(
		'state_getRuntimeVersion',
	);

	// Create type registry.
	const registry = getRegistry({ metadataRpc });

	// Now we can create our `balances.transfer` unsigned tx. The following
	// function takes the above data as arguments, so can be performed offline
	// if desired.
	// In this example we use the `transfer_keep_alive` method; feel free to pick a
	// different method that illustrates using your chain.
	const unsigned: AvailUnsignedTransaction = methods.balances.transferKeepAlive(
		{
			value: '1000000000000000000',
			dest: { id: deriveAddress(bob.publicKey, 42) }, // Bob
		},
		{
			address: deriveAddress(alice.publicKey, 42),
			blockHash,
			blockNumber: registry
				.createType('BlockNumber', block.header.number)
				.toNumber(),
			eraPeriod: 64,
			genesisHash,
			metadataRpc,
			nonce,
			specVersion,
			tip: 0,
			transactionVersion,
		},
		{
			metadataRpc,
			registry,
			signedExtensions: signedExtensionsList,
			userExtensions: availSignedExtensions
		},
	);

	// Set the app_id
	unsigned.app_id = 0

	// Decode an unsigned transaction.
	const decodedUnsigned = decodeAvail(unsigned, {
		metadataRpc,
		registry,
		signedExtensions: signedExtensionsList,
		userExtensions: availSignedExtensions
	});
	console.log(
		`\nDecoded Transaction\n  To: ${JSON.stringify(decodedUnsigned.method.args.dest)}\n` +
		`  Amount: ${decodedUnsigned.method.args.value}`,
	);

	// Construct the signing payload from an unsigned transaction.
	// Here, specifying the app_id is really important for the transaction to work.
	// Using an app_id different than 0 for default substrate transaction won't work either.
	const signingPayload = registry.createType('ExtrinsicPayload', unsigned, { version: unsigned.version }).toHex()
	console.log(`\nPayload to Sign: ${signingPayload}`);


	// Decode the information from a signing payload.
	const payloadInfo = decodeAvail(signingPayload, {
		metadataRpc,
		registry,
		signedExtensions: signedExtensionsList,
		userExtensions: availSignedExtensions
	});
	console.log(
		`\nDecoded Transaction\n  To: ${JSON.stringify(payloadInfo.method.args.dest)}\n` +
		`  Amount: ${payloadInfo.method.args.value}`,
	);

	// Sign a payload. This operation should be performed on an offline device.
	const signature = signWith(alice, signingPayload, {
		metadataRpc,
		registry,
		signedExtensions: signedExtensionsList,
		userExtensions: availSignedExtensions
	});
	console.log(`\nSignature: ${signature}`);

	// Encode a signed transaction.
	const tx = construct.signedTx(unsigned, signature, {
		metadataRpc,
		registry,
		signedExtensions: signedExtensionsList,
		userExtensions: availSignedExtensions
	});
	console.log(`\nTransaction to Submit: ${tx}`);

	// Calculate the tx hash of the signed transaction offline.
	const expectedTxHash = construct.txHash(tx);
	console.log(`\nExpected Tx Hash: ${expectedTxHash}`);

	// Send the tx to the node. Since `txwrapper` is offline-only, this
	// operation should be handled externally. Here, we just send a JSONRPC
	// request directly to the node.
	const actualTxHash = await rpcToLocalNode('author_submitExtrinsic', [tx]);
	console.log(`Actual Tx Hash: ${actualTxHash}`);

	// Decode a signed payload.
	const txInfo = decodeAvail(tx, {
		metadataRpc,
		registry,
		signedExtensions: signedExtensionsList,
		userExtensions: availSignedExtensions
	});
	console.log(
		`\nDecoded Transaction\n  To: ${JSON.stringify(txInfo.method.args.dest)}\n` +
		`  Amount: ${txInfo.method.args.value}\n`,
	);

	process.exit(0)
}

main().catch((error) => {
	console.error(error);
	process.exit(1);
});
