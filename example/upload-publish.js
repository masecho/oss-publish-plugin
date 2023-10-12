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