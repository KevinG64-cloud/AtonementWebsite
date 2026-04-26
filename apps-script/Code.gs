function doGet() {
  const data = buildData();
  return ContentService.createTextOutput(JSON.stringify(data)).setMimeType(
    ContentService.MimeType.JSON,
  );
}

function doPost(e) {
  try {
    var body = parseJsonBody_(e);
    var action = String(body.action || "");

    if (!isAuthorized_(body, e)) {
      return json_({
        ok: false,
        message: "Unauthorized: invalid secret.",
      });
    }

    if (action === "updateSectionEntry") {
      return updateSectionEntry_(body.payload || {});
    }

    return json_({
      ok: false,
      message: "Unknown action: " + action,
    });
  } catch (err) {
    return json_({
      ok: false,
      message: "Server error: " + getErrorMessage_(err),
    });
  }
}

function buildData() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();

  const result = {
    meta: {
      welcome: { image: "", menuItems: [] },
      introduction: { image: "", title: "", text: "" }, // always stable shape
      appStory: [],
    },
    navigation: [],
    sections: [],
    resources: [],
    articles: [],
  };

  const sectionSheets = getSectionSheets_(ss);

  // ── META ─────────────────────────────────────
  buildWelcome(ss, result);
  buildHomeIntroduction(ss, result); // HOME ONLY
  buildAppStory(ss, result);

  // ── SECTIONS ─────────────────────────────────
  sectionSheets.forEach(({ name, type }) => {
    const section = buildSection(ss, name, type);
    if (section) {
      result.sections.push(section);
      result.navigation.push({
        id: section.id,
        title: section.title,
        type: "section",
      });
    }
  });

  // ── RESOURCES ────────────────────────────────
  const res = ss.getSheetByName("Resources");
  if (res) {
    const rows = res.getDataRange().getValues().slice(1);

    result.resources = rows
      .filter((row) => row.some((c) => c !== ""))
      .filter((row) => cleanCell(row[0]) !== "")
      .map((row) => ({
        type: cleanCell(row[0]),
        text: cleanCell(row[1]),
        author: cleanCell(row[2]),
        explanation: cleanCell(row[3]),
        link: cleanCell(row[4]),
      }));

    result.navigation.push({
      id: "resources",
      title: "Resources",
      type: "resources",
    });
  }

  // ── ARTICLES ────────────────────────────────
  const art = ss.getSheetByName("Articles");
  if (art) {
    const rows = art.getDataRange().getValues().slice(1);

    result.articles = rows
      .filter((row) => row.some((c) => c !== ""))
      .map((row) => ({
        title: cleanCell(row[0]),
        author: cleanCell(row[1]),
        article: cleanCell(row[2]),
      }));

    result.navigation.push({
      id: "articles",
      title: "Articles",
      type: "articles",
    });
  }

  // ── META NAV ITEMS ───────────────────────────
  result.navigation.push(
    { id: "home", title: "Home", type: "meta" },
    { id: "app_story", title: "This APPs Story", type: "meta" },
  );

  return result;
}

function getSectionSheets_(ss) {
  return ss
    .getSheets()
    .map((sheet) => ({
      name: sheet.getName(),
      values: sheet.getDataRange().getValues(),
    }))
    .filter(({ name, values }) => {
      if (isReservedSheetName_(name)) return false;
      if (!values || values.length === 0) return false;

      const headerInfo = resolveHeaderRow_(values);
      return hasSectionHeaders_(headerInfo.headers);
    })
    .map(({ name, values }) => {
      const headerInfo = resolveHeaderRow_(values);
      return {
        name,
        type: inferSectionType_(name, headerInfo.headers),
      };
    });
}

function isReservedSheetName_(name) {
  const n = normalizeKey_(name);
  return (
    n === normalizeKey_("welcome") ||
    n === normalizeKey_("home") ||
    n === normalizeKey_("introduction") ||
    n === normalizeKey_("this apps story") ||
    n === normalizeKey_("resources") ||
    n === normalizeKey_("articles")
  );
}

function resolveHeaderRow_(rows) {
  const maxScanRows = Math.min(rows.length, 5);

  for (let i = 0; i < maxScanRows; i++) {
    const headers = rows[i].map((h) => normalizeHeader(h));
    if (hasSectionHeaders_(headers)) {
      return { headerRowIndex: i, headers };
    }
  }

  return {
    headerRowIndex: 0,
    headers: rows[0] ? rows[0].map((h) => normalizeHeader(h)) : [],
  };
}

