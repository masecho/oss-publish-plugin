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


// 命令带参数
```
"publish-test":"node ./upload-publish-env.js --env=test"
"publish-prod":"node ./upload-publish-env.js --env=production"
```