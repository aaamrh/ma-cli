"use strict";

const path = require("path");
const Package = require("@ma-cli/package");
const log = require("@ma-cli/log");

const SETTINGS = {
  init: "@imooc-cli/init",
  // init: "@ma-cli/init",
};

const CACHE_DIR = "dependencies";

async function exec() {
  let targetPath = process.env.CLI_TARGET_PATH;
  const homePath = process.env.CLI_HOME_PATH;
  let storeDir = "";
  let pkg;

  log.verbose("targetPath", targetPath);
  log.verbose("homePath", homePath);

  const cmdObj = arguments[arguments.length - 1];
  const cmdName = cmdObj.name();
  const packageName = SETTINGS[cmdName];
  const packageVersion = "latest";

  if (!targetPath) {
    // 生成缓存路径
    targetPath = path.resolve(homePath, CACHE_DIR);
    storeDir = path.resolve(targetPath, "node_modules");
    // console.log(targetPath, storeDir);

    pkg = new Package({
      targetPath,
      storeDir,
      packageName,
      packageVersion,
    });
    // console.log(pkg);
    // console.log(pkg.getRootFilePath());
    if (await pkg.exists()) {
      // 更新 pkg
      await pkg.update();
    } else {
      // 安装 pkg
      pkg.install();
    }
  } else {
    pkg = new Package({
      targetPath,
      packageName,
      packageVersion,
    });
  }
  const rootFile = pkg.getRootFilePath();
  if (rootFile) {
    require(rootFile).apply(null, arguments);
  }
}

module.exports = exec;
