const { PermissionsBitField } = require('discord.js');

module.exports = {
    name: 'unlock',
    description: 'Déverrouille salon',
    permissions: PermissionsBitField.Flags.ManageChannels,
    async execute(message, args, client) {
        // Vérifier les permissions de l'utilisateur - bypass pour le développeur
        console.log(`[UNLOCK] Vérification permissions - Auteur: ${message.author.id}, Est développeur: ${client.isDeveloper ? client.isDeveloper(message.author.id) : 'FONCTION INEXISTANTE'}`);
        
        if (!client.isDeveloper(message.author.id) && !message.member.permissions.has(PermissionsBitField.Flags.ManageChannels)) {
            console.log(`[UNLOCK ERROR] Permission refusée pour ${message.author.tag}`);
            return message.reply('Tu n\'as pas la permission "ManageChannels" pour utiliser cette commande.');
        }
        

        // Vérifier si le salon est déjà déverrouillé
        const currentPerms = message.channel.permissionOverwrites.cache.get(message.guild.roles.everyone.id);
        if (!currentPerms || !currentPerms.deny.has(PermissionsBitField.Flags.SendMessages)) {
            const reply = await message.reply('ce salon n\'est pas lock');
            setTimeout(() => {
                message.delete().catch(() => {});
                reply.delete().catch(() => {});
            }, 1000);
            return;
        }
        
        await message.channel.permissionOverwrites.edit(message.guild.roles.everyone, {
            SendMessages: null
        });
        
        const reply = await message.reply('ce salon est unlock');
        setTimeout(() => {
            message.delete().catch(() => {});
            reply.delete().catch(() => {});
        }, 1000);
    }
};
