package tools

import (
	"time"
)

func Now() int {
	return int(time.Now().Unix() * 1000)
}
