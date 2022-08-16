import { Service } from 'egg';
import { createSSRApp } from 'vue';
import LegoComponents from 'lego-components';
import { renderToString } from '@vue/server-renderer';
export default class UserService extends Service {
  //将 fontSize ==> font-size
  propsToStyle(props = {}) {
    const keys = Object.keys(props);
    const styleArr = keys.map((key) => {
      //fontSize => font-size
      const formatKey = key.replace(
        /[A-Z]/g,
        (c) => `-${c.toLocaleLowerCase()}`
      );
      const value = props[key];
      return `${formatKey}: ${value}`;
    });
    return styleArr.join(';');
  }
  //将px ===> vw 处理样式H5兼容性
  px2vw(components = []) {
    // '10px' '9.5px'
    const reg = /^(\d+(\.\d+)?)px$/;
    components.forEach((component: any = {}) => {
      const props = component.props || {};
      //遍历组件属性
      Object.keys(props).forEach((key) => {
        const val = props[key];
        if (typeof val !== 'string') {
          return;
        }
        //value 中没有px不是距离属性
        if (reg.test(val) === false) {
          return;
        }
        const arr = val.match(reg) || [];
        const numStr = arr[1];
        const num = parseFloat(numStr);
        //计算vw
        //编辑器画布 宽度375
        const vwNum = (num / 375) * 100;
        props[key] = `${vwNum.toFixed(2)}vw`;
      });
    });
  }
  async renderToPageData(query: { id: string; uuid: string }) {
    const { ctx } = this;
    const work = await ctx.model.Work.findOne(query).lean();
    if (!work) {
      throw new Error('work not exsit');
    }
    const { title, content, desc } = work;
    this.px2vw(content && content.components);
    const vueApp = createSSRApp({
      data: () => {
        return {
          components: (content && content.components) || [],
        };
      },
      template: '<final-page :components="components"></final-page>',
    });
    vueApp.use(LegoComponents);
    const html = await renderToString(vueApp);
    const bodyStyle = this.propsToStyle(content && content.props);
    return {
      html,
      title,
      desc,
      bodyStyle,
    };
  }
}
