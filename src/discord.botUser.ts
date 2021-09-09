import {Node, NodeAPI, NodeConstructor, NodeDef, NodeInitializer, NodeMessageInFlow} from "node-red";
import * as path from "path";
import {asyncContext} from "./util";
import {DiscordClientNode} from "./discord.client";
import Flatted = require("flatted");

interface DiscordBotUserNodeDef extends NodeDef {
    client: string;
    destination: string;
    desttype: string;
}

export interface DiscordBotUserNode extends Node {}

const FILENAME = path.basename(__filename, path.extname(__filename));

export default module.exports = (function (RED: NodeAPI) {
    const DiscordBotUserNode: NodeConstructor<DiscordBotUserNode, DiscordBotUserNodeDef, {}> = function (config) {
        RED.nodes.createNode(this, config);
        let botUserSetter: (msg: NodeMessageInFlow, data) => Promise<void> | void;
        switch (config.desttype){
            case 'msg':
                botUserSetter = (msg, data)=>{
                    let paths = RED.util.normalisePropertyExpression(config.destination).join('.');
                    RED.util.setMessageProperty(msg, paths, data, true);
                };
                break;
            case 'flow': case 'global':
                let context = asyncContext(this.context()[config.desttype]);
                let key = RED.util.parseContextStore(config.destination);
                botUserSetter = (msg, data) => context.set(key.key, data, key.store);
                break;
            default:
                botUserSetter = ()=>{throw new Error('Invalid Destination');}
        }
        let clientNode = RED.nodes.getNode(config.client) as DiscordClientNode;
        this.on('input', async (msg, send, done)=> {
            try{
                botUserSetter(msg, Flatted.parse(Flatted.stringify(clientNode.getBot().user)));
                this.send(msg);
                this.status({
                    fill: 'green',
                    shape: 'dot',
                    text: 'success',
                });
            } catch (e) {
                if(done) done(e);
                this.status({
                    fill: 'red',
                    shape: 'dot',
                    text: 'error'
                });
            }
            if(done) done();
        });
    };

    RED.nodes.registerType(FILENAME, DiscordBotUserNode);
} as NodeInitializer);