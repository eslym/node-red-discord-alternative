import {NodeDef, Node, NodeAPI, NodeInitializer, NodeConstructor} from "node-red";
import * as path from "path";
import {asyncRED} from "./util";
import {Snowflake} from "discord.js";
import {DiscordClientNode} from "./discord.client";
import Flatted = require("flatted");

interface DiscordMemberRoleNodeDef extends NodeDef {
    client: string;
    guild: string;
    guildsrc: string;
    member: string;
    membersrc: string;
    role: string;
    rolesrc: string;
    action: string;
    actionsrc: string;
}

export interface DiscordMemberRoleNode extends Node {}

const FILENAME = path.basename(__filename, path.extname(__filename));

export default module.exports = (function (RED: NodeAPI) {
    const DiscordMemberRoleNode: NodeConstructor<DiscordMemberRoleNode, DiscordMemberRoleNodeDef, {}> = function (config) {
        RED.nodes.createNode(this, config);
        let aRED = asyncRED(RED);
        let guildResolver = aRED.evaluatePropertyGetter<Snowflake>(this, config.guild, config.guildsrc);
        let memberResolver = aRED.evaluatePropertyGetter<Snowflake>(this, config.member, config.membersrc);
        let roleResolver = aRED.evaluatePropertyGetter<Snowflake>(this, config.role, config.rolesrc);
        let actionResolver = aRED.evaluatePropertyGetter<string>(this, config.action, config.actionsrc);
        let clientNode = RED.nodes.getNode(config.client) as DiscordClientNode;
        this.on('input', async (msg, send, done) => {
            try{
                let guildID = await guildResolver(msg);
                let memberID = await memberResolver(msg);
                let roleID = await roleResolver(msg);
                let action = await actionResolver(msg);
                let guild = await clientNode.getBot().guilds.fetch(guildID);
                let member = await guild.members.fetch(memberID);
                switch (action){
                    case 'add': case 'remove':
                        let res = await member.roles[action](roleID);
                        msg.payload = Flatted.parse(Flatted.stringify(res));
                        this.send(msg);
                        break;
                    case 'get':
                        let roles = member.roles.cache.map((r)=>Flatted.parse(Flatted.stringify(r)));
                        msg.payload = roles;
                        this.send(msg);
                        break;
                    default:
                        // noinspection ExceptionCaughtLocallyJS
                        throw new Error('Invalid Action');
                }
            } catch (e){
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

    RED.nodes.registerType(FILENAME, DiscordMemberRoleNode);
}) as NodeInitializer;
