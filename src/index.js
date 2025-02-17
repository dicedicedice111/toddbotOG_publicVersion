const { Client, PermissionsBitField,  IntentsBitField, SlashCommandBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder } = require('discord.js');

const Den = new Date().getDate();
const Mesic = new Date().getMonth();

const fs = require('fs');
const path = require('path');

const prayEmoji = ':pray1:';

let database = {};

const databaseFile = 'database.json';

const databasePath = path.join(__dirname, 'database.json');

const ALLOWED_CHANNEL_ID = '1087019491885592607';

const { REST } = require('@discordjs/rest');
const { Routes } = require('discord-api-types/v9');

const randomResponses = [
    "https://cdn.discordapp.com/attachments/866981897702473739/1277978744962814070/Todd-Howard-2.png?ex=66cf21f4&is=66cdd074&hm=939b893b7758f2d714d0bafa6569dc6e2645ab9804bfe70f2415df621fe7d9ae&",
    "https://cdn.discordapp.com/attachments/866981897702473739/1277978783680303244/MV5BMGRmZDhhMDgtYTAwNy00MTIzLTk5MzYtNzdlY2U4N2NlZTVkXkEyXkFqcGdeQXVyMTYyNjg2MzUz.png?ex=66cf21fd&is=66cdd07d&hm=b4bd8bf014d14d8253df986a3c14d6d293e839288976144c7ee478200d6c4853&",
    "https://cdn.discordapp.com/attachments/866981897702473739/1277978833089200249/1049580-todd24.png?ex=66cf2209&is=66cdd089&hm=4a5932d6522cdee98d4ef953b7ece198f82a242eda79175e2945f03dc57964a8&of ",

];


const client = new Client({
    intents: [
        IntentsBitField.Flags.Guilds,
        IntentsBitField.Flags.GuildMembers,
        IntentsBitField.Flags.GuildMessages,
        IntentsBitField.Flags.MessageContent,

    ],
});

/*client.on('ready', (c) => {
    console.log(`${c.user.tag} is online.`);
    loadDatabase();
    client.application.commands.fetch()
    .then(commands => console.log(`Registered commands: ${commands.map(c => c.name).join(', ')}`))
    .catch(console.error);

}
)*/


client.login("SEM VLOŽ TOKEN BOTA");


client.on('ready', async () => {
    console.log(`Logged in as ${client.user.tag}!`);
    loadDatabase();
    const rest = new REST({ version: '9' }).setToken(client.token);

    try {
        const streakLeaderboardCommand = new SlashCommandBuilder()
        .setName('streak-leaderboard')
        .setDescription('Ukaž leaderboard nejdelšího modlení streaku');

        const totalPrayersLeaderboardCommand = new SlashCommandBuilder()
        .setName('total-prayers-leaderboard')
        .setDescription('Ukaž leaderboard celkového množství modlení');

        const boziSlovoCommand = new SlashCommandBuilder()
        .setName('bozi-slovo')
        .setDescription('Obdrž náhodné Toddovo slovo');

        const mojeStatyCommand = new SlashCommandBuilder()
        .setName('moje-staty')
        .setDescription('Jak jsem na tom');

        const newCommands = [
            streakLeaderboardCommand,
            totalPrayersLeaderboardCommand,
            boziSlovoCommand,
            //skyrimCommand
        ];

        await client.application.commands.create(streakLeaderboardCommand);
        await client.application.commands.create(totalPrayersLeaderboardCommand);
        await client.application.commands.create(boziSlovoCommand);
        await client.application.commands.create(mojeStatyCommand);
        //await client.application.commands.create(skyrimCommand);

        console.log('Fetching existing commands...');
        const existingCommands = await rest.get(Routes.applicationCommands(client.user.id));
        console.log(`Registered commands: ${existingCommands.map(cmd => cmd.name).join(', ')}`);

    } catch (error) {
        console.error('Error managing application (/) commands:', error);
    }
    
});

