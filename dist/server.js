var __create = Object.create;
var __defProp = Object.defineProperty;
var __defProps = Object.defineProperties;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropDescs = Object.getOwnPropertyDescriptors;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getOwnPropSymbols = Object.getOwnPropertySymbols;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __propIsEnum = Object.prototype.propertyIsEnumerable;
var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
var __spreadValues = (a, b) => {
  for (var prop in b || (b = {}))
    if (__hasOwnProp.call(b, prop))
      __defNormalProp(a, prop, b[prop]);
  if (__getOwnPropSymbols)
    for (var prop of __getOwnPropSymbols(b)) {
      if (__propIsEnum.call(b, prop))
        __defNormalProp(a, prop, b[prop]);
    }
  return a;
};
var __spreadProps = (a, b) => __defProps(a, __getOwnPropDescs(b));
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// src/server.ts
var server_exports = {};
__export(server_exports, {
  default: () => server_default
});
module.exports = __toCommonJS(server_exports);
var import_express6 = __toESM(require("express"));
var import_cors = __toESM(require("cors"));
var import_dotenv3 = __toESM(require("dotenv"));

// src/config/database.ts
var import_mongoose = __toESM(require("mongoose"));
var connectDB = async () => {
  try {
    const mongoURI = process.env.MONGODB_URI || "mongodb://localhost:27017/amul-inventory";
    await import_mongoose.default.connect(mongoURI, {
      dbName: "amul-inventory"
    });
    console.log("\u2705 MongoDB connected successfully");
  } catch (error) {
    console.error("\u274C MongoDB connection error:", error);
    throw error;
  }
};

// src/services/productService.ts
var import_axios2 = __toESM(require("axios"));

// src/models/Product.ts
var import_mongoose2 = __toESM(require("mongoose"));
var productSchema = new import_mongoose2.Schema({
  productId: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  alias: { type: String, required: true },
  price: { type: Number, required: true },
  inventoryQuantity: { type: Number, default: 0 },
  lastChecked: { type: Date, default: Date.now },
  image: { type: String },
  brand: { type: String },
  wasOutOfStock: { type: Boolean, default: false }
}, {
  timestamps: true
});
productSchema.index({ productId: 1 });
productSchema.index({ inventoryQuantity: 1 });
productSchema.index({ lastChecked: 1 });
var Product = import_mongoose2.default.model("Product", productSchema);

