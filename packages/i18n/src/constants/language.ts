/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import type { TLanguage, ILanguageOption } from "../types";

// [CUSTOM] reason: 本 fork 默认面向中文用户，将系统兜底语言由 "en" 改为 "zh-CN"。
// 任何浏览器在没有 localStorage(userLanguage) 时都会落到这里。
export const FALLBACK_LANGUAGE: TLanguage = "zh-CN";

export const SUPPORTED_LANGUAGES: ILanguageOption[] = [
  { label: "English", value: "en" },
  { label: "Français", value: "fr" },
  { label: "Español", value: "es" },
  { label: "日本語", value: "ja" },
  { label: "简体中文", value: "zh-CN" },
  { label: "繁體中文", value: "zh-TW" },
  { label: "Русский", value: "ru" },
  { label: "Italian", value: "it" },
  { label: "Čeština", value: "cs" },
  { label: "Slovenčina", value: "sk" },
  { label: "Deutsch", value: "de" },
  { label: "Українська", value: "ua" },
  { label: "Polski", value: "pl" },
  { label: "한국어", value: "ko" },
  { label: "Português Brasil", value: "pt-BR" },
  { label: "Indonesian", value: "id" },
  { label: "Română", value: "ro" },
  { label: "Tiếng việt", value: "vi-VN" },
  { label: "Türkçe", value: "tr-TR" },
];

/**
 * Enum for translation file names
 * These are the JSON files that contain translations each category
 */
export enum ETranslationFiles {
  TRANSLATIONS = "translations",
  ACCESSIBILITY = "accessibility",
  EDITOR = "editor",
  EMPTY_STATE = "empty-state",
}

export const LANGUAGE_STORAGE_KEY = "userLanguage";
