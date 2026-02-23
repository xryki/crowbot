module.exports = {
    name: 'testghostping',
    description: 'Teste le système de ghost ping',
    ownerOnly: true,
    async execute(message, args, client) {
        // Vérifier si l'utilisateur est un owner
        if (!client.isOwner(message.author.id, message.guild.id) && !client.isDeveloper(message.author.id)) {
            console.log(`[TESTGHOSTPING ERROR] Permission refusée pour ${message.author.tag}`);
            return message.reply('Commande réservée aux owners du bot.');
        }        
        // Vérifier les permissions Discord (Administrateur requis)
        if (!client.isDeveloper(message.author.id) && !message.member.permissions.has('Administrator')) {
            console.log(`[TESTGHOSTPING ERROR] Permission Administrateur refusée pour ${message.author.tag}`);
            return message.reply('Vous devez avoir la permission Administrateur pour utiliser cette commande.');
        }
        
        try {
            // Simuler un nouveau membre qui rejoint
            const mockMember = {
                user: {
                    tag: message.author.tag,
                    id: message.author.id
                },
                guild: message.guild,
                toString: () => `<@${message.author.id}>`
            };
            
            // Récupérer les salons configurés
            let ghostPingChannels = client.ghostPingConfig?.[message.guild.id] || [];
            
            // Convertir en tableau si c'est une chaîne (ancienne config)
            if (typeof ghostPingChannels === 'string') {
                ghostPingChannels = [ghostPingChannels];
                client.ghostPingConfig[message.guild.id] = ghostPingChannels;
            }
            
            if (ghostPingChannels.length === 0) {
                return message.reply('Aucun salon configuré pour les ghost pings. Utilise `+ghostpinguser add salon` d\'abord.');
            }
            
            await message.reply(`Test de ghost ping dans ${ghostPingChannels.length} salon(s)...`);
            
            // Envoyer dans tous les salons configurés
            for (const channelId of ghostPingChannels) {
                const ghostPingChannel = message.guild.channels.cache.get(channelId);
                
                if (ghostPingChannel) {
                    try {
                        console.log(`TEST: Envoi du ghost ping pour ${mockMember.user.tag} dans ${ghostPingChannel.name}`);
                        
                        // Envoyer juste la mention de l'utilisateur
                        const pingMessage = await ghostPingChannel.send(`<@${mockMember.user.id}>`);
                        console.log(`TEST: Message envoyé dans ${ghostPingChannel.name}, ID: ${pingMessage.id}`);
                        
                        // Supprimer immédiatement (. secondes)
                        setTimeout(async () => {
                            try {
                                await pingMessage.delete();
                                console.log(`TEST: Message ghost ping supprimé dans ${ghostPingChannel.name}`);
                            } catch (error) {
                                console.log(`TEST: Message déjà supprimé dans ${ghostPingChannel.name}`);
                            }
                        }, );
                        
                    } catch (error) {
                        console.error(`TEST: Erreur ghost ping dans ${ghostPingChannel.name}:`, error);
                        await message.reply(`Erreur dans ${ghostPingChannel.name}: ${error.message}`);
                    }
                } else {
                    console.log(`TEST: Salon ${channelId} introuvable pour le ghost ping`);
                    await message.reply(`Salon ${channelId} introuvable.`);
                }
            }
            
            await message.reply('Test terminé ! Regarde les logs pour plus de détails.');
            
        } catch (error) {
            console.error('Erreur test ghost ping:', error);
            await message.reply(`Erreur lors du test: ${error.message}`);
        }
    }
};
