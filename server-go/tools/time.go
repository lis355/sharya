package tools

import (
	"time"
)

func UnixNowInt32() int {
	return int(time.Now().Unix() * 1000)
}
