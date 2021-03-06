const { Command } = require("klasa");

module.exports = class extends Command {
    constructor(...args) {
        super(...args, {
            name: "daily",
            enabled: true,
            runIn: ["text"],
            description: "Get a daily amount of credits or give them to someone else.",
            usage: "[user:usersearch]"
        });
    }

    async run(msg, [user]) {
        if (user === null) { return; }
               
        var data = this.client.dataManager("select", msg.author.id, "users");
        if (!data && user.id !== msg.author.id) { return msg.channel.send(this.client.speech(msg, ["func-dataCheck", "noAccount"])); }
        
        if (!data) {
            if (this.client.settings.usedDaily.has(msg.author.id)) { //Check if user has recently deleted their own data.
                var revokeCheck = this.client.settings.usedDaily.get(msg.author.id);
                if ((revokeCheck + 86400000) > Date.now()) { //Revoke was executed less than 24 hours ago.
                    return msg.channel.send(this.client.speech(msg, ["func-dataCheck", "revoked"])); 
                }

                this.client.settings.usedDaily.delete(msg.author.id);
            }

            this.client.dataManager("add", msg.author.id);
            return msg.channel.send(this.client.speech(msg, ["daily", "self"]));
        }

        var cooldown = JSON.parse(data.cooldowns);
        if ((cooldown.credit + 86400000) > Date.now()) { return msg.channel.send(this.client.speech(msg, ["func-dataCheck", "cooldown"])); } 
     
        if (user.id === msg.author.id) {
            cooldown.credit = Date.now();

            this.client.dataManager("update", [`credits=${(data.credits + 100)}, cooldowns='${JSON.stringify(cooldown)}'`, msg.author.id], "users");
            return msg.channel.send(this.client.speech(msg, ["daily", "self"]));
        }

        var tarData = this.client.dataManager("select", user.id, "users");
        if (!tarData) { return msg.channel.send(this.client.speech(msg, ["func-dataCheck", "noUser"])); }

        cooldown.credit = Date.now();
        
        this.client.dataManager("update", [`credits=${(tarData.credits + 100)}`, user.id], "users");
        this.client.dataManager("update", [`cooldowns='${JSON.stringify(cooldown)}'`, msg.author.id], "users");

        return msg.channel.send(this.client.speech(msg, ["daily", "other"], [["-user", user.username], ["-credit", 100]]));
    }
};