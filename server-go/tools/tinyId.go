package tools

import (
	"math/rand"
)

var (
	tinyIdCharacters = []([]rune){[]rune("bcdefghijklmnopqrstuvwxyz"), []rune("aeiouy")}
	tinyIdLength     = 4
)

func GenetareTinyId() string {
	str := ""
	tinyIdCharactersLength := len(tinyIdCharacters)
	for i := 0; i < tinyIdLength; i++ {
		array := tinyIdCharacters[i%tinyIdCharactersLength]
		str = str + string(array[rand.Intn(len(array))])
	}

	return str
}
