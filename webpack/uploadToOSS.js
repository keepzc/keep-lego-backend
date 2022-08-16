/* eslint-disable @typescript-eslint/no-var-requires */
const OSS = require('ali-oss');
const path = require('path');
const dotenv = require('dotenv');
const fs = require('fs');
// dotenv 的process.pwd()路径是webpack当前路径找不到.env，所以要指定路径
dotenv.config({ path: path.resolve(__dirname, '../.env') });
const publicPath = path.resolve(__dirname, '../app/public');
// 新建oss实例
const client = new OSS({
  accessKeyId: process.env.ALC_ACCESS_KEY || '',
  accessKeySecret: process.env.ALC_SECRET_KEY || '',
  bucket: 'keep-lego-back',
  endpoint: 'oss-cn-beijing.aliyuncs.com',
  timeout: '60s',
});

async function run() {
  // 从文件夹获取对应文件列表
  const publicFiles = fs.readdirSync(publicPath);
  // eslint-disable-next-line arrow-parens
  const files = publicFiles.filter((f) => f !== 'page.nj');
  const res = await Promise.all(
    // eslint-disable-next-line arrow-parens
    files.map(async (fileName) => {
      const savedOSSPath = path.join('h5-assets', fileName);
      const filePath = path.join(publicPath, fileName);
      const result = await client.put(savedOSSPath, filePath);
      const { url } = result;
      return url;
    })
  );
  console.log('上传成功', res);
}

run();
