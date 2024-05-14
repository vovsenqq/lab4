// // Отрисовка маски в зависимости от параметра слайдера

// const slider2 = document.getElementById('slider_mask');
// const grid = document.getElementById('grid');

// function createGrid(size) {
//     grid.style.gridTemplateColumns = `repeat(${size}, 1fr)`;
//     grid.innerHTML = '';
//     for (let i = 0; i < size * size; i++) {
//         const cell = document.createElement('div');
//         cell.className = 'cell';
//         grid.appendChild(cell);
//     }
// }

// slider2.addEventListener('input', function() {
//     createGrid(this.value);
// });

// createGrid(slider2.value);