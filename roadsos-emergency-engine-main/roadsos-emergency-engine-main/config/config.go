package config

import (
	"os"
	"github.com/joho/godotenv"
)

type Config struct {
	MapsKey string
	Port    string
}

func Load() Config {
	godotenv.Load()
	return Config{
		MapsKey: os.Getenv("GOOGLE_MAPS_KEY"),
		Port:    os.Getenv("PORT"),
	}
}