// src/config/email.ts
var import_nodemailer = __toESM(require("nodemailer"));
var import_dotenv = __toESM(require("dotenv"));
import_dotenv.default.config();
var transporter = import_nodemailer.default.createTransport({
  secure: true,
  host: "smtp.gmail.com",
  port: 465,
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

// src/models/Subscription.ts
var import_mongoose3 = __toESM(require("mongoose"));
var subscriptionSchema = new import_mongoose3.Schema({
  email: {
    type: String,
    required: true,
    lowercase: true,
    trim: true
  },
  productId: {
    type: String,
    required: true
  },
  telegramUsername: {
    type: String,
    required: false,
    trim: true,
    default: null
  },
  subscribedAt: {
    type: Date,
    default: Date.now
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});
subscriptionSchema.index({ email: 1, productId: 1 }, { unique: true });
subscriptionSchema.index({ productId: 1, isActive: 1 });
subscriptionSchema.statics.getUserEmail = async function(telegramUsername) {
  const subscription = await this.findOne({
    telegramUsername,
    isActive: true
  }).sort({ createdAt: -1 });
  return (subscription == null ? void 0 : subscription.email) || null;
};
var Subscription = import_mongoose3.default.model("Subscription", subscriptionSchema);

// src/services/telegramService.ts
var import_axios = __toESM(require("axios"));
var import_node_telegram_bot_api = __toESM(require("node-telegram-bot-api"));
var import_dotenv2 = __toESM(require("dotenv"));
import_dotenv2.default.config();
var bot = new import_node_telegram_bot_api.default(process.env.TELEGRAM_BOT_TOKEN || "", { polling: true });
var pendingEmails = /* @__PURE__ */ new Map();
bot.onText(/\/start/, async (msg) => {
  var _a;
  const chatId = msg.chat.id;
  const username = (_a = msg.from) == null ? void 0 : _a.username;
  if (username) {
    const existingEmail = await Subscription.getUserEmail(username);
    if (existingEmail) {
      await bot.sendMessage(
        chatId,
        "\u{1F44B} Welcome back to Amul Product Notifier!\n\nYour email is already set: " + existingEmail + "\n\nAvailable commands:\n/setemail - Change your email\n/products - Browse and subscribe to products\n/mysubscriptions - View your subscriptions\n/unsubscribeall - Unsubscribe from all products\n/help - Show this help message\n\n\u{1F4E7} For any support, contact: thakkarnisarg@gmail.com"
      );
      return;
    }
  }
  await bot.sendMessage(
    chatId,
    "\u{1F44B} Welcome to Amul Product Notifier!\n\nAvailable commands:\n/setemail - Set your email for notifications\n/products - Browse and subscribe to products\n/mysubscriptions - View your subscriptions\n/unsubscribeall - Unsubscribe from all products\n/help - Show this help message\n\n\u{1F4E7} For any support, contact: thakkarnisarg@gmail.com"
  );
});
async function getUserEmail(chatId, username) {
  if (username) {
    const email = await Subscription.getUserEmail(username);
    if (email) return email;
  }
  return pendingEmails.get(chatId) || null;
}
bot.onText(/\/help/, async (msg) => {
  const chatId = msg.chat.id;
  await bot.sendMessage(
    chatId,
    "\u{1F4CB} Available commands:\n\n/setemail - Set your email for notifications\n/products - Browse and subscribe to products\n/mysubscriptions - View your subscriptions\n/unsubscribeall - Unsubscribe from all products\n/help - Show this help message\n\n\u{1F4E7} For any support, contact: thakkarnisarg@gmail.com"
  );
});
bot.onText(/\/setemail/, async (msg) => {
  const chatId = msg.chat.id;
  await bot.sendMessage(chatId, "Please enter your email address:");
  pendingEmails.set(chatId, "waiting");
});
bot.onText(/\/products/, async (msg) => {
  var _a;
  const chatId = msg.chat.id;
  const username = (_a = msg.from) == null ? void 0 : _a.username;
  const email = await getUserEmail(chatId, username);
  if (!email || email === "waiting") {
    await bot.sendMessage(chatId, "\u274C Please set your email first using /setemail");
    return;
  }
  try {
    const products = await Product.find({});
    if (products.length === 0) {
      await bot.sendMessage(chatId, "No products available at the moment.");
      return;
    }
    const keyboard = products.map((product) => [{
      text: `${product.name} - \u20B9${product.price} ${product.inventoryQuantity > 0 ? "\u{1F7E2}" : "\u{1F534}"}`,
      callback_data: `product_${product.productId}`
    }]);
    await bot.sendMessage(
      chatId,
      "\u{1F4CB} Available Products:\n\u{1F7E2} - In Stock\n\u{1F534} - Out of Stock\n\nClick on a product to view details and subscribe.",
      {
        reply_markup: {
          inline_keyboard: keyboard
        }
      }
    );
  } catch (error) {
    console.error("Error fetching products:", error);
    await bot.sendMessage(chatId, "\u274C Error fetching products. Please try again later.");
  }
});
bot.on("callback_query", async (callbackQuery) => {
  var _a, _b, _c, _d, _e, _f;
  const chatId = (_a = callbackQuery.message) == null ? void 0 : _a.chat.id;
  const username = callbackQuery.from.username;
  const data = callbackQuery.data;
  if (!chatId || !data) return;
  const email = await getUserEmail(chatId, username);
  if (!email || email === "waiting") {
    await bot.answerCallbackQuery(callbackQuery.id, {
      text: "\u274C Please set your email first using /setemail",
      show_alert: true
    });
    return;
  }
  if (data.startsWith("product_")) {
    const productId = data.replace("product_", "");
    try {
      const product = await Product.findOne({ productId });
      if (!product) {
        await bot.answerCallbackQuery(callbackQuery.id, {
          text: "\u274C Product not found",
          show_alert: true
        });
        return;
      }
      const productUrl = `https://shop.amul.com/en/product/${product.alias}`;
      const existingSubscription = await Subscription.findOne({
        email,
        productId,
        isActive: true
      });
      if (product.inventoryQuantity > 0) {
        const keyboard = [[{
          text: "\u{1F6D2} Buy Now",
          url: productUrl
        }]];
        if (!existingSubscription) {
          keyboard.push([{
            text: "\u{1F514} Subscribe for Stock Updates",
            callback_data: `subscribe_${productId}`
          }]);
        }
        await bot.editMessageText(
          `\u{1F4E6} <b>${product.name}</b>

\u{1F4B0} Price: \u20B9${product.price}
\u{1F4CA} Stock: ${product.inventoryQuantity} units

${existingSubscription ? "\u2705 You are subscribed to this product" : "Click below to subscribe for stock updates"}`,
          {
            chat_id: chatId,
            message_id: (_b = callbackQuery.message) == null ? void 0 : _b.message_id,
            parse_mode: "HTML",
            reply_markup: {
              inline_keyboard: keyboard
            }
          }
        );
      } else {
        const keyboard = [[{
          text: existingSubscription ? "\u2705 Subscribed" : "\u{1F514} Subscribe for Stock Updates",
          callback_data: `subscribe_${productId}`
        }]];
        await bot.editMessageText(
          `\u{1F4E6} <b>${product.name}</b>

\u{1F4B0} Price: \u20B9${product.price}
\u{1F4CA} Stock: Out of Stock

${existingSubscription ? "\u2705 You are subscribed to this product" : "Click below to subscribe for stock updates"}`,
          {
            chat_id: chatId,
            message_id: (_c = callbackQuery.message) == null ? void 0 : _c.message_id,
            parse_mode: "HTML",
            reply_markup: {
              inline_keyboard: keyboard
            }
          }
        );
      }
    } catch (error) {
      console.error("Error handling product selection:", error);
      await bot.answerCallbackQuery(callbackQuery.id, {
        text: "\u274C Error processing request. Please try again later.",
        show_alert: true
      });
    }
  } else if (data.startsWith("subscribe_")) {
    const productId = data.replace("subscribe_", "");
    try {
      const product = await Product.findOne({ productId });
      if (!product) {
        await bot.answerCallbackQuery(callbackQuery.id, {
          text: "\u274C Product not found",
          show_alert: true
        });
        return;
      }
      const existingSubscription = await Subscription.findOne({
        email,
        productId,
        isActive: true
      });
      if (existingSubscription) {
        await bot.answerCallbackQuery(callbackQuery.id, {
          text: "\u2705 You are already subscribed to this product!",
          show_alert: true
        });
        return;
      }
      await Subscription.create({
        email,
        productId,
        telegramUsername: username,
        isActive: true
      });
      await bot.answerCallbackQuery(callbackQuery.id, {
        text: `\u2705 Successfully subscribed to ${product.name}!`,
        show_alert: true
      });
      const message = callbackQuery.message;
      if (message && ((_d = message.reply_markup) == null ? void 0 : _d.inline_keyboard)) {
        const keyboard = message.reply_markup.inline_keyboard.map(
          (row) => row.map((button) => {
            if (button.callback_data === `subscribe_${productId}`) {
              return __spreadProps(__spreadValues({}, button), {
                text: "\u2705 Subscribed"
              });
            }
            return button;
          })
        );
        await bot.editMessageReplyMarkup(
          { inline_keyboard: keyboard },
          {
            chat_id: chatId,
            message_id: message.message_id
          }
        );
      }
    } catch (error) {
      console.error("Error subscribing to product:", error);
      await bot.answerCallbackQuery(callbackQuery.id, {
        text: "\u274C Error subscribing to product. Please try again later.",
        show_alert: true
      });
    }
  } else if (data.startsWith("unsubscribe_")) {
    const productId = data.replace("unsubscribe_", "");
    try {
      const product = await Product.findOne({ productId });
      if (!product) {
        await bot.answerCallbackQuery(callbackQuery.id, {
          text: "\u274C Product not found",
          show_alert: true
        });
        return;
      }
      const result = await Subscription.updateOne(
        { email, productId, isActive: true },
        { $set: { isActive: false } }
      );
      if (result.modifiedCount === 0) {
        await bot.answerCallbackQuery(callbackQuery.id, {
          text: "\u274C No active subscription found for this product.",
          show_alert: true
        });
        return;
      }
      await bot.answerCallbackQuery(callbackQuery.id, {
        text: `\u2705 Successfully unsubscribed from ${product.name}!`,
        show_alert: true
      });
      const message = callbackQuery.message;
      if (message && ((_e = message.reply_markup) == null ? void 0 : _e.inline_keyboard)) {
        const keyboard = message.reply_markup.inline_keyboard.filter(
          (row) => {
            var _a2;
            return !((_a2 = row[0].callback_data) == null ? void 0 : _a2.includes(`unsubscribe_${productId}`));
          }
        );
        if (keyboard.length === 1 && keyboard[0][0].callback_data === "unsubscribe_all") {
          await bot.editMessageText(
            "You have no active subscriptions.",
            {
              chat_id: chatId,
              message_id: message.message_id
            }
          );
        } else {
          const productText = `\u{1F4E6} <b>${product.name}</b>
\u{1F4B0} Price: \u20B9${product.price}
\u{1F4CA} Stock: ${product.inventoryQuantity > 0 ? "In Stock" : "Out of Stock"}
\u{1F517} <a href="https://shop.amul.com/en/product/${product.alias}">View Product</a>`;
          const newText = ((_f = message.text) == null ? void 0 : _f.replace(productText + "\n\n", "")) || "";
          await bot.editMessageText(
            newText,
            {
              chat_id: chatId,
              message_id: message.message_id,
              parse_mode: "HTML",
              disable_web_page_preview: true,
              reply_markup: {
                inline_keyboard: keyboard
              }
            }
          );
        }
      }
    } catch (error) {
      console.error("Error unsubscribing from product:", error);
      await bot.answerCallbackQuery(callbackQuery.id, {
        text: "\u274C Error unsubscribing from product. Please try again later.",
        show_alert: true
      });
    }
  } else if (data === "unsubscribe_all") {
    try {
      const result = await Subscription.updateMany(
        { email, isActive: true },
        { $set: { isActive: false } }
      );
      if (result.modifiedCount === 0) {
        await bot.answerCallbackQuery(callbackQuery.id, {
          text: "You have no active subscriptions to unsubscribe from.",
          show_alert: true
        });
        return;
      }
      await bot.answerCallbackQuery(callbackQuery.id, {
        text: "\u2705 Successfully unsubscribed from all products!",
        show_alert: true
      });
      const message = callbackQuery.message;
      if (message) {
        await bot.editMessageText(
          "You have no active subscriptions.",
          {
            chat_id: chatId,
            message_id: message.message_id
          }
        );
      }
    } catch (error) {
      console.error("Error unsubscribing from all products:", error);
      await bot.answerCallbackQuery(callbackQuery.id, {
        text: "\u274C Error unsubscribing from products. Please try again later.",
        show_alert: true
      });
    }
  }
});
bot.onText(/\/mysubscriptions/, async (msg) => {
  var _a;
  const chatId = msg.chat.id;
  const username = (_a = msg.from) == null ? void 0 : _a.username;
  const email = await getUserEmail(chatId, username);
  if (!email || email === "waiting") {
    await bot.sendMessage(chatId, "\u274C Please set your email first using /setemail");
    return;
  }
  try {
    const subscriptions = await Subscription.find({
      email,
      isActive: true
    });
    if (subscriptions.length === 0) {
      await bot.sendMessage(chatId, "You have no active subscriptions.");
      return;
    }
    const productIds = subscriptions.map((sub) => sub.productId);
    const products = await Product.find({ productId: { $in: productIds } });
    const productMap = new Map(products.map((p) => [p.productId, p]));
    const subscriptionList = subscriptions.map((sub) => {
      const product = productMap.get(sub.productId);
      if (!product) return null;
      return `\u{1F4E6} <b>${product.name}</b>
\u{1F4B0} Price: \u20B9${product.price}
\u{1F4CA} Stock: ${product.inventoryQuantity > 0 ? "In Stock" : "Out of Stock"}
\u{1F517} <a href="https://shop.amul.com/en/product/${product.alias}">View Product</a>`;
    }).filter(Boolean).join("\n\n");
    const keyboard = subscriptions.map((sub) => {
      const product = productMap.get(sub.productId);
      if (!product) return null;
      return [{
        text: `\u274C Unsubscribe from ${product.name}`,
        callback_data: `unsubscribe_${sub.productId}`
      }];
    }).filter((row) => row !== null);
    keyboard.push([{
      text: "\u274C Unsubscribe from All Products",
      callback_data: "unsubscribe_all"
    }]);
    await bot.sendMessage(
      chatId,
      "\u{1F4CB} Your Active Subscriptions:\n\n" + subscriptionList,
      {
        parse_mode: "HTML",
        disable_web_page_preview: true,
        reply_markup: {
          inline_keyboard: keyboard
        }
      }
    );
  } catch (error) {
    console.error("Error fetching subscriptions:", error);
    await bot.sendMessage(chatId, "\u274C Error fetching subscriptions. Please try again later.");
  }
});
bot.onText(/\/unsubscribe (.+)/, async (msg, match) => {
  var _a;
  const chatId = msg.chat.id;
  const productId = match == null ? void 0 : match[1];
  const username = (_a = msg.from) == null ? void 0 : _a.username;
  const email = await getUserEmail(chatId, username);
  if (!email || email === "waiting") {
    await bot.sendMessage(chatId, "\u274C Please set your email first using /setemail");
    return;
  }
  if (!productId) {
    await bot.sendMessage(chatId, "\u274C Please provide a product ID. Usage: /unsubscribe <product_id>");
    return;
  }
  try {
    const result = await Subscription.updateOne(
      { email, productId, isActive: true },
      { $set: { isActive: false } }
    );
    if (result.modifiedCount === 0) {
      await bot.sendMessage(chatId, "\u274C No active subscription found for this product.");
      return;
    }
    const product = await Product.findOne({ productId });
    await bot.sendMessage(
      chatId,
      `\u2705 Successfully unsubscribed from ${(product == null ? void 0 : product.name) || "the product"}!`
    );
  } catch (error) {
    console.error("Error unsubscribing from product:", error);
    await bot.sendMessage(chatId, "\u274C Error unsubscribing from product. Please try again later.");
  }
});
bot.onText(/\/unsubscribeall/, async (msg) => {
  var _a;
  const chatId = msg.chat.id;
  const username = (_a = msg.from) == null ? void 0 : _a.username;
  const email = await getUserEmail(chatId, username);
  if (!email || email === "waiting") {
    await bot.sendMessage(chatId, "\u274C Please set your email first using /setemail");
    return;
  }
  try {
    const result = await Subscription.updateMany(
      { email, isActive: true },
      { $set: { isActive: false } }
    );
    if (result.modifiedCount === 0) {
      await bot.sendMessage(chatId, "You have no active subscriptions to unsubscribe from.");
      return;
    }
    await bot.sendMessage(
      chatId,
      `\u2705 Successfully unsubscribed from all products!`
    );
  } catch (error) {
    console.error("Error unsubscribing from all products:", error);
    await bot.sendMessage(chatId, "\u274C Error unsubscribing from products. Please try again later.");
  }
});
bot.on("message", async (msg) => {
  var _a;
  const chatId = msg.chat.id;
  const username = (_a = msg.from) == null ? void 0 : _a.username;
  const pendingEmail = pendingEmails.get(chatId);
  if (pendingEmail === "waiting") {
    const newEmail = msg.text;
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(newEmail || "")) {
      await bot.sendMessage(chatId, "\u274C Invalid email format. Please try again:");
      return;
    }
    if (username) {
      await Subscription.updateMany(
        { telegramUsername: username },
        { $set: { email: newEmail } }
      );
    }
    pendingEmails.set(chatId, newEmail || "");
    await bot.sendMessage(
      chatId,
      `\u2705 Email set successfully: ${newEmail}
You can now use /products to view available products and /mysubscriptions to view your subscriptions.`
    );
  }
});
var TelegramService = class {
  // username -> chat_id mapping
  constructor() {
    this.userChatIds = /* @__PURE__ */ new Map();
    this.botToken = process.env.TELEGRAM_BOT_TOKEN || "";
    this.baseUrl = `https://api.telegram.org/bot${this.botToken}`;
    if (!this.botToken) {
      console.warn("\u26A0\uFE0F TELEGRAM_BOT_TOKEN not found in environment variables");
    } else {
      this.initializeUserMapping();
    }
  }
  async initializeUserMapping() {
    var _a, _b, _c, _d;
    try {
      const updates = await this.getUpdates();
      for (const update of updates) {
        if (((_b = (_a = update.message) == null ? void 0 : _a.from) == null ? void 0 : _b.username) && ((_d = (_c = update.message) == null ? void 0 : _c.chat) == null ? void 0 : _d.id)) {
          this.userChatIds.set(update.message.from.username, update.message.chat.id);
        }
      }
      console.log(`\u{1F4F1} Initialized Telegram user mapping for ${this.userChatIds.size} users`);
    } catch (error) {
      console.error("\u274C Failed to initialize Telegram user mapping:", error);
    }
  }
  async getUpdates() {
    try {
      const response = await import_axios.default.get(`${this.baseUrl}/getUpdates`);
      return response.data.result || [];
    } catch (error) {
      console.error("\u274C Failed to get Telegram updates:", error);
      return [];
    }
  }
  async getChatId(username) {
    if (this.userChatIds.has(username)) {
      return this.userChatIds.get(username);
    }
    await this.initializeUserMapping();
    return this.userChatIds.get(username) || null;
  }
  async sendProductNotification(username, product, quantity) {
    var _a;
    try {
      const chatId = await this.getChatId(username);
      if (!chatId) {
        console.error(`\u274C Chat ID not found for username: @${username}`);
        console.log(`\u{1F4A1} User @${username} needs to start a conversation with the bot first`);
        return false;
      }
      const message = this.generateProductMessage(product, quantity);
      const response = await import_axios.default.post(`${this.baseUrl}/sendMessage`, {
        chat_id: chatId,
        text: message,
        parse_mode: "HTML",
        disable_web_page_preview: false
      });
      if (response.data.ok) {
        console.log(`\u{1F4F1} Telegram notification sent to @${username} for product ${product.name}`);
        return true;
      } else {
        console.error(`\u274C Failed to send Telegram message to @${username}:`, response.data);
        return false;
      }
    } catch (error) {
      if (import_axios.default.isAxiosError(error)) {
        console.error(`\u274C Telegram API error for @${username}:`, ((_a = error.response) == null ? void 0 : _a.data) || error.message);
      } else {
        console.error(`\u274C Unexpected error sending Telegram message to @${username}:`, error);
      }
      return false;
    }
  }
  generateProductMessage(product, quantity) {
    const productUrl = `https://shop.amul.com/en/product/${product.alias}`;
    return `\u{1F389} <b>Great News!</b>

Your awaited product is back in stock!

\u{1F4E6} <b>${product.name}</b>
\u{1F4B0} <b>\u20B9${product.price}</b>
\u{1F525} <b>Only ${quantity} units available</b>

Don't wait too long - popular items like this tend to sell out fast!

<a href="${productUrl}">\u{1F6D2} Order Now Before It's Gone!</a>

Happy Shopping! \u{1F6CD}\uFE0F

<i>Made with \u2764\uFE0F by Nisarg & Harsh</i>`;
  }
  async sendTestMessage(username, product) {
    return this.sendProductNotification(username, product, product.inventoryQuantity);
  }
  // Method to handle new users starting conversation with bot
  async handleBotStart(username, chatId) {
    this.userChatIds.set(username, chatId);
    console.log(`\u{1F4F1} New user registered: @${username} with chat ID: ${chatId}`);
  }
};
var telegramService = new TelegramService();

// src/services/emailService.ts
var notifySubscribers = async (product, updatedProductData) => {
  try {
    const subscriptions = await Subscription.find({
      productId: product.productId,
      isActive: true
    });
    console.log(`Notifying ${subscriptions.length} subscribers for product: ${product.name}`);
    if (subscriptions.length === 0) {
      console.log(`No active subscriptions found for product: ${product.name}`);
      return;
    }
    const productUrl = `https://shop.amul.com/en/product/${product.alias}`;
    const notificationPromises = subscriptions.map(async (subscription) => {
      const promises = [];
      const mailOptions = {
        from: process.env.EMAIL_USER,
        to: subscription.email,
        subject: `\u{1F389} ${product.name} is Back in Stock!`,
        html: generateEmailHTML(product, productUrl, updatedProductData.inventory_quantity)
      };
      promises.push(
        transporter.sendMail(mailOptions).then(() => {
          console.log(`\u{1F4E7} Email notification sent to ${subscription.email} for product ${product.name}`);
        }).catch((emailError) => {
          console.error(`\u274C Failed to send email to ${subscription.email}:`, emailError);
        })
      );
      if (subscription.telegramUsername) {
        promises.push(
          telegramService.sendProductNotification(subscription.telegramUsername, product, updatedProductData.inventory_quantity).then((success) => {
            if (!success) {
              console.log(`\u{1F4A1} Tip: User @${subscription.telegramUsername} should start a conversation with the bot to receive notifications`);
            }
          }).catch((telegramError) => {
            console.error(`\u274C Failed to send Telegram message to @${subscription.telegramUsername}:`, telegramError);
          })
        );
      }
      return Promise.allSettled(promises);
    });
    await Promise.allSettled(notificationPromises);
    console.log(`\u2705 Finished processing notifications for product: ${product.name}`);
  } catch (error) {
    console.error("\u274C Error sending notifications:", error instanceof Error ? error.message : "Unknown error");
  }
};
var generateEmailHTML = (product, productUrl, quantity) => {
  return `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Product Back in Stock</title>
        <style>
            body { 
                font-family: 'Arial', sans-serif; 
                line-height: 1.6; 
                color: #333; 
                background-color: #f4f4f4; 
                margin: 0; 
                padding: 20px; 
            }
            .container { 
                max-width: 600px; 
                margin: 0 auto; 
                background: white; 
                border-radius: 10px; 
                overflow: hidden; 
                box-shadow: 0 0 20px rgba(0,0,0,0.1); 
            }
            .header { 
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); 
                color: white; 
                padding: 30px; 
                text-align: center; 
            }
            .header h1 { 
                margin: 0; 
                font-size: 24px; 
                font-weight: bold; 
            }
            .content { 
                padding: 30px; 
            }
            .product-info { 
                background: #f8f9fa; 
                border-radius: 8px; 
                padding: 20px; 
                margin: 20px 0; 
                border-left: 4px solid #667eea; 
            }
            .product-name { 
                font-size: 18px; 
                font-weight: bold; 
                color: #333; 
                margin-bottom: 10px; 
            }
            .product-price { 
                font-size: 16px; 
                color: #28a745; 
                font-weight: bold; 
                margin-bottom: 10px; 
            }
            .stock-info { 
                color: #dc3545; 
                font-weight: bold; 
                font-size: 14px; 
            }
            .cta-button { 
                display: inline-block; 
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); 
                color: white; 
                padding: 15px 30px; 
                text-decoration: none; 
                border-radius: 25px; 
                font-weight: bold; 
                text-align: center; 
                margin: 20px 0; 
                transition: transform 0.2s; 
            }
            .cta-button:hover { 
                transform: translateY(-2px); 
            }
            .footer { 
                background: #f8f9fa; 
                padding: 20px; 
                text-align: center; 
                font-size: 12px; 
                color: #666; 
            }
            .creators { 
                margin-top: 15px; 
                padding-top: 15px; 
                border-top: 1px solid #eee; 
                font-style: italic; 
            }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>\u{1F389} Great News!</h1>
                <p>Your awaited product is back in stock</p>
            </div>
            
            <div class="content">
                <p>Hello there! \u{1F44B}</p>
                
                <p>We're excited to let you know that the product you've been waiting for is now available again!</p>
                
                <div class="product-info">
                    ${product.image ? `<img src="${product.image}" alt="${product.name}" style="max-width: 100%; height: auto; border-radius: 5px; margin-bottom: 15px;">` : ""}
                    <div class="product-name">${product.name}</div>
                    <div class="product-price">\u20B9${product.price}</div>
                    <div class="stock-info">\u{1F525} Only ${quantity} units available - Order quickly!</div>
                </div>
                
                <p>Don't wait too long - popular items like this tend to sell out fast!</p>
                
                <div style="text-align: center;">
                    <a href="${productUrl}" class="cta-button">
                        \u{1F6D2} Order Now Before It's Gone!
                    </a>
                </div>
                
                <p style="font-size: 14px; color: #666; margin-top: 30px;">
                    You're receiving this email because you subscribed to get notified when this product comes back in stock. 
                    If you no longer wish to receive these notifications, you can unsubscribe at any time.
                </p>
            </div>
            
            <div class="footer">
                <p>Happy Shopping! \u{1F6CD}\uFE0F</p>
                <div class="creators">
                    <strong>Made with \u2764\uFE0F by Nisarg & Harsh</strong>
                </div>
            </div>
        </div>
    </body>
    </html>
  `;
};
var fakeNotify = async (email, productId, telegramUsername) => {
  try {
    const product = await Product.findOne({ productId });
    if (!product) {
      console.error(`Product with ID ${productId} not found.`);
      return;
    }
    const productUrl = `https://shop.amul.com/en/product/${product.alias}`;
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: `\u{1F389} ${product.name} is Back in Stock!`,
      html: generateEmailHTML(product, productUrl, product.inventoryQuantity)
    };
    try {
      await transporter.sendMail(mailOptions);
      console.log(`\u{1F4E7} Test email notification sent to ${email} for product ${product.name}`);
    } catch (emailError) {
      console.error(`\u274C Failed to send test email to ${email}:`, emailError);
    }
    if (telegramUsername) {
      try {
        const success = await telegramService.sendTestMessage(telegramUsername, product);
        if (!success) {
          console.log(`\u{1F4A1} Tip: User @${telegramUsername} should start a conversation with the bot to receive notifications`);
        }
      } catch (telegramError) {
        console.error(`\u274C Failed to send test Telegram message to @${telegramUsername}:`, telegramError);
      }
    }
  } catch (error) {
    console.error("\u274C Error sending test notification:", error instanceof Error ? error.message : "Unknown error");
  }
};

// src/services/productService.ts
var AMUL_API_URL = "https://shop.amul.com/api/1/entity/ms.products?fields[name]=1&fields[brand]=1&fields[categories]=1&fields[collections]=1&fields[alias]=1&fields[sku]=1&fields[price]=1&fields[compare_price]=1&fields[original_price]=1&fields[images]=1&fields[metafields]=1&fields[discounts]=1&fields[catalog_only]=1&fields[is_catalog]=1&fields[seller]=1&fields[available]=1&fields[inventory_quantity]=1&fields[net_quantity]=1&fields[num_reviews]=1&fields[avg_rating]=1&fields[inventory_low_stock_quantity]=1&fields[inventory_allow_out_of_stock]=1&fields[default_variant]=1&fields[variants]=1&fields[lp_seller_ids]=1&filters[0][field]=categories&filters[0][value][0]=protein&filters[0][operator]=in&filters[0][original]=1&facets=true&facetgroup=default_category_facet&limit=24&total=1&start=0&cdc=1m&substore=66505ff0998183e1b1935c75";
var fetchAndUpdateProducts = async () => {
  try {
    console.log("\u{1F504} Fetching products from Amul API...");
    const response = await import_axios2.default.get(AMUL_API_URL);
    const products = response.data.data;
    let updatedCount = 0;
    let addedCount = 0;
    let restockedCount = 0;
    for (const productData of products) {
      const existingProduct = await Product.findOne({ productId: productData._id });
      if (existingProduct) {
        const wasOutOfStock = existingProduct.inventoryQuantity === 0;
        const nowInStock = productData.inventory_quantity > 0;
        if (wasOutOfStock && nowInStock) {
          console.log(`\u{1F4E6} Product ${productData.name} is back in stock!`);
          await notifySubscribers(existingProduct, productData);
          restockedCount++;
        }
        await Product.findOneAndUpdate(
          { productId: productData._id },
          {
            inventoryQuantity: productData.inventory_quantity,
            lastChecked: /* @__PURE__ */ new Date(),
            wasOutOfStock: productData.inventory_quantity === 0,
            price: productData.price,
            name: productData.name,
            isActive: true
          }
        );
        updatedCount++;
      } else {
        const newProduct = new Product({
          productId: productData._id,
          name: productData.name,
          alias: productData.alias,
          price: productData.price,
          inventoryQuantity: productData.inventory_quantity,
          image: productData.images && productData.images.length > 0 ? `https://shop.amul.com/s/62fa94df8c13af2e242eba16/${productData.images[0].image}` : void 0,
          brand: productData.brand,
          wasOutOfStock: productData.inventory_quantity === 0,
          isActive: true
        });
        await newProduct.save();
        addedCount++;
        console.log(`\u2795 Added new product: ${productData.name}`);
      }
    }
    console.log(`\u2705 Products sync completed - Updated: ${updatedCount}, Added: ${addedCount}, Restocked: ${restockedCount}`);
  } catch (error) {
    console.error("\u274C Error fetching products:", error instanceof Error ? error.message : "Unknown error");
    throw error;
  }
};

// src/services/cronService.ts
var startCronJobs = () => {
  setInterval(async () => {
    console.log("\u23F0 Running scheduled inventory check...");
    try {
      await fetchAndUpdateProducts();
    } catch (error) {
      console.error("\u274C Scheduled inventory check failed:", error);
    }
  }, 6e4);
  console.log("\u2705 Cron jobs started successfully");
};

// src/routes/productRoutes.ts
var import_express = require("express");

// src/controllers/productController.ts
var getAllProducts = async (_req, res) => {
  try {
    const products = await Product.find().sort({ name: 1 });
    const response = {
      success: true,
      data: products
    };
    res.json(response);
  } catch (error) {
    const response = {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error"
    };
    res.status(500).json(response);
  }
};
var getProductById = async (req, res) => {
  try {
    const product = await Product.findOne({ productId: req.params.id });
    if (!product) {
      const response2 = {
        success: false,
        error: "Product not found"
      };
      res.status(404).json(response2);
      return;
    }
    const response = {
      success: true,
      data: product
    };
    res.json(response);
  } catch (error) {
    const response = {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error"
    };
    res.status(500).json(response);
  }
};
var refreshProducts = async (_req, res) => {
  try {
    await fetchAndUpdateProducts();
    const response = {
      success: true,
      message: "Products refreshed successfully"
    };
    res.json(response);
  } catch (error) {
    const response = {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error"
    };
    res.status(500).json(response);
  }
};

// src/routes/productRoutes.ts
var router = (0, import_express.Router)();
router.get("/", getAllProducts);
router.get("/:id", getProductById);
router.post("/refresh", refreshProducts);
var productRoutes_default = router;

// src/routes/subscriptionRoutes.ts
var import_express2 = require("express");

// src/controllers/subscriptionController.ts
var subscribeToProduct = async (req, res) => {
  try {
    const { email, productId, telegramUsername } = req.body;
    if (!email || !productId) {
      const response2 = {
        success: false,
        error: "Email and productId are required"
      };
      res.status(400).json(response2);
      return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      const response2 = {
        success: false,
        error: "Invalid email format"
      };
      res.status(400).json(response2);
      return;
    }
    if (telegramUsername) {
      const telegramRegex = /^[a-zA-Z0-9_]{5,32}$/;
      const cleanUsername = telegramUsername.replace("@", "");
      if (!telegramRegex.test(cleanUsername)) {
        const response2 = {
          success: false,
          error: "Invalid Telegram username format (5-32 characters, letters, numbers, underscores only)"
        };
        res.status(400).json(response2);
        return;
      }
    }
    const product = await Product.findOne({ productId });
    if (!product) {
      const response2 = {
        success: false,
        error: "Product not found"
      };
      res.status(404).json(response2);
      return;
    }
    const existingSubscription = await Subscription.findOne({ email, productId });
    if (existingSubscription) {
      if (existingSubscription.isActive) {
        if (telegramUsername) {
          existingSubscription.telegramUsername = telegramUsername.replace("@", "");
          await existingSubscription.save();
        }
        const response2 = {
          success: false,
          error: "Already subscribed to this product"
        };
        res.status(400).json(response2);
        return;
      } else {
        existingSubscription.isActive = true;
        if (telegramUsername) {
          existingSubscription.telegramUsername = telegramUsername.replace("@", "");
        }
        await existingSubscription.save();
        const response2 = {
          success: true,
          message: "Subscription reactivated successfully"
        };
        res.json(response2);
        return;
      }
    }
    const subscriptionData = {
      email,
      productId
    };
    if (telegramUsername) {
      subscriptionData.telegramUsername = telegramUsername.replace("@", "");
    }
    const subscription = new Subscription(subscriptionData);
    await subscription.save();
    const response = {
      success: true,
      message: "Successfully subscribed to product notifications"
    };
    res.json(response);
  } catch (error) {
    const response = {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error"
    };
    res.status(500).json(response);
  }
};
var unsubscribeFromProduct = async (req, res) => {
  try {
    const { email, productId } = req.body;
    const subscription = await Subscription.findOne({ email, productId });
    if (!subscription) {
      const response2 = {
        success: false,
        error: "Subscription not found"
      };
      res.status(404).json(response2);
      return;
    }
    subscription.isActive = false;
    await subscription.save();
    const response = {
      success: true,
      message: "Successfully unsubscribed"
    };
    res.json(response);
  } catch (error) {
    const response = {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error"
    };
    res.status(500).json(response);
  }
};
var getUserSubscriptions = async (req, res) => {
  try {
    const email = req.params.email;
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      const response2 = {
        success: false,
        error: "Invalid email format"
      };
      res.status(400).json(response2);
      return;
    }
    const subscriptions = await Subscription.find({
      email,
      isActive: true
    });
    const subscriptionsWithProducts = [];
    for (const sub of subscriptions) {
      const product = await Product.findOne({ productId: sub.productId });
      if (product) {
        subscriptionsWithProducts.push(__spreadProps(__spreadValues({}, sub.toObject()), {
          product
        }));
      }
    }
    const response = {
      success: true,
      data: subscriptionsWithProducts
    };
    res.json(response);
  } catch (error) {
    const response = {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error"
    };
    res.status(500).json(response);
  }
};

