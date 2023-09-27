require("dotenv").config();

const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");
const axios = require("axios");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("quote")
    .setDescription("Replies with a quote")
    .addStringOption((option) =>
      option
        .setName("category")
        .setDescription("The category of quote")
        .setRequired(true)
        .addChoices(
          {
            name: "Love",
            value: "love",
          },
          {
            name: "Happiness",
            value: "happiness",
          }
        )
    ),
  async execute(interaction) {
    const categoryChosen = interaction.options.getString("category");
    const api = `https://api.api-ninjas.com/v1/quotes?category=${categoryChosen}`;

    let config = {
      method: "get",
      maxBodyLength: Infinity,
      url: api,
      headers: {
        "X-Api-Key": process.env.QUOTES_API_KEY,
      },
    };

    const data = await axios
      .request(config)
      .then((response) => {
        return response.data;
      })
      .catch((error) => {
        console.log(error);
      });

    const quote = data[0].quote;
    const author = data[0].author;
    const category = data[0].category;

    const embed = new EmbedBuilder()
      .setTitle("Quote")
      .setDescription(
        `*"${quote}"*
        
        -${author} (${category.charAt(0).toUpperCase() + category.slice(1)})`
      )
      .setTimestamp()
      .setFooter({
        text: interaction.user.id,
        iconURL: interaction.user.displayAvatarURL(),
      });

    await interaction.reply({
      embeds: [embed],
    });
  },
};
