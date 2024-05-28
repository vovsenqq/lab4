package utils

import "math"

// Функция для домножения данных на (-1)^(x+y)
func preProcess(re, im [][]float64) {
	height := len(re)
	width := len(re[0])
	for x := 0; x < height; x++ {
		for y := 0; y < width; y++ {
			if (x+y)%2 != 0 {
				re[x][y] *= -1
				im[x][y] *= -1
			}
		}
	}
}

// Функция для выполнения 1D-Фурье-преобразования
func fT1D(re, im []float64, dir int) ([]float64, []float64) {
	n := len(re)
	outRe := make([]float64, n)
	outIm := make([]float64, n)
	for k := 0; k < n; k++ {
		var sumRe, sumIm float64
		for t := 0; t < n; t++ {
			angle := 2 * math.Pi * float64(t) * float64(k) / float64(n)
			if dir == -1 {
				angle = -angle
			}
			sumRe += re[t]*math.Cos(angle) + im[t]*math.Sin(angle)
			sumIm += -re[t]*math.Sin(angle) + im[t]*math.Cos(angle)
		}
		outRe[k] = sumRe
		outIm[k] = sumIm
	}
	return outRe, outIm
}

// 2D Фурье-преобразование
func FT2D(re, im [][]float64, dir int) ([][]float64, [][]float64) {
	height := len(re)
	width := len(re[0])
	outRe := make([][]float64, height)
	outIm := make([][]float64, height)
	for i := range outRe {
		outRe[i] = make([]float64, width)
		outIm[i] = make([]float64, width)
	}

	if dir == 1 {
		// Домножение данных на (-1)^(x+y) перед прямым преобразованием
		preProcess(re, im)
	}

	// Преобразование по строкам
	for k := 0; k < height; k++ {
		outRe[k], outIm[k] = fT1D(re[k], im[k], dir)
	}

	// Преобразование по столбцам
	tempRe := make([]float64, height)
	tempIm := make([]float64, height)
	for k := 0; k < width; k++ {
		for i := 0; i < height; i++ {
			tempRe[i] = outRe[i][k]
			tempIm[i] = outIm[i][k]
		}
		tempRe, tempIm = fT1D(tempRe, tempIm, dir)
		for i := 0; i < height; i++ {
			outRe[i][k] = tempRe[i]
			outIm[i][k] = tempIm[i]
		}
	}

	// Нормализация, если это обратное преобразование
	if dir == -1 {
		for i := 0; i < height; i++ {
			for k := 0; k < width; k++ {
				outRe[i][k] /= float64(height * width)
				outIm[i][k] /= float64(height * width)
			}
		}
		// Домножение данных на (-1)^(x+y) после обратного преобразования
		preProcess(outRe, outIm)
	}

	return outRe, outIm
}
