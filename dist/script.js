// src/script.ts
import fs3 from "node:fs";

// node_modules/chalk/source/vendor/ansi-styles/index.js
var ANSI_BACKGROUND_OFFSET = 10;
var wrapAnsi16 = (offset = 0) => (code) => `\x1B[${code + offset}m`;
var wrapAnsi256 = (offset = 0) => (code) => `\x1B[${38 + offset};5;${code}m`;
var wrapAnsi16m = (offset = 0) => (red, green, blue) => `\x1B[${38 + offset};2;${red};${green};${blue}m`;
var styles = {
  modifier: {
    reset: [0, 0],
    bold: [1, 22],
    dim: [2, 22],
    italic: [3, 23],
    underline: [4, 24],
    overline: [53, 55],
    inverse: [7, 27],
    hidden: [8, 28],
    strikethrough: [9, 29]
  },
  color: {
    black: [30, 39],
    red: [31, 39],
    green: [32, 39],
    yellow: [33, 39],
    blue: [34, 39],
    magenta: [35, 39],
    cyan: [36, 39],
    white: [37, 39],
    blackBright: [90, 39],
    gray: [90, 39],
    grey: [90, 39],
    redBright: [91, 39],
    greenBright: [92, 39],
    yellowBright: [93, 39],
    blueBright: [94, 39],
    magentaBright: [95, 39],
    cyanBright: [96, 39],
    whiteBright: [97, 39]
  },
  bgColor: {
    bgBlack: [40, 49],
    bgRed: [41, 49],
    bgGreen: [42, 49],
    bgYellow: [43, 49],
    bgBlue: [44, 49],
    bgMagenta: [45, 49],
    bgCyan: [46, 49],
    bgWhite: [47, 49],
    bgBlackBright: [100, 49],
    bgGray: [100, 49],
    bgGrey: [100, 49],
    bgRedBright: [101, 49],
    bgGreenBright: [102, 49],
    bgYellowBright: [103, 49],
    bgBlueBright: [104, 49],
    bgMagentaBright: [105, 49],
    bgCyanBright: [106, 49],
    bgWhiteBright: [107, 49]
  }
};
var modifierNames = Object.keys(styles.modifier);
var foregroundColorNames = Object.keys(styles.color);
var backgroundColorNames = Object.keys(styles.bgColor);
var colorNames = [...foregroundColorNames, ...backgroundColorNames];
function assembleStyles() {
  const codes = new Map;
  for (const [groupName, group] of Object.entries(styles)) {
    for (const [styleName, style] of Object.entries(group)) {
      styles[styleName] = {
        open: `\x1B[${style[0]}m`,
        close: `\x1B[${style[1]}m`
      };
      group[styleName] = styles[styleName];
      codes.set(style[0], style[1]);
    }
    Object.defineProperty(styles, groupName, {
      value: group,
      enumerable: false
    });
  }
  Object.defineProperty(styles, "codes", {
    value: codes,
    enumerable: false
  });
  styles.color.close = "\x1B[39m";
  styles.bgColor.close = "\x1B[49m";
  styles.color.ansi = wrapAnsi16();
  styles.color.ansi256 = wrapAnsi256();
  styles.color.ansi16m = wrapAnsi16m();
  styles.bgColor.ansi = wrapAnsi16(ANSI_BACKGROUND_OFFSET);
  styles.bgColor.ansi256 = wrapAnsi256(ANSI_BACKGROUND_OFFSET);
  styles.bgColor.ansi16m = wrapAnsi16m(ANSI_BACKGROUND_OFFSET);
  Object.defineProperties(styles, {
    rgbToAnsi256: {
      value(red, green, blue) {
        if (red === green && green === blue) {
          if (red < 8) {
            return 16;
          }
          if (red > 248) {
            return 231;
          }
          return Math.round((red - 8) / 247 * 24) + 232;
        }
        return 16 + 36 * Math.round(red / 255 * 5) + 6 * Math.round(green / 255 * 5) + Math.round(blue / 255 * 5);
      },
      enumerable: false
    },
    hexToRgb: {
      value(hex) {
        const matches = /[a-f\d]{6}|[a-f\d]{3}/i.exec(hex.toString(16));
        if (!matches) {
          return [0, 0, 0];
        }
        let [colorString] = matches;
        if (colorString.length === 3) {
          colorString = [...colorString].map((character) => character + character).join("");
        }
        const integer = Number.parseInt(colorString, 16);
        return [
          integer >> 16 & 255,
          integer >> 8 & 255,
          integer & 255
        ];
      },
      enumerable: false
    },
    hexToAnsi256: {
      value: (hex) => styles.rgbToAnsi256(...styles.hexToRgb(hex)),
      enumerable: false
    },
    ansi256ToAnsi: {
      value(code) {
        if (code < 8) {
          return 30 + code;
        }
        if (code < 16) {
          return 90 + (code - 8);
        }
        let red;
        let green;
        let blue;
        if (code >= 232) {
          red = ((code - 232) * 10 + 8) / 255;
          green = red;
          blue = red;
        } else {
          code -= 16;
          const remainder = code % 36;
          red = Math.floor(code / 36) / 5;
          green = Math.floor(remainder / 6) / 5;
          blue = remainder % 6 / 5;
        }
        const value = Math.max(red, green, blue) * 2;
        if (value === 0) {
          return 30;
        }
        let result = 30 + (Math.round(blue) << 2 | Math.round(green) << 1 | Math.round(red));
        if (value === 2) {
          result += 60;
        }
        return result;
      },
      enumerable: false
    },
    rgbToAnsi: {
      value: (red, green, blue) => styles.ansi256ToAnsi(styles.rgbToAnsi256(red, green, blue)),
      enumerable: false
    },
    hexToAnsi: {
      value: (hex) => styles.ansi256ToAnsi(styles.hexToAnsi256(hex)),
      enumerable: false
    }
  });
  return styles;
}
var ansiStyles = assembleStyles();
var ansi_styles_default = ansiStyles;

