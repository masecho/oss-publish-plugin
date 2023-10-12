

function getOssClientConfig(publishConfig) {
  const { region, accessKeyId, accessKeySecret, bucket } = publishConfig;
  return {
    // yourRegion填写Bucket所在地域。以华东1（杭州）为例，Region填写为oss-cn-hangzhou。
    region,
    // 阿里云账号AccessKey拥有所有API的访问权限，风险很高。强烈建议您创建并使用RAM用户进行API访问或日常运维，请登录RAM控制台创建RAM用户。
    accessKeyId,
    accessKeySecret,
    bucket
  }
}
function getOssPublishConfig(publishConfig) {
  const { region, accessKeyId, accessKeySecret, bucket, buildDir, publishDir, uploadDir } = publishConfig;
  // 阿里云OSS地区  region   
  // 阿里云OSS存储名称  bucket

  return {
    id: accessKeyId,
    secret: accessKeySecret,
    region,
    bucket,
    entry: buildDir,
    output: '/' + publishDir + uploadDir
  }
}

// 获取根目录的文件
async function getRootFiles(client) {
  const result = await ossListV2(client, { delimiter: '/', "max-keys": 1000 });
  return result
}

async function copyFile(client, name, sourceName) {
  await client.copy(name, sourceName)
}

async function copyFolder(client, dir, source) {

  try {
    const result = await ossList(client, { "max-keys": 1000, prefix: source });
    const length = result.objects.length;

    for (let i = 0; i < length; i++) {
      const { name } = result.objects[i];
      const dirName = source ? name.replace(source, dir) : dir;
      if (!dirName) {
        continue;
      }
      console.log(`**   copyFile:从name（${name}）拷贝到dirName（${dirName}）\n`)
      await copyFile(client, dirName, name);
    }
    // console.log(`拷贝文件夹${source || '根目录'}到${dir || '根目录'}完毕`);
    return true;
  } catch (error) {
    console.log(error);
  }
}

async function ossList(client, options) {
  let marker = null;
  let objects = [];
  let prefixes = [];
  let result = null;
  do {
    result = await client.list({
      marker,
      ...options
    });
    marker = result.nextMarker;
    objects = objects.concat(result.objects);
    prefixes = prefixes.concat(result.prefixes);
  } while (marker)
  result.objects = objects;
  result.prefixes = prefixes;
  return result;
}

async function ossListV2(client, options) {
  let marker = null;
  let objects = [];
  let prefixes = [];
  let result = null;
  do {
    result = await client.listV2({
      marker,
      ...options
    });
    marker = result.nextMarker;
    objects = objects.concat(result.objects);
    prefixes = prefixes.concat(result.prefixes);
  } while (marker)
  result.objects = objects;
  result.prefixes = prefixes;
  return result;
}



async function deleteFolderByName(client, folderName) {
  const result = await ossList(client, { "max-keys": 1000, prefix: folderName });
  const length = result.objects.length;
  for (let i = 0; i < length; i++) {
    const { name } = result.objects[i];
    await client.delete(name);
  }
  return true
}

async function isExistObject(client, name, options = {}) {
  try {
    await client.head(name, options);
    return true
  } catch (error) {
    if (error.code === 'NoSuchKey') {
      return false;
    }
  }
}


module.exports = {
  getOssClientConfig,
  getOssPublishConfig,
  getRootFiles,
  copyFile,
  copyFolder,
  deleteFolderByName,
  isExistObject
}