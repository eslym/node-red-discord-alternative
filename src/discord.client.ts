import {Node, NodeAPI, NodeConstructor, NodeCredential, NodeDef, NodeInitializer} from "node-red";
import {Client, PartialTypes} from "discord.js";
import path = require('path');

interface DiscordClientNodeCredential extends NodeCredential {
    token: string;
}

interface DiscordClientNodeDef extends NodeDef {
    partials: PartialTypes[];
}

export interface DiscordClientNode extends Node<DiscordClientNodeCredential> {
    token: string;
    getBot(): Client;
}

const FILENAME = path.basename(__filename, path.extname(__filename));

export default module.exports = (function (RED: NodeAPI) {
    const DiscordClientNode: NodeConstructor<DiscordClientNode, DiscordClientNodeDef, DiscordClientNodeCredential> = function (config) {
        RED.nodes.createNode(this, config);
        this.name = config.name;
        this.token = this.credentials.token;
        let client = new Client({
            partials: config.partials
        });
        this.getBot = () => client;
        let tryLogin = ()=>{
            client.login(this.token).catch((error)=>{
                this.emit('failed', error);
                setTimeout(tryLogin, 5000);
            });
        };
        tryLogin();
        this.on('close', (removed, done)=>{
            client.destroy();
            done();
        });
    }

    RED.nodes.registerType(FILENAME, DiscordClientNode, {
        credentials: {
            token: {type: "text"}
        }
    });
}) as NodeInitializer;
