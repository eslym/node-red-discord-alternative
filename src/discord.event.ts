import {Node, NodeAPI, NodeConstructor, NodeDef, NodeInitializer, NodeMessage} from "node-red";
import {ClientEvents} from "discord.js";
import {DiscordClientNode} from "./discord.client";
import path = require("path");
import Flatted = require("flatted");

declare type DiscordEventName = keyof ClientEvents;

interface DiscordEventNodeDef extends NodeDef {
    client: string;
    event: DiscordEventName;
}

export interface DiscordEventNode extends Node {}

const FILENAME = path.basename(__filename, path.extname(__filename));

export default module.exports = (function (RED: NodeAPI) {
    const DiscordGuildMemberEventNode: NodeConstructor<DiscordEventNode, DiscordEventNodeDef, {}> = function (config) {
        RED.nodes.createNode(this, config);
        let clientNode = RED.nodes.getNode(config.client) as DiscordClientNode;
        let readyHandler = ()=>{
            this.status({
                fill: 'green',
                shape: 'dot',
                text: 'ready',
            });
        }
        clientNode.getBot().on('ready', readyHandler);
        let failedHandler = ()=>{
            this.status({
                fill: 'red',
                shape: 'dot',
                text: 'failed',
            });
        };
        clientNode.on('failed' as any, failedHandler);
        let handler = (...args: any) => {
                if(args.leng == 0)
                    args = null;
                else if (args.length == 1) {
                    args = args[0];
                }
                let msg: NodeMessage = {
                    _msgid: RED.util.generateId(),
                    topic: config.event,
                    payload: Flatted.parse(Flatted.stringify(args)),
                };
                this.send(msg);
            };
        clientNode.getBot().on(config.event, handler);
        this.on('close', ()=>{
            clientNode.getBot().off('ready', readyHandler);
            clientNode.getBot().off(config.event, handler);
            clientNode.off('failed', failedHandler);
        });
    }
    RED.nodes.registerType(FILENAME, DiscordGuildMemberEventNode);
}) as NodeInitializer;
