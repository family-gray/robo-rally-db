// client-side js
// run by the browser each time your view template referencing it is loaded

const actions = [];

// define variables that reference elements on our page
const actionsList = document.getElementById("actions");
const clearButton = document.querySelector("#clear-actions");
const reloadButton = document.querySelector("#reload-actions");

function fillActions() {
  // request the actions from our app's sqlite database
  fetch("/getActions", {})
    .then(res => res.json())
    .then(response => {
      response.forEach(row => {
        appendNewAction("[" + row.id + "] " +row.cardText + ": " + row.priority + " (" + row.action + " " + row.unit + ")");
      });
    });
}

fillActions();
let selected = null;

function dragOver(e) {
  if (isBefore(selected, e.target)) {
    e.target.parentNode.insertBefore(selected, e.target);
  } else {
    e.target.parentNode.insertBefore(selected, e.target.nextSibling);
  }
}

function dragEnd() {
  console.log("dragEnd");
  selected = null;
}

function dragStart(e) {
  e.dataTransfer.effectAllowed = "move";
  e.dataTransfer.setData("text/plain", null);
  selected = e.target;
}

function isBefore(el1, el2) {
  let cur;
  if (el2.parentNode === el1.parentNode) {
    for (cur = el1.previousSibling; cur; cur = cur.previousSibling) {
      if (cur === el2) return true;
    }
  }
  return false;
}

// a helper function that creates a list item for a given action
const appendNewAction = action => {
  const newListItem = document.createElement("li");
  newListItem.innerText = action;
  actionsList.appendChild(newListItem);

  let draggable = document.createAttribute("draggable");
  draggable.value = "true";
  newListItem.setAttributeNode(draggable);

  let dragend = document.createAttribute("ondragend");
  dragend.value = "dragEnd()";
  newListItem.setAttributeNode(dragend);

  let dragover = document.createAttribute("ondragover");
  dragover.value = "dragOver(event)";
  newListItem.setAttributeNode(dragover);

  let dragstart = document.createAttribute("ondragstart");
  dragstart.value = "dragStart(event)";
  newListItem.setAttributeNode(dragstart);
};


/*
clearButton.addEventListener("click", event => {
  fetch("/clearActions", {})
    .then(res => res.json())
    .then(response => {
      console.log("cleared actions");
    });
  actionsList.innerHTML = "";
});

reloadButton.addEventListener("click", async event => {
  await fetch("/loadDefaultActions", {})
    .then(res => res.json())
    .then(response => {
      console.log("reloaded actions");
    });
  fillActions();
});

*/