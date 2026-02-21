package models

type UploadedFile struct {
	TinyId           string `json:"tinyId"`
	Name             string `json:"name"`
	Size             int64  `json:"size"`
	Path             string `json:"path"`
	UserToken        string `json:"userToken"`
	Date             int64  `json:"date"`
	StorageTime      int64  `json:"storageTime"`
	DownloadsAmount  int32  `json:"downloadsAmount"`
	IsSingleDownload bool   `json:"isSingleDownload"`
}
