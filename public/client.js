// client-side js
// run by the browser each time your view template referencing it is loaded


const actions = [];

// define variables that reference elements on our page
const actionsForm = document.forms[0];
const actionInput = actionsForm.elements["action"];
const priorityInput = actionsForm.elements["priority"];
const actionsList = document.getElementById("actions");
const clearButton = document.querySelector('#clear-actions');

// request the actions from our app's sqlite database
fetch("/getActions", {})
  .then(res => res.json())
  .then(response => {
    response.forEach(row => {
      appendNewAction(row.action + ": " + row.priority);
    });
  });

let selected = null

function dragOver(e) {
  if (isBefore(selected, e.target)) {
    e.target.parentNode.insertBefore(selected, e.target)
  } else {
    e.target.parentNode.insertBefore(selected, e.target.nextSibling)
  }
}

function dragEnd() {
  selected = null
}

function dragStart(e) {
  e.dataTransfer.effectAllowed = 'move'
  e.dataTransfer.setData('text/plain', null)
  selected = e.target
}

function isBefore(el1, el2) {
  let cur
  if (el2.parentNode === el1.parentNode) {
    for (cur = el1.previousSibling; cur; cur = cur.previousSibling) {
      if (cur === el2) return true
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

// listen for the form to be submitted and add a new action when it is
actionsForm.onsubmit = event => {
  // stop our form submission from refreshing the page
  event.preventDefault();

  const data = { action: actionInput.value, priority: priorityInput.value };

  fetch("/addAction", {
    method: "POST",
    body: JSON.stringify(data),
    headers: { "Content-Type": "application/json" }
  })
    .then(res => res.json())
    .then(response => {
      console.log(JSON.stringify(response));
    });
  // get action value and add it to the list
  actions.push(actionInput.value);
  appendNewAction(actionInput.value + ": " + priorityInput.value);

  // reset form
  actionInput.value = "";
  priorityInput.value = "";
  actionInput.focus();
};

clearButton.addEventListener('click', event => {
  fetch("/clearActions", {})
    .then(res => res.json())
    .then(response => {
      console.log("cleared actions");
    });
  actionsList.innerHTML = "";
});
