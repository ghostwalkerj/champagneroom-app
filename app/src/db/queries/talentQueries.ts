import axios from 'axios';
import type { TalentDocument } from 'db/models/talent';
import { PCALL_API_URL } from 'lib/constants';
import urlJoin from 'url-join';

export const updateTalent = (talent: TalentDocument) => {
	const updateTalent = talent;
	if (updateTalent.currentLink) {
		delete updateTalent.currentLink;
	}
	const url = urlJoin(PCALL_API_URL, 'talent/update');
	axios.put(url, updateTalent);
};
