const { PermissionsBitField } = require('discord.js');

module.exports = {
    name: 'nick',
    description: 'Change pseudo membre',
    permissions: PermissionsBitField.Flags.ManageNicknames,
    async execute(message, args) {
        const target = message.mentions.members.first();
        if (!target) return message.reply('Mentionne quelqu\'un !');
        const nick = args.slice(1).join(' ');
        if (!nick) return message.reply('Nouveau pseudo requis !');
        await target.setNickname(nick);
        message.reply(`<@${target.id}> → ${nick}`);
    }
};
