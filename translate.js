/**
 * Creates a menu entry in the Google Docs UI when the document is opened.
 * This method is only used by the regular add-on, and is never called by
 * the mobile add-on version.
 *
 * @param {object} e The event parameter for a simple onOpen trigger. To
 *     determine which authorization mode (ScriptApp.AuthMode) the trigger is
 *     running in, inspect e.authMode.
 */
function onOpen(e) {
  DocumentApp.getUi().createAddonMenu()
    .addItem('Start', 'showSidebar')
    .addToUi();
}

/**
 * Runs when the add-on is installed.
 * This method is only used by the regular add-on, and is never called by
 * the mobile add-on version.
 *
 * @param {object} e The event parameter for a simple onInstall trigger. To
 *     determine which authorization mode (ScriptApp.AuthMode) the trigger is
 *     running in, inspect e.authMode. (In practice, onInstall triggers always
 *     run in AuthMode.FULL, but onOpen triggers may be AuthMode.LIMITED or
 *     AuthMode.NONE.)
 */
function onInstall(e) {
  onOpen(e);
}

/**
 * Opens a sidebar in the document containing the add-on's user interface.
 * This method is only used by the regular add-on, and is never called by
 * the mobile add-on version.
 */
function showSidebar() {
  const ui = HtmlService.createHtmlOutputFromFile('sidebar')
      .setTitle('Document Clone');
  DocumentApp.getUi().showSidebar(ui);
}

/**
 * Gets the stored user preferences for the origin and destination languages,
 * if they exist.
 * This method is only used by the regular add-on, and is never called by
 * the mobile add-on version.
 *
 * @return {Object} The user's origin and destination language preferences, if
 *     they exist.
 */
function getUserClones() {
  const userProperties = PropertiesService.getUserProperties();
  // userProperties.deleteAllProperties();
  const allUserClones = Object.values(userProperties.getProperties()).map((rawItem) => {
    const item = JSON.parse(rawItem);
    const masterDoc = DocumentApp.openById(item.master);
    const slaveDoc = DocumentApp.openById(item.slave);
    const masterDocName = masterDoc.getName();
    const masterDocUrl = masterDoc.getUrl();
    const slaveDocName = slaveDoc.getName();
    const slaveDocUrl = slaveDoc.getUrl();

    masterDoc.saveAndClose();
    slaveDoc.saveAndClose();

    return {
      id: item.id,
      master: {
        id: item.master,
        name: masterDocName,
        url: masterDocUrl,
      },
      slave: {
        id: item.slave,
        name: slaveDocName,
        url: slaveDocUrl,
      },
    }
  });
  console.log(allUserClones);

  const docId = DocumentApp.getActiveDocument().getId();
  const docAncestors = allUserClones.filter((item) => item.slave.id === docId).map((item) => item.master);
  const docDescendants = allUserClones.filter((item) => item.master.id === docId).map((item) => item.slave);

  console.log({ ancestors: docAncestors, descendant: docDescendants });

  return { ancestors: docAncestors, descendant: docDescendants };
}

function createClone(docId) {
  const userProperties = PropertiesService.getUserProperties();

  const keys = userProperties.getKeys();
  const keyNum = Number(keys[keys.length - 1]);
  const prevKey = Number.isNaN(keyNum) ? -1 : keyNum;
  const nextKey = (prevKey + 1).toString();

  const masterDoc = DocumentApp.getActiveDocument();
  const masterDocId = masterDoc.getId();

  const slaveDocName = masterDoc.getName() + ' - Clone';
  const slaveDocId = docId || DocumentApp.create(slaveDocName).getId();

  const clone = { id: nextKey, master: masterDocId, slave: slaveDocId }
  userProperties.setProperty(nextKey, JSON.stringify(clone));
  return clone;
}

/**
 * Replaces the text of the current selection with the provided text, or
 * inserts text at the current cursor location. (There will always be either
 * a selection or a cursor.) If multiple elements are selected, only inserts the
 * translated text in the first element that can contain text and removes the
 * other elements.
 *
 * @param {string} newText The text with which to replace the current selection.
 */
function syncWithClone(docId) {
  const masterDoc = DocumentApp.getActiveDocument();
  const slaveDoc = DocumentApp.openById(docId);
  const masterDocBody = masterDoc.getBody();
  const slaveDocBody = slaveDoc.getBody();

  slaveDocBody.clear();

  for (let i = 0; i < masterDocBody.getNumChildren(); i++) {
    const item = masterDocBody.getChild(i);
    console.log(item.getType().toString());
    recursivelyCopyMasterBodyContentToSlave(item, slaveDocBody);
  }

  slaveDoc.saveAndClose();
}

