
const OSS = require("ali-oss");

const defaultConfig = require("./config");
const readFileSync = require("./readFile");
const { getOssClientConfig } = require("./ossUtils");

module.exports = async function simpleUpload(opts) {

  const conf = Object.assign({}, defaultConfig, opts);
  let { client, buildDir, uploadDir, ...config } = conf;
  if (!client) {
    const ossConfig = getOssClientConfig(config);
    client = new OSS(ossConfig);
  }
  await uploadOss(client, buildDir, uploadDir);
}

async function uploadOss(client, buildDir, uploadDir) {

  if (!buildDir) {
    return Promise.reject(new Error(`参数无效：${buildDir}`))
  }

  const task = readFileSync(buildDir);
  const len = task.length;

  for (let index = 0; index < task.length; index++) {
    const item = task[index]
    const dirPath = uploadDir + item.rltPath;
    await uploadOssFile(client, item.path, dirPath)
    const size = formatBytes(item.stat.size);
    console.log(`**   已上传文件(${index + 1}/${len})：${item.path}  (${size}) =====>  ${dirPath}\n`)
  }
}

async function uploadOssFile(client, src, dist) {
  await client.put(dist, src);
}

function formatBytes(bytes, decimals = 2) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}


