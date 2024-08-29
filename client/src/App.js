import axios from "axios";
import Dropzone from "react-dropzone";
import React from "react";

function formatBytes(bytes, decimals = 2) {
	if (bytes === 0) return "0 Bytes";

	var k = 1024,
		dm = decimals || 2,
		sizes = ["Bytes", "KB", "MB", "GB", "TB", "PB", "EB", "ZB", "YB"],
		i = Math.floor(Math.log(bytes) / Math.log(k));

	return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + " " + sizes[i];
}

class UploadedFileLine extends React.Component {
	render() {
		return (
			<div className="uploadedFileLine">
				<p>{this.props.file.name} [{formatBytes(this.props.file.size)}]</p><button>delete</button>
			</div>
		);
	}
}

class App extends React.Component {
	constructor(props) {
		super(props);

		this.state = {
			uploadingFiles: [],
			uploadedFiles: []
		};
	}

	render() {
		return (
			<div className="app">
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

						axios({
							url: process.env.REACT_APP_API_URL + "/upload/",
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
						<section className="dropzone box">
							<div {...getRootProps()}>
								<input {...getInputProps()} />
								<p>Drag'n'drop files here / click to select files</p>
							</div>
						</section>
					)}
				</Dropzone>

				{this.state.uploadedFiles.length > 0 &&
					<div className="box">
						{this.state.uploadedFiles.map((file, index) =>
							<UploadedFileLine key={index} file={file} />
						)}
					</div>
				}

				<div className="footer">
					<p>made by <a href="https://telegram.me/lis355">@lis355</a></p>
					<p>sharya <a href="https://github.com/lis355/sharya">github page</a></p>
				</div>
			</div>
		);
	}
}

export default App;
