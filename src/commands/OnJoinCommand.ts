import { Command } from "@colyseus/command";
import { Player } from "../rooms/schema/HaystackRoomState";
import { HaystackRoom } from "../rooms/HaystackRoom";

export class OnJoinCommand extends Command<HaystackRoom, {
    clientId: string,
    playerName: string
}> {
    // @ts-ignore
    execute({ clientId, playerName }) {
        this.state.players.set(clientId, new Player());
        this.state.players.get(clientId).id = clientId;
        this.state.players.get(clientId).name = playerName;
        this.state.players.get(clientId).timeJoined = this.clock.currentTime;
        this.state.players.get(clientId).color = this.generateClientColor();

        // if there is currently no active admin, the new client will be admin
        let connectedAdmins = 0;
        this.state.players.forEach((player) => {
            // do not count the current player
            if(player.id !== clientId) {
                // only count existing admins
                if(player.admin) {
                    // do not count disconnected players
                    if(!player.disconnectedCurrently) {
                        connectedAdmins++;
                    }
                }
            }
        });
        if(connectedAdmins === 0) {
            // note regarding one-admin-constraint: this call guarantees a single admin, no further action required
            this.state.players.get(clientId).admin = true;
        }
    }

    generateClientColor() {
        // color catalogue
        let colors = [
            '0d6efd',
            '6610f2',
            '6f42c1',
            'd63384',
            'dc3545',
            'fd7e14',
            'ffc107',
            '198754',
            '20c997',
            '0dcaf0',
            '6c757d'
        ]

        // get colors currently taken
        let colorsTaken = new Array<string>();
        this.state.players.forEach((player) => {
            colorsTaken.push(player.color);
        });

        // get available colors
        let colorsAvailable = colors.filter(x => !colorsTaken.includes(x));

        // return random available color
        return colorsAvailable[Math.floor(Math.random() * colorsAvailable.length)];
    }
}