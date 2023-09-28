const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");

const compliments = require("../../data/compliments.json");

function getRandomCompliment(arr) {
  const randomIndex = Math.floor(Math.random() * arr.length);
  return arr[randomIndex];
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName("compliment")
    .setDescription("Send a warm and uplifting compliment")
    .addUserOption((option) =>
      option
        .setName("user")
        .setDescription("The user to compliment")
        .setRequired(true)
    )
    .addBooleanOption((option) =>
      option
        .setName("anonymous")
        .setDescription("Would you like the compliment to be anonymous?")
        .setRequired(true)
    ),
  async execute(interaction) {
    const user = await interaction.options.getUser("user");
    const isAnonymous = await interaction.options.getBoolean("anonymous");

    if (user.bot) {
      await interaction.reply({
        content: "You cannot send a compliment to a bot!",
        ephemeral: true,
      });
      return;
    }

    const randomCompliment = getRandomCompliment(compliments.compliments);

    const embed = new EmbedBuilder()
      .setTitle("You received a random compliment!")
      .setDescription(randomCompliment)
      .setColor(0x7ecbaf)
      .setTimestamp()
      .addFields({
        name: "Sender",
        value: isAnonymous ? "anonymous" : `<@${user.id}> (${user.username})`,
      });

    await user.send({
      embeds: [embed],
    });

    await interaction.reply({
      content: "Sent the compliment!",
      ephemeral: true,
    });
  },
};
