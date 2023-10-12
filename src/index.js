/* eslint-disable no-case-declarations */
const OSS = require("ali-oss");
const minimist = require("minimist");
const { getOssClientConfig, getRootFiles, copyFolder, copyFile, deleteFolderByName } = require("./ossUtils");
const defaultConfig = require("./config");
const upload = require("./simpleUpload");

const commandParam = process.argv.slice(2);
const paramsMap = minimist(commandParam);
const version = paramsMap.version;

module.exports = async function (options) {
  const config = Object.assign({}, defaultConfig, options.config);
  // 正常发布或是回滚发布
  let actionMode = options.publishMode || paramsMap.publishMode || 'publish';

  const ossOptions = getOssClientConfig(config);
  const client = new OSS(ossOptions);
  const projectName = `项目${ossOptions.bucket}`;
  const actionsOpt = { ...config, client, projectName };
  if (Array.isArray(actionMode)) {
    for (let i = 0; i < actionMode.length; i++) {
      await actionExec(actionMode[i], actionsOpt);
    }
    return;
  }

  if (typeof actionMode === 'string') {
    await actionExec(actionMode, actionsOpt);
  }
}

async function actionExec(actionMode, options) {

  const { version, publishDir } = options;
  let backupVer, backupDir, publishBackupVer, publishBackupDir;

  switch (actionMode) {

    case 'upload':
      await uploadData(options);
      break;

    default:
      await publish(options);
      break;

    case 'revert':
      await revertPublish(options);
      break;

    case 'backup':
      if (!version) {
        console.log('缺少参数版本：version');
        return;
      }
      backupVer = version.toString().replace(/\./g, '_');
      backupDir = publishDir + `__backup_${backupVer}/`;
      await backupRootFiles(client, backupDir, publishDir);
      break;

    case 'publishBackup':
      if (!version) {
        console.log('缺少参数版本：version');
        return;
      }
      publishBackupVer = version.toString().replace(/\./g, '_');
      publishBackupDir = publishDir + `__backup_${publishBackupVer}/`;
      await publishBackupByVersion(client, publishBackupDir, publishDir);
      break;
  }
}



/*******************************************************************************************************
* 
*/
async function uploadData(opt) {
  const { client, projectName, publishDir, backupDir, uploadDir } = opt
  console.log(`**   publish:----- ${projectName} 上传文件开始-----------------------publish start\n`)
  /**清除上传文件夹 ————upload */
  console.log('**   clearUploadDirFiles：----上传文件夹开始清除-----------------------clear upload dir files start\n')
  await deleteFolderByName(client, publishDir + uploadDir);
  console.log('**   clearUploadDirFiles：：-----上传文件夹文件已清除-------------------clear upload dir files Ok\n')
  console.log('**   startUploadFiles：----开始上传本地文件到OSS--------------start upload local files to OSS start\n')

  await upload({ ...opt, uploadDir: publishDir + uploadDir })
}


// 发布代码
async function publish({ client, projectName, publishDir, backupDir, uploadDir }) {
  console.log('***********************************************************************************************\n')
  console.log(`**   publish:-----${projectName}发布开始-----------------------publish start\n`)
  //备份根目录文件
  await backupRootFiles(client, publishDir + backupDir, publishDir);
  //清除根目录的文件
  await clearRootFiles(client, publishDir);
  //拷贝upload的文件到根目录
  await copyUploadFileToRoot(client, '', publishDir + uploadDir);
  console.log(`**   publish:-----${projectName}发布完毕-----------------------publish finish ok\n`)
  console.log('***********************************************************************************************\n')
}

// 回滚代码
async function revertPublish({ client, projectName, publishDir, backupDir }) {
  console.log('***********************************************************************************************\n')
  console.log(`**   revertPublish:-----${projectName}回滚发布开始-----------------------revertPublish start\n`)
  //清除根目录的文件
  await clearRootFiles(client, publishDir);
  console.log('**   -----开始将备份文件拷贝到根目录----------------copy backup file to root start\n')
  await copyFolder(client, '', publishDir + backupDir)
  console.log('**   -----备份文件拷贝到根目录完毕--------------------copy backup file to root Ok\n')
  console.log(`**   revertPublish:-----${projectName}回滚发布完毕-----------------------revertPublish end\n`)
  console.log('***********************************************************************************************\n')
}


async function clearRootFiles(client, publishDir) {
  console.log('**   clearRootFiles：-----根目录文件开始清除-----------------------clear root files start\n')
  const rootDir = await getRootFiles(client);
  const { objects, prefixes } = rootDir;
  const folderNames = (prefixes || []).filter(item => item !== publishDir);
  for (let i = 0; i < folderNames.length; i++) {
    await deleteFolderByName(client, folderNames[i]);
  }
  for (let index = 0; index < objects.length; index++) {
    await client.delete(objects[index].name);
  }
  console.log('**   clearRootFiles：-----根目录文件已清除------------------------------clear root files Ok\n')
  return true;
}

async function copyUploadFileToRoot(client, dir, source) {
  console.log('**   copyUploadFileToRoot：-----开始将上传文件拷贝到根目录----------------copy upload file to root start\n')
  await copyFolder(client, dir, source)
  console.log('**   copyUploadFileToRoot：-----上传文件拷贝到根目录完毕-------------------copy upload file to root Ok\n')
}

async function backupRootFiles(client, backupFullDir, publishDir) {
  console.log(`**   backupRootFiles：----开始将根目录文件备份到${backupFullDir}文件----------copy root files to backup start\n`)
  await deleteFolderByName(client, backupFullDir);
  const rootDir = await getRootFiles(client);
  const { objects, prefixes } = rootDir;
  const folderNames = (prefixes || []).filter(item => item !== publishDir);
  for (let i = 0; i < folderNames.length; i++) {
    await copyFolder(client, backupFullDir + folderNames[i], folderNames[i]);
  }

  for (let index = 0; index < objects.length; index++) {
    console.log(`**   copyFile:从name（${objects[index].name}）拷贝到dirName（${backupFullDir + objects[index].name}）\n`)
    await copyFile(client, backupFullDir + objects[index].name, objects[index].name);
  }
  console.log(`**   backupRootFiles：----根目录文件已备份到${backupFullDir}文件----------------copy root files to backup ok\n`)
  return true;
}

async function publishBackupByVersion(client, dir, publishDir) {

  const result = await client.list({
    // 列举10个文件。
    "max-keys": 10,
    // 列举文件名中包含前缀foo/的文件。
    prefix: dir
  });

  if (!result.objects && !result.objects.length && !result.prefixes && !result.prefixes.length) {
    console.log(`目录${dir}文件夹不存在`);
    return;
  }

  console.log(`**   publishBackupByVersion----开始将根目录文件清除-----------------------------------clear root files start\n`)
  // 清除根目录的文件
  await clearRootFiles(client, publishDir);

  console.log(`**   backupRootFiles：----开始将${dir}文件拷贝到根目录-----------------------------copy backup files to root start\n`)
  //拷贝版本备份文件到根目录
  await copyFolder(client, '', dir)
}

