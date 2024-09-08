export function formatBytes(bytes, decimals = 2) {
	const k = 1024,
		sizes = ["Bytes", "KB", "MB", "GB", "TB", "PB", "EB", "ZB", "YB"],
		i = Math.floor(Math.log(bytes) / Math.log(k));

	return parseFloat((bytes / Math.pow(k, i)).toFixed(decimals)) + " " + sizes[i];
}

export function formatName(name, nameMaxLength) {
	return name.length > nameMaxLength
		? name.slice(0, nameMaxLength - 3) + "..."
		: name;
}
