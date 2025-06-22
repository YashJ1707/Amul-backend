// services/telegramService.ts
import axios from 'axios';
import { IProduct } from '@/types';
import TelegramBot from 'node-telegram-bot-api';
import { Product } from '@/models/Product';
import { Subscription } from '@/models/Subscription';
import dotenv from 'dotenv';
import { getProductsByLocation } from './productService';
import { Substore } from '@/models/Substore';

dotenv.config();

const AMUL_API_BASE_URL = 'https://shop.amul.com/api/1';

interface TelegramUser {
  id: number;
  username: string;
  first_name: string;
  last_name?: string;
}

interface TelegramChat {
  id: number;
  type: string;
  username?: string;
}

interface TelegramUpdate {
  update_id: number;
  message?: {
    message_id: number;
    from: TelegramUser;
    chat: TelegramChat;
    date: number;
    text: string;
  };
}

// Store user email addresses temporarily during email setting process
const pendingEmails = new Map<number, string>();

class TelegramService {
  private botToken: string;
  private baseUrl: string;
  private userChatIds: Map<string, number> = new Map(); // username -> chat_id mapping
  private bot: TelegramBot;
  private static instance: TelegramService;

  private constructor() {
    this.botToken = process.env.TELEGRAM_BOT_TOKEN || '';
    if (!this.botToken) {
      console.error('❌ Telegram Bot Token not provided!');
      process.exit(1);
    }
    this.baseUrl = `https://api.telegram.org/bot${this.botToken}`;
    this.bot = new TelegramBot(this.botToken, {
      polling: {
        interval: 300,
        autoStart: true,
        params: {
          timeout: 10
        }
      }
    });
    this.initializeUserMapping();
    this.setupCommandHandlers();
  }

  public static getInstance(): TelegramService {
    if (!TelegramService.instance) {
      TelegramService.instance = new TelegramService();
    }
    return TelegramService.instance;
  }

