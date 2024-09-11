package tools

import (
	"os"
)

var IsDevelopment = os.Getenv("DEVELOPMENT") == "true"