client.on('interactionCreate', async interaction => {
    if (!interaction.isCommand()) return;

    try {
        if (await isRateLimited(interaction, true)) {
            return;
        }
    } catch (error) {
        console.error('Error handling interaction:', error);
        await interaction.reply({ content: 'Nastala chyba při zpracování příkazu.', ephemeral: true }).catch(console.error);
    }
    
    try {
        if (interaction.commandName === 'streak-leaderboard') {
            await handleLeaderboard(interaction, 'currentStreak', 'Nejdelší modlení streak');
        } else if (interaction.commandName === 'total-prayers-leaderboard') {
            await handleLeaderboard(interaction, 'totalPrayers', 'Celkové množství modlení');
        } else if (interaction.commandName === 'bozi-slovo') {
            const response = getRandomResponse();
            await interaction.reply(response || 'Žádné Boží slovo není k dispozici.');
        } else if (interaction.commandName === 'moje-staty') {
            await handleMyStats(interaction);
        } else {
            await interaction.reply({ content: 'Neznámý příkaz.', ephemeral: true });
        }

    } catch (error) {
        console.error('Error handling interaction:', error);
        await interaction.reply({ content: 'Nastala chyba při zpracování příkazu.', ephemeral: true }).catch(console.error);
    }
});


async function handlePrayCount(interaction) {
    const userId = interaction.user.id;
    const userProfile = getUserProfile(userId);

    const embed = new EmbedBuilder()
        .setColor('#0099ff')
        .setTitle('Počet modlení')
        .setDescription(`You have ${userProfile.totalPrayers} prays.`);

    const buyButton = new ButtonBuilder()
        .setCustomId('buy-skyrim')
        .setLabel('Kup si skyrim')
        .setStyle(ButtonStyle.Primary)
        .setDisabled(userProfile.totalPrayers < 20);

    const row = new ActionRowBuilder().addComponents(buyButton);

    await interaction.reply({ embeds: [embed], components: [row] });
}

function updateUserProfile(userId, userProfile) {
    //
}

function getUserProfile(userId) {

}


function getRandomResponse() {
    return randomResponses[Math.floor(Math.random() * randomResponses.length)];
}

async function isRateLimited(context, isCommand = false) {
    const now = Date.now();
    const userId = context.author ? context.author.id : context.user.id;
    const rateLimits = isCommand ? commandRateLimits : messageRateLimits;
    const maxAllowed = isCommand ? MAX_COMMANDS : MAX_MESSAGES;

    const userRateLimit = rateLimits.get(userId) || { count: 0, resetTime: now + RATE_LIMIT_DURATION };

    if (now > userRateLimit.resetTime) {
        userRateLimit.count = 1;
        userRateLimit.resetTime = now + RATE_LIMIT_DURATION;
    } else {
        userRateLimit.count++;
    }

    rateLimits.set(userId, userRateLimit);

    if (userRateLimit.count > maxAllowed) {
        try {
            const guild = context.guild;
            const member = context.member || (await guild?.members.fetch(userId).catch(() => null));
            const channel = context.channel;

            if (guild && member && channel) {
                const botPermissions = channel.permissionsFor(guild.members.me);
                if (!botPermissions || !botPermissions.has(PermissionsBitField.Flags.ModerateMembers)) {
                    console.log("Bot doesn't have permission to timeout members");
                    return true;
                }

                // Timeout the user for 1 minute
                await member.timeout(RATE_LIMIT_DURATION, 'Rate limit exceeded');
                const replyContent = isCommand 
                    ? "Přestaň spamovat příkazy. Byl jsi ztišen na 1 minutu."
                    : "Přestaň spamovat. Byl jsi ztišen na 1 minutu.";
                
                if (context.reply) {
                    await context.reply({ content: replyContent, ephemeral: true });
                } else {
                    await channel.send(replyContent);
                }
                
                await channel.send("@icedman Najdi ho zmrda");
                console.log(`User ${member.user.username} (${userId}) has been muted for 1 minute due to rate limiting.`);
            } else {
                console.log("Unable to timeout user: not in a guild or member not available");
                if (context.reply) {
                    await context.reply({ content: "Přestaň spamovat.", ephemeral: true });
                } else {
                    await channel.send("Přestaň spamovat.");
                }
            }
        } catch (error) {
            console.error('Error while trying to timeout user:', error);
            if (context.reply) {
                await context.reply({ content: "Přestaň spamovat.", ephemeral: true });
            } else {
                await context.channel.send("Přestaň spamovat.");
            }
        }
        return true;
    }

    return false;
}

