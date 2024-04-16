package handlers

import (
	"app/services"
	"bytes"
	"image"
	"image/draw"
	"image/png"
	"io/ioutil"
	"net/http"
)

func FilterHandler(w http.ResponseWriter, r *http.Request) {
	// Read the image data from the request
	imgData, err := ioutil.ReadAll(r.Body)
	if err != nil {
		http.Error(w, "could not read image data", http.StatusBadRequest)
		return
	}
	r.Body.Close()

	// Decode the image data
	img, _, err := image.Decode(bytes.NewReader(imgData))
	if err != nil {
		http.Error(w, "could not decode image", http.StatusBadRequest)
		return
	}

	// Convert the image to BMP
	bmpImg := image.NewRGBA(img.Bounds())
	draw.Draw(bmpImg, bmpImg.Bounds(), img, img.Bounds().Min, draw.Src)

	// Apply the filter to the BMP image
	filteredImg := services.ApplyFilter(bmpImg)

	// Write the filtered image to the response in PNG format
	w.Header().Set("Content-Type", "image/png")
	err = png.Encode(w, filteredImg)
	if err != nil {
		http.Error(w, "could not encode image", http.StatusInternalServerError)
		return
	}
}
