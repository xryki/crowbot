const { PermissionsBitField } = require('discord.js');

module.exports = {
    name: 'unmuteall',
    description: 'Unmute tous les membres du serveur',
    permissions: PermissionsBitField.Flags.MuteMembers,
    async execute(message, args, client) {
        // Vérifier les permissions de l'utilisateur - bypass pour le développeur
        console.log(`[UNMUTEALL] Vérification permissions - Auteur: ${message.author.id}, Est développeur: ${client.isDeveloper ? client.isDeveloper(message.author.id) : 'FONCTION INEXISTANTE'}`);
        
        if (!client.isDeveloper(message.author.id) && !message.member.permissions.has(PermissionsBitField.Flags.MuteMembers)) {
            console.log(`[UNMUTEALL ERROR] Permission refusée pour ${message.author.tag}`);
            return message.reply('Tu n\'as pas la permission "MuteMembers" pour utiliser cette commande.');
        }
        

        const guild = message.guild;
        
        try {
            // Vérification finale des permissions du bot (même pour le développeur)
            if (!message.guild.members.me.permissions.has(PermissionsBitField.Flags.ModerateMembers) || 
                !message.guild.members.me.permissions.has(PermissionsBitField.Flags.ManageRoles)) {
                console.log(`[UNMUTEALL ERROR] Le bot n'a pas les permissions nécessaires (Moderate Members et/ou Manage Roles) dans ce serveur`);
                console.log(`[UNMUTEALL DEBUG] Permissions bot: ModerateMembers=${message.guild.members.me.permissions.has(PermissionsBitField.Flags.ModerateMembers)}, ManageRoles=${message.guild.members.me.permissions.has(PermissionsBitField.Flags.ManageRoles)}`);
                return;
            }
            
            // Récupérer tous les membres du serveur
            const allMembers = guild.members.cache;
            
            // Compter les membres actuellement mute dans le chat (timeout)
            const mutedMembers = allMembers.filter(member => 
                member.communicationDisabledUntil
            );
            
            // Unmute tous les membres directement
            for (const [memberId, member] of mutedMembers) {
                try {
                    // Unmute timeout du chat
                    await member.disableCommunicationUntil(null, 'Unmute all - Commande admin');
                } catch (error) {
                    console.error(`Erreur unmute ${memberId}:`, error);
                }
            }
            
            // Message de résultat unique avec auto-suppression
            const resultMessage = await message.channel.send('plus personne n\'est **timeout**');
            setTimeout(() => {
                resultMessage.delete().catch(() => {});
            }, );
            
        } catch (error) {
            console.error('Erreur commande unmuteall:', error);
        }
    }
};
