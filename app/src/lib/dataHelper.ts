import type { AgentDocument } from '$lib/ORM/models/agent';
import { FeedbackString, type FeedbackDocType } from '$lib/ORM/models/feedback';
import { LinkStatuses, LinkString, type LinkDocType } from '$lib/ORM/models/link';
import type { TalentDocument } from '$lib/ORM/models/talent';
import { womensNames } from '$lib/womensNames';
import { nanoid } from 'nanoid';
import spacetime from 'spacetime';
import { uniqueNamesGenerator } from 'unique-names-generator';
import { v4 as uuidv4 } from 'uuid';

const names = womensNames;

const profileImageUrls = [
	'https://pcall.infura-ipfs.io/ipfs/QmaKAWmpMsXQByYGjEHMkgqJ7yqL83SNaVuVFB7mJQpSes?filename=2021-11-18%2014.00.27.jpg',
	'https://pcall.infura-ipfs.io/ipfs/QmbV8vmvuH3U1CVyeAGWfxjFQvFNaL2hgCqCXDJDJiN5BL?filename=2021-12-14%2019.52.25.jpg',
	'https://pcall.infura-ipfs.io/ipfs/QmUN8ddoNKkRVv3ZZRUhBdKNyWfR291D8wKM2rho2sbdXf?filename=247289629_397574162101040_3979535765945784308_n.jpeg',
	'https://pcall.infura-ipfs.io/ipfs/QmVvC8jWuK3qxpgfbbaeAyuRNRbc4zYSoWihqCbUfHnA7P?filename=248384193_4432155843488380_4080524769054010663_n.jpeg',
	'https://pcall.infura-ipfs.io/ipfs/QmNxLkhrkpJWt7sbPm8Sn4XDkNnduSxvf73JMvoTdMvtDG?filename=248604567_311912817436224_5994346270940402029_n.jpeg',
	'https://pcall.infura-ipfs.io/ipfs/QmfUcAFx59kz1nEJq3YWcxqHHQYH6eavBxUvq1ctTGWJfJ?filename=248722981_3157957017813301_2270320996961787405_n.jpeg',
	'https://pcall.infura-ipfs.io/ipfs/QmWuo4iKhGkCprNaDT39BrcNMk5XaGZskoBcNLxv2jrMaH?filename=249774677_563515501769728_3634406438987913259_n.jpeg',
	'https://pcall.infura-ipfs.io/ipfs/Qmf4Ne8j7LzGVJduaNmvphuwd6XRLBp7efMLNECAcEQ7je?filename=254119357_714898156145753_4416622477076308497_n.jpeg',
	'https://pcall.infura-ipfs.io/ipfs/QmXPpGNGbaKRREqPVAV3WhiqXSVai4jxq4knxUjKVHVtdn?filename=258845424_709602400453472_5622152556683809621_n.jpeg',
	'https://pcall.infura-ipfs.io/ipfs/QmevBfbNqGXzJNwdDSUfKDHHnmySfxm2iYzaUtKq4kStnw?filename=258897791_529078775016232_1211105647728125650_n.jpeg',
	'https://pcall.infura-ipfs.io/ipfs/QmP3YsdRiZR9Q9YfcGXWUHe4pP33hNmofEnx1XUrqNH59V?filename=259216460_929079844405944_2635214622802878102_n.jpeg',
	'https://pcall.infura-ipfs.io/ipfs/QmSRJjPwKCkcyksnp9PGWPb7avGb55LxJfp5pBhthgTR3g?filename=259313545_651215129658499_3037654199586469771_n.jpeg',
	'https://pcall.infura-ipfs.io/ipfs/QmVQp7kikkANPgCJo49qwgdjgwc8Mkm58wVEaDJdJWmkrd?filename=259829562_607124923931201_783681343621850570_n.jpeg',
	'https://pcall.infura-ipfs.io/ipfs/QmNZDqHKRpwefMB4TZSsZLdyRNAZGHFv51jyPL3JDWwG9r?filename=259836903_269393888374906_6304143842751589430_n.jpeg',
	'https://pcall.infura-ipfs.io/ipfs/QmeMUL2DF4VdjJ45m5HnjBWjE7jVgTaifxS8h1XEHAUYrf?filename=260476740_313562300427385_7266403908700923209_n.jpeg',
	'https://pcall.infura-ipfs.io/ipfs/QmdgPqQVf5QKy23yLxe6nvsqFixEAPC3EWPMeh3udmBeV2?filename=260760617_730868744547595_2879752483101112227_n.jpeg',
	'https://pcall.infura-ipfs.io/ipfs/QmfS7ZWJMWA9pMrNtEnfW3DyoNfHp3LYvD6KyLwaXTKMrT?filename=261478532_998755940719764_937835868012871729_n.jpeg',
	'https://pcall.infura-ipfs.io/ipfs/QmYaQYPNx4yZtueBq3CW1bzxm8oycS4ApkELg3UkX3MDif?filename=263773895_337176131585823_837216425992214566_n.jpeg',
	'https://pcall.infura-ipfs.io/ipfs/QmevFwbyHeVFBe6TP2JRxe2r1unqGJDEqJMxy1gBRsygrt?filename=264010464_290917709645096_8307873562829868289_n.jpeg',
	'https://pcall.infura-ipfs.io/ipfs/QmcW9MZGx2UaaZkXj3i31KEmVTELM3u2q41UwMVypoQ3wA?filename=265266431_1061108477793485_1496418149462815994_n.jpeg',
	'https://pcall.infura-ipfs.io/ipfs/QmcjyiVufa7zHZVZeCzfr8Ra8uuJrJFiQUtcbiTVwjStDs?filename=265570302_2959941870932683_8670358097485670837_n.jpeg',
	'https://pcall.infura-ipfs.io/ipfs/QmXLstkW1oLvcxzpfFSrz2cru9fE37WksobQ9gfYGEyoto?filename=265615185_300328851872724_148797833048747750_n.jpeg',
	'https://pcall.infura-ipfs.io/ipfs/QmQemzd1t1QormQctzCJH3TxF8b1ro7DDEvTkYqgcgN179?filename=265624746_718266912481588_5736966446373157921_n.jpeg',
	'https://pcall.infura-ipfs.io/ipfs/Qmez8feDWECfUZhmDwrJk2tuZymAhwh9skKDnXYpEWGw6X?filename=267571575_284077180433574_7982436933756852482_n.jpeg',
	'https://pcall.infura-ipfs.io/ipfs/QmWYJEjuAKRNWcStgREBtnYeNcTwT6yVMHRtrm9xpusQiV?filename=269165828_1335886283519646_1028280590026415409_n.jpeg',
	'https://pcall.infura-ipfs.io/ipfs/QmUUGzAdikeq3Atnp92dKPaCzeRdAQTKw7ef4koBjRLqxj?filename=269670589_264057749154930_5652168677962690913_n.jpeg',
	'https://pcall.infura-ipfs.io/ipfs/Qmb1UbfDQCzaiQE7W9ahKcwZeLnjP4sK3VZc83VBCaxdRT?filename=269718506_981635155769981_560863305455109584_n.jpeg',
	'https://pcall.infura-ipfs.io/ipfs/Qmc3C6zwQn4AFDorYEQtZbkamW5eeMfGXGJbNdCYP2wZbX?filename=269963567_465646188285300_2534181617544807339_n.jpeg',
	'https://pcall.infura-ipfs.io/ipfs/QmTSAPZGb1LgTYM6omfTNqBmTBzuhDKvPoAnm6V6h4bYag?filename=271402432_462191765419212_2087698347404054761_n.jpeg',
	'https://pcall.infura-ipfs.io/ipfs/QmTcSk9B8vu2ASkMD53v34njK49r3XfkxBZ3uiJx9HhaFX?filename=271592774_622718935609511_7165429491274890829_n.jpeg',
	'https://pcall.infura-ipfs.io/ipfs/QmcW9MZGx2UaaZkXj3i31KEmVTELM3u2q41UwMVypoQ3wA?filename=265266431_1061108477793485_1496418149462815994_n.jpeg',
	'https://pcall.infura-ipfs.io/ipfs/QmcjyiVufa7zHZVZeCzfr8Ra8uuJrJFiQUtcbiTVwjStDs?filename=265570302_2959941870932683_8670358097485670837_n.jpeg',
	'https://pcall.infura-ipfs.io/ipfs/QmXLstkW1oLvcxzpfFSrz2cru9fE37WksobQ9gfYGEyoto?filename=265615185_300328851872724_148797833048747750_n.jpeg',
	'https://pcall.infura-ipfs.io/ipfs/QmQemzd1t1QormQctzCJH3TxF8b1ro7DDEvTkYqgcgN179?filename=265624746_718266912481588_5736966446373157921_n.jpeg',
	'https://pcall.infura-ipfs.io/ipfs/Qmez8feDWECfUZhmDwrJk2tuZymAhwh9skKDnXYpEWGw6X?filename=267571575_284077180433574_7982436933756852482_n.jpeg',
	'https://pcall.infura-ipfs.io/ipfs/QmWYJEjuAKRNWcStgREBtnYeNcTwT6yVMHRtrm9xpusQiV?filename=269165828_1335886283519646_1028280590026415409_n.jpeg',
	'https://pcall.infura-ipfs.io/ipfs/QmUUGzAdikeq3Atnp92dKPaCzeRdAQTKw7ef4koBjRLqxj?filename=269670589_264057749154930_5652168677962690913_n.jpeg'
];

