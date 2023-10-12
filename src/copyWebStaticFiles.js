const copyFiles = require('./copyFiles');
const srcDir = './pdfjs_l'; //源文件路径
const destDir = './www/assets/js/pdfjs_l' //目标文件路径

console.log(`开始复制文件${srcDir}到${destDir}`)
copyFiles(srcDir, destDir)
.then(() => {
  console.log("复制文件成功！")
})
.catch(() => {
  console.log("复制文件失败")
})