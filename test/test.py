import numpy as np
import matplotlib.pyplot as plt
from PIL import Image

# Загрузите изображение
img = Image.open('7.bmp')

# Разделите изображение на каналы RGB
r, g, b = img.split()

# Функция для вычисления и отображения спектра
def plot_spectrum(channel, color):
    # Примените преобразование Фурье к каналу
    f = np.fft.fft2(channel)
    fshift = np.fft.fftshift(f)

    # Получите амплитудный спектр и преобразуйте его в логарифмическую шкалу
    magnitude_spectrum = 20*np.log1p(np.abs(fshift))

    # Постройте спектр
    plt.imshow(magnitude_spectrum, cmap=color)
    plt.title(f'{color} Spectrum')
    plt.show()

# Постройте спектры для каждого канала
plot_spectrum(r, 'Reds')
plot_spectrum(g, 'Greens')
plot_spectrum(b, 'Blues')
