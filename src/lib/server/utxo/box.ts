import { ErgoAddress } from '@fleet-sdk/core';

export async function getContractBoxes(address: string): Promise<any> {
	const response = await fetch(
		'https://api.ergoplatform.com/api/v1/boxes/unspent/byAddress/' + address
	);
	//const response = await fetch('https://api.ergoplatform.com/api/v1/boxes/byErgoTree/'+ErgoAddress.fromBase58(address).ergoTree);
	const data = await response.json();
	const boxes = data.items.map(nautilusBox);
	return boxes;
}

export async function getBoxById(boxId: string): Promise<any> {
	const response = await fetch('https://api.ergoplatform.com/api/v1/boxes/' + boxId);
	const box = await response.json();
	return nautilusBox(box);
}

function nautilusBox(box: any): any {
	box.value = '' + box.value;
	box.assets?.forEach((a) => {
		a.amount = '' + a.amount;
	});
	Object.keys(box.additionalRegisters).forEach((k) => {
		box.additionalRegisters[k] = box.additionalRegisters[k].serializedValue;
	});
	return box;
}
