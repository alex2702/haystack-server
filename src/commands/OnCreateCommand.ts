import { Command } from "@colyseus/command";
import { HaystackRoom } from "../rooms/HaystackRoom";

export class OnCreateCommand extends Command<HaystackRoom, {
    options: any
}> {

    // @ts-ignore
    execute({ options }) {

    }
}