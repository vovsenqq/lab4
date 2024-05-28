// package utils

// import (
// 	"github.com/runningwild/go-fftw/fftw"
// )

// // preProcess домножает данные на (-1)^(x+y) для устранения эффекта aliasing.
// func preProcess(re, im [][]float64) {
// 	height := len(re)
// 	width := len(re[0])
// 	for x := 0; x < height; x++ {
// 		for y := 0; y < width; y++ {
// 			if (x+y)%2 != 0 {
// 				re[x][y] *= -1
// 				im[x][y] *= -1
// 			}
// 		}
// 	}
// }

// // FFT1D выполняет одномерное преобразование Фурье с использованием библиотеки FFTW.
// func FFT1D(re, im []float64, dir int) ([]float64, []float64) {
// 	n := len(re)

// 	// Создание нового массива для библиотеки FFTW размером n
// 	input := fftw.NewArray(n)

// 	// Заполнение массива комплексными числами, где реальная часть - это элементы из re, а мнимая часть - это элементы из im
// 	for i := range re {
// 		input.Set(i, complex(re[i], im[i]))
// 	}

// 	var output *fftw.Array
// 	if dir == 1 {
// 		// Прямое преобразование Фурье
// 		output = fftw.FFT(input)
// 	} else {
// 		// Обратное преобразование Фурье
// 		output = fftw.IFFT(input)
// 		// Нормализация для обратного преобразования, деление каждого элемента на n
// 		for i := 0; i < n; i++ {
// 			output.Set(i, output.At(i)/complex(float64(n), 0))
// 		}
// 	}

// 	// Создание массивов для хранения реальной и мнимой частей результата
// 	outRe := make([]float64, n)
// 	outIm := make([]float64, n)

// 	// Извлечение реальной и мнимой частей из результата преобразования
// 	for i := 0; i < n; i++ {
// 		outRe[i] = real(output.At(i))
// 		outIm[i] = imag(output.At(i))
// 	}

// 	return outRe, outIm
// }

// // FT2D выполняет двумерное преобразование Фурье.
// func FT2D(re, im [][]float64, dir int) ([][]float64, [][]float64) {
// 	height := len(re)
// 	width := len(re[0])

// 	// Инициализация выходных массивов для реальной и мнимой частей
// 	outRe := make([][]float64, height)
// 	outIm := make([][]float64, height)
// 	for i := range outRe {
// 		outRe[i] = make([]float64, width)
// 		outIm[i] = make([]float64, width)
// 	}

// 	if dir == 1 {
// 		// Домножение данных на (-1)^(x+y) перед прямым преобразованием
// 		preProcess(re, im)
// 	}

// 	// Преобразование по строкам
// 	for k := 0; k < height; k++ {
// 		outRe[k], outIm[k] = FFT1D(re[k], im[k], dir)
// 	}

// 	// Преобразование по столбцам
// 	tempRe := make([]float64, height)
// 	tempIm := make([]float64, height)
// 	for k := 0; k < width; k++ {
// 		// Извлечение столбца из 2D массива
// 		for i := 0; i < height; i++ {
// 			tempRe[i] = outRe[i][k]
// 			tempIm[i] = outIm[i][k]
// 		}
// 		// Преобразование столбца как одномерного массива
// 		tempRe, tempIm = FFT1D(tempRe, tempIm, dir)
// 		// Возвращение преобразованного столбца обратно в 2D массив
// 		for i := 0; i < height; i++ {
// 			outRe[i][k] = tempRe[i]
// 			outIm[i][k] = tempIm[i]
// 		}
// 	}

// 	if dir == -1 {
// 		// Домножение данных на (-1)^(x+y) после обратного преобразования
// 		preProcess(outRe, outIm)
// 	}

// 	return outRe, outIm
// }

package utils

import "math"

// Функция для домножения данных на (-1)^(x+y)
// func preProcess(re, im [][]float64) {
// 	height := len(re)
// 	width := len(re[0])
// 	for x := 0; x < height; x++ {
// 		for y := 0; y < width; y++ {
// 			if (x+y)%2 != 0 {
// 				re[x][y] *= -1
// 				im[x][y] *= -1
// 			}
// 		}
// 	}
// }

// Функция для домножения данных на (-1)^(x+y)
func preProcess2(re, im []float64) {
	height := len(re)
	for x := 0; x < height; x++ {
		if (x)%2 != 0 {
			re[x] *= -1
			im[x] *= -1
		}
	}
}

// Функция для выполнения 1D-Фурье-преобразования
func FT1D(re, im []float64, dir int) ([]float64, []float64) {
	n := len(re)
	outRe := make([]float64, n)
	outIm := make([]float64, n)

	// Применяем препроцессинг
	preProcess2(re, im)

	for k := 0; k < n; k++ {
		var sumRe, sumIm float64
		for t := 0; t < n; t++ {
			angle := 2 * math.Pi * float64(t) * float64(k) / float64(n)
			if dir == -1 {
				angle = -angle
			}
			sumRe += re[t]*math.Cos(angle) - im[t]*math.Sin(angle)
			sumIm += re[t]*math.Sin(angle) + im[t]*math.Cos(angle)
		}
		if dir == -1 {
			// Нормализуем результаты для обратного преобразования
			sumRe /= float64(n)
			sumIm /= float64(n)
		}
		outRe[k] = sumRe
		outIm[k] = sumIm
	}

	// Применяем препроцессинг обратно
	preProcess2(outRe, outIm)

	return outRe, outIm
}

// // 2D Фурье-преобразование
// func FT2D(re, im [][]float64, dir int) ([][]float64, [][]float64) {
// 	height := len(re)
// 	width := len(re[0])
// 	outRe := make([][]float64, height)
// 	outIm := make([][]float64, height)
// 	for i := range outRe {
// 		outRe[i] = make([]float64, width)
// 		outIm[i] = make([]float64, width)
// 	}

// 	if dir == 1 {
// 		// Домножение данных на (-1)^(x+y) перед прямым преобразованием
// 		preProcess(re, im)
// 	}

// 	// Преобразование по строкам
// 	for k := 0; k < height; k++ {
// 		outRe[k], outIm[k] = FT1D(re[k], im[k], dir)
// 	}

// 	// // Преобразование по столбцам
// 	// tempRe := make([]float64, height)
// 	// tempIm := make([]float64, height)
// 	// for k := 0; k < width; k++ {
// 	// 	for i := 0; i < height; i++ {
// 	// 		tempRe[i] = outRe[i][k]
// 	// 		tempIm[i] = outIm[i][k]
// 	// 	}
// 	// 	tempRe, tempIm = FT1D(tempRe, tempIm, dir)
// 	// 	for i := 0; i < height; i++ {
// 	// 		outRe[i][k] = tempRe[i]
// 	// 		outIm[i][k] = tempIm[i]
// 	// 	}
// 	// }

// 	// Нормализация, если это обратное преобразование
// 	if dir == -1 {
// 		for i := 0; i < height; i++ {
// 			for k := 0; k < width; k++ {
// 				outRe[i][k] /= float64(height * width)
// 				outIm[i][k] /= float64(height * width)
// 			}
// 		}
// 		// Домножение данных на (-1)^(x+y) после обратного преобразования
// 		preProcess(outRe, outIm)
// 	}

// 	return outRe, outIm
// }
