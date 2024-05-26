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

// Функция для сдвига нулевой частоты в центр изображения
func shiftDFT(img *image.RGBA) {
	width := img.Bounds().Dx()
	height := img.Bounds().Dy()

	// Перемещаем 4 квадранта
	for y := 0; y < height/2; y++ {
		for x := 0; x < width/2; x++ {
			swapPixels(img, x, y, x+width/2, y+height/2)
			swapPixels(img, x+width/2, y, x, y+height/2)
		}
	}
}

// Функция для обмена пикселей
func swapPixels(img *image.RGBA, x1, y1, x2, y2 int) {
	c1 := img.RGBAAt(x1, y1)
	c2 := img.RGBAAt(x2, y2)
	img.SetRGBA(x1, y1, c2)
	img.SetRGBA(x2, y2, c1)
}

// Основная функция
func main() {
	// Открываем изображение
	img, err := openImage("9.bmp")
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

	// Функция для выполнения Фурье-преобразования и сохранения спектра
	processChannel := func(channel string, getValue func(Pixel) float64, outputFileName string, colorFunc func(uint8) color.Color) ([][]float64, [][]float64) {
		PictureInRe := make([][]float64, height)
		PictureInIm := make([][]float64, height)
		for i := range PictureInRe {
			PictureInRe[i] = make([]float64, width)
			PictureInIm[i] = make([]float64, width)
		}

		for y := 0; y < height; y++ {
			for x := 0; x < width; x++ {
				PictureInRe[y][x] = getValue(pixels[y][x])
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
				var sumRe, sumIm float64
				for i := 0; i < width; i++ {
					angle := (2 * math.Pi * float64(i) * float64(j)) / float64(width)
					sumRe += PictureInRe[k][i]*math.Cos(angle) - PictureInIm[k][i]*math.Sin(angle)
					sumIm += PictureInRe[k][i]*math.Sin(angle) + PictureInIm[k][i]*math.Cos(angle)
				}
				PictureOutRe[k][j] = sumRe
				PictureOutIm[k][j] = sumIm
			}
		}

		// Прямое Фурье-преобразование по столбцам
		for k := 0; k < width; k++ {
			for j := 0; j < height; j++ {
				var sumRe, sumIm float64
				for i := 0; i < height; i++ {
					angle := (2 * math.Pi * float64(i) * float64(j)) / float64(height)
					sumRe += PictureOutRe[i][k]*math.Cos(angle) - PictureOutIm[i][k]*math.Sin(angle)
					sumIm += PictureOutRe[i][k]*math.Sin(angle) + PictureOutIm[i][k]*math.Cos(angle)
				}
				PictureSpectrumRe[j][k] = sumRe
				PictureSpectrumIm[j][k] = sumIm
			}
		}

		// Создаём изображение спектра на черном фоне с цветом выбранного канала
		spectrumImg := image.NewRGBA(img.Bounds())
		var maxMagnitude float64
		for y := 0; y < height; y++ {
			for x := 0; x < width; x++ {
				magnitude := math.Sqrt(PictureSpectrumRe[y][x]*PictureSpectrumRe[y][x] + PictureSpectrumIm[y][x]*PictureSpectrumIm[y][x])
				if magnitude > maxMagnitude {
					maxMagnitude = magnitude
				}
			}
		}

		for y := 0; y < height; y++ {
			for x := 0; x < width; x++ {
				magnitude := math.Sqrt(PictureSpectrumRe[y][x]*PictureSpectrumRe[y][x] + PictureSpectrumIm[y][x]*PictureSpectrumIm[y][x])
				normalized := uint8(math.Log(1+magnitude) * 255 / math.Log(1+maxMagnitude)) // Логарифмическое масштабирование для наглядности
				spectrumImg.Set(x, y, colorFunc(normalized))
			}
		}

		// Сдвигаем нулевую частоту в центр
		shiftDFT(spectrumImg)

		// Сохраняем изображение спектра
		outFile, err := os.Create(outputFileName)
		if err != nil {
			fmt.Println("Error creating output file:", err)
			return nil, nil
		}
		defer outFile.Close()

		png.Encode(outFile, spectrumImg)
		fmt.Printf("Spectrum image saved as %s\n", outputFileName)

		return PictureSpectrumRe, PictureSpectrumIm
	}

	// Обработка каждого канала
	redRe, redIm := processChannel("red", func(p Pixel) float64 {
		return float64(p.R)
	}, "spectrum_red.png", func(value uint8) color.Color {
		return color.RGBA{R: value, G: 0, B: 0, A: 255}
	})

	greenRe, greenIm := processChannel("green", func(p Pixel) float64 {
		return float64(p.G)
	}, "spectrum_green.png", func(value uint8) color.Color {
		return color.RGBA{R: 0, G: value, B: 0, A: 255}
	})

	blueRe, blueIm := processChannel("blue", func(p Pixel) float64 {
		return float64(p.B)
	}, "spectrum_blue.png", func(value uint8) color.Color {
		return color.RGBA{R: 0, G: 0, B: value, A: 255}
	})

	// Выполняем обратное Фурье-преобразование
	inverseDFT := func(PictureRe, PictureIm [][]float64) [][]float64 {
		height := len(PictureRe)
		width := len(PictureRe[0])
		ReconstructedRe := make([][]float64, height)
		ReconstructedIm := make([][]float64, height)
		for i := range ReconstructedRe {
			ReconstructedRe[i] = make([]float64, width)
			ReconstructedIm[i] = make([]float64, width)
		}

		// Обратное Фурье-преобразование по строкам
		for k := 0; k < height; k++ {
			for j := 0; j < width; j++ {
				var sumRe, sumIm float64
				for i := 0; i < width; i++ {
					angle := (2 * math.Pi * float64(i) * float64(j)) / float64(width)
					sumRe += PictureRe[k][i]*math.Cos(angle) + PictureIm[k][i]*math.Sin(angle)
					sumIm += PictureRe[k][i]*math.Sin(angle) - PictureIm[k][i]*math.Cos(angle)
				}
				ReconstructedRe[k][j] = sumRe
				ReconstructedIm[k][j] = sumIm
			}
		}

		// Обратное Фурье-преобразование по столбцам
		for k := 0; k < width; k++ {
			for j := 0; j < height; j++ {
				var sumRe, sumIm float64
				for i := 0; i < height; i++ {
					angle := (2 * math.Pi * float64(i) * float64(j)) / float64(height)
					sumRe += ReconstructedRe[i][k]*math.Cos(angle) + ReconstructedIm[i][k]*math.Sin(angle)
					sumIm += ReconstructedRe[i][k]*math.Sin(angle) - ReconstructedIm[i][k]*math.Cos(angle)
				}
				PictureRe[j][k] = sumRe
				PictureIm[j][k] = sumIm
			}
		}

		// Нормировка
		for i := 0; i < height; i++ {
			for j := 0; j < width; j++ {
				PictureRe[i][j] /= float64(height * width)
				PictureIm[i][j] /= float64(height * width)
			}
		}

		return PictureRe
	}

	redReconstructed := inverseDFT(redRe, redIm)
	greenReconstructed := inverseDFT(greenRe, greenIm)
	blueReconstructed := inverseDFT(blueRe, blueIm)

	// Собираем восстановленное изображение
	reconstructedImg := image.NewRGBA(img.Bounds())
	for y := 0; y < height; y++ {
		for x := 0; x < width; x++ {
			r := clampToUint8(redReconstructed[y][x])
			g := clampToUint8(greenReconstructed[y][x])
			b := clampToUint8(blueReconstructed[y][x])
			reconstructedImg.Set(x, y, color.RGBA{R: r, G: g, B: b, A: 255})
		}
	}

	// Сохраняем восстановленное изображение
	outFile, err := os.Create("reconstructed.bmp")
	if err != nil {
		fmt.Println("Error creating output file:", err)
		return
	}
	defer outFile.Close()

	png.Encode(outFile, reconstructedImg)
	fmt.Println("Reconstructed image saved as reconstructed.png")
}

// Функция для ограничения значения до диапазона [0, 255]
func clampToUint8(value float64) uint8 {
	if value < 0 {
		return 0
	}
	if value > 255 {
		return 255
	}
	return uint8(value)
}
