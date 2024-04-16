package services

import (
	"app/utils"
	"fmt"
	"image"
	"image/color"
)

func ApplyFilter(img image.Image) image.Image {
	kernel := [][]int{
		{1, 1, 1},
		{1, 1, 1},
		{1, 1, 1},
	}
	pixels, err := utils.GetPixels(img)
	if err != nil {
		fmt.Println("Error: Image could not be converted to pixels")
	}

	convolvedPixels, err := convolve(pixels, kernel)
	if err != nil {
		fmt.Println("Error: Image could not be convolved")
	}

	newImg := image.NewRGBA(img.Bounds())

	// Set the pixels of the new image
	for y := 0; y < len(pixels); y++ {
		for x := 0; x < len(pixels[0]); x++ {
			p := convolvedPixels[y][x]
			// Convert the pixel values from int to uint8 and set the pixel in the new image
			newImg.Set(x, y, color.RGBA{uint8(p.R), uint8(p.G), uint8(p.B), uint8(p.A)})
		}
	}

	return newImg
}

func convolve(pixels [][]utils.Pixel, kernel [][]int) ([][]utils.Pixel, error) {
	height := len(pixels)
	width := len(pixels[0])
	kernelSize := len(kernel)

	// Calculate the sum of the kernel
	kernelSum := 0
	for _, row := range kernel {
		for _, value := range row {
			kernelSum += value
		}
	}
	if kernelSum == 0 {
		kernelSum = 1
	}

	// Create a new 2D slice to hold the convolved pixels
	convolvedPixels := make([][]utils.Pixel, height)
	for i := range convolvedPixels {
		convolvedPixels[i] = make([]utils.Pixel, width)
	}

	// Convolve each pixel
	for y := 0; y < height; y++ {
		for x := 0; x < width; x++ {
			sumR, sumG, sumB := 0, 0, 0
			for ky := -kernelSize / 2; ky <= kernelSize/2; ky++ {
				for kx := -kernelSize / 2; kx <= kernelSize/2; kx++ {
					// Get the corresponding pixel in the image
					px, py := x+kx, y+ky
					if px >= 0 && px < width && py >= 0 && py < height {
						pixel := pixels[py][px]
						// Get the corresponding value in the kernel
						kernelValue := kernel[ky+kernelSize/2][kx+kernelSize/2]
						sumR += pixel.R * kernelValue
						sumG += pixel.G * kernelValue
						sumB += pixel.B * kernelValue
					}
				}
			}
			// Normalize the sums and set the convolved pixel
			convolvedPixels[y][x] = utils.Pixel{
				R: sumR / kernelSum,
				G: sumG / kernelSum,
				B: sumB / kernelSum,
				A: 255,
			}
		}
	}

	return convolvedPixels, nil
}
