const { copyFiles } = require("oss-publish-plugin");
const srcDir = './src_dir'; //源文件路径
const destDir = './dest_dir' //目标文件路径

console.log(`开始复制文件${srcDir}到${destDir}`)
copyFiles(srcDir, destDir)
.then(() => {
  console.log("复制文件成功！")
})
.catch(() => {
  console.log("复制文件失败")
})