package handlers

import (
	"myapp/services"
	"net/http"
)

func NoiseHandler(w http.ResponseWriter, r *http.Request) {
	// Parse the image and parameters from the request
	// Call the noise service
	services.AddNoise(img, params)
	// Write the response
}
