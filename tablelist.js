// 
// This code turns an HTML table into scrollable list with multiple columns
//

var selected = null;        // the currently selected row
var editRow = null;         // the row currently in edit mode
var initComplete = null;
var ignoreKeyEvent = false;
var el = document.getElementById("rowEntries");
var roweditevent = new Event('onroweditcomplete');

window.onload=function(){
    initTableJS();
    tableHighlightRow();
};

function initTableJS() {
    initComplete = true;

    // Look for input box and insert key handler
    var prevTxt = null;
    var txt = document.getElementsByName('filterTxt');
    if ( txt !== null ) {
        for (var i = 0; i < txt.length; i++) {
            txt[i].onkeyup=function(event) {
                var e = event || window.event;
                var curTxt = e.target.value;
                handleKeyPress(prevTxt,curTxt);
                prevTxt = curTxt;
                return true;
            };
        }
    }
}

//
// This function highlights a table row as the mouse hovers
// over it. It also adds code to mark a row as selected when 
// clicked on and toggle it when selected again
//
function tableHighlightRow() {
  // Make sure the table has been initiaized, where key-press handlers
  // are set for each row, to filter list content
  //
  if ( initComplete !== true ) {
      initTableJS();
  }

    if (document.getElementById && document.createTextNode) {
    var tables=document.getElementsByTagName('table');
    for ( var i=0; i<tables.length; i++ ) {
      if ( tables[i].className==='TableListJS' ) {
        var trs=tables[i].getElementsByTagName('tr');
        for ( var j=0; j<trs.length; j++) {
          if (trs[j].parentNode.nodeName==='TBODY') {
            trs[j].onmouseover=function(){
                // 'highlight' color is set in tablelist.css
                if ( this.className === '') {
                    this.className='highlight';
                }
                return false;
            };
            trs[j].onmouseout=function(){
                if ( this.className === 'highlight') {
                    this.className='';
                }
                return false;
            };
            trs[j].onmousedown=function(){
                toggleRowSelection(this);
            };
          }
        }
      }
    }
  }
}

function toggleRowSelection(row) {
    //
    // Toggle the selected state of this row
    // 

    // 'clicked' color is set in tablelist.css.
    if ( row.className !== 'clicked' ) {
        // Clear previous selection
        if ( selected !== null ) {
            selected.className='';
        }

        // Mark this row as selected
        row.className='clicked';
        selected = row;
        if ( el === null ) {
            el = document.getElementById("rowEntries");
        }
        el.value = row.rowIndex - 1;
    }
    else {
        row.className='';
        selected = null;
    }

    return true;
}

function selectRow(rowNum) {
    if ( rowNum !== undefined ) {
        // Get all the rows in the table and grab this row by given index
        //
        var tbl = document.getElementById('entries');
        var row = tbl.rows[rowNum];
        toggleRowSelection(row);
    }
}

//
// key presses are handled to use the text as a search within the
// table list
//
function handleKeyPress(oldVal, newVal) {
    var select = document.getElementById('entries');

    // If the number of characters in the text box is less than last time
    // it must be because the user pressed delete
    if ( oldVal !== null && (newVal.length < oldVal.length) ) {
        // Restore the lists original set of entries 
        // and start from the beginning
        for ( i = 1; i < select.rows.length; i++ ) {
            select.rows[i].style.display = '';
        }
    }

    // Break out all of the parts of the search text by splitting 
    // on white space
    var parts = newVal.split(' ');

    // Interate through each row and filter out the entries that 
    // don't contain the entered text
    for ( i = 1; i < select.rows.length; i++ ) {
        var entry = select.rows[i];
        if ( entry.style.display === 'none' ) {
            continue;
        }
        var rowMatch = true;

        // Compare each part of the entered text to each cell's text
        for ( p = 0; p < parts.length; p++ ) {
            // The row needs to contain all portions of the
            // search string *but* in any order
            var part = parts[p].toUpperCase();
            var partMatch = false;
            if ( part !== ' ' && part !== '' ) { // don't search on space or null
                // Iterate through each column (cell) per row 
                for ( c = 0; c < entry.cells.length; c++ ) {
                    var entryTxt = entry.cells[c].innerHTML;
                    if ( entryTxt.toUpperCase().lastIndexOf(part) >= 0 ) {
                        partMatch = true;
                        break;
                    }
                }

                if ( partMatch === false ) {
                    // Cycled through all cells and didn't find
                    // a match for this part, so this row needs
                    // to be deleted
                    rowMatch = false;
                    break;
                }
            }
        }

        if ( rowMatch === false ) {
            select.rows[i].style.display = 'none';
        }
    }
}

//addEvent(window, "load", function () {
//});