// node_modules/chalk/source/vendor/supports-color/index.js
import process2 from "node:process";
import os from "node:os";
import tty from "node:tty";
function hasFlag(flag, argv = globalThis.Deno ? globalThis.Deno.args : process2.argv) {
  const prefix = flag.startsWith("-") ? "" : flag.length === 1 ? "-" : "--";
  const position = argv.indexOf(prefix + flag);
  const terminatorPosition = argv.indexOf("--");
  return position !== -1 && (terminatorPosition === -1 || position < terminatorPosition);
}
var { env } = process2;
var flagForceColor;
if (hasFlag("no-color") || hasFlag("no-colors") || hasFlag("color=false") || hasFlag("color=never")) {
  flagForceColor = 0;
} else if (hasFlag("color") || hasFlag("colors") || hasFlag("color=true") || hasFlag("color=always")) {
  flagForceColor = 1;
}
function envForceColor() {
  if ("FORCE_COLOR" in env) {
    if (env.FORCE_COLOR === "true") {
      return 1;
    }
    if (env.FORCE_COLOR === "false") {
      return 0;
    }
    return env.FORCE_COLOR.length === 0 ? 1 : Math.min(Number.parseInt(env.FORCE_COLOR, 10), 3);
  }
}
function translateLevel(level) {
  if (level === 0) {
    return false;
  }
  return {
    level,
    hasBasic: true,
    has256: level >= 2,
    has16m: level >= 3
  };
}
function _supportsColor(haveStream, { streamIsTTY, sniffFlags = true } = {}) {
  const noFlagForceColor = envForceColor();
  if (noFlagForceColor !== undefined) {
    flagForceColor = noFlagForceColor;
  }
  const forceColor = sniffFlags ? flagForceColor : noFlagForceColor;
  if (forceColor === 0) {
    return 0;
  }
  if (sniffFlags) {
    if (hasFlag("color=16m") || hasFlag("color=full") || hasFlag("color=truecolor")) {
      return 3;
    }
    if (hasFlag("color=256")) {
      return 2;
    }
  }
  if ("TF_BUILD" in env && "AGENT_NAME" in env) {
    return 1;
  }
  if (haveStream && !streamIsTTY && forceColor === undefined) {
    return 0;
  }
  const min = forceColor || 0;
  if (env.TERM === "dumb") {
    return min;
  }
  if (process2.platform === "win32") {
    const osRelease = os.release().split(".");
    if (Number(osRelease[0]) >= 10 && Number(osRelease[2]) >= 10586) {
      return Number(osRelease[2]) >= 14931 ? 3 : 2;
    }
    return 1;
  }
  if ("CI" in env) {
    if (["GITHUB_ACTIONS", "GITEA_ACTIONS", "CIRCLECI"].some((key) => (key in env))) {
      return 3;
    }
    if (["TRAVIS", "APPVEYOR", "GITLAB_CI", "BUILDKITE", "DRONE"].some((sign) => (sign in env)) || env.CI_NAME === "codeship") {
      return 1;
    }
    return min;
  }
  if ("TEAMCITY_VERSION" in env) {
    return /^(9\.(0*[1-9]\d*)\.|\d{2,}\.)/.test(env.TEAMCITY_VERSION) ? 1 : 0;
  }
  if (env.COLORTERM === "truecolor") {
    return 3;
  }
  if (env.TERM === "xterm-kitty") {
    return 3;
  }
  if (env.TERM === "xterm-ghostty") {
    return 3;
  }
  if (env.TERM === "wezterm") {
    return 3;
  }
  if ("TERM_PROGRAM" in env) {
    const version = Number.parseInt((env.TERM_PROGRAM_VERSION || "").split(".")[0], 10);
    switch (env.TERM_PROGRAM) {
      case "iTerm.app": {
        return version >= 3 ? 3 : 2;
      }
      case "Apple_Terminal": {
        return 2;
      }
    }
  }
  if (/-256(color)?$/i.test(env.TERM)) {
    return 2;
  }
  if (/^screen|^xterm|^vt100|^vt220|^rxvt|color|ansi|cygwin|linux/i.test(env.TERM)) {
    return 1;
  }
  if ("COLORTERM" in env) {
    return 1;
  }
  return min;
}
function createSupportsColor(stream, options = {}) {
  const level = _supportsColor(stream, {
    streamIsTTY: stream && stream.isTTY,
    ...options
  });
  return translateLevel(level);
}
var supportsColor = {
  stdout: createSupportsColor({ isTTY: tty.isatty(1) }),
  stderr: createSupportsColor({ isTTY: tty.isatty(2) })
};
var supports_color_default = supportsColor;