async function handleLeaderboard(interaction, sortKey, title) {
    try {
        const database = loadDatabase();
        const allUsers = Object.values(database)
            .filter(user => user[sortKey] > 0)
            .sort((a, b) => b[sortKey] - a[sortKey]);

        if (allUsers.length === 0) {
            return await interaction.reply('Bez dat. Začni se modlit, ty BEZVĚRČE!');
        }

        const embed = new EmbedBuilder()
            .setColor('#0099ff')
            .setTitle(`🏆 ${title} 🏆`)
            .setDescription('10 příček modličů')
            .setTimestamp()
            .setFooter({ text: 'Nyní', iconURL: interaction.client.user.displayAvatarURL() });

        let leaderboardField = '';
        let previousScore = null;
        let displayedLines = 0;
        let userNames = [];

        for (const user of allUsers) {
            if (displayedLines >= 10) break;

            if (user[sortKey] !== previousScore) {
                if (userNames.length > 0) {
                    leaderboardField += `🏅 ${displayedLines + 1}. - 🙏 ${previousScore} - ${userNames.join(', ')}\n`;
                    displayedLines++;
                }
                userNames = [];
                previousScore = user[sortKey];
            }

            const isCurrentUser = user.userId === interaction.user.id;
            userNames.push(isCurrentUser ? `**${user.username}**` : user.username);
        }

        // 
        if (userNames.length > 0 && displayedLines < 10) {
            leaderboardField += `🏅 ${displayedLines + 1}. - 🙏 ${previousScore} - ${userNames.join(', ')}`;
        }

        embed.addFields({ name: 'Leaderboard', value: leaderboardField || 'chyba chyba chyba' });

        // jestli je v top 15
        const userScore = allUsers.find(user => user.userId === interaction.user.id)?.[sortKey];
        const userPosition = allUsers.filter(user => user[sortKey] > userScore).length + 1;
        if (userPosition > 10) {
            const user = allUsers.find(user => user.userId === interaction.user.id);
            embed.addFields({ name: 'Tvá pozice', value: `🏅 ${userPosition}. - 🙏 ${user[sortKey]} - **${user.username}**` });
        }

        // staty
        const totalPlayers = allUsers.length;
        const totalScore = allUsers.reduce((sum, user) => sum + user[sortKey], 0);
        embed.addFields(
            { name: 'Počet modličů', value: totalPlayers.toString(), inline: true },
            { name: 'Celkové modleníčka', value: totalScore.toString(), inline: true }
        );

        await interaction.reply({ embeds: [embed] });
    } catch (error) {
        console.error('Error in handleLeaderboard:', error);
        await interaction.reply('chyba chyba chyba... pohoda...');
    }
}


