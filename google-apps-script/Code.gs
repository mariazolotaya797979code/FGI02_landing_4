var HEADERS = ["Дата", "Имя", "Телефон", "Email", "Услуга", "Комментарий", "Страница"];

function prepareSheet() {
  var sheet = getSheet_();
  if (sheet.getLastRow() === 0) {
    sheet.appendRow(HEADERS);
  }
  sheet.getRange(1, 1, 1, HEADERS.length)
    .setFontWeight("bold")
    .setBackground("#2C6379")
    .setFontColor("#FFFFFF");
  sheet.setFrozenRows(1);
  sheet.setColumnWidth(1, 170);
  sheet.setColumnWidth(6, 280);
  sheet.getParent().setSpreadsheetTimeZone("Europe/Moscow");
}

function getSheet_() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var named = ss.getSheetByName("Заявки");
  if (named) return named;
  return ss.getSheets()[0];
}

function readPayload_(e) {
  if (e && e.parameter && (e.parameter.name || e.parameter.phone || e.parameter.email)) {
    return e.parameter;
  }
  if (e && e.postData && e.postData.contents) {
    try {
      return JSON.parse(e.postData.contents);
    } catch (err) {
      return {};
    }
  }
  return {};
}

function doPost(e) {
  var data = readPayload_(e);
  getSheet_().appendRow([
    new Date(),
    String(data.name || "").slice(0, 120),
    String(data.phone || "").slice(0, 40),
    String(data.email || "").slice(0, 120),
    String(data.service || "").slice(0, 160),
    String(data.comment || "").slice(0, 2000),
    String(data.page || "").slice(0, 300)
  ]);
  return ContentService
    .createTextOutput(JSON.stringify({ ok: true }))
    .setMimeType(ContentService.MimeType.JSON);
}

function doGet() {
  return ContentService
    .createTextOutput("ok")
    .setMimeType(ContentService.MimeType.TEXT);
}
