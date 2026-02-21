package dto

import "sharya-server/database/models"

type UploadedFileResponse struct {
	TinyId           string `json:"tinyId"`
	Name             string `json:"name"`
	Size             int64  `json:"size"`
	Date             int64  `json:"date"`
	StorageTime      int64  `json:"storageTime"`
	DownloadsAmount  int32  `json:"downloadsAmount"`
	IsSingleDownload bool   `json:"isSingleDownload"`
}

func NewUploadedFileResponse(uploadedFile *models.UploadedFile) *UploadedFileResponse {
	return &UploadedFileResponse{
		TinyId:           uploadedFile.TinyId,
		Name:             uploadedFile.Name,
		Size:             uploadedFile.Size,
		Date:             uploadedFile.Date,
		StorageTime:      uploadedFile.StorageTime,
		DownloadsAmount:  uploadedFile.DownloadsAmount,
		IsSingleDownload: uploadedFile.IsSingleDownload,
	}
}

func NewUploadedFilesListResponse(uploadedFiles []*models.UploadedFile) []*UploadedFileResponse {
	list := make([]*UploadedFileResponse, len(uploadedFiles))
	for index, uploadedFile := range uploadedFiles {
		list[index] = NewUploadedFileResponse(uploadedFile)
	}
	return list
}