async function handleMyStats(interaction) {
    try {
        const userId = interaction.user.id;
        const database = loadDatabase();
        const userProfile = Object.values(database).find(user => user.userId === userId);

        if (!userProfile) {
            return await interaction.reply('Nemáš zatím žádné statistiky. Začni se modlit!');
        }

        const allUsers = Object.values(database);

        // Total
        const totalPrayersRanking = allUsers.filter(user => user.totalPrayers > userProfile.totalPrayers).length + 1;

        // Daily
        const streakRanking = allUsers.filter(user => user.currentStreak > userProfile.currentStreak).length + 1;

        // Cooldown 
        const now = Date.now();
        const cooldownEnd = userProfile.lastPrayTimestamp + 3600000; 
        const cooldownRemaining = Math.max(0, cooldownEnd - now);
        const cooldownMinutes = Math.ceil(cooldownRemaining / 60000);

        // Prays today 
        const today = new Date().toISOString().split('T')[0];
        const prayersToday = userProfile.prayDates ? userProfile.prayDates.filter(date => date.startsWith(today)).length : 0;

        // Fire emoji kalkulace
        const fireEmojis = '🔥'.repeat(Math.floor(userProfile.currentStreak / 3));

        const embed = new EmbedBuilder()
            .setColor('#0099ff')
            .setTitle(`Statistiky modlení pro ${interaction.user.username}`)
            .addFields(
                { name: 'Celkový počet modlení', value: `${userProfile.totalPrayers} (${totalPrayersRanking}. místo)`, inline: true },
                { name: 'Denní streak', value: `${userProfile.currentStreak} dní ${fireEmojis} (${streakRanking}. místo)`, inline: true },
                { name: 'Cooldown', value: cooldownMinutes > 0 ? `${cooldownMinutes} minut` : 'Můžeš se modlit!', inline: true },
                { name: 'Dnešní modlení', value: `${prayersToday}/24`, inline: true }
            )
            .setFooter({ text: 'MODLI SE TY BEZVĚRČE!' });

        await interaction.reply({ embeds: [embed] });
    } catch (error) {
        console.error('Error in handleMyStats:', error);
        await interaction.reply('CHYBA CHYBA CHYBA... POHODA...');
    }
}

function loadDatabase() {
    try {
        if (fs.existsSync(databasePath)) {
            const data = fs.readFileSync(databasePath, 'utf8');
            return JSON.parse(data);
        }
        return {}; 
    } catch (error) {
        console.error('Error loading database:', error);
        return {}; 
    }
}

function saveDatabase(data) {
    fs.writeFileSync(databasePath, JSON.stringify(data, null, 2));
}

const messageRateLimits = new Map();
const commandRateLimits = new Map();

const RATE_LIMIT_DURATION = 60000; 
const MAX_MESSAGES = 5; 
const MAX_COMMANDS = 5; 

function createOrCheckArray(userId, username) {
    let database = loadDatabase();

    for (let key in database) {
        if (database[key].userId === userId) {
            console.log('User already exists');
            return database[key];
        }
    }

    let newKey = Date.now().toString();
    database[newKey] = {
        userId: userId,
        username: username,  
        lastPrayDate: null,
        lastPrayTimestamp: 0,
        currentStreak: 0,
        totalPrayers: 0,
    };
    saveDatabase(database);
    console.log('New user profile created');
    return database[newKey];
}

function createOrCheckArray(userId, username) {
    let database = loadDatabase();

    for (let key in database) {
        if (database[key].userId === userId) {
            console.log('existuje');
            return database[key];
        }
    }

    let newKey = Date.now().toString();
    database[newKey] = {
        userId: userId,
        username: username,
        lastPrayDate: null,
        lastPrayTimestamp: 0,
        currentStreak: 0,
        totalPrayers: 0
    };
    saveDatabase(database);
    console.log('novy profil zaregistrovan');
    return database[newKey];
}