// src/routes/subscriptionRoutes.ts
var router2 = (0, import_express2.Router)();
router2.post("/subscribe", subscribeToProduct);
router2.post("/unsubscribe", unsubscribeFromProduct);
router2.get("/subscriptions/:email", getUserSubscriptions);
var subscriptionRoutes_default = router2;

// src/routes/healthRoutes.ts
var import_express3 = require("express");
var router3 = (0, import_express3.Router)();
router3.get("/health", (_req, res) => {
  const response = {
    success: true,
    message: "Server is healthy",
    data: {
      status: "OK",
      timestamp: (/* @__PURE__ */ new Date()).toISOString(),
      uptime: process.uptime(),
      environment: process.env.NODE_ENV || "development"
    }
  };
  res.json(response);
});
var healthRoutes_default = router3;

// src/routes/testEmailRoutes.ts
var import_express4 = require("express");
var router4 = (0, import_express4.Router)();
router4.post("/test-notification", async (req, res) => {
  try {
    const { email, productId, telegramUsername } = req.body;
    if (!email || !productId) {
      res.status(400).json({
        success: false,
        error: "Email and productId are required"
      });
      return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      res.status(400).json({
        success: false,
        error: "Invalid email format"
      });
      return;
    }
    if (telegramUsername) {
      const telegramRegex = /^[a-zA-Z0-9_]{5,32}$/;
      const cleanUsername = telegramUsername.replace("@", "");
      if (!telegramRegex.test(cleanUsername)) {
        res.status(400).json({
          success: false,
          error: "Invalid Telegram username format"
        });
        return;
      }
    }
    await fakeNotify(email, productId, telegramUsername);
    const notificationTypes = ["email"];
    if (telegramUsername) {
      notificationTypes.push("telegram");
    }
    res.json({
      success: true,
      message: `Test notifications sent via ${notificationTypes.join(" and ")}`
    });
  } catch (error) {
    console.error("\u274C Error sending test notification:", error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : "Unknown error"
    });
  }
});
var testEmailRoutes_default = router4;

