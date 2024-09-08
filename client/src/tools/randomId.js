export function randomId() {
	return Math.round(new Date().valueOf() + Math.random() * 10 ** 12).toString(16);
}
