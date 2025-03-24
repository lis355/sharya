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
				<td className="fit" style={{ textAlign: "right" }}>{sizeString}</td>
				<td className="fit">{percentString}</td>
			</tr>
		);
	}
}

class UploadedFile {
	constructor({ tinyId, name, size, date, storageTime, downloadsAmount, isSingleDownload }) {
		this.tinyId = tinyId;
		this.name = name;
		this.size = size;
		this.expireDate = dayjs(date + storageTime);
		this.downloadsAmount = downloadsAmount;
		this.isSingleDownload = isSingleDownload;
	}
}

class UploadedFileRow extends React.Component {
	render() {
		const nameString = formatName(this.props.file.name, this.props.nameMaxLength);
		const sizeString = `[${formatBytes(this.props.file.size)}]`;
		const url = new URL(urlJoin(process.env.REACT_APP_BASE_URL, this.props.file.tinyId));

		return (
			<tr>
				<td>
					<div className="d-flex f-flex-direction-vertical">
						<p style={{ marginTop: "0.25rem" }}>{nameString}</p>
						<p style={{ fontSize: "0.8rem", marginBottom: "0.25rem" }}>
							{url.href.slice(url.protocol.length + 2)} | ~{dayjs.duration(this.props.file.expireDate - dayjs()).humanize()} remain | {this.props.file.isSingleDownload ? "single download" : `${this.props.file.downloadsAmount} downloads`}
						</p>
					</div>
				</td>
				<td className="fit" style={{ textAlign: "right" }}>{sizeString}</td>
				<td className="fit">
					<button onClick={() => {
						const lines = [
							nameString,
							`~${dayjs.duration(this.props.file.expireDate - dayjs()).humanize()} remain (till ${dayjs(this.props.file.expireDate).toString()})`
						];

						if (this.props.file.isSingleDownload) lines.push("single download");

						lines.push("");
						lines.push(url.href);

						window.navigator.clipboard.writeText(lines.join("\n"));
					}}>copy link</button>
				</td>
				<td className="fit">
					<button onClick={this.props.deleteHandler}>delete</button>
				</td>
			</tr>
		);
	}
}

// NOTE why componentdidmount called two times
// https://stackoverflow.com/questions/63383473/why-componentdidmount-called-two-times
// Multiple componentDidMount calls may be caused by using <React.StrictMode> around your component. After removing it double calls are gone.
// This is intended behavior to help detect unexpected side effects. You can read more about it in the docs.
// It happens only in development environment, while in production componentDidMount is called only once even with <React.StrictMode>.
let appMounted = false;

const TOKEN_HEADER = "sharya-token";

const RENDER_UPLOADING_FILES_AFTER_DURATION = dayjs.duration({ seconds: 0.5 });

const STORAGE_TIMES = [
	dayjs.duration({ days: 1 }),
	dayjs.duration({ days: 3 }),
	dayjs.duration({ days: 7 }),
	dayjs.duration({ days: 30 })
];

const STORAGE_TIME_DEFAULT = STORAGE_TIMES[1];

class App extends React.Component {
	constructor(props) {
		super(props);

		this.state = {
			storageTime: STORAGE_TIME_DEFAULT,
			isSingleDownload: false,
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

		const uploadedFiles = getUploadedFilesResponse.data.map(file => new UploadedFile(file));

		this.setState({ uploadedFiles });
	}

	renderLogo() {
		return (
			<pre className="logo">
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
			<div className="f-flex f-flex-direction-horizontal f-vertical-align-center">
				<p className="mr">storage period</p>
				<select className="mr"
					value={this.state.storageTime.asMilliseconds()}
					onChange={event => this.setState({ storageTime: dayjs.duration({ milliseconds: event.target.value }) })}
				>
					{STORAGE_TIMES.map((duration, index) => (
						<option key={index} value={duration}>{duration.humanize()}</option>
					))}
				</select>
				<p className="mr">single download</p>
				<input type="checkbox"
					checked={this.state.isSingleDownload}
					onChange={event => this.setState({ isSingleDownload: event.target.checked })}
				/>
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
					formData.append("isSingleDownload", this.state.isSingleDownload);

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

							const uploadedFile = new UploadedFile(uploadedFileData);

							const uploadedFiles = this.state.uploadedFiles.concat(uploadedFile);

							this.setState({
								uploadedFiles,
								isSingleDownload: false
							});
						})
						.catch(error => {
							console.log(error);

							const uploadingFiles = this.state.uploadingFiles.filter(file => file.id !== uploadingFile.id);

							this.setState({
								uploadingFiles,
								isSingleDownload: false
							});
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
			<div className="container" style={{ marginTop: 0 }}>
				<div style={{ margin: "0.5rem" }}>
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
			</div>
		);
	}

	renderFooter() {
		return (
			<div className="footer">
				<p>created by <a href="https://telegram.me/lis355" target="_blank" rel="noopener noreferrer">@lis355</a></p>
				<p>sharya <a href="https://github.com/lis355/sharya" target="_blank" rel="noopener noreferrer">github page</a></p>
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
				{this.renderFooter()}
			</div>
		);
	}
}

export default App;
