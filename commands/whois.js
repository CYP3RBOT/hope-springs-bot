const {
  SlashCommandBuilder,
  EmbedBuilder,
  GuildMember,
  Role,
} = require("discord.js");

const existingBadges = {
  System: "System",
  Staff: "Discord Employee",
  Partner: "Discord Partner",
  Hypesquad: "HypeSquad Events Member",
  HypeSquadOnlineHouse1: "House of Bravery",
  HypeSquadOnlineHouse2: "House of Brilliance",
  HypeSquadOnlineHouse3: "House of Balance",
  BugHunterLevel1: "Bug Hunter (Level 1)",
  BugHunterLevel2: "Bug Hunter (Level 2)",
  PremiumEarlySupporter: "Early Nitro Supporter",
  TeamPseudoUser: "Team User",
  VerifiedBot: "Verified Bot",
  VerifiedDeveloper: "Early Verified Bot Developer",
  CertifiedModerator: "Certified Discord Moderator",
  BotHTTPInteraction: "Bot HTTP Interactions",
  ActiveDeveloper: "Active Developer",
};

/**
 * Convert a discord id to a timestamp
 *
 * @param {number} discord id
 * @returns {number} discord timestamp
 */
function discordIdToTimestamp(id) {
  const DISCORD_EPOCH = 1420070400000;
  const snowflake = BigInt(id);
  const timestamp = Math.round(
    Number((snowflake >> 22n) + BigInt(DISCORD_EPOCH)) / 1000
  );
  return timestamp;
}

/**
 * Retrieve the highest color role, hoist role, and icon role
 *
 * @param {GuildMember} member The member whose roles to retrieve info for
 * @returns {[Role, Role, Role]} The three highest roles of color, hoist, and icon
 */
function retrieveRoleInfo(member) {
  let colorRole = null;
  let hoistRole = null;
  let iconRole = null;

  member.roles.cache.map((role) => {
    if (role.hexColor != "#000000") {
      if (!colorRole) {
        colorRole = role;
        return;
      } else {
        if (role.position > colorRole.position) {
          colorRole = role;
        }
      }
    }
  });

  member.roles.cache.map((role) => {
    if (role.hoist) {
      if (!hoistRole) {
        hoistRole = role;
        return;
      } else {
        if (role.position > hoistRole.position) {
          hoistRole = role;
        }
      }
    }
  });

  member.roles.cache.map((role) => {
    if (role.icon) {
      if (!iconRole) {
        iconRole = role;
        return;
      } else {
        if (role.position > iconRole.position) {
          iconRole = role;
        }
      }
    }
  });

  return [colorRole, hoistRole, iconRole];
}

/**
 * Retrieve the roles of a member
 *
 * @param {GuildMember} member The member whose roles to retrieve info for
 * @returns {[string...]} The list of roles
 */
function retrieveRoles(member) {
  let roles = member._roles.slice(0);
  for (let i = 0; i < roles.length; i++) {
    roles[i] = `<@&${roles[i]}>`;
  }
  roles = roles.reverse();
  return roles;
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName("whois")
    .setDescription("Shows information about the provided user")
    .addUserOption((option) =>
      option
        .setName("user")
        .setDescription("The user to show information")
        .setRequired(true)
    ),

  async execute(interaction) {
    const user = interaction.options.getUser("user");
    const member = await interaction.guild.members.fetch(user.id);

    const [colorRole, hoistRole, iconRole] = retrieveRoleInfo(member);

    const badges = user.flags.toArray();
    const badgesOwned = [];

    badges.map((b) => {
      if (existingBadges[b]) {
        badgesOwned.push(existingBadges[b]);
      }
    });

    let embedMessage = `• Joined: <t:${Math.floor(
      member.joinedTimestamp / 1000
    )}:f> (<t:${Math.floor(member.joinedTimestamp / 1000)}:R>)\n`;

    embedMessage += colorRole
      ? `• Color role: \`${colorRole.name}\` (\`${colorRole.hexColor}\`)\n`
      : "\t";
    embedMessage += hoistRole ? `• Hoist role: \`${hoistRole.name}\`\n` : "\t";
    embedMessage += iconRole ? `• Icon role: \`${iconRole.name}\`\n` : "\t";
    embedMessage += member.nickname
      ? `• Nickname: \`${member.nickname}\`\n`
      : "";
    embedMessage += member.premiumSince
      ? `• Boosting since: <t:${Math.floor(
          member.premiumSinceTimestamp / 1000
        )}:f> (<t:${Math.floor(member.premiumSinceTimestamp / 1000)}:R>)\n`
      : "\t";
    embedMessage +=
      retrieveRoles(member).length > 1
        ? `• Roles (${retrieveRoles(member).length}):
            *${retrieveRoles(member).join(", ")}*\n`
        : "";

    const extension = user.displayAvatarURL().endsWith(".gif") ? "gif" : "jpg";
    const embed = new EmbedBuilder()
      .setTitle("User Info")
      .setDescription(
        `
      • Name: <@${user.id}> \`${user.tag}\`
      • ID: \`${user.id}\`
      • Created: <t:${discordIdToTimestamp(
        user.id
      )}:f> (<t:${discordIdToTimestamp(user.id)}:R>)
      • Avatar: [${user
        .displayAvatarURL({ extension: extension })
        .split(user.id.toString() + "/")[1]
        .replace("." + extension, "")}](${user.displayAvatarURL({
          extension: extension,
        })})
      • Badges:
        *${badgesOwned.join(", ")}*
          `
      )
      .setThumbnail(user.displayAvatarURL({ extension: extension }))
      .addFields({
        name: "Member Info",
        value: embedMessage,
      })
      .setFooter({
        text: interaction.user.id,
        iconURL: interaction.user.displayAvatarURL({ extension: "jpg" }),
      });

    await interaction.reply({ embeds: [embed] });
  },
};
