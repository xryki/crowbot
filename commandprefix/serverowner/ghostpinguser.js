module.exports = {
    name: 'ghostpinguser',
    description: 'Configure les salons pour les ghost pings automatiques',
    ownerOnly: true,
    async execute(message, args, client) {
        // Vérifier si l'utilisateur est un owner
        if (!client.isOwner(message.author.id, message.guild.id)) {
            return message.reply('Commande réservée aux owners du bot.');
        }        
        // Vérifier les permissions Discord (Administrateur requis)
        if (!message.member.permissions.has('Administrator')) {
            return message.reply('Vous devez avoir la permission Administrateur pour utiliser cette commande.');
        }
        
        const subcommand = args[0]?.toLowerCase();
        
        if (!subcommand) {
            // Afficher les salons actuels
            let currentChannels = client.ghostPingConfig?.[message.guild.id];
            
            // Convertir en tableau si c'est une chaîne (ancienne config)
            if (typeof currentChannels === 'string') {
                currentChannels = [currentChannels];
                client.ghostPingConfig[message.guild.id] = currentChannels;
            }
            
            currentChannels = currentChannels || [];
            
            if (currentChannels.length > 0) {
                const channelNames = currentChannels.map(channelId => {
                    const channel = message.guild.channels.cache.get(channelId);
                    return channel ? channel.toString() : `${channelId} (introuvable)`;
                }).join(', ');
                return message.reply(`Salons actuels pour les ghost pings: ${channelNames}`);
            } else {
                return message.reply('Aucun salon configuré. Usage: `+ghostpinguser add salon` ou `+ghostpinguser remove salon`');
            }
        }
        
        if (subcommand === 'add') {
            const targetChannel = message.mentions.channels.first();
            if (!targetChannel) {
                return message.reply('Mentionne un salon à ajouter.');
            }
            
            // Initialiser la config si nécessaire
            if (!client.ghostPingConfig) {
                client.ghostPingConfig = {};
            }
            
            let currentChannels = client.ghostPingConfig[message.guild.id];
            
            // Convertir en tableau si c'est une chaîne (ancienne config)
            if (typeof currentChannels === 'string') {
                currentChannels = [currentChannels];
                client.ghostPingConfig[message.guild.id] = currentChannels;
            }
            
            if (!currentChannels) {
                currentChannels = [];
                client.ghostPingConfig[message.guild.id] = currentChannels;
            }
            
            // Vérifier si le salon est déjà configuré
            if (currentChannels.includes(targetChannel.id)) {
                return message.reply('Ce salon est déjà configuré pour les ghost pings.');
            }
            
            // Ajouter le salon
            currentChannels.push(targetChannel.id);
            
            // Sauvegarder automatiquement
            client.saveData();
            
            await message.reply(`Salon ajouté pour les ghost pings: ${targetChannel}`);
            
        } else if (subcommand === 'remove') {
            const targetChannel = message.mentions.channels.first();
            if (!targetChannel) {
                return message.reply('Mentionne un salon à retirer.');
            }
            
            let currentChannels = client.ghostPingConfig?.[message.guild.id];
            
            // Convertir en tableau si c'est une chaîne (ancienne config)
            if (typeof currentChannels === 'string') {
                currentChannels = [currentChannels];
                client.ghostPingConfig[message.guild.id] = currentChannels;
            }
            
            if (!currentChannels || currentChannels.length === 0) {
                return message.reply('Aucun salon configuré pour ce serveur.');
            }
            
            // Retirer le salon
            const index = currentChannels.indexOf(targetChannel.id);
            if (index === -1) {
                return message.reply('Ce salon n\'est pas configuré pour les ghost pings.');
            }
            
            currentChannels.splice(index, 1);
            
            // Sauvegarder automatiquement
            client.saveData();
            
            await message.reply(`Salon retiré des ghost pings: ${targetChannel}`);
            
        } else if (subcommand === 'clear') {
            // Vider tous les salons pour ce serveur
            if (client.ghostPingConfig) {
                client.ghostPingConfig[message.guild.id] = [];
                
                // Sauvegarder automatiquement
                client.saveData();
            }
            
            await message.reply('Tous les salons de ghost pings ont été retirés pour ce serveur.');
            
        } else {
            return message.reply('Usage: `+ghostpinguser add salon` | `+ghostpinguser remove salon` | `+ghostpinguser clear`');
        }
    }
};
