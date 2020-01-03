import React, { Component } from 'react'
import './Upload.css'
import Dropzone from '../dropzone/Dropzone'
import Progress from '../progress/Progress'
import Itemslist from '../itemslist/Itemslist'

class Upload extends Component {
    constructor(props) {
        super(props);
        this.state = {
            files: [],
            imported_files: [],
            uploading: false,
            uploadProgress: {},
            successfullUploaded: false
          };
      
        this.onFilesAdded = this.onFilesAdded.bind(this);
        this.uploadFiles = this.uploadFiles.bind(this);
        this.sendRequest = this.sendRequest.bind(this);
        this.renderActions = this.renderActions.bind(this);
    }

    render() {
        return (
          <div className="Upload">
            <span className="Title">Upload Files</span>
            <div className="Content">
              <div>
                <Dropzone
                  onFilesAdded={this.onFilesAdded}
                  disabled={this.state.uploading || this.state.successfullUploaded}
                />
                
              </div>
              <div className="Files">
                {this.state.files.map(file => {
                  return (
                    <div key={file.name} className="Row">
                      <span className="Filename">{file.name}</span>
                      {this.renderProgress(file)}
                    </div>
                  );
                })}
              </div>
            </div>
            <div className="Actions">
                {this.renderActions()}
            </div>
            <div>
              <Itemslist items={this.state.imported_files}/>
              </div>
          </div>
        );
      }

    onFilesAdded(files) {
      this.setState(prevState => ({
        files: prevState.files.concat(files)

      }));
    }


    renderProgress(file) {
        const uploadProgress = this.state.uploadProgress[file.name];
        if (this.state.uploading || this.state.successfullUploaded) {
          return (
            <div className="ProgressWrapper">
              <Progress progress={uploadProgress ? uploadProgress.percentage : 0} />
              <img
                className="CheckIcon"
                alt="done"
                src="check_circle-24px.svg"
                style={{
                  opacity:
                    uploadProgress && uploadProgress.state === "done" ? 0.5 : 0
                }}
              />
            </div>
          );
        }
      }
    
      renderActions() {
        if (this.state.successfullUploaded) {
          return (
            <button
              onClick={() =>
                this.setState({ files: [], successfullUploaded: false })
              }
            >
              Clear
            </button>
          );
        } else {
          return (
            <button
              disabled={this.state.files.length < 0 || this.state.uploading}
              onClick={this.uploadFiles}
            >
              Upload
            </button>
          );
        }
      }

    
    async uploadFiles() {
        this.setState({ uploadProgress: {}, uploading: true });
        const promises = [];
        this.state.files.forEach(file => {
          promises.push(this.sendRequest(file));
        });
        try {
          await Promise.all(promises);
      
          this.setState({ successfullUploaded: true, uploading: false });
          this.getData()
        } catch (e) {
          // Not Production ready! Do some error handling here instead...
          this.setState({ successfullUploaded: true, uploading: false });
        }
      }
    componentDidMount(){
      this.getData()
    }

    getData() {
      // create a new XMLHttpRequest
      var req = new XMLHttpRequest()
  
      // get a callback when the server responds
      req.addEventListener('load', () => {
        // update the state of the component with the result here
        var result = JSON.parse(req.response)
        console.log(result)
        this.setState({imported_files: result})
        
        //console.log(req.responseText)
        console.log(this.state.imported_files)

        console.log(this.state.imported_files.map(entry => {
          return entry.file
        }))

      })
      // open the request with the verb and the url
      req.open("GET", 'http://localhost:8000/api/files/')
      // send the request
      req.send()
    }
    
    sendRequest(file) {
        return new Promise((resolve, reject) => {
          const req = new XMLHttpRequest();

          req.upload.addEventListener("progress", event => {
            if (event.lengthComputable) {
             const copy = { ...this.state.uploadProgress };
             copy[file.name] = {
              state: "pending",
              percentage: (event.loaded / event.total) * 100
             };
             this.setState({ uploadProgress: copy });
            }
           });
            
           req.upload.addEventListener("load", event => {
            const copy = { ...this.state.uploadProgress };
            copy[file.name] = { state: "done", percentage: 100 };
            this.setState({ uploadProgress: copy });
            resolve(req.response);
           });
            
           req.upload.addEventListener("error", event => {
            const copy = { ...this.state.uploadProgress };
            copy[file.name] = { state: "error", percentage: 0 };
            this.setState({ uploadProgress: copy });
            reject(req.response);
           });

          const formData = new FormData();
          formData.append("file", file, file.name);
      
          req.open("POST", 'http://localhost:8000/api/files/');
          req.send(formData);
        });
      }
}

export default Upload;