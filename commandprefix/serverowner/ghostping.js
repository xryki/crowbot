module.exports = {
    name: 'ghostping',
    description: 'Envoie un faux ping everyone qui se supprime automatiquement',
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
        
        try {
            // Supprimer le message de commande pour plus de discrétion
            try {
                await message.delete();
            } catch (error) {
                // Ignorer si le message est déjà supprimé
            }
            
            // Créer le message avec everyone
            const ghostMessage = await message.channel.send('@everyone');
            
            // Attendre un peu pour l'effet
            setTimeout(async () => {
                try {
                    await ghostMessage.delete();
                } catch (error) {
                    // Le message a déjà été supprimé
                    console.log('Message ghost ping déjà supprimé');
                }
            }, ); // Supprimer après  seconde

            // Envoyer un message de confirmation en MP
            try {
                await message.author.send('Ghost ping envoyé avec succès');
            } catch (error) {
                // Si les MP sont désactivés, pas grave
                console.log('Impossible d\'envoyer la confirmation en MP');
            }

        } catch (error) {
            console.error('Erreur ghost ping:', error);
            try {
                await message.reply('Une erreur est survenue lors de l\'envoi du ghost ping.');
            } catch (replyError) {
                console.log('Impossible de répondre à l\'utilisateur:', replyError);
            }
        }
    }
};
