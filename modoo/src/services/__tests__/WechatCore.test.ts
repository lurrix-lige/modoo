import { isWechatInstalled, getWechatModule } from '../WechatCore';

jest.mock('react-native', () => ({
  Platform: { OS: 'ios' },
}));

jest.mock('react-native-wechat', () => ({
  isWXAppInstalled: jest.fn(() => true),
}));

describe('WechatCore', () => {
  describe('isWechatInstalled', () => {
    it('should return true when WeChat is installed', () => {
      expect(isWechatInstalled()).toBe(true);
    });
  });

  describe('getWechatModule', () => {
    it('should return WeChat module', () => {
      const module = getWechatModule();
      expect(module).toBeDefined();
      expect(module.isWXAppInstalled).toBeDefined();
    });
  });
});
