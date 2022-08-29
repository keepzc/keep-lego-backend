import { Controller } from 'egg';
import sharp from 'sharp';
import Busboy from 'busboy';
import sendToWormhole from 'stream-wormhole';
import { createWriteStream } from 'fs';
import { pipeline } from 'stream/promises';
import { parse, join, extname } from 'path';
import { nanoid } from 'nanoid';
import { FileStream } from '../../typings/app';

export default class UtilsController extends Controller {
  splitIdAndUuid(str = '') {
    const result = { id: '', uuid: '' };
    if (!str) return result;
    const firstDashIndex = str.indexOf('-');
    if (firstDashIndex < 0) return result;
    result.id = str.slice(0, firstDashIndex);
    result.uuid = str.slice(firstDashIndex + 1);
    return result;
  }
  async renderH5Page() {
    const { ctx, service } = this;
    // id-uuid
    const { idAndUuid } = ctx.params;
    const query = this.splitIdAndUuid(idAndUuid);
    console.log(query);
    try {
      const pageData = await service.utils.renderToPageData(query);
      await ctx.render('page.nj', pageData);
    } catch (e) {
      return ctx.helper.error({ ctx, errorType: 'h5WorkNotExistError' });
    }
  }
  // 多文件上传 co-busboy
  async uploadMutipleFiles() {
    const { ctx, app } = this;
    const { fileSize } = app.config.multipart;
    const parts = ctx.multipart({ limits: { fileSize: fileSize as number } });
    // {urls:[zzz,xxx]}
    const urls: string[] = [];
    let part: FileStream | string[];
    while ((part = await parts())) {
      if (Array.isArray(part)) {
        console.log(part);
      } else {
        try {
          const savedFilePath = join(
            'keep-test',
            nanoid(6) + extname(part.filename)
          );
          const result = await ctx.oss.put(savedFilePath, part);
          const { url } = result;
          urls.push(url);
          if (part.truncated) {
            await ctx.oss.delete(savedFilePath);
            return ctx.helper.error({
              ctx,
              errorType: 'imageUploadFileSizeError',
              error: `Reach fileSize limit ${fileSize} bytes`
            });
          }
        } catch (e) {
          console.log(e);
          await sendToWormhole(part);
          ctx.helper.error({ ctx, errorType: 'imageUploadFail' });
        }
      }
    }
    ctx.helper.success({ ctx, res: { urls } });
  }
  async uploadFilesUseBusBoy() {
    const { ctx, app } = this;
    return new Promise<string[]>((resolve) => {
      const busboy = new Busboy({ headers: ctx.req.headers as any });
      const results: string[] = [];
      busboy.on('file', (fieldname, file, filename) => {
        console.log(fieldname, file, filename);
        const uuid = nanoid(6);
        const savedFilePath = join(
          app.config.baseDir,
          'uploads',
          uuid + extname(filename)
        );
        file.pipe(createWriteStream(savedFilePath));
        file.on('end', () => {
          results.push(savedFilePath);
        });
      });
      busboy.on('field', (fieldname, val) => {
        console.log(fieldname, val);
      });
      busboy.on('finish', () => {
        console.log('finished');
        resolve(results);
      });
      ctx.req.pipe(busboy);
    });
  }
  async testBusboy() {
    const { ctx } = this;
    const results = await this.uploadFilesUseBusBoy();
    ctx.helper.success({ ctx, res: results });
  }
  async uploadToOSS() {
    const { ctx } = this;
    const stream = await ctx.getFileStream();
    // lego-backend /keep-test/xxx.png
    const savedOSSPath = join(
      'keep-test',
      nanoid(6) + extname(stream.filename)
    );
    try {
      const result = await ctx.oss.put(savedOSSPath, stream);
      const { name, res } = result;
      ctx.helper.success({ ctx, res: { name, res } });
    } catch (e) {
      // 消费掉stream
      await sendToWormhole(stream, true);
      console.log(e);
      return ctx.helper.error({ ctx, errorType: 'imageUploadFail' });
    }
  }

  async fileLocalUpload() {
    const { ctx } = this;
    const { filepath } = ctx.request.files[0];
    // 生成sharp实例
    const imageSource = sharp(filepath);
    const mateData = await imageSource.metadata();
    let thumbnailUrl = '';
    // 检查图片是否大于300
    if (mateData.width && mateData.width > 300) {
      // generate a new file path
      // /uploads/**/abc.png =》 /uploads/**/abc-thumbnail.png
      const { name, ext, dir } = parse(filepath);
      const thumbnailFilePath = join(dir, `${name}-thumbnail${ext}`);
      await imageSource.resize({ width: 300 }).toFile(thumbnailFilePath);
      thumbnailUrl = this.handleUrl(thumbnailFilePath);
    }
    const url = this.handleUrl(filepath);
    ctx.helper.success({
      ctx,
      res: { url, thumbnailUrl: thumbnailUrl ? thumbnailUrl : url }
    });
  }
  // 处理上传图片返回filePath 系统不兼容方法
  handleUrl(filepath: string) {
    let url = '';
    const { app } = this;
    const result = filepath.replace(app.config.baseDir, app.config.baseUrl);
    const handleResult = result.split('\\');
    if (handleResult.length > 0) {
      url = handleResult.join('/');
    } else {
      url = result;
    }
    return url;
  }
  // 使用stream上传 文件

  async fileUploadByStream() {
    const { ctx, app } = this;
    // 上传文件可读流
    const stream = await ctx.getFileStream();
    // 保存到 uploads/xxx/.ext
    // uploads/xxx_thumbnail.ext
    const uid = nanoid(6);
    const savedFilePath = join(
      app.config.baseDir,
      'uploads',
      uid + extname(stream.filename)
    );
    const savedThumbnailPath = join(
      app.config.baseDir,
      'uploads',
      uid + '_thumbnail' + extname(stream.filename)
    );
    // 可写流 target .. targetThum
    const target = createWriteStream(savedFilePath);
    const targetThum = createWriteStream(savedThumbnailPath);
    const savePromise = pipeline(stream, target);
    // 转化流
    const transformr = sharp().resize({ width: 300 });
    const thumbnailPromise = pipeline(stream, transformr, targetThum);
    // 捕获错误
    try {
      await Promise.all([savePromise, thumbnailPromise]);
    } catch (e) {
      return ctx.helper.error({ ctx, errorType: 'imageUploadFail' });
    }

    ctx.helper.success({
      ctx,
      res: {
        url: this.handleUrl(savedFilePath),
        thumbnailUrl: this.handleUrl(savedThumbnailPath)
      }
    });
  }
}