  private setupCommandHandlers(): void {
    // Start command
    this.bot.onText(/\/start/, async (msg: TelegramBot.Message) => {
      if (!msg?.chat?.id) return;
      const chatId = msg.chat.id;
      const username = msg.from?.username;
      
      if (username) {
        const existingEmail = await Subscription.getUserEmail(username);
        if (existingEmail) {
          await this.bot.sendMessage(chatId, 
            '👋 Welcome back to Amul Product Notifier!\n\n' +
            'Your email is already set: ' + existingEmail + '\n\n' +
            'Available commands:\n' +
            '/setemail - Change your email\n' +
            '/setlocation - Set your delivery pincode\n' +
            '/products - Browse and subscribe to products\n' +
            '/mysubscriptions - View your subscriptions\n' +
            '/unsubscribeall - Unsubscribe from all products\n' +
            '/help - Show this help message\n\n' +
            '📧 For any support, contact: thakkarnisarg@gmail.com'
          );
          return;
        }
      }

      await this.bot.sendMessage(chatId, 
        '👋 Welcome to Amul Product Notifier!\n\n' +
        'Available commands:\n' +
        '/setemail - Set your email for notifications\n' +
        '/setlocation - Set your delivery pincode\n' +
        '/products - Browse and subscribe to products\n' +
        '/mysubscriptions - View your subscriptions\n' +
        '/unsubscribeall - Unsubscribe from all products\n' +
        '/help - Show this help message\n\n' +
        '📧 For any support, contact: thakkarnisarg@gmail.com'
      );
    });

    // Help command
    this.bot.onText(/\/help/, async (msg: TelegramBot.Message) => {
      if (!msg?.chat?.id) return;
      const chatId = msg.chat.id;
      await this.bot.sendMessage(chatId, 
        '📋 Available commands:\n\n' +
        '/setemail - Set your email for notifications\n' +
        '/setlocation - Set your delivery pincode\n' +
        '/products - Browse and subscribe to products\n' +
        '/mysubscriptions - View your subscriptions\n' +
        '/unsubscribeall - Unsubscribe from all products\n' +
        '/help - Show this help message\n\n' +
        '📧 For any support, contact: thakkarnisarg@gmail.com'
      );
    });

    // Set email command
    this.bot.onText(/\/setemail/, async (msg: TelegramBot.Message) => {
      if (!msg?.chat?.id) return;
      const chatId = msg.chat.id;
      await this.bot.sendMessage(chatId, 'Please enter your email address:');
      pendingEmails.set(chatId, 'waiting');
    });

    // Set location command
    this.bot.onText(/\/setlocation/, async (msg: TelegramBot.Message) => {
      if (!msg?.chat?.id) return;
      const chatId = msg.chat.id;
      console.log(`[TG] User ${msg.from?.username} (${chatId}) issued /setlocation`);
      await this.bot.sendMessage(chatId, 
        '📍 Please enter your 6-digit pincode to set your location.'
      );
      pendingEmails.set(chatId, 'waiting_for_pincode');
    });

    // Products command
    this.bot.onText(/\/products/, async (msg: TelegramBot.Message) => {
      if (!msg?.chat?.id) return;
      const chatId = msg.chat.id;
      const username = msg.from?.username;
      const email = await this.getUserEmail(chatId, username);
      const userSub = await Subscription.findOne({ telegramUsername: username, isActive: true });
      console.log(await Subscription.find());
      
      console.log(`[TG] /products command - User subscription details:`, {
        username,
        email,
        state: "Pune-Br",
        substoreId: "66506004a7cddee1b8adb014",
        pincode: 411036
      });
      if (!email || email === 'waiting') {
        await this.bot.sendMessage(chatId, '❌ Please set your email and location (6-digit pincode) first using /setemail and /setlocation.');
        return;
      }
      // if (!userSub?.substoreId) {
      //   await this.bot.sendMessage(chatId, '❌ Sorry, we could not determine your delivery region for this pincode. Please try a different pincode using /setlocation.');
      //   return;
      // }
      try {
        const substoreId = "66506004a7cddee1b8adb014";
        console.log(`[TG] Using substore ID for products: ${substoreId}`);
        const products = await getProductsByLocation(substoreId);
        if (products.length === 0) {
          await this.bot.sendMessage(chatId, 'No products available at the moment.');
          return;
        }

        const keyboard = products.map(product => [{
          text: `${product.name} - ₹${product.price} ${product.available === true ? '🟢' : '🔴'}`,
          callback_data: `product_${product.productId}`
        }]);

        await this.bot.sendMessage(chatId, 
          '📋 Available Products:\n' +
          '🟢 - In Stock\n' +
          '🔴 - Out of Stock\n\n' +
          'Click on a product to view details and subscribe.',
          {
            reply_markup: {
              inline_keyboard: keyboard
            }
          }
        );
      } catch (error) {
        console.error('Error fetching products:', error);
        await this.bot.sendMessage(chatId, '❌ Error fetching products. Please try again later.');
      }
    });

    // Callback query handler
    this.bot.on('callback_query', async (callbackQuery: TelegramBot.CallbackQuery) => {
      if (!callbackQuery?.message?.chat?.id || !callbackQuery.data) return;
      const chatId = callbackQuery.message.chat.id;
      const username = callbackQuery.from.username;
      const data = callbackQuery.data;
      const email = await this.getUserEmail(chatId, username);
      if (!email || email === 'waiting') {
        await this.bot.answerCallbackQuery(callbackQuery.id, {
          text: '❌ Please set your email first using /setemail',
          show_alert: true
        });
        return;
      }
      // Handle different callback types
      if (data.startsWith('product_')) {
        await this.handleProductCallback(callbackQuery, data, email);
      } else if (data.startsWith('subscribe_')) {
        await this.handleSubscribeCallback(callbackQuery, data, email);
      } else if (data.startsWith('unsubscribe_')) {
        await this.handleUnsubscribeCallback(callbackQuery, data, email);
      } else if (data === 'unsubscribe_all') {
        await this.handleUnsubscribeAllCallback(callbackQuery, email);
      }
    });

    // Message handler for email and pincode input
    this.bot.on('message', async (msg: TelegramBot.Message) => {
      if (!msg?.chat?.id || !msg.text) return;
      const chatId = msg.chat.id;
      const text = msg.text;
      const username = msg.from?.username;
      console.log(msg);
      console.log(`[TG] Message from ${username} (${chatId}): ${text}`);
      if (!username) return;
      const state = pendingEmails.get(chatId);
      if (state === 'waiting_for_pincode') {
        await this.handlePincodeInput(chatId, text, username);
      } else if (state === 'waiting') {
        await this.handleEmailInput(chatId, text, username);
      }
    });
  }

