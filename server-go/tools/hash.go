package tools

import (
	"crypto/md5"
	"fmt"
	"math/rand"
	"strconv"
	"time"
)

func MD5(s string) string {
	return fmt.Sprintf("%x", md5.Sum([]byte(s)))
}

func RandomHash() string {
	s := time.Now().String() + strconv.Itoa(rand.Int())
	return MD5(s)
}
