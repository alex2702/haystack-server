import { Command } from "@colyseus/command";
import { HaystackRoom } from "../rooms/HaystackRoom";

export class OnJoinCommand extends Command<HaystackRoom, {
    clientId: string
}> {
    // @ts-ignore
    execute({ clientId }) {

    }
}