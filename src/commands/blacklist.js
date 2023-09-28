require("dotenv").config();

const {
  SlashCommandBuilder,
  EmbedBuilder,
  PermissionFlagsBits,
} = require("discord.js");

async function getBlacklistedUser(discordId, group) {
  const client = new MongoClient(process.env.MONGODB_URI);

  try {
    await client.connect();
    const col = client.db("blacklists").collection(group);

    const results = await col.findOne({
      discordId: discordId.toString(),
    });
    return results;
  } catch (e) {
    console.error(e);
  } finally {
    await client.close();
  }
}

const addSubcommand = async (interaction) => {
  const user = await interaction.options.getUser("user");
  const blacklistedUser = await getBlacklistedUser(user.id);
};

const removeSubcommand = async (interaction) => {};

const checkSubcommand = async (interaction) => {};

module.exports = {
  data: new SlashCommandBuilder()
    .setName("blacklist")
    .setDescription("Interact with the blacklist manager")
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .addSubcommand((subcommand) =>
      subcommand
        .setName("add")
        .setDescription("Blacklist a user")
        .addUserOption((option) =>
          option
            .setName("user")
            .setDescription("The user to blacklist")
            .setRequired(true)
        )
        .addStringOption((option) =>
          option
            .setName("reason")
            .setDescription("The reason for blacklisting")
            .setRequired(true)
        )
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName("remove")
        .setDescription("Remove a blacklist from a user")
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName("check")
        .setDescription("Check if a user is blacklisted")
    ),
  async execute(interaction) {
    const commandRan = interaction.options._subcommand;
    if (commandRan === "add") {
      await addSubcommand(interaction);
    } else if (commandRan === "remove") {
      await removeSubcommand(interaction);
    } else {
      await checkSubcommand(interaction);
    }
  },
};
