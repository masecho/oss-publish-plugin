## oss-publish-plugin 插件主要用作代码的 OSS 发布

### 1.安装

```sh
npm i oss-publish-plugin
yarn add oss-publish-plugin
```

### 2.参数说明

```js
bucket: string -- 阿里云oss的bucket

region：string -- 阿里云oss的region

accessKeyId：string -- 阿里云oss的accessKeyId

accessKeySecret：string -- 阿里云oss的accessKeySecret

buildDir：string -- 本地项目的上传文件夹路径（例如项目打包生成的文件夹dist、build）

backupDir：string -- ali-oss备份文件夹子目录，完整目录为`publishDir + backupDir`。

publishMode：string | string[]  --  支持单个任务，或者多个任务串行进行

 "upload":上传, 将项目本地`buildDir`文件夹上传到ali-oss的`publishDir + uploadDir`文件夹

 "revert":回滚, 将项目ali-oss的`publishDir + backupDir`的文件上传到ali-oss根目录

 "publish":发布, 将项目ali-oss的`publishDir + uploadDir`的文件拷贝到ali-oss的根目录

 "publishBackup":回滚发布, 将项目ali-oss的`publishDir + backupDir`的文件拷贝到ali-oss的根目录
```

例如：

### 3.简单示例

#### 3.1 直接上传

publishMode 为'upload'

上传目录为 publishDir + uploadDir;直接上传到目录

```js
const { publish } = require("oss-publish-plugin");

publish({
  config: {
    bucket: "test-bucket",
    region: "oss-cn-alibaba",
    accessKeyId: "accessKeyId",
    accessKeySecret: "accessKeySecret",
    buildDir: "dist",
    publishDir: "",
    uploadDir: "",
  },
  publishMode: "upload",
});
```

#### 3.2 上传、发布

publishMode 为"upload-publish"

将代码上传到 publishDir + uploadDir

将 uploadDir 的代码拷贝到根目录

```js
const { publish } = require("oss-publish-plugin");
publish({
  config: {
    bucket: "test-bucket",
    region: "oss-cn-alibaba",
    accessKeyId: "accessKeyId",
    accessKeySecret: "accessKeySecret",
    buildDir: "dist",
  },
  publishMode: ["upload", "publish"],
});
```

#### 3.3 上传、发布，带测试生产环境判断

命令带参数

```sh
"publish-test":"node ./upload-publish-env.js --env=test"
"publish-prod":"node ./upload-publish-env.js --env=production"
```

```js
const { publish } = require("oss-publish-plugin");
const minimist = require("minimist");
const paramsMap = minimist(process.argv.slice(2));
const version = paramsMap.version;

const isProduction = paramsMap.env === "production";

publish({
  config: {
    bucket: isProduction ? "prod-bucket" : "test-bucket",
    region: isProduction ? "oss-cn-hangzhou" : "oss-cn-chengdu",
    accessKeyId: "xxxx",
    accessKeySecret: "xxxxx",
  },
  publishMode: ["upload", "publish"],
});
```

### 3.4 默认配置

```js
const publishConfig = {
  bucket: "",
  region: "oss-cn-chengdu",
  accessKeyId: "",
  accessKeySecret: "",
  buildDir: "build",
  publishDir: "__publish/",
  backupDir: "__backup/",
  uploadDir: "__upload/",
};
```
