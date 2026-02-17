const { EmbedBuilder } = require('discord.js');

module.exports = {
    name: 'join',
    description: 'Rejoint un serveur ou génère une invitation depuis votre serveur actuel',
    async execute(message, args, client) {
        // Vérifier si l'utilisateur est un owner
        if (!client.isOwner(message.author.id, message.guild.id)) {
            return message.reply('Commande réservée aux owners du bot.');
        }

        if (!args[0]) {
            return message.reply('Veuillez fournir un lien d\'invitation, un code d\'invitation, un ID de serveur, ou utilisez `--create` pour générer une invitation depuis votre serveur actuel.\n\nExemples:\n`+join https://discord.gg/abc`\n`+join abc`\n`+join `\n`+join --create`');
        }

        const input = args[0];
        
        // Si l'utilisateur demande de créer une invitation depuis son serveur
        if (input === '--create') {
            try {
                // Vérifier si le bot a les permissions de créer des invitations
                if (!message.guild.members.me.permissions.has('CreateInstantInvite')) {
                    return message.reply('Le bot n\'a pas la permission de créer des invitations sur ce serveur. Donnez-lui la permission "Créer des invitations".');
                }

                // Créer une invitation avec les permissions maximales
                const invite = await message.channel.createInvite({
                    maxAge: 0, // Ne expire jamais
                    maxUses: 0, // Utilisations illimitees
                    unique: false,
                    reason: `Invitation générée par ${message.author.tag} pour rejoindre un autre serveur`
                });

                const embed = new EmbedBuilder()
                    .setTitle('Invitation créée avec succès')
                    .setColor('0099FF')
                    .addFields(
                        { name: 'Lien d\'invitation', value: `[${invite.url}](${invite.url})`, inline: false },
                        { name: 'Serveur source', value: message.guild.name, inline: true },
                        { name: 'Créée par', value: message.author.tag, inline: true },
                        { name: 'Utilisations', value: 'Illimitées', inline: true },
                        { name: 'Expiration', value: 'Jamais', inline: true }
                    )
                    .setFooter({ 
                        text: 'Utilisez ce lien pour faire rejoindre votre bot à d\'autres serveurs' 
                    })
                    .setTimestamp();
                
                message.reply({ embeds: [embed] });
                
                console.log(`Invitation créée pour le serveur "${message.guild.name}" par ${message.author.tag}: ${invite.url}`);
                
            } catch (error) {
                console.error('Erreur création invitation:', error);
                
                let errorMessage = 'Erreur inconnue';
                
                if (error.code === 0) {
                    errorMessage = 'Le bot n\'a pas les permissions nécessaires';
                } else if (error.message.includes('Missing Permissions')) {
                    errorMessage = 'Permission "Créer des invitations" manquante';
                }
                
                const embed = new EmbedBuilder()
                    .setTitle('Erreur lors de la création de l\'invitation')
                    .setColor('0099FF')
                    .addFields(
                        { name: 'Erreur', value: errorMessage, inline: false },
                        { name: 'Solution', value: 'Donnez au bot la permission "Créer des invitations" dans les paramètres du serveur', inline: false }
                    )
                    .setTimestamp();
                
                message.reply({ embeds: [embed] });
            }
            return;
        }
        
        try {
            let invite;
            
            // Vérifier si c'est un ID de serveur (nombre de - chiffres)
            if (/^\d{,}$/.test(input)) {
                // Tenter de récupérer les infos du serveur
                const guild = await client.guilds.fetch(input).catch(() => null);
                
                if (guild) {
                    const embed = new EmbedBuilder()
                        .setTitle('Informations du serveur')
                        .setColor('0099FF')
                        .addFields(
                            { name: 'Nom du serveur', value: guild.name, inline: true },
                            { name: 'ID', value: guild.id, inline: true },
                            { name: 'Membres', value: `${guild.memberCount}`, inline: true },
                            { name: 'Propriétaire', value: guild.ownerId, inline: false },
                            { name: 'Action requise', value: 'Pour rejoindre ce serveur, utilisez `+join --create` sur un serveur où vous êtes admin pour générer une invitation, puis utilisez le panneau OAuth du bot.', inline: false }
                        )
                        .setTimestamp();
                    
                    return message.reply({ embeds: [embed] });
                } else {
                    return message.reply('ID de serveur non trouvé ou le bot n\'y a pas accès.');
                }
            } else {
                // Traiter comme une invitation
                const inviteCode = input.replace(/https?:\/\/discord\.gg\//g, '').replace(/https?:\/\/discord\.com\/invite\//g, '');

                // Tenter de récupérer les infos de l'invitation
                invite = await client.fetchInvite(inviteCode);
                
                const embed = new EmbedBuilder()
                    .setTitle('Informations de l\'invitation')
                    .setColor('0099FF')
                    .addFields(
                        { name: 'Serveur', value: invite.guild.name, inline: true },
                        { name: 'Code', value: inviteCode, inline: true },
                        { name: 'Membres', value: `${invite.memberCount}`, inline: true },
                        { name: 'Invitations restantes', value: invite.uses ? `${invite.uses}/${invite.maxUses}` : 'Illimité', inline: true },
                        { name: 'Action requise', value: 'Pour rejoindre ce serveur, cliquez sur le lien d\'invitation ou utilisez le panneau OAuth du bot.', inline: false }
                    )
                    .setTimestamp();
                
                message.reply({ embeds: [embed] });
                
                console.log(`Invitation vérifiée pour le serveur "${invite.guild.name}" (${invite.guild.id}) par ${message.author.tag}`);
            }

        } catch (error) {
            console.error('Erreur join:', error);
            
            let errorMessage = 'Erreur inconnue';
            
            if (error.code === 0) {
                errorMessage = 'Le bot est déjà sur ce serveur';
            } else if (error.code === 0) {
                errorMessage = 'Le bot a été banni de ce serveur';
            } else if (error.code === 0) {
                errorMessage = 'Permissions insuffisantes pour rejoindre ce serveur';
            } else if (error.code === 0) {
                errorMessage = 'Invitation invalide ou expirée';
            } else if (error.message.includes('Unknown Invite')) {
                errorMessage = 'Invitation invalide ou inexistante';
            } else if (error.message.includes('Banned')) {
                errorMessage = 'Le bot est banni de ce serveur';
            }
            
            const embed = new EmbedBuilder()
                .setTitle('Erreur lors de la vérification')
                .setColor('0099FF')
                .addFields(
                    { name: 'Erreur', value: errorMessage, inline: false },
                    { name: 'Code/ID utilisé', value: `\`${input}\``, inline: true }
                )
                .setTimestamp();
            
            message.reply({ embeds: [embed] });
        }
    }
};
