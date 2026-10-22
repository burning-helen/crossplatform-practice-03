const showDirectoryButton = document.getElementById('show-directory');
const statusElement = document.getElementById('status');
const fileList = document.getElementById('file-list');

let isLoading = false;

async function refreshDirectory() {
  if (isLoading) {
    return;
  }

  isLoading = true;
  showDirectoryButton.disabled = true;

  statusElement.classList.remove('error');
  statusElement.textContent = 'Чтение каталога...';
  fileList.replaceChildren();

  try {
    const entries = await window.api.listDir('.');
    const fragment = document.createDocumentFragment();

    for (const entry of entries) {
      const item = document.createElement('li');

      item.className = entry.isDir ? 'directory' : 'file';
      item.textContent = `${entry.isDir ? '📁' : '📄'} ${entry.name}`;

      fragment.appendChild(item);
    }

    fileList.appendChild(fragment);

    const directoriesCount = entries.filter((entry) => entry.isDir).length;
    const filesCount = entries.length - directoriesCount;

    statusElement.textContent = entries.length === 0
      ? 'Каталог пуст.'
      : `Всего записей: ${entries.length}. Папок: ${directoriesCount}. Файлов и других записей: ${filesCount}.`;
  } catch (error) {
    console.error('Ошибка чтения каталога:', error);

    statusElement.classList.add('error');
    statusElement.textContent = `Не удалось прочитать каталог: ${error.message}`;
  } finally {
    isLoading = false;
    showDirectoryButton.disabled = false;
  }
}

showDirectoryButton.addEventListener('click', refreshDirectory);

const unsubscribeRefresh = window.api.onRefreshDirectory(() => {
  refreshDirectory();
});

window.addEventListener('beforeunload', () => {
  unsubscribeRefresh();
}, { once: true });