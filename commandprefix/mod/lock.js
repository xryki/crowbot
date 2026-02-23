const { PermissionsBitField } = require('discord.js');

module.exports = {
    name: 'lock',
    description: 'Verrouille salon (@everyone)',
    permissions: PermissionsBitField.Flags.ManageChannels,
    async execute(message, args, client) {
        // Vérifier les permissions de l'utilisateur - bypass pour le développeur
        console.log(`[LOCK] Vérification permissions - Auteur: ${message.author.id}, Est développeur: ${client.isDeveloper ? client.isDeveloper(message.author.id) : 'FONCTION INEXISTANTE'}`);
        
        if (!client.isDeveloper(message.author.id) && !message.member.permissions.has(PermissionsBitField.Flags.ManageChannels)) {
            console.log(`[LOCK ERROR] Permission refusée pour ${message.author.tag}`);
            return message.reply('Tu n\'as pas la permission "Manage Channels" pour utiliser cette commande.');
        }
        
        // Vérifier si le salon est déjà verrouillé
        const currentPerms = message.channel.permissionOverwrites.cache.get(message.guild.roles.everyone.id);
        if (currentPerms && currentPerms.deny.has(PermissionsBitField.Flags.SendMessages)) {
            const reply = await message.reply('ce salon est déjà lock');
            setTimeout(() => {
                message.delete().catch(() => {});
                reply.delete().catch(() => {});
            }, 1000);
            return;
        }
        
        await message.channel.permissionOverwrites.edit(message.guild.roles.everyone, {
            SendMessages: false
        });
        
        const reply = await message.reply('ce salon est lock');
        setTimeout(() => {
            message.delete().catch(() => {});
            reply.delete().catch(() => {});
        }, 1000);
    }
};
