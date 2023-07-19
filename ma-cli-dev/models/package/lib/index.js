"use strict";

const path = require("path");
const fse = require("fs-extra");
const pkgDir = require("find-pkg-dir");
const npminstall = require("npminstall");

const { isObject } = require("@ma-cli/utils");
const formatPath = require("@ma-cli/format-path");
const {
  getDefaultRegistry,
  getNpmLatestVersion,
} = require("@ma-cli/get-npm-info");
const { existsSync } = require("fs");

class Package {
  constructor(options) {
    if (!options) {
      throw new Error("Package options 参数不能为空！");
    }

    if (!isObject(options)) {
      throw new Error("Package options 必须是对象！");
    }
    // package 的路径
    this.targetPath = options.targetPath;

    // package 的存储路径
    this.storeDir = options.storeDir;

    // package name
    this.packageName = options.packageName;

    // package 版本
    this.packageVersion = options.packageVersion;

    this.cacheFilePathPrefix = this.packageName.replace("/", "_");
  }

  async prepare() {
    if (this.storeDir && !existsSync(this.storeDir)) {
      fse.mkdirpSync(this.storeDir);
    }
    if (this.packageVersion === "latest") {
      this.packageVersion = await getNpmLatestVersion(this.packageName);
    }

    console.log(this.packageVersion);
  }

  get cacheFilePath() {
    return path.resolve(
      this.storeDir,
      `_${this.cacheFilePathPrefix}@${this.packageVersion}@${this.packageName}`
    );
  }

  getSpecificCacheFilePath(packageVersion) {
    return path.resolve(
      this.storeDir,
      `_${this.cacheFilePathPrefix}@${packageVersion}@${this.packageName}`
    );
  }

  // 判断当前 pkg 是否存在
  async exists() {
    if (this.storeDir) {
      await this.prepare();
      console.log("this.cacheFilePath", this.cacheFilePath);
      return existsSync(this.cacheFilePath);
    } else {
      return existsSync(this.targetPath);
    }
  }

  // 安装 pkg
  install() {
    return npminstall({
      root: this.targetPath,
      storeDir: this.storeDir,
      registry: getDefaultRegistry(),
      pkgs: [{ name: this.packageName, version: this.packageVersion }],
    });
  }

  // 更新 pkg
  async update() {
    await this.prepare();
    // 1. 获取最新版本号
    const latestPackageVersion = await getNpmLatestVersion(this.packageName);
    // 2. 查询最新版本号对应的路径是否存在
    const latestFilePath = this.getSpecificCacheFilePath(latestPackageVersion);
    // 3. 如果不存在，则直接安装最新版本
    if (!existsSync(latestFilePath)) {
      await npminstall({
        root: this.targetPath,
        storeDir: this.storeDir,
        registry: getDefaultRegistry(),
        pkgs: [{ name: this.packageName, version: latestPackageVersion }],
      });
      this.packageVersion = latestPackageVersion;
    }
  }

  // 获取入口文件的路径
  getRootFilePath() {
    function _getRootFile(targetPath) {
      // 获取 package.json 所在目录
      const dir = pkgDir(targetPath);
      if (dir) {
        // 读取 pkg.json
        const pkgFile = require(path.resolve(dir, "package.json"));

        // 找 main/lib
        if (pkgFile && pkgFile.main) {
          //  路径兼容 macOS 和 windows
          return formatPath(path.resolve(dir, pkgFile.main));
        }
      }

      return null;
    }

    if (this.storeDir) {
      _getRootFile(this.cacheFilePath);
    } else {
      _getRootFile(this.targetPath);
    }
  }
}

module.exports = Package;