// node_modules/chalk/source/utilities.js
function stringReplaceAll(string, substring, replacer) {
  let index = string.indexOf(substring);
  if (index === -1) {
    return string;
  }
  const substringLength = substring.length;
  let endIndex = 0;
  let returnValue = "";
  do {
    returnValue += string.slice(endIndex, index) + substring + replacer;
    endIndex = index + substringLength;
    index = string.indexOf(substring, endIndex);
  } while (index !== -1);
  returnValue += string.slice(endIndex);
  return returnValue;
}
function stringEncaseCRLFWithFirstIndex(string, prefix, postfix, index) {
  let endIndex = 0;
  let returnValue = "";
  do {
    const gotCR = string[index - 1] === "\r";
    returnValue += string.slice(endIndex, gotCR ? index - 1 : index) + prefix + (gotCR ? `\r
` : `
`) + postfix;
    endIndex = index + 1;
    index = string.indexOf(`
`, endIndex);
  } while (index !== -1);
  returnValue += string.slice(endIndex);
  return returnValue;
}

// node_modules/chalk/source/index.js
var { stdout: stdoutColor, stderr: stderrColor } = supports_color_default;
var GENERATOR = Symbol("GENERATOR");
var STYLER = Symbol("STYLER");
var IS_EMPTY = Symbol("IS_EMPTY");
var levelMapping = [
  "ansi",
  "ansi",
  "ansi256",
  "ansi16m"
];
var styles2 = Object.create(null);
var applyOptions = (object, options = {}) => {
  if (options.level && !(Number.isInteger(options.level) && options.level >= 0 && options.level <= 3)) {
    throw new Error("The `level` option should be an integer from 0 to 3");
  }
  const colorLevel = stdoutColor ? stdoutColor.level : 0;
  object.level = options.level === undefined ? colorLevel : options.level;
};
var chalkFactory = (options) => {
  const chalk = (...strings) => strings.join(" ");
  applyOptions(chalk, options);
  Object.setPrototypeOf(chalk, createChalk.prototype);
  return chalk;
};
function createChalk(options) {
  return chalkFactory(options);
}
Object.setPrototypeOf(createChalk.prototype, Function.prototype);
for (const [styleName, style] of Object.entries(ansi_styles_default)) {
  styles2[styleName] = {
    get() {
      const builder = createBuilder(this, createStyler(style.open, style.close, this[STYLER]), this[IS_EMPTY]);
      Object.defineProperty(this, styleName, { value: builder });
      return builder;
    }
  };
}
styles2.visible = {
  get() {
    const builder = createBuilder(this, this[STYLER], true);
    Object.defineProperty(this, "visible", { value: builder });
    return builder;
  }
};
var getModelAnsi = (model, level, type, ...arguments_) => {
  if (model === "rgb") {
    if (level === "ansi16m") {
      return ansi_styles_default[type].ansi16m(...arguments_);
    }
    if (level === "ansi256") {
      return ansi_styles_default[type].ansi256(ansi_styles_default.rgbToAnsi256(...arguments_));
    }
    return ansi_styles_default[type].ansi(ansi_styles_default.rgbToAnsi(...arguments_));
  }
  if (model === "hex") {
    return getModelAnsi("rgb", level, type, ...ansi_styles_default.hexToRgb(...arguments_));
  }
  return ansi_styles_default[type][model](...arguments_);
};
var usedModels = ["rgb", "hex", "ansi256"];
for (const model of usedModels) {
  styles2[model] = {
    get() {
      const { level } = this;
      return function(...arguments_) {
        const styler = createStyler(getModelAnsi(model, levelMapping[level], "color", ...arguments_), ansi_styles_default.color.close, this[STYLER]);
        return createBuilder(this, styler, this[IS_EMPTY]);
      };
    }
  };
  const bgModel = "bg" + model[0].toUpperCase() + model.slice(1);
  styles2[bgModel] = {
    get() {
      const { level } = this;
      return function(...arguments_) {
        const styler = createStyler(getModelAnsi(model, levelMapping[level], "bgColor", ...arguments_), ansi_styles_default.bgColor.close, this[STYLER]);
        return createBuilder(this, styler, this[IS_EMPTY]);
      };
    }
  };
}
var proto = Object.defineProperties(() => {}, {
  ...styles2,
  level: {
    enumerable: true,
    get() {
      return this[GENERATOR].level;
    },
    set(level) {
      this[GENERATOR].level = level;
    }
  }
});
var createStyler = (open, close, parent) => {
  let openAll;
  let closeAll;
  if (parent === undefined) {
    openAll = open;
    closeAll = close;
  } else {
    openAll = parent.openAll + open;
    closeAll = close + parent.closeAll;
  }
  return {
    open,
    close,
    openAll,
    closeAll,
    parent
  };
};
var createBuilder = (self, _styler, _isEmpty) => {
  const builder = (...arguments_) => applyStyle(builder, arguments_.length === 1 ? "" + arguments_[0] : arguments_.join(" "));
  Object.setPrototypeOf(builder, proto);
  builder[GENERATOR] = self;
  builder[STYLER] = _styler;
  builder[IS_EMPTY] = _isEmpty;
  return builder;
};
var applyStyle = (self, string) => {
  if (self.level <= 0 || !string) {
    return self[IS_EMPTY] ? "" : string;
  }
  let styler = self[STYLER];
  if (styler === undefined) {
    return string;
  }
  const { openAll, closeAll } = styler;
  if (string.includes("\x1B")) {
    while (styler !== undefined) {
      string = stringReplaceAll(string, styler.close, styler.open);
      styler = styler.parent;
    }
  }
  const lfIndex = string.indexOf(`
`);
  if (lfIndex !== -1) {
    string = stringEncaseCRLFWithFirstIndex(string, closeAll, openAll, lfIndex);
  }
  return openAll + string + closeAll;
};
Object.defineProperties(createChalk.prototype, styles2);
var chalk = createChalk();
var chalkStderr = createChalk({ level: stderrColor ? stderrColor.level : 0 });
var source_default = chalk;

