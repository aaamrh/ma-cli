"use strict";

module.exports = core;

const { homedir } = require("os");
const fs = require("fs");
const path = require("path");
const semver = require("semver");
const colors = require("colors/safe");
const userHome = require("user-home");
const commander = require("commander");
// const pathExists = require("path-exists").sync;
const log = require("@ma-cli/log");
const init = require("@ma-cli/init");
const exec = require("@ma-cli/exec");

const pkg = require("../package.json");
const { LOWEST_NODE_VERSION, DEFAULT_CLI_HOME } = require("./const");
const { getNpmSemverVersion } = require("@ma-cli/get-npm-info");

let args,
  config,
  userHomeDir = homedir();

const program = new commander.Command();

async function core() {
  try {
    await prepare();
    registerCommand();
  } catch (e) {
    // log.error(e.message);
    if (process.env.LOG_LEVEL === "verbose") {
      // console.log(e);
    }
  }
}

function registerCommand() {
  program
    .name(Object.keys(pkg.bin)[0])
    .usage("<command> [options]")
    .version(pkg.version)
    .option("-d, --debug", "是否开启调试模式", false)
    .option("-tp, --targetPath <targetPath>", "是否指定本地调试文件路径", "");

  program
    .command("init [name]")
    .option("-f --force", "是否强制初始化项目")
    .action(exec);

  program.on("option:debug", function () {
    process.env.LOG_LEVEL = program.debug ? "verbos" : "info";
    log.level = process.env.LOG_LEVEL;
  });

  program.on("option:targetPath", function () {
    process.env.CLI_TARGET_PATH = program._optionValues.targetPath;
  });

  // 对未知命令监听
  program.on("command:*", function (obj) {
    const availableCommands = program.commands.map((cmd) => cmd.name());
    console.log(colors.red("未知的命令：" + obj[0]));
    if (availableCommands.length > 0) {
      console.log(colors.red("有效命令：" + availableCommands.join(",")));
    }
  });

  program.parse(process.argv);
  if (program.args && program.args.length < 1) {
    program.outputHelp();
  }
  // 无法对不存在的命令进行提示，用 args
  // if (process.argv.length < 3) {
  //   program.outputHelp();
  // }
}

async function prepare() {
  checkPkgVersion();
  checkNodeVersion();
  // checkRoot(); // TODO windows 检查权限
  checkUserHome();
  // checkInputArgs(); // 有了 registerCommand ，就不需要再进行参数解析了
  // log.verbose('debug', 'test debug <log></log>')
  checkEnv();
  await checkGlobalUpdate();
}

async function checkGlobalUpdate() {
  // 获取当前版本号和模块名
  const currentVersion = pkg.version;
  const npmName = pkg.name;

  const latestVersions = await getNpmSemverVersion(currentVersion, npmName);
  if (latestVersions && semver.gt(latestVersions, currentVersion)) {
  }
  log.warn(
    colors.yellow(
      "更新提示：",
      `请手动更新 ${npmName}, 当前版本 ${currentVersion}, 最新版本 ${latestVersions}。更新命令： npm i -g ${npmName}`
    )
  );
}

function checkEnv() {
  const dotenv = require("dotenv");
  const dotenvPath = path.resolve(userHomeDir, ".env");
  console.log(dotenvPath);
  if (fs.existsSync(dotenvPath)) {
    // env 中的配置会绑定到 process.env 上
    config = dotenv.config({
      path: dotenvPath,
    });
  }
  createDefaultConfig();
  log.verbose("环境变量", process.env.CLI_HOME_PATH);
}

function createDefaultConfig() {
  const cliConfig = {
    home: userHomeDir,
  };
  if (process.env.CLI_HOME) {
    cliConfig["cliHome"] = path.join(userHomeDir, process.env.CLI_HOME);
  } else {
    cliConfig["cliHome"] = path.join(userHomeDir, DEFAULT_CLI_HOME);
  }

  process.env.CLI_HOME_PATH = cliConfig.cliHome;
}

function checkNodeVersion() {
  const currentVersion = process.version;
  if (!semver.gte(currentVersion, LOWEST_NODE_VERSION)) {
    throw new Error(
      colors.red(
        `ma-cli 需要安装 v${LOWEST_NODE_VERSION} 以上版本的 Node 运行时, 当前版本 ${currentVersion}`
      )
    );
  }
}

function checkInputArgs() {
  const minimist = require("minimist");
  args = minimist(process.argv.slice(2));
  checkArgs();
}

function checkArgs() {
  process.env.LOG_LEVEL = args.debug ? "verbos" : "info";
  log.level = process.env.LOG_LEVEL;
}

function checkUserHome() {
  if (!userHomeDir || !fs.existsSync(userHomeDir)) {
    throw new Error(colors.red("当前用户主目录不存在！"));
  }
}

function checkRoot() {
  console.log(process.geteuid()); // 获取当前登录用户的id
  const rootCheck = require("root-check");
  rootCheck();
  console.log(process.geteuid()); // 获取当前登录用户的id
}

function checkPkgVersion() {
  log.info("cli", pkg.version);
}