  private async handlePincodeInput(chatId: number, text: string, username: string | undefined): Promise<void> {
    console.log(`[TG] handlePincodeInput: chatId=${chatId}, username=${username}, pincode=${text}`);
    if (!username) {
      console.log(`[TG] No username for chatId=${chatId}`);
      await this.bot.sendMessage(chatId, '❌ Could not determine your Telegram username.');
      return;
    }
    const pincodeRegex = /^\d{6}$/;
    if (!pincodeRegex.test(text)) {
      console.log(`[TG] Invalid pincode format: ${text}`);
      await this.bot.sendMessage(chatId, '❌ Please enter a valid 6-digit pincode.');
      return;
    }
    try {
      // Use Amul API to get substore/state for the pincode
      console.log(`[TG] Querying Amul API for pincode: ${text}`);
      const response = await axios.get(`${AMUL_API_BASE_URL}/entity/pincode`, {
        params: {
          limit: 10,
          'filters[0][field]': 'pincode',
          'filters[0][value]': text,
          'filters[0][operator]': 'regex',
          'cf_cache': '1h'
        },
        headers: {
          'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/137.0.0.0 Safari/537.36',
          'Accept': 'application/json, text/plain, */*'
        }
      });
      console.log('[TG] Full Amul API response:', response.data);
      const records = response.data.data || [];
      console.log('[TG] All records:', records);
      records.forEach((r: any, i: number) => {
        console.log(`[TG] Record[${i}] pincode:`, r.pincode, 'type:', typeof r.pincode, 'trimmed:', String(r.pincode).trim());
      });
      // Try to find exact match, fallback to first record if only one
      let record = records.find((r: any) => String(r.pincode).trim() === text.trim());
      if (!record && records.length === 1) {
        record = records[0];
      }
      console.log(`[TG] Amul API response for pincode ${text}:`, record);
      if (!record) {
        console.log(`[TG] No record found for pincode ${text}`);
        await this.bot.sendMessage(chatId, '❌ Could not determine state for this pincode. Please try another pincode.');
        return;
      }
      // Prefer state from Amul API, fallback to substore alias if needed
      let state = record.state || (record.substore ? (record.substore.charAt(0).toUpperCase() + record.substore.slice(1)) : null);
      let substoreDoc = null;
      let substoreId = null;
      console.log(`[TG] Raw state from Amul API: '${state}'`);
      if (state) {
        state = state.trim();
        console.log(`[TG] Trimmed state for lookup: '${state}'`);
        // Find substore by state name (case-insensitive)
        substoreDoc = await Substore.findOne({ name: new RegExp(`^${state}$`, 'i') });
        console.log(await Substore.find({}));
        
        console.log(`[TG] Substore lookup result for state '${state}':`, substoreDoc);
        if (substoreDoc) {
          substoreId = substoreDoc.substoreId;
        }
      }
      if (!substoreId) {
        await this.bot.sendMessage(chatId, `❌ Sorry, we could not find a delivery region for your state (${state}). Please try another pincode.`);
        pendingEmails.delete(chatId);
        return;
      }
      // Save state and substoreId in Subscription
      await Subscription.updateMany(
        { telegramUsername: username, isActive: true },
        {
          $set: {
            pincode: text,
            state,
            substoreId
          }
        }
      );
      console.log(`[TG] Location set for user ${username} (${chatId}): state=${state}, substoreId=${substoreId}`);
      await this.bot.sendMessage(chatId, 
        `✅ Location set successfully!\n\n` +
        `📍 State: ${state}\n` +
        `You can now browse products available in your area using /products`
      );
    } catch (error) {
      console.error('[TG] Error setting location:', error);
      await this.bot.sendMessage(chatId, '❌ Error setting location. Please try again.');
    }
    pendingEmails.delete(chatId);
  }

  private async handleEmailInput(chatId: number, text: string, username: string): Promise<void> {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(text)) {
      await this.bot.sendMessage(chatId, '❌ Invalid email format. Please try again:');
      return;
    }

    await Subscription.updateMany(
      { telegramUsername: username },
      { $set: { email: text } }
    );

