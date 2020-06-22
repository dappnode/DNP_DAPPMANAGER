# Dappmanager

The dappmanager handles the DAppNode core DNPs and any installed DNPs. It also performs maintenance checks. It is a nodejs application controlled externally by the [Admin UI](https://github.com/dappnode/DNP_ADMIN/tree/master/build/src) through a Web Application Messaging Protocol ([WAMP](https://wamp-proto.org)) handled by the [DNP_WAMP](https://github.com/dappnode/DNP_WAMP).

The list of available **remote procedure calls** ([**RPC**](https://wamp-proto.org/intro.html?highlight=rpc)) can be found in the [`src/calls`](./src/calls) directory.

The non-trivial handlers of the aforementioned RPCs use **modules** to perform actions. The available modules can be found in the [`src/modules`](./src/modules) directory.

The dappmanager also performs long running tasks which are named **watchers**. The available modules can be found in the [`src/watchers`](./src/watchers) directory.
