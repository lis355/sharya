package tools

import (
	"math/rand"
	"strconv"
	"time"
)

func RandomHash() string {
	s := time.Now().String() + strconv.Itoa(rand.Int())
	return MD5(s)
}
