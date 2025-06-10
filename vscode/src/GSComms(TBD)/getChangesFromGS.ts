// Define the types returned from the server
export type Hunk = {
	Lines: {
		OldStart: number;
		OldLineCount: number;
		NewStart: number;
		NewLineCount: number;
	};
	Author: string;
	ContentOld: string;
	ContentNew: string;
	PleasePull: boolean;
	Branch: string;
};

export type FileDiff = {
	hunks: Hunk[];
};

export type RepoDiff = { [filename: string]: FileDiff }; // ✅ Correct: it's a map of filename → diff info

import { window } from 'vscode';

// … your types here …

export async function getGitDiffFromGitServer({
	repoID,
	UID,
	userClosestCommit,
	currFilePath
}: {
	repoID: string;
	UID: string;
	userClosestCommit: string;
	currFilePath: string;
}): Promise<RepoDiff | null> {
	// ←–– EARLY GUARD
	if (!UID) {
		window.showWarningMessage('⚠️ Cannot fetch diff: UID is not set.');
		return null;
	}

	if (!process.env.GITSERVER_URL) {
		throw new Error('Environment variable GITSERVER_URL is not defined');
	}

	console.log('🧪 Loaded GITSERVER_URL =', process.env.GITSERVER_URL);
	console.log('🧪 Loaded repoID =', repoID);
	console.log('🧪 Loaded UID =', UID);
	console.log('🧪 Loaded userClosestCommit =', userClosestCommit);
	console.log('🧪 Loaded currFilePath =', currFilePath);

	const url = new URL('/get_diff', process.env.GITSERVER_URL);

	try {
		const response = await fetch(url.toString(), {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ repoID, UID, userClosestCommit, currFilePath })
		});

		console.log('✅ Response status:', response.status);

		if (!response.ok) {
			console.error('🛑 Diff fetch failed:', {
				status: response.status,
				headers: Object.fromEntries(response.headers.entries()),
				body: await response.text()
			});
			try {
				const errJson = await response.json();
				console.error('🛑 Parsed error JSON:', errJson);
			} catch {
				/* ignore */
			}
			return null;
		}

		const data = (await response.json()) as RepoDiff;
		console.log('✅ Parsed diff response:', data);
		return data;
	} catch (error) {
		console.error('❌ Error fetching commit diff:', error);
		
		// More specific error messages
		if (error instanceof TypeError && error.message === 'fetch failed') {
			window.showErrorMessage(`❌ Unable to connect to our backend server (git server)`);
		} else {
			window.showErrorMessage('❌ Failed to fetch diff—see console for details.');
		}
		return null;
	}
}
