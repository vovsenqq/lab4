package services

import (
	"app/utils"
	"image"
	"image/color"
	// "image/png"
	// "os"
)

// ApplyDFT применяет фурье преобразование спектрам
func ApplyIDFT(redRe, redIm, greenRe, greenIm, blueRe, blueIm [][]float64) image.Image {
	height := len(redRe)
	width := len(redRe[0])

	redReconstructed, _ := utils.FT2D(redRe, redIm, -1)
	greenReconstructed, _ := utils.FT2D(greenRe, greenIm, -1)
	blueReconstructed, _ := utils.FT2D(blueRe, blueIm, -1)

	rect := image.Rect(0, 0, width, height)
	// Собираем восстановленное изображение
	reconstructedImg := image.NewRGBA(rect)
	for y := 0; y < height; y++ {
		for x := 0; x < width; x++ {
			r := clampToUint8(redReconstructed[y][x])
			g := clampToUint8(greenReconstructed[y][x])
			b := clampToUint8(blueReconstructed[y][x])
			reconstructedImg.Set(x, y, color.RGBA{R: r, G: g, B: b, A: 255})
		}
	}

	// // Сохраняем восстановленное изображение
	// outFile, _ := os.Create("D:/goback/lab2/reconstructed.bmp")

	// defer outFile.Close()

	// png.Encode(outFile, reconstructedImg)
	return reconstructedImg
}

// Функция для ограничения значения до диапазона [0, 255]
func clampToUint8(value float64) uint8 {
	if value < 0 {
		return 0
	} else if value > 255 {
		return 255
	}
	return uint8(value)
}
