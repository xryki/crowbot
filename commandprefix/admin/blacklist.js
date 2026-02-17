module.exports = {
    name: 'bl',
    description: 'Ajoute/retire utilisateur blacklist avec ban automatique',
    ownerOnly: true,
    async execute(message, args, client) {
        // Vérifier si l'utilisateur est un owner
        if (!client.isOwner(message.author.id, message.guild.id)) {
            return message.reply('Commande réservée aux owners du bot.');
        }
        
        client.blacklist = client.blacklist || [];
        
        let target;
        let targetId;
        
        // Vérifier si c'est une mention ou un ID
        if (message.mentions.users.first()) {
            target = message.mentions.users.first();
            targetId = target.id;
        } else if (args[0] && /^\d+$/.test(args[0])) {
            // C'est un ID numérique
            targetId = args[0];
            try {
                target = await client.users.fetch(targetId);
            } catch (error) {
                target = null;
            }
        } else {
            return message.reply('Mentionne un utilisateur ou donne un ID valide !');
        }
        
        if (client.blacklist.includes(targetId)) {
            // Retirer de la blacklist
            client.blacklist = client.blacklist.filter(id => id !== targetId);
            const targetName = target ? target.tag : `Utilisateur ${targetId}`;
            message.reply(`${targetName} retiré de la blacklist.`);
        } else {
            // Ajouter à la blacklist ET bannir
            client.blacklist.push(targetId);
            const targetName = target ? target.tag : `Utilisateur ${targetId}`;
            
            // Bannir l'utilisateur du serveur si possible
            try {
                if (message.guild) {
                    const member = await message.guild.members.fetch(targetId).catch(() => null);
                    if (member) {
                        await member.ban({ 
                            reason: `Blacklist par ${message.author.tag}` 
                        });
                        message.reply(`${targetName} ajouté à la blacklist et banni du serveur.`);
                    } else {
                        message.reply(`${targetName} ajouté à la blacklist (utilisateur pas sur le serveur).`);
                    }
                } else {
                    message.reply(`${targetName} ajouté à la blacklist.`);
                }
            } catch (banError) {
                console.error('Erreur lors du ban:', banError);
                message.reply(`${targetName} ajouté à la blacklist mais erreur lors du ban: ${banError.message}`);
            }
        }
        
        // Sauvegarder automatiquement
        client.saveData();
    }
};
