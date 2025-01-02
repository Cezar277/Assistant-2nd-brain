const { BrowserWindow, ipcMain } = require("electron");

function createCheckboxPrompt(options, callback) {
  const promptWindow = new BrowserWindow({
    width: 400,
    height: 300,
    resizable: false,
    modal: true, // S'assure que la fenêtre est modale
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
    },
  });

  promptWindow.loadURL(
    "data:text/html;charset=utf-8," +
      encodeURIComponent(`
        <!DOCTYPE html>
        <html>
          <head>
            <style>
              body { font-family: Arial, sans-serif; margin: 20px; }
              ul { list-style-type: none; padding: 0; }
              li { margin-bottom: 10px; }
              button { margin-top: 20px; padding: 10px 20px; cursor: pointer; }
            </style>
          </head>
          <body>
            <h3>Select sessions to delete:</h3>
            <form id="checkboxForm">
              <ul>
                ${options
                  .map(
                    (option) =>
                      `<li><label><input type="checkbox" value="${option}" /> ${option}</label></li>`
                  )
                  .join("")}
              </ul>
              <button type="submit">Confirm</button>
            </form>
            <script>
              const { ipcRenderer } = require('electron');
              const form = document.getElementById('checkboxForm');
              form.addEventListener('submit', (event) => {
                event.preventDefault();
                const checked = Array.from(document.querySelectorAll('input[type="checkbox"]:checked'))
                  .map(input => input.value);
                ipcRenderer.send('checkbox-prompt-response', checked);
                window.close();
              });
            </script>
          </body>
        </html>
      `)
  );

  ipcMain.once("checkbox-prompt-response", (_, selectedOptions) => {
    callback(selectedOptions);
    promptWindow.close();
  });
}

module.exports = createCheckboxPrompt;
