# 脚手架

## 问题

1. dep 使用 file://.. 的时候可以通过 pnpm link 链接到本地库

## lib

* `semver` 用来做版本号比对。
* `colors` 控制台颜色
* `root-check` 检查当前是否是 root 账户登录
* `user-home` 获取用户主目录， 可用 `const { homedir } = require("os");` 代替
* `path-exists` 文件是否存在 用 fs 代替
* `minimist` 解析命令参数
* `url-join` url拼接, 用 node url 模块
* `commander` 注册命令
* `pkg-dir` `find-pkg-dir` 找到 node 项目或 npm pkg 的根路径
* `npminstall` 安装依赖

## path

node 版本检查： core/cli/lib/index.tsx (fn checkNodeVersion)

检查 root 启动:  core/cli/lib/index.tsx (fn checkRoot)  

检查命令参数，检查 debug 状态，决定是否 打印 debug 日志

环境变量检查 core/cli/lib/index.tsx (fn checkEnv)  

通用 npm api 模块封装

脚手架全局命令注册，命令注册

---

高性能架构，对 command 进行动态扩展， 每个部门执行的命令可能不一样， @cli/init @cli/my-init ...

`ma-cli init project --targetPath /xxx` : modules/package core/exec utils/format-path

## 暂停去看实战

目前学到 child process 的部分
