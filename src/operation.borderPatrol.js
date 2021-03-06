Creep.prototype.borderPatrol = function () {
    let sentence = [ICONS.border, 'Border', 'Patrol'];
    let word = Game.time % sentence.length;
    this.say(sentence[word], true);
    // Set squad leader
    if (!this.memory.squadLeader || !this.memory.leader || !Game.getObjectById(this.memory.leader)) {
        let squadLeader = _.filter(Game.creeps, (c) => c.memory && c.memory.overlord === this.memory.overlord && c.memory.operation === 'borderPatrol' && c.memory.squadLeader);
        if (!squadLeader.length) this.memory.squadLeader = true; else this.memory.leader = squadLeader[0].id;
    }
    // Handle squad leader
    if (this.memory.squadLeader) {
        // Handle removing bad remotes
        if (this.room.name === this.memory.responseTarget) remoteManager(this);
        // If military action required do that
        if (this.handleMilitaryCreep(false, false)) return;
        // Handle border
        if (this.borderCheck()) return;
        // Check for squad
        let squadMember = _.filter(this.room.creeps, (c) => c.memory && c.memory.overlord === this.memory.overlord && c.memory.operation === 'borderPatrol' && c.id !== this.id);
        if (!squadMember.length) return this.shibMove(new RoomPosition(25, 25, this.memory.overlord), {range: 22});
        if (this.pos.getRangeTo(this.pos.findClosestByRange(squadMember)) > 1) return this.idleFor(1);
        // Heal squad
        let woundedSquad = _.filter(squadMember, (c) => c.hits < c.hitsMax && c.pos.getRangeTo(this) === 1);
        if (this.hits === this.hitsMax && woundedSquad[0]) this.heal(woundedSquad[0]); else if (this.hits < this.hitsMax) this.heal(this);
        // Move to response room if needed
        if (this.memory.responseTarget && this.room.name !== this.memory.responseTarget) return this.shibMove(new RoomPosition(25, 25, this.memory.responseTarget), {range: 22});
        // If on target, be available to respond
        this.memory.awaitingOrders = this.room.name === this.memory.responseTarget;
        if (!this.memory.onTarget) this.memory.onTarget = Game.time;
        // Idle in target rooms for 20 ticks
        if (!this.memory.responseTarget || this.memory.onTarget + _.random(5, 20) <= Game.time) {
            if (!this.memory.remotes) this.memory.remotes = JSON.stringify(Game.rooms[this.memory.overlord].memory.remoteRooms);
            let remotes = JSON.parse(this.memory.remotes);
            this.memory.responseTarget = _.sample(remotes);
            this.memory.onTarget = undefined;
            return this.say(this.memory.responseTarget);
        }
        if (this.memory.responseTarget && !this.shibMove(new RoomPosition(25, 25, this.memory.responseTarget), {range: 17})) return this.idleFor(5);
    } else {
        // Set leader and move to them
        let leader = Game.getObjectById(this.memory.leader);
        if (this.room.name === leader.room.name) this.shibMove(leader, {
            range: 0,
            ignoreRoads: true
        }); else this.shibMove(new RoomPosition(25, 25, leader.room.name), {range: 23});
        // Heal squadmates
        let squadMember = _.filter(this.room.creeps, (c) => c.memory && c.memory.overlord === this.memory.overlord && c.memory.operation === 'borderPatrol' && c.id !== this.id);
        // Heal squad
        let woundedSquad = _.filter(squadMember, (c) => c.hits < c.hitsMax && c.pos.getRangeTo(this) === 1);
        if (this.hits === this.hitsMax && woundedSquad[0]) this.heal(woundedSquad[0]); else if (this.hits < this.hitsMax) this.heal(this);
        if (this.memory.role === 'longbow') this.attackInRange(); else this.handleMilitaryCreep(false, false);
    }
};

function remoteManager(creep) {
    // Remove remote if reserved by someone else
    if (creep.room.controller && creep.room.controller.reservation && creep.room.controller.reservation.username !== MY_USERNAME) Game.rooms[creep.memory.overlord].memory.remoteRooms = _.filter(Game.rooms[creep.memory.overlord].memory.remoteRooms, (r) => r !== creep.room.name);
    // Remove remote if owned by someone else
    if (creep.room.controller && creep.room.controller.owner && creep.room.controller.owner.username !== MY_USERNAME) Game.rooms[creep.memory.overlord].memory.remoteRooms = _.filter(Game.rooms[creep.memory.overlord].memory.remoteRooms, (r) => r !== creep.room.name);
}