function hasSectionHeaders_(headers) {
  const hasTitle = ["title", "passage", "ntPassages", "topic"].some(
    (h) => headers.indexOf(h) !== -1,
  );
  const hasText = headers.indexOf("text") !== -1;
  const hasExplanation = headers.indexOf("explanation") !== -1;
  const hasLink = headers.indexOf("link") !== -1;

  return hasTitle && hasText && hasExplanation && hasLink;
}

function inferSectionType_(name, headers) {
  if (headers.indexOf("topic") !== -1) return "topic";
  if (
    headers.indexOf("passage") !== -1 ||
    headers.indexOf("ntPassages") !== -1
  ) {
    return "passage";
  }

  const normalizedName = normalizeKey_(name);
  return normalizedName.indexOf("topic") !== -1 ? "topic" : "passage";
}

function buildSection(ss, name, type) {
  const sheet = ss.getSheetByName(name);
  if (!sheet) return null;

  const rows = sheet.getDataRange().getValues();
  if (!rows.length) return null;

  const headerInfo = resolveHeaderRow_(rows);
  const headerRowIndex = headerInfo.headerRowIndex;
  const headers = headerInfo.headers;
  if (!hasSectionHeaders_(headers)) return null;

  const dataRows = rows.slice(headerRowIndex + 1);

  const entries = dataRows
    .filter((row) => row.some((c) => c !== ""))
    .map((row) => {
      const title = pickByAliases_(row, headers, [
        "passage",
        "ntPassages",
        "topic",
        "title",
      ]);
      const text = pickByAliases_(row, headers, ["text"]);
      const explanation = pickByAliases_(row, headers, ["explanation"]);
      const link = pickByAliases_(row, headers, ["link"]);

      return {
        title: cleanCell(title),
        text: cleanCell(text),
        explanation: cleanCell(explanation),
        link: cleanCell(link),
      };
    })
    .filter((e) => e.title !== "");

  return {
    id: slugify(name),
    title: name,
    type: type || inferSectionType_(name, headers),
    entries,
  };
}

function buildWelcome(ss, result) {
  const sheet = ss.getSheetByName("Welcome");
  if (!sheet) return;

  const rows = sheet.getDataRange().getValues().slice(1);

  result.meta.welcome.image = rows[0] ? cleanCell(rows[0][0]) : "";
  result.meta.welcome.menuItems = rows
    .map((row) => ({
      image: cleanCell(row[0]),
      menuItem: cleanCell(row[1]),
      text: cleanCell(row[2]),
    }))
    .filter((r) => r.menuItem !== "");
}

function buildHomeIntroduction(ss, result) {
  const sheet = ss.getSheetByName("Home") || ss.getSheetByName("Introduction");
  if (!sheet) return;

  const rows = sheet.getDataRange().getValues();
  if (!rows.length) return;

  const headers = rows[0].map((h) => normalizeHeader(h));
  const hasHeader =
    headers.indexOf("title") !== -1 ||
    headers.indexOf("text") !== -1 ||
    headers.indexOf("image") !== -1;

  const row = hasHeader ? rows[1] : rows[0];
  if (!row) return;

  if (hasHeader) {
    const idxImage = headers.indexOf("image");
    const idxTitle = headers.indexOf("title");
    const idxText = headers.indexOf("text");

    result.meta.introduction = {
      image: idxImage !== -1 ? cleanCell(row[idxImage]) : "",
      title: idxTitle !== -1 ? cleanCell(row[idxTitle]) : "",
      text: idxText !== -1 ? cleanCell(row[idxText]) : "",
    };
    return;
  }

  const a = cleanCell(row[0]);
  const b = cleanCell(row[1]);
  const c = cleanCell(row[2]);

  if (c !== "") {
    result.meta.introduction = { image: a, title: b, text: c };
  } else {
    result.meta.introduction = { image: "", title: a, text: b };
  }
}

function buildAppStory(ss, result) {
  const sheet = ss.getSheetByName("This APPs Story");
  if (!sheet) return;

  const rows = sheet.getDataRange().getValues().slice(1);

  result.meta.appStory = rows
    .filter((row) => row.some((c) => c !== ""))
    .map((row) => ({
      title: cleanCell(row[0]),
      text: cleanCell(row[1]),
    }));
}

