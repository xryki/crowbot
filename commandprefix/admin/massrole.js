const { PermissionsBitField } = require('discord.js');

module.exports = {
    name: 'massrole',
    description: 'Ajoute un rôle à tous les membres du serveur',
    permissions: PermissionsBitField.Flags.ManageRoles,
    async execute(message, args, client) {
        // Vérifier si l'utilisateur a la permission de gérer les rôles - bypass pour les owners
        if (!client.isOwner(message.author.id, message.guild.id) && !message.member.permissions.has(PermissionsBitField.Flags.ManageRoles)) {
            return message.reply('Vous n\'avez pas la permission de gérer les rôles.');
        }
        
        if (!args[0]) {
            return message.reply('Veuillez spécifier un rôle à ajouter.\nUsage: `!massrole <@rôle> ou <nom du rôle>`');
        }
        
        let role = null;
        
        // Essayer de trouver par mention d'abord
        if (message.mentions.roles.first()) {
            role = message.mentions.roles.first();
        } else {
            // Sinon, rechercher par nom
            const roleName = args.join(' ').trim();
            role = message.guild.roles.cache.find(r => 
                r.name.toLowerCase() === roleName.toLowerCase() ||
                r.name.toLowerCase().includes(roleName.toLowerCase())
            );
        }
        
        if (!role) {
            return message.reply(`Rôle introuvable. Utilisez une mention @rôle ou le nom exact du rôle.`);
        }
        
        // Vérifier si le bot peut gérer ce rôle
        if (role.position >= message.guild.members.me.roles.highest.position) {
            return message.reply('Je ne peux pas ajouter ce rôle car il est plus haut que mon rôle le plus élevé.');
        }
        
        try {
            // Commencer l'ajout automatique
            await message.reply(`Ajout du rôle ${role.name} à ${message.guild.memberCount} membres en cours...`);
            
            let successCount = 0;
            let errorCount = 0;
            let skippedCount = 0;
            
            // Récupérer tous les membres
            const members = await message.guild.members.fetch();
            
            for (const member of members.values()) {
                try {
                    // Vérifier si le membre a déjà le rôle
                    if (member.roles.cache.has(role.id)) {
                        skippedCount++;
                        continue;
                    }
                    
                    // Vérifier si le bot peut gérer ce membre
                    if (!member.manageable) {
                        errorCount++;
                        continue;
                    }
                    
                    // Ajouter le rôle
                    await member.roles.add(role, 'Mass role par ' + message.author.tag);
                    successCount++;
                    
                    // Attendre un peu entre chaque ajout pour éviter les rate limits
                    await new Promise(resolve => setTimeout(resolve, 100));
                    
                } catch (error) {
                    console.error(`Erreur ajout rôle à ${member.user.tag}:`, error);
                    errorCount++;
                }
            }
            
            // Envoyer le résultat
            const resultMessage = `Mass role terminé !\n` +
                `${successCount} membres ont reçu le rôle\n` +
                `${skippedCount} membres l'avaient déjà\n` +
                `${errorCount} erreurs`;
            
            return message.reply(resultMessage);
            
        } catch (error) {
            console.error('Erreur massrole:', error);
            return message.reply('Une erreur est survenue.');
        }
    }
};
