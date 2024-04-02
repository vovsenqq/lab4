package main

import (
	"fmt"
	"image"
	"image/color"
	"os"

	"golang.org/x/image/bmp"
)

type Pixel struct {
	R int
	G int
	B int
	A int
}

func main() {
	img, err := openImage("D:/goback/images/1.bmp")
	if err != nil {
		fmt.Println("Error: Image could not be opened or decoded")
		os.Exit(1)
	}

	pixels, err := getPixels(img)
	if err != nil {
		fmt.Println("Error: Image could not be converted to pixels")
		os.Exit(1)
	}

	// Define a 3x3 kernel
	kernel := [][]int{
		{1, 4, 6, 4, 1},
		{4, 16, 24, 16, 4},
		{6, 24, 36, 24, 6},
		{4, 16, 24, 16, 4},
		{1, 4, 6, 4, 1},
	}

	// Convolve the image with the kernel
	convolvedPixels, err := convolve(pixels, kernel)
	for i := 0; i < 20; i++ {
		convolvedPixels, err = convolve(convolvedPixels, kernel)
	}
	if err != nil {
		fmt.Println("Error: Image could not be convolved")
		os.Exit(1)
	}

	// Create a new image with the same size as the original image
	newImg := image.NewRGBA(img.Bounds())

	// Set the pixels of the new image
	for y := 0; y < len(pixels); y++ {
		for x := 0; x < len(pixels[0]); x++ {
			p := convolvedPixels[y][x]
			// Convert the pixel values from int to uint8 and set the pixel in the new image
			newImg.Set(x, y, color.RGBA{uint8(p.R), uint8(p.G), uint8(p.B), uint8(p.A)})
		}
	}

	// Save the new image to a file
	newFile, err := os.Create("path_to_new_image.bmp")
	if err != nil {
		fmt.Println("Error: File could not be created")
		os.Exit(1)
	}
	defer newFile.Close()

	err = bmp.Encode(newFile, newImg)
	if err != nil {
		fmt.Println("Error: Image could not be encoded")
		os.Exit(1)
	}
	fmt.Println("Image saved successfully")
}

func openImage(pathToFile string) (image.Image, error) {
	file, err := os.Open(pathToFile)
	if err != nil {
		return nil, err
	}
	defer file.Close()

	img, _, err := image.Decode(file)
	if err != nil {
		return nil, err
	}
	fmt.Println("Image decoded successfully")
	return img, nil
}

func getPixels(img image.Image) ([][]Pixel, error) {
	bounds := img.Bounds()
	width, height := bounds.Max.X, bounds.Max.Y

	var pixels [][]Pixel
	for y := 0; y < height; y++ {
		var row []Pixel
		for x := 0; x < width; x++ {
			row = append(row, rgbaToPixel(img.At(x, y).RGBA()))
		}
		pixels = append(pixels, row)
	}

	return pixels, nil
}

func rgbaToPixel(r uint32, g uint32, b uint32, a uint32) Pixel {
	return Pixel{int(r / 257), int(g / 257), int(b / 257), int(a / 257)}
}

func convolve(pixels [][]Pixel, kernel [][]int) ([][]Pixel, error) {
	height := len(pixels)
	width := len(pixels[0])
	kernelSize := len(kernel)

	// The kernel size must be odd
	if kernelSize%2 == 0 {
		return nil, fmt.Errorf("kernel size must be odd")
	}

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
	convolvedPixels := make([][]Pixel, height)
	for i := range convolvedPixels {
		convolvedPixels[i] = make([]Pixel, width)
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
			convolvedPixels[y][x] = Pixel{
				R: sumR / kernelSum,
				G: sumG / kernelSum,
				B: sumB / kernelSum,
				A: 255,
			}
		}
	}

	return convolvedPixels, nil
}