function addRow(colText) {
    var tableBody = document.getElementsByTagName("tbody").item(0);
    var tableHeader = document.getElementsByTagName('thead').item(0);
    var headerRow = tableHeader.childNodes[1];
    
    // Create a new row
    var tbl = document.getElementById('entries');
    var row = tbl.insertRow(tbl.rows.length);
    row.id = document.getElementById("entries").rows.length - 1;
        
    document.body.onkeydown = function(event) {
        // look for arrow keys to move selection
        return moveSelectedRow(event);
    };
    
    document.body.onkeyup = function(event) {
        // look for enter key to toggle row edit mode
        return handleToggleKey(event);
    };

    // Go through the array of column text fields and add them to the new row
    for ( c = 0; c < colText.length; c++ ) {
        textNode = document.createTextNode(colText[c]);
        
        // It's assumed a column header exists for each entry in the array
        cell = document.createElement("td");
        
        // Set the new cell width equal the matching header column width
        cell.width = headerRow.cells[c].width;

        cell.appendChild(textNode);
        row.appendChild(cell);
    }
    
    tableBody.appendChild(row);

    row.ondblclick = function() {
        return toggleRowEditMode(row);
    };

    // Clicking on another row when this row is in edit mode clears edit mode
    row.onclick = function() {
        clearRowEditMode(row);
    };
    
    tableHighlightRow();
}

function toggleRowEditMode(row) {
    // If the current row is in edit mode already, ignore this doubleclick
    if ( editRow !== null && editRow === row ) {
        return false;
    }

    // If a different row was in edit mode, switch it back now
    clearRowEditMode(row);

    // Save this row as the row currently being edited 
    editRow = row;

    // For each column in this row, replace the text with an input
    // box to allow the text to be edited
    for ( c = 0; c < row.childNodes.length; c++ ) {
        cell = row.childNodes[c];
        text = cell.innerText;

        // Create an input node, set its text to the cell's text,
        // set its width to the column width
        var input = document.createElement("input");
        input.setAttribute('type', 'text');
        input.setAttribute('style', 'width:100%');
        input.setAttribute('tabindex', ''+ (c+1) );
        input.setAttribute('id', 'cell'+c);
        input.setAttribute('value', text);
        input.onkeydown = function(event) {
            // Capture the Enter key and clear this row's edit mode
            // as though the user clicked somewhere else
            if ( event.code === 'Enter' && row === editRow) {
                clearRowEditMode(null);

                // The key event will be handled by the document also,
                // so flag it to be ignored 
                ignoreKeyEvent = true;
            }
        };

        // Replace the cell's text node with the input node
        if ( cell.childNodes.length > 0 ) {
            cell.removeChild(cell.childNodes[0]);
        }
        cell.appendChild(input);

        // Set the focus to the first column's input node
        if ( c === 0 ) {
            input.focus();
        }
    }
    
    return true;    
}

function moveSelectedRow(event) {
    // In order to move the selection, there needs to be a selected row
    if ( selected === null ) {
        return;
    }

    var rows = document.getElementById("entries").rows;
    var r = selected.id.valueOf();

    if ( event.code === 'ArrowDown' ) {
        // Make sure we're not at the bottom of the list
        if ( selected.id >= rows.length-1 ) {
            return;
        }

        r++;
    }
    else if ( event.code === 'ArrowUp' ) {
        // Make sure we're not at the top of the list
        if ( selected.id <= 1 ) {
            return;
        }

        r--;
    }
    else {
        return; // Not an arrow key
    }

    // Select the next or prev row, and make sure it's in view
    rowToSelect = rows[r];
    toggleRowSelection(rowToSelect);
    var tableBody = document.getElementsByTagName("tbody").item(0);
    var vis = isElementInViewport(tableBody, rowToSelect);
    if ( vis ) {
        // Eat the key by returning false, otherwise allow the 
        // key to scroll the list
        return false;
    }
}

function isElementInViewport(parent, elem) {
    var elemRect = el.getBoundingClientRect(),
        parentRect = parent.getBoundingClientRect();
    return (
        elemRect.top >= parentRect.top &&
        elemRect.left >= parentRect.left &&
        elemRect.bottom <= parentRect.bottom &&
        elemRect.right <= parentRect.right
    );
}

function handleToggleKey(event) {
    // Capture the Enter key 
    if ( event.code === 'Enter' ) {
        if ( ignoreKeyEvent === false ) {
            // If this row is in edit mode, clear it as though 
            // the user clicked somewhere else
            if ( selected !== null && selected !== editRow) {
               // set this row in edit mode
               selected.ondblclick();
               return true;
            }
        }
    }

    ignoreKeyEvent = false;
}

function clearRowEditMode(currentRow) {
    if ( editRow !== null && editRow !== currentRow ) {
        var fields = [];
        
        // Change the row cells' text to what's in the edit boxes
        //
        for ( c = 0; c < editRow.childNodes.length; c++ ) {
            cell = editRow.childNodes[c];
            text = cell.childNodes[0].value;
            fields.push(text);
            cell.innerHTML = text;
        }
        
        // Add the current row num to the fields
        //
        fields.push(editRow.id);
        
        // Send the "row edited" event
        //
        var tbl = document.getElementById('entries');
        var evt = new CustomEvent("onroweditcomplete", {
            detail: {
                data: fields
            }
        });
        tbl.dispatchEvent(evt);
        
        editRow = null;
    }
}