// src/routes/telegramRoutes.ts
var import_express5 = require("express");
var router5 = (0, import_express5.Router)();
router5.post("/webhook", async (req, res) => {
  var _a, _b, _c;
  try {
    const update = req.body;
    if (((_a = update.message) == null ? void 0 : _a.text) === "/start" && ((_c = (_b = update.message) == null ? void 0 : _b.from) == null ? void 0 : _c.username)) {
      await telegramService.handleBotStart(
        update.message.from.username,
        update.message.chat.id
      );
      console.log(`\u{1F4F1} New user @${update.message.from.username} started the bot`);
    }
    res.status(200).send("OK");
  } catch (error) {
    console.error("\u274C Error handling Telegram webhook:", error);
    res.status(500).send("Error");
  }
});
var telegramRoutes_default = router5;

// src/server.ts
import_dotenv3.default.config();
var app = (0, import_express6.default)();
var PORT = process.env.PORT || 3e3;
app.use((0, import_cors.default)());
app.use(import_express6.default.json());
app.use(import_express6.default.static("public"));
app.use("/api", testEmailRoutes_default);
app.use("/api/products", productRoutes_default);
app.use("/api", subscriptionRoutes_default);
app.use("/api/telegram", telegramRoutes_default);
app.use("/", healthRoutes_default);
app.get("/", (_req, res) => {
  res.send("Testing Route");
});
async function startServer() {
  try {
    await connectDB();
    console.log("Fetching initial product data...");
    await fetchAndUpdateProducts();
    console.log("Initial data fetch completed");
    startCronJobs();
    app.listen(PORT, () => {
      console.log(`\u{1F680} Server running on port ${PORT}`);
      console.log(`\u{1F4CA} Health check: http://localhost:${PORT}/health`);
      console.log(`\u{1F310} Backend: http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error("Failed to start server:", error);
    process.exit(1);
  }
}
startServer();
var server_default = app;
//# sourceMappingURL=server.js.map