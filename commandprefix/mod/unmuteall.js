const { PermissionsBitField } = require('discord.js');

module.exports = {
    name: 'unmuteall',
    description: 'Unmute tous les membres du serveur',
    permissions: PermissionsBitField.Flags.MuteMembers,
    async execute(message, args, client) {
        const guild = message.guild;
        
        try {
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
            }, 3000);
            
        } catch (error) {
            console.error('Erreur commande unmuteall:', error);
        }
    }
};
