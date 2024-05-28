package services

import (
	"app/utils"
)

// Метод для применения обратного 2D-Фурье-преобразования
func ApplyIDFT2D(re, im [][]float64) ([][]float64, [][]float64) {
	// Выполнение обратного 2D-Фурье-преобразования
	resRe, resIm := utils.FT2D(re, im, -1)
	return resRe, resIm
}
