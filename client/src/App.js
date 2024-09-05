import dayjs from "dayjs";
import Dropzone from "react-dropzone";
import React from "react";
import urlJoin from "url-join";

const HEADER_TOKEN = "sharya-token";

function formatBytes(bytes, decimals = 2) {
	const k = 1024,
		sizes = ["Bytes", "KB", "MB", "GB", "TB", "PB", "EB", "ZB", "YB"],
		i = Math.floor(Math.log(bytes) / Math.log(k));

	return parseFloat((bytes / Math.pow(k, i)).toFixed(decimals)) + " " + sizes[i];
}

function formatName(name, nameMaxLength) {
	return name.length > nameMaxLength
		? name.slice(0, nameMaxLength - 3) + "..."
		: name;
}

class UploadingFile {
	constructor({ name, size, percent }) {
		this.name = name;
		this.size = size;
		this.percent = percent;
	}
}

class UploadingFileRow extends React.Component {
	render() {
		const nameString = formatName(this.props.file.name, this.props.nameMaxLength);
		const sizeString = `[${formatBytes(this.props.file.size)}]`;
		const percentString = `${(this.props.file.percent * 100).toFixed(2)}%`;

		return (
			<tr>
				<td>{nameString}</td>
				<td>{sizeString}</td>
				<td>{percentString}</td>
			</tr>
		);
	}
}

class UploadedFile {
	constructor({ name, size, tinyId }) {
		this.name = name;
		this.size = size;
		this.tinyId = tinyId;
	}
}

class UploadedFileRow extends React.Component {
	render() {
		const nameString = formatName(this.props.file.name, this.props.nameMaxLength);
		const sizeString = `[${formatBytes(this.props.file.size)}]`;

		return (
			<tr>
				<td>{nameString}</td>
				<td>{sizeString}</td>
				<button>copy link</button>
				<button>delete</button>
			</tr>
		);
	}
}

let appMounted = false;

class App extends React.Component {
	constructor(props) {
		super(props);

		const storageTimeDurations = [
			dayjs.duration({ days: 1 }),
			dayjs.duration({ days: 3 }),
			dayjs.duration({ days: 7 }),
			dayjs.duration({ days: 30 })
		];

		this.state = {
			storageTimeDurations,
			storageTime: storageTimeDurations[1],
			uploadingFiles: [],
			uploadedFiles: []
		};
	}

	async componentDidMount() {
		if (!appMounted) {
			appMounted = true;

			this.props.requestProvider.defaults.headers.common[HEADER_TOKEN] = localStorage.getItem(HEADER_TOKEN);

			const authResponse = await this.props.requestProvider({
				url: urlJoin(process.env.REACT_APP_API_URL, "/auth/"),
				method: "GET"
			});

			localStorage.setItem(HEADER_TOKEN, authResponse.data);

			await this.props.requestProvider({
				url: urlJoin(process.env.REACT_APP_API_URL, "/uploadedFiles/"),
				method: "GET"
			});
		}

		// DEBUG
		setInterval(() => {
			const uploadingFiles = [
				new UploadingFile({ name: "test.jps", size: 999999, percent: Math.random() }),
				new UploadingFile({ name: "test_fdfds_fdsfds_fdsfds_fdsfdstest_fdfds_fdsfds_fdsfds_fdsfdstest_fdfds_fdsfds_fdsfds_fdsfdstest_fdfds_fdsfds_fdsfds_fdsfdstest_fdfds_fdsfds_fdsfds_fdsfdstest_fdfds_fdsfds_fdsfds_fdsfds.jps", size: 222, percent: Math.random() })
			];
			this.setState({
				uploadingFiles,
				uploadedFiles: [
					new UploadedFile({ name: "test_fdfds_fdsfds_fdsfds_fdsfds.jps", size: 222, tinyId: "tesy" }),
					new UploadedFile({ name: "test_fdfds_fdsfds_fdsfds_fdsfdstest_fdfds_fdsfds_fdsfds_fdsfdstest_fdfds_fdsfds_fdsfds_fdsfdstest_fdfds_fdsfds_fdsfds_fdsfdstest_fdfds_fdsfds_fdsfds_fdsfdstest_fdfds_fdsfds_fdsfds_fdsfds.jps", size: 111222, tinyId: "tesy" })
				]
			});
		}, 1000);
	}

