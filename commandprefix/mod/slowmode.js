const { PermissionsBitField } = require('discord.js');

module.exports = {
    name: 'slowmode',
    description: 'Définit le mode lent du salon (délai entre les messages)',
    permissions: PermissionsBitField.Flags.ManageChannels,
    async execute(message, args, client) {
        // Si aucun argument, afficher le slowmode actuel
        if (!args[0]) {
            const currentSlowmode = message.channel.rateLimitPerUser;
            if (currentSlowmode === 0) {
                return client.autoDeleteMessage(message.channel, 'Le slowmode est actuellement désactivé.');
            } else {
                return client.autoDeleteMessage(message.channel, `Le slowmode est actuellement de ${currentSlowmode} secondes.`);
            }
        }
        
        // Si l'argument est "off" ou "disable", désactiver le slowmode
        if (args[0].toLowerCase() === 'off' || args[0].toLowerCase() === 'disable') {
            try {
                await message.channel.setRateLimitPerUser(0);
                await client.autoDeleteMessage(message.channel, 'Le slowmode a été désactivé.');
            } catch (error) {
                console.error('Erreur désactivation slowmode:', error);
                await client.autoDeleteMessage(message.channel, 'Une erreur est survenue lors de la désactivation du slowmode.');
            }
            return;
        }
        
        // Vérifier si l'argument est un nombre valide
        const time = parseInt(args[0]);
        if (isNaN(time) || time < 0) {
            return client.autoDeleteMessage(message.channel, `Usage: ${client.getPrefix(message.guild.id)}slowmode [secondes|off]\nExemples: ${client.getPrefix(message.guild.id)}slowmode 5, ${client.getPrefix(message.guild.id)}slowmode off`);
        }
        
        // Vérifier les limites de Discord (max 6 heures = 21600 secondes)
        if (time > 21600) {
            return client.autoDeleteMessage(message.channel, 'Le slowmode ne peut pas dépasser 21600 secondes (6 heures).');
        }
        
        try {
            await message.channel.setRateLimitPerUser(time);
            
            let timeText;
            if (time === 0) {
                timeText = 'désactivé';
            } else if (time < 60) {
                timeText = `${time} secondes`;
            } else if (time < 3600) {
                const minutes = Math.floor(time / 60);
                const seconds = time % 60;
                timeText = seconds > 0 ? `${minutes} minute${minutes > 1 ? 's' : ''} et ${seconds} seconde${seconds > 1 ? 's' : ''}` : `${minutes} minute${minutes > 1 ? 's' : ''}`;
            } else {
                const hours = Math.floor(time / 3600);
                const minutes = Math.floor((time % 3600) / 60);
                timeText = minutes > 0 ? `${hours} heure${hours > 1 ? 's' : ''} et ${minutes} minute${minutes > 1 ? 's' : ''}` : `${hours} heure${hours > 1 ? 's' : ''}`;
            }
            
            await client.autoDeleteMessage(message.channel, `Le slowmode a été défini sur ${timeText}.`);
            
        } catch (error) {
            console.error('Erreur slowmode:', error);
            await client.autoDeleteMessage(message.channel, 'Une erreur est survenue lors de la définition du slowmode.');
        }
    }
};