    pendingEmails.set(chatId, text);
    await this.bot.sendMessage(chatId, 
      `✅ Email set successfully: ${text}\n` +
      'You can now use /products to view available products and /mysubscriptions to view your subscriptions.'
    );
  }

  private async getUserEmail(chatId: number, username?: string): Promise<string | null> {
    if (username) {
      const email = await Subscription.getUserEmail(username);
      if (email) return email;
    }
    return pendingEmails.get(chatId) || null;
  }

  private async initializeUserMapping(): Promise<void> {
    try {
      const updates = await this.getUpdates();
      for (const update of updates) {
        if (update.message?.from?.username && update.message?.chat?.id) {
          this.userChatIds.set(update.message.from.username, update.message.chat.id);
        }
      }
      console.log(`📱 Initialized Telegram user mapping for ${this.userChatIds.size} users`);
    } catch (error) {
      console.error('❌ Failed to initialize Telegram user mapping:', error);
    }
  }

  private async getUpdates(): Promise<TelegramUpdate[]> {
    try {
      const response = await axios.get(`${this.baseUrl}/getUpdates`);
      return response.data.result || [];
    } catch (error) {
      console.error('❌ Failed to get Telegram updates:', error);
      return [];
    }
  }

  async sendProductNotification(username: string, product: IProduct, quantity: number, pincode?: string, substore?: string): Promise<boolean> {
    try {
      const chatId = await this.getChatId(username);
      if (!chatId) {
        console.log(`No chat ID found for user @${username}`);
        return false;
      }

      const message = this.generateProductMessage(product, quantity, pincode, substore);
      await this.bot.sendMessage(chatId, message, { parse_mode: 'HTML' });
      return true;
    } catch (error) {
      console.error(`Error sending product notification to @${username}:`, error);
      return false;
    }
  }

  private generateProductMessage(product: IProduct, quantity: number, pincode?: string, substore?: string): string {
    const locationInfo = pincode && substore ? 
      `\n📍 Available for delivery in: ${substore} (${pincode})` : '';

    return `
🎉 <b>${product.name} is Back in Stock!</b>

💰 Price: ₹${product.price}
🔥 Only ${quantity} units available - Order quickly!${locationInfo}

🛒 <a href="https://shop.amul.com/en/product/${product.alias}">Order Now Before It's Gone!</a>
    `.trim();
  }

  private async getChatId(username: string): Promise<number | null> {
    if (this.userChatIds.has(username)) {
      return this.userChatIds.get(username)!;
    }
    await this.initializeUserMapping();
    return this.userChatIds.get(username) || null;
  }

  private async handleProductCallback(callbackQuery: TelegramBot.CallbackQuery, data: string, email: string): Promise<void> {
    const chatId = callbackQuery.message?.chat.id;
    const productId = data.replace('product_', '');

    try {
      const product = await Product.findOne({ productId });
      if (!product) {
        await this.bot.answerCallbackQuery(callbackQuery.id, {
          text: '❌ Product not found',
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

      if (product.available === true ) {
        // Product is in stock - show direct link
        const keyboard = [[{
          text: '🛒 Buy Now',
          url: productUrl
        } as TelegramBot.InlineKeyboardButton]];

        if (!existingSubscription) {
          keyboard.push([{
            text: '🔔 Subscribe for Stock Updates',
            callback_data: `subscribe_${productId}`
          } as TelegramBot.InlineKeyboardButton]);
        }

        await this.bot.editMessageText(
          `📦 <b>${product.name}</b>\n\n` +
          `💰 Price: ₹${product.price}\n` +
          `📊 Stock: ${product.inventoryQuantity} units\n` +
          `\n${existingSubscription ? '✅ You are subscribed to this product' : 'Click below to subscribe for stock updates'}`,
          {
            chat_id: chatId,
            message_id: callbackQuery.message?.message_id,
            parse_mode: 'HTML',
            reply_markup: {
              inline_keyboard: keyboard
            }
          }
        );
      } else {
        // Product is out of stock - show subscription option
        const keyboard = [[{
          text: existingSubscription ? '✅ Subscribed' : '🔔 Subscribe for Stock Updates',
          callback_data: `subscribe_${productId}`
        }]];

        await this.bot.editMessageText(
          `📦 <b>${product.name}</b>\n\n` +
          `💰 Price: ₹${product.price}\n` +
          `📊 Stock: Out of Stock\n` +
          `\n${existingSubscription ? '✅ You are subscribed to this product' : 'Click below to subscribe for stock updates'}`,
          {
            chat_id: chatId,
            message_id: callbackQuery.message?.message_id,
            parse_mode: 'HTML',
            reply_markup: {
              inline_keyboard: keyboard
            }
          }
        );
      }
    } catch (error) {
      console.error('Error handling product selection:', error);
      await this.bot.answerCallbackQuery(callbackQuery.id, {
        text: '❌ Error processing request. Please try again later.',
        show_alert: true
      });
    }
  }

  private async handleSubscribeCallback(callbackQuery: TelegramBot.CallbackQuery, data: string, email: string): Promise<void> {
    const chatId = callbackQuery.message?.chat.id;
    const username = callbackQuery.from.username;
    const productId = data.replace('subscribe_', '');

    try {
      const product = await Product.findOne({ productId });
      if (!product) {
        await this.bot.answerCallbackQuery(callbackQuery.id, {
          text: '❌ Product not found',
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
        await this.bot.answerCallbackQuery(callbackQuery.id, {
          text: '✅ You are already subscribed to this product!',
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

      await this.bot.answerCallbackQuery(callbackQuery.id, {
        text: `✅ Successfully subscribed to ${product.name}!`,
        show_alert: true
      });

      // Update the message to show subscription status
      const message = callbackQuery.message;
      if (message && message.reply_markup?.inline_keyboard) {
        const keyboard = message.reply_markup.inline_keyboard.map(row =>
          row.map(button => {
            if (button.callback_data === `subscribe_${productId}`) {
              return {
                ...button,
                text: '✅ Subscribed'
              };
            }
            return button;
          })
        );

        await this.bot.editMessageReplyMarkup(
          { inline_keyboard: keyboard },
          {
            chat_id: chatId,
            message_id: message.message_id
          }
        );
      }
    } catch (error) {
      console.error('Error subscribing to product:', error);
      await this.bot.answerCallbackQuery(callbackQuery.id, {
        text: '❌ Error subscribing to product. Please try again later.',
        show_alert: true
      });
    }
  }

  private async handleUnsubscribeCallback(callbackQuery: TelegramBot.CallbackQuery, data: string, email: string): Promise<void> {
    const chatId = callbackQuery.message?.chat.id;
    const productId = data.replace('unsubscribe_', '');

    try {
      const product = await Product.findOne({ productId });
      if (!product) {
        await this.bot.answerCallbackQuery(callbackQuery.id, {
          text: '❌ Product not found',
          show_alert: true
        });
        return;
      }

      const result = await Subscription.updateOne(
        { email, productId, isActive: true },
        { $set: { isActive: false } }
      );

      if (result.modifiedCount === 0) {
        await this.bot.answerCallbackQuery(callbackQuery.id, {
          text: '❌ No active subscription found for this product.',
          show_alert: true
        });
        return;
      }

      await this.bot.answerCallbackQuery(callbackQuery.id, {
        text: `✅ Successfully unsubscribed from ${product.name}!`,
        show_alert: true
      });

      // Update the message to remove the unsubscribed product
      const message = callbackQuery.message;
      if (message && message.reply_markup?.inline_keyboard) {
        const keyboard = message.reply_markup.inline_keyboard.filter(row => 
          !row[0].callback_data?.includes(`unsubscribe_${productId}`)
        );

        // If no subscriptions left, remove the unsubscribe all button
        if (keyboard.length === 1 && keyboard[0][0].callback_data === 'unsubscribe_all') {
          await this.bot.editMessageText(
            'You have no active subscriptions.',
            {
              chat_id: chatId,
              message_id: message.message_id
            }
          );
        } else {
          // Remove the product from the list
          const productText = `📦 <b>${product.name}</b>\n` +
                            `💰 Price: ₹${product.price}\n` +
                            `📊 Stock: ${product.inventoryQuantity > 0 ? 'In Stock' : 'Out of Stock'}\n` +
                            `🔗 <a href="https://shop.amul.com/en/product/${product.alias}">View Product</a>`;
          
          const newText = message.text?.replace(productText + '\n\n', '') || '';
          
          await this.bot.editMessageText(
            newText,
            {
              chat_id: chatId,
              message_id: message.message_id,
              parse_mode: 'HTML',
              disable_web_page_preview: true,
              reply_markup: {
                inline_keyboard: keyboard
              }
            }
          );
        }
      }
    } catch (error) {
      console.error('Error unsubscribing from product:', error);
      await this.bot.answerCallbackQuery(callbackQuery.id, {
        text: '❌ Error unsubscribing from product. Please try again later.',
        show_alert: true
      });
    }
  }

  private async handleUnsubscribeAllCallback(callbackQuery: TelegramBot.CallbackQuery, email: string): Promise<void> {
    const chatId = callbackQuery.message?.chat.id;

    try {
      const result = await Subscription.updateMany(
        { email, isActive: true },
        { $set: { isActive: false } }
      );

      if (result.modifiedCount === 0) {
        await this.bot.answerCallbackQuery(callbackQuery.id, {
          text: 'You have no active subscriptions to unsubscribe from.',
          show_alert: true
        });
        return;
      }

      await this.bot.answerCallbackQuery(callbackQuery.id, {
        text: '✅ Successfully unsubscribed from all products!',
        show_alert: true
      });

      // Update the message to show no subscriptions
      const message = callbackQuery.message;
      if (message) {
        await this.bot.editMessageText(
          'You have no active subscriptions.',
          {
            chat_id: chatId,
            message_id: message.message_id
          }
        );
      }
    } catch (error) {
      console.error('Error unsubscribing from all products:', error);
      await this.bot.answerCallbackQuery(callbackQuery.id, {
        text: '❌ Error unsubscribing from products. Please try again later.',
        show_alert: true
      });
    }
  }
}

export const telegramService = TelegramService.getInstance();