export const generateTalent = async (agent: AgentDocument) => {
	const name: string = uniqueNamesGenerator({
		dictionaries: [names]
	});
	const profileImageUrl = profileImageUrls[Math.floor(Math.random() * profileImageUrls.length)];
	const talent = await agent.createTalent(name, 10, profileImageUrl);
	const count = Math.floor(Math.random() * 100) + 1;
	await generateLinks(talent, count);
	return talent;
};

const generateLinks = (talent: TalentDocument, count: number) => {
	const links: LinkDocType[] = [];
	const feedbacks: FeedbackDocType[] = [];

	// Create completedCalls
	for (let i = 0; i < count; i++) {
		const key = nanoid();
		const amount = Math.floor(Math.random() * 1000) + 1;
		const callStart = spacetime.now().subtract(Math.floor(Math.random() * 45) + 1, 'day');
		const callEnd = callStart.add(1, 'hour');
		const _feedback = {
			_id: `${FeedbackString}:f${key}`,
			entityType: FeedbackString,
			createdAt: new Date().getTime(),
			updatedAt: new Date().getTime(),
			rejected: 0,
			disconnected: 0,
			unanswered: 0,
			viewed: 0,
			rating: Math.floor(Math.random() * 5) + 1,
			link: `${LinkString}:l${key}`,
			talent: talent._id,
			agent: talent.agent
		};
		const _link = {
			status: LinkStatuses.COMPLETED,
			amount,
			fundedAmount: amount,
			walletAddress: '0x251281e1516e6E0A145d28a41EE63BfcDd9E18Bf',
			callId: uuidv4(),
			talentName: talent.name,
			talent: talent._id,
			profileImageUrl: talent.profileImageUrl,
			_id: `${LinkString}:l${key}`,
			createdAt: new Date().getTime(),
			updatedAt: new Date().getTime(),

			entityType: LinkString,
			feedback: `${FeedbackString}:f${key}`,
			agent: talent.agent,
			callStart: callStart.epoch,
			callEnd: callEnd.epoch
		};
		links.push(_link);
		feedbacks.push(_feedback);
	}

	const db = talent.collection.database;
	db.links.bulkInsert(links);
	db.feedbacks.bulkInsert(feedbacks);
};
