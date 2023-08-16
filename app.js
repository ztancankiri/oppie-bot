const axios = require("axios");
const telegram = require("./telegram");
const fs = require("fs");

const TELEGRAM_INTERVAL = parseInt(process.env.TELEGRAM_INTERVAL);
const OPPIE_INTERVAL = parseInt(process.env.OPPIE_INTERVAL);
const SPAM_INTERVAL = parseInt(process.env.SPAM_INTERVAL);
const SEARCH_DATE = process.env.SEARCH_DATE;

async function getDates() {
	const response = await axios.get("https://www.cinemacity.cz/cz/data-api-service/v1/quickbook/10101/dates/in-cinema/1052/until/2024-08-07?attr=imax&lang=en_GB");
	return response.data.body.dates;
}

let chats = [];

async function broadcast(message) {
	for (chat of chats) {
		await telegram.sendMessage(chat, message);
	}
}

async function main() {
	chats = JSON.parse(fs.readFileSync("chats.json"));

	const telegramInterval = TELEGRAM_INTERVAL * 1000;
	const oppieInterval = OPPIE_INTERVAL * 1000;
	const spamInterval = SPAM_INTERVAL * 1000;

	setInterval(async () => {
		try {
			const messages = await telegram.getMessages();
			if (messages) {
				for (message of messages) {
					if (message.text == "/start") {
						if (!chats.includes(message.chat_id)) {
							chats.push(message.chat_id);
							fs.writeFileSync("chats.json", JSON.stringify(chats, null, "\t"));
							await telegram.sendMessage(message.chat_id, "You're registered in OppieBot! ☢️☢️☢️");
						} else {
							await telegram.sendMessage(message.chat_id, "You're already registered in OppieBot! ☢️☢️☢️");
						}
					} else if (message.text == "/stop") {
						if (chats.includes(message.chat_id)) {
							const index = chats.indexOf(message.chat_id);
							if (index !== -1) {
								chats = chats.splice(index, 1);
								fs.writeFileSync("chats.json", JSON.stringify(chats.splice(index, 1), null, "\t"));
								await telegram.sendMessage(message.chat_id, "You're de-registered from OppieBot! ☢️☢️☢️");
							}
						} else {
							await telegram.sendMessage(message.chat_id, "You're not registered in OppieBot! ☢️☢️☢️");
						}
					}
				}
			}
		} catch (error) {
			console.error(error);
		}
	}, telegramInterval);

	const oppieIntervalId = setInterval(async () => {
		try {
			const dates = await getDates();
			if (dates.includes(SEARCH_DATE)) {
				setInterval(async () => {
					await broadcast(JSON.stringify(dates, null, "\t"));
				}, spamInterval);

				clearInterval(oppieIntervalId);
			}
		} catch (error) {
			console.error(error);
		}
	}, oppieInterval);
}

main();
