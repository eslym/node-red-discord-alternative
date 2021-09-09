import {Node, NodeConstructor, NodeDef, NodeInitializer, NodeMessage} from "node-red";
import * as path from "path";
import {DiscordClientNode} from "./discord.client";
import {serializeError} from "serialize-error";

interface DiscordInjectNodeDef extends NodeDef{
    client: string;
    store: string;
    key: string;
    to: string[];
}

export interface DiscordInjectNode extends Node {}

const FILENAME = path.basename(__filename, path.extname(__filename));

export default module.exports = ((RED)=>{
    const DiscordInjectNode: NodeConstructor<DiscordInjectNode, DiscordInjectNodeDef, {}> = function (config){
        RED.nodes.createNode(this, config);
        let clientNode = RED.nodes.getNode(config.client) as DiscordClientNode;
        let key = RED.util.normalisePropertyExpression(config.key).join('.');
        let promises = config.to.map<Node>(RED.nodes.getNode)
            .map((node)=>new Promise<Node>((res, rej)=>{
                if(node === null) return;
                node.context().set(key, clientNode.getBot(), (err) => {
                    if(err){
                        let msg: NodeMessage & {targetNode: string} = {
                            _msgid: RED.util.generateId(),
                            targetNode: node.id,
                            payload: serializeError(err),
                        };
                        this.status({
                            fill: 'red',
                            shape: 'dot',
                            text: 'failed to inject to '+node.id,
                        });
                        this.send(msg);
                    } else {
                        node.on('close', (done)=>{
                            node.context().set(config.key, undefined, config.store, done);
                        });
                    }
                    res(node);
                });
            }));
        Promise.allSettled(promises).then(()=>{
            this.status({
                fill: 'green',
                shape: 'dot',
                text: 'injected'
            });
        });
    }

    RED.nodes.registerType(FILENAME, DiscordInjectNode);
}) as NodeInitializer;