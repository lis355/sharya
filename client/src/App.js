import Dropzone from "react-dropzone";
import React from "react";
import urlJoin from "url-join";

const HEADER_TOKEN = "sharya-token";

function formatBytes(bytes, decimals = 2) {
	if (bytes === 0) return "0 Bytes";

	var k = 1024,
		dm = decimals || 2,
		sizes = ["Bytes", "KB", "MB", "GB", "TB", "PB", "EB", "ZB", "YB"],
		i = Math.floor(Math.log(bytes) / Math.log(k));

	return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + " " + sizes[i];
}

class UploadingFile {
	constructor({ name, size, percent }) {
		this.name = name;
		this.size = size;
		this.percent = percent;
	}
}

class NBSP extends React.Component {
	render() {
		return (
			new Array(this.props.n || 1).fill(0).map((_, index) => <p key={index}>&nbsp;</p>)
		);
	}
}

const FILE_LINE_CHARS_AMOUNT = 120;

class UploadingFileLine extends React.Component {
	render() {
		const lineWidth = FILE_LINE_CHARS_AMOUNT;

		const sizeString = `[${formatBytes(this.props.file.size)}]`;
		const percentString = `${(this.props.file.percent * 100).toFixed(2)}%`;

		let avaliableSpace = lineWidth - sizeString.length - percentString.length - 2;

		let nameString = this.props.file.name;
		let loadingString = "";
		if (nameString.length > avaliableSpace) {
			nameString = nameString.slice(0, avaliableSpace - 3) + "...";
		} else {
			avaliableSpace -= nameString.length + 1;
			loadingString = ".".repeat(avaliableSpace);
		}

		return (
			<div className="fileLine">
				<p>{nameString}</p><NBSP n={1} />
				{loadingString && <><p>{loadingString}</p><NBSP n={1} /></>}
				<p>{sizeString}</p><NBSP n={1} />
				<p>{percentString}</p>
			</div>
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

class UploadedFileLine extends React.Component {
	render() {
		const lineWidth = FILE_LINE_CHARS_AMOUNT;

		const sizeString = `[${formatBytes(this.props.file.size)}]`;
		const percentString = `${(this.props.file.percent * 100).toFixed(2)}%`;

		let avaliableSpace = lineWidth - sizeString.length - percentString.length - 3 - "copy link".length - "delete".length;

		let nameString = this.props.file.name;
		let loadingString = "";
		if (nameString.length > avaliableSpace) {
			nameString = nameString.slice(0, avaliableSpace - 3) + "...";
		} else {
			avaliableSpace -= nameString.length + 1;
		}

		return (
			<div className="fileLine">
				<p>{nameString}</p><NBSP n={1} />
				<p>{sizeString}</p>
				<button>copy link</button>
				<button>delete</button>
			</div>
		);
	}
}

let appMounted = false;

class App extends React.Component {
	constructor(props) {
		super(props);

		this.state = {
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
			<div className="app">
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

				<Dropzone onDrop={files => {
					this.setState({
						uploadedFiles: this.state.uploadedFiles.concat(files)
					});

					files.forEach(file => {
						const formData = new FormData();
						formData.append("file", file);
						formData.append("name", file.name);

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
						{this.state.uploadingFiles.map((file, index) =>
							<UploadingFileLine key={index} file={file} />
						)}
					</div>
				}

				{this.state.uploadedFiles.length > 0 &&
					<div className="container">
						{this.state.uploadedFiles.map((file, index) =>
							<UploadedFileLine key={index} file={file} />
						)}
					</div>
				}

				<div className="container">
					<table className="filesTable">
						<tbody>
							<tr>
								<td>test.jps</td>
								<td>......</td>
								<td>[976.56 KB]</td>
								<td>24.18%</td>
								<td><button>copy link</button></td>
								<td><button>delete</button></td>
							</tr>
							<tr>
								<td>uploading files</td>
								<td>{this.state.uploadingFiles.length}</td>
							</tr>
						</tbody>
					</table>
				</div>

				<div className="footer">
					<p>made by <a href="https://telegram.me/lis355">@lis355</a></p>
					<p>sharya <a href="https://github.com/lis355/sharya">github page</a></p>
				</div>
			</div>
		);
	}
}

export default App;
