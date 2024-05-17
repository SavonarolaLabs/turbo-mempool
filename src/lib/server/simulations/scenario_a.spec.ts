import { beforeAll, describe, it } from 'vitest';
import { initDb } from '../db-server/db';

let db;

const userA = {
	mnemonic:
		'item stay almost tomato chronic coast art wire dust brass demise park',
	address: '9iGVEPcZk5Q6aweZXfVdgA6p7huhWJ9GtGe9pYhs6SBfJSQFEYe'
};

const userB = {
	mnemonic:
		'street sad winner stay wrong square option amused solid captain laptop october',
	address: '9f99JMoDMtygYiHeRcXvR55BxmFkcGPtHKgUrowA9maxeqQk7Xm'
};

const userC = {
	mnemonic:
		'dream inquiry truly laundry mixed have able fatigue animal mobile subway state',
	address: '9g3HxMBLh7csKkWsNnifSHWVEq9d7JrRzwzg15tQ4hbECbvP12a'
};

describe('sd', () => {
	beforeAll(() => {
		db = initDb();
	});
	it('sting is string', () => {
		console.log('Surprice motherfucker');
	});
});
