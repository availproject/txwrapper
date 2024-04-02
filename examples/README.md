# How to use `avail-txwrapper`

Here's a mini-tutorial on how `avail-txwrapper` can interact with a Substrate chain. We're using a https://github.com/availproject/avail dev chain:

## Get Started

1. Fetch the latest Avail node from the above link. Follow instructions to build it, and start a dev chain.

    ```bash

    ./target/release/avail-node --dev
    ```

2. Run the example script in this folder. It will interact with your local node.

    ```bash
    ./node_modules/.bin/ts-node examples/transfer-keep-alive-example.ts
    ```

## Offline vs. Online

In the examples, the `rpcToLocalNode` function is the only function that needs to be called with internet access. Everything else can be performed offline. In particular, this example shows how to perform the following operations offline:

- Generate a tx,
- Create its signing payload,
- Sign the signing payload,
- Calculate the tx hash,
- Decode at various levels of the tx lifecycle.
