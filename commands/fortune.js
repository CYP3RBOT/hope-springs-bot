const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");

const fortune = require("../fortune.json");

function getRandomFortune(arr) {
  const randomIndex = Math.floor(Math.random() * arr.length);
  return arr[randomIndex];
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName("fortune")
    .setDescription("Get your fortune"),
  async execute(interaction) {
    const randomFortune = getRandomFortune(fortune.fortunes);

    const embed = new EmbedBuilder()
      .setTitle("Your Fortune")
      .setDescription(randomFortune)
      .setColor(0x7ecbaf)
      .setTimestamp()
      .setFooter({
        text: interaction.user.username,
        iconURL: interaction.user.displayAvatarURL(),
      });

    await interaction.reply({
      embeds: [embed],
    });
  },
};
