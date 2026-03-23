const boardElement = document.getElementById('game-board');
const throwsLeftElement = document.getElementById('throws-left');
const bombTrackerElement = document.getElementById('bomb-tracker');
const targetListElement = document.getElementById('target-list');
const messageElement = document.getElementById('message');
const newGameButton = document.getElementById('new-game-btn');
const recordValueElement = document.getElementById('record-value');
const difficultySelectElement = document.getElementById('difficulty-select');

const boardSize = 8;
const gameModes = {
	easy: {
		throws: 30,
		targetSizes: [3, 2]
	},
	normal: {
		throws: 24,
		targetSizes: [4, 3, 2]
	},
	hard: {
		throws: 18,
		targetSizes: [5, 4, 3, 2]
	}
};

const hitSound = new Audio('audio/freesound_community-splash-water-103984.mp3');
const missSound = new Audio('audio/Dirt.mp3');

let board = [];
let targets = [];
let currentDifficulty = difficultySelectElement.value;
let throwsLeft = gameModes[currentDifficulty].throws;
let throwsUsed = 0;
let gameOver = false;

function getRecordStorageKey() {
	return `cw-sploosh-best-throws-${currentDifficulty}`;
}

function playSound(soundEffect) {
	soundEffect.currentTime = 0;
	soundEffect.play().catch(() => {
		// Ignore playback errors if browser blocks sound before first user interaction.
	});
}

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
	const modeTargetSizes = gameModes[currentDifficulty].targetSizes;

	// Each target is a hidden pipe segment group, like Sploosh Kaboom fish/squids.
	modeTargetSizes.forEach((size, index) => {
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
	const totalThrowsForMode = gameModes[currentDifficulty].throws;

	for (let i = 0; i < totalThrowsForMode; i += 1) {
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
	const savedRecord = localStorage.getItem(getRecordStorageKey());

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
		messageElement.textContent = `You found every pipeline target in ${throwsUsed} attempts!`;

		const savedRecord = localStorage.getItem(getRecordStorageKey());
		const recordAsNumber = savedRecord === null ? null : Number(savedRecord);

		if (recordAsNumber === null || throwsUsed < recordAsNumber) {
			localStorage.setItem(getRecordStorageKey(), `${throwsUsed}`);
			updateRecordText();
			messageElement.textContent += ' New record!';
		}
	} else {
		messageElement.textContent = 'Out of attempts. Press New Game to try again.';
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
		playSound(hitSound);
		buttonElement.classList.add('hit');
		buttonElement.textContent = '★';

		const target = targets[currentCell.targetId];
		target.hits += 1;

		if (target.hits === target.size) {
			target.found = true;
			messageElement.textContent = `Nice! You found a full pipeline target of size ${target.size}.`;
		} else {
			messageElement.textContent = 'Hit! Keep searching around this area.';
		}
	} else {
		playSound(missSound);
		buttonElement.classList.add('miss');
		buttonElement.textContent = '✕';
		messageElement.textContent = 'Miss... no pipeline there.';
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
	throwsLeft = gameModes[currentDifficulty].throws;
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
difficultySelectElement.addEventListener('change', () => {
	currentDifficulty = difficultySelectElement.value;
	startNewGame();
	messageElement.textContent = `Difficulty set to ${currentDifficulty}. Board reset and ready.`;
});

startNewGame();