	render() {
		return (
			<div className="app f-flex f-flex-direction-vertical f-vertical-align-center">
				{/* <p>{localStorage.getItem(HEADER_TOKEN)}</p> */}

				<pre>
					{`  ██████  ██░ ██  ▄▄▄       ██▀███ ▓██   ██▓ ▄▄▄      
▒██    ▒ ▓██░ ██▒▒████▄    ▓██ ▒ ██▒▒██  ██▒▒████▄    
░ ▓██▄   ▒██▀▀██░▒██  ▀█▄  ▓██ ░▄█ ▒ ▒██ ██░▒██  ▀█▄  
  ▒   ██▒░▓█ ░██ ░██▄▄▄▄██ ▒██▀▀█▄   ░ ▐██▓░░██▄▄▄▄██ 
▒██████▒▒░▓█▒░██▓ ▓█   ▓██▒░██▓ ▒██▒ ░ ██▒▓░ ▓█   ▓██▒
▒ ▒▓▒ ▒ ░ ▒ ░░▒░▒ ▒▒   ▓▒█░░ ▒▓ ░▒▓░  ██▒▒▒  ▒▒   ▓▒█░
░ ░▒  ░ ░ ▒ ░▒░ ░  ▒   ▒▒ ░  ░▒ ░ ▒░▓██ ░▒░   ▒   ▒▒ ░
░  ░  ░   ░  ░░ ░  ░   ▒     ░░   ░ ▒ ▒ ░░    ░   ▒   
      ░   ░  ░  ░      ░  ░   ░     ░ ░           ░  ░
                                    ░ ░               `
					}
				</pre>

				<div className="f-flex f-flex-direction-horizontal f-horizontal-align-center">
					<p className="p-left-small p-right-small">storage period</p>
					<select>
						{this.state.storageTimeDurations.map((duration, index) => (
							<option key={index} value={duration}>{duration.humanize()}</option>
						))}
					</select>
				</div>

				<Dropzone onDrop={files => {
					this.setState({
						uploadedFiles: this.state.uploadedFiles.concat(files)
					});

					files.forEach(file => {
						const formData = new FormData();
						formData.append("file", file);
						formData.append("name", file.name);
						formData.append("storageTime", this.state.storageTime.asMilliseconds());

						this.props.requestProvider({
							url: urlJoin(process.env.REACT_APP_API_URL, "/upload/"),
							method: "POST",
							data: formData,
							headers: {
								"Content-Type": "multipart/form-data"
							},
							onUploadProgress: progressEvent => {
								console.log(progressEvent);
							}
						})
							.then(response => {
								console.log(response);
							})
							.catch(error => {
								console.log(error);
							});
					});
				}}>
					{({ getRootProps, getInputProps }) => (
						<section className="dropzone container">
							<div {...getRootProps()}>
								<input {...getInputProps()} />
								<p>Drag'n'drop files here / click to select files</p>
							</div>
						</section>
					)}
				</Dropzone>

				{this.state.uploadingFiles.length > 0 &&
					<div className="container">
						<table className="filesTable">
							<tbody>
								{this.state.uploadingFiles.map((file, index) =>
									<UploadingFileRow key={index} file={file} nameMaxLength={80} />
								)}
							</tbody>
						</table>
					</div>
				}

				{this.state.uploadedFiles.length > 0 &&
					<div className="container">
						<table className="filesTable">
							<tbody>
								{this.state.uploadedFiles.map((file, index) =>
									<UploadedFileRow key={index} file={file} nameMaxLength={65} />
								)}
							</tbody>
						</table>
					</div>
				}

				<div className="footer f-flex f-flex-direction-vertical">
					<p>made by <a href="https://telegram.me/lis355">@lis355</a></p>
					<p>sharya <a href="https://github.com/lis355/sharya">github page</a></p>
				</div>
			</div>
		);
	}
}

export default App;
