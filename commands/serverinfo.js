const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("serverinfo")
    .setDescription("Get information about the server"),

  async execute(interaction) {
    // Basic Info
    const guild = interaction.guild;
    const name = guild.name;
    const id = guild.id;
    const createdTimestamp = guild.createdTimestamp;
    const ownerId = guild.ownerId;
    const owner = await interaction.client.users.fetch(ownerId);

    const description = guild.description;
    const banner = guild.banner;
    let bannerLink;

    // Boosts
    const premiumSubscriptionCount = guild.premiumSubscriptionCount;
    const premiumTier = guild.premiumTier;
    const vanityURLCode = guild.vanityURLCode;

    // Counts
    const memberCount = guild.memberCount;
    const emojiCount = guild.emojis.cache.size;
    const channelCount = guild.channels.cache.size;
    const roleCount = guild.roles.cache.size;

    // Extra
    const verified = guild.verified;
    const partnered = guild.partnered;
    const nsfwLevel = guild.nsfwLevel;

    let iconExt;
    let icon;
    try {
      iconExt = guild.icon.startsWith("a_") ? ".gif" : ".png";
      icon = `https://cdn.discordapp.com/icons/${id}/${guild.icon}` + iconExt;
    } catch {
      icon = "https://placehold.co/512";
    }

    if (banner) {
      const bannerExt = banner.startsWith("a_") ? ".gif" : ".png";
      bannerLink =
        `https://cdn.discordapp.com/banners/${id}/${banner}` + bannerExt;
    }

    let guildInfoContent = `
    • Name: ${name}
    • ID: \`${id}\`
    • Created: <t:${Math.floor(createdTimestamp / 1000)}:f> (<t:${Math.floor(
      createdTimestamp / 1000
    )}:R>)
    • Owner: <@${ownerId}> \`${owner.username}\`
    `;
    guildInfoContent += description
      ? `• Description: \`\`\`${description}\`\`\``
      : "";

    let boostsInfoContent = `
    • Boosts: \`${premiumSubscriptionCount}\`
    • Tier: \`${premiumTier}\`
    `;
    boostsInfoContent += vanityURLCode
      ? `• Vanity: [${vanityURLCode}](https://discord.com/invite/${vanityURLCode})\n`
      : "";
    boostsInfoContent += banner
      ? `• Banner: [${banner}](${bannerLink}?size=4096)\n`
      : "";

    const embed = new EmbedBuilder()
      .setTitle("Server Info")
      .setDescription(` `)
      .addFields(
        {
          name: "Guild Information",
          value: guildInfoContent,
        },
        {
          name: "Server Subscriptions",
          value: boostsInfoContent,
        },
        {
          name: "Counts",
          // subtract 1 from roleCount to remove the "@everyone" role included in the role cache
          value: `
          • Members: \`${memberCount}\`
          • Emojis: \`${emojiCount}\`
          • Channels: \`${channelCount}\`
          • Roles: \`${roleCount - 1}\` 
          `,
        },
        {
          name: "MISC",
          value: `
          • Verified: ${verified ? "`Yes`" : "`No`"}
          • Partnered: ${partnered ? "`Yes`" : "`No`"}
          • NSFW Level: \`${nsfwLevel}\`
          `,
        }
      )
      .setThumbnail(icon + "?size=4096")
      .setTimestamp()
      .setFooter({
        text: interaction.user.id,
        iconURL: interaction.user.displayAvatarURL({ extension: "jpg" }),
      });

    banner ? embed.setImage(`${bannerLink}?size=4096`) : "";
    await interaction.reply({ embeds: [embed] });
  },
};