let NUMBER_OF_RUNS = 0;

function recursivelyCopyMasterBodyContentToSlave(masterDocChild, slaveDocBody) {
  NUMBER_OF_RUNS++;
  // console.log('child', masterDocChild.getType().toString(), NUMBER_OF_RUNS);
  const masterDocChildElementType = masterDocChild.getType();

  // Copy the current element to the destination document
  const masterDocChildCopy = masterDocChild.copy();
  
  let slaveElement;
  let hasChildren = false;

  if (masterDocChildElementType == DocumentApp.ElementType.BODY_SECTION) {
    // Can't copy this element type
  } else if (masterDocChildElementType == DocumentApp.ElementType.DATE) {
    // Can't copy this element type
  } else if (masterDocChildElementType == DocumentApp.ElementType.EQUATION) {
    // Has Children
    // Can't copy this element type
  } else if (masterDocChildElementType == DocumentApp.ElementType.EQUATION_FUNCTION) {
    // Has Children
    // Can't copy this element type
  } else if (masterDocChildElementType == DocumentApp.ElementType.EQUATION_FUNCTION_ARGUMENT_SEPARATOR) {
    // Can't copy this element type
  } else if (masterDocChildElementType == DocumentApp.ElementType.EQUATION_SYMBOL) {
    // Can't copy this element type
  } else if (masterDocChildElementType == DocumentApp.ElementType.FOOTER_SECTION) {
    // Has Children
    // Can't copy this element type
  } else if (masterDocChildElementType == DocumentApp.ElementType.FOOTNOTE) {
    // Can't copy this element type
  } else if (masterDocChildElementType == DocumentApp.ElementType.FOOTNOTE_SECTION) {
    // Has Children
    // Can't copy this element type
  } else if (masterDocChildElementType == DocumentApp.ElementType.HEADER_SECTION) {
    // Has Children
    // Can't copy this element type
  } else if (masterDocChildElementType == DocumentApp.ElementType.HORIZONTAL_RULE) {
    slaveElement = slaveDocBody.appendHorizontalRule(masterDocChildCopy.asHorizontalRule());
  } else if (masterDocChildElementType == DocumentApp.ElementType.INLINE_DRAWING) {
    // Can't copy this element type
  } else if (masterDocChildElementType == DocumentApp.ElementType.INLINE_IMAGE) {
    slaveElement = slaveDocBody.appendImage(masterDocChildCopy.asInlineImage());
  } else if (masterDocChildElementType == DocumentApp.ElementType.LIST_ITEM) {
    // Has Children
    hasChildren = true
    slaveElement = slaveDocBody.appendListItem(masterDocChildCopy.asListItem());
  } else if (masterDocChildElementType == DocumentApp.ElementType.PAGE_BREAK) {
    slaveElement = slaveDocBody.appendPageBreak(masterDocChildCopy.asPageBreak());
  } else if (masterDocChildElementType == DocumentApp.ElementType.PARAGRAPH) {
    // Has Children
    hasChildren = true
    slaveElement = slaveDocBody.appendParagraph(masterDocChildCopy.asParagraph());
  } else if (masterDocChildElementType == DocumentApp.ElementType.PERSON) {
    // Can't copy this element type
  } else if (masterDocChildElementType == DocumentApp.ElementType.RICH_LINK) {
    // Can't copy this element type
  } else if (masterDocChildElementType == DocumentApp.ElementType.TABLE) {
    // Has Children
    hasChildren = true
    slaveElement = slaveDocBody.appendTable(masterDocChildCopy.asTable());
  } else if (masterDocChildElementType == DocumentApp.ElementType.TABLE_CELL) {
    // Has Children
    hasChildren = true
    // Revisit this
    // slaveElement = slaveDocBody.appendText(masterDocChildCopy.asText());
  } else if (masterDocChildElementType == DocumentApp.ElementType.TABLE_OF_CONTENTS) {
    // Has Children
    // Can't copy this element type
  } else if (masterDocChildElementType == DocumentApp.ElementType.TABLE_ROW) {
    // Has Children
    hasChildren = true
    slaveElement = slaveDocBody.appendTableRow(masterDocChildCopy.asTableRow());
  } else if (masterDocChildElementType == DocumentApp.ElementType.TEXT) {
    slaveElement = slaveDocBody.appendText(masterDocChildCopy.asText());
  }

  // If the current element has children, recursively copy them
  if (hasChildren && slaveElement) {
    for (var i = 0; i < masterDocChild.getNumChildren(); i++) {
      const item = masterDocChild.getChild(i);
      recursivelyCopyMasterBodyContentToSlave(item, slaveElement);
    }
  }
}





























