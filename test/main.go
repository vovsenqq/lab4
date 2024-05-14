package main

import (
	"fmt"
	"image"
	"image/color"
	"image/png"
	"math"
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
	// Открываем изображение
	img, err := openImage("123.bmp")
	if err != nil {
		fmt.Println("Error opening image:", err)
		return
	}

	// Получаем пиксели изображения
	pixels, err := getPixels(img)
	if err != nil {
		fmt.Println("Error getting pixels:", err)
		return
	}

	height := len(pixels)
	width := len(pixels[0])

	// Инициализируем массивы для Фурье-преобразования
	PictureInRe := make([][]float64, height)
	PictureInIm := make([][]float64, height)
	for i := range PictureInRe {
		PictureInRe[i] = make([]float64, width)
		PictureInIm[i] = make([]float64, width)
	}

	for y := 0; y < height; y++ {
		for x := 0; x < width; x++ {
			PictureInRe[y][x] = float64(pixels[y][x].G) // Используем только красный канал для простоты
		}
	}

	PictureOutRe := make([][]float64, height)
	PictureOutIm := make([][]float64, height)
	for i := range PictureOutRe {
		PictureOutRe[i] = make([]float64, width)
		PictureOutIm[i] = make([]float64, width)
	}

	PictureSpectrumRe := make([][]float64, height)
	PictureSpectrumIm := make([][]float64, height)
	for i := range PictureSpectrumRe {
		PictureSpectrumRe[i] = make([]float64, width)
		PictureSpectrumIm[i] = make([]float64, width)
	}

	// Прямое Фурье-преобразование по строкам
	for k := 0; k < height; k++ {
		for j := 0; j < width; j++ {
			for i := 0; i < width; i++ {
				PictureOutRe[k][j] += PictureInRe[k][i]*math.Cos((2*math.Pi*float64(i)*float64(j))/float64(width)) + PictureInIm[k][i]*math.Sin((2*math.Pi*float64(i)*float64(j))/float64(width))
				PictureOutIm[k][j] += -(PictureInRe[k][i]*math.Sin((2*math.Pi*float64(i)*float64(j))/float64(width)) - PictureInIm[k][i]*math.Cos((2*math.Pi*float64(i)*float64(j))/float64(width)))
			}
		}
	}

	// Прямое Фурье-преобразование по столбцам
	for k := 0; k < width; k++ {
		for j := 0; j < height; j++ {
			for i := 0; i < height; i++ {
				PictureSpectrumRe[j][k] += PictureOutRe[i][k]*math.Cos((2*math.Pi*float64(i)*float64(j))/float64(height)) + PictureOutIm[i][k]*math.Sin((2*math.Pi*float64(i)*float64(j))/float64(height))
				PictureSpectrumIm[j][k] += -(PictureOutRe[i][k]*math.Sin((2*math.Pi*float64(i)*float64(j))/float64(height)) - PictureOutIm[i][k]*math.Cos((2*math.Pi*float64(i)*float64(j))/float64(height)))
			}
		}
	}

	// Создаём изображение спектра
	spectrumImg := image.NewGray(img.Bounds())
	for y := 0; y < height; y++ {
		for x := 0; x < width; x++ {
			magnitude := math.Sqrt(PictureSpectrumRe[y][x]*PictureSpectrumRe[y][x] + PictureSpectrumIm[y][x]*PictureSpectrumIm[y][x])
			value := uint8(math.Log(1+magnitude) * 255 / math.Log(256)) // Логарифмическое масштабирование для наглядности
			spectrumImg.SetGray(x, y, color.Gray{Y: value})
		}
	}

	// Сохраняем изображение спектра
	outFile, err := os.Create("spectrum.png")
	if err != nil {
		fmt.Println("Error creating output file:", err)
		return
	}
	defer outFile.Close()

	png.Encode(outFile, spectrumImg)
	fmt.Println("Spectrum image saved as spectrum.png")
}

// Функция для открытия изображения
func openImage(pathToFile string) (image.Image, error) {
	file, err := os.Open(pathToFile)
	if err != nil {
		return nil, err
	}
	defer file.Close()

	img, err := bmp.Decode(file)
	if err != nil {
		return nil, err
	}
	fmt.Println("Image decoded successfully")
	return img, nil
}

// Функция для получения пикселей изображения
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

// Функция для преобразования RGBA в Pixel
func rgbaToPixel(r uint32, g uint32, b uint32, a uint32) Pixel {
	return Pixel{int(r / 257), int(g / 257), int(b / 257), int(a / 257)}
}
