const fs = require('fs');

module.exports = {
    name: 'deletebackup',
    description: 'Supprime une sauvegarde spécifique',
    ownerOnly: true,
    async execute(message, args, client) {
        const prefix = client.getPrefix(message.guild.id);
        
        // Vérifier si l'utilisateur est un owner
        if (!client.isOwner(message.author.id, message.guild.id)) {
            return message.reply('Commande réservée aux owners du bot.');
        }        
        // Vérifier les permissions Discord (Administrateur requis)
        if (!message.member.permissions.has('Administrator')) {
            return message.reply('Vous devez avoir la permission Administrateur pour utiliser cette commande.');
        }
        
        const guild = message.guild;
        
        if (!args[0]) {
            // Lister les sauvegardes disponibles
            const backupDir = './backups';
            if (!fs.existsSync(backupDir)) {
                return message.reply('Aucune sauvegarde trouvée.');
            }

            const files = fs.readdirSync(backupDir).filter(file => file.endsWith('.json'));
            if (files.length === 0) {
                return message.reply('Aucune sauvegarde trouvée.');
            }

            let response = '';
            
            for (const file of files) {
                const filePath = `${backupDir}/${file}`;
                const backupData = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
                
                response += `${file}\n`;
                response += `Nom: ${backupData.customName || backupData.serverInfo.name}\n`;
                response += `ID: ${backupData.timestamp}\n`;
                response += `Date: ${new Date(backupData.timestamp).toLocaleString('fr-FR')}\n`;
                response += `Serveur: ${backupData.serverInfo.name}\n`;
                response += '\n';
            }

            response += `Pour supprimer: ${client.getPrefix(guild.id)}deletebackup <fichier>`;

            if (response.length > 2000) {
                fs.writeFileSync('./backups_list.txt', response);
                await message.reply('Liste des sauvegardes (liste trop longue, voir fichier attaché):', {
                    files: ['./backups_list.txt']
                });
            } else {
                await message.reply(response);
            }
            return;
        }

        // Tenter de supprimer la sauvegarde
        const backupIdentifier = args[0];
        const backupDir = './backups';
        
        let backupFile = null;
        
        // Chercher par nom de fichier
        if (backupIdentifier.endsWith('.json')) {
            if (fs.existsSync(`${backupDir}/${backupIdentifier}`)) {
                backupFile = `${backupDir}/${backupIdentifier}`;
            }
        } else {
            // Chercher par timestamp
            const files = fs.readdirSync(backupDir).filter(file => file.endsWith('.json'));
            for (const file of files) {
                const filePath = `${backupDir}/${file}`;
                const backupData = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
                if (backupData.timestamp === backupIdentifier) {
                    backupFile = filePath;
                    break;
                }
            }
        }

        if (!backupFile) {
            return message.reply(`Sauvegarde introuvable. Utilise \`${prefix}deletebackup\` pour voir la liste des sauvegardes.`);
        }

        try {
            // Récupérer les infos de la backup pour l'afficher
            const backupData = JSON.parse(fs.readFileSync(backupFile, 'utf-8'));
            
            // Demander confirmation
            await message.reply(`Êtes-vous sûr de vouloir supprimer cette sauvegarde ?\n\nNom: ${backupData.customName || backupData.serverInfo.name}\nServeur: ${backupData.serverInfo.name}\nDate: ${new Date(backupData.timestamp).toLocaleString('fr-FR')}\n\nRépondez \`oui\` pour confirmer.`);
            
            const confirmation = await message.channel.awaitMessages({
                max: 1,
                time: 60000,
                errors: ['time']
            }).then(collected => {
                const msg = collected.first();
                return msg.content.toLowerCase();
            }).catch(() => 'non');

            if (!confirmation.includes('oui')) {
                return message.reply('Suppression annulée.');
            }

            // Supprimer le fichier
            fs.unlinkSync(backupFile);
            
            await message.reply(`La sauvegarde ${backupData.customName || backupData.serverInfo.name} a été supprimée avec succès.`);

        } catch (error) {
            console.error('Erreur lors de la suppression:', error);
            await message.reply('Une erreur est survenue lors de la suppression de la sauvegarde.');
        }
    }
};
