package services

import (
	"app/utils"
	"fmt"
	"image"
)

// Метод для применения Фурье-преобразования к изображению
func ApplyDFT(img image.Image) ([][]float64, [][]float64, [][]float64, [][]float64, [][]float64, [][]float64) {
	// Получение пикселей изображения
	pixels, err := utils.GetPixels(img)
	if err != nil {
		fmt.Println("Error: Image could not be converted to pixels")
		return nil, nil, nil, nil, nil, nil
	}

	height := len(pixels)
	width := len(pixels[0])

	// Инициализация данных для каждого канала
	redRe := make([][]float64, height)
	redIm := make([][]float64, height)
	greenRe := make([][]float64, height)
	greenIm := make([][]float64, height)
	blueRe := make([][]float64, height)
	blueIm := make([][]float64, height)

	for i := range redRe {
		redRe[i] = make([]float64, width)
		redIm[i] = make([]float64, width)
		greenRe[i] = make([]float64, width)
		greenIm[i] = make([]float64, width)
		blueRe[i] = make([]float64, width)
		blueIm[i] = make([]float64, width)
	}

	// Заполнение действительных значений для каждого канала
	for y := 0; y < height; y++ {
		for x := 0; x < width; x++ {
			pixel := pixels[y][x]
			redRe[y][x] = float64(pixel.R)
			greenRe[y][x] = float64(pixel.G)
			blueRe[y][x] = float64(pixel.B)
		}
	}

	// Выполнение прямого 2D-Фурье-преобразования для каждого канала
	redSpectrumRe, redSpectrumIm := utils.FT2D(redRe, redIm, 1)
	greenSpectrumRe, greenSpectrumIm := utils.FT2D(greenRe, greenIm, 1)
	blueSpectrumRe, blueSpectrumIm := utils.FT2D(blueRe, blueIm, 1)

	return redSpectrumRe, redSpectrumIm, greenSpectrumRe, greenSpectrumIm, blueSpectrumRe, blueSpectrumIm
}
