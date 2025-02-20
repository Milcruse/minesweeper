document.addEventListener('DOMContentLoaded', () => {
    const board = document.querySelector('.board');
    const startBtn = document.querySelector('.start-btn');
    const settingsBtn = document.querySelector('.settings-btn');
    const options = document.querySelector('.options');
    const difficultySelect = document.querySelector('#difficulty');
    const bombCountInput = document.querySelector('#bomb-count');
    const saveSettingsBtn = document.querySelector('.save-settings-btn');
    const flagCountDisplay = document.querySelector('.flag-count');
    const instructionsPopup = document.getElementById('instructions-popup');
    const showInstructionsBtn = document.getElementById('show-instructions-btn');
    const closeInstructionsBtn = document.getElementById('close-instructions-btn');

    // Показать/скрыть инструкцию
    if (showInstructionsBtn && instructionsPopup && closeInstructionsBtn) {
        showInstructionsBtn.addEventListener('click', () => {
            instructionsPopup.classList.add('active');
        });

        closeInstructionsBtn.addEventListener('click', () => {
            instructionsPopup.classList.remove('active');
        });
    }

    let rows = 10;
    let cols = 10;
    let bombCount = 10;
    let firstClick = true;
    let gameOver = false;
    let cells = [];
    let flagsPlaced = 0;

    // Настройки по умолчанию
    const settings = {
        easy: { rows: 10, cols: 10, bombs: 10 },
        hard: { rows: 16, cols: 16, bombs: 40 }
    };

    // Инициализация игры
    function initGame() {
        board.style.gridTemplateColumns = `repeat(${cols}, 40px)`;
        board.innerHTML = '';
        cells = [];
        firstClick = true;
        gameOver = false;
        flagsPlaced = 0;
        updateFlagCount();

        // Создание ячеек
        for (let i = 0; i < rows * cols; i++) {
            const cell = document.createElement('div');
            cell.classList.add('cell');
            cell.dataset.index = i;

            cell.addEventListener('click', handleLeftClick);
            cell.addEventListener('contextmenu', handleRightClick);
            board.appendChild(cell);
            cells.push({
                element: cell,
                isBomb: false,
                revealed: false,
                flagged: false,
                neighborBombs: 0
            });
        }
    }

    // Обновление отображения количества флажков
    function updateFlagCount() {
        if (flagCountDisplay) {
            flagCountDisplay.textContent = `Флажки: ${flagsPlaced} / ${bombCount}`;
        }
    }

    // Обработка левого клика
    function handleLeftClick(e) {
        if (gameOver) return;
        const index = parseInt(e.target.dataset.index);
        const cell = cells[index];

        if (cell.flagged || cell.revealed) return;

        if (firstClick) {
            firstClick = false;
            generateBombs(index);
            calculateNumbers();
        }

        if (cell.isBomb) {
            gameOver = true;
            revealAll();
            showNotification('Поражение!', 'lose');
            return;
        }

        revealCell(index);
        checkWin();
    }

    // Обработка правого клика
    function handleRightClick(e) {
        e.preventDefault();
        if (gameOver || firstClick) return;
        const index = parseInt(e.target.dataset.index);
        const cell = cells[index];

        if (!cell.revealed) {
            if (!cell.flagged && flagsPlaced >= bombCount) return; // Нельзя поставить больше флажков, чем бомб
            cell.flagged = !cell.flagged;
            cell.element.classList.toggle('flag', cell.flagged);
            flagsPlaced += cell.flagged ? 1 : -1;
            updateFlagCount();
        }
    }

    // Генерация бомб после первого клика
    function generateBombs(firstIndex) {
        const exclude = getNeighbors(firstIndex);
        exclude.push(firstIndex);

        let bombsPlaced = 0;
        while (bombsPlaced < bombCount) {
            const randomIndex = Math.floor(Math.random() * cells.length);
            if (!exclude.includes(randomIndex) && !cells[randomIndex].isBomb) {
                cells[randomIndex].isBomb = true;
                bombsPlaced++;
            }
        }
    }

    // Подсчет числа бомб вокруг
    function calculateNumbers() {
        cells.forEach((cell, index) => {
            if (!cell.isBomb) {
                cell.neighborBombs = getNeighbors(index).filter(i => cells[i].isBomb).length;
            }
        });
    }

    // Открытие клетки
    function revealCell(index) {
        const cell = cells[index];
        if (cell.revealed || cell.flagged) return;

        cell.revealed = true;
        cell.element.classList.add('revealed');

        if (cell.neighborBombs > 0) {
            cell.element.textContent = cell.neighborBombs;
            cell.element.setAttribute('data-number', cell.neighborBombs); // Добавляем атрибут
        } else {
            getNeighbors(index).forEach(neighbor => revealCell(neighbor));
        }
    }

    // Получение соседей клетки
    function getNeighbors(index) {
        const neighbors = [];
        const row = Math.floor(index / cols);
        const col = index % cols;

        for (let i = -1; i <= 1; i++) {
            for (let j = -1; j <= 1; j++) {
                if (i === 0 && j === 0) continue;
                const newRow = row + i;
                const newCol = col + j;
                if (newRow >= 0 && newRow < rows && newCol >= 0 && newCol < cols) {
                    neighbors.push(newRow * cols + newCol);
                }
            }
        }
        return neighbors;
    }

    // Проверка победы
    function checkWin() {
        const nonBombCells = cells.filter(cell => !cell.isBomb);
        if (nonBombCells.every(cell => cell.revealed)) {
            gameOver = true;
            showNotification('Победа!', 'win');
        }
    }

    // Показать уведомление
    function showNotification(text, type) {
        const notification = document.createElement('div');
        notification.className = `game-message ${type}`;
        notification.textContent = text;
        document.body.appendChild(notification);

        setTimeout(() => {
            notification.remove();
        }, 3000);
    }

    // Открыть все клетки при поражении
    function revealAll() {
        cells.forEach((cell, index) => {
            if (cell.isBomb) {
                cell.element.classList.add('bomb');
            }
        });
    }

    // Обработчики событий
    if (startBtn) {
        startBtn.addEventListener('click', () => {
            const difficulty = difficultySelect.value;
            bombCount = parseInt(bombCountInput.value);

            if (difficulty === 'hard') {
                rows = settings.hard.rows;
                cols = settings.hard.cols;
            } else {
                rows = settings.easy.rows;
                cols = settings.easy.cols;
            }

            initGame();
        });
    }

    if (settingsBtn && options) {
        settingsBtn.addEventListener('click', () => {
            options.classList.toggle('hide');
        });
    }

    if (saveSettingsBtn && options) {
        saveSettingsBtn.addEventListener('click', () => {
            options.classList.add('hide');
        });
    }
});
