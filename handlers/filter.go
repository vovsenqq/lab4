package handlers

import (
	"app/services"
	"bytes"
	"fmt"
	"image"
	"image/draw"
	"image/png"
	"io"
	"net/http"
	"strconv"
)

func FilterHandler(w http.ResponseWriter, r *http.Request) {
	// Parse the multipart form
	err := r.ParseMultipartForm(10 << 20) // limit your max input length!
	if err != nil {
		http.Error(w, "could not parse multipart form", http.StatusBadRequest)
		return
	}

	// Get the image file from the form
	file, _, err := r.FormFile("image")
	if err != nil {
		http.Error(w, "could not get image file", http.StatusBadRequest)
		return
	}
	defer file.Close()

	// Read the image data
	imgData, err := io.ReadAll(file)
	if err != nil {
		http.Error(w, "could not read image data", http.StatusBadRequest)
		return
	}

	// Decode the image data
	img, _, err := image.Decode(bytes.NewReader(imgData))
	if err != nil {
		http.Error(w, "could not decode image", http.StatusBadRequest)
		return
	}

	// Convert the image to BMP
	bmpImg := image.NewRGBA(img.Bounds())
	draw.Draw(bmpImg, bmpImg.Bounds(), img, img.Bounds().Min, draw.Src)

	// Get the number from the form
	number := r.FormValue("kernel_size")
	fmt.Println("Received number: ", number)

	size, err := strconv.Atoi(number)
	if err != nil {
		// ... handle error
		panic(err)
	}

	noiseType := r.FormValue("noise_type")
	filterType := r.FormValue("filter_type")
	var filteredImg image.Image

	if filterType == "arithmetic" {
		filteredImg = services.ApplyFilter(bmpImg, "arithmetic", size)
	} else {
		// Apply the filter to the BMP image
		filteredImg = services.ApplyFilter(bmpImg, "contraharmonic_"+noiseType, size)
	}

	// Convert the filtered image back to PNG
	pngImg := image.NewRGBA(filteredImg.Bounds())
	draw.Draw(pngImg, pngImg.Bounds(), filteredImg, filteredImg.Bounds().Min, draw.Src)

	// Write the PNG image to the response
	w.Header().Set("Content-Type", "image/png")
	err = png.Encode(w, pngImg)
	if err != nil {
		http.Error(w, "could not encode image", http.StatusInternalServerError)
		return
	}
}
