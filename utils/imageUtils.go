package utils

import (
	"image"
)

func GetPixels(img image.Image) ([][]Pixel, error) {
	// Convert the image to pixels
	// Return the pixels
}

func Convolve(pixels [][]Pixel, kernel [][]int) ([][]Pixel, error) {
	// Convolve the pixels with the kernel
	// Return the convolved pixels
}
