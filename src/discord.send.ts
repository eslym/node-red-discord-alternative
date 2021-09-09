import {Node, NodeAPI, NodeConstructor, NodeDef, NodeInitializer} from 'node-red';
import {Snowflake, TextChannel} from "discord.js";
import {asyncRED} from "./util";
import {DiscordClientNode} from "./discord.client";
import path = require("path");
import Flatted = require("flatted");

interface DiscordSendNodeDef extends NodeDef {
    client: string;
    channel: string;
    src: string;
}

export interface DiscordSendNode extends Node {}

const FILENAME = path.basename(__filename, path.extname(__filename));

export default module.exports = (function (RED: NodeAPI) {
    const DiscordSendNode: NodeConstructor<DiscordSendNode, DiscordSendNodeDef, {}> = function (config){
        RED.nodes.createNode(this, config);
        let aRED = asyncRED(RED);
        let channelIDResolver = aRED.evaluatePropertyGetter<Snowflake>(this, config.channel, config.src);
        let clientNode = RED.nodes.getNode(config.client) as DiscordClientNode;
        this.on('input', async (msg, send, done)=>{
            try{
                let channelId = await channelIDResolver(msg);
                let channel = await clientNode.getBot().channels.fetch(channelId) as TextChannel;
                if(!channel.isText()){
                    // noinspection ExceptionCaughtLocallyJS
                    throw new Error('Channel is not text-based channel');
                }
                let result = await channel.send(msg.payload);
                msg.payload = Flatted.parse(Flatted.stringify(result));
                this.send(msg);
                this.status({
                    fill: 'green',
                    shape: 'dot',
                    text: 'sent '+result.id,
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
    }
    RED.nodes.registerType(FILENAME, DiscordSendNode);
}) as NodeInitializer