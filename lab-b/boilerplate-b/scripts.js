// Elementy DOM
const taskForm = document.getElementById('taskForm');
const taskList = document.getElementById('taskList');
const searchInput = document.getElementById('searchInput');

// lista zadan
let tasks = JSON.parse(localStorage.getItem('todo_tasks')) || [];

// sledzenie edycji
let currentlyEditingIndex = null;

// FUNKCJA RENDERUJĄCA LISTĘ
const renderTasks = (filter = "") => {
  taskList.innerHTML = "";

  tasks.forEach((task, index) => {
    const showTask = filter.length < 2 || task.title.toLowerCase().includes(filter.toLowerCase());
    if (!showTask) return;

    const li = document.createElement('li');
    li.className = "Task";

    li.addEventListener('click', (e) => {
      if (currentlyEditingIndex === null) {
        e.stopPropagation();
        editTask(index, li);
      }
    });

    // podswiedlenie wyszukiwanych liter
    let displayTitle = task.title;
    if (filter.length >= 2) {
      const regex = new RegExp(`(${filter})`, "gi");
      displayTitle = task.title.replace(regex, `<span class="highlight">$1</span>`);
    }

    li.innerHTML = `
      <div>
          <h3 class="TitleDisplay">${displayTitle}</h3>
      </div>
      <p>${task.date ? task.date.replace('T', ' ') : 'Brak terminu'}</p>
      <div class="IconWrapper">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0"/>
          </svg>
      </div>
    `;

    const deleteBtn = li.querySelector('.IconWrapper');
    deleteBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      deleteTask(index);
    });

    taskList.appendChild(li);
  });
};

// DODAWANIE ZADANIA + WALIDACJA
taskForm.addEventListener('submit', (e) => {
  e.preventDefault();
  const title = document.getElementById('taskTitle').value.trim();
  const dateValue = document.getElementById('taskDate').value;

  const now = new Date();
  const selectedDate = new Date(dateValue);

  if (title.length < 3 || title.length > 255) {
    alert("Tytuł musi mieć od 3 do 255 znaków.");
    return;
  }
  if (dateValue && selectedDate < now) {
    alert("Data musi być w przyszłości!");
    return;
  }

  tasks.push({title, date: dateValue});
  saveAndRender();
  taskForm.reset();
});

// USUWANIE
const deleteTask = (index) => {
  tasks.splice(index, 1);
  saveAndRender();
};

// EDYCJA
const editTask = (index, li) => {
  const task = tasks[index];
  currentlyEditingIndex = index; // ustawiamy edytowany indeks

  li.innerHTML = `
    <input type="text" class="EditInput" value="${task.title}">
    <input type="datetime-local" class="EditDate" value="${task.date ? task.date : ''}">
  `;

  const inputTitle = li.querySelector('.EditInput');
  const inputDate = li.querySelector('.EditDate');

  inputTitle.focus();

  const saveEdit = () => {
    const newTitle = inputTitle.value.trim();
    const newDate = inputDate.value;

    if (newTitle.length >= 3 && newTitle.length <= 255) task.title = newTitle;

    if (newDate) {
      const now = new Date();
      const selectedDate = new Date(newDate);
      if (selectedDate >= now) task.date = newDate;
      else alert("Data musi być w przyszłości! Nie zmieniono daty.");
    } else task.date = '';

    currentlyEditingIndex = null;
    document.removeEventListener('click', handleClickOutside);
    saveAndRender();
  };

  const handleClickOutside = (event) => {
    if (!li.contains(event.target)) saveEdit();
  };

  setTimeout(() => document.addEventListener('click', handleClickOutside), 0);

  // Enter zapisuje
  inputTitle.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') saveEdit();
  });
  inputDate.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') saveEdit();
  });

  // Kliknięcie w inputy nie zamyka edycji
  inputTitle.addEventListener('click', (e) => e.stopPropagation());
  inputDate.addEventListener('click', (e) => e.stopPropagation());
};

// WYSZUKIWANIE
searchInput.addEventListener('input', (e) => renderTasks(e.target.value));

// Zapis
const saveAndRender = () => {
  localStorage.setItem('todo_tasks', JSON.stringify(tasks));
  renderTasks(searchInput.value);
};

// Renderowanie zadan
renderTasks();
