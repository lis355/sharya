package db

type UploadedFile struct {
	TinyId      string `json:"tinyId,omitempty"`
	Name        string `json:"name,omitempty"`
	Size        int    `json:"size,omitempty"`
	Path        string `json:"path,omitempty"`
	UserToken   string `json:"userToken,omitempty"`
	Date        int    `json:"date,omitempty"`
	StorageTime int    `json:"storageTime,omitempty"`
}
