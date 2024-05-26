package utils

import (
	"github.com/runningwild/go-fftw/fftw"
)

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

// Преобразование в 1D с использованием FFTW
func FFT1D(re, im []float64, dir int) ([]float64, []float64) {
	n := len(re)
	input := fftw.NewArray(n)
	for i := range re {
		input.Set(i, complex(re[i], im[i]))
	}

	var output *fftw.Array
	if dir == 1 {
		output = fftw.FFT(input)
	} else {
		output = fftw.IFFT(input)
		// Нормализация для обратного преобразования
		for i := 0; i < n; i++ {
			output.Set(i, output.At(i)/complex(float64(n), 0))
		}
	}

	outRe := make([]float64, n)
	outIm := make([]float64, n)
	for i := 0; i < n; i++ {
		outRe[i] = real(output.At(i))
		outIm[i] = imag(output.At(i))
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
		outRe[k], outIm[k] = FFT1D(re[k], im[k], dir)
	}

	// Преобразование по столбцам
	tempRe := make([]float64, height)
	tempIm := make([]float64, height)
	for k := 0; k < width; k++ {
		for i := 0; i < height; i++ {
			tempRe[i] = outRe[i][k]
			tempIm[i] = outIm[i][k]
		}
		tempRe, tempIm = FFT1D(tempRe, tempIm, dir)
		for i := 0; i < height; i++ {
			outRe[i][k] = tempRe[i]
			outIm[i][k] = tempIm[i]
		}
	}

	if dir == -1 {
		// Домножение данных на (-1)^(x+y) после обратного преобразования
		preProcess(outRe, outIm)
	}

	return outRe, outIm
}