function updateSectionEntry_(payload) {
  validateUpdatePayload_(payload);

  var lock = LockService.getScriptLock();
  lock.waitLock(30000);

  try {
    var ss = getSpreadsheet_();
    var sheet = resolveSectionSheet_(ss, String(payload.sectionId || ""));

    if (!sheet) {
      return json_({
        ok: false,
        message:
          'Could not find a sheet for sectionId "' + payload.sectionId + '".',
      });
    }

    var values = sheet.getDataRange().getValues();
    if (values.length < 2) {
      return json_({
        ok: false,
        message: 'Sheet "' + sheet.getName() + '" has no data rows.',
      });
    }

    var headers = values[0];
    var headerMap = buildHeaderMap_(headers);
    var fieldColumnMap = resolveFieldColumnMap_(headerMap, sheet.getName());

    var requiredFields = ["title", "text", "explanation", "link"];
    for (var i = 0; i < requiredFields.length; i++) {
      if (fieldColumnMap[requiredFields[i]] == null) {
        return json_({
          ok: false,
          message:
            'Missing required header for field "' +
            requiredFields[i] +
            '" in sheet "' +
            sheet.getName() +
            '". Available headers: ' +
            headers.join(", ") +
            ".",
        });
      }
    }

    var targetRow = findTargetRow_(values, headerMap, payload.entryIndex);
    if (targetRow === -1) {
      return json_({
        ok: false,
        message:
          'Entry not found in sheet "' +
          sheet.getName() +
          '" for entryIndex=' +
          payload.entryIndex +
          ".",
      });
    }

    setCellByField_(
      sheet,
      targetRow,
      fieldColumnMap,
      "title",
      String(payload.title),
    );
    setCellByField_(
      sheet,
      targetRow,
      fieldColumnMap,
      "text",
      String(payload.text),
    );
    setCellByField_(
      sheet,
      targetRow,
      fieldColumnMap,
      "explanation",
      String(payload.explanation),
    );
    setCellByField_(
      sheet,
      targetRow,
      fieldColumnMap,
      "link",
      String(payload.link || ""),
    );

    if (headerMap["updatedat"] != null) {
      sheet
        .getRange(targetRow, headerMap["updatedat"] + 1)
        .setValue(new Date());
    }

    return json_({
      ok: true,
      message:
        'Updated "' + sheet.getName() + '" entry #' + payload.entryIndex + ".",
      sectionId: String(payload.sectionId || ""),
      sheetName: sheet.getName(),
      entryIndex: Number(payload.entryIndex),
    });
  } finally {
    lock.releaseLock();
  }
}

function resolveSectionSheet_(ss, sectionId) {
  var map = getSectionTabMap_();
  var normalizedSectionId = normalizeKey_(sectionId);

  if (map[sectionId]) {
    var mapped = ss.getSheetByName(map[sectionId]);
    if (mapped) return mapped;
  }

  if (map[normalizedSectionId]) {
    var mappedNormalized = ss.getSheetByName(map[normalizedSectionId]);
    if (mappedNormalized) return mappedNormalized;
  }

  var sheets = ss.getSheets();
  for (var i = 0; i < sheets.length; i++) {
    var sheet = sheets[i];
    var sheetName = sheet.getName();
    if (isMetaSheetName_(sheetName)) continue;

    if (normalizeKey_(sheetName) === normalizedSectionId) {
      return sheet;
    }
  }

  return null;
}

function findTargetRow_(values, headerMap, entryIndex) {
  var entryIndexCol = headerMap["entryindex"];
  var wantedIndex = Number(entryIndex);

  for (var r = 1; r < values.length; r++) {
    if (entryIndexCol != null) {
      var currentIndex = Number(values[r][entryIndexCol]);
      if (currentIndex === wantedIndex) {
        return r + 1;
      }
    } else {
      if (r - 1 === wantedIndex) {
        return r + 1;
      }
    }
  }

  return -1;
}

