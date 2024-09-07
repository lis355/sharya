export default class TinyId {
	static TINY_ID_CHARACTERS = ["bcdefghijklmnopqrstuvwxyz", "aeiouy"];
	static TINY_ID_LENGTH = 4;

	constructor(tinyId) {
		if (tinyId instanceof TinyId) return new TinyId(tinyId.toString());

		this.id = String(tinyId);
	}

	static generate() {
		let str = "";
		for (let i = 0; i < TinyId.TINY_ID_LENGTH; i++) {
			const array = TinyId.TINY_ID_CHARACTERS[i % TinyId.TINY_ID_CHARACTERS.length];
			str += array[Math.floor(Math.random() * array.length)];
		}

		return new TinyId(str);
	}

	toString() {
		return this.id;
	}
}
