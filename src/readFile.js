const path = require("path");
const fs = require("fs");

module.exports = function readFileSync(fileDir) {
  const folderPath = path.join(process.cwd(), fileDir);
  const task = []
  readFile(folderPath, (pathstr, stat) => {

    let rltPath = pathstr.replace(folderPath + path.sep, '');
    rltPath = rltPath.split(path.sep).join('/');
    task.push({
      path: pathstr,
      stat,
      rltPath
    })
  });
  return task;
}


function readFile(fileDir, cb) {
  const method = arguments.callee;
  const fileList = fs.readdirSync(fileDir);
  fileList.forEach((name) => {
    const fullPath = path.join(fileDir, name);
    const stat = fs.statSync(fullPath);
    if (stat.isDirectory()) {
      method(fullPath, cb);
    }
    if (stat.isFile()) {
      cb(fullPath, stat);
    }
  });
}
