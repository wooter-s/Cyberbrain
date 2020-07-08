import * as grpc from "@grpc/grpc-js";
import { CommunicationClient } from "./communication_grpc_pb";
import { State } from "./communication_pb";

// Singleton RPC client.
class RpcClient {
    private static _instance: RpcClient;
    readonly _innerClient: CommunicationClient;

    private constructor() {
        this._innerClient = new CommunicationClient('localhost:50051', grpc.credentials.createInsecure());
    }

    static getClient() {
        if (!RpcClient._instance) {
            RpcClient._instance = new RpcClient();
        }
        return RpcClient._instance;
    }

    async waitForReady() {
        console.log("Waiting for connection ready...");
        const deadline = new Date();
        deadline.setSeconds(deadline.getSeconds() + 20);
        return new Promise((resolve, reject) => {
            grpc.waitForClientReady(this._innerClient, deadline, function (error) {
                if (error === undefined) {
                    console.log("Connected to server 🎉");
                    resolve();
                } else {
                    reject(error);
                }
            });
        });
    }

    async syncState(state: State) {
        return new Promise((resolve, reject) => {
            this._innerClient.syncState(state, function (err, serverState) {
                if (err !== null) {
                    switch (err.code) {
                        case grpc.status.UNAVAILABLE:
                            console.log(`Server unavailable: ${err.message}`);
                            break;
                        default:
                            console.log(`Error calling syncState: ${err}`);
                    }
                    reject(err);
                    return;
                }

                console.log(`Server status is: ${serverState?.getStatus()}`);
                resolve();
            });
        });
    }
}

export { RpcClient };
