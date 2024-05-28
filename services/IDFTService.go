package services

import (
	"app/utils"
)

// Метод для применения Фурье-преобразования
func ApplyIDFT(re, im []float64) ([]float64, []float64) {

	// Выполнение прямого 1D-Фурье-преобразования
	resReal, resIm := utils.FT1D(re, im, -1)
	// greenSpectrumRe, greenSpectrumIm := utils.FT2D(greenRe, greenIm, 1)
	// blueSpectrumRe, blueSpectrumIm := utils.FT2D(blueRe, blueIm, 1)

	return resReal, resIm
}
