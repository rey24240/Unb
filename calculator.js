(() => {
  const display = document.getElementById('display');
  const expression = document.getElementById('expression');
  const keypad = document.querySelector('.keypad');
  const tapCounter = document.getElementById('tapCounter');
  const clickCount = document.getElementById('clickCount');
  const operationSymbols = { add: '+', subtract: '−', multiply: '×', divide: '÷' };
  let displayValue = '0';
  let storedValue = null;
  let pendingOperation = null;
  let waitingForOperand = false;
  let lastExpression = '';
  let consecutiveZeros = 0;
  let totalClicks = 0;

  function countClick() {
    totalClicks += 1;
    clickCount.textContent = totalClicks;
  }

  function openLibrary() {
    const libraryTab = window.open('about:blank', '_blank');
    if (!libraryTab) {
      window.alert('Allow pop-ups to open the game library.');
      return;
    }

    libraryTab.document.title = 'Games Library';
    libraryTab.document.documentElement.style.cssText = 'width:100%;height:100%;';
    libraryTab.document.body.style.cssText = 'width:100%;height:100%;margin:0;overflow:hidden;';
    const frame = libraryTab.document.createElement('iframe');
    frame.title = 'Games Library';
    frame.src = '/unb/games.html';
    frame.style.cssText = 'display:block;width:100%;height:100%;border:0;';
    libraryTab.document.body.replaceChildren(frame);
  }

  function formatted(value) {
    if (!Number.isFinite(value)) return 'Error';
    return String(Number.parseFloat(value.toPrecision(12)));
  }

  function updateDisplay() {
    display.textContent = displayValue;
    expression.textContent = pendingOperation && storedValue !== null
      ? `${formatted(storedValue)} ${operationSymbols[pendingOperation]}`
      : lastExpression || '\u00a0';
    keypad.querySelectorAll('[data-operation]').forEach(button => {
      button.setAttribute('aria-pressed', String(button.dataset.operation === pendingOperation));
    });
  }

  function enterDigit(digit) {
    if (displayValue === 'Error' || waitingForOperand) {
      displayValue = digit;
      waitingForOperand = false;
    } else if (displayValue.replace('-', '').replace('.', '').length < 12) {
      displayValue = displayValue === '0' ? digit : displayValue + digit;
    }
    lastExpression = '';
  }

  function calculate(left, right, operation) {
    if (operation === 'add') return left + right;
    if (operation === 'subtract') return left - right;
    if (operation === 'multiply') return left * right;
    if (operation === 'divide') return right === 0 ? NaN : left / right;
    return right;
  }

  function chooseOperation(operation) {
    const input = Number(displayValue);
    if (!Number.isFinite(input)) return;
    if (pendingOperation && !waitingForOperand) {
      const result = calculate(storedValue, input, pendingOperation);
      displayValue = formatted(result);
      storedValue = Number(displayValue);
    } else {
      storedValue = input;
    }
    pendingOperation = operation;
    waitingForOperand = true;
    lastExpression = '';
  }

  function equals() {
    if (!pendingOperation || storedValue === null || displayValue === 'Error') return;
    const right = Number(displayValue);
    const result = calculate(storedValue, right, pendingOperation);
    lastExpression = `${formatted(storedValue)} ${operationSymbols[pendingOperation]} ${formatted(right)} =`;
    displayValue = formatted(result);
    storedValue = null;
    pendingOperation = null;
    waitingForOperand = true;
  }

  function handleAction(action) {
    if (action === 'clear') {
      displayValue = '0'; storedValue = null; pendingOperation = null; waitingForOperand = false; lastExpression = '';
    } else if (action === 'decimal') {
      if (displayValue === 'Error' || waitingForOperand) { displayValue = '0.'; waitingForOperand = false; }
      else if (!displayValue.includes('.')) displayValue += '.';
      lastExpression = '';
    } else if (action === 'sign' && displayValue !== '0' && displayValue !== 'Error') {
      displayValue = displayValue.startsWith('-') ? displayValue.slice(1) : `-${displayValue}`;
    } else if (action === 'percent' && displayValue !== 'Error') {
      displayValue = formatted(Number(displayValue) / 100);
      waitingForOperand = false;
    } else if (action === 'backspace' && displayValue !== 'Error') {
      if (waitingForOperand) return;
      displayValue = displayValue.length > 1 ? displayValue.slice(0, -1) : '0';
      if (displayValue === '-') displayValue = '0';
    } else if (action === 'equals') {
      equals();
    }
  }

  function activate(target) {
    if (!(target instanceof Element)) return;
    const digit = target.closest('[data-digit]')?.dataset.digit;
    const operation = target.closest('[data-operation]')?.dataset.operation;
    const action = target.closest('[data-action]')?.dataset.action;
    consecutiveZeros = digit === '0' ? consecutiveZeros + 1 : 0;
    if (consecutiveZeros === 4) {
      consecutiveZeros = 0;
      openLibrary();
      return;
    }
    if (digit !== undefined) enterDigit(digit);
    else if (operation) chooseOperation(operation);
    else if (action) handleAction(action);
    updateDisplay();
  }

  keypad.addEventListener('click', event => {
    if (event.target.closest('.key')) countClick();
    activate(event.target);
  });
  tapCounter.addEventListener('click', countClick);
  document.addEventListener('keydown', event => {
    if (/^[0-9]$/.test(event.key)) activate(keypad.querySelector(`[data-digit="${event.key}"]`));
    else if (event.key === '.') activate(keypad.querySelector('[data-action="decimal"]'));
    else if (event.key === 'Enter' || event.key === '=') { event.preventDefault(); activate(keypad.querySelector('[data-action="equals"]')); }
    else if (event.key === 'Backspace') { event.preventDefault(); activate(keypad.querySelector('[data-action="backspace"]')); }
    else if (event.key === 'Escape' || event.key === 'Delete') activate(keypad.querySelector('[data-action="clear"]'));
    else {
      const operations = { '+': 'add', '-': 'subtract', '*': 'multiply', '/': 'divide' };
      if (operations[event.key]) activate(keypad.querySelector(`[data-operation="${operations[event.key]}"]`));
      else if (event.key === '%') activate(keypad.querySelector('[data-action="percent"]'));
    }
  });

  updateDisplay();
})();