function updatePrayerStreak(userId) {
    let database = loadDatabase();
    for (let key in database) {
        if (database[key].userId === userId) {
            userProfile = database[key];
            break;
        }
    }

    if (!userProfile) {
        console.log(`new profile ${userId}`);
        userProfile = createNewUserProfile(userId);
        database[userId] = userProfile;
    }

    const now = Date.now();
    const today = new Date().toISOString().split('T')[0];
    const yesterday = new Date(now - 86400000).toISOString().split('T')[0];
    const oneHourAgo = now - 3600000;

      if (userProfile.lastPrayTimestamp < oneHourAgo) {
        let isFirstPrayOfDay = userProfile.lastPrayDate !== today;
        let streakIncreased = false;

        if (isFirstPrayOfDay) {
            if (userProfile.lastPrayDate === yesterday) {
                userProfile.currentStreak++;
                streakIncreased = true;
            } else {
                userProfile.currentStreak = 1;
            }
            userProfile.lastPrayDate = today;
        }

        userProfile.lastPrayTimestamp = now;
        userProfile.totalPrayers++;

        saveDatabase(database);

        return {
            success: true,
            isFirstPrayOfDay,
            streakIncreased,
            currentStreak: userProfile.currentStreak,
            cooldown: false
        };
    } else {
        const remainingCooldown = Math.ceil((userProfile.lastPrayTimestamp + 3600000 - now) / 60000);
        return {
            success: false,
            cooldown: true,
            remainingCooldown
        };
    }
}
    

client.on('messageCreate', async (message) => {
    if (!ALLOWED_CHANNEL_ID.includes(message.channel.id)) {
        return;
    }

    
    if (message.content.includes(prayEmoji) || relevantStickerFound(message)) {
        if (await isRateLimited(message)) {
            return;
        }
        let userProfile = createOrCheckArray(message.author.id, message.author.username);

        let result = updatePrayerStreak(message.author.id);
        
        if (result) {
            if (result.success) {
                if (result.isFirstPrayOfDay) {
                    await safeReact(message, '✅');
                    if (result.streakIncreased && result.currentStreak > 1) {
                        await safeReact(message, '🔥');
                        const streakEmojis = getNumberEmoji(result.currentStreak);
                        await safeReactMultiple(message, streakEmojis);
                    }
                } else {
                    await safeReact(message, '♻️');
                }
                console.log(` ${message.author.username} prayed. Streak: ${result.currentStreak}`);
            } else if (result.cooldown) {
                await safeReact(message, '⏱️');
                const cooldownEmojis = getNumberEmoji(result.remainingCooldown);
                await safeReactMultiple(message, cooldownEmojis);
                console.log(` ${message.author.username} on cooldown. Remaining: ${result.remainingCooldown} minutes`);
            }
        } else {
            console.error(`Error ${message.author.username}`);
        }
    }
});


async function safeReact(message, emoji) {
    try {
        await message.react(emoji);
    } catch (error) {
        console.error(`Fail ${emoji}:`, error);
    }
}

async function safeReactMultiple(message, emojis) {
    for (const emoji of emojis) {
        await safeReact(message, emoji);
    }
}

function createNewUserProfile(userId) {
    return {
        userId: userId,
        lastPrayDate: null,
        lastPrayTimestamp: 0,
        currentStreak: 0,
        totalPrayers: 0
    };
}


function getNumberEmoji(number) {
    const numberEmojis = ['0️⃣', '1️⃣', '2️⃣', '3️⃣', '4️⃣', '5️⃣', '6️⃣', '7️⃣', '8️⃣', '9️⃣'];
    
    // dvojcifry
    if (number > 9 && number.toString()[0] === number.toString()[1]) {
        number = number + 1;
    }
    
    if (number <= 9) {
        return [numberEmojis[number]];
    } else {
        return number.toString().split('').map(digit => numberEmojis[parseInt(digit)]);
    }
}


function relevantStickerFound(message) {
    return message.stickers.some(sticker => 
        ['1190308637076365322', '1268858200086544384', '1190352784726433875'].includes(sticker.id)
    );
}



/*
Abych mohl lognout potřebné info k prayi, tak potřebuju:
čas zprávy; jméno uživatele; content zprávy;

Pokud jeste nema profil, tak vytvorit profil.
Pokud ma profil, tak checknout, jestli pray poslal tento den.
Pokud nema
Kolikrat se za tento den pomodlil
Kolikrat se pomodlil vcera
Pokud je oboji 0, tak dostava reset



Potřebuju každopádně i databázi z které pak bude čerpat.


*/