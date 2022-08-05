import type { RequestHandler } from '@sveltejs/kit';
export const POST: RequestHandler = async ({ request }) => {
	const body = await request.json();
	const talentId = body.talentId;
	const imgData = body.imgData;

	if (!talentId || !imgData) {
		return {
			status: 400
		};
	}
};

async function upload() {
		const { SkynetClient } = await import('skynet-js');
		try {
			const client = new SkynetClient(SKYNET_URL);
			const { skylink } = await client.uploadFile(file, { onUploadProgress });
			const skylinkUrl = await client.getSkylinkUrl(skylink); // TODO:Abstract the domain to allow multiple domains
			profileImage = skylinkUrl;
			callBack(skylinkUrl);
			progressVisibility = 'invisible';
			uploadProgress = 0;
		} catch (error) {
			console.log(error);
		}
	}
}