// src/libs/crypto.ts
import crypto from "node:crypto";
var ALGORITHM = "aes-256-gcm";
var KEY_LENGTH = 32;
var IV_LENGTH = 12;
var SALT_LENGTH = 16;
var AUTH_TAG_LENGTH = 16;
var PBKDF2_ITERATIONS = 1e5;
var PBKDF2_DIGEST = "sha512";
function deriveKey(password, salt) {
  return crypto.pbkdf2Sync(password, salt, PBKDF2_ITERATIONS, KEY_LENGTH, PBKDF2_DIGEST);
}
function encrypt(plaintext, password) {
  const salt = crypto.randomBytes(SALT_LENGTH);
  const key = deriveKey(password, salt);
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv, {
    authTagLength: AUTH_TAG_LENGTH
  });
  const encryptedData = Buffer.concat([
    cipher.update(plaintext, "utf-8"),
    cipher.final()
  ]);
  const authTag = cipher.getAuthTag();
  const combined = Buffer.concat([salt, iv, authTag, encryptedData]);
  return {
    encrypted: combined.toString("base64"),
    saltHex: salt.toString("hex"),
    ivHex: iv.toString("hex")
  };
}
function decrypt(encryptedBase64, password) {
  const combined = Buffer.from(encryptedBase64, "base64");
  const minLength = SALT_LENGTH + IV_LENGTH + AUTH_TAG_LENGTH;
  if (combined.length < minLength) {
    throw new Error("Invalid encrypted data: insufficient length. " + "The file may be corrupted.");
  }
  let offset = 0;
  const salt = combined.subarray(offset, offset + SALT_LENGTH);
  offset += SALT_LENGTH;
  const iv = combined.subarray(offset, offset + IV_LENGTH);
  offset += IV_LENGTH;
  const authTag = combined.subarray(offset, offset + AUTH_TAG_LENGTH);
  offset += AUTH_TAG_LENGTH;
  const encryptedData = combined.subarray(offset);
  const key = deriveKey(password, salt);
  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv, {
    authTagLength: AUTH_TAG_LENGTH
  });
  decipher.setAuthTag(authTag);
  try {
    const decrypted = Buffer.concat([
      decipher.update(encryptedData),
      decipher.final()
    ]);
    return decrypted.toString("utf-8");
  } catch {
    throw new Error(`Decryption failed. Possible causes:
` + `  • Wrong password
` + `  • Encrypted file has been tampered with or corrupted
` + "  • The file was not encrypted by this program");
  }
}
function getAlgorithmInfo() {
  return {
    algorithm: ALGORITHM,
    keySize: `${KEY_LENGTH * 8} bits`,
    ivSize: `${IV_LENGTH * 8} bits`,
    saltSize: `${SALT_LENGTH * 8} bits`,
    keyDerivation: "PBKDF2",
    pbkdf2Iterations: PBKDF2_ITERATIONS,
    pbkdf2Digest: PBKDF2_DIGEST,
    authTagSize: `${AUTH_TAG_LENGTH * 8} bits`
  };
}
// src/helpers/readline.ts
import readline from "node:readline";
function createRL() {
  return readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });
}
function ask(rl, question) {
  return new Promise((resolve) => {
    rl.question(question, (answer) => resolve(answer.trim()));
  });
}
// src/helpers/ensure-dir.ts
import path from "node:path";
import fs from "node:fs";
function ensureDir(filePath) {
  const dir = path.dirname(filePath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}
// src/commands/encrypts.ts
import fs2 from "node:fs";
async function handleEncrypt(args) {
  const rl = createRL();
  try {
    const inputPath = args.input ?? await ask(rl, source_default.yellow("  \uD83D\uDCC4 Input file path: "));
    if (!fs2.existsSync(inputPath)) {
      console.error(source_default.red(`
  ❌ File not found: ${inputPath}`));
      process.exit(1);
    }
    const plaintext = fs2.readFileSync(inputPath, "utf-8");
    console.log(source_default.dim(`
  File read: ${plaintext.length} characters`));
    const preview = plaintext.substring(0, 200);
    console.log(source_default.dim(`  Preview: "${preview}${plaintext.length > 200 ? "..." : ""}"`));
    const password = args.password ?? await ask(rl, source_default.yellow(`
  \uD83D\uDD11 Enter the encryption password: `));
    if (!password) {
      console.error(source_default.red(`
  ❌ Password cannot be empty.`));
      process.exit(1);
    }
    if (!args.password) {
      const confirm = await ask(rl, source_default.yellow("  \uD83D\uDD11 Confirm password: "));
      if (password !== confirm) {
        console.error(source_default.red(`
  ❌ Passwords do not match.`));
        process.exit(1);
      }
    }
    const defaultOutput = inputPath + ".enc";
    const userOutput = args.output ?? await ask(rl, source_default.yellow(`
  \uD83D\uDCBE Output path [${source_default.dim(defaultOutput)}]: `));
    const outputPath = userOutput || defaultOutput;
    console.log(source_default.cyan(`
  ⏳ Encrypting...`));
    const startTime = performance.now();
    const result = encrypt(plaintext, password);
    const elapsed = (performance.now() - startTime).toFixed(2);
    ensureDir(outputPath);
    fs2.writeFileSync(outputPath, result.encrypted, "utf-8");
    const encSize = Buffer.byteLength(result.encrypted, "utf-8");
    const origSize = Buffer.byteLength(plaintext, "utf-8");
    console.log(source_default.green(`
  ✅ File encrypted successfully!`));
    console.log(source_default.dim(`
  Operation details:`));
    console.log(source_default.dim(`    Original file:      ${inputPath} (${origSize} bytes)`));
    console.log(source_default.dim(`    Encrypted file:     ${outputPath} (${encSize} bytes)`));
    console.log(source_default.dim(`    Salt (hex):         ${result.saltHex}`));
    console.log(source_default.dim(`    IV (hex):           ${result.ivHex}`));
    console.log(source_default.dim(`    Execution time:     ${elapsed} ms`));
    const encPreview = result.encrypted.substring(0, 80);
    console.log(source_default.dim(`    Encrypted preview:  ${encPreview}...`));
    console.log();
  } finally {
    rl.close();
  }
}
// src/script.ts
function printBanner() {
  console.log();
  console.log(source_default.cyan("╔════════════════════════════════════════════════════╗"));
  console.log(source_default.cyan("║") + source_default.bold("   \uD83D\uDD10 Crypto Script — Criptografia AES-256-GCM      ") + source_default.cyan("║"));
  console.log(source_default.cyan("╚════════════════════════════════════════════════════╝"));
  console.log();
}
function printAlgorithmInfo() {
  const info = getAlgorithmInfo();
  console.log(source_default.dim("  Algorithm configuration:"));
  for (const [key, value] of Object.entries(info)) {
    console.log(source_default.dim(`    ${key}: ${value}`));
  }
  console.log();
}
function parseArgs() {
  const argv = process.argv.slice(2);
  const command = argv[0] ?? "help";
  if (!["encrypt", "decrypt", "info", "help"].includes(command)) {
    return { command: "help" };
  }
  const args = { command };
  for (let i = 1;i < argv.length; i++) {
    switch (argv[i]) {
      case "-i":
      case "--input":
        args.input = argv[++i];
        break;
      case "-o":
      case "--output":
        args.output = argv[++i];
        break;
      case "-p":
      case "--password":
        args.password = argv[++i];
        break;
    }
  }
  return args;
}
async function handleDecrypt(args) {
  const rl = createRL();
  try {
    const inputPath = args.input ?? await ask(rl, source_default.yellow("  \uD83D\uDCC4 Path to the encrypted file (.enc): "));
    if (!fs3.existsSync(inputPath)) {
      console.error(source_default.red(`
  ❌ File not found: ${inputPath}`));
      process.exit(1);
    }
    const encryptedContent = fs3.readFileSync(inputPath, "utf-8");
    console.log(source_default.dim(`
  Encrypted file read: ${encryptedContent.length} characters (base64)`));
    const password = args.password ?? await ask(rl, source_default.yellow(`
  \uD83D\uDD11 Enter the decryption password: `));
    if (!password) {
      console.error(source_default.red(`
  ❌ Password cannot be empty.`));
      process.exit(1);
    }
    const defaultOutput = inputPath.replace(/\.enc$/, "") || inputPath + ".dec";
    const userOutput = args.output ?? await ask(rl, source_default.yellow(`
  \uD83D\uDCBE Output path [${defaultOutput}]: `));
    const outputPath = userOutput || defaultOutput;
    console.log(source_default.cyan(`
  ⏳ Decrypting...`));
    const startTime = performance.now();
    let decrypted = "";
    try {
      decrypted = decrypt(encryptedContent, password);
    } catch (err) {
      console.error(source_default.red(`
  ❌ ${err.message}`));
      process.exit(1);
    }
    const elapsed = (performance.now() - startTime).toFixed(2);
    ensureDir(outputPath);
    fs3.writeFileSync(outputPath, decrypted, "utf-8");
    console.log(source_default.green(`
  ✅ File decrypted successfully!`));
    console.log(source_default.dim(`
  Operation details:`));
    console.log(source_default.dim(`    Encrypted file:     ${inputPath}`));
    console.log(source_default.dim(`    Decrypted file:     ${outputPath}`));
    console.log(source_default.dim(`    Recovered size:     ${decrypted.length} characters`));
    console.log(source_default.dim(`    Execution time:     ${elapsed} ms`));
    const preview = decrypted.substring(0, 200);
    console.log(source_default.dim(`    Preview:            "${preview}${decrypted.length > 200 ? "..." : ""}"`));
    console.log();
  } finally {
    rl.close();
  }
}
function handleInfo() {
  printAlgorithmInfo();
}
function printHelp() {
  console.log(source_default.bold("  Usage:"));
  console.log(`    tsx src/script.ts ${source_default.green("<command>")} [options]`);
  console.log();
  console.log(source_default.bold("  Commands:"));
  console.log(`    ${source_default.green("encrypt")}    Encrypt a text file`);
  console.log(`    ${source_default.green("decrypt")}    Decrypt an encrypted file`);
  console.log(`    ${source_default.green("info")}       Show algorithm information`);
  console.log(`    ${source_default.green("help")}       Show this help message`);
  console.log();
  console.log(source_default.bold("  Options:"));
  console.log(`    ${source_default.yellow("-i, --input")}      Input file path`);
  console.log(`    ${source_default.yellow("-o, --output")}     Output file path`);
  console.log(`    ${source_default.yellow("-p, --password")}   Encryption/decryption password`);
  console.log();
  console.log(source_default.bold("  Examples:"));
  console.log(source_default.dim("    # Interactive mode"));
  console.log(`    tsx src/script.ts encrypt`);
  console.log(`    tsx src/script.ts decrypt`);
  console.log();
  console.log(source_default.dim("    # With arguments"));
  console.log(`    tsx src/script.ts encrypt -i document.txt -p mypassword123`);
  console.log(`    tsx src/script.ts decrypt -i document.txt.enc -p mypassword123`);
  console.log();
}
async function main() {
  printBanner();
  const args = parseArgs();
  switch (args.command) {
    case "encrypt":
      await handleEncrypt(args);
      break;
    case "decrypt":
      await handleDecrypt(args);
      break;
    case "info":
      handleInfo();
      break;
    case "help":
    default:
      printHelp();
      break;
  }
}
main().catch((err) => {
  console.error(source_default.red(`
  ❌ Unexpected error: ${err.message}`));
  process.exit(1);
});
