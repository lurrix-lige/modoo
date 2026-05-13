import { describe, it, expect, beforeEach, vi } from "vitest";
import {
  validateAccount,
  isPhoneFormatValid,
  updateAccountValidationConfig,
  getAccountValidationConfig,
} from "../accountValidationService";

describe("AccountValidationService", () => {
  beforeEach(() => {
    updateAccountValidationConfig({
      enabled: true,
      phonePattern: "^1[3-9]\\d{9}$",
      minPhoneLength: 11,
      maxPhoneLength: 11,
      blockedPrefixes: [],
      blockedPhones: [],
    });
  });

  describe("validateAccount", () => {
    it("should validate correct phone number", async () => {
      const result = await validateAccount("13812345678");
      expect(result).toBe(true);
    });

    it("should throw error for empty phone", async () => {
      await expect(validateAccount("")).rejects.toThrow("手机号不能为空");
    });

    it("should throw error for too short phone", async () => {
      await expect(validateAccount("138123456")).rejects.toThrow("手机号长度不能少于11位");
    });

    it("should throw error for too long phone", async () => {
      await expect(validateAccount("138123456789")).rejects.toThrow("手机号长度不能超过11位");
    });

    it("should throw error for invalid format phone", async () => {
      await expect(validateAccount("12345678901")).rejects.toThrow("请输入正确格式的手机号");
    });

    it("should throw error for blocked prefix", async () => {
      updateAccountValidationConfig({
        blockedPrefixes: ["170"],
      });
      await expect(validateAccount("17012345678")).rejects.toThrow("该手机号段暂不支持注册");
    });

    it("should throw error for blocked phone", async () => {
      updateAccountValidationConfig({
        blockedPhones: ["13912345678"],
      });
      await expect(validateAccount("13912345678")).rejects.toThrow("该手机号已被限制使用");
    });

    it("should skip validation when disabled", async () => {
      updateAccountValidationConfig({ enabled: false });
      const result = await validateAccount("invalid");
      expect(result).toBe(true);
    });
  });

  describe("isPhoneFormatValid", () => {
    it("should return true for valid phone", () => {
      expect(isPhoneFormatValid("13812345678")).toBe(true);
    });

    it("should return false for invalid phone", () => {
      expect(isPhoneFormatValid("12345678901")).toBe(false);
      expect(isPhoneFormatValid("")).toBe(false);
    });
  });

  describe("config management", () => {
    it("should update and get config", () => {
      const newConfig = {
        enabled: false,
        phonePattern: "^\\d+$",
        minPhoneLength: 5,
        maxPhoneLength: 15,
        blockedPrefixes: ["999"],
        blockedPhones: ["12345"],
      };
      updateAccountValidationConfig(newConfig);
      const config = getAccountValidationConfig();
      expect(config).toEqual(expect.objectContaining(newConfig));
    });
  });
});
