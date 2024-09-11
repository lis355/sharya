package tools

import (
	"github.com/joho/godotenv"
)

func InitializeEnvironment() {
	godotenv.Overload(".env", ".env.local")
}
