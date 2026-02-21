package tinyId

import (
	"math/rand"
)

const tinyIdDefaultLength = 4

var tinyIdCharacters = []([]rune){[]rune("bcdfghjkmnpqrstvwxyz"), []rune("aeiu")}

func GenetareTinyId() (id string) {
	return GenetareTinyIdWithLength(tinyIdDefaultLength)
}

func GenetareTinyIdWithLength(tinyIdLength int) (id string) {
	tinyIdCharactersLength := len(tinyIdCharacters)
	for i := 0; i < tinyIdLength; i++ {
		array := tinyIdCharacters[i%tinyIdCharactersLength]
		id += string(array[rand.Intn(len(array))])
	}

	return id
}
