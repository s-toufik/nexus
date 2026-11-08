var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);
var __async = (__this, __arguments, generator) => {
  return new Promise((resolve, reject) => {
    var fulfilled = (value) => {
      try {
        step(generator.next(value));
      } catch (e) {
        reject(e);
      }
    };
    var rejected = (value) => {
      try {
        step(generator.throw(value));
      } catch (e) {
        reject(e);
      }
    };
    var step = (x) => x.done ? resolve(x.value) : Promise.resolve(x.value).then(fulfilled, rejected);
    step((generator = generator.apply(__this, __arguments)).next());
  });
};

// src/main.ts
var main_exports = {};
__export(main_exports, {
  ZoteroItem: () => ZoteroItem,
  default: () => main_default
});
module.exports = __toCommonJS(main_exports);

// src/ZoteroBridge.ts
var import_obsidian5 = require("obsidian");

// node_modules/@vanakat/plugin-api/index.js
var import_obsidian = require("obsidian");
function registerAPI(name, api, plugin) {
  window["PluginApi"] = window["PluginApi"] || {};
  window["PluginApi"][name] = api;
  plugin.register(() => {
    delete window["PluginApi"][name];
  });
}

// src/ZoteroBridgeSettings.ts
var DEFAULT_SETTINGS = {
  connectionType: 2 /* LocalAPIV3 */,
  userOrGroup: "users/0",
  host: "localhost",
  port: "23119"
};

// src/ZoteroAdapter.ts
var import_obsidian2 = require("obsidian");
var http = __toESM(require("http"));

// src/ZoteroItem.ts
var ZoteroItem = class {
  constructor(raw) {
    this.raw = raw;
  }
  getKey() {
    return this.raw.data.key;
  }
  /**
   * Library path for zotero:// URIs: `groups/<id>` for group library items,
   * `library` (the personal library) otherwise. ZotServer responses carry no
   * library information, so they fall back to the personal library.
   */
  getLibraryUri() {
    const library = this.raw.library;
    if (library && library.type === "group" && library.id != null) {
      return `groups/${library.id}`;
    }
    return "library";
  }
  getTitle() {
    return this.raw.data.title || this.raw.data.shortTitle || "[No Title]";
  }
  getShortTitle() {
    return this.raw.data.shortTitle;
  }
  getCreatorSummary() {
    if (this.raw.hasOwnProperty("meta") && this.raw.meta.hasOwnProperty("creatorSummary")) {
      const summary = this.raw.meta.creatorSummary;
      if (summary !== void 0 && summary !== null) {
        return summary;
      }
    }
    return this.getAuthor() ? this.getAuthor().fullName : "";
  }
  getAuthors() {
    return this.getCreators().filter((creator) => creator.creatorType === "author").map(this.normalizeName);
  }
  getAuthor() {
    return this.getAuthors()[0];
  }
  getCreators() {
    return this.raw.data.creators || [];
  }
  getDate() {
    const noDate = { year: null, month: null, day: null };
    if (this.raw.hasOwnProperty("meta") && this.raw.meta.hasOwnProperty("parsedDate")) {
      const parsedFromMeta = this.formatDate(this.raw.meta.parsedDate, noDate);
      if (parsedFromMeta.year !== null) {
        return parsedFromMeta;
      }
    }
    if (this.raw.data.date) {
      return this.formatDate(this.raw.data.date, noDate);
    }
    return noDate;
  }
  normalizeName(creator) {
    const names = {
      firstName: creator.firstName,
      lastName: creator.lastName,
      fullName: ""
    };
    if (creator.hasOwnProperty("name")) {
      const trimmedName = creator.name.trim();
      const delimiter = trimmedName.lastIndexOf(" ");
      if (delimiter === -1) {
        names.firstName = "";
        names.lastName = trimmedName;
      } else {
        names.firstName = trimmedName.substring(0, delimiter).trim();
        names.lastName = trimmedName.substring(delimiter + 1).trim();
      }
      names.fullName = trimmedName;
    } else {
      const parts = [names.firstName, names.lastName].filter((part) => part);
      names.fullName = parts.join(" ");
    }
    return names;
  }
  formatDate(date, noDate) {
    if (date === null || date === void 0) {
      return noDate;
    }
    const dateObject = new Date(date);
    if (isNaN(dateObject.getTime())) {
      return noDate;
    }
    return {
      year: dateObject.getUTCFullYear(),
      month: dateObject.getUTCMonth() + 1,
      day: dateObject.getUTCDate()
    };
  }
  getValues() {
    return {
      key: this.getKey(),
      libraryUri: this.getLibraryUri(),
      title: this.getTitle(),
      shortTitle: this.getShortTitle(),
      date: this.getDate(),
      authors: this.getAuthors(),
      firstAuthor: this.getAuthor(),
      creatorSummary: this.getCreatorSummary()
    };
  }
};