function resolveFieldColumnMap_(headerMap, sheetName) {
  var normalizedSheet = normalizeKey_(sheetName);

  var titleAliases = ["title", "passage", "topic", "nt passages"];
  if (normalizedSheet.indexOf("topic") !== -1) {
    titleAliases = ["topic", "title", "passage"];
  }

  var aliases = {
    title: titleAliases,
    text: ["text"],
    explanation: ["explanation", "notes", "commentary", "description"],
    link: ["link", "url", "referenceurl", "sourceurl"],
  };

  var resolved = {};
  var fields = Object.keys(aliases);

  for (var i = 0; i < fields.length; i++) {
    var field = fields[i];
    var candidates = aliases[field];
    var col = null;

    for (var j = 0; j < candidates.length; j++) {
      var key = normalizeKey_(candidates[j]);
      if (headerMap[key] != null) {
        col = headerMap[key];
        break;
      }
    }

    resolved[field] = col;
  }

  return resolved;
}

function validateUpdatePayload_(payload) {
  if (typeof payload !== "object" || payload === null) {
    throw new Error("Invalid payload.");
  }

  if (!String(payload.sectionId || "").trim()) {
    throw new Error("payload.sectionId is required.");
  }

  if (!isFiniteNumber_(payload.entryIndex) || Number(payload.entryIndex) < 0) {
    throw new Error("payload.entryIndex must be a non-negative number.");
  }

  if (!String(payload.title || "").trim()) {
    throw new Error("payload.title is required.");
  }

  if (!String(payload.text || "").trim()) {
    throw new Error("payload.text is required.");
  }

  var link = String(payload.link || "").trim();
  if (link && !/^https?:\/\/\S+$/i.test(link)) {
    throw new Error("payload.link must be empty or a valid http(s) URL.");
  }
}

function isAuthorized_(body, e) {
  var expected = getScriptProperty_("APPS_SCRIPT_SECRET");
  var provided = String(
    (body && body.secret) || getHeaderValue_(e, "X-Apps-Script-Secret") || "",
  );
  return provided && provided === expected;
}

function getHeaderValue_(e, headerName) {
  if (!e || !e.parameter) return "";
  return String(e.parameter[headerName] || "");
}

function parseJsonBody_(e) {
  if (!e || !e.postData || !e.postData.contents) {
    throw new Error("Missing POST body.");
  }

  try {
    return JSON.parse(e.postData.contents);
  } catch (err) {
    throw new Error("Invalid JSON body.");
  }
}

function getSpreadsheet_() {
  var spreadsheetId =
    PropertiesService.getScriptProperties().getProperty("SPREADSHEET_ID");
  return spreadsheetId
    ? SpreadsheetApp.openById(spreadsheetId)
    : SpreadsheetApp.getActiveSpreadsheet();
}

function getSectionTabMap_() {
  var raw = PropertiesService.getScriptProperties().getProperty(
    "SECTION_TAB_MAP_JSON",
  );
  if (!raw) return {};

  try {
    var parsed = JSON.parse(raw);
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch (err) {
    return {};
  }
}

function isMetaSheetName_(name) {
  return isReservedSheetName_(name);
}

function buildHeaderMap_(headers) {
  var map = {};
  for (var i = 0; i < headers.length; i++) {
    var key = normalizeKey_(headers[i]);
    if (key) map[key] = i;
  }
  return map;
}

function setCellByField_(sheet, rowNumber, fieldColumnMap, fieldName, value) {
  var idx = fieldColumnMap[fieldName];
  if (idx == null) return;
  sheet.getRange(rowNumber, idx + 1).setValue(value);
}

function normalizeHeader(header) {
  if (!header) return "";
  return String(header)
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9 ]/g, "")
    .replace(/\s+(.)/g, function (_, c) {
      return c.toUpperCase();
    });
}

function normalizeKey_(value) {
  return String(value || "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "");
}

function pickByAliases_(row, headers, aliases) {
  for (var i = 0; i < aliases.length; i++) {
    var idx = headers.indexOf(aliases[i]);
    if (idx !== -1) return row[idx];
  }
  return "";
}

function isFiniteNumber_(value) {
  var n = Number(value);
  return !isNaN(n) && isFinite(n);
}

function getScriptProperty_(key) {
  var value = PropertiesService.getScriptProperties().getProperty(key);
  if (!value) {
    throw new Error("Missing Script Property: " + key);
  }
  return value;
}

function cleanCell(value) {
  if (value === null || value === undefined) return "";
  if (typeof value === "string") return value.trim();
  return value;
}

function slugify(name) {
  return String(name || "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "_")
    .replace(/[^a-z0-9_]/g, "");
}

function getErrorMessage_(err) {
  return err && err.message ? err.message : String(err);
}

function json_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(
    ContentService.MimeType.JSON,
  );
}
