const boardElement = document.getElementById('game-board');
const throwsLeftElement = document.getElementById('throws-left');
const bombTrackerElement = document.getElementById('bomb-tracker');
const targetListElement = document.getElementById('target-list');
const messageElement = document.getElementById('message');
const newGameButton = document.getElementById('new-game-btn');
const recordValueElement = document.getElementById('record-value');

const boardSize = 8;
const totalThrows = 24;
const targetSizes = [4, 3, 2];
const recordStorageKey = 'cw-sploosh-best-throws';

let board = [];
let targets = [];
let throwsLeft = totalThrows;
let throwsUsed = 0;
let gameOver = false;

function createEmptyBoard() {
	board = [];

	for (let row = 0; row < boardSize; row += 1) {
		const rowCells = [];

		for (let col = 0; col < boardSize; col += 1) {
			rowCells.push({
				hasTarget: false,
				clicked: false,
				targetId: null
			});
		}

		board.push(rowCells);
	}
}

function placeTargets() {
	targets = [];

	// Each target is a hidden pipe segment group, like Sploosh Kaboom fish/squids.
	targetSizes.forEach((size, index) => {
		let placed = false;

		while (!placed) {
			const isHorizontal = Math.random() < 0.5;
			const startRow = Math.floor(Math.random() * boardSize);
			const startCol = Math.floor(Math.random() * boardSize);
			const cells = [];

			for (let step = 0; step < size; step += 1) {
				const row = isHorizontal ? startRow : startRow + step;
				const col = isHorizontal ? startCol + step : startCol;

				if (row >= boardSize || col >= boardSize) {
					cells.length = 0;
					break;
				}

				if (board[row][col].hasTarget) {
					cells.length = 0;
					break;
				}

				cells.push({ row, col });
			}

			if (cells.length === size) {
				cells.forEach((cell) => {
					board[cell.row][cell.col].hasTarget = true;
					board[cell.row][cell.col].targetId = index;
				});

				targets.push({
					id: index,
					size,
					hits: 0,
					found: false
				});

				placed = true;
			}
		}
	});
}

function createBoardCells() {
	boardElement.innerHTML = '';

	for (let row = 0; row < boardSize; row += 1) {
		for (let col = 0; col < boardSize; col += 1) {
			const button = document.createElement('button');
			button.type = 'button';
			button.className = 'cell';
			button.dataset.row = row;
			button.dataset.col = col;
			button.setAttribute('aria-label', `Row ${row + 1}, Column ${col + 1}`);

			button.addEventListener('click', () => {
				handleCellClick(row, col, button);
			});

			boardElement.appendChild(button);
		}
	}
}

function renderBombTracker() {
	bombTrackerElement.innerHTML = '';

	for (let i = 0; i < totalThrows; i += 1) {
		const bomb = document.createElement('div');
		bomb.className = 'bomb';

		if (i >= throwsLeft) {
			bomb.classList.add('used');
		}

		bombTrackerElement.appendChild(bomb);
	}
}

function renderTargetList() {
	targetListElement.innerHTML = '';

	targets.forEach((target) => {
		const item = document.createElement('li');
		item.className = 'target-item';

		if (target.found) {
			item.classList.add('found');
		}

		const icon = document.createElement('span');
		icon.className = 'target-icon';
		icon.textContent = '★'.repeat(target.size);

		const status = document.createElement('span');
		status.textContent = target.found ? 'Found' : `${target.hits}/${target.size}`;

		item.appendChild(icon);
		item.appendChild(status);
		targetListElement.appendChild(item);
	});
}

function updateRecordText() {
	const savedRecord = localStorage.getItem(recordStorageKey);

	if (savedRecord === null) {
		recordValueElement.textContent = '--';
	} else {
		recordValueElement.textContent = savedRecord;
	}
}

function allTargetsFound() {
	return targets.every((target) => target.found);
}

function finishGame(win) {
	gameOver = true;

	const allCells = document.querySelectorAll('.cell');
	allCells.forEach((cell) => {
		cell.classList.add('disabled');
	});

	if (win) {
		messageElement.textContent = `You found every pipeline in ${throwsUsed} throws!`;

		const savedRecord = localStorage.getItem(recordStorageKey);
		const recordAsNumber = savedRecord === null ? null : Number(savedRecord);

		if (recordAsNumber === null || throwsUsed < recordAsNumber) {
			localStorage.setItem(recordStorageKey, `${throwsUsed}`);
			updateRecordText();
			messageElement.textContent += ' New record!';
		}
	} else {
		messageElement.textContent = 'Out of splashes. Press New Game to try again.';
	}
}

function handleCellClick(row, col, buttonElement) {
	if (gameOver) {
		return;
	}

	const currentCell = board[row][col];

	if (currentCell.clicked) {
		return;
	}

	currentCell.clicked = true;
	throwsLeft -= 1;
	throwsUsed += 1;
	throwsLeftElement.textContent = `${throwsLeft}`;

	if (currentCell.hasTarget) {
		buttonElement.classList.add('hit');
		buttonElement.textContent = '★';

		const target = targets[currentCell.targetId];
		target.hits += 1;

		if (target.hits === target.size) {
			target.found = true;
			messageElement.textContent = `Nice! You found a full target of size ${target.size}.`;
		} else {
			messageElement.textContent = 'Hit! Keep searching around this area.';
		}
	} else {
		buttonElement.classList.add('miss');
		buttonElement.textContent = '✕';
		messageElement.textContent = 'Splash... no pipeline there.';
	}

	buttonElement.classList.add('disabled');
	renderBombTracker();
	renderTargetList();

	if (allTargetsFound()) {
		finishGame(true);
		return;
	}

	if (throwsLeft === 0) {
		finishGame(false);
	}
}

function startNewGame() {
	throwsLeft = totalThrows;
	throwsUsed = 0;
	gameOver = false;
	throwsLeftElement.textContent = `${throwsLeft}`;
	messageElement.textContent = 'Click any square to start searching.';

	createEmptyBoard();
	placeTargets();
	createBoardCells();
	renderBombTracker();
	renderTargetList();
	updateRecordText();
}

newGameButton.addEventListener('click', startNewGame);
startNewGame();