// src/ZoteroAdapter.ts
var SEARCH_RESULTS_LIMIT = 50;
function localApiRequest(url) {
  return new Promise((resolve, reject) => {
    const req = http.get(url, {
      headers: {
        "Accept": "application/json",
        "User-Agent": "ZoteroBridge",
        "Zotero-Allowed-Request": "true"
      }
    }, (response) => {
      let body = "";
      response.setEncoding("utf8");
      response.on("data", (chunk) => body += chunk);
      response.on("end", () => {
        if (!response.statusCode || response.statusCode < 200 || response.statusCode >= 300) {
          reject(new Error(`Zotero Local API returned HTTP ${response.statusCode}: ${body}`));
          return;
        }
        resolve(body);
      });
    });
    req.on("error", reject);
    req.setTimeout(5e3, () => {
      req.destroy(new Error("Zotero Local API request timed out"));
    });
  });
}
function localApiRequestWithFallback(url) {
  return (0, import_obsidian2.request)({
    url,
    method: "get",
    contentType: "application/json",
    headers: { "Zotero-Allowed-Request": "true" }
  }).catch(() => localApiRequest(url));
}
var LocalAPIV3Adapter = class {
  constructor(settings) {
    this.settings = settings;
  }
  get baseUrl() {
    return `http://${this.settings.host}:${this.settings.port}/api/${this.settings.userOrGroup}`;
  }
  search(query) {
    return this.items({
      itemType: "-attachment",
      q: query,
      limit: SEARCH_RESULTS_LIMIT.toString()
    });
  }
  groups() {
    return localApiRequestWithFallback(`http://${this.settings.host}:${this.settings.port}/api/users/0/groups`).then(JSON.parse).then((groups) => groups.map((group) => group.data));
  }
  items(parameters) {
    return localApiRequestWithFallback(`${this.baseUrl}/items?` + new URLSearchParams(parameters).toString()).then(JSON.parse).then((items) => items.filter((item) => !["attachment", "note"].includes(item.data.itemType)).map((item) => new ZoteroItem(item))).catch(() => {
      new import_obsidian2.Notice(`Couldn't connect to Zotero, please check the app is open and Zotero Local API is enabled`);
      return [];
    });
  }
};
var ZotServerAdapter = class {
  constructor(settings) {
    this.settings = settings;
  }
  get baseUrl() {
    return `http://${this.settings.host}:${this.settings.port}/zotserver`;
  }
  search(query) {
    return this.items({
      q: query
    });
  }
  items(parameters) {
    return (0, import_obsidian2.request)({
      url: `${this.baseUrl}/search`,
      method: "post",
      contentType: "application/json",
      body: JSON.stringify([{
        condition: "quicksearch-titleCreatorYear",
        value: parameters.q
      }])
    }).then(JSON.parse).then((items) => items.filter((item) => !["attachment", "note"].includes(item.itemType)).slice(0, SEARCH_RESULTS_LIMIT).map((item) => new ZoteroItem({ data: item }))).catch(() => {
      new import_obsidian2.Notice(`Couldn't connect to Zotero, please check the app is open and ZotServer is installed`);
      return [];
    });
  }
};
var ZoteroAdapters = {
  [1 /* ZotServer */]: ZotServerAdapter,
  [2 /* LocalAPIV3 */]: LocalAPIV3Adapter
};

