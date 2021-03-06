// Import the used modules
import * as api from "./api.js";
import * as buttons from "./buttons.js";
import * as spinner from "./spinner.js";
import * as notifications from "./notifications.js";

// Set up the buttons
buttons.setupButtons();
buttons.setupKeybinds();

// Load the API information
async function loadAPIInformation() {
    const response = await api.getAPIInformation();
    if (!response.ok) {
        const data = await response.text();
        notifications.error("Failed fetching the API information: <b>" + data + "</b>");
        return;
    }
    const data = await response.json();
    document.getElementById("version").innerText = data.version;
}
loadAPIInformation();

// Try to load a paste if one exists
export let PASTE_ID;
async function loadPaste() {
    if (location.pathname !== "/") {
        // Define the paste ID and language
        const split = location.pathname.replace("/", "").split(".");
        const pasteID = split[0];
        const language = split[1];
    
        // Retrieve the paste from the API and redirect the user to the main page if it could not be found
        const response = await api.getPaste(pasteID);
        if (!response.ok) {
            location.replace(location.protocol + "//" + location.host);
            return;
        }
        const data = await response.json();
    
        // Adjust the button states
        document.getElementById("btn_save").setAttribute("disabled", true);
        document.getElementById("btn_delete").removeAttribute("disabled");
        document.getElementById("btn_copy").removeAttribute("disabled");
    
        // Set the paste content to the DOM
        const code = document.getElementById("code");
        code.innerHTML = language
            ? hljs.highlight(language, data.content).value
            : hljs.highlightAuto(data.content).value;
        
        // Display the line numbers
        const lineNOs = document.getElementById("linenos");
        lineNOs.innerHTML = data.content.split(/\n/).map((_, index) => `<span>${index + 1}</span>`).join('');

        const sharedLine = parseInt(window.location.hash.toLowerCase().replace("#l", ""), 10);
        if (sharedLine) {
            lineNOs.innerHTML = data.content.split(/\n/).map((_, index) => {
                return index + 1 === sharedLine
                    ? `<span class="highlight">${index + 1}</span>`
                    : `<span>${index + 1}</span>`;
            }).join('');

            let html = code.innerHTML.split(/\n/);
            html[sharedLine-1] = `<span class="highlight">${html[sharedLine-1]}</span>`;
            code.innerHTML = html.join("\n");
        }

        // TODO: Update this shitty construct
        lineNOs.childNodes.forEach(node => {
            node.addEventListener("click", function(_) {
                const address = location.protocol + "//" + location.host + location.pathname + "#L" + node.innerText;
                location.replace(address);
                location.reload();
            });
            node.addEventListener("mouseover", function(_) {
                let html = code.innerHTML.split(/\n/);
                const index = parseInt(node.innerText, 10) - 1;
                html[index] = `<span class="highlight">${html[index]}</span>`;
                code.innerHTML = html.join("\n");
            });
            node.addEventListener("mouseout", function(_) {
                let html = code.innerHTML.split(/\n/);
                const index = parseInt(node.innerText, 10) - 1;
                html[index] = html[index].substring(24, html[index].length - 7);
                code.innerHTML = html.join("\n");
            });
        });
        
        // Set the PASTE_ID variable
        PASTE_ID = pasteID;
    } else {
        const input = document.getElementById("input");
        input.classList.remove("hidden");
        input.focus();
        window.addEventListener("keydown", function(event) {
            if (event.keyCode != 9) return;
            event.preventDefault();
            input.value += "    ";
        });
    }
}
spinner.surround(loadPaste);