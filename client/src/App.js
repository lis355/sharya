import Dropzone from "react-dropzone";
import React from "react";
import urlJoin from "url-join";

import { formatBytes, formatName } from "./tools/format.js";
import { randomId } from "./tools/randomId.js";
import dayjs from "./tools/dayjs.js";

class UploadingFile {
	constructor({ id, name, size, date, percent }) {
		this.id = id;
		this.name = name;
		this.size = size;
		this.date = date;
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
	constructor({ tinyId, name, size, }) {
		this.tinyId = tinyId;
		this.name = name;
		this.size = size;
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
				<td>
					<button onClick={() => window.navigator.clipboard.writeText(urlJoin(process.env.REACT_APP_BASE_URL, this.props.file.tinyId))}>copy link</button>
				</td>
				<td>
					<button onClick={this.props.deleteHandler}>delete</button>
				</td>
			</tr>
		);
	}
}

const TOKEN_HEADER = "sharya-token";
const RENDER_UPLOADING_FILES_AFTER_DURATION = dayjs.duration({ seconds: 0.5 });

// NOTE why componentdidmount called two times
// https://stackoverflow.com/questions/63383473/why-componentdidmount-called-two-times
// Multiple componentDidMount calls may be caused by using <React.StrictMode> around your component. After removing it double calls are gone.
// This is intended behavior to help detect unexpected side effects. You can read more about it in the docs.
// It happens only in development environment, while in production componentDidMount is called only once even with <React.StrictMode>.
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
		if (process.env.NODE_ENV === "development") {
			if (!appMounted) appMounted = true;
			else return;
		}

		// console.log(localStorage.getItem(HEADER_TOKEN));

		await this.requestAuth();
		await this.requestUploadedFiles();
	}

	async requestAuth() {
		this.props.requestProvider.defaults.headers.common[TOKEN_HEADER] = localStorage.getItem(TOKEN_HEADER);

		const authResponse = await this.props.requestProvider({
			url: urlJoin(process.env.REACT_APP_BASE_URL, "api", "auth"),
			method: "GET"
		});

		localStorage.setItem(TOKEN_HEADER, authResponse.data);
	}

	async requestUploadedFiles() {
		const getUploadedFilesResponse = await this.props.requestProvider({
			url: urlJoin(process.env.REACT_APP_BASE_URL, "api", "uploadedFiles"),
			method: "GET"
		});

		const uploadedFiles = getUploadedFilesResponse.data.map(file => new UploadedFile({ tinyId: file.tinyId, name: file.name, size: file.size }));

		this.setState({ uploadedFiles });
	}

	renderLogo() {
		return (
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
		);
	}

	renderStorageTimeSelector() {
		return (
			<div className="f-flex f-flex-direction-horizontal f-horizontal-align-center">
				<p className="p-left-small p-right-small">storage period</p>
				<select
					value={this.state.storageTime}
					onChange={event => this.setState({ storageTime: dayjs.duration({ milliseconds: event.target.value }) })}
				>
					{this.state.storageTimeDurations.map((duration, index) => (
						<option key={index} value={duration.asMilliseconds()}>{duration.humanize()}</option>
					))}
				</select>
			</div>
		);
	}

	renderDropzone() {
		return (
			<Dropzone onDrop={files => {
				files.forEach(file => {
					const uploadingFile = new UploadingFile({ id: randomId(), name: file.name, size: file.size, date: dayjs(), percent: 0 });

					const uploadingFiles = this.state.uploadingFiles.concat(uploadingFile);

					this.setState({ uploadingFiles });

					const formData = new FormData();
					formData.append("file", file);
					formData.append("name", file.name);
					formData.append("storageTime", this.state.storageTime.asMilliseconds());

					this.props.requestProvider({
						url: urlJoin(process.env.REACT_APP_BASE_URL, "api", "upload"),
						method: "POST",
						data: formData,
						headers: {
							"Content-Type": "multipart/form-data"
						},
						onUploadProgress: progressEvent => {
							const uploadingFiles = this.state.uploadingFiles.map(file => {
								return file.id === uploadingFile.id
									? new UploadingFile({ id: uploadingFile.id, name: uploadingFile.name, size: uploadingFile.size, date: uploadingFile.date, percent: progressEvent.progress })
									: file;
							});

							this.setState({ uploadingFiles });
						}
					})
						.then(response => {
							const uploadingFiles = this.state.uploadingFiles.filter(file => file.id !== uploadingFile.id);

							this.setState({ uploadingFiles });

							const uploadedFileData = response.data;

							const uploadedFile = new UploadedFile({ tinyId: uploadedFileData.tinyId, name: uploadedFileData.name, size: uploadedFileData.size });

							const uploadedFiles = this.state.uploadedFiles.concat(uploadedFile);

							this.setState({ uploadedFiles });
						})
						.catch(error => {
							const uploadingFiles = this.state.uploadingFiles.filter(file => file.id !== uploadingFile.id);

							this.setState({ uploadingFiles });
						});
				});
			}}>
				{({ getRootProps, getInputProps }) => (
					<section className="dropzone container f-flex f-flex-direction-vertical f-horizontal-align-center">
						<div {...getRootProps()}>
							<input {...getInputProps()} />
							<p>Drag'n'drop files here / click to select files</p>
						</div>
					</section>
				)}
			</Dropzone>
		);
	}

	renderUploadingFiles() {
		const uploadingFiles = this.state.uploadingFiles.filter(file => dayjs() - file.date > RENDER_UPLOADING_FILES_AFTER_DURATION);

		return (
			uploadingFiles.length > 0 &&
			<div className="container">
				<table className="filesTable">
					<tbody>
						{uploadingFiles.map((file, index) =>
							<UploadingFileRow key={index} file={file} nameMaxLength={80} />
						)}
					</tbody>
				</table>
			</div>
		);
	}

	renderUploadedFiles() {
		return (
			this.state.uploadedFiles.length > 0 &&
			<div className="container">
				<table className="filesTable">
					<tbody>
						{this.state.uploadedFiles.map((file, index) =>
							<UploadedFileRow key={index} file={file} nameMaxLength={65} deleteHandler={async () => {
								const tinyId = file.tinyId;

								await this.props.requestProvider({
									url: urlJoin(process.env.REACT_APP_BASE_URL, "api", "upload", tinyId),
									method: "DELETE"
								});

								const uploadedFiles = this.state.uploadedFiles.filter(file => file.tinyId !== tinyId);

								this.setState({ uploadedFiles });
							}} />
						)}
					</tbody>
				</table>
			</div>
		);
	}

	render() {
		return (
			<div className="app f-flex f-flex-direction-vertical f-vertical-align-center">
				{this.renderLogo()}
				{this.renderStorageTimeSelector()}
				{this.renderDropzone()}
				{this.renderUploadingFiles()}
				{this.renderUploadedFiles()}

				<div className="footer f-flex f-flex-direction-vertical f-vertical-align-center">
					<p>made by <a href="https://telegram.me/lis355">@lis355</a></p>
					<p>sharya <a href="https://github.com/lis355/sharya">github page</a></p>
				</div>
			</div>
		);
	}
}

export default App;