// src/ZoteroSuggestModal.ts
var import_obsidian3 = require("obsidian");
var ZoteroSuggestModal = class extends import_obsidian3.SuggestModal {
  constructor(app, adapter, onSelect) {
    super(app);
    this.adapter = adapter;
    this.onSelect = onSelect;
  }
  getSuggestions(query) {
    return this.adapter.search(query);
  }
  renderSuggestion(item, el) {
    const creator = item.getCreatorSummary();
    el.createEl("div", { text: item.getTitle() });
    if (creator) {
      el.createEl("small", { text: `${creator} ` });
    }
    const year = item.getDate().year;
    if (year) {
      el.createEl("small", { text: `(${year}) ` });
    }
    el.createEl("small", { text: `[${item.getKey()}]`, cls: "zotero-bridge__text-secondary" });
  }
  onChooseSuggestion(item) {
    this.onSelect(item);
  }
};
function promisedZoteroSuggestModal(...args) {
  return new Promise((resolve, reject) => {
    try {
      new ZoteroSuggestModal(...args, (item) => resolve(item)).open();
    } catch (e) {
      reject(e);
    }
  });
}

// src/plugin-api/ZoteroBridgeApiV1.ts
var ZoteroBridgeApiV1 = class {
  constructor(plugin) {
    this.plugin = plugin;
  }
  search() {
    return promisedZoteroSuggestModal(this.plugin.app, this.plugin.zoteroAdapter);
  }
};

// src/ZoteroBridgeApi.ts
var ZoteroBridgeApi = class {
  constructor(plugin) {
    this.plugin = plugin;
  }
  v1() {
    return new ZoteroBridgeApiV1(this.plugin);
  }
};

// src/ZoteroBridgeSettingTab.ts
var import_obsidian4 = require("obsidian");
var ZoteroBridgeSettingTab = class extends import_obsidian4.PluginSettingTab {
  constructor(app, plugin) {
    super(app, plugin);
    this.plugin = plugin;
  }
  display() {
    this.containerEl.empty();
    new import_obsidian4.Setting(this.containerEl).setName("Connection type").setDesc("Note that you either need to install ZotServer plugin in Zotero 6 or enable Local API support in Zotero 7 advanced settings.").addDropdown((dropdown) => {
      dropdown.addOption(1 /* ZotServer */.toString(), "Zotero 6 ZotServer Plugin").addOption(2 /* LocalAPIV3 */.toString(), "Zotero 7 Local API (v3)").setValue(this.plugin.settings.connectionType.toString()).onChange((value) => __async(this, null, function* () {
        yield this.plugin.saveSettings({
          connectionType: +value
        });
      }));
    });
    new import_obsidian4.Setting(this.containerEl).setName("User or group").setDesc("This parameter only works with Zotero 7 connection type.").addDropdown((dropdown) => __async(this, null, function* () {
      const adapter = new LocalAPIV3Adapter(this.plugin.settings);
      const groups = yield adapter.groups();
      dropdown.addOption(`users/0`, "My Library");
      groups.forEach((group) => {
        dropdown.addOption(`groups/${group.id}`, group.name);
      });
      dropdown.setValue(this.plugin.settings.userOrGroup).onChange((value) => __async(this, null, function* () {
        yield this.plugin.saveSettings({
          userOrGroup: value
        });
      }));
    }));
    new import_obsidian4.Setting(this.containerEl).setName("Zotero server port").setDesc(`Don't change unless you really know what you are doing`).addText((txt) => {
      txt.setValue(this.plugin.settings.port.toString()).onChange((value) => __async(this, null, function* () {
        yield this.plugin.saveSettings({
          port: value
        });
      }));
    });
  }
};

// src/ZoteroBridge.ts
var ZoteroBridge = class extends import_obsidian5.Plugin {
  onload() {
    return __async(this, null, function* () {
      this.settings = Object.assign({}, DEFAULT_SETTINGS, yield this.loadData());
      this.zoteroAdapter = new ZoteroAdapters[this.settings.connectionType](this.settings);
      this.addSettingTab(new ZoteroBridgeSettingTab(this.app, this));
      registerAPI("ZoteroBridge", new ZoteroBridgeApi(this), this);
    });
  }
  saveSettings(newSettings) {
    return __async(this, null, function* () {
      Object.assign(this.settings, newSettings);
      this.zoteroAdapter = new ZoteroAdapters[this.settings.connectionType](this.settings);
      yield this.saveData(this.settings);
    });
  }
};

// src/main.ts
var main_default = ZoteroBridge;

/* nosourcemap */