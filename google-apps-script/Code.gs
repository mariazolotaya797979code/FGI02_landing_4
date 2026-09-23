/**
 * Приём заявок с лендинга в Google Таблицу.
 *
 * Разверните скрипт, войдя в Google как maria.zolotaya79@gmail.com —
 * таблица создастся в этом аккаунте.
 *
 * 1. Откройте https://script.google.com под этим аккаунтом.
 * 2. Новый проект → вставьте этот файл → сохраните.
 * 3. Выберите функцию setup и нажмите «Выполнить». Разрешите доступ.
 * 4. В журнале выполнения (Вид → Журналы) скопируйте ссылку на таблицу.
 * 5. Развернуть → Новое развёртывание → тип «Веб-приложение»:
 *    - Выполнять от имени: меня
 *    - У кого есть доступ: все
 * 6. Скопируйте URL веб-приложения в js/config.js → googleScriptUrl.
 * 7. При каждом изменении кода создавайте новое развёртывание.
 */

var SHEET_NAME = "Заявки";

function setup() {
  var ss = SpreadsheetApp.create("Заявки — психолог Анна Соколова");
  ss.setSpreadsheetTimeZone("Europe/Moscow");
  var sheet = ss.getActiveSheet();
  sheet.setName(SHEET_NAME);
  sheet.appendRow(["Дата", "Имя", "Телефон", "Email", "Услуга", "Комментарий", "Страница"]);
  sheet.getRange(1, 1, 1, 7).setFontWeight("bold").setBackground("#2C6379").setFontColor("#FFFFFF");
  sheet.setFrozenRows(1);
  sheet.setColumnWidth(1, 170);
  sheet.setColumnWidth(6, 280);
  PropertiesService.getScriptProperties().setProperty("SPREADSHEET_ID", ss.getId());
  Logger.log("Таблица: " + ss.getUrl());
  Logger.log("Дальше разверните веб-приложение и вставьте его URL в js/config.js");
}

function getSheet_() {
  var id = PropertiesService.getScriptProperties().getProperty("SPREADSHEET_ID");
  if (!id) {
    throw new Error("Сначала один раз запустите функцию setup.");
  }
  var ss = SpreadsheetApp.openById(id);
  var sheet = ss.getSheetByName(SHEET_NAME);
  if (!sheet) {
    throw new Error("На листе нет вкладки «" + SHEET_NAME + "».");
  }
  return sheet;
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
  try {
    var data = readPayload_(e);
    var sheet = getSheet_();
    sheet.appendRow([
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
  } catch (err) {
    return ContentService
      .createTextOutput(JSON.stringify({ ok: false, error: String(err) }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

function doGet() {
  return ContentService
    .createTextOutput(JSON.stringify({ ok: true, service: "psychologist-leads" }))
    .setMimeType(ContentService.MimeType.JSON);
}
